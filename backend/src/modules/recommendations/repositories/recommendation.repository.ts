import prisma from '../../../config/db';
import { CreateRecommendationDto, UpdateRecommendationDto } from '../types/recommendation.types';

export class RecommendationRepository {
  async createRecommendation(userId: string, data: CreateRecommendationDto) {
    return prisma.userRecommendation.create({
      data: {
        userId,
        location: data.location,
        priority: data.priority,
        reason: data.reason || null,
        type: data.type,
      },
    });
  }

  async getRecommendationsByUserId(userId: string) {
    return prisma.userRecommendation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRecommendationById(id: string) {
    return prisma.userRecommendation.findUnique({
      where: { id },
    });
  }

  async updateRecommendation(id: string, data: UpdateRecommendationDto) {
    return prisma.userRecommendation.update({
      where: { id },
      data: {
        location: data.location ?? undefined,
        priority: data.priority ?? undefined,
        reason: data.reason !== undefined ? data.reason : undefined,
        type: data.type ?? undefined,
      },
    });
  }

  async deleteRecommendation(id: string) {
    return prisma.userRecommendation.delete({
      where: { id },
    });
  }
}
