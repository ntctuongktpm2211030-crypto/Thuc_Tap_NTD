import { ItineraryRepository } from '../repositories/itinerary.repository';
import { CreateItineraryDto, AddActivityDto, UpdateActivityDto } from '../types/itinerary.types';

export class ItineraryService {
  private repo: ItineraryRepository;

  constructor() {
    this.repo = new ItineraryRepository();
  }

  // ─── Itinerary ──────────────────────────────────────────────
  async createItinerary(userId: string, data: CreateItineraryDto) {
    return this.repo.createItinerary(userId, data.title, data.description);
  }

  async getAllItineraries(userId: string) {
    return this.repo.getItinerariesByUserId(userId);
  }

  async getItineraryDetails(itineraryId: string, userId: string) {
    const itinerary = await this.repo.getItineraryById(itineraryId, userId);
    if (!itinerary) {
      throw new Error('Không tìm thấy lịch trình hoặc bạn không có quyền truy cập.');
    }
    return itinerary;
  }

  // ─── Day ────────────────────────────────────────────────────
  async addDayToItinerary(itineraryId: string, userId: string, dayIndex: number, dateStr?: string) {
    // Xác thực quyền sở hữu lịch trình
    const itinerary = await this.repo.getItineraryById(itineraryId, userId);
    if (!itinerary) {
      throw new Error('Lịch trình không tồn tại hoặc không thuộc về bạn.');
    }

    const date = dateStr ? new Date(dateStr) : undefined;
    return this.repo.addDay(itineraryId, dayIndex, date);
  }

  // ─── Activity ───────────────────────────────────────────────
  async addActivityToDay(dayId: string, userId: string, data: AddActivityDto) {
    // Xác thực ngày thuộc về lịch trình của người dùng
    const day = await this.repo.getDayById(dayId);
    if (!day) {
      throw new Error('Không tìm thấy ngày lập lịch trình chỉ định.');
    }

    if (day.itinerary.userId !== userId) {
      throw new Error('Bạn không có quyền thêm hoạt động vào lịch trình này.');
    }

    return this.repo.addActivity(dayId, data);
  }

  async updateActivity(activityId: string, userId: string, data: UpdateActivityDto) {
    // Xác thực hoạt động thuộc về lịch trình của người dùng
    const activity = await this.repo.getActivityById(activityId);
    if (!activity) {
      throw new Error('Không tìm thấy hoạt động du lịch.');
    }

    if (activity.day.itinerary.userId !== userId) {
      throw new Error('Bạn không có quyền cập nhật hoạt động này.');
    }

    return this.repo.updateActivity(activityId, data);
  }

  async deleteActivity(activityId: string, userId: string) {
    // Xác thực hoạt động thuộc về lịch trình của người dùng
    const activity = await this.repo.getActivityById(activityId);
    if (!activity) {
      throw new Error('Không tìm thấy hoạt động du lịch.');
    }

    if (activity.day.itinerary.userId !== userId) {
      throw new Error('Bạn không có quyền xóa hoạt động này.');
    }

    await this.repo.deleteActivity(activityId);
    return { success: true, message: 'Đã xóa hoạt động thành công.' };
  }
}
