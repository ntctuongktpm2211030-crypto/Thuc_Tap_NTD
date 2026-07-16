import { ResponsePlan, ConversationState } from './types/dialogue.types';

/**
 * Natural Writing Rules for the AI Travel Assistant.
 * Business rules configured here — not embedded in prompts.
 * The LLM only transforms structured data into natural language.
 */
const NATURAL_WRITING_RULES = `
📝 QUY TẮC VIẾT TỰ NHIÊN (YÊU CẦU BẮT BUỘC):

1. GIỌNG VĂN:
   - Viết như hướng dẫn viên du lịch địa phương, thân thiện và nhiệt huyết
   - Sinh động, cuốn hút, có cảm xúc
   - Không viết như Wikipedia hay sách giáo khoa

2. KHÔNG ĐƯỢC VIẾT:
   - "Cảm ơn bạn đã chia sẻ" nếu người dùng chưa chia sẻ thông tin cá nhân
   - Diện tích, dân số, vị trí địa lý, đơn vị hành chính khi người dùng hỏi "đi đâu chơi"
   - Các đoạn văn quá dài — nên xuống dòng, dùng bullet hợp lý
   - Lịch trình sáng/trưa/chiều/tối nếu người dùng không yêu cầu

3. ƯU TIÊN:
   - Trải nghiệm thực tế → Điểm nổi bật → Hoạt động → Lời khuyên
   - Mỗi địa điểm nên có: mô tả ngắn, điểm nổi bật, hoạt động, phù hợp với ai, thời gian tham quan
   - Nếu thiếu thông tin, hãy hỏi lại thay vì tự suy đoán

4. ĐỊNH DẠNG:
   - 3-5 đoạn ngắn, dễ đọc
   - Dùng dấu đầu dòng (bullet) khi liệt kê
   - In đậm các tên địa điểm, món ăn, hoạt động chính
`;

/**
 * PromptComposerService builds LLM prompts from structured data.
 *
 * Responsibilities:
 * - Compose system prompt from writing rules + conversation state
 * - Compose user prompt from ResponsePlan + retrieved context + citations
 * - NEVER embed business logic in prompts
 * - The LLM only transforms structured data into natural language
 */
export class PromptComposerService {
  /**
   * Compose the system prompt for the LLM.
   * This sets the LLM's persona and constraints.
   */
  composeSystem(params: {
    destination?: string | null;
    role?: string;
    hasUserMemory?: boolean;
  }): string {
    const { destination, role, hasUserMemory } = params;
    const roleDesc = role || 'chuyên gia tư vấn du lịch';

    let prompt = `Bạn là ${roleDesc} của SmartTravel.`;
    prompt += `\nNhiệm vụ của bạn là dựa trên thông tin được cung cấp để tư vấn cho người dùng một cách tự nhiên, thân thiện và chính xác.`;

    if (destination) {
      prompt += `\n\nĐịa điểm đang được hỏi: ${destination}.`;
    }

    if (hasUserMemory) {
      prompt += `\n\nNgười dùng đã có lịch sử sở thích trong hệ thống. Hãy ưu tiên gợi ý phù hợp với sở thích đã ghi nhận.`;
    }

    prompt += NATURAL_WRITING_RULES;
    return prompt;
  }

  /**
   * Compose the user prompt from a ResponsePlan and context.
   * The LLM only needs to convert the plan into natural language.
   */
  composeUserPrompt(params: {
    plan: ResponsePlan;
    userInput: string;
    ragContext: string;
    citations: Array<{ title: string; sourceName: string; sourceUrl: string }>;
  }): string {
    const { plan, userInput, ragContext, citations } = params;

    const citationBlock = citations.length > 0
      ? `\nDANH SÁCH NGUỒN THAM KHẢO:\n${citations
          .map((c, i) => `[${i + 1}] ${c.title} — ${c.sourceName}${c.sourceUrl ? ` (${c.sourceUrl})` : ''}`)
          .join('\n')}`
      : '';

    return `Dựa trên KẾ HOẠCH TRẢ LỜI dưới đây, hãy viết một câu trả lời tự nhiên, sinh động bằng tiếng Việt.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KẾ HOẠCH TRẢ LỜI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Loại câu trả lời: ${plan.answerType}
Tiêu đề: ${plan.title}

Mô tả: ${plan.shortDescription}

${plan.places.length > 0 ? `ĐỊA ĐIỂM:\n${plan.places.map(p => `• ${p.name}: ${p.shortDescription}`).join('\n')}` : ''}

${plan.foods.length > 0 ? `MÓN ĂN:\n${plan.foods.map(f => `• ${f.name}: ${f.description}`).join('\n')}` : ''}

${plan.events.length > 0 ? `SỰ KIỆN:\n${plan.events.map(e => `• ${e.name}: ${e.description}`).join('\n')}` : ''}

Điểm nổi bật:
${plan.highlights.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Hoạt động:
${plan.activities.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Phù hợp với: ${plan.suitableFor.join(', ') || 'Mọi đối tượng'}
Thời gian tham quan: ${plan.visitDuration}
Mùa đẹp nhất: ${plan.bestSeason}
Khoảng cách: ${plan.distance}

TÀI LIỆU THAM KHẢO (RAG Context):
${ragContext}
${citationBlock}

YÊU CẦU KHÁC:
- Sử dụng tham chiếu [1], [2],... khi nhắc đến thông tin từ tài liệu tham khảo
- Độ dài: 3-5 đoạn ngắn, dễ đọc

Câu hỏi gốc của người dùng: "${userInput}"`;
  }

  /**
   * Compose a simple follow-up prompt for when no specific plan is available.
   */
  composeFollowUpPrompt(userInput: string): string {
    return `Người dùng hỏi: "${userInput}"

Hãy trả lời một cách tự nhiên, thân thiện. Nếu chưa hiểu rõ yêu cầu, hãy hỏi lại để làm rõ.
${NATURAL_WRITING_RULES}`;
  }
}
