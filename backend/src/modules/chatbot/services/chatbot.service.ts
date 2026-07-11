import { ChatbotRepository } from '../repositories/chatbot.repository';
import { SaveMemoryDto, ChatMessageResponse } from '../types/chatbot.types';
import { generateChatbotResponse } from '../utils/chatbot.utils';
import { AgentExecutorService } from '../../ai-agents/services/agent-executor.service';

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

  // ─── Message Flow & AI ──────────────────────────────────────
  async sendMessage(conversationId: string, userId: string, content: string) {
    // 1. Xác thực quyền sở hữu cuộc trò chuyện
    const conversation = await this.repo.getConversationById(conversationId, userId);
    if (!conversation) {
      throw new Error('Cuộc hội thoại không hợp lệ hoặc không thuộc về bạn.');
    }

    // 2. Tạo tin nhắn của User
    const userMsg = await this.repo.createMessage(conversationId, 'user');
    const userVersion = await this.repo.createMessageVersion(userMsg.id, content, 1, true);

    // 3. Lấy thông tin Memory của người dùng để tùy chỉnh ngữ cảnh AI
    const memory = await this.repo.getMemoryByUserId(userId);

    // 4. Lấy lịch sử hội thoại
    const history = await this.repo.getConversationHistoryForAI(conversationId);

    // 5. Tạo tin nhắn phản hồi của Assistant trong cơ sở dữ liệu
    const assistantMsg = await this.repo.createMessage(conversationId, 'assistant');

    // 6. Gọi AI để lấy câu trả lời (Ưu tiên gọi Agent Layer, fallback sang openai utility)
    let aiResponseContent = '';
    try {
      const agentResult = await this.agentExecutor.execute(userId, content, undefined, assistantMsg.id, history);
      aiResponseContent = agentResult.response;
    } catch (err) {
      console.error('Agent execution failed, falling back to openai utility:', err);
      aiResponseContent = await generateChatbotResponse(history, memory);
    }

    // 7. Tạo phiên bản nội dung tin nhắn Assistant
    const assistantVersion = await this.repo.createMessageVersion(assistantMsg.id, aiResponseContent, 1, true);

    // Cập nhật lại thời gian của cuộc hội thoại
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return {
      userMessage: {
        ...userMsg,
        versions: [userVersion],
      },
      assistantMessage: {
        ...assistantMsg,
        versions: [assistantVersion],
      },
    };
  }

  async regenerateResponse(messageId: string, userId: string) {
    // 1. Kiểm tra tin nhắn và quyền truy cập
    const message = await this.repo.getMessageById(messageId);
    if (!message || message.role !== 'assistant') {
      throw new Error('Yêu cầu không hợp lệ. Tin nhắn phải là của trợ lý AI.');
    }

    const conversationId = message.conversationId;
    const conversation = await this.repo.getConversationById(conversationId, userId);
    if (!conversation) {
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

    // 4. Gọi AI sinh câu trả lời mới (Ưu tiên gọi Agent Layer, fallback sang openai utility)
    let newAiResponseContent = '';
    try {
      const lastUserMsg = history.slice().reverse().find(h => h.role === 'user');
      const agentResult = await this.agentExecutor.execute(userId, lastUserMsg ? lastUserMsg.content : 'xin chào', undefined, messageId, history);
      newAiResponseContent = agentResult.response;
    } catch (err) {
      console.error('Agent execution failed during regenerate, falling back to openai utility:', err);
      newAiResponseContent = await generateChatbotResponse(history, memory);
    }

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
    };
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
