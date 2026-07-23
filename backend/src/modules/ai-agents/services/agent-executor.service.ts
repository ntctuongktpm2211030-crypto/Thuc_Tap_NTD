import { AgentStrategy, AgentType, AgentResponse, Citation, IntentResult, UserMemory } from '../types/agent.types';
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
import { removeDiacritics, classifyIntentWithLLM, cleanGeographicName, getDynamicRegions, findBestBleuMatch, buildCitationsFromDocs, callAgentLLM } from '../utils/agent.utils';
import prisma from '../../../config/db';
import { RagPipelineService } from '../../rag/services/rag-pipeline.service';
import { logger } from '../../../utils/logger';
import { ConversationStateService } from '../../dialogue/conversation-state.service';
import { TravelRerankerService } from '../../dialogue/travel-reranker.service';
import { ResponsePlanner } from '../../dialogue/response-planner.service';
import { TravelIntentService } from '../../dialogue/travel-intent.service';
import { SlotFillingService } from '../../dialogue/slot-filling.service';
import { SuggestionBuilderService } from '../../dialogue/suggestion-builder.service';
import { ResponseFormatterService } from '../../dialogue/response-formatter.service';
import { TravelSubIntent, SUB_INTENT_KEYWORDS } from '../../dialogue/types/dialogue.types';
import { ConversationIntelligence } from '../../chatbot/intelligence/conversation-intelligence';
import { ContextResolver } from '../../chatbot/intelligence/context/context-resolver';

export class AgentExecutorService {
  private strategies: Record<Exclude<AgentType, 'unknown'>, AgentStrategy>;
  private addressService = new AddressService();
  private conversationState: ConversationStateService;
  private travelReranker: TravelRerankerService;
  private responsePlanner: ResponsePlanner;
  private travelIntent: TravelIntentService;
  private slotFilling: SlotFillingService;
  private suggestionBuilder: SuggestionBuilderService;
  private responseFormatter: ResponseFormatterService;

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

    // 3. Dialogue Layer services (injected for composition)
    this.conversationState = new ConversationStateService();
    this.travelReranker = new TravelRerankerService();
    this.responsePlanner = new ResponsePlanner();
    this.travelIntent = new TravelIntentService();
    this.slotFilling = new SlotFillingService();
    this.suggestionBuilder = new SuggestionBuilderService();
    this.responseFormatter = new ResponseFormatterService();
  }

  /**
   * Get the conversation state service for external use (e.g., ChatbotService).
   */
  getConversationStateService(): ConversationStateService {
    return this.conversationState;
  }

  async execute(
    userId: string,
    input: string,
    agentType?: AgentType,
    messageId?: string,
    history?: { role: string; content: string }[],
    memory?: UserMemory,
    requestId?: string
  ): Promise<AgentResponse & { agentUsed: string }> {
    const startTime = Date.now();
    let selectedType = agentType;
    let extractedDestination: string | undefined = undefined;
    let llmProvider = 'none';
    let classifierFailed = false;
    let isPlanningIntent = true;

    // ✅ Resolve actual conversationId from messageId to prevent dialogue state loss
    let convId = userId;
    if (messageId) {
      try {
        const msgObj = await prisma.chatMessage.findUnique({
          where: { id: messageId },
          select: { conversationId: true }
        });
        if (msgObj) {
          convId = msgObj.conversationId;
        } else {
          convId = messageId;
        }
      } catch (_) {
        convId = messageId;
      }
    }

    logger.info('AgentExecutor', 'execute — starting', { userId, inputLength: input.length, hasPredefinedType: !!agentType }, requestId);

    // Kiểm tra câu tương tác xã giao đơn giản (Greetings, Thanks, Bye, Identity, Praise, Smalltalk, Complaint) để phản hồi tự nhiên ngay lập tức
    const cleanRawInput = removeDiacritics(input.toLowerCase().trim()).replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
    
    // 1. Chào hỏi (Greetings)
    const isGreeting = /^(chao|xin chao|hello|hi|hey|alo|helo|hi ad|chao ad|chao bot|hey bot|chao ban|chao ca nha|greetings)$/i.test(cleanRawInput);
    if (isGreeting) {
      logger.info('AgentExecutor', 'Social Router: Greeting detected', { input }, requestId);
      return {
        response: 'Xin chào! Tôi là trợ lý du lịch thông minh **Terraholic AI** ✈️. \n\nTôi có thể hỗ trợ bạn:\n*   **Thiết kế lịch trình:** Lập kế hoạch du lịch tự động theo số ngày và ngân sách của bạn.\n*   **Tìm kiếm ẩm thực:** Gợi ý các món ăn đặc sản và quán ngon địa phương.\n*   **Khám phá văn hóa:** Tra cứu thông tin di tích lịch sử, lễ hội vùng miền.\n*   **Thông tin thời tiết & bản đồ:** Kiểm tra thời tiết hiện tại và tối ưu hóa lộ trình di chuyển.\n\nHôm nay bạn muốn bắt đầu hành trình khám phá địa điểm nào? Hãy cho tôi biết nhé! 😊',
        agentUsed: 'System-Greeting',
        citations: [],
      };
    }

    // 2. Cảm ơn (Thanks)
    const isThanks = /^(cam on|cang on|thank|thanks|thank you|tks|cam on ad|cam on bot|thank ad|thx|cmon)$/i.test(cleanRawInput);
    if (isThanks) {
      logger.info('AgentExecutor', 'Social Router: Thanks detected', { input }, requestId);
      return {
        response: 'Không có chi! Được hỗ trợ bạn là niềm vui của tôi. Chúc bạn có những hành trình khám phá thật tuyệt vời! Nếu cần thêm thông tin gì về du lịch, ẩm thực hay lịch trình, cứ nhắn tôi nhé! 😊',
        agentUsed: 'System-Thanks',
        citations: [],
      };
    }

    // 3. Tạm biệt (Bye)
    const isBye = /^(tam biet|bye|goodbye|g9|bye bye|see you|hen gap lai|bi bi|bibi)$/i.test(cleanRawInput);
    if (isBye) {
      logger.info('AgentExecutor', 'Social Router: Bye detected', { input }, requestId);
      return {
        response: 'Tạm biệt bạn! Hẹn gặp lại bạn trong những hành trình lập kế hoạch du lịch tiếp theo. Chúc bạn có những chuyến đi thượng lộ bình an! ✈️👋',
        agentUsed: 'System-Bye',
        citations: [],
      };
    }

    // 4. Danh tính của Bot / Bạn là ai (Bot Identity)
    const isIdentity = /^(ban la ai|ten ban la gi|ten la gi|ai tao ra ban|dieu hanh boi ai|bot la ai|day la dau|project gi vay|du an gi vay|ban la chatbot gi)$/i.test(cleanRawInput);
    if (isIdentity) {
      logger.info('AgentExecutor', 'Social Router: Identity query detected', { input }, requestId);
      return {
        response: 'Tôi là **Terraholic AI**, người bạn đồng hành ảo chuyên tư vấn lập lịch trình du lịch, ẩm thực và văn hóa Việt Nam ✈️. Tôi được thiết kế và phát triển bởi đội ngũ sáng lập của dự án Terraholic để giúp mọi chuyến hành trình của bạn trở nên dễ dàng và khoa học nhất!',
        agentUsed: 'System-Identity',
        citations: [],
      };
    }

    // 5. Khen ngợi (Praise/Compliments)
    const isPraise = /^(gioi qua|xin qua|xong xao|thong minh|hay qua|tuyet voi|good|great|ok dat|ung y|dep the|bot xin|bot gioi|thong minh the|de thuong the)$/i.test(cleanRawInput);
    if (isPraise) {
      logger.info('AgentExecutor', 'Social Router: Praise detected', { input }, requestId);
      return {
        response: 'Cảm ơn lời khen của bạn! 🥰 Được đồng hành và giúp ích cho những chuyến đi khám phá của bạn là niềm vui lớn nhất của tôi. Hãy tiếp tục đặt câu hỏi, tôi rất sẵn lòng tư vấn thêm cho bạn nhé!',
        agentUsed: 'System-Praise',
        citations: [],
      };
    }

    // 6. Hỏi thăm sức khỏe / Smalltalk (Smalltalk)
    const isSmalltalk = /^(ban khoe khong|co khoe khong|khoe khong|khoe chu|khoe ko|hoe khong|on khong|on ko|khoe hanh|how are you|khoe nhi)$/i.test(cleanRawInput);
    if (isSmalltalk) {
      logger.info('AgentExecutor', 'Social Router: Smalltalk detected', { input }, requestId);
      return {
        response: 'Tôi là trợ lý AI nên lúc nào cũng tràn đầy năng lượng 100% và luôn sẵn sàng phục vụ bạn! Cảm ơn bạn rất nhiều vì đã hỏi thăm. Hôm nay tinh thần của bạn thế nào? Chúng ta cùng lập kế hoạch du lịch cho một chuyến đi mới chứ? 😊',
        agentUsed: 'System-Smalltalk',
        citations: [],
      };
    }

    // 7. Lời chê bai / Phàn nàn (Complaints/Criticism)
    const isComplaint = /^(ngu the|ngu qua|ngoc the|do the|chan the|tra loi chan|tra loi do|kem the|ngu v|ngoc v|chay cham|do v|te the)$/i.test(cleanRawInput);
    if (isComplaint) {
      logger.info('AgentExecutor', 'Social Router: Complaint detected', { input }, requestId);
      return {
        response: 'Tôi rất tiếc vì câu trả lời vừa rồi chưa đáp ứng được kỳ vọng của bạn. 😔 Là một trợ lý AI đang trong quá trình học hỏi và hoàn thiện, tôi sẽ ghi nhận phản hồi này để nâng cấp chất lượng tốt hơn. Bạn có thể cho tôi biết rõ hơn phần nào cần điều chỉnh không?',
        agentUsed: 'System-Complaint',
        citations: [],
      };
    }

    // Tự động phân loại (Natural Language Routing) sử dụng LLM nếu không có agentType chỉ định
    if (!selectedType) {
      let detectedDest: string | null = null;
      let confidence = 0.5;
      let reasoning = '';
      const originalInput = input;

      // ─── Tích hợp Conversation Intelligence Module (CIM) ───
      const stateObj = this.conversationState.getState(convId);
      const currentState = stateObj && stateObj.intent ? 'RECOMMENDATION' : 'DISCOVERY';
      const cim = new ConversationIntelligence();
      let cimResult = null;

      try {
        cimResult = await cim.analyzeQuery(input, convId, currentState as any);
      } catch (err) {
        logger.warn('AgentExecutor', 'CIM analysis failed, using legacy fallback', { error: (err as Error).message }, requestId);
      }

      if (cimResult) {
        logger.info('AgentExecutor', 'CIM routing matched', {
          intent: cimResult.intent.intent,
          emotion: cimResult.emotion.emotion,
          nextState: cimResult.nextState,
          action: cimResult.responsePolicy.actionType,
        }, requestId);

        // Ánh xạ Intent của CIM sang Agent xử lý tương ứng
        if (
          cimResult.intent.intent === 'RECOMMENDATION' ||
          cimResult.intent.intent === 'RECOMMENDATION_MORE' ||
          cimResult.intent.intent === 'RECOMMENDATION_REPLACE'
        ) {
          selectedType = 'recommendation';
          confidence = cimResult.intent.confidence;
          reasoning = cimResult.intent.reason;
          llmProvider = 'CIM';
        } else if (cimResult.intent.intent === 'ITINERARY_PLAN') {
          // Áp dụng "Answer First" nếu thiếu slot -> chuyển hướng sang gợi ý địa điểm trước
          if (cimResult.responsePolicy.actionType === 'RECOMMEND') {
            selectedType = 'recommendation';
            confidence = cimResult.intent.confidence;
            reasoning = 'CIM: Itinerary with missing slot -> answer first with recommendations.';
            llmProvider = 'CIM-AnswerFirst';
          } else {
            selectedType = 'travel';
            confidence = cimResult.intent.confidence;
            reasoning = cimResult.intent.reason;
            llmProvider = 'CIM';
          }
        } else {
          selectedType = 'travel'; // Mặc định chuyển về trợ lý tổng quan
          confidence = 0.8;
          reasoning = 'CIM: default general query';
          llmProvider = 'CIM-General';
        }
        isPlanningIntent = cimResult.intent.intent === 'ITINERARY_PLAN';

        // Tùy biến giọng điệu, phản hồi thông qua Prompt Injection
        let promptInjection = `\n\n[System Directive - Emotion: ${cimResult.emotion.emotion} (Intensity: ${cimResult.emotion.intensity})]:`;
        if (cimResult.responsePolicy.toneModifier) {
          promptInjection += `\n- Tone modifier: ${cimResult.responsePolicy.toneModifier}`;
        }
        if (cimResult.responsePolicy.clarificationPrompt) {
          promptInjection += `\n- Clarification policy: ${cimResult.responsePolicy.clarificationPrompt}`;
        }
        
        // Loại bỏ các địa điểm đã gợi ý trước đó nhưng người dùng không thích
        try {
          const context = await new ContextResolver().resolve(convId);
          if (context && context.lastAttractionsRejected.length > 0) {
            promptInjection += `\n- EXCLUDE ATTRACTIONS: Please do NOT recommend or mention these attractions under any circumstances: ${context.lastAttractionsRejected.join(', ')}. Recommend other alternative places instead.`;
          }
        } catch (_) {}

        input += promptInjection;

        // Quét nhanh tìm địa danh trong câu hỏi gốc
        try {
          const dbDests = await getDynamicRegions();
          const cleanInput = removeDiacritics(originalInput.toLowerCase());
          const matched = dbDests.find(d => {
            const cleanDb = removeDiacritics(d.toLowerCase());
            const strippedDb = cleanGeographicName(d);
            return cleanInput === cleanDb || cleanInput.includes(cleanDb) || cleanInput.includes(strippedDb);
          });
          if (matched) {
            detectedDest = matched;
          }
        } catch (_) {}
      } else {
        // Fallback sang Regex / LLM cũ nếu CIM lỗi hoặc không kích hoạt
        const routeResult = this.routeRequest(input);
        if (routeResult.confidence >= 0.8) {
          selectedType = routeResult.intent;
          confidence = routeResult.confidence;
          reasoning = routeResult.reasoning || '';
          llmProvider = 'fast-regex-router';
        } else {
          try {
            const result = await classifyIntentWithLLM(input);
            selectedType = result.intent;
            detectedDest = result.destination || null;
            confidence = result.confidence;
            reasoning = result.reasoning || '';
            llmProvider = 'classifier';
          } catch (err) {
            selectedType = routeResult.intent;
            confidence = routeResult.confidence;
            reasoning = routeResult.reasoning || '';
            llmProvider = 'regex-router-fallback';
          }
        }
      }

      if (detectedDest) {
        extractedDestination = detectedDest;

        // 1. Đầu tiên, tra cứu địa danh chuẩn hóa qua vietnamadminunits
        let adminUnit = null;
        try {
          adminUnit = await this.addressService.parseAddress(detectedDest);
        } catch (err) {
          logger.warn('AgentExecutor', 'Failed to parse address via AddressService', { destination: detectedDest, error: (err as Error).message }, requestId);
        }

        let matched: string | undefined = undefined;

        if (adminUnit) {
          logger.info('AgentExecutor', 'Resolved via vietnamadminunits',
            { original: detectedDest, province: adminUnit.province, short: adminUnit.short_province },
            requestId
          );
          
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
            const cleanDest = removeDiacritics(detectedDest.toLowerCase());
            
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
          logger.info('AgentExecutor', 'Destination validation failed — map check returned error',
            { extractedDestination: extractedDestination, status: checkMap.status },
            requestId
          );
          return {
            response: `Tôi chưa hiểu rõ địa điểm \"**${extractedDestination}**\" hoặc địa điểm này không tồn tại thực tế. Bạn có thể nói rõ hơn hoặc nhập một địa điểm khác được không?`,
            agentUsed: 'System-Clarification',
            citations: [],
          };
        }
      }

      // Nếu câu hỏi hiện tại không chứa điểm đến nhưng có lịch sử, trích xuất từ lịch sử để giữ ngữ cảnh
      if (!extractedDestination && history && history.length > 0) {
        try {
          const dbDests = await getDynamicRegions();
          const lastDest = extractLastDestinationFromHistory(history, dbDests);
          if (lastDest) {
            extractedDestination = lastDest;
            logger.info('AgentExecutor', 'Fallback destination from history', { extractedDestination }, requestId);
          }
        } catch (historyErr) {
          logger.warn('AgentExecutor', 'Failed to extract fallback destination from history', { error: (historyErr as Error).message }, requestId);
        }
      }

      logger.info('AgentExecutor', 'Intent classification result',
        { intent: selectedType, destination: extractedDestination, confidence: confidence.toFixed(2), reasoning },
        requestId
      );

      // Sử dụng confidence threshold để quyết định:
      // >= 0.8: Tin tưởng cao, đi thẳng tới agent
      // >= 0.5: Trung bình, đi tới agent nhưng ghi log cảnh báo
      // < 0.5: Thấp, chuyển sang unknown để hỏi lại
      if (confidence < 0.5) {
        selectedType = 'unknown';
      }
    }

    // Xử lý ý định không xác định (Unknown Intent Fallback) -> Chuyển sang Smalltalk LLM trò chuyện tự nhiên
    if (selectedType === 'unknown') {
      const SMALLTALK_SYSTEM_PROMPT = `Bạn là trợ lý ảo thông minh **Terraholic AI** ✈️.
Nhiệm vụ của bạn là trò chuyện phiếm, tâm sự, đùa vui (smalltalk), trả lời các câu hỏi về bản thân bạn, chia sẻ cảm nhận cá nhân, khuyên nhủ hoặc tư vấn chung ngoài lề.
Hãy trả lời một cách tự nhiên, dí dỏm, đầy cảm xúc, sử dụng icon sinh động và cách xưng hô thân mật (mình - bạn) giống như một trợ lý ảo cao cấp (thông thái nhưng khiêm nhường, luôn lịch sự, nhiệt tình và am hiểu).
Hãy luôn giữ thái độ nhiệt tình, ấm áp, lắng nghe người dùng và khéo léo kết nối câu chuyện dẫn dắt họ quay lại các chủ đề liên quan đến du lịch Việt Nam nếu có thể.`;

      try {
        const smalltalkResponse = await callAgentLLM(SMALLTALK_SYSTEM_PROMPT, input, history || [], requestId);
        const totalLatency = Date.now() - startTime;
        logger.info('AgentExecutor', 'execute — completed (Smalltalk LLM)', { latencyMs: totalLatency }, requestId);
        return {
          response: smalltalkResponse,
          agentUsed: 'System-Smalltalk-LLM',
          citations: [],
        };
      } catch (err) {
        logger.error('AgentExecutor', 'Smalltalk LLM failed, using simple fallback', { error: (err as Error).message }, requestId);
        return {
          response: 'Tôi là trợ lý du lịch Terraholic AI. Tôi chưa hiểu rõ ý bạn lắm, bạn có thể chia sẻ cụ thể hơn về chuyến đi bạn muốn lên lịch trình hoặc địa điểm bạn thích không? 😊',
          agentUsed: 'System-Clarification-Fallback',
          citations: [],
        };
      }
    }

    const agent = this.strategies[selectedType];
    if (!agent) {
      throw new Error(`Không tìm thấy agent xử lý phù hợp cho loại: ${selectedType}`);
    }

    const selectedAgentName = selectedType;
    logger.info('AgentExecutor', 'Selected agent', { agent: agent.name, type: selectedType }, requestId);

    // ─── DIALOGUE LAYER: Conversation State + Slot Filling + Intent Detection ───
    
    // 1. Slot Filling: extract structured info from user message
    const slotUpdates = this.slotFilling.extract(input, extractedDestination);
    
    // 2. Update conversation state with extracted slots
    const state = this.conversationState.updateState(convId, slotUpdates);
    
    // 3. Intent Detection: detect travel sub-intent
    let travelSubIntent: TravelSubIntent | null = null;
    if (selectedType === 'travel' || selectedType === undefined) {
      travelSubIntent = this.travelIntent.detect(input);
      // Store intent in state
      if (travelSubIntent !== 'general') {
        this.conversationState.setSlot(convId, 'intent', travelSubIntent);
      }
    }
    logger.info('AgentExecutor', 'Dialogue state updated', {
      destination: state.destination,
      intent: travelSubIntent,
      days: state.days,
      budget: state.budget,
      companion: state.companion,
    }, requestId);

    // ─── Check if we need a follow-up question ───
    // Ask follow-up when the high-level agent type is not explicitly set (undefined or fallback travel)
    // This allows: "Tôi muốn đi Thái Nguyên" → "Bạn dự định đi mấy ngày?"
    const missingQuestion = this.slotFilling.getFollowUpQuestion(state, true);
    if (missingQuestion && (selectedType === undefined || selectedType === 'travel') && isPlanningIntent) {
      logger.info('AgentExecutor', 'Missing slots — asking follow-up', { question: missingQuestion, selectedType }, requestId);
      const followUpResponse = this.responseFormatter.formatFollowUp({
        question: missingQuestion,
        state: { intent: travelSubIntent, destination: extractedDestination || null },
        suggestions: ['Đi đâu chơi', 'Có gì ngon', 'Lịch trình tham khảo'],
        latencyMs: Date.now() - startTime,
      });
      return {
        response: followUpResponse.answer,
        agentUsed: 'System-Clarification',
        citations: [],
        places: followUpResponse.places,
        suggestions: followUpResponse.suggestions,
        followUpQuestion: followUpResponse.followUpQuestion,
        metadata: followUpResponse.metadata,
      };
    }

    // ─── BLEU SCORE EXACT MATCH VERIFICATION ───
    let bleuBypassed = false;
    let ragDocCount = 0;
    let finalDocs: any[] = [];
    let pipelineMetadata: any = null;
    try {
      const ragPipeline = new RagPipelineService();
      
      let categoryFilter: string | undefined = undefined;
      if (selectedType === 'food') categoryFilter = 'food';
      else if (selectedType === 'culture') categoryFilter = 'culture';
      else if (selectedType === 'recommendation') categoryFilter = 'destination';
      
      const pipelineResult = await ragPipeline.execute({
        query: input,
        destination: extractedDestination,
        category: categoryFilter,
        topK: 4,
        requestId,
      });
      finalDocs = pipelineResult.docs;
      pipelineMetadata = pipelineResult.metadata;
      ragDocCount = pipelineResult.metadata.rawRetrievalCount;
      
      logger.info('AgentExecutor', 'RAG pipeline completed', {
        rawCount: pipelineResult.metadata.rawRetrievalCount,
        filteredCount: pipelineResult.metadata.finalDocCount,
        destination: pipelineResult.destination,
        category: pipelineResult.category,
        latencyMs: pipelineResult.metadata.latencyMs,
      }, requestId);

      // ─── INTENT-AWARE RERANKING (TravelRerankerService) ───
      if (travelSubIntent && travelSubIntent !== 'general' && finalDocs.length > 0) {
        const reranked = this.travelReranker.rerank(finalDocs, travelSubIntent, requestId);
        finalDocs = reranked.docs;
        logger.info('AgentExecutor', 'TravelReranker applied', {
          intent: travelSubIntent,
          beforeCount: reranked.metadata.originalCount,
          afterCount: reranked.metadata.finalCount,
          boostApplied: reranked.metadata.boostApplied,
          demoteApplied: reranked.metadata.demoteApplied,
        }, requestId);
      }

      // ─── BLEU CHECK ───
      const bleuMatch = await findBestBleuMatch(input, finalDocs);
      if (bleuMatch && bleuMatch.score >= 0.75) {
        bleuBypassed = true;
        logger.info('AgentExecutor', 'BLEU exact match — bypassing LLM',
          { score: bleuMatch.score.toFixed(2), ragDocCount, filteredDocCount: finalDocs.length },
          requestId
        );
        const bleuCitations = buildCitationsFromDocs(finalDocs, 2).map(c => ({ ...c, index: 1 }));
        
        // Build response plan + structured response via ResponsePlanner + Formatter
        const ragContext = buildCitationsFromDocs(finalDocs);
        const plan = this.responsePlanner.plan(finalDocs, state, requestId);
        const suggestions = this.suggestionBuilder.build(state, travelSubIntent);
        const response = this.responseFormatter.format({
          answer: bleuMatch.answer,
          plan,
          state: { intent: travelSubIntent, destination: extractedDestination || null },
          suggestions,
          agentUsed: `${agent.name} (BLEU Match)`,
          latencyMs: Date.now() - startTime,
          hasRagData: finalDocs.length > 0,
        });

        const totalLatency = Date.now() - startTime;
        logger.info('AgentExecutor', 'execute — completed (BLEU bypass)', {
          agentUsed: `${agent.name} (BLEU Match)`,
          latencyMs: totalLatency,
          docCount: ragDocCount,
          llmProvider: 'bleu-match',
        }, requestId);
        return {
          response: response.answer,
          agentUsed: `${agent.name} (BLEU Match)`,
          citations: response.citations,
          places: response.places,
          suggestions: response.suggestions,
          followUpQuestion: response.followUpQuestion,
          metadata: response.metadata,
        };
      }
    } catch (bleuErr) {
      logger.warn('AgentExecutor', 'Pipeline/BLEU error', { error: (bleuErr as Error).message }, requestId);
    }

    // Execute the agent
    logger.info('AgentExecutor', 'Calling agent', { agent: agent.name, hasDestination: !!extractedDestination, hasMemory: !!memory }, requestId);
    const agentResult = await agent.execute(userId, input, messageId, extractedDestination, history, memory);

    // ─── Build structured response with plan via ResponsePlanner + Formatter ───
    const responsePlan = this.responsePlanner.plan(finalDocs, state, requestId);
    const suggestions = this.suggestionBuilder.build(state, travelSubIntent);
    const hasRagData = finalDocs.length > 0;

    const totalLatency = Date.now() - startTime;
    logger.info('AgentExecutor', 'execute — completed',
      {
        agentUsed: agent.name,
        intent: selectedType,
        subIntent: travelSubIntent,
        destination: extractedDestination || null,
        latencyMs: totalLatency,
        responseLength: agentResult.response.length,
        citationsCount: agentResult.citations?.length || 0,
        docCount: ragDocCount,
        memoryLoaded: !!memory,
        llmProvider,
        bleuBypassed,
        classifierFailed,
        hasRagData,
      },
      requestId
    );

    return {
      response: agentResult.response,
      agentUsed: agent.name,
      citations: agentResult.citations || [],
      places: agentResult.places || [],
      suggestions: suggestions,
      followUpQuestion: null,
      metadata: {
        intent: travelSubIntent,
        destination: extractedDestination || null,
        hasRagData,
        agentUsed: agent.name,
        latencyMs: totalLatency,
        planGenerated: true,
      },
    };
  }

  /**
   * Routing tự động dựa trên từ khóa trong câu hỏi với confidence scoring.
   * Returns IntentResult with confidence based on keyword match strength.
   */
  private routeRequest(input: string): IntentResult {
    const lowerInput = input.toLowerCase();
    const cleanInput = removeDiacritics(lowerInput);

    // Kiểm tra từ đơn "ăn" đứng độc lập để tránh trùng lặp với "văn", "chăn", "khăn", v.v.
    const hasStandaloneAn = /(?:^|\s)an(?:[.,!?]|\s|$)/i.test(cleanInput);

    // 1. Food keywords — check multi-word phrases first for higher confidence
    const foodPhrases = ['dac san', 'nha hang', 'am thuc', 'quan an', 'mon an', 'mon ngon'];
    const foodWordCount = foodPhrases.filter(p => cleanInput.includes(p)).length;
    const hasFoodIntent = hasStandaloneAn || foodWordCount > 0 || 
      ['com', 'pho', 'bun', 'lau', 'banh', 'che', 'hai san'].some(w => cleanInput.includes(w));
    
    if (hasFoodIntent) {
      const confidence = hasStandaloneAn ? 0.7 : Math.min(0.95, 0.5 + foodWordCount * 0.15);
      return { intent: 'food', destination: null, confidence, reasoning: `Regex matched ${foodWordCount + 1} food keyword(s)` };
    }

    // 2. Culture keywords
    const culturePhrases = ['van hoa', 'lich su', 'le hoi', 'phong tuc', 'truyen thong', 'di tich', 'chua chien', 'den tho', 'lang nghe'];
    const cultureWordCount = culturePhrases.filter(p => cleanInput.includes(p)).length;
    if (cultureWordCount > 0) {
      const confidence = Math.min(0.9, 0.5 + cultureWordCount * 0.1);
      return { intent: 'culture', destination: null, confidence, reasoning: `Regex matched ${cultureWordCount} culture keyword(s)` };
    }

    // 3. Recommendation keywords
    const recommendationPhrases = ['goi y', 'de xuat', 'phu hop', 'so thich', 'ca nhan', 'khuyen nghi', 'recommend'];
    const recWordCount = recommendationPhrases.filter(p => cleanInput.includes(p)).length;
    const hasAlternativeIntent = /(?:noi|no|diem|cho|dia diem)\s+khac/i.test(cleanInput);
    
    if (recWordCount > 0 || hasAlternativeIntent) {
      const confidence = hasAlternativeIntent ? 0.85 : Math.min(0.9, 0.5 + recWordCount * 0.1);
      return { intent: 'recommendation', destination: null, confidence, reasoning: `Regex matched recommendation keyword(s)` };
    }

    // 4. Default to travel agent with low confidence (will be handled upstream)
    //    Check for travel-related keywords to boost confidence slightly
    const travelPhrases = ['thoi tiet', 'ban do', 'phuong tien', 'di chuyen', 'lich trinh', 'chuyen di', 'du lich', 'di choi'];
    const travelWordCount = travelPhrases.filter(p => cleanInput.includes(p)).length;
    const confidence = travelWordCount > 0 ? Math.min(0.7, 0.3 + travelWordCount * 0.1) : 0.3;
    return { intent: 'travel', destination: null, confidence, reasoning: 'Default fallback to travel agent' };
  }
}
