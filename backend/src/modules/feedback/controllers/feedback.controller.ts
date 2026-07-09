import { Response } from 'express';
import { AuthRequest } from '../../auth/auth.middleware';
import { FeedbackService } from '../services/feedback.service';

export class FeedbackController {
  private service: FeedbackService;

  constructor() {
    this.service = new FeedbackService();
  }

  create = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const data = req.body;
      const created = await this.service.create(userId, data);
      return res.status(201).json(created);
    } catch (err: any) {
      console.error('[feedback/create]', err);
      return res.status(400).json({ error: err.message || 'Không thể tạo đánh giá.' });
    }
  };

  list = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const list = await this.service.list(userId);
      return res.json(list);
    } catch (err: any) {
      console.error('[feedback/list]', err);
      return res.status(500).json({ error: 'Không thể tải danh sách đánh giá.' });
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
      console.error('[feedback/update]', err);
      return res.status(400).json({ error: err.message || 'Không thể cập nhật đánh giá.' });
    }
  };

  delete = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const id = req.params.id;
      const result = await this.service.delete(id, userId);
      return res.json(result);
    } catch (err: any) {
      console.error('[feedback/delete]', err);
      return res.status(400).json({ error: err.message || 'Không thể xóa đánh giá.' });
    }
  };
}
