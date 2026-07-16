import { ConversationState, SlotDefinition, TravelSubIntent } from './types/dialogue.types';

/**
 * Predefined slots with Vietnamese/English prompts for each.
 * Used to determine which information is still missing before the assistant can make a good suggestion.
 */
const SLOTS: SlotDefinition[] = [
  {
    name: 'province',
    label: 'Tỉnh/Thành phố',
    labelEn: 'Province/City',
    required: false,
    askQuestion: 'Bạn muốn đi tỉnh/thành phố nào?',
    askQuestionEn: 'Which province/city would you like to visit?',
  },
  {
    name: 'destination',
    label: 'Địa điểm',
    labelEn: 'Destination',
    required: true,
    askQuestion: 'Bạn muốn đi địa điểm du lịch nào?',
    askQuestionEn: 'Which tourist destination are you interested in?',
  },
  {
    name: 'days',
    label: 'Số ngày',
    labelEn: 'Number of days',
    required: true,
    askQuestion: 'Bạn dự định đi mấy ngày?',
    askQuestionEn: 'How many days are you planning to stay?',
  },
  {
    name: 'budget',
    label: 'Ngân sách',
    labelEn: 'Budget',
    required: true,
    askQuestion: 'Ngân sách dự kiến của bạn khoảng bao nhiêu?',
    askQuestionEn: "What's your estimated budget?",
  },
  {
    name: 'companion',
    label: 'Đi cùng',
    labelEn: 'Companion',
    required: false,
    askQuestion: 'Bạn đi một mình, đi cùng gia đình, hay bạn bè?',
    askQuestionEn: 'Are you traveling alone, with family, or with friends?',
  },
  {
    name: 'season',
    label: 'Mùa/Thời gian',
    labelEn: 'Season',
    required: false,
    askQuestion: 'Bạn dự định đi vào thời gian nào trong năm?',
    askQuestionEn: 'When are you planning to travel?',
  },
];

/**
 * SlotFillingService extracts structured slots from user messages.
 *
 * Responsibilities:
 * - Extract destination, days, budget, companion, season from text
 * - Identify which required slots are still missing
 * - Generate follow-up questions for missing slots
 *
 * Business logic is handled in code using regex patterns.
 * No LLM calls are needed for slot extraction.
 */
export class SlotFillingService {
  /**
   * Extract all available slots from a user message.
   * Returns partial state updates (only non-null fields).
   */
  extract(input: string, parsedDest?: string | null): Partial<ConversationState> {
    const updates: Partial<ConversationState> = {};
    const clean = input.toLowerCase();

    // Destination & Province
    if (parsedDest) {
      updates.destination = parsedDest;
    }

    // Province extraction (e.g., "tỉnh Thái Nguyên", "thành phố Hồ Chí Minh")
    const provinceMatch = clean.match(/(?:tỉnh|tinh|thành phố|thanh pho|tp\.?)\s+([\p{L}\s]+?)(?:[.,!?]\s*|$)/iu);
    if (provinceMatch && provinceMatch[1].trim().length > 2) {
      updates.province = provinceMatch[1].trim();
    }

    // Days
    const daysMatch = clean.match(/(\d+)\s*ngày/i);
    if (daysMatch) {
      updates.days = parseInt(daysMatch[1], 10);
    }

    // Budget
    const budgetPatterns: { pattern: RegExp; value: string }[] = [
      { pattern: /tiết kiệm|rẻ|thấp|ít tiền|sinh viên/i, value: 'low' },
      { pattern: /trung bình|vừa phải|tầm trung/i, value: 'medium' },
      { pattern: /cao|sang|nhiều tiền|không lo chi phí|xa xỉ/i, value: 'high' },
    ];
    for (const bp of budgetPatterns) {
      if (bp.pattern.test(clean)) {
        updates.budget = bp.value;
        break;
      }
    }

    // Companion
    const companionPatterns: { pattern: RegExp; value: string }[] = [
      { pattern: /một mình|đi một mình|alone/i, value: 'alone' },
      { pattern: /gia đình|cả nhà|vợ chồng|con nhỏ|bé|trẻ em/i, value: 'family' },
      { pattern: /cặp đôi|người yêu|hẹn hò|vợ chồng/i, value: 'couple' },
      { pattern: /bạn bè|nhóm bạn|hội bạn|đi cùng bạn/i, value: 'friends' },
    ];
    for (const cp of companionPatterns) {
      if (cp.pattern.test(clean)) {
        updates.companion = cp.value;
        break;
      }
    }

    // Season
    const monthMatch = clean.match(/tháng\s+(\d+)/i);
    if (monthMatch) {
      updates.season = `tháng ${monthMatch[1]}`;
    } else {
      const seasonPatterns: { pattern: RegExp; value: string }[] = [
        { pattern: /mùa xuân|tết|đầu năm/i, value: 'mùa xuân' },
        { pattern: /mùa hè|hè|nghỉ hè/i, value: 'mùa hè' },
        { pattern: /mùa thu/i, value: 'mùa thu' },
        { pattern: /mùa đông|cuối năm/i, value: 'mùa đông' },
      ];
      for (const sp of seasonPatterns) {
        if (sp.pattern.test(clean)) {
          updates.season = sp.value;
          break;
        }
      }
    }

    return updates;
  }

  /**
   * Check which required slots are still missing from a state.
   */
  getMissingSlots(state: ConversationState | null): SlotDefinition[] {
    if (!state) return SLOTS.filter(s => s.required);

    return SLOTS.filter(slot => {
      if (!slot.required) return false;
      const value = state[slot.name];
      return value === null || value === undefined || value === '';
    });
  }

  /**
   * Generate a follow-up question for the first missing slot.
   * Returns null if no slots need filling.
   */
  getFollowUpQuestion(state: ConversationState | null, isVietnamese: boolean = true): string | null {
    const missing = this.getMissingSlots(state);
    if (missing.length === 0) return null;

    const priority: (keyof ConversationState)[] = [
      'destination', 'days', 'intent', 'season', 'companion', 'budget',
    ];

    for (const key of priority) {
      const slot = missing.find(s => s.name === key);
      if (slot) {
        return isVietnamese ? slot.askQuestion : slot.askQuestionEn;
      }
    }

    return isVietnamese ? missing[0].askQuestion : missing[0].askQuestionEn;
  }

  /**
   * Get all slot definitions.
   */
  getSlots(): SlotDefinition[] {
    return SLOTS;
  }
}
