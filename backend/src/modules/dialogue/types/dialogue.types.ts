import { Citation } from '../../ai-agents/types/agent.types';

// ─── Travel Sub-Intents ────────────────────────────────────────

/**
 * Detailed travel sub-intents that describe *why* the user is traveling.
 * These are more specific than the high-level agent categories (food/culture/travel/recommendation).
 */
export type TravelSubIntent =
  | 'check-in'      // Chụp ảnh, check-in, sống ảo
  | 'sightseeing'   // Ngắm cảnh, tham quan
  | 'photography'   // Nhiếp ảnh, săn mây, chụp landscape
  | 'trekking'      // Trekking, leo núi, đi bộ
  | 'camping'       // Cắm trại, dã ngoại
  | 'relax'         // Nghỉ dưỡng, thư giãn
  | 'family'        // Gia đình, trẻ em
  | 'couple'        // Cặp đôi, lãng mạn
  | 'food'          // Ẩm thực, ăn uống
  | 'history'       // Lịch sử
  | 'culture'       // Văn hóa, phong tục, nghệ thuật
  | 'festival'      // Lễ hội, sự kiện
  | 'adventure'     // Phượt, mạo hiểm
  | 'backpacking'   // Du lịch bụi, xuyên Việt
  | 'spiritual'     // Tâm linh, chùa chiền
  | 'general';      // Chung chung, không xác định rõ

// ─── Conversation State ────────────────────────────────────────

export interface ConversationState {
  /** Current province being discussed */
  province: string | null;
  /** Specific destination/location */
  destination: string | null;
  /** Detected travel sub-intent */
  intent: TravelSubIntent | null;
  /** Number of travel days */
  days: number | null;
  /** Budget level */
  budget: string | null;
  /** Companion type (alone, family, couple, friends) */
  companion: string | null;
  /** Preferred travel season/month */
  season: string | null;
  /** Conversation ID this state belongs to */
  conversationId: string;
  /** Last updated timestamp */
  updatedAt: number;
}

/**
 * Slot metadata for tracking which slots are required vs optional.
 */
export interface SlotDefinition {
  name: keyof ConversationState;
  label: string;
  labelEn: string;
  required: boolean;
  /** Prompt to ask user when this slot is missing */
  askQuestion: string;
  askQuestionEn: string;
}

// ─── Response Plan ─────────────────────────────────────────────

/**
 * Structured response plan built *before* calling the LLM.
 * The LLM only converts this into natural language.
 * The ResponsePlanner decides WHAT to answer; the LLM decides HOW.
 */
export interface ResponsePlan {
  /** Type of answer: 'destinations' | 'foods' | 'events' | 'general' */
  answerType: 'destinations' | 'foods' | 'events' | 'itinerary' | 'general';
  /** Main title/topic of the response */
  title: string;
  /** 1-2 sentence summary */
  shortDescription: string;
  /** 3-5 key highlights / điểm nổi bật */
  highlights: string[];
  /** Structured place information */
  places: PlaceInfo[];
  /** Food/dish recommendations */
  foods: FoodInfo[];
  /** Event/festival information */
  events: EventInfo[];
  /** Suggested activities */
  activities: string[];
  /** Who this is suitable for */
  suitableFor: string[];
  /** How long to spend here */
  visitDuration: string;
  /** Best season/month to visit */
  bestSeason: string;
  /** Distance from common start point (km) */
  distance: string;
  /** Citations for frontend display (with sourceName/sourceUrl) */
  citations: Citation[];
}

// ─── Place Info ────────────────────────────────────────────────

/**
 * Structured place information for frontend rendering.
 * Each place in the response follows this template.
 */
export interface PlaceInfo {
  name: string;
  shortDescription: string;
  highlights: string[];
  activities: string[];
  suitableFor: string[];
  visitDuration: string;
  bestSeason: string;
  distance: string;
  /** Category of place for grouping/filtering */
  category: string;
  /** Reference to citation index */
  citationIndex: number;
}

// ─── Food Info ─────────────────────────────────────────────────

/**
 * Structured food/dish information for frontend rendering.
 */
export interface FoodInfo {
  name: string;
  description: string;
  region: string;
  highlights: string[];
  suitableFor: string[];
  citationIndex: number;
}

// ─── Event Info ────────────────────────────────────────────────

/**
 * Structured event/festival information for frontend rendering.
 */
export interface EventInfo {
  name: string;
  description: string;
  season: string;
  activities: string[];
  location: string;
  citationIndex: number;
}

// ─── Travel Assistant Response ─────────────────────────────────

/**
 * Unified response schema for the AI Travel Assistant.
 * Designed so the frontend can render structured content easily.
 * The frontend should NOT contain business logic — all structure comes from here.
 */
export interface TravelAssistantResponse {
  /** Main natural language answer text */
  answer: string;
  /** Type of answer */
  answerType: 'destinations' | 'foods' | 'events' | 'itinerary' | 'general';
  /** Structured place information */
  places: PlaceInfo[];
  /** Food/dish recommendations */
  foods: FoodInfo[];
  /** Event/festival information */
  events: EventInfo[];
  /** Source citations with source name and URL */
  citations: Citation[];
  /** Follow-up suggestion buttons */
  suggestions: string[];
  /** If the assistant needs more info before answering */
  followUpQuestion: string | null;
  /** Response metadata */
  metadata: {
    intent: TravelSubIntent | null;
    destination: string | null;
    hasRagData: boolean;
    agentUsed: string;
    latencyMs: number;
    planGenerated: boolean;
  };
}

// ─── Intent Mappings ──────────────────────────────────────────

/**
 * Maps travel sub-intents to relevant keywords for search boosting.
 * Used in intent-aware reranking.
 */
export const INTENT_KEYWORDS: Record<TravelSubIntent, {
  boost: string[];
  demote: string[];
}> = {
  'check-in': {
    boost: ['hồ', 'núi', 'đèo', 'đồi chè', 'viewpoint', 'sống ảo', 'check-in', 'cầu kính', 'ban công', 'hoàng hôn', 'bình minh', 'toàn cảnh', 'ngắm'],
    demote: ['bảo tàng', 'cơ quan', 'hành chính', 'ủy ban', 'trung tâm thương mại'],
  },
  'sightseeing': {
    boost: ['ngắm cảnh', 'danh lam', 'thắng cảnh', 'phong cảnh', 'đẹp', 'hùng vĩ', 'thơ mộng', 'vịnh', 'vườn quốc gia', 'công viên'],
    demote: ['quán ăn', 'nhà hàng', 'chợ'],
  },
  'trekking': {
    boost: ['trekking', 'leo núi', 'đi bộ', 'rừng', 'suối', 'thác', 'đèo', 'bản làng', 'đồi', 'vườn quốc gia', 'hang động'],
    demote: ['bảo tàng', 'nhà hàng', 'khách sạn'],
  },
  'camping': {
    boost: ['cắm trại', 'dã ngoại', 'lều', 'lửa trại', 'bãi cỏ', 'hồ', 'rừng', 'biển', 'sông', 'bình minh'],
    demote: ['khách sạn', 'resort', 'nhà hàng sang'],
  },
  'relax': {
    boost: ['nghỉ dưỡng', 'spa', 'resort', 'thư giãn', 'biển', 'hồ bơi', 'yên tĩnh', 'thiền', 'massage'],
    demote: ['trekking', 'leo núi', 'phượt'],
  },
  'family': {
    boost: ['gia đình', 'trẻ em', 'an toàn', 'khu vui chơi', 'công viên', 'bãi biển', 'khu nghỉ dưỡng', 'zoo', 'thủy cung'],
    demote: ['bar', 'club', 'quán nhậu', 'leo núi'],
  },
  'couple': {
    boost: ['lãng mạn', 'cặp đôi', 'hoàng hôn', 'café', 'nhà hàng', 'homestay', 'check-in', 'sống ảo', 'ban công', 'ngắm cảnh'],
    demote: ['trekking', 'phượt', 'cắm trại'],
  },
  'food': {
    boost: ['ẩm thực', 'đặc sản', 'món ngon', 'quán ăn', 'nhà hàng', 'chợ ẩm thực', 'phố ẩm thực', 'đồ ăn', 'thức uống'],
    demote: ['bảo tàng', 'di tích', 'lịch sử'],
  },  'history': {
      boost: ['lịch sử', 'di tích', 'bảo tàng', 'cổ kính', 'thành cổ', 'kinh thành', 'chiến tích', 'khảo cổ', 'truyền thuyết'],
      demote: ['quán ăn', 'bar', 'club'],
    },
  'culture': {
      boost: ['văn hóa', 'phong tục', 'tập quán', 'con người', 'nghệ thuật', 'đờn ca', 'ca nhạc', 'làng nghề', 'chợ quê', 'sinh hoạt', 'bản sắc', 'truyền thống', 'nếp sống', 'tín ngưỡng', 'tôn giáo'],
      demote: ['quán ăn', 'nhà hàng', 'khách sạn'],
    },
  'festival': {
    boost: ['lễ hội', 'festival', 'hội làng', 'cúng', 'tết', 'sự kiện', 'diễu hành', 'nghi lễ', 'mùa'],
    demote: ['khách sạn', 'nhà hàng'],
  },
  'photography': {
    boost: ['nhiếp ảnh', 'chụp ảnh', 'landscape', 'săn mây', 'hoàng hôn', 'bình minh', 'cảnh đẹp', 'sương mù', 'ruộng bậc thang', 'hoa dã quỳ'],
    demote: ['quán ăn', 'chợ', 'trung tâm thương mại'],
  },
  'adventure': {
    boost: ['phượt', 'mạo hiểm', 'xe máy', 'đèo', 'rừng', 'hang động', 'leo núi', 'vượt thác', 'off-road', 'bản làng xa'],
    demote: ['resort', 'spa', 'nghỉ dưỡng'],
  },
  'backpacking': {
    boost: ['bụi', 'xuyên việt', 'tự túc', 'tiết kiệm', 'homestay', 'ghế ngồi', 'xe buýt', 'phượt', 'ba lô'],
    demote: ['resort', 'khách sạn 5 sao', 'tour'],
  },
  'spiritual': {
    boost: ['chùa', 'đền', 'miếu', 'tâm linh', 'phật', 'thánh', 'linh thiêng', 'tín ngưỡng', 'hành hương'],
    demote: ['bar', 'club', 'quán nhậu'],
  },
  'general': {
    boost: ['du lịch', 'đi chơi', 'tham quan', 'địa điểm', 'điểm đến'],
    demote: [],
  },
};

/**
 * Maps user input keywords → TravelSubIntent for rule-based detection.
 */
export const SUB_INTENT_KEYWORDS: Record<string, TravelSubIntent[]> = {
  'check-in': ['check in', 'sống ảo', 'chụp ảnh', 'selfie', 'view đẹp', 'săn mây', 'sống ảo'],
  'sightseeing': ['ngắm cảnh', 'tham quan', 'danh lam', 'phong cảnh', 'cảnh đẹp', 'ngắm', 'chiêm ngưỡng'],
  'trekking': ['trekking', 'leo núi', 'đi bộ', 'xuyên rừng', 'băng rừng', 'chinh phục', 'đỉnh'],
  'camping': ['cắm trại', 'dã ngoại', 'camping', 'ngủ lều', 'lửa trại'],
  'relax': ['nghỉ dưỡng', 'thư giãn', 'relax', 'spa', 'resort', 'yên tĩnh'],
  'family': ['gia đình', 'trẻ em', 'con nhỏ', 'bé', 'cả nhà', 'đưa con'],
  'couple': ['cặp đôi', 'lãng mạn', 'người yêu', 'vợ chồng', 'hẹn hò', 'tuần trăng mật'],
  'food': ['ẩm thực', 'ăn', 'đặc sản', 'món ngon', 'quán ăn', 'nhà hàng', 'đồ ăn'],
  'history': ['lịch sử', 'di tích', 'bảo tàng', 'cổ kính', 'thành cổ', 'truyền thuyết', 'sự tích'],
  'culture': ['văn hóa', 'phong tục', 'tập quán', 'nghệ thuật', 'làng nghề', 'con người', 'bản sắc', 'truyền thống', 'đời sống'],
  'festival': ['lễ hội', 'festival', 'hội', 'mùa', 'sự kiện'],
  'photography': ['chụp ảnh', 'nhiếp ảnh', 'săn mây', 'landscape', 'cảnh đẹp', 'bình minh', 'hoàng hôn', 'ruộng bậc thang'],
  'adventure': ['phượt', 'mạo hiểm', 'xe máy', 'xuyên việt', 'off-road', 'đèo', 'bụi'],
  'backpacking': ['bụi', 'xuyên việt', 'du lịch bụi', 'tự túc', 'ba lô', 'tây bắc', 'đông bắc'],
  'spiritual': ['chùa', 'tâm linh', 'đền', 'miếu', 'hành hương', 'phật'],
};

// ─── Default Suggestions ───────────────────────────────────────

/**
 * Context-aware follow-up suggestions based on current state.
 */
export const DEFAULT_SUGGESTIONS: Record<string, string[]> = {
  itinerary: ['Lịch trình 2 ngày', 'Lịch trình 3 ngày', 'Lịch trình 1 ngày'],
  food: ['Đặc sản', 'Quán ăn ngon', 'Chợ ẩm thực', 'Món ngon nhất'],
  accommodation: ['Homestay', 'Khách sạn', 'Resort', 'Giá rẻ'],
  transport: ['Xe máy', 'Xe khách', 'Tàu hỏa', 'Máy bay'],
  map: ['Bản đồ', 'Khoảng cách', 'Đường đi'],
  nearby: ['Quán ăn gần đây', 'Địa điểm gần đây', 'Café gần đây'],
  weather: ['Thời tiết', 'Mùa đẹp nhất', 'Nên đi tháng mấy'],
  general: ['Đi đâu chơi', 'Có gì ngon', 'Lịch trình', 'Homestay', 'Bản đồ'],
};
