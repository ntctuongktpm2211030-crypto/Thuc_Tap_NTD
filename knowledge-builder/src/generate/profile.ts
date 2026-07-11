import { createOpenAIClient } from './client';

export async function generateKnowledgeProfile(rawText: string, titleHint: string, category: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const openai = createOpenAIClient(apiKey);
      const prompt = `Bạn là một chuyên gia bản địa và hướng dẫn viên du lịch Việt Nam chuyên nghiệp, nhiệt huyết và am hiểu sâu sắc.
Hãy tổng hợp và viết lại đoạn thông tin thô dưới đây thành một "Knowledge Profile" (Hồ sơ tri thức) hoàn chỉnh, mạch lạc và giàu cảm xúc truyền cảm hứng.

[Văn bản thô]
"${rawText}"

[Địa danh/Chủ đề]
"${titleHint}" (Thể loại: ${category})

[Yêu cầu viết]
- Giọng văn: Tự nhiên, sinh động, giống như một hướng dẫn viên du lịch đang thuyết minh.
- Không sao chép nguyên văn, hãy diễn đạt lại trôi chảy.
- Không tự bịa thông tin sai lệch ngoài dữ liệu đầu vào.
- Định dạng bắt buộc phải đầy đủ 15 phần sau dưới dạng Markdown (sử dụng các tiêu đề H3):

### 1. Tổng quan
### 2. Lịch sử hình thành
### 3. Giá trị văn hóa
### 4. Điểm nổi bật
### 5. Những trải nghiệm không nên bỏ lỡ
### 6. Địa điểm tham quan liên quan
### 7. Món ăn đặc sản
### 8. Hoạt động nổi bật
### 9. Lễ hội
### 10. Thời điểm đẹp nhất để tham quan
### 11. Hướng dẫn di chuyển
### 12. Chi phí tham khảo
### 13. Đối tượng phù hợp
### 14. Lưu ý khi tham quan
### 15. Các câu hỏi thường gặp (FAQ)`;

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 3000,
      });

      return response.choices[0].message.content || '';
    } catch (err) {
      console.warn('[Generate/Profile] OpenAI generation failed, using local fallback:', err);
    }
  }

  return generateLocalProfileFallback(rawText, titleHint, category);
}

function generateLocalProfileFallback(rawText: string, titleHint: string, category: string): string {
  return `### 1. Tổng quan
${titleHint} là một điểm đến tuyệt vời thuộc danh mục ${category}.

### 2. Lịch sử hình thành
Được hình thành từ lâu đời và gắn liền với quá trình phát triển của địa phương.

### 3. Giá trị văn hóa
Mang đậm nét bản sắc văn hóa truyền thống của người dân Việt Nam.

### 4. Điểm nổi bật
Cảnh quan thiên nhiên thơ mộng và con người thân thiện.

### 5. Những trải nghiệm không nên bỏ lỡ
Dạo quanh ngắm cảnh và chụp ảnh lưu niệm.

### 6. Địa điểm tham quan liên quan
Các danh thắng lân cận trong khu vực.

### 7. Món ăn đặc sản
Ẩm thực địa phương phong phú và độc đáo.

### 8. Hoạt động nổi bật
Khám phá thiên nhiên, tham gia văn hóa bản địa.

### 9. Lễ hội
Các hoạt động lễ hội truyền thống được tổ chức hàng năm.

### 10. Thời điểm đẹp nhất để tham quan
Nên đi vào mùa khô hoặc các tháng thời tiết mát mẻ.

### 11. Hướng dẫn di chuyển
Có thể di chuyển bằng xe máy, ô tô hoặc xe khách đường dài.

### 12. Chi phí tham khảo
Phù hợp với nhiều mức ngân sách du lịch khác nhau.

### 13. Đối tượng phù hợp
Gia đình, nhóm bạn trẻ, người yêu thích khám phá lịch sử văn hóa.

### 14. Lưu ý khi tham quan
Giữ gìn vệ sinh chung và tôn trọng văn hóa bản địa.

### 15. Các câu hỏi thường gặp (FAQ)
Q: Có nên đi tự túc không?
A: Hoàn toàn có thể đi tự túc dễ dàng.`;
}
