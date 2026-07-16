import { AgentStrategy, AgentTool, AgentResponse, Citation, UserMemory } from '../types/agent.types';
import prisma from '../../../config/db';
import { removeDiacritics, findFuzzyMatch, cleanGeographicName, extractLastDestinationFromHistory, callAgentLLM, getDynamicRegions, buildCitationsFromDocs, mapTourismToProvince } from '../utils/agent.utils';
import { buildTravelSystemPrompt, buildTravelUserPrompt } from '../prompts/travel.prompts';
import { logger } from '../../../utils/logger';
import { RagPipelineService } from '../../rag/services/rag-pipeline.service';
import { getCuratedProvince } from '../../../config/vietnam_destinations';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function extractStartLocationWithLLM(input: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_key_here') return null;

  const baseURL = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1';
  const modelName = process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini';

  try {
    const LLM_TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS || '30000', 10);
    const response = await fetch(`${baseURL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: `Bạn là trợ lý trích xuất địa danh. Hãy đọc tin nhắn của người dùng và xác định xem họ có đang khai báo vị trí xuất phát hiện tại của họ hay không (Ví dụ: "Tôi ở Cần Thơ", "Mình ở Hà Nội", "Khởi hành từ Sài Gòn",...). 
Nếu có, hãy trả về DUY NHẤT tên Tỉnh/Thành phố đó (Ví dụ: "Cần Thơ", "Hà Nội", "Hồ Chí Minh"). Nếu không khai báo vị trí, trả về chữ "null". Không thêm bất kỳ từ ngữ nào khác.`
          },
          { role: 'user', content: input }
        ],
        temperature: 0.1,
        max_tokens: 50,
      }),
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    });

    if (response.ok) {
      const data = await response.json();
      const result = data.choices[0].message.content.trim();
      return result === 'null' ? null : result;
    }
  } catch (err) {
    console.error('[extractStartLocationWithLLM] Error extracting location:', err);
  }
  return null;
}

export class TravelAgent implements AgentStrategy {
  name = 'TravelAgent';
  description = 'Chuyên gia thiết kế lịch trình, bản đồ di chuyển và thông tin thời tiết.';

  private itineraryTool: AgentTool;
  private mapTool: AgentTool;
  private weatherTool: AgentTool;
  private ragPipeline: RagPipelineService;

  constructor(itineraryTool: AgentTool, mapTool: AgentTool, weatherTool: AgentTool) {
    this.itineraryTool = itineraryTool;
    this.mapTool = mapTool;
    this.weatherTool = weatherTool;
    this.ragPipeline = new RagPipelineService();
  }

  async execute(
    userId: string,
    input: string,
    messageId?: string,
    extractedDestination?: string,
    history?: { role: string; content: string }[],
    memory?: UserMemory
  ): Promise<AgentResponse> {
    console.log(`[TravelAgent] Đang xử lý yêu cầu cho user ${userId}: "${input}" (Extracted: "${extractedDestination}")`);

    // 1. Kiểm tra xem người dùng có đang chủ động cung cấp/khai báo vị trí bắt đầu của họ hay không
    // Chỉ gọi LLM trích xuất khi phát hiện câu có chứa từ khóa chỉ vị trí khởi hành để tránh làm chậm hệ thống
    let declaredStartLoc: string | null = null;
    const cleanInput = removeDiacritics(input.toLowerCase());
    const hasStartLocKeywords = [' o ', ' tai ', ' tu ', ' khoi hanh ', ' xuat phat ', ' di tu '].some(kw => 
      cleanInput.includes(kw) || cleanInput.startsWith(kw.trim() + ' ') || cleanInput.endsWith(' ' + kw.trim()) || cleanInput === kw.trim()
    );
    if (hasStartLocKeywords) {
      declaredStartLoc = await extractStartLocationWithLLM(input);
    }
    if (declaredStartLoc) {
      try {
        const userMapData = await this.mapTool.execute({ query: declaredStartLoc });
        if (userMapData && userMapData.latitude && userMapData.longitude) {
          await prisma.location.upsert({
            where: { userId },
            update: {
              latitude: userMapData.latitude,
              longitude: userMapData.longitude,
              updatedAt: new Date(),
            },
            create: {
              userId,
              latitude: userMapData.latitude,
              longitude: userMapData.longitude,
            },
          });
          console.log(`[TravelAgent] Đã cập nhật/lưu vị trí bắt đầu của người dùng thành: "${declaredStartLoc}" (${userMapData.latitude}, ${userMapData.longitude})`);
        }
      } catch (locErr) {
        console.error('[TravelAgent] Lỗi khi lưu vị trí khai báo của người dùng:', locErr);
      }
    }

    // 2. Phân tích trích xuất thông tin số ngày
    const daysMatch = input.match(/(\d+)\s*ngày/i);
    const days = daysMatch ? parseInt(daysMatch[1]) : 2;

    let destination = 'Hà Nội'; // Mặc định
    let dests = ['Hà Giang', 'Hà Nội', 'Sapa', 'Đà Lạt', 'Đà Nẵng', 'Huế', 'Phú Quốc', 'Vũng Tàu', 'Nha Trang', 'Hạ Long', 'Sài Gòn', 'Cần Thơ'];
    try {
      dests = await getDynamicRegions();
    } catch (dbErr) {
      console.warn('[TravelAgent] Failed to fetch dynamic dests, using fallback list:', dbErr);
    }

    // Thứ tự ưu tiên xác định điểm đến (destination):
    // 1. extractedDestination do LLM Classifier gửi từ trước.
    // 2. Trích xuất bằng mẫu regex từ câu hỏi hiện tại.
    // 3. Trích xuất ngược lịch sử hội thoại gần nhất (nếu câu hỏi hiện tại chỉ khai báo điểm xuất phát hoặc hỏi tiếp nối).
    let targetDestName = extractedDestination;

    if (!targetDestName) {
      const normalized = input.toLowerCase();
      const patterns = [
        /(?:đi|đến|ở|tại|du lịch|chơi ở|phượt)\s+([\p{L}\s]+?)(?:\s+\d+\s*ngày|\s*\?|$|\n)/iu,
        /lịch trình\s+([\p{L}\s]+?)(?:\s+\d+\s*ngày|\?|$|\n)/iu,
        /tour\s+([\p{L}\s]+?)(?:\s+\d+\s*ngày|\?|$|\n)/iu
      ];

      let extracted = '';
      for (const pattern of patterns) {
        const match = normalized.match(pattern);
        if (match && match[1]) {
          extracted = match[1].trim();
          break;
        }
      }

      if (extracted) {
        let clean = extracted.replace(/^(chơi|tham quan|du lịch|nghỉ dưỡng|ở|tại|khám phá)\s+/i, '');
        clean = clean.replace(/\s+(chơi|tham quan|du lịch|nghỉ dưỡng)$/i, '');
        if (clean.length > 1) {
          targetDestName = clean;
        }
      }
    }

    // Nếu câu hỏi hiện tại không chứa điểm đến nhưng có lịch sử, trích xuất từ lịch sử
    if (!targetDestName && history && history.length > 0) {
      targetDestName = extractLastDestinationFromHistory(history, dests) || undefined;
    }

    // Quét trực tiếp địa danh từ câu hỏi để chống lỗi gõ sai từ khóa xung quanh
    if (!targetDestName) {
      const cleanInput = removeDiacritics(input.toLowerCase());
      for (const dest of dests) {
        const cleanDest = removeDiacritics(dest.toLowerCase());
        if (cleanDest.length > 1 && cleanInput.includes(cleanDest)) {
          targetDestName = dest;
          break;
        }
      }
    }

    // Khớp mờ để chuẩn hóa tên địa điểm
    destination = '';
    let hasDestination = false;

    if (targetDestName) {
      const cleanQuery = removeDiacritics(targetDestName.toLowerCase());
      let foundRegion = null;
      for (const dest of dests) {
        const cleanDest = removeDiacritics(dest.toLowerCase());
        const strippedDest = cleanGeographicName(dest);
        
        if (cleanDest.length > 1 && cleanQuery.includes(cleanDest)) {
          foundRegion = dest;
          break;
        }
        if (strippedDest.length > 2 && cleanQuery.includes(strippedDest)) {
          foundRegion = dest;
          break;
        }
      }

      if (foundRegion) {
        destination = foundRegion;
      } else {
        const matched = findFuzzyMatch(targetDestName, dests, 0.7);
        destination = matched || targetDestName;
      }
      
      // Đảm bảo địa danh du lịch phổ biến được map về Tỉnh hành chính
      destination = mapTourismToProvince(destination);
      hasDestination = true;
    }

    // 2. Chạy các Tool bổ trợ và tự động lưu vết ToolCall
    let mapData = null;
    let weatherData = null;
    let itineraryData = null;

    if (hasDestination) {
      // Tool 1: Maps
      const mapInput = { query: destination };
      mapData = await this.mapTool.execute(mapInput);
      if (messageId) {
        await this.saveToolCall(messageId, this.mapTool.name, mapInput, mapData);
      }

      // Tool 2: Weather
      const weatherInput = { location: destination };
      weatherData = await this.weatherTool.execute(weatherInput);
      if (messageId) {
        await this.saveToolCall(messageId, this.weatherTool.name, weatherInput, weatherData);
      }

      // Tool 3: Itinerary
      if (input.toLowerCase().includes('lịch trình') || input.toLowerCase().includes('chuyến đi') || input.toLowerCase().includes('đi chơi')) {
        const itinInput = { destination, days };
        itineraryData = await this.itineraryTool.execute(itinInput);
        if (messageId) {
          await this.saveToolCall(messageId, this.itineraryTool.name, itinInput, itineraryData);
        }
      }
    }

    // 3. Kiểm tra vị trí hiện tại của người dùng từ cơ sở dữ liệu
    const userLocation = await prisma.location.findUnique({
      where: { userId },
    });

    let distanceText = '';
    let userCoordsText = 'Chưa xác định';
    
    if (userLocation && hasDestination && mapData && mapData.latitude && mapData.longitude) {
      userCoordsText = `Vĩ độ ${userLocation.latitude}, Kinh độ ${userLocation.longitude}`;
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        mapData.latitude,
        mapData.longitude
      );
      distanceText = `Khoảng cách từ vị trí hiện tại của người dùng đến điểm đến là ${distance.toFixed(1)} km. Hãy hiển thị khoảng cách này cho người dùng biết.`;
    } else if (!userLocation) {
      distanceText = `Chưa có thông tin vị trí hiện tại của người dùng trong cơ sở dữ liệu. BẮT BUỘC YÊU CẦU: Hãy hỏi người dùng xem họ đang ở đâu (tỉnh/thành phố nào) hoặc nhắc họ cấp quyền truy cập vị trí (GPS) trên ứng dụng để tính toán quãng đường và hướng dẫn lộ trình di chuyển chính xác nhất.`;
    } else {
      distanceText = `Người dùng đã có tọa độ vị trí bắt đầu (${userLocation.latitude}, ${userLocation.longitude}).`;
    }

    // 4. Truy xuất RAG bổ trợ từ database du lịch
    const currentMonth = new Date().getMonth() + 1; // Lấy tháng hiện tại (1 - 12)
    
    // --- RAG PIPELINE: destination + category detection + retrieval + reranking ---
    let localDestinationsText = '';
    let ragContextText = '';
    let hasRagData = false;
    let allRetrievedDocs: any[] = [];

    if (hasDestination) {
      // 1. Load local JSON destinations (fast, no API call)
      try {
        const curated = getCuratedProvince(destination);
        if (curated) {
          const allPlaces = [
            ...curated.attractions,
            ...curated.nature,
            ...curated.restaurants.slice(0, 3),
            ...curated.hotels.slice(0, 2)
          ];
          const top6Places = allPlaces.slice(0, 6);
          if (top6Places.length > 0) {
            localDestinationsText = top6Places.map((p, idx) => 
              `${idx + 1}. **${p.name}** (${p.category === 'attraction' ? 'Điểm tham quan' : p.category === 'nature' ? 'Thiên nhiên' : p.category === 'restaurant' ? 'Ẩm thực' : 'Nơi lưu trú'}): ${p.description || p.address || 'Địa chỉ thực tế tại địa phương.'}`
            ).join('\n');
            hasRagData = true;
          }
        }
      } catch (err) {
        console.warn('[TravelAgent] Failed to load local JSON destinations:', err);
      }

      // 2. Detect category from input keywords
      const cleanInput = input.toLowerCase();
      const hasKeyword = (keywords: string[]) => keywords.some(kw => cleanInput.includes(kw));

      const needsFestival = hasKeyword(['lễ hội', 'festival', 'tháng', 'mùa', 'hội', 'cúng', 'lễ', 'tết', 'kỷ niệm', 'diễn ra', 'nghi lễ', 'hội làng']);
      const needsFood = hasKeyword(['ăn', 'uống', 'đặc sản', 'món', 'ẩm thực', 'quán', 'nhà hàng', 'lẩu', 'bánh', 'kẹo', 'chè', 'hải sản', 'ngon', 'thưởng thức', 'món ăn']);
      const needsCulture = hasKeyword(['văn hóa', 'phong tục', 'tập quán', 'con người', 'đời sống', 'tín ngưỡng', 'tôn giáo', 'nghệ thuật', 'ca nhạc', 'đờn ca', 'chùa', 'nhà thờ', 'đền', 'miếu', 'nếp sống']);
      const needsHistory = hasKeyword(['lịch sử', 'nguồn gốc', 'thời xưa', 'kháng chiến', 'chiến tích', 'bảo tàng', 'di tích', 'cổ kính', 'cổ xưa', 'thành lập', 'tên gọi', 'truyền thuyết', 'sự tích', 'vua', 'cổ xưa']);
      const needsDestination = !needsFestival && !needsFood && !needsCulture && !needsHistory || hasKeyword(['địa điểm', 'điểm', 'cảnh', 'chơi', 'tham quan', 'vị trí', 'ở đâu', 'đường đi', 'di chuyển', 'bản đồ', 'đẹp', 'vịnh', 'đảo', 'núi', 'sông', 'hồ', 'suối', 'thác', 'rừng', 'bãi biển']);

      const targetedCategory = needsFestival ? 'festival' : needsFood ? 'food' : needsCulture ? 'culture' : needsHistory ? 'history' : needsDestination ? 'destination' : undefined;

      // 3. Run unified RAG pipeline
      try {
        const pipelineResult = await this.ragPipeline.execute({
          query: input,
          destination,
          category: targetedCategory,
          topK: 5,
        });
        allRetrievedDocs = pipelineResult.docs;
        ragContextText = pipelineResult.contextText;
        if (pipelineResult.hasData) hasRagData = true;
        logger.info('TravelAgent', 'RAG pipeline result', {
          hasData: pipelineResult.hasData,
          docs: pipelineResult.docs.length,
          dest: pipelineResult.destination,
          cat: pipelineResult.category,
          latencyMs: pipelineResult.metadata.latencyMs,
        });
      } catch (ragErr) {
        console.warn('[TravelAgent] RAG pipeline failed:', ragErr);
      }
    }

    // 5. Xây dựng câu trả lời qua LLM
    try {
      let systemPrompt = '';
      let userPrompt = '';

      if (hasDestination) {
        const isItineraryRequest = /lịch trình|kế hoạch|lộ trình|chuyến đi|tour|lên lịch|lập lịch|đi chơi/i.test(input);

        systemPrompt = buildTravelSystemPrompt({
          destination,
          hasRagData,
          isItineraryRequest,
          currentMonth,
          distanceText,
          userCoordsText,
          memory,
        });

        userPrompt = buildTravelUserPrompt({
          destination,
          currentMonth,
          days,
          userCoordsText,
          mapData,
          weatherData,
          itineraryData,
          localDestinationsText,
          ragContextText,
          input,
        });
      } else {
        systemPrompt = `Bạn là TravelAgent - chuyên gia tư vấn du lịch của SmartTravel.
Người dùng CHƯA chọn hoặc CHƯA cung cấp địa điểm du lịch mong muốn của họ.
Nhiệm vụ của bạn là:
1. Ghi nhận vị trí bắt đầu của họ nếu họ vừa cung cấp (ví dụ: "Tôi đã ghi nhận vị trí của bạn là Cần Thơ"). Nếu họ chưa cung cấp vị trí của mình, hãy lịch sự hỏi họ ở tỉnh/thành nào hoặc hướng dẫn họ cấp quyền định vị.
2. Thân thiện và hào hứng đề xuất một số điểm đến du lịch nổi tiếng từ cơ sở dữ liệu của chúng ta (ví dụ: Hà Giang, Sapa, Đà Lạt, Đà Nẵng, Phú Quốc, Huế, Cần Thơ, Hòn Đá Bạc, v.v.) để khơi gợi cảm hứng cho họ.
3. Hỏi rõ họ muốn đi du lịch ở đâu để bạn tiến hành lên lộ trình di chuyển và lịch trình tham quan chi tiết.

Trả lời bằng tiếng Việt thân thiện, tự nhiên, hào hứng và có cấu trúc tốt.`;

        userPrompt = `Tin nhắn của người dùng: "${input}"
Vị trí khởi hành đã ghi nhận (nếu có): ${declaredStartLoc || (userLocation ? 'Đã có trong hệ thống' : 'Chưa có')}
Danh sách gợi ý điểm đến nổi bật: ${dests.slice(0, 10).join(', ')}`;
      }

      const llmResponse = await callAgentLLM(systemPrompt, userPrompt, history);
      const citations = buildCitationsFromDocs(allRetrievedDocs);
      return { response: llmResponse, citations };
    } catch (err) {
      console.warn('[TravelAgent] LLM call failed, falling back to static template response:', err);
    }

    // Fallback: Phản hồi phân tích từ Agent theo template cũ
    let fallbackResponse = `Chào bạn, dưới đây là thông tin chi tiết và hành trình du lịch tham khảo được thiết kế dành riêng cho bạn:\n\n`;
    if (userLocation) {
      fallbackResponse += `📍 Vị trí khởi hành của bạn đã được ghi nhận tại hệ thống. Bạn vui lòng cho tôi biết địa điểm muốn đi để bắt đầu lên lịch trình nhé!\n`;
    } else {
      fallbackResponse += `📍 Vui lòng cho tôi biết vị trí hiện tại và điểm đến của bạn để tôi lên lịch trình di chuyển chi tiết nhất nhé!\n`;
    }
    return { response: fallbackResponse, citations: [] };
  }

  private async saveToolCall(messageId: string, toolName: string, input: any, output: any) {
    try {
      await prisma.toolCall.create({
        data: {
          messageId,
          toolName,
          input: JSON.stringify(input),
          output: JSON.stringify(output),
          status: 'success',
        },
      });
    } catch (err) {
      console.error('[TravelAgent/saveToolCall]', err);
    }
  }
}
