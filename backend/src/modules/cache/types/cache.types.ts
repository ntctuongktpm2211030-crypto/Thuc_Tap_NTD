export type CacheType = 'place' | 'food' | 'blog' | 'hotel' | 'restaurant' | 'event';

export interface SetCacheDto {
  type: CacheType;
  key: string;
  value: string;
  ttlSeconds: number; // Thời gian sống của cache tính bằng giây
}

export interface GetCacheResponse {
  key: string;
  value: string;
  expiresAt: Date;
  isExpired: boolean;
}
