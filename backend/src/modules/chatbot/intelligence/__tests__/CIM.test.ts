import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConversationIntelligence } from '../conversation-intelligence';

// Mock Prisma Client
vi.mock('../../../../config/db', () => {
  return {
    default: {
      chatMessage: {
        findMany: vi.fn(),
      },
      chatMessageVersion: {
        findFirst: vi.fn(),
      },
    },
  };
});

import prisma from '../../../../config/db';

describe('Conversation Intelligence Module (CIM) Integration Tests', () => {
  let cim: ConversationIntelligence;

  beforeEach(() => {
    vi.clearAllMocks();
    cim = new ConversationIntelligence();
  });

  it('Kịch bản 1: Xử lý câu nói "chán ngắt cho thêm địa điểm đi" -> Emotion: bored, Intent: RECOMMENDATION_REPLACE', async () => {
    // Mock history: previous was recommendation
    (prisma.chatMessage.findMany as any).mockResolvedValue([
      { id: 'msg1', role: 'assistant', createdAt: new Date() },
    ]);
    (prisma.chatMessageVersion.findFirst as any).mockResolvedValue({
      content: 'Gợi ý các địa danh ở Nghệ An: **Đền Gia Vĩnh**, **Thác Bích Hợp**',
      isActive: true,
    });

    const result = await cim.analyzeQuery('chán ngắt cho thêm địa điểm đi', 'conv-123', 'RECOMMENDATION');

    expect(result.emotion.emotion).toBe('bored');
    expect(result.emotion.intensity).toBeGreaterThanOrEqual(0.7);
    expect(result.intent.intent).toBe('RECOMMENDATION_REPLACE');
    expect(result.responsePolicy.actionType).toBe('RECOMMEND');
    expect(result.responsePolicy.toneModifier).toContain('chán nản');
  });

  it('Kịch bản 2: Duy trì ngữ cảnh (Recommendation Continuation)', async () => {
    (prisma.chatMessage.findMany as any).mockResolvedValue([
      { id: 'msg-user', role: 'user', createdAt: new Date() },
      { id: 'msg-assistant', role: 'assistant', createdAt: new Date(Date.now() - 1000) },
    ]);
    
    // First call returns suggested list, user responds "không thích"
    (prisma.chatMessageVersion.findFirst as any)
      .mockResolvedValueOnce({ content: 'không thích', isActive: true }) // for userMsg
      .mockResolvedValueOnce({ content: 'Gợi ý: **Đền Gia Vĩnh**', isActive: true }); // for assistantMsg

    const result = await cim.analyzeQuery('không thích, đổi nơi khác đi', 'conv-123', 'RECOMMENDATION');

    expect(result.intent.intent).toBe('RECOMMENDATION_REPLACE');
    expect(result.responsePolicy.actionType).toBe('RECOMMEND');
  });

  it('Kịch bản 3: Slot Filling trì hoãn (Answer First, Ask Later)', async () => {
    // No history
    (prisma.chatMessage.findMany as any).mockResolvedValue([]);

    const result = await cim.analyzeQuery('tôi muốn lên lịch trình đi Đà Lạt', 'conv-123', 'DISCOVERY');

    expect(result.intent.intent).toBe('ITINERARY_PLAN');
    // Since duration slot is missing, it should apply Answer First -> Recommend places first
    expect(result.responsePolicy.actionType).toBe('RECOMMEND');
    expect(result.responsePolicy.clarificationPrompt).toContain('gợi ý trước 3 địa điểm');
  });

  it('Kịch bản 4: Câu hỏi bình thường đi thẳng vào Itinerary khi có số ngày', async () => {
    (prisma.chatMessage.findMany as any).mockResolvedValue([]);

    const result = await cim.analyzeQuery('tôi muốn lên lịch trình đi Đà Lạt 3 ngày 2 đêm', 'conv-123', 'DISCOVERY');

    expect(result.intent.intent).toBe('ITINERARY_PLAN');
    expect(result.intent.needSlot).toBe(false);
    expect(result.responsePolicy.actionType).toBe('PLAN_ITINERARY');
  });
});
