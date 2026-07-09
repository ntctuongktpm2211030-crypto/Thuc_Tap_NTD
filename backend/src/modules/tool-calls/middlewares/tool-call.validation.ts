import { Request, Response, NextFunction } from 'express';

export function validateCreateToolCall(req: Request, res: Response, next: NextFunction) {
  const { messageId, toolName, input, output, status } = req.body;

  if (!messageId || typeof messageId !== 'string' || messageId.trim().length === 0) {
    return res.status(400).json({ error: 'messageId là bắt buộc và phải là chuỗi ký tự.' });
  }

  if (!toolName || typeof toolName !== 'string' || toolName.trim().length === 0) {
    return res.status(400).json({ error: 'toolName là bắt buộc và phải là chuỗi ký tự.' });
  }

  if (input === undefined || typeof input !== 'string' || input.trim().length === 0) {
    return res.status(400).json({ error: 'input là bắt buộc và phải là chuỗi ký tự.' });
  }

  if (output !== undefined && typeof output !== 'string') {
    return res.status(400).json({ error: 'output phải là chuỗi ký tự.' });
  }

  if (!status || typeof status !== 'string' || status.trim().length === 0) {
    return res.status(400).json({ error: 'status là bắt buộc và phải là chuỗi ký tự.' });
  }

  next();
}

export function validateUpdateToolCall(req: Request, res: Response, next: NextFunction) {
  const { toolName, input, output, status } = req.body;

  if (toolName !== undefined && (typeof toolName !== 'string' || toolName.trim().length === 0)) {
    return res.status(400).json({ error: 'toolName phải là chuỗi ký tự không rỗng.' });
  }

  if (input !== undefined && (typeof input !== 'string' || input.trim().length === 0)) {
    return res.status(400).json({ error: 'input phải là chuỗi ký tự không rỗng.' });
  }

  if (output !== undefined && typeof output !== 'string') {
    return res.status(400).json({ error: 'output phải là chuỗi ký tự.' });
  }

  if (status !== undefined && (typeof status !== 'string' || status.trim().length === 0)) {
    return res.status(400).json({ error: 'status phải là chuỗi ký tự không rỗng.' });
  }

  next();
}
