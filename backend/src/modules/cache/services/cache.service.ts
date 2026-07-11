import { CacheRepository } from '../repositories/cache.repository';
import { CacheType } from '../types/cache.types';

export class CacheService {
  private repo: CacheRepository;

  constructor() {
    this.repo = new CacheRepository();
  }

  /**
   * Lấy dữ liệu từ cache. Trả về null nếu cache không tồn tại hoặc đã hết hạn (TTL expired)
   */
  async get(type: CacheType, key: string): Promise<any | null> {
    const cached = await this.repo.get(type, key);
    if (!cached) {
      return null;
    }

    const now = new Date();
    if (now > cached.expiresAt) {
      // Đã hết hạn -> xóa cache ngầm để dọn dẹp và trả về null
      await this.repo.delete(type, key);
      return null;
    }

    // Trả về dữ liệu đã được parse (nếu là JSON) hoặc để dạng string tùy ứng dụng
    try {
      return JSON.parse(cached.value);
    } catch {
      return cached.value;
    }
  }

  /**
   * Lưu dữ liệu vào cache với thời gian sống (TTL) xác định bằng giây
   */
  async set(type: CacheType, key: string, value: any, ttlSeconds: number) {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const valueString = typeof value === 'string' ? value : JSON.stringify(value);
    return this.repo.set(type, key, valueString, expiresAt);
  }

  /**
   * Xóa cache thủ công
   */
  async delete(type: CacheType, key: string) {
    return this.repo.delete(type, key);
  }

  /**
   * Dọn dẹp toàn bộ cache hết hạn của loại chỉ định
   */
  async clearExpired(type: CacheType) {
    return this.repo.clearExpired(type);
  }
}
