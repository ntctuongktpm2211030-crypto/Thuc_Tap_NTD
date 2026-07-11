import prisma from '../../../config/db';
import { CreateSavedPlaceDto, UpdateSavedPlaceDto } from '../types/saved-place.types';

export class SavedPlaceRepository {
  async create(userId: string, data: CreateSavedPlaceDto) {
    return prisma.savedPlace.create({
      data: {
        userId,
        name: data.name,
        category: data.category,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address || null,
        imageUrl: data.imageUrl || null,
      },
    });
  }

  async list(userId: string) {
    return prisma.savedPlace.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    return prisma.savedPlace.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: UpdateSavedPlaceDto) {
    return prisma.savedPlace.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        category: data.category ?? undefined,
        latitude: data.latitude ?? undefined,
        longitude: data.longitude ?? undefined,
        address: data.address !== undefined ? data.address : undefined,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
      },
    });
  }

  async delete(id: string) {
    return prisma.savedPlace.delete({
      where: { id },
    });
  }
}
