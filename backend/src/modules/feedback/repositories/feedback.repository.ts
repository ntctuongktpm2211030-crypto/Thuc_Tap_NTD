import prisma from '../../../config/db';
import { CreateFeedbackDto, UpdateFeedbackDto } from '../types/feedback.types';

export class FeedbackRepository {
  async create(userId: string, data: CreateFeedbackDto) {
    return prisma.aIFeedback.create({
      data: {
        userId,
        messageId: data.messageId,
        rating: data.rating,
        comment: data.comment || null,
      },
    });
  }

  async getByMessageId(messageId: string) {
    return prisma.aIFeedback.findUnique({
      where: { messageId },
    });
  }

  async getById(id: string) {
    return prisma.aIFeedback.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: UpdateFeedbackDto) {
    return prisma.aIFeedback.update({
      where: { id },
      data: {
        rating: data.rating ?? undefined,
        comment: data.comment !== undefined ? data.comment : undefined,
      },
    });
  }

  async delete(id: string) {
    return prisma.aIFeedback.delete({
      where: { id },
    });
  }

  async list(userId: string) {
    return prisma.aIFeedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
