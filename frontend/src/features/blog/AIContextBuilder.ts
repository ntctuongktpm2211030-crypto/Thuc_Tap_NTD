import { KnowledgeEngine } from './KnowledgeEngine';

export const AIContextBuilder = {
  buildContextForProvince(provinceName: string): string {
    const map = KnowledgeEngine.groupByProvince();
    const items = map.get(provinceName.toUpperCase()) || [];
    if (items.length === 0) {
      return 'Không có dữ liệu tri thức chính thống về địa phương này.';
    }

    // Compile records to construct context window
    return items
      .slice(0, 12)
      .map(item => {
        return `TÊN TƯ LIỆU: ${item.title}\nPHÂN LOẠI: ${item.subCategory}\nTHÔNG TIN CHI TIẾT:\n${item.content}\n====================`;
      })
      .join('\n\n');
  },

  buildSystemPrompt(provinceName: string): string {
    const context = this.buildContextForProvince(provinceName);
    return `Bạn là Trợ lý số chuyên trách Du lịch Việt Nam của Terraholic.
Dưới đây là nguồn tri thức chính thức duy nhất về địa phương "${provinceName}":
----------------------------------------
${context}
----------------------------------------
YÊU CẦU QUAN TRỌNG:
1. Hãy trả lời câu hỏi của người dùng CHỈ dựa trên nguồn tri thức trên.
2. Tuyệt đối KHÔNG sử dụng kiến thức bên ngoài hoặc tự sáng tác các chi tiết không có trong tài liệu.
3. Nếu tài liệu không nhắc tới hoặc không có thông tin, hãy lịch sự từ chối trả lời và nói rõ: "Dữ liệu tri thức hiện tại của chúng tôi không có thông tin chi tiết về phần này."`;
  }
};
