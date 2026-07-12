import type { Post } from '../services/smartTravel.service';
import type {
  FeedPost,
  PostDisplayType,
  SocialFeedPost,
} from './feedUtils';
import {
  estimateReadTime,
  getCategoryColor,
  journeyCategoryToFeedLabel,
} from './feedUtils';

const DEFAULT_AVATAR =
  'https://cdn.pixabay.com/photo-2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80';

const BLOG_CATEGORY_LABELS: Record<string, string> = {
  review: 'Review',
  guide: 'Hướng dẫn',
  food: 'Ẩm Thực',
  tips: 'Mẹo hay',
  culture: 'Văn Hóa',
};

type ParsedPayload = Record<string, unknown>;

function parseContent(content: string): ParsedPayload | null {
  try {
    const parsed = JSON.parse(content) as ParsedPayload;
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    /* plain text */
  }
  return null;
}

function formatPostedDate(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return d.toLocaleDateString('vi-VN');
}

function authorFromPost(post: Post) {
  const name =
    post.author.profile?.fullName ||
    post.author.email?.split('@')[0] ||
    'Người dùng';
  return {
    authorId: post.author.id,
    author: {
      name,
      avatar: post.author.profile?.avatarUrl || DEFAULT_AVATAR,
      verified: false,
      followers: 0,
    },
  };
}

function baseFromApi(post: Post, destination: string) {
  const destLabel = destination.trim() || 'Việt Nam';
  const { authorId, author } = authorFromPost(post);
  return {
    id: post.id,
    authorId,
    author,
    destination: `📍 ${destLabel}`,
    destinationKey: destLabel.toLowerCase().replace(/\s+/g, '-'),
    postedAt: new Date(post.createdAt),
    date: formatPostedDate(post.createdAt),
    likes: post._count?.likes ?? 0,
    comments: post._count?.comments ?? 0,
    bookmarks: post._count?.bookmarks ?? 0,
    isLiked: !!post.isLiked,
    isBookmarked: !!post.isBookmarked,
  };
}

function routePointsFromPayload(payload: ParsedPayload) {
  const route = payload.route as { points?: { name: string; address?: string; lat: number; lng: number }[] } | undefined;
  if (!route?.points?.length) return undefined;
  return route.points.map(p => ({
    name: p.name,
    address: p.address || p.name,
    lat: p.lat,
    lng: p.lng,
  }));
}

function categoryLabel(payload: ParsedPayload): string {
  const cats = payload.categories as string[] | undefined;
  if (cats?.[0]) return journeyCategoryToFeedLabel(cats[0]);
  const cat = payload.category as string | undefined;
  if (cat && BLOG_CATEGORY_LABELS[cat]) return BLOG_CATEGORY_LABELS[cat];
  if (payload.feedCategory && typeof payload.feedCategory === 'string') return payload.feedCategory;
  return 'Du lịch';
}

/** Chuyển bài từ API backend → định dạng hiển thị bảng tin */
export function mapApiPostToFeedPost(post: Post): FeedPost | null {
  if (!post?.id || !post.content) return null;

  const payload = parseContent(post.content);
  const media = post.mediaUrls?.filter(Boolean) ?? [];
  const image = media[0] || FALLBACK_IMAGE;

  if (!payload) {
    const social: SocialFeedPost = {
      ...baseFromApi(post, 'Việt Nam'),
      displayType: 'social',
      content: post.content.trim(),
      images: media.slice(0, 4),
    };
    return social;
  }

  const type = payload.type as string | undefined;
  const displayType = (payload.displayType as PostDisplayType) || 'magazine';
  const destination =
    (payload.destination as string) ||
    ((payload.location as { name?: string })?.name) ||
    'Việt Nam';
  const body =
    (payload.body as string) ||
    (payload.content as string) ||
    '';
  const headline = (payload.headline as string) || (payload.title as string) || '';
  const excerpt =
    (payload.excerpt as string) ||
    body.slice(0, 220) ||
    headline;
  const catLabel = categoryLabel(payload);
  const readTime =
    typeof payload.readTime === 'string'
      ? payload.readTime
      : estimateReadTime(excerpt, body, headline);
  const routePoints = routePointsFromPayload(payload);
  const journeyPayload = post.content;

  const shared = {
    ...baseFromApi(post, destination),
    body,
    journeyPayload,
    routePoints,
    isFeatured: Boolean(payload.isFeatured),
  };

  if (type === 'journey' && displayType === 'social') {
    return {
      ...shared,
      displayType: 'social',
      content: excerpt.trim() || body.trim() || headline.trim() || 'Chia sẻ hành trình',
      images: media.slice(0, 4),
      category: catLabel,
    };
  }

  if (type === 'post' || type === 'journey') {
    const dt: PostDisplayType =
      displayType === 'hero' ? 'hero' : displayType === 'social' ? 'social' : 'magazine';

    if (dt === 'social') {
      return {
        ...shared,
        displayType: 'social',
        content: excerpt.trim() || body.trim() || headline,
        images: media.slice(0, 4),
        category: catLabel,
      };
    }

    return {
      ...shared,
      displayType: dt === 'hero' ? 'hero' : 'magazine',
      category: catLabel,
      categoryColor: getCategoryColor(catLabel),
      headline: headline.trim() || 'Bài viết mới',
      excerpt: excerpt.trim() || body.slice(0, 220),
      image,
      readTime,
    };
  }

  return {
    ...shared,
    displayType: 'magazine',
    category: catLabel,
    categoryColor: getCategoryColor(catLabel),
    headline: headline.trim() || excerpt.slice(0, 60) || 'Bài đăng',
    excerpt: excerpt.trim() || body.slice(0, 220) || post.content.slice(0, 220),
    image,
    readTime,
  };
}

export function mapApiPostsToFeed(posts: Post[]): FeedPost[] {
  return posts
    .map(mapApiPostToFeedPost)
    .filter((p): p is FeedPost => p !== null);
}
