/** Dữ liệu blog Khám phá + metadata cho bộ lọc */

export interface ExplorePost {
  id: string;
  authorId?: string;
  author: string;
  handle: string;
  avatar: string;
  verified: boolean;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  images?: string[];
  tags: string[];
  category: string;
  location: string;
  province: string;
  region: 'Bắc' | 'Trung' | 'Nam';
  lat: number;
  lng: number;
  destinations: string[];
  dishes: string[];
  cultureThemes: string[];
  date: string;
  readTime: number;
  likes: number;
  comments: { id: string; authorId?: string; author: string; avatar: string; text: string; date: string }[];
  bookmarked: boolean;
  liked: boolean;
}

export const EXPLORE_DESTINATIONS = [
  'Hà Nội', 'Sapa', 'Hạ Long', 'Ninh Bình', 'Huế', 'Đà Nẵng', 'Hội An',
  'Quy Nhơn', 'Nha Trang', 'Đà Lạt', 'Phú Quốc', 'Hà Giang', 'Cần Thơ', 'Sa Pa',
];

export const EXPLORE_DISHES = [
  'Phở', 'Bún chả', 'Bánh mì', 'Cơm tấm', 'Bánh xèo', 'Gỏi cuốn',
  'Bún bò Huế', 'Cao lầu', 'Mì Quảng', 'Chả cá', 'Bánh cuốn', 'Nem rán',
  'Bánh flan', 'Cà phê trứng', 'Lẩu', 'Hải sản',
];

export const EXPLORE_CULTURE = [
  'Lễ hội', 'Di sản UNESCO', 'Làng nghề', 'Chùa chiền', 'Phố cổ',
  'Dân tộc thiểu số', 'Nhạc cụ truyền thống', 'Áo dài', 'Lễ hội đèn lồng',
  'Kiến trúc Pháp', 'Văn hóa cà phê',
];

export const EXPLORE_REGIONS = ['Tất cả miền', 'Bắc', 'Trung', 'Nam'] as const;

export const EXPLORE_CATEGORIES = [
  'Tất cả', 'Thiên nhiên', 'Ẩm thực', 'Phiêu lưu', 'Văn hóa', 'Sang trọng', 'Biển đảo', 'Nghỉ dưỡng',
];

export const EXPLORE_SORT_OPTIONS = [
  { id: 'newest', label: 'Mới nhất' },
  { id: 'popular', label: 'Nhiều tim nhất' },
  { id: 'nearest', label: 'Gần bạn nhất' },
  { id: 'short', label: 'Đọc nhanh (<5 phút)' },
] as const;

export type ExploreSortId = (typeof EXPLORE_SORT_OPTIONS)[number]['id'];

export const INITIAL_EXPLORE_POSTS: ExplorePost[] = [];

/** Khoảng cách km (Haversine) */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
