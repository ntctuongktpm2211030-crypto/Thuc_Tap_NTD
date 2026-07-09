import { Request, Response, NextFunction } from 'express';

export function validateCreateFavoriteFood(req: Request, res: Response, next: NextFunction) {
  const { name, region, description, rating } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'name (tên món ăn) là bắt buộc và phải là chuỗi ký tự không rỗng.' });
  }

  if (region !== undefined && typeof region !== 'string') {
    return res.status(400).json({ error: 'region (khu vực) phải là chuỗi ký tự.' });
  }

  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({ error: 'description (mô tả) phải là chuỗi ký tự.' });
  }

  if (rating !== undefined) {
    if (typeof rating !== 'number' || rating < 0 || rating > 5) {
      return res.status(400).json({ error: 'rating (điểm đánh giá) phải là số thực nằm trong khoảng từ 0 đến 5.' });
    }
  }

  next();
}

export function validateUpdateFavoriteFood(req: Request, res: Response, next: NextFunction) {
  const { name, region, description, rating } = req.body;

  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    return res.status(400).json({ error: 'name phải là chuỗi ký tự không rỗng.' });
  }

  if (region !== undefined && typeof region !== 'string') {
    return res.status(400).json({ error: 'region phải là chuỗi ký tự.' });
  }

  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({ error: 'description phải là chuỗi ký tự.' });
  }

  if (rating !== undefined) {
    if (typeof rating !== 'number' || rating < 0 || rating > 5) {
      return res.status(400).json({ error: 'rating phải là số thực nằm trong khoảng từ 0 đến 5.' });
    }
  }

  next();
}
