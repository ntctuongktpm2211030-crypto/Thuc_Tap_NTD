import { describe, it, expect } from 'vitest';
import { ResponsePlanner } from '../response-planner.service';
import { ResponseFormatterService } from '../response-formatter.service';
import { SuggestionBuilderService } from '../suggestion-builder.service';
import { ConversationState } from '../types/dialogue.types';
import { ConversationState } from '../types/dialogue.types';

describe('ResponsePlanner', () => {
  const planner = new ResponsePlanner();

  const mockDocs = [
    {
      id: 'doc-1',
      title: 'Thác Bản Giốc',
      content: 'Thác Bản Giốc là thác nước đẹp nhất Việt Nam, nằm tại Cao Bằng. Thác cao 53m, rộng hơn 300m, được mệnh danh là thác nước hùng vĩ bậc nhất Đông Nam Á. Du khách có thể tham quan thác vào mùa mưa, từ tháng 6 đến tháng 9.',
      category: 'destination',
      score: 0.92,
      similarity: 0.92,
    },
    {
      id: 'doc-2',
      title: 'Động Ngườm Ngao',
      content: 'Động Ngườm Ngao là hang động đẹp nằm gần thác Bản Giốc, thuộc địa phận Cao Bằng. Động dài hơn 2km với nhiều nhũ đá đẹp.',
      category: 'destination',
      score: 0.85,
      similarity: 0.85,
    },
  ];

  const mockState: ConversationState = {
    province: null,
    destination: 'Cao Bằng',
    intent: 'sightseeing',
    days: 2,
    budget: 'medium',
    companion: null,
    season: 'tháng 6',
    conversationId: 'conv-1',
    updatedAt: Date.now(),
  };

  describe('plan', () => {
    it('should return empty plan for empty docs', () => {
      const plan = planner.plan([], null);
      expect(plan.title).toBe('Không tìm thấy thông tin');
      expect(plan.highlights).toHaveLength(0);
    });

    it('should build title from destination in state', () => {
      const plan = planner.plan(mockDocs, mockState);
      expect(plan.title).toContain('Cao Bằng');
    });

    it('should extract highlights from doc titles', () => {
      const plan = planner.plan(mockDocs, mockState);
      expect(plan.highlights.length).toBeGreaterThanOrEqual(1);
      expect(plan.highlights[0]).toBe('Thác Bản Giốc');
    });

    it('should include activities for the given intent', () => {
      const plan = planner.plan(mockDocs, { ...mockState, intent: 'trekking' });
      expect(plan.activities.some(a => a.toLowerCase().includes('trekking'))).toBe(true);
    });

    it('should include suitable for based on companion', () => {
      const plan = planner.plan(mockDocs, {
        ...mockState,
        companion: 'family',
      });
      expect(plan.suitableFor.some(s => s.includes('gia đình'))).toBe(true);
    });

    it('should detect season from state', () => {
      const plan = planner.plan(mockDocs, mockState);
      expect(plan.bestSeason).toContain('tháng 6');
    });

    it('should detect distance from doc content', () => {
      const distanceDocs = [
        {
          ...mockDocs[0],
          content: 'Cách trung tâm 50km về phía bắc. Thác Bản Giốc hùng vĩ.',
        },
      ];
      const plan = planner.plan(distanceDocs, mockState);
      expect(plan.distance).toContain('km');
    });
  });

  describe('ResponsePlanner + ResponseFormatterService integration', () => {
    const formatter = new ResponseFormatterService();
    const suggestionBuilder = new SuggestionBuilderService();

    it('should create response with all fields via Formatter', () => {
      const plan = planner.plan(mockDocs, mockState);
      const suggestions = suggestionBuilder.build(mockState);
      const response = formatter.format({
        answer: 'Cao Bằng có thác Bản Giốc đẹp.',
        plan,
        state: { intent: 'sightseeing', destination: 'Cao Bằng' },
        suggestions,
        agentUsed: 'TravelAgent',
        latencyMs: 100,
        hasRagData: true,
      });

      expect(response.answer).toBe('Cao Bằng có thác Bản Giốc đẹp.');
      expect(response.answerType).toBe('destinations');
      expect(response.places.length).toBeGreaterThan(0);
      expect(response.suggestions.length).toBeGreaterThan(0);
      expect(response.metadata.intent).toBe('sightseeing');
      expect(response.metadata.destination).toBe('Cao Bằng');
      expect(response.metadata.hasRagData).toBe(true);
      expect(response.metadata.planGenerated).toBe(true);
    });

    it('should create fallback response when no RAG data', () => {
      const plan = planner.plan([], null);
      const suggestions = suggestionBuilder.build(null);
      const response = formatter.formatFallback({
        answer: 'Chưa có dữ liệu.',
        state: null,
        suggestions,
        agentUsed: 'TravelAgent',
        latencyMs: 50,
        hasRagData: false,
      });

      expect(response.hasRagData).toBe(false);
      expect(response.metadata.planGenerated).toBe(false);
    });

    it('should create follow-up question response', () => {
      const response = formatter.formatFollowUp({
        question: 'Bạn muốn đi đâu?',
        state: null,
        suggestions: ['Đi đâu chơi'],
        latencyMs: 10,
      });

      expect(response.answer).toBe('Bạn muốn đi đâu?');
      expect(response.followUpQuestion).toBe('Bạn muốn đi đâu?');
      expect(response.metadata.planGenerated).toBe(false);
    });

    it('should answerType food for food intent', () => {
      const foodState = { ...mockState, intent: 'food' as const };
      const plan = planner.plan(mockDocs, foodState);
      expect(plan.answerType).toBe('foods');
    });
  });

  describe('buildLLMPrompt', () => {
    it('should include plan details in prompt', () => {
      const plan = planner.plan(mockDocs, mockState);
      const prompt = planner.buildLLMPrompt(plan, 'Đi Cao Bằng chơi', 'RAG context text');
      
      expect(prompt).toContain('Cao Bằng');
      expect(prompt).toContain('KẾ HOẠCH TRẢ LỜI');
      expect(prompt).toContain('RAG Context');
      expect(prompt).toContain('hướng dẫn viên du lịch');
      expect(prompt).toContain('KHÔNG');
      expect(prompt).toContain('[1]');
    });

    it('should include natural writing rules', () => {
      const plan = planner.plan(mockDocs, mockState);
      const prompt = planner.buildLLMPrompt(plan, 'test', 'rag');
      
      expect(prompt).toContain('Cảm ơn bạn đã chia sẻ'); // The anti-rule is there
      expect(prompt).toContain('Wikipedia');
      expect(prompt).toContain('trải nghiệm');
    });
  });
});
