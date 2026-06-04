/** Cache hồ sơ nhẹ cho sidebar (vị trí). Bài đăng lấy từ API. */

const PROFILE_KEY = 'smarttravel_user_profile';

export interface UserProfileCache {
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export function loadUserProfileCache(): UserProfileCache {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveUserProfileCache(patch: UserProfileCache) {
  const prev = loadUserProfileCache();
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...prev, ...patch }));
}
