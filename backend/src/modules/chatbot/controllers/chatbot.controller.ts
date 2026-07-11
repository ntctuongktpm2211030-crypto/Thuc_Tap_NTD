import { Response } from 'express';
import { AuthRequest } from '../../auth/auth.middleware';
import { ChatbotService } from '../services/chatbot.service';

export class ChatbotController {
  private service: ChatbotService;

  constructor() {
    this.service = new ChatbotService();
  }

  // ─── Conversations ──────────────────────────────────────────
  createConversation = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const { title } = req.body;
      const conversation = await this.service.createConversation(userId, title);
      return res.status(201).json(conversation);
    } catch (err: any) {
      console.error('[chatbot/createConversation]', err);
      return res.status(500).json({ error: err.message || 'Không thể tạo cuộc hội thoại.' });
    }
  };

  getConversations = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const list = await this.service.getConversations(userId);
      return res.json(list);
    } catch (err: any) {
      console.error('[chatbot/getConversations]', err);
      return res.status(500).json({ error: 'Không thể tải danh sách cuộc hội thoại.' });
    }
  };

  getConversation = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const conversationId = req.params.id;
      const details = await this.service.getConversationDetails(conversationId, userId);
      return res.json(details);
    } catch (err: any) {
      console.error('[chatbot/getConversation]', err);
      return res.status(404).json({ error: err.message || 'Không tìm thấy cuộc hội thoại.' });
    }
  };

  // ─── Message Flow ──────────────────────────────────────────
  sendMessage = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const conversationId = req.params.id;
      const { content } = req.body;
      const result = await this.service.sendMessage(conversationId, userId, content);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[chatbot/sendMessage]', err);
      return res.status(400).json({ error: err.message || 'Không thể gửi tin nhắn.' });
    }
  };

  regenerateResponse = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const messageId = req.params.messageId;
      const result = await this.service.regenerateResponse(messageId, userId);
      return res.json(result);
    } catch (err: any) {
      console.error('[chatbot/regenerateResponse]', err);
      return res.status(400).json({ error: err.message || 'Không thể tạo lại câu trả lời.' });
    }
  };

  // ─── Memory Module ──────────────────────────────────────────
  getMemory = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const memory = await this.service.getMemory(userId);
      if (!memory) {
        return res.status(404).json({ error: 'Người dùng chưa có dữ liệu bộ nhớ AI.' });
      }
      return res.json(memory);
    } catch (err: any) {
      console.error('[chatbot/getMemory]', err);
      return res.status(500).json({ error: 'Không thể tải bộ nhớ người dùng.' });
    }
  };

  saveMemory = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const data = req.body;
      const memory = await this.service.saveMemory(userId, data);
      return res.json(memory);
    } catch (err: any) {
      console.error('[chatbot/saveMemory]', err);
      return res.status(500).json({ error: 'Không thể cập nhật bộ nhớ người dùng.' });
    }
  };

  deleteMemory = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const result = await this.service.deleteMemory(userId);
      return res.json(result);
    } catch (err: any) {
      console.error('[chatbot/deleteMemory]', err);
      return res.status(500).json({ error: 'Không thể xóa bộ nhớ người dùng.' });
    }
  };
}
