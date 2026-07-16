import { Response } from 'express';
import { randomUUID } from 'crypto';
import { AuthRequest } from '../../auth/auth.middleware';
import { ChatbotService } from '../services/chatbot.service';
import { logger } from '../utils/logger';

export class ChatbotController {
  private service: ChatbotService;

  constructor() {
    this.service = new ChatbotService();
  }

  // ─── Lịch sử cuộc trò chuyện (Conversations) ─────────────────
  TaoCuocHoiThoai = async (req: AuthRequest, res: Response) => {
    const requestId = randomUUID();
    try {
      const userId = req.user!.sub;
      const { title } = req.body;
      const conversation = await this.service.createConversation(userId, title);
      logger.info('ChatbotController', 'Conversation created', { userId, conversationId: conversation.id }, requestId);
      return res.status(201).json(conversation);
    } catch (err: any) {
      logger.error('ChatbotController', 'TaoCuocHoiThoai failed', { error: err.message }, requestId);
      return res.status(500).json({ error: err.message || 'Không thể tạo cuộc hội thoại.' });
    }
  };

  LayDanhSachCuocHoiThoai = async (req: AuthRequest, res: Response) => {
    const requestId = randomUUID();
    try {
      const userId = req.user!.sub;
      const list = await this.service.getConversations(userId);
      logger.info('ChatbotController', 'Conversations fetched', { userId, count: list.length }, requestId);
      return res.json(list);
    } catch (err: any) {
      logger.error('ChatbotController', 'LayDanhSachCuocHoiThoai failed', { error: err.message }, requestId);
      return res.status(500).json({ error: 'Không thể tải danh sách cuộc hội thoại.' });
    }
  };

  LayChiTietCuocHoiThoai = async (req: AuthRequest, res: Response) => {
    const requestId = randomUUID();
    try {
      const userId = req.user!.sub;
      const conversationId = req.params.id;
      const details = await this.service.getConversationDetails(conversationId, userId);
      return res.json(details);
    } catch (err: any) {
      logger.error('ChatbotController', 'LayChiTietCuocHoiThoai failed', { conversationId: req.params.id, error: err.message }, requestId);
      return res.status(404).json({ error: err.message || 'Không tìm thấy cuộc hội thoại.' });
    }
  };

  XoaCuocHoiThoai = async (req: AuthRequest, res: Response) => {
    const requestId = randomUUID();
    try {
      const userId = req.user!.sub;
      const conversationId = req.params.id;
      logger.info('ChatbotController', 'XoaCuocHoiThoai start', { userId, conversationId }, requestId);
      await this.service.deleteConversation(conversationId, userId);
      return res.status(200).json({ message: 'Cuộc hội thoại đã được xóa thành công.' });
    } catch (err: any) {
      logger.error('ChatbotController', 'XoaCuocHoiThoai failed', { conversationId: req.params.id, error: err.message }, requestId);
      return res.status(500).json({ error: err.message || 'Không thể xóa cuộc hội thoại.' });
    }
  };

  // ─── Gửi tin nhắn & Tái tạo phản hồi ──────────────────────────
  GuiTinNhan = async (req: AuthRequest, res: Response) => {
    const requestId = randomUUID();
    try {
      const userId = req.user!.sub;
      const conversationId = req.params.id;
      const { content } = req.body;
      logger.info('ChatbotController', 'GuiTinNhan start', { userId, conversationId, contentLength: content?.length }, requestId);
      const startTime = Date.now();
      const result = await this.service.sendMessage(conversationId, userId, content, requestId);
      const latency = Date.now() - startTime;
      logger.info('ChatbotController', 'GuiTinNhan completed', { userId, conversationId, latencyMs: latency }, requestId);
      return res.status(200).json(result);
    } catch (err: any) {
      logger.error('ChatbotController', 'GuiTinNhan failed', { error: err.message }, requestId);
      return res.status(400).json({ error: err.message || 'Không thể gửi tin nhắn.' });
    }
  };

  TaoLaiPhanHoi = async (req: AuthRequest, res: Response) => {
    const requestId = randomUUID();
    try {
      const userId = req.user!.sub;
      const messageId = req.params.messageId;
      logger.info('ChatbotController', 'TaoLaiPhanHoi start', { userId, messageId }, requestId);
      const startTime = Date.now();
      const result = await this.service.regenerateResponse(messageId, userId, requestId);
      const latency = Date.now() - startTime;
      logger.info('ChatbotController', 'TaoLaiPhanHoi completed', { userId, messageId, latencyMs: latency }, requestId);
      return res.json(result);
    } catch (err: any) {
      logger.error('ChatbotController', 'TaoLaiPhanHoi failed', { messageId: req.params.messageId, error: err.message }, requestId);
      return res.status(400).json({ error: err.message || 'Không thể tạo lại câu trả lời.' });
    }
  };

  // ─── Bộ nhớ sở thích AI (AI Memory) ──────────────────────────
  LayBoNhoAI = async (req: AuthRequest, res: Response) => {
    const requestId = randomUUID();
    try {
      const userId = req.user!.sub;
      const memory = await this.service.getMemory(userId);
      if (!memory) {
        logger.debug('ChatbotController', 'LayBoNhoAI — no memory found', { userId }, requestId);
        return res.status(404).json({ error: 'Người dùng chưa có dữ liệu bộ nhớ AI.' });
      }
      const fields = ['travelPreferences', 'favoriteFoods', 'budget', 'transportation', 'favoriteLocations'] as const;
      const nonEmpty = fields.filter(f => (memory as any)[f] && ((Array.isArray((memory as any)[f]) ? (memory as any)[f].length : 1) > 0));
      logger.info('ChatbotController', 'LayBoNhoAI loaded', { userId, fieldCount: nonEmpty.length, fields: nonEmpty }, requestId);
      return res.json(memory);
    } catch (err: any) {
      logger.error('ChatbotController', 'LayBoNhoAI failed', { error: err.message }, requestId);
      return res.status(500).json({ error: 'Không thể tải bộ nhớ người dùng.' });
    }
  };

  LuuBoNhoAI = async (req: AuthRequest, res: Response) => {
    const requestId = randomUUID();
    try {
      const userId = req.user!.sub;
      const data = req.body;
      const memory = await this.service.saveMemory(userId, data);
      logger.info('ChatbotController', 'LuuBoNhoAI saved', { userId, fields: Object.keys(data) }, requestId);
      return res.json(memory);
    } catch (err: any) {
      logger.error('ChatbotController', 'LuuBoNhoAI failed', { error: err.message }, requestId);
      return res.status(500).json({ error: 'Không thể cập nhật bộ nhớ người dùng.' });
    }
  };

  XoaBoNhoAI = async (req: AuthRequest, res: Response) => {
    const requestId = randomUUID();
    try {
      const userId = req.user!.sub;
      const result = await this.service.deleteMemory(userId);
      logger.info('ChatbotController', 'XoaBoNhoAI deleted', { userId }, requestId);
      return res.json(result);
    } catch (err: any) {
      logger.error('ChatbotController', 'XoaBoNhoAI failed', { error: err.message }, requestId);
      return res.status(500).json({ error: 'Không thể xóa bộ nhớ người dùng.' });
    }
  };

  deleteConversation = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const conversationId = req.params.id;
      const result = await this.service.deleteConversation(conversationId, userId);
      return res.json(result);
    } catch (err: any) {
      console.error('[chatbot/deleteConversation]', err);
      return res.status(400).json({ error: err.message || 'Không thể xóa cuộc hội thoại.' });
    }
  };
}
