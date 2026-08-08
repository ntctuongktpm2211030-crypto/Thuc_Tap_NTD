import prisma from '../../../config/db';
import { Citation, IntentResult } from '../types/agent.types';
import { logger } from '../../../utils/logger';

/** Default timeout for LLM fetch calls (ms) */
const LLM_TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS || '30000', 10);

/** Creates an AbortSignal that times out after the configured LLM timeout */
function createAbortSignal(): AbortSignal {
  return AbortSignal.timeout(LLM_TIMEOUT_MS);
}

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
  history: { role: string; content: string }[] = [],
  requestId?: string
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
    signal: createAbortSignal(),
  });

  if (!response.ok) {
    const errText = await response.text();
    logger.error('callNativeGemini', 'API error', { status: response.status, error: errText.substring(0, 200) }, requestId);
    throw new Error(`Native Gemini API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as any;

  // Gemini returns usageMetadata with token counts
  if (data?.usageMetadata) {
    logger.info('callNativeGemini', 'Token usage',
      {
        model,
        promptTokens: data.usageMetadata.promptTokenCount || 0,
        candidatesTokens: data.usageMetadata.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata.totalTokenCount || 0,
      },
      requestId
    );
  }

  if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text.trim();
  }
  
  throw new Error('Native Gemini API returned empty response.');
}

/**
 * Lấy cấu hình LLM hợp nhất, ưu tiên Gemini API làm provider chính
 */
export function getLLMConfig() {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  const apiKey = (geminiKey && geminiKey !== 'your_gemini_key_here' && geminiKey !== 'your_openai_key_here') ? geminiKey : '';
  const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-2.0-flash';
  const provider = 'gemini';

  return { apiKey, modelName, provider };
}

/**
 * Uses a lightweight LLM call to classify travel query intents and extract destinations.
 * Returns IntentResult with confidence score (0.0–1.0).
 */
export async function classifyIntentWithLLM(input: string): Promise<IntentResult> {
  const { apiKey, modelName, provider } = getLLMConfig();
  if (!apiKey) {
    return { intent: 'travel', destination: null, confidence: 0.3 };
  }

  const normalizedInput = normalizeSlang(input);

  try {
    logger.debug('classifyIntentWithLLM', 'Using Gemini for intent classification', { model: modelName, provider });
    const prompt = `Phân loại ý định, trích xuất địa danh và đánh giá độ tin cậy. Trả về DUY NHẤT một JSON hợp lệ:\n{\n  \"intent\": \"food\"|\"culture\"|\"recommendation\"|\"travel\"|\"unknown\",\n  \"destination\": string|null,\n  \"confidence\": 0.0-1.0,\n  \"reasoning\": \"lý do ngắn\"\n}\nCâu hỏi: ${normalizedInput}`;
    const rawResponse = await callNativeGemini(apiKey, modelName, '', prompt);
    const cleanContent = rawResponse.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const result = JSON.parse(cleanContent);
    return {
      intent: result.intent || 'unknown',
      destination: result.destination || null,
      confidence: typeof result.confidence === 'number' ? Math.max(0, Math.min(1, result.confidence)) : 0.5,
      reasoning: result.reasoning || undefined,
    };
  } catch (err: any) {
    logger.warn('classifyIntentWithLLM', 'Gemini intent classification failed', { error: err.message, provider });
    return { intent: 'unknown', destination: null, confidence: 0.1, reasoning: 'Classification failed' };
  }
}

/**
 * Calls Gemini API with a system prompt, user prompt, and conversation history.
 */
export async function callAgentLLM(
  systemPrompt: string,
  userPrompt: string,
  history: { role: string; content: string }[] = [],
  requestId?: string
): Promise<string> {
  const { apiKey, modelName, provider } = getLLMConfig();
  if (!apiKey) {
    throw new Error('Chưa cấu hình GEMINI_API_KEY cho hệ thống. Vui lòng kiểm tra file .env.');
  }

  logger.debug('callAgentLLM', 'Executing Gemini LLM request', { model: modelName, provider }, requestId);
  try {
    return await callNativeGemini(apiKey, modelName, systemPrompt, userPrompt, history, requestId);
  } catch (err: any) {
    logger.error('callAgentLLM', 'Gemini LLM request failed', { error: err.message }, requestId);
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
  let lower = name.toLowerCase();
  const accentedPrefixes = [
    'tỉnh ', 'thành phố ', 'tp. ', 'tp ', 'huyện ', 'xã ',
    'đảo ', 'hòn ', 'vịnh ', 'khu du lịch ', 'kdl ', 'mũi ',
    'thác ', 'núi ', 'sông ', 'hồ ', 'suối ', 'chợ ', 'bãi '
  ];
  for (const p of accentedPrefixes) {
    if (lower.startsWith(p)) {
      lower = lower.substring(p.length);
    }
  }

  let clean = removeDiacritics(lower);
  const prefixes = [
    'tinh ', 'thanh pho ', 'tp. ', 'tp ', 'huyen ', 'xa ',
    'dao ', 'hon ', 'khu du lich ', 'kdl ', 'mui ',
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
    const cleanContent = removeDiacritics(content.toLowerCase());
    
    // 1. Quét tìm địa danh xuất hiện trong tin nhắn (chấp nhận viết thường)
    for (const dest of dests) {
      const cleanDest = removeDiacritics(dest.toLowerCase());
      const strippedDest = cleanGeographicName(dest);
      if (
        cleanDest.length > 2 &&
        (cleanContent.includes(cleanDest) || cleanContent.includes(removeDiacritics(strippedDest.toLowerCase())))
      ) {
        return dest;
      }
    }
    
    // 2. Dự phòng: so khớp mờ nguyên câu
    const matched = findFuzzyMatch(content, dests, 0.7);
    if (matched) return matched;
    
    // 3. Dự phòng: regex tìm từ theo sau giới từ
    const match = content.match(/(?:đến|đi|tại|ở|du lịch|khám phá|về|của)\s+([\p{L}\s]{2,15})/iu);
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
    logger.warn('getDynamicRegions', 'Failed to fetch dynamic regions', { error: (err as Error).message });
  }
  return ['Hà Nội', 'Sài Gòn', 'Đà Nẵng', 'Huế', 'Hà Giang'];
}

// ─── CITATION HELPER: Build citation objects from RAG docs ──────────

/**
 * Build citation objects from retrieved RAG documents with relevance filtering.
 * Only includes docs with score >= 0.6 and limits to top 5.
 * Preserves metadata: source, url, title, category, score.
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
    source: d.source || undefined,
    url: d.url || undefined,
  }));
}

/**
 * Build a RAG context string with numbered references for citation in LLM prompts.
 * Includes source attribution so the LLM can reference retrieved documents by [N].
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
      const sourceLine = d.source ? `\n   (${d.source})` : '';
      return `[${idx + 1}] ${d.title}: ${cleanContent}${sourceLine}`;
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

/**
 * Maps popular tourism destinations to their official administrative provinces.
 * Useful for normalizing queries (e.g. "Đà Lạt" -> "Lâm Đồng") before database or RAG lookup.
 */
export function mapTourismToProvince(dest: string): string {
  if (!dest) return dest;
  const clean = removeDiacritics(dest.toLowerCase()).replace(/\s+/g, ' ').trim();
  
  const mapping: Record<string, string> = {
    'da lat': 'Lâm Đồng',
    'sapa': 'Lào Cai',
    'sa pa': 'Lào Cai',
    'phu quoc': 'Kiên Giang',
    'nha trang': 'Khánh Hòa',
    'nha-trang': 'Khánh Hòa',
    'ha long': 'Quảng Ninh',
    'hue': 'Thừa Thiên Huế',
    'vung tau': 'Bà Rịa - Vũng Tàu',
    'sai gon': 'Hồ Chí Minh',
    'tp hcm': 'Hồ Chí Minh',
    'hcm': 'Hồ Chí Minh',
    'ha giang': 'Hà Giang',
    'quy nhon': 'Bình Định',
    'mui ne': 'Bình Thuận',
    'phan thiet': 'Bình Thuận',
    'phong nha': 'Quảng Bình',
    'ke bang': 'Quảng Bình',
    'trang an': 'Ninh Bình',
    'bai dinh': 'Ninh Bình',
    'tam coc': 'Ninh Bình',
    'sam son': 'Thanh Hóa',
    'do son': 'Hải Phòng',
    'cat ba': 'Hải Phòng',
    'co to': 'Quảng Ninh',
    'quan lan': 'Quảng Ninh',
    'my son': 'Quảng Nam',
    'hoi an': 'Quảng Nam',
    'ba na': 'Đà Nẵng',
    'ba na hills': 'Đà Nẵng'
  };

  return mapping[clean] || dest;
}

/**
 * Scans the conversation history to extract names of items (foods/places) 
 * already suggested by the assistant to prevent repetition.
 */
export function extractSuggestedItemsFromHistory(history: { role: string; content: string }[]): string[] {
  const items: string[] = [];
  if (!history || history.length === 0) return items;
  
  const rawRegex = /\*\*(.*?)\*\*/g;

  for (const msg of history) {
    if (msg.role === 'assistant' || msg.role === 'model') {
      let match;
      while ((match = rawRegex.exec(msg.content)) !== null) {
        const cleaned = match[1].replace(/🍜|📍|🏠|🏨/g, '').trim().toLowerCase();
        if (cleaned.length > 2 && cleaned.length < 50) {
          items.push(cleaned);
        }
      }
    }
  }
  return [...new Set(items)];
}
