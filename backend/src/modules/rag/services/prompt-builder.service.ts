import { RetrievedDoc } from '../types/rag.types';
import seasonsData from '../../../data/travel_seasons_63_provinces.json';

export class PromptBuilderService {
  /**
   * Xây dựng prompt tích hợp ngữ cảnh tri thức (Context) dành cho LLM
   */
  build(query: string, docs: RetrievedDoc[]): string {
    let contextText = '';

    if (docs.length > 0) {
      contextText = docs
        .map((doc, idx) => {
          return `Tài liệu ${idx + 1} [Danh mục: ${doc.category}] (Tiêu đề: ${doc.title}):\n"${doc.content}"`;
        })
        .join('\n\n');
    } else {
      contextText = 'Không tìm thấy tài liệu ngữ cảnh nào liên quan trực tiếp trong cơ sở dữ liệu tri thức.';
    }

    // Check if query matches any of the 63 provinces or highlights
    const lowerQuery = query.toLowerCase();
    const matchedSeason = seasonsData.find(s =>
      lowerQuery.includes(s.province_name.toLowerCase()) ||
      s.highlights.toLowerCase().split(/,\s*/).some(h => h.length > 3 && lowerQuery.includes(h.toLowerCase()))
    );

    let seasonContext = '';
    if (matchedSeason) {
      seasonContext = `\n\n[Dữ liệu Thời điểm Du lịch & Trải nghiệm 63 Tỉnh Thành - ${matchedSeason.province_name.toUpperCase()}]
- Vùng miền: ${matchedSeason.region_name} (${matchedSeason.region_code})
- Thời gian du lịch lý tưởng: ${matchedSeason.ideal_period_text} (Các tháng: ${matchedSeason.ideal_months.join(', ')})
- Mùa du lịch chính: ${matchedSeason.primary_season}
- Trải nghiệm & Điểm nhấn: ${matchedSeason.highlights}
- Nguồn trích dẫn / Căn cứ: ${matchedSeason.reference_source}
- Cổng thông tin chính thức: ${matchedSeason.official_website}`;
    }

    const prompt = `Bạn là trợ lý du lịch AI thông minh của SmartTravel. Hãy sử dụng thông tin ngữ cảnh (Context) dưới đây để trả lời câu hỏi của người dùng một cách đầy đủ, chính xác và tự nhiên bằng tiếng Việt. Nếu ngữ cảnh được cung cấp không đủ thông tin, hãy sử dụng thêm kiến thức chuyên môn về du lịch của bạn để bổ trợ và giải đáp chu đáo cho người dùng.

[Bối cảnh tri thức được truy xuất (Context)]
${contextText}${seasonContext}

[Câu hỏi của người dùng]
"${query}"

[Hướng dẫn trả lời]
Hãy trả lời trực tiếp câu hỏi dựa trên bối cảnh trên, trích dẫn thời điểm du lịch lý tưởng và các tiêu đề tài liệu nếu cần thiết để tăng tính xác thực và đáng tin cậy.`;

    return prompt;
  }
}
