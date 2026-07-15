import { AgentStrategy, AgentTool, AgentResponse, Citation } from '../types/agent.types';
import prisma from '../../../config/db';
import { removeDiacritics, findFuzzyMatch, cleanGeographicName, extractLastDestinationFromHistory, callAgentLLM, getDynamicRegions, buildCitationsFromDocs, buildRagContextWithRefs } from '../utils/agent.utils';
import { RetrieverService } from '../../rag/services/retriever.service';
import { EmbeddingsService } from '../../rag/services/embeddings.service';
import { VectorStoreService } from '../../rag/services/vector-store.service';
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
      })
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

function filterRagDocs(docs: any[], destName: string): any[] {
  const cleanDest = cleanGeographicName(destName);
  const destNoSpaces = cleanDest.replace(/\s+/g, '');

  return docs.filter(d => {
    const sim = d.similarity !== undefined ? d.similarity : d.score;
    if (sim < 0.75) return false;

    const cleanTitle = removeDiacritics(d.title.toLowerCase()).replace(/\s+/g, '');
    const cleanContent = removeDiacritics(d.content.toLowerCase()).replace(/\s+/g, '');

    if (cleanTitle.includes(destNoSpaces) || cleanContent.includes(destNoSpaces)) {
      return true;
    }

    return false;
  });
}

export class TravelAgent implements AgentStrategy {
  name = 'TravelAgent';
  description = 'Chuyên gia thiết kế lịch trình, bản đồ di chuyển và thông tin thời tiết.';

  private itineraryTool: AgentTool;
  private mapTool: AgentTool;
  private weatherTool: AgentTool;
  private retriever: RetrieverService;

  constructor(itineraryTool: AgentTool, mapTool: AgentTool, weatherTool: AgentTool) {
    this.itineraryTool = itineraryTool;
    this.mapTool = mapTool;
    this.weatherTool = weatherTool;
    this.retriever = new RetrieverService(new EmbeddingsService(), new VectorStoreService());
  }

  async execute(
    userId: string,
    input: string,
    messageId?: string,
    extractedDestination?: string,
    history?: { role: string; content: string }[]
  ): Promise<AgentResponse> {
    console.log(`[TravelAgent] Đang xử lý yêu cầu cho user ${userId}: "${input}" (Extracted: "${extractedDestination}")`);

    // 1. Kiểm tra xem người dùng có đang chủ động cung cấp/khai báo vị trí bắt đầu của họ hay không
    const declaredStartLoc = await extractStartLocationWithLLM(input);
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
    
    // --- OPTIMIZED RAG PIPELINE: Consolidated from 6 calls to 1-2 targeted calls ---
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

      const cleanInput = input.toLowerCase();
      const hasKeyword = (keywords: string[]) => keywords.some(kw => cleanInput.includes(kw));

      const needsFestival = hasKeyword(['lễ hội', 'festival', 'tháng', 'mùa', 'hội', 'cúng', 'lễ', 'tết', 'kỷ niệm', 'diễn ra', 'nghi lễ', 'hội làng']);
      const needsFood = hasKeyword(['ăn', 'uống', 'đặc sản', 'món', 'ẩm thực', 'quán', 'nhà hàng', 'lẩu', 'bánh', 'kẹo', 'chè', 'hải sản', 'ngon', 'thưởng thức', 'món ăn']);
      const needsCulture = hasKeyword(['văn hóa', 'phong tục', 'tập quán', 'con người', 'đời sống', 'tín ngưỡng', 'tôn giáo', 'nghệ thuật', 'ca nhạc', 'đờn ca', 'chùa', 'nhà thờ', 'đền', 'miếu', 'nếp sống']);
      const needsHistory = hasKeyword(['lịch sử', 'nguồn gốc', 'thời xưa', 'kháng chiến', 'chiến tích', 'bảo tàng', 'di tích', 'cổ kính', 'cổ xưa', 'thành lập', 'tên gọi', 'truyền thuyết', 'sự tích', 'vua', 'cổ xưa']);
      const needsDestination = !needsFestival && !needsFood && !needsCulture && !needsHistory || hasKeyword(['địa điểm', 'điểm', 'cảnh', 'chơi', 'tham quan', 'vị trí', 'ở đâu', 'đường đi', 'di chuyển', 'bản đồ', 'đẹp', 'vịnh', 'đảo', 'núi', 'sông', 'hồ', 'suối', 'thác', 'rừng', 'bãi biển']);

      // 2. Optimized: Always do 1 general RAG call (topK=4 for broad coverage)
      //    Then 1 targeted call if specific category keywords match
      const targetedCategory = needsFestival ? 'festival' : needsFood ? 'food' : needsCulture ? 'culture' : needsHistory ? 'history' : needsDestination ? 'destination' : undefined;
      
      try {
        // Primary: General broad retrieval (covers everything)
        const generalDocs = await this.retriever.retrieve(`${destination} ${input}`, undefined, 4);
        const filteredGeneral = filterRagDocs(generalDocs, destination);
        allRetrievedDocs = [...filteredGeneral];
        
        // Secondary: Targeted category retrieval (if specific topic detected)
        let targetedDocs: any[] = [];
        if (targetedCategory && targetedCategory !== 'destination') {
          try {
            targetedDocs = await this.retriever.retrieve(`${destination} ${input}`, targetedCategory as any, 3);
            const filteredTargeted = filterRagDocs(targetedDocs, destination);
            allRetrievedDocs = [...allRetrievedDocs, ...filteredTargeted];
          } catch (e) {
            console.warn('[TravelAgent] Targeted RAG retrieval failed:', e);
          }
        }
        
        if (allRetrievedDocs.length > 0) hasRagData = true;
        ragContextText = buildRagContextWithRefs(allRetrievedDocs);
      } catch (ragErr) {
        console.warn('[TravelAgent] Primary RAG retrieval failed:', ragErr);
      }
    }

    // 5. Xây dựng câu trả lời qua LLM
    try {
      let systemPrompt = '';
      let userPrompt = '';

      if (hasDestination) {
        const antiHallucinationRule = hasRagData
          ? `Trong các đề xuất tham quan, vui chơi, ăn uống, bạn CHỈ ĐƯỢC PHÉP nêu các địa điểm cụ thể, món ăn ẩm thực và hoạt động thực tế có tên xuất hiện trong các tài liệu tri thức cung cấp dưới đây (RAG Context). Tuyệt đối không tự ý bịa đặt ra các hoạt động không có thật hoặc địa danh ảo (ví dụ: Cà Mau hoàn toàn không có núi. Bạn tuyệt đối không được tự ý giới thiệu leo núi, leo đỉnh núi mây hay các hòn đảo giả tại Cà Mau). Hãy tôn trọng tính chân thực địa lý và ẩm thực của các tỉnh thành Việt Nam.`
          : `LƯU Ý QUAN TRỌNG VỀ PHÒNG CHỐNG ĐÁP ÁN ẢO (RÂU ÔNG NỌ CẮM CẰM BÀ KIA): Hiện tại cơ sở dữ liệu SmartTravel của chúng ta CHƯA CÓ tài liệu tri thức chính thức cho tỉnh/thành phố "${destination}". Bạn ĐƯỢC PHÉP sử dụng kiến thức chung (General Knowledge) thực tế, chính xác 100% của mình để gợi ý các địa điểm du lịch, vui chơi, ẩm thực và nếp sống thực tế ở "${destination}". 
TUYỆT ĐỐI CẤM: Không được tự ý gán ghép đặc sản của địa phương khác vào địa phương này (Ví dụ: Gỏi cá trích là đặc sản nổi tiếng của Phú Quốc/Kiên Giang, Bún sứa là đặc sản của Nha Trang/Khánh Hòa - TUYỆT ĐỐI KHÔNG ĐƯỢC giới thiệu chúng là đặc sản của Cần Thơ!). Hãy thông báo nhẹ cho người dùng biết đây là thông tin gợi ý tham khảo từ AI do hệ thống chưa có dữ liệu chính thức cho địa phương này. Tuyệt đối không bịa đặt các địa danh không có thật.`;

        const isItineraryRequest = /lịch trình|kế hoạch|lộ trình|chuyến đi|tour|lên lịch|lập lịch|đi chơi/i.test(input);

        if (isItineraryRequest) {
          systemPrompt = `Bạn là TravelAgent - chuyên gia thiết kế lịch trình du lịch Việt Nam của SmartTravel. 
Nhiệm vụ của bạn là dựa trên thông tin bản đồ, thời tiết hiện tại, khung lịch trình cơ bản và các tài liệu tri thức bổ trợ (RAG Context) để tư vấn lộ trình và di chuyển chi tiết, khoa học (phân chia sáng, trưa, chiều, tối) và cung cấp các lời khuyên thời tiết thực tế hữu ích cho người dùng.

QUY TẮC GIỚI THIỆU ĐỊA ĐIỂM (BẮT BUỘC):
Nếu người dùng nói hoặc đề cập đến tỉnh/thành phố "${destination}", bạn BẮT BUỘC phải giới thiệu đầy đủ khoảng 5-6 địa điểm du lịch, tham quan thực tế nổi bật nhất của địa phương đó dựa trên danh sách địa điểm thực tế được cung cấp dưới đây. Hãy mô tả sinh động và ngắn gọn từng địa điểm.

CẤU TRÚC LỊCH TRÌNH BẮT BUỘC (MANDATORY ITINERARY STRUCTURE):
1. Tổng quan
- Điểm xuất phát: [Tên tỉnh/thành phố xuất phát của người dùng thực tế, nếu chưa xác định thì ghi "Chưa xác định - Vui lòng cung cấp vị trí"]
- Điểm kết thúc: [Tên địa điểm du lịch]
- Quãng đường: [Tính toán quãng đường thực tế hoặc ghi khoảng cách di chuyển từ vị trí hiện tại đến điểm đến nếu có dữ liệu, ví dụ: 300 km. Nếu chưa có, ghi "Chưa xác định"]
- Thời gian di chuyển dự kiến: [Ước tính thời gian di chuyển phù hợp, ví dụ: 6 tiếng bằng ô tô / 2 tiếng bằng máy bay...]
- Phương tiện: [Đề xuất phương tiện di chuyển phù hợp, ví dụ: xe khách giường nằm, xe máy, máy bay...]

2. Buổi sáng
- Thời gian: [Thời gian cụ thể, ví dụ: 08:00 - 11:30]
- Hoạt động: [Tên hoạt động chính]
- Địa điểm tham quan: [Tên địa điểm cụ thể]
- Thời gian tham quan: [Thời lượng lưu lại, ví dụ: 2 tiếng]
- Gợi ý trải nghiệm: [Mẹo tham quan, góc check-in đẹp hoặc trải nghiệm hay ho]
- Chi phí (nếu có): [Chi phí dự kiến bằng tiền VND hoặc ghi "Miễn phí"]

3. Ăn sáng (nếu chưa ăn)
- Món ăn: [Tên món ăn sáng đặc sắc địa phương]
- Quán gợi ý (nếu có): [Tên quán ăn ngon cụ thể]

4. Buổi trưa
- Ăn trưa: [Thưởng thức ẩm thực buổi trưa]
- Món đặc sản: [Danh sách món đặc sản địa phương khuyên thử]
- Thời gian nghỉ ngơi: [Thời gian nghỉ ngơi dự kiến, ví dụ: 12:00 - 13:30]

5. Buổi chiều
- Thời gian: [Thời gian cụ thể, ví dụ: 14:00 - 17:30]
- Địa điểm tham quan: [Tên địa điểm cụ thể]
- Hoạt động: [Mô tả hoạt động khám phá]
- Thời gian lưu lại: [Thời lượng lưu lại, ví dụ: 3 tiếng]
- Chi phí (nếu có): [Chi phí dự kiến]

6. Buổi tối
- Ăn tối: [Món ngon và quán gợi ý]
- Địa điểm dạo chơi: [Nơi vui chơi, đi dạo tối]
- Chợ đêm: [Gợi ý chợ đêm địa phương nếu có]
- Café: [Đề xuất quán cà phê ngon hoặc có view đẹp]
- Hoạt động giải trí: [Hoạt động giải trí buổi tối nếu có]
- Nghỉ đêm ở đâu: [Khách sạn, homestay hoặc resort qua đêm]

7. Gợi ý trong ngày
- Mẹo tham quan: [Mẹo di chuyển, chụp ảnh, phong tục địa phương...]
- Trang phục phù hợp: [Trang phục phù hợp với khí hậu và địa điểm]
- Lưu ý an toàn: [Cảnh báo an toàn, đường đèo hiểm trở, lừa đảo nếu có...]
- Những thứ nên mang theo: [Đồ vật cá nhân thiết yếu, ví dụ: kem chống nắng, ô, giày thể thao...]

8. Chi phí dự kiến
- Ăn uống: [Tổng tiền ăn uống dự kiến]
- Vé tham quan: [Tổng tiền vé tham quan]
- Di chuyển: [Chi phí di chuyển dự kiến]
- Khác: [Chi phí mua sắm quà, dự phòng...]
- Tổng: [Tổng chi phí ước tính cho chuyến đi]

LƯU Ý QUAN TRỌNG VỀ ĐỊA ĐIỂM & KHOẢNG CÁCH:
1. Thông tin khoảng cách: ${distanceText}
2. Nếu chưa biết vị trí của người dùng, bạn BẮT BUỘC phải hỏi họ vị trí hiện tại ở đầu hoặc cuối câu trả lời (Ví dụ: "Để hướng dẫn lộ trình và tính khoảng cách chính xác, bạn có thể cho biết mình đang ở đâu không?").
3. Nếu đã có khoảng cách, hãy thông báo cụ thể cho người dùng (ví dụ: "Từ vị trí hiện tại của bạn đến [Điểm đến] khoảng [X] km...").
4. Tuyệt đối không tự ý giả định vị trí khởi hành của người dùng (ví dụ: không mặc định họ đi từ Hà Nội hay Sài Gòn) nếu không có dữ liệu thực tế.

LƯU Ý VỀ THỜI GIAN & LỄ HỘI:
1. Hiện tại đang là Tháng ${currentMonth}.
2. Dựa trên tài liệu lễ hội cung cấp dưới đây, hãy kiểm tra xem trong Tháng ${currentMonth} địa điểm này có lễ hội gì đặc sắc hay sự kiện nổi bật nào không và chủ động gợi ý cho người dùng tham gia hoặc lưu ý.

LƯU Ý VỀ ĐỊA ĐIỂM THAM QUAN, ẨM THỰC, VĂN HÓA & LỊCH SỬ (ANTI-HALLUCINATION):
${antiHallucinationRule}

Trả lời bằng tiếng Việt thân thiện, rõ ràng, rành mạch và có cấu trúc tốt.`;
        } else {
          systemPrompt = `Bạn là TravelAgent - trợ lý chatbot tư vấn du lịch Việt Nam của SmartTravel.
Nhiệm vụ của bạn là giải đáp các câu hỏi, tư vấn thông tin du lịch và giới thiệu các địa danh nổi bật cho người dùng một cách tự nhiên, thân thiện.

QUY TẮC GIỚI THIỆU ĐỊA ĐIỂM (BẮT BUỘC):
Khi người dùng đề cập đến hoặc hỏi về tỉnh/thành phố "${destination}" (ví dụ: "du lịch Bắc Ninh", "Cần Thơ có gì chơi", "Cà Mau"...), bạn BẮT BUỘC phải:
1. Giới thiệu tổng quan ngắn gọn về địa phương này.
2. Liệt kê và giới thiệu đầy đủ khoảng 5-6 địa điểm du lịch, tham quan thực tế nổi bật nhất từ danh sách địa điểm local được cung cấp dưới đây. Hãy nêu rõ tên địa điểm, danh mục (Ví dụ: Điểm tham quan, Thiên nhiên, Ẩm thực...) và mô tả ngắn gọn sinh động của từng nơi.
3. Tuyệt đối KHÔNG trả về lịch trình phân chia theo thời gian sáng/trưa/chiều/tối hay cấu trúc "Tổng quan", "Buổi sáng", "Ăn sáng", "Buổi trưa", "Buổi chiều", "Buổi tối" trừ khi người dùng yêu cầu lập lịch trình cụ thể.

LƯU Ý VỀ ĐỊA ĐIỂM THAM QUAN, ẨM THỰC, VĂN HÓA & LỊCH SỬ (ANTI-HALLUCINATION):
${antiHallucinationRule}

Trả lời bằng tiếng Việt thân thiện, tự nhiên, rõ ràng, rành mạch và có cấu trúc tốt.`;
        }

        userPrompt = `Điểm đến: ${destination}
Tháng hiện tại: Tháng ${currentMonth}
Số ngày: ${days}
Vị trí người dùng: ${userCoordsText}
Thông tin bản đồ (Map): ${JSON.stringify(mapData)}
Thông tin thời tiết (Weather): ${JSON.stringify(weatherData)}
Khung lịch trình thô (Itinerary): ${itineraryData ? JSON.stringify(itineraryData) : 'Không yêu cầu chi tiết lịch trình'}

DANH SÁCH ĐỊA ĐIỂM THỰC TẾ LOCAL (ƯU TIÊN GIỚI THIỆU HÀNG ĐẦU):
${localDestinationsText || 'Không tìm thấy danh sách địa điểm local.'}

TÀI LIỆU TRI THỨC (Có đánh số nguồn - hãy tham chiếu với [số] trong câu trả lời của bạn):
${ragContextText || 'Không tìm thấy tài liệu liên quan.'}

Câu hỏi/Yêu cầu của người dùng: "${input}"`;
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
