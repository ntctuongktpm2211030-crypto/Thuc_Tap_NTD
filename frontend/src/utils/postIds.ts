const API_PREFIX = 'api-';

/** Id mock chỉ dùng offline (feed / explore demo) */
const MOCK_ID_PATTERN = /^(p\d+|h\d+|c\d+|exp-\d+)$/i;

export function toExplorePostId(apiPostId: string): string {
  return `${API_PREFIX}${apiPostId}`;
}

/** Chuyển id hiển thị → id API; null nếu bài demo không có trên server */
export function toApiPostId(displayId: string): string | null {
  if (displayId.startsWith(API_PREFIX)) {
    return displayId.slice(API_PREFIX.length);
  }
  if (MOCK_ID_PATTERN.test(displayId)) return null;
  if (/^[a-z0-9]{20,}$/i.test(displayId)) return displayId;
  return null;
}

export function isApiBackedPostId(displayId: string): boolean {
  return toApiPostId(displayId) !== null;
}
