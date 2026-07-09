import { Request, Response, NextFunction } from 'express';

export function validateCreateFeedback(req: Request, res: Response, next: NextFunction) {
  const { messageId, rating, comment } = req.body;

  if (!messageId || typeof messageId !== 'string' || messageId.trim().length === 0) {
    return res.status(400).json({ error: 'messageId là bắt buộc và phải là chuỗi ký tự.' });
  }

  if (rating === undefined || typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'rating là bắt buộc và phải là số nguyên từ 1 đến 5.' });
  }

  if (comment !== undefined && typeof comment !== 'string') {
    return res.status(400).json({ error: 'comment phải là chuỗi ký tự.' });
  }

  next();
}

export function validateUpdateFeedback(req: Request, res: Response, next: NextFunction) {
  const { rating, comment } = req.body;

  if (rating !== undefined && (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return res.status(400).json({ error: 'rating phải là số nguyên từ 1 đến 5.' });
  }

  if (comment !== undefined && typeof comment !== 'string') {
    return res.status(400).json({ error: 'comment phải là chuỗi ký tự.' });
  }

  next();
}
