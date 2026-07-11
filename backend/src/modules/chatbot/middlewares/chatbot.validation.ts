import { Request, Response, NextFunction } from 'express';

export function validateCreateConversation(req: Request, res: Response, next: NextFunction) {
  const { title } = req.body;
  if (title !== undefined && typeof title !== 'string') {
    return res.status(400).json({ error: 'Tiêu đề cuộc hội thoại phải là một chuỗi ký tự.' });
  }
  next();
}

export function validateSendMessage(req: Request, res: Response, next: NextFunction) {
  const { content } = req.body;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống và phải là chuỗi ký tự.' });
  }
  next();
}

export function validateSaveMemory(req: Request, res: Response, next: NextFunction) {
  const { travelPreferences, favoriteFoods, budget, transportation, favoriteLocations } = req.body;

  if (travelPreferences !== undefined && !Array.isArray(travelPreferences)) {
    return res.status(400).json({ error: 'travelPreferences phải là một mảng chuỗi.' });
  }
  if (favoriteFoods !== undefined && !Array.isArray(favoriteFoods)) {
    return res.status(400).json({ error: 'favoriteFoods phải là một mảng chuỗi.' });
  }
  if (budget !== undefined && typeof budget !== 'string' && budget !== null) {
    return res.status(400).json({ error: 'budget phải là một chuỗi hoặc null.' });
  }
  if (transportation !== undefined && !Array.isArray(transportation)) {
    return res.status(400).json({ error: 'transportation phải là một mảng chuỗi.' });
  }
  if (favoriteLocations !== undefined && !Array.isArray(favoriteLocations)) {
    return res.status(400).json({ error: 'favoriteLocations phải là một mảng chuỗi.' });
  }

  next();
}
