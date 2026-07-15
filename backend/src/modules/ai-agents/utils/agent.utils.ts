import prisma from '../../../config/db';
import { Citation } from '../types/agent.types';

/**
 * Helper utility to remove Vietnamese diacritics and normalize search text.
 */
export function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/\s*-\s*/g, '-')
    .trim();
}

/**
 * Calculates the Levenshtein distance between two strings.
 */
function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }
  return costs[s2.length];
}

/**
 * Returns string similarity score between 0.0 and 1.0.
 */
export function getSimilarity(s1: string, s2: string): number {
  const norm1 = removeDiacritics(s1);
  const norm2 = removeDiacritics(s2);
  let longer = norm1;
  let shorter = norm2;
  if (norm1.length < norm2.length) {
    longer = norm2;
    shorter = norm1;
  }
  const longerLength = longer.length;
  if (longerLength === 0) {
    return 1.0;
  }
  return (longerLength - getEditDistance(longer, shorter)) / longerLength;
}

/**
 * Finds the best match for an input in a list of targets using a similarity threshold.
 */
export function findFuzzyMatch(input: string, targets: string[], threshold: number = 0.6): string | null {
  let bestMatch: string | null = null;
  let bestScore = 0;

  const cleanInput = removeDiacritics(input);

  for (const target of targets) {
    const cleanTarget = removeDiacritics(target);
    
    // Check if direct substring match
    if (cleanInput.includes(cleanTarget) || cleanTarget.includes(cleanInput)) {
      return target;
    }

    const score = getSimilarity(cleanInput, cleanTarget);
    if (score > bestScore && score >= threshold) {
      bestScore = score;
      bestMatch = target;
    }
  }

  return bestMatch;
}

let slangRules: any = null;
try {
  slangRules = require('../config/slang-dictionary.json');
} catch (_) {}

/**
 * Chuẩn hóa từ lóng internet hoặc phương ngữ vùng miền phổ biến tải động từ file JSON
 */
export function normalizeSlang(text: string): string {
  if (!text) return '';
  if (!slangRules || !slangRules.slangMap) return text;
  
  let result = text;
  const sortedKeys = Object.keys(slangRules.slangMap).sort((a, b) => b.length - a.length);
  
  for (const slang of sortedKeys) {
    const replacement = slangRules.slangMap[slang];
    const escapedSlang = slang.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?:^|\\s)(${escapedSlang})(?:[.,!?]|\\s|$)`, 'gi');
    
    result = result.replace(regex, (match, p1) => {
      return match.replace(p1, replacement);
    });
  }
  return result;
}

/**
 * Gọi API Gemini trực tiếp bằng REST để đảm bảo hoạt động ổn định với mọi định dạng API Key (kể cả khóa AQ. từ Google AI Studio)
 */
export async function callNativeGemini(
  key: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  history: { role: string; content: string }[] = []
): Promise<string> {
  const contents: any[] = [];
  
  // Chuyển đổi lịch sử chat sang định dạng Gemini
  for (const msg of history) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    });
  }
  
  contents.push({
    role: 'user',
    parts: [{ text: userPrompt }]
  });

  const bodyPayload: any = {
    contents,
  };

  if (systemPrompt) {
    bodyPayload.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Native Gemini API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as any;
  if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text.trim();
  }
  
  throw new Error('Native Gemini API returned empty response.');
}

/**
 * Lấy cấuụ hình LLM hợp nhất, ưu tiên Groq/OpenAI, fallback sang Gemini
 */
export function getLLMConfig() {
  let apiKey = process.env.OPENAI_API_KEY;
  let baseURL = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1';
  let modelName = process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini';

  const geminiKey = process.env.GEMINI_API_KEY;
  const useGeminiInitially = !!(geminiKey && (!apiKey || apiKey === 'your_openai_key_here' || apiKey.startsWith('AIzaSy') || process.env.USE_GEMINI === 'true'));

  if (useGeminiInitially) {
    apiKey = geminiKey;
    baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
    modelName = process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash';
  } else if (apiKey && apiKey.startsWith('AIzaSy')) {
    baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
    modelName = 'gemini-1.5-flash';
  }

  return { apiKey, baseURL, modelName, useGeminiInitially, geminiKey };
}

/**
 * Uses a lightweight LLM call to classify travel query intents and extract destinations.
 * This handles any typos, missing accents, or complex natural language queries.
 */
export async function classifyIntentWithLLM(input: string): Promise<{ intent: 'food' | 'culture' | 'recommendation' | 'travel' | 'unknown'; destination: string | null }> {
  const { apiKey, baseURL, modelName, useGeminiInitially, geminiKey } = getLLMConfig();
  if (!apiKey || apiKey === 'your_openai_key_here') {
    return { intent: 'travel', destination: null };
  }

  const normalizedInput = normalizeSlang(input);

  const makeRequest = async (key: string, base: string, model: string) => {
    const response = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `Bạn là một trợ lý thông minh phân tích ngữ nghĩa câu hỏi du lịch Việt Nam. Hãy đọc câu hỏi của người dùng và thực hiện hai nhiệm vụ sau:

Nhiệm vụ 1: Phân loại ý định của người dùng thành 1 trong 5 nhãn chính xác sau:
- "food": Khi người dùng hỏi về ăn uống, món ăn đặc sản, tìm quán ăn ngon, ẩm thực địa phương.
- "culture": Khi người dùng hỏi về lịch sử, nguồn gốc địa danh, nét văn hóa, lễ hội cổ truyền, đền/chùa/di tích lịch sử.
- "recommendation": Khi người dùng muốn xin gợi ý các địa điểm chơi/du lịch phù hợp sở thích HOẶC khi người dùng muốn đổi địa điểm chơi khác, gợi ý chỗ khác (ví dụ: "cho tôi nơi khác", "chỗ nào đẹp đi chơi", "no de di choi" -> nơi đẹp đi chơi).
- "travel": Khi người dùng hỏi về thời tiết, bản đồ di chuyển, phương tiện đi lại, hoặc cần lên khung lịch trình tham khảo theo ngày (ví dụ: "lên lịch trình", "đi sapa 3 ngày").
- "unknown": Khi tin nhắn của người dùng là các ký tự rác vô nghĩa (ví dụ: "asdfgh", "1234"), câu chào mờ nhạt không rõ mục đích ("alo alo"), hoặc khi câu hỏi hoàn toàn không rõ nghĩa, bạn hoàn toàn không hiểu ý định người dùng muốn làm gì trong ứng dụng du lịch.

Nhiệm vụ 2: Trích xuất tên một địa danh/thành phố du lịch chính xác mà người dùng đang muốn hỏi (ví dụ: "Hà Nội", "Vũng Tàu", "Sapa", "Đà Lạt",...). 
TUYỆT ĐỐI CẤM TỰ Ý ĐOÁN MÒ HOẶC SỬA TÊN: Bạn phải trích xuất chính xác địa danh xuất hiện trong câu hỏi của người dùng. Tuyệt đối không được tự ý sửa tên địa danh của họ sang một địa danh nổi tiếng khác chỉ vì viết gần giống nhau (Ví dụ: người dùng viết 'lai vung' thì phải trích xuất chính xác là 'Lai Vung', TUYỆT ĐỐI CẤM tự ý sửa thành 'Vũng Tàu'; người dùng viết 'cần giờ' thì phải trích xuất chính xác là 'Cần Giờ', TUYỆT ĐỐI CẤM tự ý sửa thành 'Cần Thơ'). Nếu không có địa danh cụ thể nào hoặc câu hỏi mang tính gợi ý chung chung, hãy trả về null.

LƯU Ý NGÔN NGỮ QUAN TRỌNG:
Người dùng Việt Nam thường dùng từ lóng, tiếng lóng chat hoặc phương ngữ miền Nam như "hong", "hông", "khum", "ko", "k" để hỏi phủ định hoặc nghi vấn ở cuối câu (ví dụ: "có món nào ở hòn tằm hong" thực chất là "có món nào ở Hòn Tằm không?"). Bạn phải trích xuất địa danh là "Hòn Tằm" chứ không được trích xuất là "Hòn Tằm Hông" hay "Hòn Tam Hong".

Hãy trả về DUY NHẤT một chuỗi JSON hợp lệ theo định dạng cấu trúc sau (không bao gồm markdown hay văn bản thừa khác):
{
  "intent": "food" | "culture" | "recommendation" | "travel" | "unknown",
  "destination": string | null
}`
          },
          { role: 'user', content: normalizedInput }
        ],
        temperature: 0.1,
        max_tokens: 150,
      })
    });

    if (!response.ok) {
      throw new Error(`Intent Classifier API responded with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    const cleanContent = content.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const result = JSON.parse(cleanContent);
    
    return {
      intent: result.intent || 'travel',
      destination: result.destination || null
    };
  };

  try {
    if (useGeminiInitially) {
      const geminiModel = process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash';
      const prompt = `Hãy phân loại ý định và trích xuất địa danh của câu hỏi sau. 
Hãy chỉ trả về duy nhất một chuỗi JSON hợp lệ theo định dạng:
{
  "intent": "food" | "culture" | "recommendation" | "travel" | "unknown",
  "destination": string | null
}
Câu hỏi: ${normalizedInput}`;
      const rawResponse = await callNativeGemini(apiKey, geminiModel, '', prompt);
      const cleanContent = rawResponse.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      const result = JSON.parse(cleanContent);
      return {
        intent: result.intent || 'travel',
        destination: result.destination || null
      };
    }
    return await makeRequest(apiKey, baseURL, modelName);
  } catch (err: any) {
    console.warn('[classifyIntentWithLLM] Primary intent classification failed:', err.message || err);
    if (!useGeminiInitially && geminiKey && geminiKey !== 'your_gemini_key_here') {
      console.log('[classifyIntentWithLLM] Attempting automatic failover to native Gemini...');
      try {
        const geminiModel = process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash';
        const failoverPrompt = `Hãy phân loại ý định và trích xuất địa danh của câu hỏi sau. 
Hãy chỉ trả về duy nhất một chuỗi JSON hợp lệ theo định dạng:
{
  "intent": "food" | "culture" | "recommendation" | "travel" | "unknown",
  "destination": string | null
}
Câu hỏi: ${normalizedInput}`;
        const rawResponse = await callNativeGemini(geminiKey, geminiModel, '', failoverPrompt);
        const cleanContent = rawResponse.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        const result = JSON.parse(cleanContent);
        return {
          intent: result.intent || 'travel',
          destination: result.destination || null
        };
      } catch (geminiErr: any) {
        console.error('[classifyIntentWithLLM] Failover to native Gemini also failed:', geminiErr.message || geminiErr);
      }
    }
  }

  return { intent: 'travel', destination: null };
}

/**
 * Calls the configured LLM (OpenAI/Groq) with a system prompt, user prompt, and conversation history.
 */
export async function callAgentLLM(
  systemPrompt: string,
  userPrompt: string,
  history: { role: string; content: string }[] = []
): Promise<string> {
  const { apiKey, baseURL, modelName, useGeminiInitially, geminiKey } = getLLMConfig();
  if (!apiKey || apiKey === 'your_openai_key_here') {
    throw new Error('Chưa cấu hình API Key cho LLM. Vui lòng kiểm tra file .env.');
  }

  const recentHistory = history.slice(-6);

  const makeRequest = async (key: string, base: string, model: string) => {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...recentHistory.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
        content: m.content,
      })),
      { role: 'user', content: userPrompt },
    ];

    console.log(`[callAgentLLM] Preparing request for model: ${model} to ${base}`);
    const response = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API responded with status ${response.status}`);
    }

    const data = await response.json() as any;
    if (data && data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content.trim();
    }
    throw new Error('LLM response format is invalid.');
  };

  try {
    if (useGeminiInitially) {
      const geminiModel = process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash';
      return await callNativeGemini(apiKey, geminiModel, systemPrompt, userPrompt, history);
    }
    return await makeRequest(apiKey, baseURL, modelName);
  } catch (err: any) {
    console.warn('[callAgentLLM] Primary LLM request failed:', err.message || err);

    if (!useGeminiInitially && geminiKey && geminiKey !== 'your_gemini_key_here') {
      console.log('[callAgentLLM] Attempting automatic failover to native Gemini...');
      try {
        const geminiModel = process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash';
        return await callNativeGemini(geminiKey, geminiModel, systemPrompt, userPrompt, history);
      } catch (geminiErr: any) {
        console.error('[callAgentLLM] Failover to native Gemini also failed:', geminiErr.message || geminiErr);
      }
    }

    try {
      const fs = require('fs');
      fs.writeFileSync('d:/Thuc_Tap_NDT/backend/llm_error.log', `${new Date().toISOString()} - ERROR: ${err.message || err}\n${err.stack || ''}`);
    } catch (_) {}
    throw err;
  }
}

/**
 * Chuẩn hóa và xóa các tiền tố địa lý phổ biến ở Việt Nam để so khớp chính xác hơn
 */
export function cleanGeographicName(name: string): string {
  let clean = removeDiacritics(name.toLowerCase());
  const prefixes = [
    'tinh ', 'thanh pho ', 'tp. ', 'tp ', 'huyen ', 'xa ',
    'dao ', 'hon ', 'vinh ', 'khu du lich ', 'kdl ', 'mui ',
    'thac ', 'nui ', 'song ', 'ho ', 'suoi ', 'cho ', 'bui '
  ];
  for (const p of prefixes) {
    if (clean.startsWith(p)) {
      clean = clean.substring(p.length);
    }
  }
  return clean.trim();
}

/**
 * Lấy địa danh được thảo luận gần nhất từ lịch sử hội thoại
 */
export function extractLastDestinationFromHistory(
  history: { role: string; content: string }[],
  dests: string[]
): string | null {
  if (!history || history.length === 0) return null;
  
  for (let i = history.length - 1; i >= 0; i--) {
    const content = history[i].content;
    const matched = findFuzzyMatch(content, dests, 0.7);
    if (matched) return matched;
    
    const match = content.match(/(?:đến|đi|tại|ở|du lịch|khám phá|về|của)\s+([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+){0,3})/u);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

// ─── TỐI ƯU CƠ SỞ DỮ LIỆU & RAG CACHING ──────────────────────────

let cachedRegions: string[] | null = null;
let lastCacheTime = 0;

/**
 * Tải danh sách tỉnh thành vùng miền từ Database có cache 1 phút
 */
export async function getDynamicRegions(): Promise<string[]> {
  const now = Date.now();
  if (cachedRegions && (now - lastCacheTime < 60000)) {
    return cachedRegions;
  }
  try {
    const allContent = await prisma.knowledgeContent.findMany({ select: { title: true } });
    const uniqueBaseTitles = Array.from(new Set(allContent.map(c => c.title.split(' - ')[0].trim())));
    const allDestinations = await prisma.destination.findMany({ select: { name: true } });
    const destNames = allDestinations.map(d => d.name);
    const dbRegions = Array.from(new Set([...uniqueBaseTitles, ...destNames])).filter(t => t.length > 0);
    if (dbRegions.length > 0) {
      cachedRegions = dbRegions;
      lastCacheTime = now;
      return cachedRegions;
    }
  } catch (err) {
    console.warn('[getDynamicRegions] Failed to fetch dynamic regions:', err);
  }
  return ['Hà Nội', 'Sài Gòn', 'Đà Nẵng', 'Huế', 'Hà Giang'];
}

// ─── CITATION HELPER: Build citation objects from RAG docs ──────────

/**
 * Build citation objects from retrieved RAG documents with relevance filtering.
 * Only includes docs with score >= 0.6 and limits to top 5.
 */
export function buildCitationsFromDocs(docs: any[], maxCites: number = 5): Citation[] {
  if (!docs || docs.length === 0) return [];

  const filtered = docs
    .filter(d => {
      const score = d.similarity !== undefined ? d.similarity : d.score;
      return score !== undefined && score >= 0.6;
    })
    .sort((a, b) => {
      const scoreA = a.similarity !== undefined ? a.similarity : a.score;
      const scoreB = b.similarity !== undefined ? b.similarity : b.score;
      return (scoreB || 0) - (scoreA || 0);
    })
    .slice(0, maxCites);

  return filtered.map((d, idx) => ({
    id: d.id || `cite-${idx}`,
    title: d.title || 'Nguồn tham khảo',
    content: d.content ? (d.content.length > 300 ? d.content.substring(0, 300) + '...' : d.content) : '',
    category: d.category || 'general',
    score: d.similarity !== undefined ? d.similarity : (d.score || 0),
    similarity: d.similarity || d.score || 0,
    index: idx + 1,
  }));
}

/**
 * Build a RAG context string with numbered references for citation in LLM prompts.
 */
export function buildRagContextWithRefs(docs: any[]): string {
  if (!docs || docs.length === 0) return 'Không tìm thấy tài liệu liên quan.';
  
  return docs
    .filter(d => {
      const score = d.similarity !== undefined ? d.similarity : d.score;
      return score !== undefined && score >= 0.6;
    })
    .slice(0, 5)
    .map((d, idx) => {
      const cleanContent = d.content && d.content.length > 800 ? d.content.substring(0, 800) + '...' : (d.content || '');
      return `[${idx + 1}] ${d.title}: ${cleanContent}`;
    })
    .join('\n\n');
}

// ─── THUẬT TOÁN ĐÁNH GIÁ CHẤT LƯỢNG ĐÁP ÁN (BLEU SCORE) ──────────

function getNGrams(words: string[], n: number): Map<string, number> {
  const nGrams = new Map<string, number>();
  for (let i = 0; i <= words.length - n; i++) {
    const gram = words.slice(i, i + n).join(' ');
    nGrams.set(gram, (nGrams.get(gram) || 0) + 1);
  }
  return nGrams;
}

/**
 * Tính điểm BLEU tương đồng giữa câu hỏi của người dùng và câu hỏi mẫu trong DB
 * Sử dụng chuẩn hóa không dấu tiếng Việt để gia tăng độ chính xác tìm kiếm
 */
export function calculateBleuScore(candidate: string, reference: string): number {
  const candWords = removeDiacritics(candidate).split(/\s+/).filter(w => w.length > 0);
  const refWords = removeDiacritics(reference).split(/\s+/).filter(w => w.length > 0);

  if (candWords.length === 0 || refWords.length === 0) return 0;

  let precisionsSum = 0;
  let count = 0;

  // Sử dụng 1-gram và 2-gram để đánh giá độ chính xác câu ngắn tiếng Việt
  for (let n = 1; n <= 2; n++) {
    if (candWords.length < n || refWords.length < n) continue;
    const candGrams = getNGrams(candWords, n);
    const refGrams = getNGrams(refWords, n);

    let matchCount = 0;
    candGrams.forEach((candCount, gram) => {
      const refCount = refGrams.get(gram) || 0;
      matchCount += Math.min(candCount, refCount);
    });

    const totalCandGrams = candWords.length - n + 1;
    precisionsSum += matchCount / totalCandGrams;
    count++;
  }

  if (count === 0) return 0;
  const averagePrecision = precisionsSum / count;

  // Brevity Penalty (Phạt độ dài nếu câu hỏi quá ngắn so với tham chiếu)
  const c = candWords.length;
  const r = refWords.length;
  const bp = c > r ? 1 : Math.exp(1 - r / c);

  return bp * averagePrecision;
}

/**
 * Tìm câu trả lời tốt nhất dựa trên BLEU Score >= 0.75
 */
export async function findBestBleuMatch(query: string, ragDocs: any[]): Promise<{ answer: string; score: number } | null> {
  if (!ragDocs || ragDocs.length === 0) return null;

  let bestMatch: { answer: string; score: number } | null = null;

  for (const doc of ragDocs) {
    if (!doc.id) continue;
    
    // Tìm các câu hỏi và câu trả lời liên quan tới chunk này
    const dbAnswers = await prisma.knowledgeAnswer.findMany({ where: { contentId: doc.id } });
    const dbQuestions = await prisma.knowledgeQuestion.findMany({ where: { contentId: doc.id } });

    for (const q of dbQuestions) {
      const score = calculateBleuScore(query, q.questionText);
      if (score >= 0.75 && (!bestMatch || score > bestMatch.score)) {
        const answerText = dbAnswers[0]?.answerText || doc.content.split('\n\nCác câu trả lời mẫu:\n')[0] || doc.content;
        bestMatch = { answer: answerText, score };
      }
    }
  }

  return bestMatch;
}
