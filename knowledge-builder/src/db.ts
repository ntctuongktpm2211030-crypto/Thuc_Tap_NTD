import { PrismaClient } from '../../backend/node_modules/@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Tự động load và ghi đè biến môi trường từ backend/.env để tránh bị cache trong terminal
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env'), override: true });

if (process.env.DIRECT_URL) {
  console.log('🔌 [Prisma] Đã chuyển kết nối sang DIRECT_URL (bỏ qua pgBouncer) để chạy import ổn định...');
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

export const prisma = new PrismaClient();
