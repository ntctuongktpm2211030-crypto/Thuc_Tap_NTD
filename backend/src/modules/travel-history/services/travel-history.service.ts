import { TravelHistoryRepository } from '../repositories/travel-history.repository';
import { CreateTravelHistoryDto, UpdateTravelHistoryDto } from '../types/travel-history.types';

export class TravelHistoryService {
  private repo: TravelHistoryRepository;

  constructor() {
    this.repo = new TravelHistoryRepository();
  }

  async create(userId: string, data: CreateTravelHistoryDto) {
    return this.repo.create(userId, data);
  }

  async list(userId: string) {
    return this.repo.list(userId);
  }

  async update(id: string, userId: string, data: UpdateTravelHistoryDto) {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new Error('Không tìm thấy bản ghi lịch sử du lịch.');
    }

    if (existing.userId !== userId) {
      throw new Error('Bạn không có quyền cập nhật bản ghi này.');
    }

    return this.repo.update(id, data);
  }

  async delete(id: string, userId: string) {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new Error('Không tìm thấy bản ghi lịch sử du lịch.');
    }

    if (existing.userId !== userId) {
      throw new Error('Bạn không có quyền xóa bản ghi này.');
    }

    await this.repo.delete(id);
    return { success: true, message: 'Đã xóa bản ghi lịch sử du lịch thành công.' };
  }
}
