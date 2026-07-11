import prisma from '../../../config/db';
import { CreateToolCallDto, UpdateToolCallDto } from '../types/tool-call.types';

export class ToolCallRepository {
  async create(data: CreateToolCallDto) {
    return prisma.toolCall.create({
      data: {
        messageId: data.messageId,
        toolName: data.toolName,
        input: data.input,
        output: data.output || null,
        status: data.status,
      },
    });
  }

  async listByMessageId(messageId: string) {
    return prisma.toolCall.findMany({
      where: { messageId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getById(id: string) {
    return prisma.toolCall.findUnique({
      where: { id },
      include: {
        message: {
          include: {
            conversation: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateToolCallDto) {
    return prisma.toolCall.update({
      where: { id },
      data: {
        toolName: data.toolName ?? undefined,
        input: data.input ?? undefined,
        output: data.output !== undefined ? data.output : undefined,
        status: data.status ?? undefined,
      },
    });
  }

  async delete(id: string) {
    return prisma.toolCall.delete({
      where: { id },
    });
  }

  async listAll(userId: string) {
    return prisma.toolCall.findMany({
      where: {
        message: {
          conversation: {
            userId,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
