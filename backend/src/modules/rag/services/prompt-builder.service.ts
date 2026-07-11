import { RetrievedDoc } from '../types/rag.types';

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

    const prompt = `Bạn là trợ lý du lịch AI thông minh của SmartTravel. Hãy sử dụng thông tin ngữ cảnh (Context) dưới đây để trả lời câu hỏi của người dùng một cách đầy đủ, chính xác và tự nhiên bằng tiếng Việt. Nếu ngữ cảnh được cung cấp không đủ thông tin, hãy sử dụng thêm kiến thức chuyên môn về du lịch của bạn để bổ trợ và giải đáp chu đáo cho người dùng.

[Bối cảnh tri thức được truy xuất (Context)]
${contextText}

[Câu hỏi của người dùng]
"${query}"

[Hướng dẫn trả lời]
Hãy trả lời trực tiếp câu hỏi dựa trên bối cảnh trên, trích dẫn các tiêu đề tài liệu nếu cần thiết để tăng tính xác thực và đáng tin cậy.`;

    return prompt;
  }
}
