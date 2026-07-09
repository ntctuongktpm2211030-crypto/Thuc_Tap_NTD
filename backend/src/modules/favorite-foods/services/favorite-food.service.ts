import { FavoriteFoodRepository } from '../repositories/favorite-food.repository';
import { CreateFavoriteFoodDto, UpdateFavoriteFoodDto } from '../types/favorite-food.types';

export class FavoriteFoodService {
  private repo: FavoriteFoodRepository;

  constructor() {
    this.repo = new FavoriteFoodRepository();
  }

  async create(userId: string, data: CreateFavoriteFoodDto) {
    return this.repo.create(userId, data);
  }

  async list(userId: string) {
    return this.repo.list(userId);
  }

  async update(id: string, userId: string, data: UpdateFavoriteFoodDto) {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new Error('Không tìm thấy bản ghi món ăn yêu thích.');
    }

    if (existing.userId !== userId) {
      throw new Error('Bạn không có quyền cập nhật bản ghi này.');
    }

    return this.repo.update(id, data);
  }

  async delete(id: string, userId: string) {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new Error('Không tìm thấy bản ghi món ăn yêu thích.');
    }

    if (existing.userId !== userId) {
      throw new Error('Bạn không có quyền xóa bản ghi này.');
    }

    await this.repo.delete(id);
    return { success: true, message: 'Đã xóa món ăn yêu thích thành công.' };
  }
}
