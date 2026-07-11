import { createOpenAIClient } from './client';

export interface QaPair {
  question: string;
  similarQuestion: string;
  answer: string;
  intent: string;
  keywords: string[];
  tags: string[];
  section?: string; // Tên tiêu đề của phần liên quan trong 15 phần của hồ sơ
}

export async function generateQaPairsBatch(
  body: string,
  category: string,
  title: string,
  count: number,
  batchIndex: number
): Promise<QaPair[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const openai = createOpenAIClient(apiKey);
      const prompt = `Bạn là chuyên gia huấn luyện AI du lịch Việt Nam chuyên nghiệp.
Hãy đọc kỹ hồ sơ tri thức của "${title}" dưới đây:
"${body}"

Nhiệm vụ:
Hãy sinh ra đúng ${count} cặp câu hỏi-đáp án mẫu (đợt thứ ${batchIndex + 1}) dựa trên dữ liệu trên.

Yêu cầu đối với mỗi cặp:
1. "question": Một câu hỏi thực tế của khách du lịch liên quan đến ${title}.
2. "similarQuestion": Câu hỏi tương tự (Q2Q) diễn đạt theo cách khác (paraphrase).
3. "answer": Câu trả lời chi tiết (Q2A) dài từ 200 đến 600 từ (nếu là câu hỏi mở cần thuyết minh chi tiết như hướng dẫn viên du lịch chuyên nghiệp, giọng văn cuốn hút, tự nhiên; nêu bật lịch sử, văn hóa, cảnh đẹp, món ăn, thời điểm đẹp, lưu ý phù hợp. Không tự bịa thông tin ngoài bối cảnh đã cho).
4. "intent": Ý định của câu hỏi (Ví dụ: "find_location", "check_weather", "ask_food").
5. "keywords": Mảng các từ khóa chính liên quan.
6. "tags": Mảng các nhãn phân loại (Ví dụ: ["${title.toLowerCase()}", "di-chuyen"]).
7. "section": Tên tiêu đề của phần trong 15 phần của hồ sơ tri thức mà câu hỏi/câu trả lời này tập trung khai thác nhiều nhất (ví dụ: "Tổng quan", "Món ăn đặc sản", "Hướng dẫn di chuyển", v.v. Viết chính xác tên tiêu đề phần, không được kèm số thứ tự đầu dòng).

Hãy trả về duy nhất chuỗi JSON là một đối tượng chứa thuộc tính "qaPairs" là mảng gồm ${count} đối tượng có cấu trúc chính xác sau:
{
  "qaPairs": [
    {
      "question": "...",
      "similarQuestion": "...",
      "answer": "...",
      "intent": "...",
      "keywords": ["...", "..."],
      "tags": ["...", "..."],
      "section": "..."
    }
  ]
}`;

      const response = await callOpenAIWithRetry(openai, {
        model: process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      });

      const resText = response.choices[0].message.content?.trim() || '{}';
      const cleanJson = cleanJsonString(resText);
      const parsed = JSON.parse(cleanJson);
      
      if (parsed && Array.isArray(parsed.qaPairs)) {
        return parsed.qaPairs;
      }
      
      // Fallback nếu không có trường qaPairs
      const firstBracket = cleanJson.indexOf('[');
      const lastBracket = cleanJson.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        const jsonBlock = cleanJson.substring(firstBracket, lastBracket + 1);
        return JSON.parse(jsonBlock);
      }
    } catch (err) {
      console.warn(`[Generate/QaPairs] Batch ${batchIndex + 1} failed, using fallback:`, err);
    }
  }

  return generateLocalQaFallback(title, category, count, batchIndex);
}

function generateLocalQaFallback(title: string, category: string, count: number, batchIndex: number): QaPair[] {
  const list: QaPair[] = [];
  const sections = [
    "Tổng quan", "Lịch sử hình thành", "Giá trị văn hóa", "Điểm nổi bật", 
    "Những trải nghiệm không nên bỏ lỡ", "Địa điểm tham quan liên quan", 
    "Món ăn đặc sản", "Hoạt động nổi bật", "Lễ hội", "Thời điểm đẹp nhất để tham quan", 
    "Hướng dẫn di chuyển", "Chi phí tham khảo", "Đối tượng phù hợp", 
    "Lưu ý khi tham quan", "Các câu hỏi thường gặp (FAQ)"
  ];
  
  for (let i = 1; i <= count; i++) {
    const idx = batchIndex * count + i;
    const secIndex = idx % sections.length;
    const sectionName = sections[secIndex];
    list.push({
      question: `Hỏi về đặc điểm nổi bật liên quan đến ${sectionName} của địa danh ${title}?`,
      similarQuestion: `Khám phá những nét đặc sắc về ${sectionName} liên quan đến du lịch ${title}?`,
      answer: `Chào bạn! Tôi là trợ lý du lịch AI. Về phần ${sectionName} của địa danh ${title}, đây là nội dung chi tiết nằm trong tài liệu hướng dẫn tham quan hữu ích giúp bạn có trải nghiệm trọn vẹn tại địa phương.`,
      intent: 'ask_general_info',
      keywords: [title.toLowerCase(), 'du lich', category, sectionName.toLowerCase()],
      tags: [category, title.toLowerCase(), sectionName.toLowerCase()],
      section: sectionName
    });
  }
  return list;
}

function cleanJsonString(str: string): string {
  let result = '';
  let inString = false;
  let escape = false;
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    
    if (char === '"' && !escape) {
      inString = !inString;
      result += char;
    } else if (char === '\\' && inString) {
      escape = !escape;
      result += char;
    } else {
      escape = false;
      if (inString) {
        if (char === '\n') {
          result += '\\n';
        } else if (char === '\r') {
          result += '\\r';
        } else if (char === '\t') {
          result += '\\t';
        } else if (char.charCodeAt(0) < 32) {
          // Bỏ qua các ký tự điều khiển không hợp lệ khác
        } else {
          result += char;
        }
      } else {
        result += char;
      }
    }
  }
  return result;
}

async function callOpenAIWithRetry(openai: any, params: any, maxRetries = 5): Promise<any> {
  let delayMs = 2000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await openai.chat.completions.create(params);
    } catch (err: any) {
      const isRateLimit = err.status === 429 || 
                          (err.message && err.message.includes('429')) || 
                          (err.code && err.code === 'rate_limit_exceeded');
                          
      if (isRateLimit && attempt < maxRetries) {
        let retryAfter = 5000;
        if (err.headers && err.headers['retry-after']) {
          retryAfter = (parseInt(err.headers['retry-after']) + 1) * 1000;
        } else {
          retryAfter = delayMs * attempt;
        }
        console.warn(`⚠️ Gặp Rate Limit (429). Đang chờ ${retryAfter / 1000} giây trước khi thử lại (Lần thử ${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter));
      } else {
        throw err;
      }
    }
  }
}
