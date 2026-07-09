import { SavedPlaceRepository } from '../repositories/saved-place.repository';
import { CreateSavedPlaceDto, UpdateSavedPlaceDto } from '../types/saved-place.types';

export class SavedPlaceService {
  private repo: SavedPlaceRepository;

  constructor() {
    this.repo = new SavedPlaceRepository();
  }

  async create(userId: string, data: CreateSavedPlaceDto) {
    return this.repo.create(userId, data);
  }

  async list(userId: string) {
    return this.repo.list(userId);
  }

  async update(id: string, userId: string, data: UpdateSavedPlaceDto) {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new Error('Không tìm thấy địa điểm đã lưu.');
    }

    if (existing.userId !== userId) {
      throw new Error('Bạn không có quyền cập nhật địa điểm này.');
    }

    return this.repo.update(id, data);
  }

  async delete(id: string, userId: string) {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new Error('Không tìm thấy địa điểm đã lưu.');
    }

    if (existing.userId !== userId) {
      throw new Error('Bạn không có quyền xóa địa điểm này.');
    }

    await this.repo.delete(id);
    return { success: true, message: 'Đã xóa địa điểm đã lưu thành công.' };
  }
}
