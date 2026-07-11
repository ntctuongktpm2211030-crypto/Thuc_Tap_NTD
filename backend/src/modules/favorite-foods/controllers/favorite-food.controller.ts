import { Response } from 'express';
import { AuthRequest } from '../../auth/auth.middleware';
import { FavoriteFoodService } from '../services/favorite-food.service';

export class FavoriteFoodController {
  private service: FavoriteFoodService;

  constructor() {
    this.service = new FavoriteFoodService();
  }

  create = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const data = req.body;
      const created = await this.service.create(userId, data);
      return res.status(201).json(created);
    } catch (err: any) {
      console.error('[favorite-food/create]', err);
      return res.status(500).json({ error: err.message || 'Không thể tạo bản ghi món ăn yêu thích.' });
    }
  };

  list = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const list = await this.service.list(userId);
      return res.json(list);
    } catch (err: any) {
      console.error('[favorite-food/list]', err);
      return res.status(500).json({ error: 'Không thể tải danh sách món ăn yêu thích.' });
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
      console.error('[favorite-food/update]', err);
      return res.status(400).json({ error: err.message || 'Không thể cập nhật món ăn yêu thích.' });
    }
  };

  delete = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const id = req.params.id;
      const result = await this.service.delete(id, userId);
      return res.json(result);
    } catch (err: any) {
      console.error('[favorite-food/delete]', err);
      return res.status(400).json({ error: err.message || 'Không thể xóa món ăn yêu thích.' });
    }
  };
}
