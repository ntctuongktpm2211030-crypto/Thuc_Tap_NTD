import { Response } from 'express';
import { AuthRequest } from '../../auth/auth.middleware';
import { TravelHistoryService } from '../services/travel-history.service';
import { broadcastDashboardEvent } from '../../dashboard/services/dashboard.socket';

export class TravelHistoryController {
  private service: TravelHistoryService;

  constructor() {
    this.service = new TravelHistoryService();
  }

  create = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const data = req.body;
      const created = await this.service.create(userId, data);
      
      if (created && created.rating !== null) {
        broadcastDashboardEvent(req, 'review', { 
          userId, 
          destinationId: created.destinationId, 
          rating: created.rating 
        });
      }

      return res.status(201).json(created);
    } catch (err: any) {
      console.error('[travel-history/create]', err);
      return res.status(500).json({ error: err.message || 'Không thể tạo bản ghi lịch sử du lịch.' });
    }
  };

  list = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const list = await this.service.list(userId);
      return res.json(list);
    } catch (err: any) {
      console.error('[travel-history/list]', err);
      return res.status(500).json({ error: 'Không thể tải danh sách lịch sử du lịch.' });
    }
  };

  update = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const id = req.params.id;
      const data = req.body;
      const updated = await this.service.update(id, userId, data);
      
      if (updated && updated.rating !== null) {
        broadcastDashboardEvent(req, 'review', { 
          userId, 
          destinationId: updated.destinationId, 
          rating: updated.rating 
        });
      }

      return res.json(updated);
    } catch (err: any) {
      console.error('[travel-history/update]', err);
      return res.status(400).json({ error: err.message || 'Không thể cập nhật lịch sử du lịch.' });
    }
  };

  delete = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const id = req.params.id;
      const result = await this.service.delete(id, userId);
      return res.json(result);
    } catch (err: any) {
      console.error('[travel-history/delete]', err);
      return res.status(400).json({ error: err.message || 'Không thể xóa lịch sử du lịch.' });
    }
  };
}
