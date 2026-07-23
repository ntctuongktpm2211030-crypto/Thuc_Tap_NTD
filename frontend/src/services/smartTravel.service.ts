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
  destination: string; durationDays: number; dailyBudget?: number;
  totalBudget?: number;
  currency?: string;
  interests: string[]; travelStyle: string;
  transportation?: string;
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
  likes?: {
    id: string;
    createdAt: string;
    user: {
      id: string;
      email: string;
      profile?: { fullName: string; avatarUrl?: string | null } | null;
    };
  }[];
  _count?: { likes: number; comments: number; bookmarks: number };
  isLiked?: boolean;
  isBookmarked?: boolean;
}
export interface Comment {
  id: string; content: string; createdAt: string;
  author: { profile?: { fullName: string; avatarUrl?: string } };
  replies?: Comment[];
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
  DangKy: (payload: RegisterPayload) =>
    apiClient.post<AuthResponse>('/auth/register', payload).then(r => r.data),

  DangNhap: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', payload).then(r => r.data),

  DangNhapGoogle: (idToken: string) =>
    apiClient.post<AuthResponse>('/auth/google', { idToken }).then(r => r.data),

  LamMoiToken: (refreshToken: string) =>
    apiClient.post<{ accessToken: string }>('/auth/refresh', { refreshToken }).then(r => r.data),

  LayThongTinCaNhan: () =>
    apiClient.get<CurrentUser>('/auth/me').then(r => r.data),

  LuuPhienDangNhap: (res: AuthResponse) => {
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    localStorage.setItem('user', JSON.stringify(res.user));
  },

  XoaPhienDangNhap: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  LayUserDaLuu: () => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },

  DaDangNhap: () => !!localStorage.getItem('accessToken'),

  // Alias tương thích ngược
  register: (payload: RegisterPayload) => authService.DangKy(payload),
  login: (payload: LoginPayload) => authService.DangNhap(payload),
  loginWithGoogle: (idToken: string) => authService.DangNhapGoogle(idToken),
  refreshToken: (refreshToken: string) => authService.LamMoiToken(refreshToken),
  me: () => authService.LayThongTinCaNhan(),
  saveSession: (res: AuthResponse) => authService.LuuPhienDangNhap(res),
  clearSession: () => authService.XoaPhienDangNhap(),
  getStoredUser: () => authService.LayUserDaLuu(),
  isLoggedIn: () => authService.DaDangNhap(),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }).then(r => r.data),

  verifyOtp: (email: string, otp: string) =>
    apiClient.post<{ resetToken: string }>('/auth/verify-otp', { email, otp }).then(r => r.data),

  resetPassword: (email: string, token: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { email, token, newPassword }).then(r => r.data),
};

// ─────────────────────────────────────────────────────────
// TRIPS
// ─────────────────────────────────────────────────────────
export const tripsService = {
  LayDanhSachChuyenDi: () => apiClient.get('/trips').then(r => r.data),
  LayChiTietChuyenDi: (id: string) => apiClient.get(`/trips/${id}`).then(r => r.data),
  TaoChuyenDi: (data: any) => apiClient.post('/trips', data).then(r => r.data),
  CapNhatChuyenDi: (id: string, data: any) => apiClient.put(`/trips/${id}`, data).then(r => r.data),
  XoaChuyenDi: (id: string) => apiClient.delete(`/trips/${id}`),
  TaoChuyenDiBangAI: (payload: AIGeneratePayload) =>
    apiClient.post('/trips/ai-generate', payload).then(r => r.data),
  TaoLaiMotPhanChuyenDiBangAI: (payload: any) =>
    apiClient.post('/trips/ai-regenerate-part', payload).then(r => r.data),
  ToiUuDuongDi: (waypoints: Waypoint[]) =>
    apiClient.post('/trips/optimize-route', { waypoints }).then(r => r.data),
  SaoChepChuyenDi: (tripId: string) => apiClient.post(`/trips/${tripId}/clone`).then(r => r.data),
  KhamPhaChuyenDiCongKhai: (params?: { destination?: string; page?: number }) =>
    apiClient.get('/trips/discover/public', { params }).then(r => r.data),

  // Alias tương thích ngược
  list: () => tripsService.LayDanhSachChuyenDi(),
  get: (id: string) => tripsService.LayChiTietChuyenDi(id),
  create: (data: any) => tripsService.TaoChuyenDi(data),
  update: (id: string, data: any) => tripsService.CapNhatChuyenDi(id, data),
  delete: (id: string) => tripsService.XoaChuyenDi(id),
  aiGenerate: (payload: AIGeneratePayload) => tripsService.TaoChuyenDiBangAI(payload),
  aiRegeneratePart: (payload: any) => tripsService.TaoLaiMotPhanChuyenDiBangAI(payload),
  optimizeRoute: (waypoints: Waypoint[]) => tripsService.ToiUuDuongDi(waypoints),
  clone: (tripId: string) => tripsService.SaoChepChuyenDi(tripId),
  };

// ─────────────────────────────────────────────────────────
// TRAVEL HISTORY
// ─────────────────────────────────────────────────────────
export const travelHistoryService = {
  LayDanhSachNhatKy: () => apiClient.get('/travel-history').then(r => r.data),
  TaoNhatKy: (data: { location: string; time: string; rating?: string; cost?: number }) =>
    apiClient.post('/travel-history', data).then(r => r.data),
  CapNhatNhatKy: (id: string, data: { location?: string; time?: string; rating?: string; cost?: number }) =>
    apiClient.put(`/travel-history/${id}`, data).then(r => r.data),
  XoaNhatKy: (id: string) => apiClient.delete(`/travel-history/${id}`).then(r => r.data),
};

// ─────────────────────────────────────────────────────────
// POSTS (Blog)
// ─────────────────────────────────────────────────────────
export const postsService = {
  LayBangTinBaiViet: (params?: { page?: number; limit?: number; q?: string }) =>
    apiClient.get<{ posts: Post[]; pagination: any }>('/posts', { params }).then(r => r.data),
  LayChiTietBaiViet: (id: string) => apiClient.get<Post>(`/posts/${id}`).then(r => r.data),
  TaoBaiViet: (data: { content: string; mediaUrls?: string[]; tripId?: string }) =>
    apiClient.post<Post>('/posts', data).then(r => r.data),
  CapNhatBaiViet: (id: string, data: { content: string; mediaUrls?: string[] }) =>
    apiClient.put<Post>(`/posts/${id}`, data).then(r => r.data),
  XoaBaiViet: (id: string) => apiClient.delete(`/posts/${id}`),
  ThichHoacBoThich: (id: string) =>
    apiClient.post<{ liked: boolean }>(`/posts/${id}/like`).then(r => r.data),
  LuuHoacBoLuu: (id: string) =>
    apiClient.post<{ bookmarked: boolean }>(`/posts/${id}/bookmark`).then(r => r.data),
  LayBinhLuan: (id: string) =>
    apiClient.get<Comment[]>(`/posts/${id}/comments`).then(r => r.data),
  ThemBinhLuan: (id: string, content: string, parentId?: string) =>
    apiClient.post<Comment>(`/posts/${id}/comments`, { content, parentId }).then(r => r.data),
  LayBaiVietDaLuuCuaToi: () => apiClient.get<Post[]>('/posts/bookmarks/mine').then(r => r.data),

  // Alias tương thích ngược
  feed: (params?: { page?: number; limit?: number; q?: string }) => postsService.LayBangTinBaiViet(params),
  get: (id: string) => postsService.LayChiTietBaiViet(id),
  create: (data: { content: string; mediaUrls?: string[]; tripId?: string }) => postsService.TaoBaiViet(data),
  updatePost: (id: string, data: { content: string; mediaUrls?: string[] }) => postsService.CapNhatBaiViet(id, data),
  delete: (id: string) => postsService.XoaBaiViet(id),
  toggleLike: (id: string) => postsService.ThichHoacBoThich(id),
  toggleBookmark: (id: string) => postsService.LuuHoacBoLuu(id),
  getComments: (id: string) => postsService.LayBinhLuan(id),
  addComment: (id: string, content: string, parentId?: string) => postsService.ThemBinhLuan(id, content, parentId),
  myBookmarks: () => postsService.LayBaiVietDaLuuCuaToi(),
};

// ─────────────────────────────────────────────────────────
// MAP / GIS
// ─────────────────────────────────────────────────────────
export const mapService = {
  DiemDanh: (destinationId: string, note?: string, customName?: string, latitude?: number, longitude?: number) =>
    apiClient.post('/map/checkin', { destinationId, note, customName, latitude, longitude }).then(r => r.data),
  DiemDanhGanDay: (limit?: number) =>
    apiClient.get('/map/checkins', { params: { limit } }).then(r => r.data),
  DiemDanhLanCan: (lat: number, lng: number, radius?: number) =>
    apiClient.get('/map/checkins/nearby', { params: { lat, lng, radius } }).then(r => r.data),
  CapNhatToaDo: (latitude: number, longitude: number) =>
    apiClient.put('/map/location', { latitude, longitude }).then(r => r.data),
  ToaDoBanBe: () => apiClient.get('/map/friends-locations').then(r => r.data),
  LayDanhSachDiemDen: (params?: { lat?: number; lng?: number; radius?: number; q?: string }) =>
    apiClient.get<Destination[]>('/map/destinations', { params }).then(r => r.data),
  CanhBaoAnToan: (params?: { lat?: number; lng?: number; radius?: number }) =>
    apiClient.get('/map/safety-warnings', { params }).then(r => r.data),
  LayDanhSachSuKien: (params?: { lat?: number; lng?: number; radius?: number }) =>
    apiClient.get('/map/events', { params }).then(r => r.data),
  LayThongTinThoiTiet: (params: { location: string }) =>
    apiClient.get<{ status: string; temperature: string; condition: string }>('/map/weather', { params }).then(r => r.data),
  DeXuatDiaDiemAI: (params: { lat: number; lng: number; weather?: string; temp?: number }) =>
    apiClient.get('/map/ai-recommendations', { params }).then(r => r.data),
  TroLyDiaDiemAI: (destinationId: string, question: string, destinationName?: string, category?: string) =>
    apiClient.post('/map/ai-assistant', { destinationId, question, destinationName, category }).then(r => r.data),

  // Alias tương thích ngược
  checkIn: (destinationId: string, note?: string, customName?: string, latitude?: number, longitude?: number) =>
    mapService.DiemDanh(destinationId, note, customName, latitude, longitude),
  recentCheckins: (limit?: number) => mapService.DiemDanhGanDay(limit),
  nearbyCheckins: (lat: number, lng: number, radius?: number) => mapService.DiemDanhLanCan(lat, lng, radius),
  updateLocation: (latitude: number, longitude: number) => mapService.CapNhatToaDo(latitude, longitude),
  friendsLocations: () => mapService.ToaDoBanBe(),
  destinations: (params?: { lat?: number; lng?: number; radius?: number; q?: string }) => mapService.LayDanhSachDiemDen(params),
  safetyWarnings: (params?: { lat?: number; lng?: number; radius?: number }) => mapService.CanhBaoAnToan(params),
  events: (params?: { lat?: number; lng?: number; radius?: number }) => mapService.LayDanhSachSuKien(params),
  weather: (params: { location: string }) => mapService.LayThongTinThoiTiet(params),
  aiRecommendations: (params: { lat: number; lng: number; weather?: string; temp?: number }) => mapService.DeXuatDiaDiemAI(params),
  aiAssistant: (destinationId: string, question: string, destinationName?: string, category?: string) =>
    mapService.TroLyDiaDiemAI(destinationId, question, destinationName, category),
};

// ─────────────────────────────────────────────────────────
// RECOMMENDATIONS
// ─────────────────────────────────────────────────────────
export const recommendationsService = {
  DeXuatChoToi: (limit?: number) =>
    apiClient.get<Destination[]>('/recommendations', { params: { limit } }).then(r => r.data),
  DeXuatLanCan: (lat: number, lng: number, radius?: number, limit?: number) =>
    apiClient.get<Destination[]>('/recommendations/nearby', { params: { lat, lng, radius, limit } }).then(r => r.data),
  LayDanhSachDiemDenDeXuat: (params?: { category?: string; q?: string; page?: number }) =>
    apiClient.get('/recommendations/destinations', { params }).then(r => r.data),

  // Alias tương thích ngược
  forMe: (limit?: number) => recommendationsService.DeXuatChoToi(limit),
  nearby: (lat: number, lng: number, radius?: number, limit?: number) => recommendationsService.DeXuatLanCan(lat, lng, radius, limit),
  destinations: (params?: { category?: string; q?: string; page?: number }) => recommendationsService.LayDanhSachDiemDenDeXuat(params),
};

// ─────────────────────────────────────────────────────────
// SOCIAL
// ─────────────────────────────────────────────────────────
export const socialService = {
  LayThongTinHauDai: (userId: string) =>
    apiClient.get(`/social/profile/${userId}`).then(r => r.data),
  CapNhatHauDai: (data: { fullName?: string; bio?: string; avatarUrl?: string; coverUrl?: string; homeLocation?: string }) =>
    apiClient.put('/social/profile', data).then(r => r.data),
  TheoDoiNguoiDung: (targetUserId: string) =>
    apiClient.post<{ following: boolean }>(`/social/follow/${targetUserId}`).then(r => r.data),
  LayNguoiTheoDoi: (userId: string) =>
    apiClient.get(`/social/followers/${userId}`).then(r => r.data),
  LayDangTheoDoi: (userId: string) =>
    apiClient.get(`/social/following/${userId}`).then(r => r.data),
  LayThongBao: () =>
    apiClient.get('/social/notifications').then(r => r.data),
  DanhDauDaDocTatCa: () =>
    apiClient.put('/social/notifications/read-all').then(r => r.data),
  DanhDauDaDoc: (id: string) =>
    apiClient.put(`/social/notifications/${id}/read`).then(r => r.data),
  CapNhatSoThichDuLich: (prefs: Partial<TravelPreferences>) =>
    apiClient.put('/social/preferences', prefs).then(r => r.data),
  TimKiemNguoiDung: (q: string) =>
    apiClient.get('/social/search', { params: { q } }).then(r => r.data),

  // Alias tương thích ngược
  getProfile: (userId: string) => socialService.LayThongTinHauDai(userId),
  updateProfile: (data: { fullName?: string; bio?: string; avatarUrl?: string; coverUrl?: string; homeLocation?: string }) => socialService.CapNhatHauDai(data),
  toggleFollow: (targetUserId: string) => socialService.TheoDoiNguoiDung(targetUserId),
  getFollowers: (userId: string) => socialService.LayNguoiTheoDoi(userId),
  getFollowing: (userId: string) => socialService.LayDangTheoDoi(userId),
  notifications: () => socialService.LayThongBao(),
  markAllRead: () => socialService.DanhDauDaDocTatCa(),
  markAsRead: (id: string) => socialService.DanhDauDaDoc(id),
  updatePreferences: (prefs: Partial<TravelPreferences>) => socialService.CapNhatSoThichDuLich(prefs),
  searchUsers: (q: string) => socialService.TimKiemNguoiDung(q),
};

// ─────────────────────────────────────────────────────────
// CHATBOT & AI MEMORY
// ─────────────────────────────────────────────────────────
export interface ChatMessageVersion {
  id: string;
  content: string;
  version: number;
  isActive: boolean;
  createdAt: string;
}

export interface ToolCall {
  id: string;
  toolName: string;
  input: string;
  output?: string;
  status: string;
  createdAt: string;
}

export interface AIFeedback {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Citation {
  id: string;
  title: string;
  content: string;
  category: string;
  score: number;
  similarity?: number;
  index: number;
  source?: string;
  url?: string;
}

export interface PlaceInfo {
  name: string;
  shortDescription: string;
  highlights: string[];
  activities: string[];
  suitableFor: string[];
  visitDuration: string;
  bestSeason: string;
  distance: string;
  category: string;
  citationIndex: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: string;
  versions: ChatMessageVersion[];
  feedback?: AIFeedback | null;
  toolCalls?: ToolCall[];
  citations?: Citation[];
  places?: PlaceInfo[];
  suggestions?: string[];
  metadata?: {
    intent: string | null;
    destination: string | null;
    hasRagData: boolean;
    agentUsed: string;
    latencyMs: number;
    planGenerated: boolean;
  };
}

export interface ChatConversation {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

export interface AIMemory {
  id: string;
  userId: string;
  travelPreferences: string[];
  favoriteFoods: string[];
  budget?: string | null;
  transportation: string[];
  favoriteLocations: string[];
  createdAt: string;
  updatedAt: string;
}

export const chatbotService = {
  LayDanhSachCuocHoiThoai: () =>
    apiClient.get<ChatConversation[]>('/chatbot/conversations').then(r => r.data),

  LayChiTietCuocHoiThoai: (id: string) =>
    apiClient.get<ChatConversation>(`/chatbot/conversations/${id}`).then(r => r.data),

  XoaCuocHoiThoai: (id: string) =>
    apiClient.delete(`/chatbot/conversations/${id}`).then(r => r.data),

  TaoCuocHoiThoai: (title?: string) =>
    apiClient.post<ChatConversation>('/chatbot/conversations', { title }).then(r => r.data),

  GuiTinNhan: (conversationId: string, content: string) =>
    apiClient.post<{ userMessage: ChatMessage; assistantMessage: ChatMessage }>(
      `/chatbot/conversations/${conversationId}/messages`,
      { content }
    ).then(r => r.data),

  TaoLaiPhanHoi: (messageId: string) =>
    apiClient.post<ChatMessage>(`/chatbot/messages/${messageId}/regenerate`).then(r => r.data),

  LayBoNhoAI: () =>
    apiClient.get<AIMemory>('/chatbot/memory').then(r => r.data),

  LuuBoNhoAI: (data: Partial<AIMemory>) =>
    apiClient.post<AIMemory>('/chatbot/memory', data).then(r => r.data),

  XoaBoNhoAI: () =>
    apiClient.delete('/chatbot/memory').then(r => r.data),

  deleteConversation: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/chatbot/conversations/${id}`).then(r => r.data),
};

// ─────────────────────────────────────────────────────────
// FEEDBACK
// ─────────────────────────────────────────────────────────
export const feedbackService = {
  TaoPhanHoi: (data: { messageId: string; rating: number; comment?: string }) =>
    apiClient.post('/feedback', data).then(r => r.data),

  CapNhatPhanHoi: (id: string, data: { rating: number; comment?: string }) =>
    apiClient.put(`/feedback/${id}`, data).then(r => r.data),

  // Alias tương thích ngược
  create: (data: { messageId: string; rating: number; comment?: string }) => feedbackService.TaoPhanHoi(data),
  update: (id: string, data: { rating: number; comment?: string }) => feedbackService.CapNhatPhanHoi(id, data),
};


