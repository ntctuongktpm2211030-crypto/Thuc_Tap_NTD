import { Request, Response, NextFunction } from 'express';

export function validateCreateRecommendation(req: Request, res: Response, next: NextFunction) {
  const { location, priority, reason, type } = req.body;

  if (!location || typeof location !== 'string' || location.trim().length === 0) {
    return res.status(400).json({ error: 'location (địa điểm đề xuất) là bắt buộc và phải là chuỗi ký tự.' });
  }
  if (!priority || typeof priority !== 'string' || priority.trim().length === 0) {
    return res.status(400).json({ error: 'priority (độ ưu tiên) là bắt buộc và phải là chuỗi ký tự.' });
  }
  if (reason !== undefined && typeof reason !== 'string') {
    return res.status(400).json({ error: 'reason (lý do gợi ý) phải là chuỗi ký tự.' });
  }
  if (!type || typeof type !== 'string' || type.trim().length === 0) {
    return res.status(400).json({ error: 'type (loại gợi ý) là bắt buộc và phải là chuỗi ký tự.' });
  }

  next();
}

export function validateUpdateRecommendation(req: Request, res: Response, next: NextFunction) {
  const { location, priority, reason, type } = req.body;

  if (location !== undefined && (typeof location !== 'string' || location.trim().length === 0)) {
    return res.status(400).json({ error: 'location phải là chuỗi ký tự không rỗng.' });
  }
  if (priority !== undefined && (typeof priority !== 'string' || priority.trim().length === 0)) {
    return res.status(400).json({ error: 'priority phải là chuỗi ký tự không rỗng.' });
  }
  if (reason !== undefined && typeof reason !== 'string') {
    return res.status(400).json({ error: 'reason phải là chuỗi ký tự.' });
  }
  if (type !== undefined && (typeof type !== 'string' || type.trim().length === 0)) {
    return res.status(400).json({ error: 'type phải là chuỗi ký tự không rỗng.' });
  }

  next();
}
