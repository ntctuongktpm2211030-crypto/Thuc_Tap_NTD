import { RecommendationRepository } from '../repositories/recommendation.repository';
import { CreateRecommendationDto, UpdateRecommendationDto } from '../types/recommendation.types';

export class RecommendationService {
  private repo: RecommendationRepository;

  constructor() {
    this.repo = new RecommendationRepository();
  }

  async createRecommendation(userId: string, data: CreateRecommendationDto) {
    return this.repo.createRecommendation(userId, data);
  }

  async getUserRecommendations(userId: string) {
    return this.repo.getRecommendationsByUserId(userId);
  }

  async updateRecommendation(id: string, userId: string, data: UpdateRecommendationDto) {
    const existing = await this.repo.getRecommendationById(id);
    if (!existing) {
      throw new Error('Không tìm thấy bản ghi gợi ý.');
    }

    if (existing.userId !== userId) {
      throw new Error('Bạn không có quyền cập nhật bản ghi gợi ý này.');
    }

    return this.repo.updateRecommendation(id, data);
  }

  async deleteRecommendation(id: string, userId: string) {
    const existing = await this.repo.getRecommendationById(id);
    if (!existing) {
      throw new Error('Không tìm thấy bản ghi gợi ý.');
    }

    if (existing.userId !== userId) {
      throw new Error('Bạn không có quyền xóa bản ghi gợi ý này.');
    }

    await this.repo.deleteRecommendation(id);
    return { success: true, message: 'Đã xóa bản ghi gợi ý thành công.' };
  }
}
