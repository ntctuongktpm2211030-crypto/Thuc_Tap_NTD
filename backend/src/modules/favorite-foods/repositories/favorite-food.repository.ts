import prisma from '../../../config/db';
import { CreateFavoriteFoodDto, UpdateFavoriteFoodDto } from '../types/favorite-food.types';

export class FavoriteFoodRepository {
  async create(userId: string, data: CreateFavoriteFoodDto) {
    return prisma.favoriteFood.create({
      data: {
        userId,
        name: data.name,
        region: data.region || null,
        description: data.description || null,
        rating: data.rating ?? null,
      },
    });
  }

  async list(userId: string) {
    return prisma.favoriteFood.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    return prisma.favoriteFood.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: UpdateFavoriteFoodDto) {
    return prisma.favoriteFood.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        region: data.region !== undefined ? data.region : undefined,
        description: data.description !== undefined ? data.description : undefined,
        rating: data.rating !== undefined ? data.rating : undefined,
      },
    });
  }

  async delete(id: string) {
    return prisma.favoriteFood.delete({
      where: { id },
    });
  }
}
