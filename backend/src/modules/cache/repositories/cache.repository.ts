import prisma from '../../../config/db';
import { CacheType } from '../types/cache.types';

export class CacheRepository {
  async get(type: CacheType, key: string) {
    return prisma.systemCache.findUnique({
      where: {
        key_type: { key, type },
      },
    });
  }

  async set(type: CacheType, key: string, value: string, expiresAt: Date) {
    return prisma.systemCache.upsert({
      where: {
        key_type: { key, type },
      },
      update: {
        value,
        expiresAt,
      },
      create: {
        key,
        type,
        value,
        expiresAt,
      },
    });
  }

  async delete(type: CacheType, key: string) {
    try {
      return await prisma.systemCache.delete({
        where: {
          key_type: { key, type },
        },
      });
    } catch (err) {
      // Bỏ qua lỗi nếu cache không tồn tại
      return null;
    }
  }

  async clearExpired(type: CacheType) {
    const now = new Date();
    return prisma.systemCache.deleteMany({
      where: {
        type,
        expiresAt: { lte: now },
      },
    });
  }
}
