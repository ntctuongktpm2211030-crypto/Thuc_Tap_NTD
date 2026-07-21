const API_PREFIX = 'api-';

export function toExplorePostId(apiPostId: string): string {
  return `${API_PREFIX}${apiPostId}`;
}

/** Chuyển id hiển thị → id API; null nếu không hợp lệ */
export function toApiPostId(displayId: string): string | null {
  if (!displayId) return null;
  if (displayId.startsWith(API_PREFIX)) {
    return displayId.slice(API_PREFIX.length);
  }
  // Hỗ trợ UUID (chứa dấu gạch ngang) và các ID mẫu (p1, h1, v.v.) đã được nạp trong database
  if (/^[a-z0-9-]+$/i.test(displayId)) {
    return displayId;
  }
  return null;
}

export function isApiBackedPostId(displayId: string): boolean {
  return toApiPostId(displayId) !== null;
}

