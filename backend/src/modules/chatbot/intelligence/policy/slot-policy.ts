import { ChatbotIntent } from '../interfaces/intelligence.interfaces';

export class SlotPolicy {
  /**
   * Applies the "Answer First, Ask Later" policy for missing slots
   */
  apply(
    intent: ChatbotIntent,
    needSlot: boolean
  ): {
    actionType: 'RECOMMEND' | 'PLAN_ITINERARY' | 'ANSWER_GENERAL';
    clarificationPrompt?: string;
  } {
    // If user wants to plan a trip but didn't specify duration, do NOT ask immediately.
    // Instead, recommend top spots for their destination first, and ask for duration at the end.
    if (intent === 'ITINERARY_PLAN' && needSlot) {
      return {
        actionType: 'RECOMMEND',
        clarificationPrompt:
          'Bạn hãy gợi ý trước 3 địa điểm du lịch nổi tiếng nhất tại địa danh này để thỏa mãn nhu cầu thông tin của họ. Sau đó, ở cuối câu trả lời, hãy khéo léo hỏi xem họ định đi du lịch mấy ngày để bạn lập lịch trình chi tiết.',
      };
    }

    if (intent === 'ITINERARY_PLAN') {
      return {
        actionType: 'PLAN_ITINERARY',
      };
    }

    if (
      intent === 'RECOMMENDATION' ||
      intent === 'RECOMMENDATION_MORE' ||
      intent === 'RECOMMENDATION_REPLACE' ||
      intent === 'RECOMMENDATION_REFINE'
    ) {
      return {
        actionType: 'RECOMMEND',
      };
    }

    return {
      actionType: 'ANSWER_GENERAL',
    };
  }
}
