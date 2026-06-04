/** Phân loại kiểu hiển thị bài trên bảng tin */

export type PostDisplayType = 'hero' | 'magazine' | 'social';

export interface FeedAuthor {
  name: string;
  avatar: string;
  verified: boolean;
  followers?: number;
}

export interface FeedPostBase {
  id: string;
  /** Id tác giả từ API (đếm bài của mình) */
  authorId?: string;
  destination: string;
  destinationKey: string;
  postedAt: Date;
  author: FeedAuthor;
  date: string;
  likes: number;
  comments: number;
  bookmarks: number;
  category?: string;
  categoryColor?: string;
  isFeatured?: boolean;
  /** Nội dung đầy đủ — hiển thị trong popup; feed chỉ show excerpt/preview */
  body?: string;
  /** Tuyến đường hành trình (nhiều điểm + polyline) */
  routePoints?: { name: string; address?: string; lat: number; lng: number }[];
  /** JSON journey gốc (nếu có) */
  journeyPayload?: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

/** Giới hạn ký tự preview trên thẻ feed */
export const FEED_PREVIEW_LIMITS = {
  social: 160,
  excerpt: 140,
} as const;

export function truncateForFeed(text: string, max: number): { preview: string; truncated: boolean } {
  const trimmed = text.trim();
  if (trimmed.length <= max) {
    return { preview: trimmed, truncated: false };
  }
  const cut = trimmed.slice(0, max).replace(/\s+\S*$/, '');
  return { preview: `${cut}…`, truncated: true };
}

export function getPostFullBody(post: FeedPost): string {
  const fromField = post.body?.trim();
  if (fromField) return fromField;

  const payload = parsePostPayload(post);
  if (payload?.body?.trim()) return payload.body.trim();

  if (post.displayType === 'social') {
    return post.content.trim();
  }
  const parts = [post.excerpt?.trim(), post.headline?.trim()].filter(Boolean);
  return parts.join('\n\n');
}

export interface JourneyDayActivityView {
  time?: string;
  title?: string;
  description?: string;
  icon?: string;
  cost?: string;
}

export interface JourneyDayView {
  day: number;
  title: string;
  location?: string;
  activities: JourneyDayActivityView[];
}

export interface JourneyTipView {
  id?: string;
  category: string;
  content: string;
}

export interface ParsedPostPayload {
  type?: string;
  headline?: string;
  title?: string;
  excerpt?: string;
  body?: string;
  tags?: string[];
  mood?: string;
  rating?: number;
  dates?: { start?: string; end?: string };
  budget?: { amount?: string; currency?: string };
  companions?: string;
  transport?: string[];
  weather?: string;
  country?: string;
  categories?: string[];
  days: JourneyDayView[];
  tips: JourneyTipView[];
}

export function parsePostPayload(post: FeedPost): ParsedPostPayload | null {
  if (!post.journeyPayload) return null;
  try {
    const j = JSON.parse(post.journeyPayload) as Record<string, unknown>;
    if (!j || typeof j !== 'object') return null;

    const daysRaw = j.days;
    const days: JourneyDayView[] = Array.isArray(daysRaw)
      ? daysRaw.map((d: Record<string, unknown>, i: number) => ({
          day: typeof d.day === 'number' ? d.day : i + 1,
          title: String(d.title || `Ngày ${i + 1}`),
          location: d.location ? String(d.location) : undefined,
          activities: Array.isArray(d.activities)
            ? (d.activities as JourneyDayActivityView[])
            : [],
        }))
      : [];

    const tipsRaw = j.tips;
    const tips: JourneyTipView[] = Array.isArray(tipsRaw)
      ? tipsRaw.map((t: Record<string, unknown>) => ({
          id: t.id ? String(t.id) : undefined,
          category: String(t.category || 'general'),
          content: String(t.content || ''),
        }))
      : [];

    return {
      type: j.type ? String(j.type) : undefined,
      headline: j.headline ? String(j.headline) : j.title ? String(j.title) : undefined,
      title: j.title ? String(j.title) : j.headline ? String(j.headline) : undefined,
      excerpt: j.excerpt ? String(j.excerpt) : undefined,
      body: j.body ? String(j.body) : j.content ? String(j.content) : undefined,
      tags: Array.isArray(j.tags) ? j.tags.map(String) : [],
      mood: j.mood ? String(j.mood) : undefined,
      rating: typeof j.rating === 'number' ? j.rating : undefined,
      dates: j.dates as ParsedPostPayload['dates'],
      budget: j.budget as ParsedPostPayload['budget'],
      companions: j.companions ? String(j.companions) : undefined,
      transport: Array.isArray(j.transport) ? j.transport.map(String) : [],
      weather: j.weather ? String(j.weather) : undefined,
      country: j.country ? String(j.country) : undefined,
      categories: Array.isArray(j.categories) ? j.categories.map(String) : [],
      days,
      tips,
    };
  } catch {
    return null;
  }
}

export function getPostDetailTitle(post: FeedPost): string {
  const payload = parsePostPayload(post);
  if (post.displayType === 'social') {
    return payload?.headline || payload?.title || post.author.name;
  }
  return post.headline;
}

export function getPostDetailSubtitle(post: FeedPost): string {
  const payload = parsePostPayload(post);
  if (post.displayType === 'social') {
    return payload?.excerpt?.trim() || post.content.trim();
  }
  return post.excerpt?.trim() || payload?.excerpt?.trim() || '';
}

export function getPostPreviewText(post: FeedPost): { preview: string; truncated: boolean } {
  if (post.displayType === 'social') {
    return truncateForFeed(post.content, FEED_PREVIEW_LIMITS.social);
  }
  const full = getPostFullBody(post);
  const short = post.excerpt?.trim() || '';
  if (full.length > short.length + 40) {
    return truncateForFeed(short || full, FEED_PREVIEW_LIMITS.excerpt);
  }
  return truncateForFeed(short || full, FEED_PREVIEW_LIMITS.excerpt);
}

export function isPostTruncatedOnFeed(post: FeedPost): boolean {
  if (post.displayType === 'social') {
    return post.content.trim().length > FEED_PREVIEW_LIMITS.social;
  }
  const full = getPostFullBody(post);
  const preview = post.excerpt?.trim() || '';
  return full.length > Math.max(preview.length, FEED_PREVIEW_LIMITS.excerpt) + 20;
}

export function getRoutePointsFromPost(post: FeedPost): { id: string; name: string; address: string; lat: number; lng: number }[] {
  if (post.routePoints?.length) {
    return post.routePoints.map((p, i) => ({
      id: `rp-${i}`,
      name: p.name,
      address: p.address || p.name,
      lat: p.lat,
      lng: p.lng,
    }));
  }
  if (post.journeyPayload) {
    try {
      const j = JSON.parse(post.journeyPayload);
      const pts = j?.route?.points;
      if (Array.isArray(pts) && pts.length) {
        return pts.map((p: { name: string; address?: string; lat: number; lng: number }, i: number) => ({
          id: `rp-${i}`,
          name: p.name,
          address: p.address || p.name,
          lat: p.lat,
          lng: p.lng,
        }));
      }
    } catch {
      /* ignore */
    }
  }
  return [];
}

export function getPostImages(post: FeedPost): string[] {
  if (post.displayType === 'social') {
    return post.images ?? [];
  }
  const imgs = [post.image];
  return imgs.filter(Boolean);
}

export interface HeroFeedPost extends FeedPostBase {
  displayType: 'hero';
  category: string;
  headline: string;
  excerpt: string;
  image: string;
  readTime: string;
}

export interface MagazineFeedPost extends FeedPostBase {
  displayType: 'magazine';
  category: string;
  categoryColor: string;
  headline: string;
  excerpt: string;
  image: string;
  readTime: string;
}

export interface SocialFeedPost extends FeedPostBase {
  displayType: 'social';
  content: string;
  images?: string[];
}

export type FeedPost = HeroFeedPost | MagazineFeedPost | SocialFeedPost;

export interface HotDestination {
  name: string;
  country: string;
  image: string;
  postCount: number;
  hot: boolean;
  color: string;
}

export interface CompanionSuggestion {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  followers: number;
  followersLabel: string;
  tag: string;
  tagColor: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Phiêu Lưu': 'bg-violet-500',
  'Ẩm Thực': 'bg-amber-500',
  'Văn Hóa': 'bg-sky-500',
  'Sang Trọng': 'bg-rose-500',
};

/** Chuẩn hóa địa điểm để đếm (bỏ emoji, lấy tên chính) */
export function normalizeDestinationKey(raw: string): string {
  return raw
    .replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\s📍]+/gu, '')
    .replace(/\s*,\s*.+$/, '')
    .trim()
    .toLowerCase();
}

export function parseDestinationDisplay(key: string, raw: string): { name: string; country: string } {
  const cleaned = raw.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\s📍]+/gu, '').trim();
  const parts = cleaned.split(',').map(s => s.trim());
  if (parts.length >= 2) {
    return { name: parts[0], country: parts.slice(1).join(', ') };
  }
  const known: Record<string, { name: string; country: string }> = {
    'hà giang': { name: 'Hà Giang Loop', country: 'Việt Nam' },
    sapa: { name: 'Sapa', country: 'Lào Cai' },
    'hội an': { name: 'Hội An', country: 'Quảng Nam' },
    'phố cổ hội an': { name: 'Hội An', country: 'Quảng Nam' },
    'hà nội': { name: 'Hà Nội', country: 'Việt Nam' },
    'phú quốc': { name: 'Phú Quốc', country: 'Kiên Giang' },
    'đảo phú quốc': { name: 'Phú Quốc', country: 'Kiên Giang' },
  };
  const k = key.toLowerCase();
  if (known[k]) return known[k];
  return { name: cleaned, country: 'Việt Nam' };
}

const DEST_IMAGES: Record<string, string> = {
  'hà giang': 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=120&q=80',
  sapa: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=120&q=80',
  'hội an': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=120&q=80',
  'phố cổ hội an': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=120&q=80',
  'hà nội': 'https://images.unsplash.com/photo-1557750255-c76072a7aad1?auto=format&fit=crop&w=120&q=80',
  'phú quốc': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=120&q=80',
};

const DEST_GRADIENTS = [
  'from-violet-500 to-indigo-600',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-blue-600',
  'from-teal-500 to-emerald-600',
  'from-pink-500 to-rose-600',
];

/**
 * Kiểu Minh Quân: bài nổi bật — ảnh full, tiêu đề editorial, excerpt dài, Editor's Pick
 */
export function classifyPostDisplay(raw: {
  isFeatured?: boolean;
  headline?: string;
  excerpt?: string;
  content?: string;
  image?: string;
  images?: string[];
  readTime?: string;
  likes?: number;
}): PostDisplayType {
  if (raw.isFeatured) return 'hero';

  const hasHeadline = Boolean(raw.headline?.trim());
  const hasExcerpt = Boolean(raw.excerpt?.trim() && raw.excerpt.length > 40);
  const hasContent = Boolean(raw.content?.trim());
  const hasCover = Boolean(raw.image);
  const multiPhoto = (raw.images?.length ?? 0) >= 2;
  const shortText = hasContent && (raw.content!.length < 280);
  const highEngagement = (raw.likes ?? 0) >= 280;

  // Kiểu Linh Trần: chia sẻ nhanh, caption, 1–2 ảnh, không layout magazine
  if (hasContent && !hasHeadline && (shortText || multiPhoto || !hasExcerpt)) {
    return 'social';
  }
  if (hasContent && hasHeadline && shortText && !hasExcerpt) {
    return 'social';
  }

  // Kiểu Sarah Miller: bài magazine — headline + excerpt + ảnh bìa + thời gian đọc
  if (hasHeadline && hasExcerpt && hasCover && raw.readTime) {
    return 'magazine';
  }
  if (hasHeadline && hasExcerpt && hasCover) {
    return 'magazine';
  }

  // Hero tự động: bài dài, engagement cao, có excerpt (giống feature story)
  if (hasHeadline && hasExcerpt && hasCover && highEngagement) {
    return 'hero';
  }

  if (hasHeadline && hasCover) return 'magazine';
  if (hasContent) return 'social';
  return 'magazine';
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Điểm đến hot: đếm bài đăng trong tháng hiện tại */
export function computeHotDestinationsThisMonth(
  posts: FeedPost[],
  referenceDate = new Date(),
  limit = 5,
): HotDestination[] {
  const counts = new Map<string, { key: string; raw: string; count: number }>();

  for (const post of posts) {
    if (!isSameMonth(post.postedAt, referenceDate)) continue;
    const key = post.destinationKey;
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { key, raw: post.destination, count: 1 });
  }

  const sorted = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit);
  const maxCount = sorted[0]?.count ?? 1;

  return sorted.map((item, i) => {
    const { name, country } = parseDestinationDisplay(item.key, item.raw);
    return {
      name,
      country,
      image: DEST_IMAGES[item.key] ?? DEST_IMAGES['hà giang'],
      postCount: item.count,
      hot: item.count >= Math.max(2, Math.ceil(maxCount * 0.6)),
      color: DEST_GRADIENTS[i % DEST_GRADIENTS.length],
    };
  });
}

/** Gợi ý bạn đồng hành: sắp theo followers giảm dần */
export function sortCompanionsByFollowers(
  companions: CompanionSuggestion[],
  limit = 5,
): CompanionSuggestion[] {
  return [...companions]
    .sort((a, b) => b.followers - a.followers)
    .slice(0, limit)
    .map(c => ({
      ...c,
      followersLabel: formatFollowers(c.followers),
    }));
}

export function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? 'bg-indigo-500';
}

/** Nhãn danh mục từ id form hành trình → nhãn feed */
const JOURNEY_CATEGORY_LABELS: Record<string, string> = {
  adventure: 'Phiêu Lưu',
  food: 'Ẩm Thực',
  luxury: 'Sang Trọng',
  budget: 'Tiết kiệm',
  culture: 'Văn Hóa',
  nature: 'Thiên nhiên',
};

export function journeyCategoryToFeedLabel(categoryId: string): string {
  return JOURNEY_CATEGORY_LABELS[categoryId] ?? 'Du lịch';
}

export function estimateReadTime(...texts: string[]): string {
  const words = texts.join(' ').trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} phút`;
}

export const FEED_DISPLAY_OPTIONS: {
  id: PostDisplayType;
  label: string;
  authorStyle: string;
  description: string;
  hint: string;
}[] = [
  {
    id: 'social',
    label: 'Chia sẻ nhanh',
    authorStyle: 'Linh Trần',
    description: 'Caption ngắn, 1–2 ảnh, mẹo check-in — hiển thị dạng bài mạng xã hội.',
    hint: 'Phù hợp cập nhật nhanh, tip thực tế tại chỗ.',
  },
  {
    id: 'magazine',
    label: 'Bài magazine',
    authorStyle: 'Sarah Miller',
    description: 'Ảnh bìa, tiêu đề editorial, tóm tắt — thẻ bài ấn phẩm trên bảng tin.',
    hint: 'Cần tiêu đề, tóm tắt (≥40 ký tự) và ảnh bìa.',
  },
  {
    id: 'hero',
    label: 'Bài nổi bật',
    authorStyle: 'Minh Quân Nguyễn',
    description: 'Full-bleed, Editor\'s Pick — bài dài, ảnh đẹp, có thể đề cử nổi bật.',
    hint: 'Tóm tắt dài hơn (≥80 ký tự), nội dung phong phú.',
  },
];

export interface JourneyPublishFields {
  displayType: PostDisplayType;
  title: string;
  content: string;
  excerpt: string;
  coverImage: string;
  photos: string[];
  destination: string;
  latitude: number | null;
  longitude: number | null;
  routePoints?: { name: string; address?: string; lat: number; lng: number }[];
  categories: string[];
  requestFeatured?: boolean;
}

export function journeyStepCanAdvance(step: number, d: JourneyPublishFields): boolean {
  if (step === 1) {
    if (d.displayType === 'social') {
      return d.content.trim().length >= 30;
    }
    if (d.displayType === 'magazine') {
      return (
        d.title.trim().length > 0
        && d.excerpt.trim().length >= 40
        && d.categories.length >= 1
      );
    }
    return (
      d.title.trim().length > 0
      && d.excerpt.trim().length >= 80
      && d.categories.length >= 1
    );
  }
  if (step === 2) {
    if (d.displayType === 'social') {
      return d.photos.length >= 1 || !!d.coverImage;
    }
    return !!d.coverImage;
  }
  if (step === 3) {
    const hasRoute = (d.routePoints?.length ?? 0) >= 1;
    return !!d.destination && hasRoute && d.latitude !== null && d.longitude !== null;
  }
  return true;
}

export function isJourneyReadyToPublish(d: JourneyPublishFields): boolean {
  if (!journeyStepCanAdvance(3, d)) return false;
  if (d.displayType === 'social') {
    return journeyStepCanAdvance(1, d) && journeyStepCanAdvance(2, d);
  }
  if (d.displayType === 'magazine') {
    return journeyStepCanAdvance(1, d) && journeyStepCanAdvance(2, d);
  }
  return (
    journeyStepCanAdvance(1, d)
    && journeyStepCanAdvance(2, d)
    && (d.content.length >= 120 || d.excerpt.length >= 100)
  );
}

export function getJourneyCompletionItems(d: JourneyPublishFields) {
  const base = [
    { label: 'Kiểu hiển thị', done: !!d.displayType },
    { label: 'Điểm đến', done: !!d.destination },
    { label: 'Tuyến đường', done: (d.routePoints?.length ?? 0) >= 1 },
    { label: 'Vị trí bản đồ', done: d.latitude !== null && d.longitude !== null },
  ];
  if (d.displayType === 'social') {
    return [
      ...base,
      { label: 'Nội dung (≥30 ký tự)', done: d.content.length >= 30 },
      { label: 'Ảnh (≥1)', done: d.photos.length >= 1 || !!d.coverImage },
    ];
  }
  if (d.displayType === 'magazine') {
    return [
      ...base,
      { label: 'Tiêu đề', done: !!d.title.trim() },
      { label: 'Tóm tắt (≥40 ký tự)', done: d.excerpt.length >= 40 },
      { label: 'Danh mục', done: d.categories.length >= 1 },
      { label: 'Ảnh bìa', done: !!d.coverImage },
    ];
  }
  return [
    ...base,
    { label: 'Tiêu đề', done: !!d.title.trim() },
    { label: 'Tóm tắt (≥80 ký tự)', done: d.excerpt.length >= 80 },
    { label: 'Danh mục', done: d.categories.length >= 1 },
    { label: 'Ảnh bìa', done: !!d.coverImage },
    { label: 'Nội dung / tóm tắt đủ dài', done: d.content.length >= 120 || d.excerpt.length >= 100 },
  ];
}

/** Tách hero (1 bài) và feed còn lại */
export function partitionFeed(posts: FeedPost[]): {
  hero: HeroFeedPost | null;
  feed: FeedPost[];
} {
  const classified = posts.map(p => ({ ...p, displayType: p.displayType ?? classifyPostDisplay(p as never) }));

  let hero = classified.find(p => p.displayType === 'hero') as HeroFeedPost | undefined;
  if (!hero) {
    const candidate = classified
      .filter(p => p.displayType === 'magazine')
      .sort((a, b) => b.likes - a.likes)[0];
    if (candidate && 'headline' in candidate) {
      hero = {
        ...candidate,
        displayType: 'hero',
        category: candidate.category ?? "Editor's Pick",
      } as HeroFeedPost;
    }
  }

  const heroId = hero?.id;
  const feed = classified
    .filter(p => p.id !== heroId)
    .sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime()) as FeedPost[];

  return { hero: hero ?? null, feed };
}
