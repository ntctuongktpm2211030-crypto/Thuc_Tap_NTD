import { AgentStrategy, AgentType } from '../types/agent.types';
import { TravelAgent } from '../strategies/travel.agent';
import { AddressService } from './address-service';
import { FoodAgent } from '../strategies/food.agent';
import { CultureAgent } from '../strategies/culture.agent';
import { RecommendationAgent } from '../strategies/recommendation.agent';
import {
  MapTool,
  WeatherTool,
  FoodTool,
  CultureTool,
  RecommendationTool,
  ItineraryTool,
} from '../tools/agent.tools';
import { removeDiacritics, classifyIntentWithLLM, cleanGeographicName, getDynamicRegions, findBestBleuMatch } from '../utils/agent.utils';
import prisma from '../../../config/db';
import { RetrieverService } from '../../rag/services/retriever.service';
import { EmbeddingsService } from '../../rag/services/embeddings.service';
import { VectorStoreService } from '../../rag/services/vector-store.service';

export class AgentExecutorService {
  private strategies: Record<Exclude<AgentType, 'unknown'>, AgentStrategy>;
  private addressService = new AddressService();

  constructor() {
    // ─── Dependency Injection ───
    // 1. Khởi tạo các Tool
    const mapTool = new MapTool();
    const weatherTool = new WeatherTool();
    const foodTool = new FoodTool();
    const cultureTool = new CultureTool();
    const recommendationTool = new RecommendationTool();
    const itineraryTool = new ItineraryTool();

    // 2. Inject các Tool vào các Agent Strategy tương ứng
    this.strategies = {
      travel: new TravelAgent(itineraryTool, mapTool, weatherTool),
      food: new FoodAgent(foodTool),
      culture: new CultureAgent(cultureTool),
      recommendation: new RecommendationAgent(recommendationTool),
    };
  }

  async execute(
    userId: string,
    input: string,
    agentType?: AgentType,
    messageId?: string,
    history?: { role: string; content: string }[]
  ): Promise<{ response: string; agentUsed: string }> {
    let selectedType = agentType;
    let extractedDestination: string | undefined = undefined;

    // Tự động phân loại (Natural Language Routing) sử dụng LLM nếu không có agentType chỉ định
    if (!selectedType) {
      try {
        const result = await classifyIntentWithLLM(input);
        selectedType = result.intent;
        if (result.destination) {
          extractedDestination = result.destination;

          // 1. Đầu tiên, tra cứu địa danh chuẩn hóa qua vietnamadminunits
          let adminUnit = null;
          try {
            adminUnit = await this.addressService.parseAddress(result.destination);
          } catch (err) {
            console.warn('[AgentExecutor] Failed to parse address via AddressService:', err);
          }

          let matched: string | undefined = undefined;

          if (adminUnit) {
            console.log(`[AgentExecutor] Resolved via vietnamadminunits: "${result.destination}" -> Province: "${adminUnit.province}", short: "${adminUnit.short_province}"`);
            
            // Ánh xạ địa danh hành chính chuẩn sang địa danh du lịch trong CSDL nếu có
            const dbRegionMap: { [key: string]: string } = {
              'ho chi minh': 'Sài Gòn',
              'kien giang': 'Phú Quốc',
              'khanh hoa': 'Nha Trang',
              'quang ninh': 'Hạ Long',
              'lao cai': 'Sapa',
              'thua thien hue': 'Huế',
              'ba ria - vung tau': 'Vũng Tàu'
            };

            const cleanShortProvince = removeDiacritics(adminUnit.short_province.toLowerCase());
            const mappedRegion = dbRegionMap[cleanShortProvince];

            if (mappedRegion) {
              matched = mappedRegion;
            } else {
              // Tìm xem trong DB du lịch có khớp với short_province không
              let dbDests: string[] = [];
              try {
                dbDests = await getDynamicRegions();
              } catch (_) {}

              const cleanProv = removeDiacritics(adminUnit.short_province.toLowerCase());
              matched = dbDests.find(d => {
                const cleanDb = removeDiacritics(d.toLowerCase());
                const strippedDb = cleanGeographicName(d);
                return cleanDb === cleanProv || strippedDb === cleanProv || cleanProv.includes(cleanDb) || cleanDb.includes(cleanProv);
              });

              if (!matched) {
                // Nếu chưa có dữ liệu chính thức, giữ nguyên địa danh chuẩn hóa để chạy qua General Knowledge của AI
                matched = adminUnit.short_province;
              }
            }
          }

          // 2. Dự phòng: Nếu vietnamadminunits không nhận diện được, so khớp theo giải thuật cũ
          if (!matched) {
            let dbDests: string[] = [];
            try {
              dbDests = await getDynamicRegions();
            } catch (_) {}

            if (dbDests.length > 0) {
              const cleanDest = removeDiacritics(result.destination.toLowerCase());
              
              // Ưu tiên 1: Khớp chính xác hoàn toàn (sau khi bỏ dấu)
              matched = dbDests.find(d => {
                const cleanDb = removeDiacritics(d.toLowerCase());
                return cleanDb === cleanDest;
              });

              // Ưu tiên 2: Khớp chính xác sau khi đã bóc tách tiền tố địa lý
              if (!matched) {
                matched = dbDests.find(d => {
                  const strippedDb = cleanGeographicName(d);
                  return cleanDest === strippedDb;
                });
              }

              // Ưu tiên 3: So khớp chứa (substring)
              if (!matched && cleanDest.length > 2) {
                matched = dbDests.find(d => {
                  const cleanDb = removeDiacritics(d.toLowerCase());
                  const strippedDb = cleanGeographicName(d);
                  return cleanDest.includes(cleanDb) || cleanDb.includes(cleanDest) || cleanDest.includes(strippedDb);
                });
              }

              // Ưu tiên 4: Dự phòng quét trực tiếp trong câu hỏi gốc của user
              if (!matched) {
                const cleanInput = removeDiacritics(input.toLowerCase());
                matched = dbDests.find(d => {
                  const cleanDb = removeDiacritics(d.toLowerCase());
                  const strippedDb = cleanGeographicName(d);
                  return cleanInput === cleanDb || cleanInput.includes(cleanDb) || cleanInput.includes(strippedDb);
                });
              }
            }
          }

          if (matched) {
            extractedDestination = matched;
          }

          // Kiểm tra tính thực tế của địa điểm bằng MapTool (Geocoding API check)
          const mapTool = new MapTool();
          const checkMap = await mapTool.execute({ query: extractedDestination });
          if (checkMap.status === 'failed') {
            console.log(`[AgentExecutor] Destination validation failed for: "${extractedDestination}"`);
            return {
              response: `Tôi chưa hiểu rõ địa điểm "**${extractedDestination}**" hoặc địa điểm này không tồn tại thực tế. Bạn có thể nói rõ hơn hoặc nhập một địa điểm khác được không?`,
              agentUsed: 'System-Clarification',
            };
          }
        }
        console.log(`[AgentExecutor] LLM Classifier result -> Intent: "${selectedType}", Destination: "${extractedDestination}"`);
      } catch (err) {
        console.warn('[AgentExecutor] LLM Classifier failed, falling back to regex router:', err);
        selectedType = this.routeRequest(input);
      }
    }

    // Xử lý ý định không xác định (Unknown Intent Fallback)
    if (selectedType === 'unknown') {
      return {
        response: 'Tôi chưa hiểu rõ ý của bạn lắm. Bạn có thể nói rõ hơn hoặc mô tả chi tiết hơn yêu cầu của mình được không?',
        agentUsed: 'System-Clarification',
      };
    }

    const agent = this.strategies[selectedType];
    if (!agent) {
      throw new Error(`Không tìm thấy agent xử lý phù hợp cho loại: ${selectedType}`);
    }

    // ─── BLEU SCORE EXACT MATCH VERIFICATION ───
    try {
      const retriever = new RetrieverService(new EmbeddingsService(), new VectorStoreService());
      const queryRegion = extractedDestination || '';
      
      let categoryFilter: any = undefined;
      if (selectedType === 'food') categoryFilter = 'food';
      else if (selectedType === 'culture') categoryFilter = 'culture';
      else if (selectedType === 'recommendation') categoryFilter = 'destination';
      
      const searchTerms = queryRegion ? `${queryRegion} ${input}` : input;
      const ragDocs = await retriever.retrieve(searchTerms, categoryFilter, 4);
      
      let filteredDocs = ragDocs;
      if (queryRegion) {
        const cleanDest = removeDiacritics(queryRegion.toLowerCase().trim()).replace(/\s+/g, '');
        filteredDocs = ragDocs.filter(d => {
          const cleanTitle = removeDiacritics(d.title.toLowerCase()).replace(/\s+/g, '');
          const cleanContent = removeDiacritics(d.content.toLowerCase()).replace(/\s+/g, '');
          return cleanTitle.includes(cleanDest) || cleanContent.includes(cleanDest);
        });
      }

      const bleuMatch = await findBestBleuMatch(input, filteredDocs);
      if (bleuMatch && bleuMatch.score >= 0.75) {
        console.log(`[AgentExecutor] BLEU score exact match found: ${bleuMatch.score.toFixed(2)}. Bypassing LLM.`);
        return {
          response: bleuMatch.answer,
          agentUsed: `${agent.name} (BLEU Match)`,
        };
      }
    } catch (bleuErr) {
      console.warn('[AgentExecutor] BLEU match verification error:', bleuErr);
    }

    const response = await agent.execute(userId, input, messageId, extractedDestination, history);

    return {
      response,
      agentUsed: agent.name,
    };
  }

  /**
   * Routing tự động dựa trên từ khóa trong câu hỏi
   */
  private routeRequest(input: string): AgentType {
    const lowerInput = input.toLowerCase();
    const cleanInput = removeDiacritics(lowerInput);

    // Kiểm tra từ đơn "ăn" đứng độc lập để tránh trùng lặp với "văn", "chăn", "khăn", v.v.
    const hasStandaloneAn = /(?:^|\s)an(?:[.,!?]|\s|$)/i.test(cleanInput);

    // 1. Food keywords
    if (
      hasStandaloneAn ||
      cleanInput.includes('mon') ||
      cleanInput.includes('dac san') ||
      cleanInput.includes('nha hang') ||
      cleanInput.includes('am thuc') ||
      cleanInput.includes('quan an')
    ) {
      return 'food';
    }

    // 2. Culture keywords
    if (
      cleanInput.includes('van hoa') ||
      cleanInput.includes('lich su') ||
      cleanInput.includes('le hoi') ||
      cleanInput.includes('phong tuc') ||
      cleanInput.includes('truyens thong') ||
      cleanInput.includes('truyen thong') ||
      cleanInput.includes('di tich') ||
      cleanInput.includes('chua chi') ||
      cleanInput.includes('den tho')
    ) {
      return 'culture';
    }

    // 3. Recommendation keywords (gợi ý, đề xuất, hoặc yêu cầu nơi khác/điểm khác với các lỗi gõ như "no khac", "noi khac")
    const isRecommendationIntent = 
      cleanInput.includes('goi y') ||
      cleanInput.includes('de xuat') ||
      cleanInput.includes('phu hop') ||
      cleanInput.includes('so thich') ||
      cleanInput.includes('ca nhan') ||
      cleanInput.includes('khuyen nghi') ||
      cleanInput.includes('recommend') ||
      /(?:noi|no|diem|cho|dia diem|goi y|de xuat|tuy chon)\s+khac/i.test(cleanInput);

    if (isRecommendationIntent) {
      return 'recommendation';
    }

    // 4. Default to travel agent
    return 'travel';
  }
}
