import { ToolCallRepository } from '../repositories/tool-call.repository';
import { CreateToolCallDto, UpdateToolCallDto } from '../types/tool-call.types';
import prisma from '../../../config/db';

export class ToolCallService {
  private repo: ToolCallRepository;

  constructor() {
    this.repo = new ToolCallRepository();
  }

  async create(userId: string, data: CreateToolCallDto) {
    // 1. Kiểm tra xem tin nhắn có tồn tại và thuộc về user không
    const message = await prisma.chatMessage.findUnique({
      where: { id: data.messageId },
      include: {
        conversation: true,
      },
    });

    if (!message) {
      throw new Error('Không tìm thấy tin nhắn liên quan.');
    }

    if (message.conversation.userId !== userId) {
      throw new Error('Bạn không có quyền thêm lịch sử gọi tool cho tin nhắn này.');
    }

    return this.repo.create(data);
  }

  async listAll(userId: string) {
    return this.repo.listAll(userId);
  }

  async listByMessageId(userId: string, messageId: string) {
    // Kiểm tra quyền xem tin nhắn
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        conversation: true,
      },
    });

    if (!message) {
      throw new Error('Không tìm thấy tin nhắn liên quan.');
    }

    if (message.conversation.userId !== userId) {
      throw new Error('Bạn không có quyền xem thông tin của tin nhắn này.');
    }

    return this.repo.listByMessageId(messageId);
  }

  async update(id: string, userId: string, data: UpdateToolCallDto) {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new Error('Không tìm thấy lịch sử gọi tool.');
    }

    if (existing.message.conversation.userId !== userId) {
      throw new Error('Bạn không có quyền cập nhật lịch sử gọi tool này.');
    }

    return this.repo.update(id, data);
  }

  async delete(id: string, userId: string) {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new Error('Không tìm thấy lịch sử gọi tool.');
    }

    if (existing.message.conversation.userId !== userId) {
      throw new Error('Bạn không có quyền xóa lịch sử gọi tool này.');
    }

    await this.repo.delete(id);
    return { success: true, message: 'Đã xóa lịch sử gọi tool thành công.' };
  }
}
