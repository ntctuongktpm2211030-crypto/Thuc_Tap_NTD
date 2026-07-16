import { Request, Response } from 'express';
import { CacheService } from '../services/cache.service';
import { CacheType } from '../types/cache.types';

export class CacheController {
  private service: CacheService;

  constructor() {
    this.service = new CacheService();
  }

  set = async (req: Request, res: Response) => {
    try {
      const { type, key, value, ttlSeconds } = req.body;

      if (!type || !['place', 'food', 'blog', 'hotel', 'restaurant', 'event'].includes(type)) {
        return res.status(400).json({ error: 'type phải là place, food, blog, hotel, restaurant hoặc event.' });
      }
      if (!key || typeof key !== 'string' || key.trim().length === 0) {
        return res.status(400).json({ error: 'key không được để trống.' });
      }
      if (value === undefined) {
        return res.status(400).json({ error: 'value không được để trống.' });
      }
      if (!ttlSeconds || typeof ttlSeconds !== 'number' || ttlSeconds <= 0) {
        return res.status(400).json({ error: 'ttlSeconds phải là số dương tính bằng giây.' });
      }

      const result = await this.service.set(type as CacheType, key, value, ttlSeconds);
      return res.status(201).json({
        success: true,
        message: 'Đã lưu dữ liệu vào cache thành công.',
        expiresAt: result.expiresAt,
      });
    } catch (err: any) {
      console.error('[cache/set]', err);
      return res.status(500).json({ error: err.message || 'Không thể lưu cache.' });
    }
  };

  get = async (req: Request, res: Response) => {
    try {
      const type = req.params.type as CacheType;
      const key = req.params.key;

      if (!['place', 'food', 'blog', 'hotel', 'restaurant', 'event'].includes(type)) {
        return res.status(400).json({ error: 'type phải là place, food, blog, hotel, restaurant hoặc event.' });
      }

      const cachedData = await this.service.get(type, key);
      if (cachedData === null) {
        return res.status(404).json({ error: 'Cache không tồn tại hoặc đã hết hạn (expired).' });
      }

      return res.json({ key, value: cachedData });
    } catch (err: any) {
      console.error('[cache/get]', err);
      return res.status(500).json({ error: 'Không thể tải cache.' });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const type = req.params.type as CacheType;
      const key = req.params.key;

      if (!['place', 'food', 'blog', 'hotel', 'restaurant', 'event'].includes(type)) {
        return res.status(400).json({ error: 'type phải là place, food, blog, hotel, restaurant hoặc event.' });
      }

      await this.service.delete(type, key);
      return res.json({ success: true, message: `Đã xóa cache khóa [${key}] thành công.` });
    } catch (err: any) {
      console.error('[cache/delete]', err);
      return res.status(500).json({ error: 'Không thể xóa cache.' });
    }
  };

  clearExpired = async (req: Request, res: Response) => {
    try {
      const { type } = req.body;
      if (!type || !['place', 'food', 'blog', 'hotel', 'restaurant', 'event'].includes(type)) {
        return res.status(400).json({ error: 'type phải là place, food, blog, hotel, restaurant hoặc event.' });
      }

      const result = await this.service.clearExpired(type as CacheType);
      return res.json({
        success: true,
        message: `Đã dọn dẹp cache hết hạn thành công.`,
        deletedCount: result.count,
      });
    } catch (err: any) {
      console.error('[cache/clearExpired]', err);
      return res.status(500).json({ error: 'Không thể dọn dẹp cache hết hạn.' });
    }
  };
}
