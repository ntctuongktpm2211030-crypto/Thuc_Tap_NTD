import prisma from '../../../config/db';
import { CacheType } from '../types/cache.types';

export class CacheRepository {
  async get(type: CacheType, key: string) {
    switch (type) {
      case 'place':
        return prisma.placeCache.findUnique({ where: { key } });
      case 'food':
        return prisma.foodCache.findUnique({ where: { key } });
      case 'blog':
        return prisma.blogCache.findUnique({ where: { key } });
    }
  }

  async set(type: CacheType, key: string, value: string, expiresAt: Date) {
    const data = {
      key,
      value,
      expiresAt,
    };

    switch (type) {
      case 'place':
        return prisma.placeCache.upsert({
          where: { key },
          update: { value, expiresAt },
          create: data,
        });
      case 'food':
        return prisma.foodCache.upsert({
          where: { key },
          update: { value, expiresAt },
          create: data,
        });
      case 'blog':
        return prisma.blogCache.upsert({
          where: { key },
          update: { value, expiresAt },
          create: data,
        });
    }
  }

  async delete(type: CacheType, key: string) {
    try {
      switch (type) {
        case 'place':
          return await prisma.placeCache.delete({ where: { key } });
        case 'food':
          return await prisma.foodCache.delete({ where: { key } });
        case 'blog':
          return await prisma.blogCache.delete({ where: { key } });
      }
    } catch (err) {
      // Bỏ qua lỗi nếu cache không tồn tại
      return null;
    }
  }

  async clearExpired(type: CacheType) {
    const now = new Date();
    switch (type) {
      case 'place':
        return prisma.placeCache.deleteMany({ where: { expiresAt: { lte: now } } });
      case 'food':
        return prisma.foodCache.deleteMany({ where: { expiresAt: { lte: now } } });
      case 'blog':
        return prisma.blogCache.deleteMany({ where: { expiresAt: { lte: now } } });
    }
  }
}
