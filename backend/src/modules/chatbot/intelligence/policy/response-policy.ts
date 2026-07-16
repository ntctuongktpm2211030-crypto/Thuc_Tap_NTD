import { EmotionAnalysis } from '../interfaces/intelligence.interfaces';

export class ResponsePolicy {
  /**
   * Determine tone modifiers and customized system prompt instructions based on user emotions
   */
  resolveTone(emotion: EmotionAnalysis): string {
    const intensityLabel = emotion.intensity > 0.8 ? 'rất cao' : 'vừa phải';

    switch (emotion.emotion) {
      case 'frustrated':
      case 'disappointed':
        return `Người dùng đang cảm thấy thất vọng/bực bội (${intensityLabel}). Bạn HÃY:
1. Mở đầu bằng một câu xin lỗi nhẹ nhàng, đồng cảm và chân thành (Ví dụ: "Rất tiếc vì gợi ý trước chưa làm bạn hài lòng...").
2. Đưa ngay giải pháp hoặc địa điểm thay thế chất lượng tốt nhất.
3. Tuyệt đối KHÔNG hỏi dồn dập nhiều câu hỏi.`;

      case 'bored':
        return `Người dùng đang cảm thấy chán nản (${intensityLabel}). Bạn HÃY:
1. Đưa ra các lựa chọn địa điểm du lịch cực kỳ độc đáo, mới lạ, ít người biết hoặc có tính trải nghiệm cao để kích thích hứng thú.
2. Tránh các địa danh quá phổ thông đã liệt kê trước đó.
3. Dùng ngôn từ lôi cuốn, giàu hình ảnh.`;

      case 'confused':
        return `Người dùng đang cảm thấy mơ hồ/bối rối (${intensityLabel}). Bạn HÃY:
1. Giải thích chi tiết, rõ ràng, chia nhỏ thông tin dưới dạng gạch đầu dòng ngắn gọn.
2. Tránh dùng thuật ngữ kỹ thuật phức tạp, hướng dẫn từng bước đi lại, ăn ở một cách trực quan.`;

      case 'impatient':
      case 'urgent':
        return `Người dùng đang rất vội/khẩn cấp (${intensityLabel}). Bạn HÃY:
1. Trả lời cực kỳ ngắn gọn, súc tích, đi thẳng vào trọng tâm câu hỏi.
2. Không viết các câu chào hỏi rườm rà ở đầu hay cuối phản hồi.`;

      case 'friendly':
        return `Người dùng đang rất vui vẻ/thân thiện. Bạn HÃY:
1. Trả lời một cách nồng nhiệt, nhiệt tình và sử dụng các từ ngữ cởi mở.
2. Gửi lời chúc chuyến đi tốt đẹp.`;

      default:
        return 'Hãy trả lời một cách lịch sự, tự nhiên, khách quan và hữu ích bằng tiếng Việt.';
    }
  }
}
