import { AIMemory } from '@prisma/client';
import { callAgentLLM, getLLMConfig } from '../../ai-agents/utils/agent.utils';

export async function generateChatbotResponse(
  history: { role: string; content: string }[],
  memory: AIMemory | null
): Promise<string> {
  const { apiKey } = getLLMConfig();

  let systemPrompt = `Bạn là trợ lý ảo cao cấp của ứng dụng SmartTravel, chuyên giúp người dùng lên kế hoạch hành trình, tìm khách sạn, điểm đến và chia sẻ văn hóa ẩm thực địa phương. Hãy trả lời thân thiện, hữu ích bằng tiếng Việt.`;
  
  if (memory) {
    systemPrompt += `\n\nĐây là thông tin ghi nhớ về sở thích và thói quen của người dùng, hãy ưu tiên gợi ý phù hợp với thông tin này:
- Sở thích du lịch: ${memory.travelPreferences.join(', ') || 'Chưa rõ'}
- Món ăn yêu thích: ${memory.favoriteFoods.join(', ') || 'Chưa rõ'}
- Ngân sách: ${memory.budget || 'Chưa rõ'}
- Phương tiện di chuyển: ${memory.transportation.join(', ') || 'Chưa rõ'}
- Địa điểm yêu thích: ${memory.favoriteLocations.join(', ') || 'Chưa rõ'}`;
  }

  if (!apiKey) {
    return generateFallbackChatbotResponse(history, memory);
  }

  try {
    const lastUserMsg = history.slice().reverse().find(m => m.role === 'user')?.content || 'Xin chào';
    const recentHistory = history.slice(0, history.length - 1);
    return await callAgentLLM(systemPrompt, lastUserMsg, recentHistory);
  } catch (error) {
    console.error('❌ Lỗi kết nối Gemini LLM:', error);
    return generateFallbackChatbotResponse(history, memory);
  }
}

function generateFallbackChatbotResponse(
  history: { role: string; content: string }[],
  memory: AIMemory | null
): string {
  const lastUserMessage = history
    .slice()
    .reverse()
    .find((m) => m.role === 'user')?.content.toLowerCase() || '';

  const favFoods = memory?.favoriteFoods.join(', ') || 'các món ăn đường phố';
  const favPlaces = memory?.favoriteLocations.join(', ') || 'các bãi biển hoặc vùng núi cao';
  const budget = memory?.budget || 'trung bình';
  const transport = memory?.transportation.join(', ') || 'xe máy';
  const prefs = memory?.travelPreferences.join(', ') || 'khám phá thiên nhiên';

  if (lastUserMessage.includes('ăn') || lastUserMessage.includes('uống') || lastUserMessage.includes('món')) {
    return `[Trí tuệ nhân tạo giả lập] Chào bạn! Dựa trên sở thích ẩm thực của bạn (${favFoods}), tôi khuyên bạn nên thử Phở Bò Lý Quốc Sư ở Hà Nội hoặc Bánh mì Phượng khi ghé thăm Hội An. Chúng cực kỳ thích hợp cho khẩu vị của bạn!`;
  }

  if (lastUserMessage.includes('đi đâu') || lastUserMessage.includes('địa điểm') || lastUserMessage.includes('du lịch')) {
    return `[Trí tuệ nhân tạo giả lập] Tôi thấy bạn rất thích ghé thăm các địa điểm như: ${favPlaces}. Nếu bạn có kế hoạch đi tiếp, hãy cân nhắc tham gia cung đường Hà Giang Loop hoặc tham quan Vịnh Hạ Long, cực kỳ phù hợp với gu du lịch của bạn!`;
  }

  if (lastUserMessage.includes('tiền') || lastUserMessage.includes('ngân sách') || lastUserMessage.includes('chi phí')) {
    return `[Trí tuệ nhân tạo giả lập] Với ngân sách ở mức "${budget}", bạn có thể tiết kiệm chi phí bằng cách di chuyển bằng: ${transport} và lựa chọn các homestay địa phương thay vì khách sạn 5 sao.`;
  }

  if (lastUserMessage.includes('phương tiện') || lastUserMessage.includes('di chuyển') || lastUserMessage.includes('xe')) {
    return `[Trí tuệ nhân tạo giả lập] Theo bộ nhớ của tôi, phương tiện du lịch yêu thích của bạn là: ${transport}. Đi phượt bằng phương tiện này sẽ giúp bạn chủ động ngắm cảnh đẹp dọc đường hơn rất nhiều!`;
  }

  if (lastUserMessage.includes('sở thích') || lastUserMessage.includes('thói quen') || lastUserMessage.includes('memory')) {
    return `[Trí tuệ nhân tạo giả lập] Tôi đã ghi nhớ sở thích của bạn: 
- Thói quen du lịch: ${prefs}
- Món ăn yêu thích: ${favFoods}
- Địa điểm ưa thích: ${favPlaces}
- Phương tiện lựa chọn: ${transport}
- Ngân sách dự kiến: ${budget}
Bạn có muốn tôi thay đổi hay cập nhật mục nào không?`;
  }

  return `[Trí tuệ nhân tạo giả lập] Cảm ơn bạn đã trò chuyện cùng SmartTravel AI Chatbot! Dựa vào bộ nhớ AI của bạn (thích ${prefs} và di chuyển bằng ${transport}), hãy cho tôi biết bạn đang muốn lên kế hoạch đi đâu tiếp theo nhé!`;
}
