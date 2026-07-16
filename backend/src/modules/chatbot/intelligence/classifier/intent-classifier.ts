import { ChatbotIntent, IntentResult } from '../interfaces/intelligence.interfaces';
import { removeDiacritics } from '../../../ai-agents/utils/agent.utils';

export class IntentClassifier {
  /**
   * Classify user query intent and determine secondary options
   */
  classify(query: string): IntentResult {
    const clean = removeDiacritics(query.toLowerCase());

    // 1. Itinerary Planning Intent
    const itineraryKeywords = [
      'lich trinh', 'ke hoach', 'len lich', 'lap ke hoach', 'di tour', 'tour du lich',
      'chuyen di', 'lap hanh trinh', 'phuot', 'di may ngay', 'hanh trinh tu'
    ];
    if (itineraryKeywords.some(kw => clean.includes(kw))) {
      return {
        intent: 'ITINERARY_PLAN',
        confidence: 0.9,
        alternativeIntent: 'RECOMMENDATION',
        reason: 'Detected itinerary planning keywords.',
        needSlot: !clean.includes('ngay'), // If no "ngày" mentioned, it might need duration slot
        answerImmediately: false,
        continuePreviousConversation: false,
      };
    }

    // 2. Recommendation / Discovery Intent
    const recKeywords = [
      'dia diem', 'diem den', 'cho choi', 'noi choi', 'an gi', 'am thuc', 'dac san',
      'mon an', 'quan an', 'canh dep', 'checkin', 'cho nao dep', 'co gi vui',
      'du lich', 'noi du lich', 'diem du lich', 'cho du lich', 'diem den du lich'
    ];
    if (recKeywords.some(kw => clean.includes(kw))) {
      return {
        intent: 'RECOMMENDATION',
        confidence: 0.88,
        alternativeIntent: 'GENERAL_QA',
        reason: 'Detected destination recommendation or food discovery keywords.',
        needSlot: false,
        answerImmediately: true,
        continuePreviousConversation: true,
      };
    }

    // 3. Default: General QA
    return {
      intent: 'GENERAL_QA',
      confidence: 0.85,
      alternativeIntent: 'UNKNOWN',
      reason: 'General conversational text or greeting detected.',
      needSlot: false,
      answerImmediately: true,
      continuePreviousConversation: true,
    };
  }
}
