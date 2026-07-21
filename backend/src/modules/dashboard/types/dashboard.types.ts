export interface DashboardSummary {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  totalCheckins: number;
  totalReviews: number;
  totalSearches: number;
  activeUsers: number;
}

export interface RegistrationStats {
  date: string; // YYYY-MM-DD or HH:00
  newUsers: number;
  activeUsers: number;
}

export interface PosterInfo {
  avatar: string | null;
  name: string;
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
}

export interface PostStats {
  totalPosts: number;
  todayPosts: number;
  weeklyPosts: number;
  monthlyPosts: number;
  topPosters: PosterInfo[];
}

export interface TopPostInfo {
  id: string;
  title: string;
  thumbnail: string | null;
  author: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  createdAt: string;
  score: number;
}

export interface TopUserInfo {
  id: string;
  name: string;
  avatar: string | null;
  post: number;
  receivedLikes: number;
  receivedComments: number;
  followers: number;
  checkins: number;
  score: number;
}

export interface CheckinLocationInfo {
  locationName: string;
  province: string;
  checkinCount: number;
  uniqueUsers: number;
}

export interface HotLocationInfo {
  id: string;
  thumbnail: string | null;
  locationName: string;
  province: string;
  hotScore: number;
  searchCount: number;
  checkinCount: number;
  reviewCount: number;
  favoriteCount: number;
  viewCount: number;
}

export interface TopSearchInfo {
  keyword: string;
  searchCount: number;
}

export interface ProvinceStats {
  province: string;
  postCount: number;
  checkinCount: number;
  reviewCount: number;
  likeCount: number;
}

export interface InteractionStats {
  date: string;
  likes: number;
  comments: number;
  shares: number;
  reviews: number;
  followers: number;
}

export interface HeatmapPoint {
  day: number;  // 0: Sunday, 1: Monday, ..., 6: Saturday
  hour: number; // 0-23
  count: number;
}

export type DashboardFilter = 'today' | '7days' | '30days' | 'month' | 'year';
