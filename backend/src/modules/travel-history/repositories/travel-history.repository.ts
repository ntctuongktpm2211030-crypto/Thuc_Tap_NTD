import prisma from '../../../config/db';
import { CreateTravelHistoryDto, UpdateTravelHistoryDto } from '../types/travel-history.types';

export class TravelHistoryRepository {
  async create(userId: string, data: CreateTravelHistoryDto) {
    return prisma.travelHistory.create({
      data: {
        userId,
        location: data.location,
        time: new Date(data.time),
        rating: data.rating || null,
        cost: data.cost ?? 0.0,
      },
    });
  }

  async list(userId: string) {
    return prisma.travelHistory.findMany({
      where: { userId },
      orderBy: { time: 'desc' },
    });
  }

  async getById(id: string) {
    return prisma.travelHistory.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: UpdateTravelHistoryDto) {
    return prisma.travelHistory.update({
      where: { id },
      data: {
        location: data.location ?? undefined,
        time: data.time ? new Date(data.time) : undefined,
        rating: data.rating !== undefined ? data.rating : undefined,
        cost: data.cost ?? undefined,
      },
    });
  }

  async delete(id: string) {
    return prisma.travelHistory.delete({
      where: { id },
    });
  }
}
