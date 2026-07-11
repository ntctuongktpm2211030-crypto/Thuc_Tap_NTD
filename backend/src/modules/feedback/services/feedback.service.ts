import { FeedbackRepository } from '../repositories/feedback.repository';
import { CreateFeedbackDto, UpdateFeedbackDto } from '../types/feedback.types';
import prisma from '../../../config/db';

export class FeedbackService {
  private repo: FeedbackRepository;

  constructor() {
    this.repo = new FeedbackRepository();
  }

  async create(userId: string, data: CreateFeedbackDto) {
    // 1. Kiểm tra xem tin nhắn có tồn tại không
    const message = await prisma.chatMessage.findUnique({
      where: { id: data.messageId },
    });

    if (!message) {
      throw new Error('Không tìm thấy tin nhắn AI cần đánh giá.');
    }

    // 2. Kiểm tra xem tin nhắn đó có phải của trợ lý ảo AI không (role !== 'assistant')
    if (message.role !== 'assistant') {
      throw new Error('Chỉ có thể đánh giá câu trả lời của AI.');
    }

    // 3. Kiểm tra xem tin nhắn này đã được đánh giá chưa
    const existing = await this.repo.getByMessageId(data.messageId);
    if (existing) {
      throw new Error('Tin nhắn này đã được đánh giá trước đó.');
    }

    return this.repo.create(userId, data);
  }

  async list(userId: string) {
    return this.repo.list(userId);
  }

  async update(id: string, userId: string, data: UpdateFeedbackDto) {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new Error('Không tìm thấy bản ghi đánh giá.');
    }

    if (existing.userId !== userId) {
      throw new Error('Bạn không có quyền cập nhật bản ghi đánh giá này.');
    }

    return this.repo.update(id, data);
  }

  async delete(id: string, userId: string) {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new Error('Không tìm thấy bản ghi đánh giá.');
    }

    if (existing.userId !== userId) {
      throw new Error('Bạn không có quyền xóa bản ghi đánh giá này.');
    }

    await this.repo.delete(id);
    return { success: true, message: 'Đã xóa đánh giá thành công.' };
  }
}
