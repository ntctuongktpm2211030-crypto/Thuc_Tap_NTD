import { Request, Response, NextFunction } from 'express';

export function validateCreateItinerary(req: Request, res: Response, next: NextFunction) {
  const { title, description } = req.body;
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Tiêu đề lịch trình là bắt buộc và phải là một chuỗi ký tự.' });
  }
  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({ error: 'Mô tả lịch trình phải là một chuỗi ký tự.' });
  }
  next();
}

export function validateAddDay(req: Request, res: Response, next: NextFunction) {
  const { dayIndex, date } = req.body;
  if (dayIndex === undefined || typeof dayIndex !== 'number' || dayIndex <= 0) {
    return res.status(400).json({ error: 'dayIndex là bắt buộc và phải là số nguyên dương.' });
  }
  if (date !== undefined && typeof date !== 'string') {
    return res.status(400).json({ error: 'date phải là một chuỗi định dạng ngày hợp lệ (ISO format).' });
  }
  next();
}

export function validateAddActivity(req: Request, res: Response, next: NextFunction) {
  const { title, description, startTime, endTime, location, cost } = req.body;
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Tiêu đề hoạt động là bắt buộc và phải là chuỗi ký tự.' });
  }
  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({ error: 'Mô tả hoạt động phải là chuỗi ký tự.' });
  }
  if (startTime !== undefined && typeof startTime !== 'string') {
    return res.status(400).json({ error: 'startTime phải là chuỗi ký tự.' });
  }
  if (endTime !== undefined && typeof endTime !== 'string') {
    return res.status(400).json({ error: 'endTime phải là chuỗi ký tự.' });
  }
  if (location !== undefined && typeof location !== 'string') {
    return res.status(400).json({ error: 'location phải là chuỗi ký tự.' });
  }
  if (cost !== undefined && typeof cost !== 'number') {
    return res.status(400).json({ error: 'cost phải là số thực.' });
  }
  next();
}

export function validateUpdateActivity(req: Request, res: Response, next: NextFunction) {
  const { title, description, startTime, endTime, location, cost } = req.body;
  if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
    return res.status(400).json({ error: 'Tiêu đề hoạt động phải là chuỗi ký tự không rỗng.' });
  }
  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({ error: 'Mô tả hoạt động phải là chuỗi ký tự.' });
  }
  if (startTime !== undefined && typeof startTime !== 'string') {
    return res.status(400).json({ error: 'startTime phải là chuỗi ký tự.' });
  }
  if (endTime !== undefined && typeof endTime !== 'string') {
    return res.status(400).json({ error: 'endTime phải là chuỗi ký tự.' });
  }
  if (location !== undefined && typeof location !== 'string') {
    return res.status(400).json({ error: 'location phải là chuỗi ký tự.' });
  }
  if (cost !== undefined && typeof cost !== 'number') {
    return res.status(400).json({ error: 'cost phải là số thực.' });
  }
  next();
}
