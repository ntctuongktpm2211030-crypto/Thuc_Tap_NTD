import { SaveMemoryDto } from '../types/chatbot.types';
import { getLLMConfig, removeDiacritics, callNativeGemini } from '../../ai-agents/utils/agent.utils';

/**
 * Result of memory extraction from conversation history.
 */
export interface ExtractedMemory {
  /** The extracted preferences (partial — only fields that had new data) */
  preferences: Partial<SaveMemoryDto>;
  /** Overall confidence score 0.0–1.0 */
  confidence: number;
  /** Whether any genuinely new information was found (vs. already-known) */
  hasNewData: boolean;
}

/**
 * Determines if a conversation is long enough for memory extraction.
 * Requires at least 2 user messages to avoid extracting from greetings.
 */
export function isQualifiedForExtraction(history: { role: string; content: string }[]): boolean {
  if (!history || history.length < 3) return false;
  const userMsgCount = history.filter(m => m.role === 'user').length;
  return userMsgCount >= 2;
}

/**
 * Merges extracted preferences with existing memory using smart union strategy.
 * - Arrays: union of values (deduplicated via normalized comparison)
 * - Budget: only overrides if confidence > 0.85
 */
export function mergeMemory(
  existing: SaveMemoryDto | null,
  extracted: Partial<SaveMemoryDto>,
  confidence: number
): SaveMemoryDto {
  const normalize = (s: string) => removeDiacritics(s.toLowerCase().trim());

  const mergeArrays = (existingArr: string[] = [], newArr: string[] = []): string[] => {
    const seen = new Set(existingArr.map(normalize));
    const merged = [...existingArr];
    for (const item of newArr) {
      const key = normalize(item);
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item.trim());
      }
    }
    return merged;
  };

  return {
    travelPreferences: mergeArrays(existing?.travelPreferences, extracted.travelPreferences),
    favoriteFoods: mergeArrays(existing?.favoriteFoods, extracted.favoriteFoods),
    budget: confidence > 0.85 && extracted.budget
      ? extracted.budget
      : (existing?.budget || extracted.budget || null),
    transportation: mergeArrays(existing?.transportation, extracted.transportation),
    favoriteLocations: mergeArrays(existing?.favoriteLocations, extracted.favoriteLocations),
  };
}

// ─── KEYWORD-BASED FALLBACK EXTRACTION ───────────────────────────

const PREFERENCE_KEYWORDS: Record<string, RegExp[]> = {
  travelPreferences: [
    /(?:thích|mê|đam mê|sở thích|gu)\s+(phượt|bụi|khám phá|mạo hiểm|nghỉ dưỡng|thư giãn|tâm linh|văn hóa|sinh thái|biển|núi|đạp xe|trekking|lang thang)/i,
    /(?:du lịch|đi chơi)\s+(bụi|phượt|khám phá|nghỉ dưỡng|sinh thái)/i,
    /(?:thích|muốn)\s+đi\s+(phượt|bụi|khám phá)/i,
  ],
  favoriteFoods: [
    /(?:thích|mê|khoái|ghiền|thèm)\s+(?:ăn|món|đồ)\s+([AÀẢÃÁẠĂẰẲẴẮẶÂẦẨẪẤẬEÈẺẼÉẸÊỀỂỄẾỆIÌỈĨÍỊOÒỎÕÓỌÔỒỔỖỐỘƠỜỞỠỚỢUÙỦŨÚỤƯỪỬỮỨỰYỲỶỸÝỴaàảãáạăằẳẵắặâầẩẫấậeèẻẽéẹêềểễếệiìỉĩíịoòỏõóọôồổỗốộơờởỡớợuùủũúụưừửữứựyỳỷỹýỵđA-Za-z\s]+)/i,
    /(?:món\s+ăn|đặc sản|ẩm thực)\s+(?:yêu thích|ưa thích|khoái khẩu)\s*(?::|là)\s*([AÀẢÃÁẠĂẰẲẴẮẶÂẦẨẪẤẬEÈẺẼÉẸÊỀỂỄẾỆIÌỈĨÍỊOÒỎÕÓỌÔỒỔỖỐỘƠỜỞỠỚỢUÙỦŨÚỤƯỪỬỮỨỰYỲỶỸÝỴaàảãáạăằẳẵắặâầẩẫấậeèẻẽéẹêềểễếệiìỉĩíịoòỏõóọôồổỗốộơờởỡớợuùủũúụưừửữứựyỳỷỹýỵđA-Za-z\s,]+)/i,
    /(?:hay|thường)\s+(?:ăn|uống)\s+([AÀẢÃÁẠĂẰẲẴẮẶÂẦẨẪẤẬEÈẺẼÉẸÊỀỂỄẾỆIÌỈĨÍỊOÒỎÕÓỌÔỒỔỖỐỘƠỜỞỠỚỢUÙỦŨÚỤƯỪỬỮỨỰYỲỶỸÝỴaàảãáạăằẳẵắặâầẩẫấậeèẻẽéẹêềểễếệiìỉĩíịoòỏõóọôồổỗốộơờởỡớợuùủũúụưừửữứựyỳỷỹýỵđA-Za-z\s]+)/i,
  ],
  budget: [
    /(?:ngân sách|chi phí|tiền|túi tiền|kinh phí)\s*(?::|là|ở mức|chỉ)\s*(thấp|tiết kiệm|rẻ|ít|khiêm tốn|hạn hẹp|eo hẹp)/i,
    /(?:ngân sách|chi phí|tiền|túi tiền)\s*(?::|là)\s*(cao|sang|nhiều|thoải mái|rộng rãi|dư giả)/i,
    /(?:ngân sách|chi phí|tiền)\s*(?::|là)\s*(trung bình|vừa phải|bình thường|tầm trung)/i,
    /(?:muốn|định)\s+(?:tiết kiệm|spend it)?\s*(?:đi|du lịch)\s*(?:với)?\s*(?:chi phí)?\s*(thấp|tiết kiệm|vừa phải|cao)/i,
  ],
  transportation: [
    /(?:đi|di chuyển|phượt|du lịch)\s+bằng\s+(xe máy|xm|xe khách|ô tô|tô|máy bay|tàu hỏa|tàu|xe buýt|bus|xe đạp|thuyền|phà)/i,
    /(?:thích|hay)\s+(?:đi|chạy|phượt)\s+(?:xe máy|xm|wave|exciter|winner|sh|vision|air blade|lead)/i,
    /phương tiện\s+(?:yêu thích|ưa thích|di chuyển)\s*(?::|à|is)\s*(xe máy|ô tô|máy bay|tàu hỏa|xe khách)/i,
  ],
  favoriteLocations: [
    /(?:thích|mê|yêu thích|khoái)\s+(?:nhất là|đi|tới|du lịch)\s+(?:ở|tại|đến)?\s*([AÀẢÃÁẠĂẰẲẴẮẶÂẦẨẪẤẬEÈẺẼÉẸÊỀỂỄẾỆIÌỈĨÍỊOÒỎÕÓỌÔỒỔỖỐỘƠỜỞỠỚỢUÙỦŨÚỤƯỪỬỮỨỰYỲỶỸÝỴaàảãáạăằẳẵắặâầẩẫấậeèẻẽéẹêềểễếệiìỉĩíịoòỏõóọôồổỗốộơờởỡớợuùủũúụưừửữứựyỳỷỹýỵđA-Za-z\s]{2,40}?)(?:\s+nữa|,\s*$|$|\?)/i,
    /(?:địa điểm|nơi|chỗ)\s+(?:yêu thích|ưa thích|muốn đến|thích nhất)\s*(?::|à|is)\s*([AÀẢÃÁẠĂẰẲẴẮẶÂẦẨẪẤẬEÈẺẼÉẸÊỀỂỄẾỆIÌỈĨÍỊOÒỎÕÓỌÔỒỔỖỐỘƠỜỞỠỚỢUÙỦŨÚỤƯỪỬỮỨỰYỲỶỸÝỴaàảãáạăằẳẵắặâầẩẫấậeèẻẽéẹêềểễếệiìỉĩíịoòỏõóọôồổỗốộơờởỡớợuùủũúụưừửữứựyỳỷỹýỵđA-Za-z\s,]+)/i,
    /(?:muốn|định|sẽ)\s+(?:đi|ghé|tới|thăm|du lịch)\s+([AÀẢÃÁẠĂẰẲẴẮẶÂẦẨẪẤẬEÈẺẼÉẸÊỀỂỄẾỆIÌỈĨÍỊOÒỎÕÓỌÔỒỔỖỐỘƠỜỞỠỚỢUÙỦŨÚỤƯỪỬỮỨỰYỲỶỸÝỴaàảãáạăằẳẵắặâầẩẫấậeèẻẽéẹêềểễếệiìỉĩíịoòỏõóọôồổỗốộơờởỡớợuùủũúụưừửữứựyỳỷỹýỵđA-Za-z\s]+?)\s*(?:trong|với|khi|nếu|vào|$|\?)/i,
  ],
};

const BUDGET_MAP: Record<string, string> = {
  'thấp': 'thấp',
  'tiết kiệm': 'thấp',
  'rẻ': 'thấp',
  'ít': 'thấp',
  'khiêm tốn': 'thấp',
  'hạn hẹp': 'thấp',
  'eo hẹp': 'thấp',
  'trung bình': 'trung bình',
  'vừa phải': 'trung bình',
  'bình thường': 'trung bình',
  'tầm trung': 'trung bình',
  'cao': 'cao',
  'sang': 'cao',
  'nhiều': 'cao',
  'thoải mái': 'cao',
  'rộng rãi': 'cao',
  'dư giả': 'cao',
};

/**
 * Extract preferences using keyword/regex matching (fallback when LLM unavailable).
 */
function extractByKeywords(history: { role: string; content: string }[]): ExtractedMemory {
  const result: Partial<SaveMemoryDto> = {};
  const userMessages = history.filter(m => m.role === 'user').map(m => m.content);
  const allUserText = userMessages.join(' \n ');

  // Travel Preferences
  const prefsFound = new Set<string>();
  for (const regex of PREFERENCE_KEYWORDS.travelPreferences) {
    const match = allUserText.match(regex);
    if (match && match[1]) {
      prefsFound.add(match[1].trim().toLowerCase());
    }
  }
  if (prefsFound.size > 0) {
    result.travelPreferences = Array.from(prefsFound);
  }

  // Favorite Foods
  const foodsFound = new Set<string>();
  for (const regex of PREFERENCE_KEYWORDS.favoriteFoods) {
    const match = allUserText.match(regex);
    if (match && match[1]) {
      const raw = match[1].trim();
      // Only take first 60 chars and split on commas for multiple items
      const items = raw.split(/[,;]/).map(s => s.trim()).filter(Boolean);
      items.forEach(item => {
        if (item.length > 1 && item.length < 60) {
          foodsFound.add(item.charAt(0).toUpperCase() + item.slice(1).toLowerCase());
        }
      });
    }
  }
  if (foodsFound.size > 0) {
    result.favoriteFoods = Array.from(foodsFound);
  }

  // Budget
  for (const regex of PREFERENCE_KEYWORDS.budget) {
    const match = allUserText.match(regex);
    if (match && match[1]) {
      const key = match[1].trim().toLowerCase();
      const mapped = BUDGET_MAP[key];
      if (mapped) {
        result.budget = mapped;
        break;
      }
    }
  }

  // Transportation
  const transportFound = new Set<string>();
  for (const regex of PREFERENCE_KEYWORDS.transportation) {
    const match = allUserText.match(regex);
    if (match && match[1]) {
      transportFound.add(match[1].trim().toLowerCase());
    }
  }
  if (transportFound.size > 0) {
    result.transportation = Array.from(transportFound);
  }

  // Favorite Locations
  const locsFound = new Set<string>();
  for (const regex of PREFERENCE_KEYWORDS.favoriteLocations) {
    const match = allUserText.match(regex);
    if (match && match[1]) {
      const raw = match[1].trim();
      const items = raw.split(/[,;]/).map(s => s.trim()).filter(Boolean);
      items.forEach(item => {
        if (item.length > 1 && item.length < 50) {
          locsFound.add(item.charAt(0).toUpperCase() + item.slice(1).toLowerCase());
        }
      });
    }
  }
  if (locsFound.size > 0) {
    result.favoriteLocations = Array.from(locsFound);
  }

  const hasData = Object.keys(result).length > 0;
  return {
    preferences: result,
    confidence: hasData ? 0.6 : 0, // Keyword matching is moderate confidence
    hasNewData: hasData,
  };
}

/**
 * Extract preferences using LLM for better accuracy.
 */
async function extractByLLM(history: { role: string; content: string }[]): Promise<ExtractedMemory> {
  const { apiKey, useGeminiInitially, geminiKey } = getLLMConfig();
  
  // Only proceed if we have an LLM key
  if (!apiKey || apiKey === 'your_openai_key_here' || apiKey === '') {
    // Still try gemini if available
    if (!geminiKey || geminiKey === 'your_gemini_key_here') {
      return extractByKeywords(history);
    }
  }

  // Build context: only user messages, last 10 messages max
  const recentMessages = history.slice(-10);
  const userMessagesOnly = recentMessages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join('\n---\n');

  if (!userMessagesOnly.trim()) {
    return { preferences: {}, confidence: 0, hasNewData: false };
  }

  const systemPrompt = `Bạn là trợ lý AI chuyên phân tích sở thích du lịch của người dùng từ lịch sử trò chuyện.

Nhiệm vụ của bạn là đọc các tin nhắn của người dùng trong cuộc hội thoại du lịch và trích xuất thông tin sở thích của họ.

Chỉ trích xuất thông tin RÕ RÀNG được người dùng trực tiếp nói hoặc khẳng định. KHÔNG SUY DIỄN hay PHỎNG ĐOÁN.

Trả về DUY NHẤT một JSON object hợp lệ theo cấu trúc sau (không markdown, không văn bản thừa):
{
  "travelPreferences": ["mảng các sở thích du lịch, ví dụ: phượt, nghỉ dưỡng, khám phá"] HOẶC [] nếu không tìm thấy,
  "favoriteFoods": ["mảng các món ăn/ẩm thực yêu thích"] HOẶC [],
  "budget": "'thấp', 'trung bình', 'cao' hoặc null nếu không rõ,
  "transportation": ["mảng phương tiện di chuyển"] HOẶC [],
  "favoriteLocations": ["mảng địa danh yêu thích"] HOẶC [],
  "confidence": 0.85 // số từ 0.0 đến 1.0 thể hiện độ tin cậy của toàn bộ phân tích
}`;

  try {
    let rawResponse: string;

    if (useGeminiInitially && geminiKey) {
      const geminiModel = process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash';
      rawResponse = await callNativeGemini(geminiKey, geminiModel, systemPrompt, userMessagesOnly);
    } else if (apiKey && apiKey !== 'your_openai_key_here') {
      const baseURL = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1';
      const modelName = process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini';
      
      const response = await fetch(`${baseURL.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessagesOnly },
          ],
          temperature: 0.1,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`LLM API responded with status ${response.status}`);
      }

      const data = await response.json() as any;
      rawResponse = data.choices[0].message.content.trim();
    } else {
      return extractByKeywords(history);
    }

    const cleanContent = rawResponse.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleanContent);

    return {
      preferences: {
        travelPreferences: Array.isArray(parsed.travelPreferences) ? parsed.travelPreferences : undefined,
        favoriteFoods: Array.isArray(parsed.favoriteFoods) ? parsed.favoriteFoods : undefined,
        budget: typeof parsed.budget === 'string' ? parsed.budget : undefined,
        transportation: Array.isArray(parsed.transportation) ? parsed.transportation : undefined,
        favoriteLocations: Array.isArray(parsed.favoriteLocations) ? parsed.favoriteLocations : undefined,
      },
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
      hasNewData: true,
    };
  } catch (err) {
    console.warn('[MemoryExtractor] LLM extraction failed, falling back to keyword method:', err);
    return extractByKeywords(history);
  }
}

/**
 * Main entry point: Extract travel preferences from conversation history.
 * Uses LLM by default, falls back to keyword matching when unavailable.
 */
export async function extractMemoryFromHistory(
  history: { role: string; content: string }[],
  existingMemory: SaveMemoryDto | null
): Promise<ExtractedMemory> {
  if (!isQualifiedForExtraction(history)) {
    console.log('[MemoryExtractor] Conversation too short for extraction (need ≥2 user messages).');
    return { preferences: {}, confidence: 0, hasNewData: false };
  }

  // 1. Extract raw preferences
  const extracted = await extractByLLM(history);

  if (!extracted.hasNewData) {
    return extracted;
  }

  // 2. Merge with existing memory to detect truly new data
  const merged = mergeMemory(existingMemory, extracted.preferences, extracted.confidence);
  
  const existingNorm = existingMemory ? normalizeMemory(existingMemory) : '';
  const mergedNorm = normalizeMemory(merged);
  
  const trulyNew = mergedNorm !== existingNorm;
  
  console.log(`[MemoryExtractor] Extraction complete: confidence=${extracted.confidence.toFixed(2)}, hasNewData=${trulyNew}`);

  return {
    preferences: extracted.preferences,
    confidence: extracted.confidence,
    hasNewData: trulyNew,
  };
}

/**
 * Normalizes a SaveMemoryDto to a string for easy comparison.
 */
function normalizeMemory(memory: SaveMemoryDto): string {
  const sort = (arr: string[] = []) => [...arr].sort().join(',');
  return `${sort(memory.travelPreferences)}|${sort(memory.favoriteFoods)}|${memory.budget || ''}|${sort(memory.transportation)}|${sort(memory.favoriteLocations)}`;
}
