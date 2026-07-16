import { Response } from 'express';
import { AuthRequest } from '../../auth/auth.middleware';
import { SavedPlaceService } from '../services/saved-place.service';

export class SavedPlaceController {
  private service: SavedPlaceService;

  constructor() {
    this.service = new SavedPlaceService();
  }

  TaoDiaDiemDaLuu = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const data = req.body;
      const created = await this.service.create(userId, data);
      return res.status(201).json(created);
    } catch (err: any) {
      console.error('[saved-place/create]', err);
      return res.status(500).json({ error: err.message || 'Không thể lưu địa điểm.' });
    }
  };

  LayDanhSachDiaDiemDaLuu = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const list = await this.service.list(userId);
      return res.json(list);
    } catch (err: any) {
      console.error('[saved-place/list]', err);
      return res.status(500).json({ error: 'Không thể tải danh sách địa điểm đã lưu.' });
    }
  };

  CapNhatDiaDiemDaLuu = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const id = req.params.id;
      const data = req.body;
      const updated = await this.service.update(id, userId, data);
      return res.json(updated);
    } catch (err: any) {
      console.error('[saved-place/update]', err);
      return res.status(400).json({ error: err.message || 'Không thể cập nhật địa điểm đã lưu.' });
    }
  };

  XoaDiaDiemDaLuu = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const id = req.params.id;
      const result = await this.service.delete(id, userId);
      return res.json(result);
    } catch (err: any) {
      console.error('[saved-place/delete]', err);
      return res.status(400).json({ error: err.message || 'Không thể xóa địa điểm đã lưu.' });
    }
  };
}
