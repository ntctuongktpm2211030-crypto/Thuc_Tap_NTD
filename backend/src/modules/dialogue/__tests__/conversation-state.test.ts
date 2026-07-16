import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationStateService } from '../conversation-state.service';
import { SlotFillingService } from '../slot-filling.service';
import { TravelIntentService } from '../travel-intent.service';
import { SuggestionBuilderService } from '../suggestion-builder.service';

// ─── ConversationStateService: Pure CRUD ──────────────────────

describe('ConversationStateService', () => {
  let service: ConversationStateService;

  beforeEach(() => {
    service = new ConversationStateService();
  });

  describe('initState', () => {
    it('should create a new state with all null fields', () => {
      const state = service.initState('conv-1');
      expect(state.conversationId).toBe('conv-1');
      expect(state.destination).toBeNull();
      expect(state.intent).toBeNull();
      expect(state.days).toBeNull();
      expect(state.budget).toBeNull();
      expect(state.companion).toBeNull();
      expect(state.season).toBeNull();
      expect(state.province).toBeNull();
      expect(state.updatedAt).toBeGreaterThan(0);
    });
  });

  describe('updateState', () => {
    it('should merge partial updates into existing state', () => {
      service.initState('conv-1');
      const state = service.updateState('conv-1', { destination: 'Đà Lạt', days: 3 });
      expect(state.destination).toBe('Đà Lạt');
      expect(state.days).toBe(3);
      expect(state.intent).toBeNull();
    });

    it('should init state if not exists', () => {
      const state = service.updateState('conv-new', { destination: 'Sapa' });
      expect(state.conversationId).toBe('conv-new');
      expect(state.destination).toBe('Sapa');
    });

    it('should preserve previous values on partial update', () => {
      service.initState('conv-1');
      service.updateState('conv-1', { destination: 'Đà Lạt' });
      const state = service.updateState('conv-1', { days: 3 });
      expect(state.destination).toBe('Đà Lạt');
      expect(state.days).toBe(3);
    });
  });

  describe('setSlot', () => {
    it('should set a specific slot value', () => {
      service.initState('conv-1');
      const state = service.setSlot('conv-1', 'days', 5);
      expect(state.days).toBe(5);
    });

    it('should init state if not exists', () => {
      const state = service.setSlot('conv-new', 'destination', 'Sapa');
      expect(state.conversationId).toBe('conv-new');
      expect(state.destination).toBe('Sapa');
    });
  });

  describe('getState', () => {
    it('should return null for non-existent conversation', () => {
      expect(service.getState('nonexistent')).toBeNull();
    });

    it('should return state for existing conversation', () => {
      service.initState('conv-1');
      const state = service.getState('conv-1');
      expect(state).not.toBeNull();
      expect(state!.conversationId).toBe('conv-1');
    });
  });

  describe('clearState', () => {
    it('should clear state for a conversation', () => {
      service.initState('conv-1');
      service.clearState('conv-1');
      expect(service.getState('conv-1')).toBeNull();
    });
  });
});

// ─── SlotFillingService ───────────────────────────────────────

describe('SlotFillingService', () => {
  let service: SlotFillingService;

  beforeEach(() => {
    service = new SlotFillingService();
  });

  describe('extract', () => {
    it('should extract destination from message', () => {
      const updates = service.extract('Tôi muốn đi Đà Lạt', 'Đà Lạt');
      expect(updates.destination).toBe('Đà Lạt');
    });

    it('should extract days from message', () => {
      const updates = service.extract('Tôi muốn đi du lịch 3 ngày');
      expect(updates.days).toBe(3);
    });

    it('should extract budget (low)', () => {
      const updates = service.extract('Tôi muốn đi du lịch tiết kiệm');
      expect(updates.budget).toBe('low');
    });

    it('should extract budget (medium)', () => {
      const updates = service.extract('Ngân sách trung bình');
      expect(updates.budget).toBe('medium');
    });

    it('should extract budget (high)', () => {
      const updates = service.extract('Muốn đi sang chảnh');
      expect(updates.budget).toBe('high');
    });

    it('should extract companion (family)', () => {
      const updates = service.extract('Tôi muốn đưa gia đình đi chơi');
      expect(updates.companion).toBe('family');
    });

    it('should extract companion (alone)', () => {
      const updates = service.extract('Đi một mình');
      expect(updates.companion).toBe('alone');
    });

    it('should extract companion (friends)', () => {
      const updates = service.extract('Đi với bạn bè');
      expect(updates.companion).toBe('friends');
    });

  it('should extract province from message', () => {
    const updates = service.extract('tỉnh Thái Nguyên');
    expect(updates.province).toBe('Thái Nguyên');
  });

  it('should extract province with thành phố prefix', () => {
    const updates = service.extract('thành phố Hồ Chí Minh');
    expect(updates.province).toBe('Hồ Chí Minh');
  });

  it('should extract season from month', () => {
    const updates = service.extract('Đi tháng 12');
      expect(updates.season).toBe('tháng 12');
    });

    it('should extract season from season name', () => {
      const updates = service.extract('Đi mùa xuân');
      expect(updates.season).toBe('mùa xuân');
    });

    it('should extract all available slots from a single message', () => {
      const updates = service.extract('Gia đình 3 ngày Đà Lạt ngân sách tiết kiệm', 'Đà Lạt');
      expect(updates.destination).toBe('Đà Lạt');
      expect(updates.days).toBe(3);
      expect(updates.budget).toBe('low');
      expect(updates.companion).toBe('family');
    });
  });

  describe('getMissingSlots', () => {
    it('should return destination as missing when not set', () => {
      const state = new ConversationStateService().initState('conv-1');
      const missing = service.getMissingSlots(state);
      expect(missing.some(s => s.name === 'destination')).toBe(true);
    });

    it('should not return filled required slots', () => {
      const state = new ConversationStateService().initState('conv-1');
      state.destination = 'Đà Nẵng';
      state.days = 3;
      state.intent = 'food';
      state.budget = 'medium';
      const missing = service.getMissingSlots(state);
      expect(missing.find(s => s.name === 'destination')).toBeUndefined();
      expect(missing.find(s => s.name === 'days')).toBeUndefined();
    });
  });

  describe('getFollowUpQuestion', () => {
    it('should ask about destination when missing', () => {
      const state = new ConversationStateService().initState('conv-1');
      const question = service.getFollowUpQuestion(state, true);
      expect(question).toContain('địa điểm du lịch');
    });

    it('should ask about days when destination set but days missing', () => {
      const state = new ConversationStateService().initState('conv-1');
      state.destination = 'Đà Lạt';
      const question = service.getFollowUpQuestion(state, true);
      expect(question).toContain('mấy ngày');
    });

    it('should return null when all required slots filled', () => {
      const state = new ConversationStateService().initState('conv-1');
      state.destination = 'Hà Nội';
      state.days = 2;
      state.intent = 'sightseeing';
      state.budget = 'medium';
      expect(service.getFollowUpQuestion(state, true)).toBeNull();
    });

    it('should return English question when isVietnamese=false', () => {
      const state = new ConversationStateService().initState('conv-1');
      const question = service.getFollowUpQuestion(state, false);
      expect(question).toContain('tourist destination');
    });
  });
});

// ─── TravelIntentService ──────────────────────────────────────

describe('TravelIntentService', () => {
  let service: TravelIntentService;

  beforeEach(() => {
    service = new TravelIntentService();
  });

  it('should detect food intent', () => {
    expect(service.detect('Có gì ngon ở Hà Nội')).toBe('food');
  });

  it('should detect trekking intent', () => {
    expect(service.detect('Muốn đi trekking Sapa')).toBe('trekking');
  });

  it('should detect check-in intent', () => {
    expect(service.detect('Địa điểm check in đẹp')).toBe('check-in');
  });

  it('should detect history intent', () => {
    expect(service.detect('Di tích lịch sử')).toBe('history');
  });

  it('should detect culture intent', () => {
    expect(service.detect('Văn hóa địa phương')).toBe('culture');
  });

  it('should detect spiritual intent', () => {
    expect(service.detect('Chùa chiền tâm linh')).toBe('spiritual');
  });

  it('should detect adventure intent', () => {
    expect(service.detect('Phượt Tây Bắc')).toBe('adventure');
  });

  it('should detect festival intent', () => {
    expect(service.detect('Lễ hội mùa xuân')).toBe('festival');
  });

  it('should detect camping intent', () => {
    expect(service.detect('Cắm trại qua đêm')).toBe('camping');
  });

  it('should detect photography intent', () => {
    expect(service.detect('Chụp ảnh landscape đẹp')).toBe('photography');
  });

  it('should detect backpacking intent', () => {
    expect(service.detect('Du lịch bụi xuyên Việt')).toBe('backpacking');
  });

  it('should return general for unclear input', () => {
    expect(service.detect('Xin chào')).toBe('general');
  });

  it('should return general for empty input', () => {
    expect(service.detect('')).toBe('general');
  });

  it('should support hasIntent check', () => {
    expect(service.hasIntent('Ăn phở ở đâu ngon', 'food')).toBe(true);
    expect(service.hasIntent('Xin chào', 'food')).toBe(false);
  });

  it('should return scores for all intents', () => {
    const scores = service.detectAll('Muốn leo núi và cắm trại');
    expect(scores.size).toBeGreaterThanOrEqual(1);
  });
});

// ─── SuggestionBuilderService ─────────────────────────────────

describe('SuggestionBuilderService', () => {
  let service: SuggestionBuilderService;

  beforeEach(() => {
    service = new SuggestionBuilderService();
  });

  it('should return destination-based suggestions when destination is set', () => {
    const state = new ConversationStateService().initState('conv-1');
    state.destination = 'Đà Lạt';
    const suggestions = service.build(state);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(s => s.includes('Lịch trình'))).toBe(true);
  });

  it('should return general suggestions when no destination', () => {
    const suggestions = service.build(null);
    expect(suggestions.some(s => s.includes('Đi đâu chơi'))).toBe(true);
  });

  it('should include food suggestions when intent is food', () => {
    const state = new ConversationStateService().initState('conv-1');
    state.destination = 'Hội An';
    const suggestions = service.build(state, 'food');
    expect(suggestions.some(s => s.includes('Đặc sản'))).toBe(true);
  });

  it('should include trekking suggestions for adventure intent', () => {
    const state = new ConversationStateService().initState('conv-1');
    state.destination = 'Sapa';
    const suggestions = service.build(state, 'adventure');
    expect(suggestions.some(s => s.includes('trekking'))).toBe(true);
  });

  it('should build food suggestions', () => {
    const suggestions = service.buildFoodSuggestions();
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
  });

  it('should build destination suggestions', () => {
    const suggestions = service.buildDestinationSuggestions();
    expect(suggestions.length).toBeGreaterThanOrEqual(3);
  });

  it('should limit to 5 suggestions', () => {
    const state = new ConversationStateService().initState('conv-1');
    state.destination = 'Đà Nẵng';
    const suggestions = service.build(state);
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });
});
