import { Request, Response, NextFunction } from 'express';

export function validateCreateSavedPlace(req: Request, res: Response, next: NextFunction) {
  const { name, category, latitude, longitude, address, imageUrl } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'name (tên địa điểm) là bắt buộc và phải là chuỗi ký tự không rỗng.' });
  }

  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    return res.status(400).json({ error: 'category (loại địa điểm) là bắt buộc và phải là chuỗi ký tự không rỗng.' });
  }

  if (latitude === undefined || typeof latitude !== 'number' || isNaN(latitude)) {
    return res.status(400).json({ error: 'latitude (vĩ độ) là bắt buộc và phải là số thực.' });
  }

  if (longitude === undefined || typeof longitude !== 'number' || isNaN(longitude)) {
    return res.status(400).json({ error: 'longitude (kinh độ) là bắt buộc và phải là số thực.' });
  }

  if (address !== undefined && typeof address !== 'string') {
    return res.status(400).json({ error: 'address (địa chỉ) phải là chuỗi ký tự.' });
  }

  if (imageUrl !== undefined && typeof imageUrl !== 'string') {
    return res.status(400).json({ error: 'imageUrl (hình ảnh) phải là chuỗi ký tự.' });
  }

  next();
}

export function validateUpdateSavedPlace(req: Request, res: Response, next: NextFunction) {
  const { name, category, latitude, longitude, address, imageUrl } = req.body;

  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    return res.status(400).json({ error: 'name phải là chuỗi ký tự không rỗng.' });
  }

  if (category !== undefined && (typeof category !== 'string' || category.trim().length === 0)) {
    return res.status(400).json({ error: 'category phải là chuỗi ký tự không rỗng.' });
  }

  if (latitude !== undefined && (typeof latitude !== 'number' || isNaN(latitude))) {
    return res.status(400).json({ error: 'latitude phải là số thực.' });
  }

  if (longitude !== undefined && (typeof longitude !== 'number' || isNaN(longitude))) {
    return res.status(400).json({ error: 'longitude phải là số thực.' });
  }

  if (address !== undefined && typeof address !== 'string') {
    return res.status(400).json({ error: 'address phải là chuỗi ký tự.' });
  }

  if (imageUrl !== undefined && typeof imageUrl !== 'string') {
    return res.status(400).json({ error: 'imageUrl phải là chuỗi ký tự.' });
  }

  next();
}
