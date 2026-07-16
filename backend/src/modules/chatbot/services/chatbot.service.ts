import { ChatbotRepository } from '../repositories/chatbot.repository';
import { SaveMemoryDto, ChatMessageResponse, SendMessageResult } from '../types/chatbot.types';
import { generateChatbotResponse } from '../utils/chatbot.utils';
import { AgentExecutorService } from '../../ai-agents/services/agent-executor.service';
import { extractMemoryFromHistory, mergeMemory } from '../utils/memory-extractor';
import { logger } from '../utils/logger';

export class ChatbotService {
  private repo: ChatbotRepository;
  private agentExecutor: AgentExecutorService;

  constructor() {
    this.repo = new ChatbotRepository();
    this.agentExecutor = new AgentExecutorService();
  }

  // ─── Conversations ──────────────────────────────────────────
  async createConversation(userId: string, title?: string) {
    const conn = await this.repo.createConversation(userId, title);
    
    // Tạo sẵn một tin nhắn hệ thống (system prompt) làm ngữ cảnh ban đầu
    const systemMsg = await this.repo.createMessage(conn.id, 'system');
    await this.repo.createMessageVersion(
      systemMsg.id,
      'Chào mừng bạn đến với SmartTravel AI Chatbot! Tôi ở đây để hỗ trợ bạn lên kế hoạch du lịch và tìm kiếm ẩm thực.',
      1,
      true
    );

    return conn;
  }

  async getConversations(userId: string) {
    return this.repo.getConversationsByUserId(userId);
  }

  async getConversationDetails(conversationId: string, userId: string) {
    const conversation = await this.repo.getConversationById(conversationId, userId);
    if (!conversation) {
      throw new Error('Không tìm thấy cuộc hội thoại hoặc bạn không có quyền truy cập.');
    }
    return conversation;
  }

  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await this.repo.getConversationById(conversationId, userId);
    if (!conversation) {
      throw new Error('Không tìm thấy cuộc hội thoại hoặc bạn không có quyền truy cập.');
    }
    await this.repo.deleteConversation(conversationId);
  }

  // ─── Message Flow & AI ──────────────────────────────────────
  async sendMessage(conversationId: string, userId: string, content: string, requestId?: string): Promise<SendMessageResult> {
    logger.info('ChatbotService', 'sendMessage — starting', { conversationId, userId }, requestId);

    // 1. Xác thực quyền sở hữu cuộc trò chuyện
    const conversation = await this.repo.getConversationById(conversationId, userId);
    if (!conversation) {
      logger.warn('ChatbotService', 'Conversation not found or access denied', { conversationId, userId }, requestId);
      throw new Error('Cuộc hội thoại không hợp lệ hoặc không thuộc về bạn.');
    }

    // 2. Tạo tin nhắn của User
    const userMsg = await this.repo.createMessage(conversationId, 'user');
    const userVersion = await this.repo.createMessageVersion(userMsg.id, content, 1, true);

    // 3. Lấy thông tin Memory của người dùng để tùy chỉnh ngữ cảnh AI
    const memoryStart = Date.now();
    const memory = await this.repo.getMemoryByUserId(userId);
    const memoryLatency = Date.now() - memoryStart;

    if (memory) {
      const memFields = ['travelPreferences', 'favoriteFoods', 'budget', 'transportation', 'favoriteLocations'] as const;
      const nonEmpty = memFields.filter(f => (memory as any)[f] && ((Array.isArray((memory as any)[f]) ? (memory as any)[f].length : 1) > 0));
      logger.info('ChatbotService', 'Memory loaded for context', { userId, fieldCount: nonEmpty.length, fields: nonEmpty, latencyMs: memoryLatency }, requestId);
    } else {
      logger.debug('ChatbotService', 'No memory found for user', { userId, latencyMs: memoryLatency }, requestId);
    }

    // 4. Lấy lịch sử hội thoại
    const history = await this.repo.getConversationHistoryForAI(conversationId);

    // 5. Tạo tin nhắn phản hồi của Assistant trong cơ sở dữ liệu
    const assistantMsg = await this.repo.createMessage(conversationId, 'assistant');

    // 6. Gọi AI để lấy câu trả lời (Ưu tiên gọi Agent Layer, fallback sang openai utility)
    let aiResponseContent = '';
    let citations: any[] = [];
    let places: any[] = [];
    let suggestions: string[] = [];
    let followUpQuestion: string | null = null;
    let responseMetadata: any = null;
    const aiStartTime = Date.now();
    let agentUsed = 'none';
    try {
      const agentResult = await this.agentExecutor.execute(userId, content, undefined, assistantMsg.id, history, memory as any, requestId);
      aiResponseContent = agentResult.response;
      citations = agentResult.citations || [];
      places = agentResult.places || [];
      suggestions = agentResult.suggestions || [];
      followUpQuestion = agentResult.followUpQuestion ?? null;
      responseMetadata = agentResult.metadata || null;
      agentUsed = agentResult.agentUsed || 'unknown';
    } catch (err) {
      logger.warn('ChatbotService', 'Agent execution failed, falling back to openai utility', { error: (err as Error).message, latencyMs: Date.now() - aiStartTime }, requestId);
      aiResponseContent = await generateChatbotResponse(history, memory);
      agentUsed = 'fallback-generateChatbotResponse';
    }
    const aiLatency = Date.now() - aiStartTime;

    logger.info('ChatbotService', 'AI response generated',
      { agentUsed, latencyMs: aiLatency, responseLength: aiResponseContent.length, citationsCount: citations.length, hasPlaces: places.length > 0, suggestionsCount: suggestions.length },
      requestId
    );

    // 7. Tạo phiên bản nội dung tin nhắn Assistant
    const assistantVersion = await this.repo.createMessageVersion(assistantMsg.id, aiResponseContent, 1, true);

    // Cập nhật lại thời gian của cuộc hội thoại
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // 8. Tự động trích xuất sở thích du lịch từ hội thoại (fire-and-forget, không block response)
    this.autoExtractMemory(userId, conversationId, memory as any, requestId).catch(err =>
      logger.warn('ChatbotService', 'Auto memory extraction failed', { error: (err as Error).message }, requestId)
    );

    return {
      userMessage: {
        ...userMsg,
        versions: [userVersion],
        citations: [],
      },
      assistantMessage: {
        ...assistantMsg,
        versions: [assistantVersion],
        citations,
        places,
        suggestions,
        followUpQuestion,
        metadata: responseMetadata,
      },
    };
  }

  async regenerateResponse(messageId: string, userId: string, requestId?: string) {
    logger.info('ChatbotService', 'regenerateResponse — starting', { messageId, userId }, requestId);

    // 1. Kiểm tra tin nhắn và quyền truy cập
    const message = await this.repo.getMessageById(messageId);
    if (!message || message.role !== 'assistant') {
      logger.warn('ChatbotService', 'Invalid message for regenerate', { messageId, role: message?.role }, requestId);
      throw new Error('Yêu cầu không hợp lệ. Tin nhắn phải là của trợ lý AI.');
    }

    const conversationId = message.conversationId;
    const conversation = await this.repo.getConversationById(conversationId, userId);
    if (!conversation) {
      logger.warn('ChatbotService', 'No access to conversation for regenerate', { conversationId, userId }, requestId);
      throw new Error('Không có quyền truy cập vào cuộc hội thoại này.');
    }

    // 2. Lấy danh sách tin nhắn trước tin nhắn này trong cuộc hội thoại để làm ngữ cảnh
    const allMessages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        versions: {
          where: { isActive: true },
        },
      },
    });

    const targetIndex = allMessages.findIndex((m) => m.id === messageId);
    const historyMessages = allMessages.slice(0, targetIndex);

    const history = historyMessages
      .filter((m) => m.versions.length > 0)
      .map((m) => ({
        role: m.role,
        content: m.versions[0].content,
      }));

    // 3. Lấy Memory của người dùng
    const memory = await this.repo.getMemoryByUserId(userId);
    logger.debug('ChatbotService', 'Memory loaded for regenerate', { userId, hasMemory: !!memory }, requestId);

    // 4. Gọi AI sinh câu trả lời mới (Ưu tiên gọi Agent Layer, fallback sang openai utility)
    let newAiResponseContent = '';
    let citations: any[] = [];
    let places: any[] = [];
    let suggestions: string[] = [];
    let followUpQuestion: string | null = null;
    let responseMetadata: any = null;
    const aiStartTime = Date.now();
    let agentUsed = 'none';
    try {
      const lastUserMsg = history.slice().reverse().find(h => h.role === 'user');
      const agentResult = await this.agentExecutor.execute(
        userId,
        lastUserMsg ? lastUserMsg.content : 'xin chào',
        undefined,
        messageId,
        history,
        memory as any,
        requestId
      );
      newAiResponseContent = agentResult.response;
      citations = agentResult.citations || [];
      places = agentResult.places || [];
      suggestions = agentResult.suggestions || [];
      followUpQuestion = agentResult.followUpQuestion ?? null;
      responseMetadata = agentResult.metadata || null;
      agentUsed = agentResult.agentUsed || 'unknown';
    } catch (err) {
      logger.warn('ChatbotService', 'Agent execution failed during regenerate, falling back', { error: (err as Error).message }, requestId);
      newAiResponseContent = await generateChatbotResponse(history, memory);
      agentUsed = 'fallback-generateChatbotResponse';
    }
    const aiLatency = Date.now() - aiStartTime;

    logger.info('ChatbotService', 'Regenerate response completed',
      { agentUsed, latencyMs: aiLatency, responseLength: newAiResponseContent.length, hasPlaces: places.length > 0 },
      requestId
    );

    // 5. Deactivate các phiên bản cũ và tạo phiên bản mới
    await this.repo.deactivateAllVersions(messageId);
    const maxVersion = await this.repo.getMaxVersion(messageId);
    const newVersion = await this.repo.createMessageVersion(
      messageId,
      newAiResponseContent,
      maxVersion + 1,
      true
    );

    // Cập nhật lại thời gian cập nhật cuộc trò chuyện
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return {
      ...message,
      versions: [newVersion],
      citations,
      places,
      suggestions,
      followUpQuestion,
      metadata: responseMetadata,
    };
  }

  /**
   * Tự động trích xuất sở thích người dùng từ lịch sử hội thoại
   * và cập nhật vào AIMemory nếu phát hiện thông tin mới.
   * Chạy bất đồng bộ (fire-and-forget) để không chậm response.
   */
  private async autoExtractMemory(userId: string, conversationId: string, existingMemory: SaveMemoryDto | null, requestId?: string) {
    try {
      const history = await this.repo.getConversationHistoryForAI(conversationId);
      if (history.length < 3) {
        logger.debug('ChatbotService', 'Auto memory extraction skipped — history too short', { historyLength: history.length }, requestId);
        return;
      }

      const extracted = await extractMemoryFromHistory(history, existingMemory);
      
      if (extracted.hasNewData && extracted.confidence >= 0.5) {
        const latestMemory = await this.repo.getMemoryByUserId(userId);
        // Re-read latest memory to avoid race conditions, then merge
        const merged = mergeMemory(latestMemory as any, extracted.preferences, extracted.confidence);
        await this.repo.upsertMemory(userId, merged);
        logger.info('ChatbotService', 'Auto memory updated',
          { userId, confidence: extracted.confidence, fields: Object.keys(extracted.preferences) },
          requestId
        );
      } else {
        logger.debug('ChatbotService', 'Auto memory extraction yielded no new data',
          { hasNewData: extracted.hasNewData, confidence: extracted.confidence },
          requestId
        );
      }
    } catch (err) {
      logger.warn('ChatbotService', 'autoExtractMemory error', { error: (err as Error).message }, requestId);
    }
  }

  // ─── Memory Module ──────────────────────────────────────────
  async getMemory(userId: string) {
    return this.repo.getMemoryByUserId(userId);
  }

  async saveMemory(userId: string, data: SaveMemoryDto) {
    return this.repo.upsertMemory(userId, data);
  }

  async deleteMemory(userId: string) {
    await this.repo.deleteMemory(userId);
    return { success: true, message: 'Đã xóa toàn bộ bộ nhớ của người dùng.' };
  }
}

// Fallback import
import prisma from '../../../config/db';
