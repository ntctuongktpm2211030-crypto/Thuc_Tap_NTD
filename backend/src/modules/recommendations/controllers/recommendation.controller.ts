import { Response } from 'express';
import { AuthRequest } from '../../auth/auth.middleware';
import { RecommendationService } from '../services/recommendation.service';

export class RecommendationController {
  private service: RecommendationService;

  constructor() {
    this.service = new RecommendationService();
  }

  createRecommendation = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const data = req.body;
      const rec = await this.service.createRecommendation(userId, data);
      return res.status(201).json(rec);
    } catch (err: any) {
      console.error('[recommendation/create]', err);
      return res.status(500).json({ error: err.message || 'Không thể tạo bản ghi gợi ý.' });
    }
  };

  getUserRecommendations = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const list = await this.service.getUserRecommendations(userId);
      return res.json(list);
    } catch (err: any) {
      console.error('[recommendation/getUserRecommendations]', err);
      return res.status(500).json({ error: 'Không thể tải danh sách gợi ý.' });
    }
  };

  updateRecommendation = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const id = req.params.id;
      const data = req.body;
      const updated = await this.service.updateRecommendation(id, userId, data);
      return res.json(updated);
    } catch (err: any) {
      console.error('[recommendation/update]', err);
      return res.status(400).json({ error: err.message || 'Không thể cập nhật bản ghi gợi ý.' });
    }
  };

  deleteRecommendation = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const id = req.params.id;
      const result = await this.service.deleteRecommendation(id, userId);
      return res.json(result);
    } catch (err: any) {
      console.error('[recommendation/delete]', err);
      return res.status(400).json({ error: err.message || 'Không thể xóa bản ghi gợi ý.' });
    }
  };
}
