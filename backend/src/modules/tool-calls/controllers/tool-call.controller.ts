import { Response } from 'express';
import { AuthRequest } from '../../auth/auth.middleware';
import { ToolCallService } from '../services/tool-call.service';

export class ToolCallController {
  private service: ToolCallService;

  constructor() {
    this.service = new ToolCallService();
  }

  create = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const data = req.body;
      const created = await this.service.create(userId, data);
      return res.status(201).json(created);
    } catch (err: any) {
      console.error('[tool-call/create]', err);
      return res.status(400).json({ error: err.message || 'Không thể ghi nhận lịch sử gọi tool.' });
    }
  };

  listAll = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const list = await this.service.listAll(userId);
      return res.json(list);
    } catch (err: any) {
      console.error('[tool-call/listAll]', err);
      return res.status(500).json({ error: 'Không thể tải danh sách lịch sử gọi tool.' });
    }
  };

  listByMessageId = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const messageId = req.params.messageId;
      const list = await this.service.listByMessageId(userId, messageId);
      return res.json(list);
    } catch (err: any) {
      console.error('[tool-call/listByMessageId]', err);
      return res.status(400).json({ error: err.message || 'Không thể tải lịch sử gọi tool của tin nhắn.' });
    }
  };

  update = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const id = req.params.id;
      const data = req.body;
      const updated = await this.service.update(id, userId, data);
      return res.json(updated);
    } catch (err: any) {
      console.error('[tool-call/update]', err);
      return res.status(400).json({ error: err.message || 'Không thể cập nhật lịch sử gọi tool.' });
    }
  };

  delete = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const id = req.params.id;
      const result = await this.service.delete(id, userId);
      return res.json(result);
    } catch (err: any) {
      console.error('[tool-call/delete]', err);
      return res.status(400).json({ error: err.message || 'Không thể xóa lịch sử gọi tool.' });
    }
  };
}
