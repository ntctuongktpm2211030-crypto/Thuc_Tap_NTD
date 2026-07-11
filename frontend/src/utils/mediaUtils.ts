export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
export const MAX_PHOTOS = 20;
export const MAX_VIDEOS = 5;

export function validateImage(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Chỉ chấp nhận file ảnh (JPG, PNG, WEBP, GIF)';
  if (file.size > MAX_IMAGE_SIZE) return 'Ảnh tối đa 10MB';
  return null;
}

export function validateVideo(file: File): string | null {
  if (!file.type.startsWith('video/')) return 'Chỉ chấp nhận file video (MP4, WEBM, MOV)';
  if (file.size > MAX_VIDEO_SIZE) return 'Video tối đa 100MB';
  return null;
}

export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function revokePreviewUrl(url: string) {
  if (url.startsWith('blob:')) URL.revokeObjectURL(url);
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Convert blob URLs to data URLs for API persistence; pass through remote URLs. */
export async function resolveMediaUrl(url: string): Promise<string> {
  if (!url.startsWith('blob:')) return url;
  const res = await fetch(url);
  const blob = await res.blob();
  return fileToDataUrl(new File([blob], 'media', { type: blob.type }));
}

export async function resolveMediaUrls(urls: string[]): Promise<string[]> {
  return Promise.all(urls.map(resolveMediaUrl));
}

const DRAFT_KEY = 'smarttravel_journey_draft';

export interface JourneyDraftEnvelope<T = unknown> {
  step: number;
  data: T;
  updatedAt: number;
}

function hasBlobMedia(data: Record<string, unknown>): boolean {
  const cover = data.coverImage;
  if (typeof cover === 'string' && cover.startsWith('blob:')) return true;
  for (const key of ['photos', 'videos'] as const) {
    const arr = data[key];
    if (Array.isArray(arr) && arr.some(u => typeof u === 'string' && u.startsWith('blob:'))) return true;
  }
  return false;
}

async function serializeDraftMedia<T extends Record<string, unknown>>(data: T): Promise<T> {
  if (!hasBlobMedia(data)) return data;
  const next = { ...data } as T & { coverImage?: string; photos?: string[]; videos?: string[] };
  if (typeof next.coverImage === 'string' && next.coverImage.startsWith('blob:')) {
    next.coverImage = await resolveMediaUrl(next.coverImage);
  }
  if (Array.isArray(next.photos)) {
    next.photos = await Promise.all(
      next.photos.map(p => (p.startsWith('blob:') ? resolveMediaUrl(p) : p)),
    );
  }
  if (Array.isArray(next.videos)) {
    next.videos = await Promise.all(
      next.videos.map(v => (v.startsWith('blob:') ? resolveMediaUrl(v) : v)),
    );
  }
  return next as T;
}

export function cleanDeadBlobUrls(data: any): any {
  if (!data || typeof data !== 'object') return data;
  const copy = { ...data };
  if (typeof copy.coverImage === 'string' && copy.coverImage.startsWith('blob:')) {
    copy.coverImage = '';
  }
  if (Array.isArray(copy.photos)) {
    copy.photos = copy.photos.filter((p: any) => typeof p === 'string' && !p.startsWith('blob:'));
  }
  if (Array.isArray(copy.videos)) {
    copy.videos = copy.videos.filter((v: any) => typeof v === 'string' && !v.startsWith('blob:'));
  }
  return copy;
}

/** Lưu nháp kèm bước hiện tại (đồng bộ — dùng khi thoát trang gấp) */
export function saveJourneyDraft(data: unknown, step = 1) {
  try {
    const cleaned = cleanDeadBlobUrls(data);
    const envelope: JourneyDraftEnvelope = {
      step,
      data: cleaned,
      updatedAt: Date.now(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

/** Lưu nháp + chuyển ảnh blob sang data URL để refresh không mất media */
export async function saveJourneyDraftAsync(step: number, data: object): Promise<boolean> {
  try {
    const serialized = await serializeDraftMedia(data as Record<string, unknown>);
    const envelope = {
      step,
      data: serialized,
      updatedAt: Date.now(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    const cleaned = cleanDeadBlobUrls(data);
    return saveJourneyDraft(cleaned, step);
  }
}

export function loadJourneyDraft<T>(): T | null {
  const env = loadJourneyDraftEnvelope<T>();
  return env?.data ?? null;
}

export function loadJourneyDraftEnvelope<T>(): JourneyDraftEnvelope<T> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'data' in parsed) {
      const cleaned = cleanDeadBlobUrls(parsed.data);
      return {
        step: Math.min(5, Math.max(1, Number(parsed.step) || 1)),
        data: cleaned as T,
        updatedAt: parsed.updatedAt ?? Date.now(),
      };
    }
    const cleaned = cleanDeadBlobUrls(parsed);
    return { step: 1, data: cleaned as T, updatedAt: Date.now() };
  } catch {
    return null;
  }
}

export function clearJourneyDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export function journeyDraftHasContent(data: Record<string, unknown> | null | undefined): boolean {
  if (!data) return false;
  const text = [data.title, data.content, data.excerpt, data.destination].some(
    v => typeof v === 'string' && v.trim().length > 0,
  );
  const media = [data.coverImage, ...(Array.isArray(data.photos) ? data.photos : [])].some(
    v => typeof v === 'string' && v.length > 0,
  );
  const route = Array.isArray(data.routePoints) && data.routePoints.length > 0;
  const days = Array.isArray(data.days) && data.days.length > 0;
  return text || media || route || days;
}
