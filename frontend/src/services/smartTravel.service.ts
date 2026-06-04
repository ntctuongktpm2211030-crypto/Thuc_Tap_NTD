/**
 * SmartTravel API Service Layer
 * Provides typed, documented wrappers around all backend endpoints.
 * All authenticated calls automatically attach JWT via axios interceptors.
 */
import apiClient from './api';

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────
export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload { email: string; password: string; fullName: string; }
export interface AuthResponse {
  message: string;
  user: { id: string; email: string; fullName: string; role: string; avatarUrl?: string };
  accessToken: string;
  refreshToken: string;
}
export interface CurrentUser {
  id: string; email: string; role: string; isVerified: boolean;
  fullName: string; avatarUrl?: string; bio?: string; homeLocation?: string;
  preferences?: TravelPreferences; createdAt: string;
}
export interface TravelPreferences {
  preferredPace: string; dailyBudget: number;
  activities: string[]; destinationTypes: string[]; foodPreferences: string[];
}
export interface AIGeneratePayload {
  destination: string; durationDays: number; dailyBudget: number;
  interests: string[]; travelStyle: string;
}
export interface Waypoint { id: string; name: string; latitude: number; longitude: number; }
export interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  createdAt: string;
  tripId?: string | null;
  author: {
    id: string;
    email: string;
    profile?: { fullName: string; avatarUrl?: string | null } | null;
  };
  _count?: { likes: number; comments: number; bookmarks: number };
  isLiked?: boolean;
  isBookmarked?: boolean;
}
export interface Comment {
  id: string; content: string; createdAt: string;
  author: { profile?: { fullName: string; avatarUrl?: string } };
}
export interface Destination {
  id: string; name: string; description?: string; latitude: number; longitude: number;
  category: string; averageRating: number; address?: string; openingHours?: string;
  distanceKm?: number;
}

// ─────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────
export const authService = {
  register: (payload: RegisterPayload) =>
    apiClient.post<AuthResponse>('/auth/register', payload).then(r => r.data),

  login: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', payload).then(r => r.data),

  refreshToken: (refreshToken: string) =>
    apiClient.post<{ accessToken: string }>('/auth/refresh', { refreshToken }).then(r => r.data),

  me: () =>
    apiClient.get<CurrentUser>('/auth/me').then(r => r.data),

  /** Persist tokens and user in localStorage */
  saveSession: (res: AuthResponse) => {
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    localStorage.setItem('user', JSON.stringify(res.user));
  },

  clearSession: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getStoredUser: () => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },

  isLoggedIn: () => !!localStorage.getItem('accessToken'),
};

// ─────────────────────────────────────────────────────────
// TRIPS
// ─────────────────────────────────────────────────────────
export const tripsService = {
  list: () => apiClient.get('/trips').then(r => r.data),

  get: (id: string) => apiClient.get(`/trips/${id}`).then(r => r.data),

  create: (data: any) => apiClient.post('/trips', data).then(r => r.data),

  update: (id: string, data: any) => apiClient.put(`/trips/${id}`, data).then(r => r.data),

  delete: (id: string) => apiClient.delete(`/trips/${id}`),

  /** Generate AI itinerary via backend GPT-4o-mini integration */
  aiGenerate: (payload: AIGeneratePayload) =>
    apiClient.post('/trips/ai-generate', payload).then(r => r.data),

  /** TSP route optimization via backend algorithm */
  optimizeRoute: (waypoints: Waypoint[]) =>
    apiClient.post('/trips/optimize-route', { waypoints }).then(r => r.data),

  clone: (tripId: string) => apiClient.post(`/trips/${tripId}/clone`).then(r => r.data),

  discoverPublic: (params?: { destination?: string; page?: number }) =>
    apiClient.get('/trips/discover/public', { params }).then(r => r.data),
};

// ─────────────────────────────────────────────────────────
// POSTS (Blog)
// ─────────────────────────────────────────────────────────
export const postsService = {
  feed: (params?: { page?: number; limit?: number; q?: string }) =>
    apiClient.get<{ posts: Post[]; pagination: any }>('/posts', { params }).then(r => r.data),

  get: (id: string) => apiClient.get<Post>(`/posts/${id}`).then(r => r.data),

  create: (data: { content: string; mediaUrls?: string[]; tripId?: string }) =>
    apiClient.post<Post>('/posts', data).then(r => r.data),

  updatePost: (id: string, data: { content: string; mediaUrls?: string[] }) =>
    apiClient.put<Post>(`/posts/${id}`, data).then(r => r.data),

  delete: (id: string) => apiClient.delete(`/posts/${id}`),

  toggleLike: (id: string) =>
    apiClient.post<{ liked: boolean }>(`/posts/${id}/like`).then(r => r.data),

  toggleBookmark: (id: string) =>
    apiClient.post<{ bookmarked: boolean }>(`/posts/${id}/bookmark`).then(r => r.data),

  getComments: (id: string) =>
    apiClient.get<Comment[]>(`/posts/${id}/comments`).then(r => r.data),

  addComment: (id: string, content: string, parentId?: string) =>
    apiClient.post<Comment>(`/posts/${id}/comments`, { content, parentId }).then(r => r.data),

  myBookmarks: () => apiClient.get<Post[]>('/posts/bookmarks/mine').then(r => r.data),
};

// ─────────────────────────────────────────────────────────
// MAP / GIS
// ─────────────────────────────────────────────────────────
export const mapService = {
  checkIn: (destinationId: string, note?: string) =>
    apiClient.post('/map/checkin', { destinationId, note }).then(r => r.data),

  recentCheckins: (limit?: number) =>
    apiClient.get('/map/checkins', { params: { limit } }).then(r => r.data),

  nearbyCheckins: (lat: number, lng: number, radius?: number) =>
    apiClient.get('/map/checkins/nearby', { params: { lat, lng, radius } }).then(r => r.data),

  updateLocation: (latitude: number, longitude: number) =>
    apiClient.put('/map/location', { latitude, longitude }).then(r => r.data),

  friendsLocations: () => apiClient.get('/map/friends-locations').then(r => r.data),

  destinations: (params?: { lat?: number; lng?: number; radius?: number }) =>
    apiClient.get<Destination[]>('/map/destinations', { params }).then(r => r.data),
};

// ─────────────────────────────────────────────────────────
// RECOMMENDATIONS
// ─────────────────────────────────────────────────────────
export const recommendationsService = {
  forMe: (limit?: number) =>
    apiClient.get<Destination[]>('/recommendations', { params: { limit } }).then(r => r.data),

  nearby: (lat: number, lng: number, radius?: number, limit?: number) =>
    apiClient.get<Destination[]>('/recommendations/nearby', { params: { lat, lng, radius, limit } }).then(r => r.data),

  destinations: (params?: { category?: string; q?: string; page?: number }) =>
    apiClient.get('/recommendations/destinations', { params }).then(r => r.data),
};

// ─────────────────────────────────────────────────────────
// SOCIAL
// ─────────────────────────────────────────────────────────
export const socialService = {
  getProfile: (userId: string) =>
    apiClient.get(`/social/profile/${userId}`).then(r => r.data),

  updateProfile: (data: { fullName?: string; bio?: string; avatarUrl?: string; homeLocation?: string }) =>
    apiClient.put('/social/profile', data).then(r => r.data),

  toggleFollow: (targetUserId: string) =>
    apiClient.post<{ following: boolean }>(`/social/follow/${targetUserId}`).then(r => r.data),

  getFollowers: (userId: string) =>
    apiClient.get(`/social/followers/${userId}`).then(r => r.data),

  getFollowing: (userId: string) =>
    apiClient.get(`/social/following/${userId}`).then(r => r.data),

  notifications: () =>
    apiClient.get('/social/notifications').then(r => r.data),

  markAllRead: () =>
    apiClient.put('/social/notifications/read-all').then(r => r.data),

  updatePreferences: (prefs: Partial<TravelPreferences>) =>
    apiClient.put('/social/preferences', prefs).then(r => r.data),

  searchUsers: (q: string) =>
    apiClient.get('/social/search', { params: { q } }).then(r => r.data),
};
