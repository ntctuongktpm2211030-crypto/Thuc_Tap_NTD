import { Request, Response, NextFunction } from 'express';

export function validateDashboardFilter(req: Request, res: Response, next: NextFunction) {
  const { filter } = req.query;

  if (filter !== undefined) {
    const validFilters = ['today', '7days', '30days', 'month', 'year'];
    if (typeof filter !== 'string' || !validFilters.includes(filter.toLowerCase())) {
      return res.status(400).json({
        error: `Tham số 'filter' không hợp lệ. Phải thuộc một trong các giá trị: ${validFilters.join(', ')}`
      });
    }
  }

  next();
}

export function validatePagination(req: Request, res: Response, next: NextFunction) {
  const { page, limit } = req.query;

  if (page !== undefined && (isNaN(Number(page)) || Number(page) <= 0)) {
    return res.status(400).json({ error: "Tham số 'page' phải là một số nguyên dương." });
  }

  if (limit !== undefined && (isNaN(Number(limit)) || Number(limit) <= 0)) {
    return res.status(400).json({ error: "Tham số 'limit' phải là một số nguyên dương." });
  }

  next();
}
