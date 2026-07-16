import prisma from '../../../config/db';
import { SaveMemoryDto } from '../types/chatbot.types';

export class ChatbotRepository {
  // ─── Conversations ──────────────────────────────────────────
  async createConversation(userId: string, title?: string) {
    return prisma.chatConversation.create({
      data: {
        userId,
        title: title || 'Cuộc hội thoại mới',
      },
    });
  }

  async getConversationsByUserId(userId: string) {
    return prisma.chatConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            versions: {
              where: { isActive: true },
              take: 1,
            },
          },
        },
      },
    });
  }

  async getConversationById(id: string, userId: string) {
    return prisma.chatConversation.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            versions: {
              orderBy: { version: 'asc' },
            },
          },
        },
      },
    });
  }

  // ─── Messages & Versions ────────────────────────────────────
  async createMessage(conversationId: string, role: string) {
    return prisma.chatMessage.create({
      data: {
        conversationId,
        role,
      },
    });
  }

  async createMessageVersion(messageId: string, content: string, version: number, isActive: boolean = true) {
    return prisma.chatMessageVersion.create({
      data: {
        messageId,
        content,
        version,
        isActive,
      },
    });
  }

  async deactivateAllVersions(messageId: string) {
    return prisma.chatMessageVersion.updateMany({
      where: { messageId },
      data: { isActive: false },
    });
  }

  async getMessageById(messageId: string) {
    return prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        versions: true,
        conversation: true,
      },
    });
  }

  async getActiveVersion(messageId: string) {
    return prisma.chatMessageVersion.findFirst({
      where: { messageId, isActive: true },
    });
  }

  async getMaxVersion(messageId: string): Promise<number> {
    const agg = await prisma.chatMessageVersion.aggregate({
      where: { messageId },
      _max: { version: true },
    });
    return agg._max.version || 0;
  }

  async getConversationHistoryForAI(conversationId: string) {
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        versions: {
          where: { isActive: true },
        },
      },
    });

    return messages
      .filter((m) => m.versions.length > 0)
      .map((m) => ({
        role: m.role,
        content: m.versions[0].content,
      }));
  }

  // ─── AI Memory ──────────────────────────────────────────────
  async getMemoryByUserId(userId: string) {
    return prisma.aIMemory.findUnique({
      where: { userId },
    });
  }

  async upsertMemory(userId: string, data: SaveMemoryDto) {
    return prisma.aIMemory.upsert({
      where: { userId },
      create: {
        userId,
        travelPreferences: data.travelPreferences || [],
        favoriteFoods: data.favoriteFoods || [],
        budget: data.budget || null,
        transportation: data.transportation || [],
        favoriteLocations: data.favoriteLocations || [],
      },
      update: {
        travelPreferences: data.travelPreferences ?? undefined,
        favoriteFoods: data.favoriteFoods ?? undefined,
        budget: data.budget ?? undefined,
        transportation: data.transportation ?? undefined,
        favoriteLocations: data.favoriteLocations ?? undefined,
      },
    });
  }

  async deleteMemory(userId: string) {
    return prisma.aIMemory.deleteMany({
      where: { userId },
    });
  }

  async deleteConversation(id: string, userId: string) {
    const conversation = await prisma.chatConversation.findFirst({
      where: { id, userId },
    });
    if (!conversation) {
      throw new Error('Không tìm thấy cuộc hội thoại hoặc bạn không có quyền xóa.');
    }
    return prisma.chatConversation.delete({
      where: { id },
    });
  }
}
