import { EmotionAnalysis, ChatbotEmotion } from '../interfaces/intelligence.interfaces';
import { removeDiacritics } from '../../../ai-agents/utils/agent.utils';

export class EmotionAnalyzer {
  private lexicons: Record<ChatbotEmotion, string[]> = {
    bored: ['chan', 'chan ngat', 'nhat nheo', 'te nhat', 'chang co gi', 'chan qua', 'khong co gi hot'],
    frustrated: ['buc', 'toi te', 'kem', 'te qua', 'vo van', 'vo ly', 'bực', 'kém cỏi', 'đợi lâu', 'phiên'],
    disappointed: ['that vong', 'xau', 'binh thuong', 'khong nhu mong doi', 'chán đời', 'thất vọng'],
    impatient: ['nhanh len', 'gap', 'ngay', 'luon di', 'voi', 'luôn', 'ngay lập tức', 'nóng ruột'],
    excited: ['hay qua', 'tuyet', 'thich the', 'muon di ngay', 'phấn khích', 'tuyệt vời', 'đẹp quá'],
    confused: ['khong hieu', 'la sao', 'nghia la gi', 'mo ho', 'nhầm lẫn', 'lùng bùng', 'rối'],
    urgent: ['gấp', 'khẩn cấp', 'ngay lập tức', 'gap rut', 'khan cap'],
    friendly: ['cảm ơn', 'cam on', 'thank', 'dễ thương', 'than thien', 'tốt bụng'],
    neutral: []
  };

  /**
   * Fast lexical analysis of user query sentiment and emotion categories
   */
  analyze(query: string): EmotionAnalysis {
    const cleanQuery = removeDiacritics(query.toLowerCase());

    for (const [emotion, words] of Object.entries(this.lexicons)) {
      if (emotion === 'neutral') continue;

      for (const word of words) {
        if (cleanQuery.includes(word)) {
          // Found exact emotional keyword
          return {
            emotion: emotion as ChatbotEmotion,
            confidence: 0.95,
            intensity: cleanQuery.includes('rat') || cleanQuery.includes('qua') || cleanQuery.includes('ngat') ? 0.9 : 0.7,
            reason: `Matched Vietnamese emotional keyword: "${word}"`,
          };
        }
      }
    }

    // Default Fallback
    return {
      emotion: 'neutral',
      confidence: 1.0,
      intensity: 0.5,
      reason: 'No strong emotional markers detected.',
    };
  }
}
