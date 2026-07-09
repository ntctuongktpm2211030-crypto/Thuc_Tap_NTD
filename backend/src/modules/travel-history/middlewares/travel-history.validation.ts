import { Request, Response, NextFunction } from 'express';

export function validateCreateTravelHistory(req: Request, res: Response, next: NextFunction) {
  const { location, time, rating, cost } = req.body;

  if (!location || typeof location !== 'string' || location.trim().length === 0) {
    return res.status(400).json({ error: 'location (địa điểm đã đi) là bắt buộc và phải là chuỗi ký tự.' });
  }
  if (!time || typeof time !== 'string' || isNaN(Date.parse(time))) {
    return res.status(400).json({ error: 'time (thời gian) là bắt buộc và phải là định dạng ngày hợp lệ.' });
  }
  if (rating !== undefined && typeof rating !== 'string') {
    return res.status(400).json({ error: 'rating (đánh giá) phải là một chuỗi ký tự.' });
  }
  if (cost !== undefined && typeof cost !== 'number') {
    return res.status(400).json({ error: 'cost (chi phí) phải là một số thực.' });
  }

  next();
}

export function validateUpdateTravelHistory(req: Request, res: Response, next: NextFunction) {
  const { location, time, rating, cost } = req.body;

  if (location !== undefined && (typeof location !== 'string' || location.trim().length === 0)) {
    return res.status(400).json({ error: 'location phải là chuỗi ký tự không rỗng.' });
  }
  if (time !== undefined && (typeof time !== 'string' || isNaN(Date.parse(time)))) {
    return res.status(400).json({ error: 'time phải là một chuỗi định dạng ngày hợp lệ.' });
  }
  if (rating !== undefined && typeof rating !== 'string') {
    return res.status(400).json({ error: 'rating phải là chuỗi ký tự.' });
  }
  if (cost !== undefined && typeof cost !== 'number') {
    return res.status(400).json({ error: 'cost phải là một số thực.' });
  }

  next();
}
