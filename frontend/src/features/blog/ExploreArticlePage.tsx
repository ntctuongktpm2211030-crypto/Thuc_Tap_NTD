import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Bookmark, Check, Heart, MapPin, MessageCircle, Loader2, Share2, Navigation, CornerUpLeft, Clock,
} from 'lucide-react';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { postsService } from '../../services/smartTravel.service';
import { toApiPostId } from '../../utils/postIds';
import { syncToggleBookmark, syncToggleLike } from '../../utils/postEngagement';
import { getExplorePostById, patchExplorePostEngagement } from './explorePostsStore';
import ShareModal from '../../components/feed/ShareModal';

const CATEGORY_STYLES: Record<string, string> = {
  'Thiên nhiên': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Ẩm thực': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Phiêu lưu': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Văn hóa': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Biển đảo': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Nghỉ dưỡng': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

function CommentTextWithMentions({ text }: { text: string }) {
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed.startsWith('@')) {
    const multiMatch = trimmed.match(/^(@[^\s]+\s+[^\s]+)\s+(.*)$/);
    if (multiMatch) {
      return (
        <span>
          <span className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer mr-1.5">{multiMatch[1]}</span>
          <span>{multiMatch[2]}</span>
        </span>
      );
    }
    const singleMatch = trimmed.match(/^(@[^\s]+)\s+(.*)$/);
    if (singleMatch) {
      return (
        <span>
          <span className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer mr-1.5">{singleMatch[1]}</span>
          <span>{singleMatch[2]}</span>
        </span>
      );
    }
  }
  return <span>{text}</span>;
}

function ArticleImageGallery({ images }: { images: string[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const cleanImages = useMemo(() => {
    return (images || []).filter((src): src is string => typeof src === 'string' && src.trim().length > 0);
  }, [images]);

  if (!cleanImages || cleanImages.length === 0) return null;

  const nextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIdx(prev => (prev < cleanImages.length - 1 ? prev + 1 : 0));
  };

  const prevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIdx(prev => (prev > 0 ? prev - 1 : cleanImages.length - 1));
  };

  return (
    <div className="my-5 space-y-3 select-none">
      {/* Main Image Slider Container */}
      <div className="relative group aspect-[16/10] sm:aspect-[16/9] max-h-[500px] w-full rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-slate-900 shadow-md">
        {/* Main Active Image */}
        <img
          src={cleanImages[currentIdx]}
          alt={`Ảnh ${currentIdx + 1}`}
          onClick={() => setLightboxOpen(true)}
          className="w-full h-full object-cover cursor-pointer transition-transform duration-500 ease-out hover:scale-[1.01]"
        />

        {/* Top-Right Image Badge (e.g. "Ảnh 1 / 4") */}
        <div className="absolute top-3.5 right-3.5 bg-slate-950/60 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm border border-white/10 flex items-center gap-1">
          <span>Ảnh {currentIdx + 1}</span>
          <span className="text-white/50">/</span>
          <span>{cleanImages.length}</span>
        </div>

        {/* Left Arrow Button (<) */}
        {cleanImages.length > 1 && (
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Ảnh trước"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/50 hover:bg-slate-950/80 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-lg border border-white/10 group-hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span className="text-xl font-black leading-none -mt-0.5">‹</span>
          </button>
        )}

        {/* Right Arrow Button (>) */}
        {cleanImages.length > 1 && (
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Ảnh tiếp theo"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/50 hover:bg-slate-950/80 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-lg border border-white/10 group-hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span className="text-xl font-black leading-none -mt-0.5">›</span>
          </button>
        )}
      </div>

      {/* Pagination Indicator Dots (• o o o) */}
      {cleanImages.length > 1 && (
        <div className="flex items-center justify-center gap-2 pt-1">
          {cleanImages.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIdx(idx)}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                idx === currentIdx
                  ? 'w-7 h-2.5 bg-[var(--gold)] shadow-sm'
                  : 'w-2.5 h-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-[var(--gold)]/60'
              }`}
              aria-label={`Chuyển đến ảnh ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Lightbox Fullscreen Popup */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 cursor-pointer"
          >
            ✕
          </button>

          {cleanImages.length > 1 && (
            <button
              type="button"
              onClick={prevSlide}
              className="absolute left-5 text-white p-3.5 bg-white/10 hover:bg-white/25 rounded-full transition-all z-50 text-2xl font-bold cursor-pointer"
            >
              ‹
            </button>
          )}

          <img
            src={cleanImages[currentIdx]}
            alt=""
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl animate-scale-up"
          />

          {cleanImages.length > 1 && (
            <button
              type="button"
              onClick={nextSlide}
              className="absolute right-5 text-white p-3.5 bg-white/10 hover:bg-white/25 rounded-full transition-all z-50 text-2xl font-bold cursor-pointer"
            >
              ›
            </button>
          )}

          <div className="absolute bottom-5 text-xs font-semibold text-white/80 bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10">
            Ảnh {currentIdx + 1} / {cleanImages.length}
          </div>
        </div>
      )}
    </div>
  );
}

function normalizeCommentItem(c: any): any {
  if (!c) return null;
  const authorName = c.author?.profile?.fullName || c.author?.fullName || (typeof c.author === 'string' ? c.author : 'Người dùng');
  const avatarUrl = c.author?.profile?.avatarUrl || c.author?.avatarUrl || c.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
  
  let text = c.text || c.content || '';
  if (typeof text === 'string' && text.trim().startsWith('{') && text.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(text);
      text = parsed.text || parsed.content || parsed.body || text;
    } catch {}
  }

  const dateStr = c.date || (c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'Vừa xong');

  return {
    id: String(c.id || Date.now()),
    authorId: c.authorId || c.author?.id,
    author: authorName,
    avatar: avatarUrl,
    text: text,
    date: dateStr,
  };
}

function loadLocalCommentsForPost(id: string): any[] {
  const list: any[] = [];
  const rawId = id.replace(/^api-/, '');
  const keys = [
    `terraholic_comments_${id}`,
    `terraholic_comments_${rawId}`,
    `terraholic_comments_api-${rawId}`,
    `smarttravel_comments_${id}`,
    `smarttravel_comments_${rawId}`,
  ];

  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            const norm = normalizeCommentItem(item);
            if (norm) list.push(norm);
            if (Array.isArray(item.replies)) {
              item.replies.forEach((rep: any) => {
                const normRep = normalizeCommentItem(rep);
                if (normRep) {
                  if (!normRep.text.startsWith('@')) {
                    normRep.text = `@${norm.author} ${normRep.text}`;
                  }
                  list.push(normRep);
                }
              });
            }
          });
        }
      }
    } catch {}
  }
  return list;
}

function mergeUnifiedComments(id: string, apiId?: string, dbComments: any[] = [], storeComments: any[] = []): any[] {
  const map = new Map<string, any>();

  const allRaw = [
    ...dbComments,
    ...storeComments,
    ...loadLocalCommentsForPost(id),
    ...(apiId ? loadLocalCommentsForPost(apiId) : []),
  ];

  for (const raw of allRaw) {
    const norm = normalizeCommentItem(raw);
    if (norm && norm.text.trim()) {
      const dedupKey = `${norm.author.trim().toLowerCase()}_${norm.text.trim().toLowerCase()}`;
      if (!map.has(dedupKey)) {
        map.set(dedupKey, norm);
      }
    }
  }

  return Array.from(map.values());
}

export default function ExploreArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { requireAuth } = useRequireAuth();

  const [post, setPost] = useState(() => (id ? getExplorePostById(id) : undefined));
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null);
  const [activeReplyTarget, setActiveReplyTarget] = useState<{ parentId: string; author: string } | null>(null);
  const [inlineReplyText, setInlineReplyText] = useState('');
  const [comments, setComments] = useState<any[]>(() => {
    if (!id) return [];
    const local = getExplorePostById(id);
    const apiId = toApiPostId(id);
    return mergeUnifiedComments(id, apiId ?? undefined, [], local?.comments ?? []);
  });
  const [likedComments, setLikedComments] = useState<Record<string, 'like' | 'love' | 'haha' | null>>({});
  const [engagementLoading, setEngagementLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const applyPost = useCallback((next: NonNullable<typeof post>) => {
    setPost(next);
    setComments(next.comments ?? []);
  }, []);

  useEffect(() => {
    if (!id) return;
    const local = getExplorePostById(id);
    if (local) applyPost(local);

    const apiId = toApiPostId(id);
    if (!apiId) return;

    postsService
      .get(apiId)
      .then(apiPost => {
        const liked = !!apiPost.isLiked;
        const bookmarked = !!apiPost.isBookmarked;
        const likes = apiPost._count?.likes ?? local?.likes ?? 0;

        let parsedTitle = apiPost.content?.slice(0, 50) + (apiPost.content?.length > 50 ? '...' : '');
        let parsedExcerpt = apiPost.content;
        let parsedContent = apiPost.content;
        let parsedCategory = apiPost.destination?.category === 'restaurant' ? 'Ẩm thực' : 'Thiên nhiên';
        let parsedLocation = apiPost.destination?.name || 'Việt Nam';
        let parsedTags: string[] = [];
        let parsedImages: string[] = Array.isArray(apiPost.mediaUrls) ? apiPost.mediaUrls : [];

        if (typeof apiPost.content === 'string' && apiPost.content.trim().startsWith('{') && apiPost.content.trim().endsWith('}')) {
          try {
            const j = JSON.parse(apiPost.content);
            if (j.title || j.headline) parsedTitle = j.title || j.headline;
            if (j.excerpt) parsedExcerpt = j.excerpt;
            if (j.body || j.description) parsedContent = j.body || j.description;
            if (j.feedCategory || j.category) parsedCategory = j.feedCategory || j.category;
            if (j.destination) parsedLocation = j.destination;
            if (Array.isArray(j.tags)) parsedTags = j.tags;
            if (Array.isArray(j.mediaUrls) && j.mediaUrls.length > 0) parsedImages = j.mediaUrls;
            else if (Array.isArray(j.images) && j.images.length > 0) parsedImages = j.images;
            else if (j.coverImage) parsedImages = [j.coverImage];
          } catch {}
        }

        const formattedComments: any[] = [];
        (apiPost.comments ?? []).forEach((c: any) => {
          const normParent = normalizeCommentItem(c);
          if (normParent) formattedComments.push(normParent);

          if (Array.isArray(c.replies)) {
            c.replies.forEach((rep: any) => {
              const normRep = normalizeCommentItem(rep);
              if (normRep) {
                if (normParent && !normRep.text.startsWith('@')) {
                  normRep.text = `@${normParent.author} ${normRep.text}`;
                }
                formattedComments.push(normRep);
              }
            });
          }
        });

        const unifiedComments = mergeUnifiedComments(id, apiId, formattedComments, local?.comments ?? []);

        const mappedPost: any = {
          ...(local || {}),
          id: id,
          authorId: apiPost.author?.id,
          author: apiPost.author?.profile?.fullName || apiPost.author?.email?.split('@')[0] || 'Người dùng',
          avatar: apiPost.author?.profile?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
          handle: '@' + (apiPost.author?.email?.split('@')[0] || 'user'),
          verified: false,
          location: parsedLocation,
          date: new Date(apiPost.createdAt).toLocaleDateString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
          }),
          category: parsedCategory,
          title: parsedTitle,
          excerpt: parsedExcerpt,
          content: parsedContent,
          coverImage: parsedImages[0] || local?.coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80',
          images: parsedImages.length > 0 ? parsedImages : (local?.images || []),
          likes: likes,
          liked: liked,
          bookmarked: bookmarked,
          tags: parsedTags,
          comments: unifiedComments,
        };

        applyPost(mappedPost);
      })
      .catch((err) => {
        console.error('Failed to load DB post details:', err);
      });
  }, [id, applyPost]);

  useEffect(() => {
    const handleSync = () => {
      if (!id) return;
      const local = getExplorePostById(id);
      const apiId = toApiPostId(id);
      setComments(mergeUnifiedComments(id, apiId ?? undefined, [], local?.comments ?? []));
    };

    window.addEventListener('terraholic_comments_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('terraholic_comments_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [id]);

  // Safely parse JSON payload inside post content if present
  const displayData = useMemo(() => {
    if (!post) return null;

    let jsonPayload: any = null;
    const rawTargets = [post.content, post.excerpt, post.title];
    for (const raw of rawTargets) {
      if (typeof raw === 'string' && raw.trim().startsWith('{') && raw.trim().endsWith('}')) {
        try {
          jsonPayload = JSON.parse(raw);
          if (jsonPayload) break;
        } catch {
          /* ignore */
        }
      }
    }

    const title =
      jsonPayload?.title ||
      jsonPayload?.headline ||
      (post.title && !post.title.trim().startsWith('{') ? post.title : 'Hành trình trải nghiệm');

    const excerpt =
      jsonPayload?.excerpt ||
      (post.excerpt && !post.excerpt.trim().startsWith('{') ? post.excerpt : '');

    const content =
      jsonPayload?.body ||
      jsonPayload?.content ||
      jsonPayload?.description ||
      (post.content && !post.content.trim().startsWith('{') ? post.content : '');

    const tags: string[] =
      Array.isArray(jsonPayload?.tags) && jsonPayload.tags.length > 0
        ? jsonPayload.tags
        : (post.tags ?? []);

    const location =
      jsonPayload?.destination ||
      (typeof jsonPayload?.location === 'object' ? jsonPayload.location?.address : jsonPayload?.location) ||
      post.location ||
      'Việt Nam';

    const category =
      jsonPayload?.feedCategory ||
      jsonPayload?.category ||
      post.category ||
      'Khám phá';

    const routePoints: Array<{ order?: number; role?: string; name?: string; address?: string }> =
      jsonPayload?.route?.points ?? [];

    const dates = jsonPayload?.dates;
    const companions = jsonPayload?.companions;
    const transport: string[] = Array.isArray(jsonPayload?.transport) ? jsonPayload.transport : [];

    return {
      title,
      excerpt,
      content,
      tags,
      location,
      category,
      routePoints,
      dates,
      companions,
      transport,
      jsonPayload,
    };
  }, [post]);

  const organizedThreads = useMemo(() => {
    const rawList = comments || [];
    const clonedList = rawList.map(c => ({ ...c, replies: [] }));
    const parents: Array<any & { replies: any[] }> = [];

    for (const c of clonedList) {
      const text = (c.text || '').trim();

      let matchedParent: any = null;
      if (text.startsWith('@')) {
        matchedParent = parents.find(p => text.toLowerCase().startsWith(`@${p.author.toLowerCase()}`));
      }

      if (matchedParent) {
        c.cleanText = text;
        matchedParent.replies.push(c);
      } else if (text.startsWith('@')) {
        const lastParent = parents[parents.length - 1];
        if (lastParent) {
          c.cleanText = text;
          lastParent.replies.push(c);
        } else {
          c.cleanText = text;
          parents.push(c);
        }
      } else {
        c.cleanText = text;
        parents.push(c);
      }
    }

    return parents;
  }, [comments]);

  if (!post || !displayData) {
    return (
      <div className="explore-article-page min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-[var(--text-secondary)]">Không tìm thấy bài viết.</p>
        <Link to="/explore" className="text-[var(--gold)] font-semibold hover:underline">← Về Khám phá</Link>
      </div>
    );
  }

  const persistEngagement = (patch: Parameters<typeof patchExplorePostEngagement>[1]) => {
    patchExplorePostEngagement(post.id, patch);
    setPost(prev => (prev ? { ...prev, ...patch } : prev));
  };

  const toggleLike = async () => {
    if (!requireAuth(`/explore/post/${post.id}`)) return;
    setEngagementLoading(true);
    try {
      const next = await syncToggleLike(post.id, { liked: post.liked, likes: post.likes });
      persistEngagement({ liked: next.liked, likes: next.likes });
    } catch (err) {
      console.error(err);
    } finally {
      setEngagementLoading(false);
    }
  };

  const toggleBookmark = async () => {
    if (!requireAuth(`/explore/post/${post.id}`)) return;
    setEngagementLoading(true);
    try {
      const next = await syncToggleBookmark(post.id, { bookmarked: post.bookmarked });
      persistEngagement({ bookmarked: next.bookmarked });
    } catch (err) {
      console.error(err);
    } finally {
      setEngagementLoading(false);
    }
  };

  const submitComment = async (text: string, targetParentId?: string) => {
    if (!text.trim() || !post) return;

    const apiId = toApiPostId(post.id);
    let newMappedComment: any = null;

    if (apiId) {
      setEngagementLoading(true);
      try {
        const newApiComment = await postsService.addComment(apiId, text.trim(), targetParentId);
        newMappedComment = {
          id: newApiComment.id,
          authorId: newApiComment.author?.id,
          author: newApiComment.author?.profile?.fullName || 'Bạn',
          avatar: newApiComment.author?.profile?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
          text: newApiComment.content,
          date: 'Vừa xong'
        };
      } catch (err) {
        console.error('Failed to add comment:', err);
      } finally {
        setEngagementLoading(false);
      }
    }

    if (!newMappedComment) {
      newMappedComment = {
        id: String(Date.now()),
        author: 'Bạn',
        avatar: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
        text: text.trim(),
        date: 'Vừa xong',
      };
    }

    const nextComments = [newMappedComment, ...comments];
    setComments(nextComments);

    try {
      localStorage.setItem(`terraholic_comments_${post.id}`, JSON.stringify(nextComments));
      if (apiId) {
        localStorage.setItem(`terraholic_comments_${apiId}`, JSON.stringify(nextComments));
      }
    } catch {}

    patchExplorePostEngagement(post.id, { comments: nextComments });
    window.dispatchEvent(new CustomEvent('terraholic_comments_updated', { detail: { postId: post.id } }));
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const textToSend = commentText;
    setCommentText('');
    setReplyingTo(null);
    await submitComment(textToSend);
  };

  const handleSendInlineReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!inlineReplyText.trim()) return;
    const textToSend = inlineReplyText;
    setInlineReplyText('');
    setActiveReplyTarget(null);
    await submitComment(textToSend, parentId);
  };

  const catClass = CATEGORY_STYLES[displayData.category] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20';

  return (
    <div className="explore-article-page min-h-screen bg-[var(--bg-primary)]">
      
      {/* Navigation Topbar */}
      <div className="sticky top-0 z-40 bg-[var(--bg-surface)]/95 backdrop-blur-md border-b border-[var(--border-subtle)]">
        <div className="container-wide h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/explore')}
            className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft size={18} /> Khám phá
          </button>

          <div className="flex items-center gap-2">
            {engagementLoading && <Loader2 size={18} className="animate-spin text-[var(--text-muted)]" />}
          </div>
        </div>
      </div>

      {/* Main Single-Column Body */}
      <div className="container-wide py-4 sm:py-6 pb-20 animate-fade-in">
        
        {/* Social Feed Style Post Card */}
        <article className="bg-[var(--bg-surface)] border border-[var(--border-normal)] rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
          
          {/* Header section (Author profile, check-in, metadata) */}
          <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-center gap-3">
              <Link to={post.authorId ? `/profile/${post.authorId}` : '#'} className="block hover:scale-105 transition-transform cursor-pointer flex-shrink-0">
                <img src={post.avatar} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-[var(--gold)]/20" />
              </Link>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link to={post.authorId ? `/profile/${post.authorId}` : '#'} className="font-bold text-[var(--text-primary)] text-sm sm:text-base flex items-center gap-1 hover:text-[var(--gold)] transition-colors">
                    {post.author}
                    {post.verified && <Check size={13} className="text-sky-500" />}
                  </Link>
                  <span className="text-xs text-[var(--text-muted)]">{post.handle}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--text-muted)] mt-0.5">
                  <span className="flex items-center gap-0.5 text-[var(--gold)]">
                    <MapPin size={12} className="flex-shrink-0" /> {displayData.location}
                  </span>
                  <span>·</span>
                  <span>{post.date}</span>
                </div>
              </div>
            </div>

            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${catClass}`}>
              {displayData.category}
            </span>
          </div>

          {/* Title and Excerpt */}
          <div className="space-y-3">
            <h1 className="font-editorial text-2xl sm:text-3.5xl font-bold text-[var(--text-primary)] leading-snug">
              {displayData.title}
            </h1>
            
            {displayData.excerpt && (
              <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 p-4 rounded-xl italic">
                {displayData.excerpt}
              </p>
            )}
          </div>

          {/* Post Images Grid Layout */}
          <ArticleImageGallery
            images={
              post.images && post.images.length > 0
                ? post.images
                : post.coverImage
                ? [post.coverImage]
                : []
            }
          />

          {/* Journey Route Timeline (If journey post) */}
          {displayData.routePoints && displayData.routePoints.length > 0 && (
            <div className="my-6 p-4 sm:p-5 rounded-2xl bg-[var(--bg-elevated)]/60 border border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--gold)]">
                <Navigation size={14} />
                <span>Lộ trình chuyến đi ({displayData.routePoints.length} điểm)</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-primary)] font-medium">
                {displayData.routePoints.map((pt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center gap-1.5 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
                      {pt.name || pt.address || `Điểm ${idx + 1}`}
                    </span>
                    {idx < displayData.routePoints.length - 1 && <span className="text-[var(--text-muted)]">→</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Post Content */}
          <div className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed space-y-4 pt-1">
            <p className="whitespace-pre-wrap">{displayData.content}</p>
          </div>

          {/* Tags */}
          {displayData.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {displayData.tags.map(tag => (
                <span key={tag} className="text-xs text-[var(--gold)] bg-[var(--gold)]/10 px-2.5 py-1 rounded-full border border-[var(--gold)]/15 font-semibold">
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          )}

          {/* Interactions bar (Screenshot 2 style layout) */}
          <div className="flex items-center justify-between border-t border-b border-[var(--border-subtle)] py-3 px-1 mt-4">
            {/* Left: Like Action Button & Count */}
            <button
              type="button"
              onClick={() => void toggleLike()}
              disabled={engagementLoading}
              className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] hover:text-rose-500 transition-colors"
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                post.liked ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-500/10 text-[var(--text-secondary)]'
              }`}>
                <Heart size={16} className={post.liked ? 'fill-current' : ''} />
              </span>
              <span>{post.likes.toLocaleString()} lượt thích</span>
            </button>

            {/* Right: Comments, Save (Bookmark), Share */}
            <div className="flex items-center gap-4 sm:gap-6 text-xs font-bold text-[var(--text-secondary)]">
              {/* Comment Count / Trigger */}
              <button
                type="button"
                onClick={() => document.getElementById('comment-composer-input')?.focus()}
                className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors"
              >
                <MessageCircle size={16} className="text-blue-500" />
                <span>{comments.length} bình luận</span>
              </button>

              {/* Bookmark (Save) */}
              <button
                type="button"
                onClick={() => void toggleBookmark()}
                disabled={engagementLoading}
                className={`flex items-center gap-2 hover:text-[var(--gold)] transition-colors cursor-pointer ${
                  post.bookmarked ? 'text-[var(--gold)] font-bold' : ''
                }`}
              >
                <Bookmark size={16} className={`text-amber-500 ${post.bookmarked ? 'fill-current' : ''}`} />
                <span>{post.bookmarked ? 'Đã lưu' : 'Lưu'}</span>
              </button>

              {/* Share modal opener */}
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors cursor-pointer"
              >
                <Share2 size={16} className="text-emerald-500" />
                <span>Chia sẻ</span>
              </button>
            </div>
          </div>

          {/* Rich Comments section */}
          <section className="space-y-4 pt-1">
              
              {/* Form composer */}
              <div className="space-y-2">
                {replyingTo && (
                  <div className="flex items-center justify-between bg-[var(--gold)]/10 border border-[var(--gold)]/20 rounded-lg px-3 py-1.5 text-xs text-[var(--gold)]">
                    <span>Đang trả lời <strong>@{replyingTo.author}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(null);
                        setCommentText('');
                      }}
                      className="hover:text-rose-500 font-bold ml-2 cursor-pointer"
                    >
                      ✕ Hủy
                    </button>
                  </div>
                )}
                <form onSubmit={(e) => { addComment(e); setReplyingTo(null); }} className="flex gap-2">
                  <input
                    id="comment-composer-input"
                    type="text"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder={replyingTo ? `Trả lời @${replyingTo.author}...` : "Viết bình luận..."}
                    className="flex-1 rounded-full border border-[var(--border-normal)] bg-[var(--bg-elevated)] text-[var(--text-primary)] px-4 py-2 text-xs sm:text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
                  />
                  <button type="submit" className="btn-gold px-5 py-2 rounded-full text-xs sm:text-sm font-bold cursor-pointer">
                    Gửi
                  </button>
                </form>
              </div>

              {/* Comment threads matching Image 2 layout */}
              <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2 py-2">
                {organizedThreads.length === 0 ? (
                  <p className="text-center text-xs text-[var(--text-muted)] py-6">Chưa có bình luận nào. Hãy bắt đầu cuộc trò chuyện!</p>
                ) : (
                  organizedThreads.map(parent => {
                    const parentReaction = likedComments[parent.id] || null;

                    return (
                      <div key={parent.id} className="space-y-3">
                        {/* Parent Comment */}
                        <div className="flex items-start gap-3 group/comment">
                          <Link to={parent.authorId ? `/profile/${parent.authorId}` : '#'} className="block hover:scale-105 transition-transform flex-shrink-0">
                            <img src={parent.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-[var(--border-subtle)] shadow-xs" />
                          </Link>
                          
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Link to={parent.authorId ? `/profile/${parent.authorId}` : '#'} className="font-bold text-[var(--text-primary)] text-sm hover:text-[var(--gold)] transition-colors">
                                {parent.author}
                              </Link>
                            </div>
                            
                            <p className="text-sm text-[var(--text-primary)] leading-normal break-words">
                              <CommentTextWithMentions text={parent.cleanText || parent.text} />
                            </p>

                            {/* Sub-actions: Clock date | Thích | ↶ Trả lời */}
                            <div className="flex items-center gap-4 text-xs font-semibold text-[var(--text-muted)] pt-1">
                              <span className="flex items-center gap-1 text-[11px]">
                                <Clock size={12} className="text-slate-400" />
                                {parent.date}
                              </span>

                              {/* Like reaction button */}
                              <div className="relative group/reaction inline-block">
                                <button
                                  type="button"
                                  onClick={() => setLikedComments(prev => ({ ...prev, [parent.id]: prev[parent.id] === 'like' ? null : 'like' }))}
                                  className={`hover:text-[var(--gold)] transition-colors cursor-pointer ${
                                    parentReaction === 'like' ? 'text-blue-500 font-bold' :
                                    parentReaction === 'love' ? 'text-rose-500 font-bold' :
                                    parentReaction === 'haha' ? 'text-amber-500 font-bold' : ''
                                  }`}
                                >
                                  {parentReaction === 'like' ? '👍 Thích' :
                                   parentReaction === 'love' ? '❤️ Yêu thích' :
                                   parentReaction === 'haha' ? '😂 Haha' : 'Thích'}
                                </button>

                                {/* Reaction Popup */}
                                <div className="absolute bottom-full left-0 pb-2 hidden group-hover/reaction:flex z-30 animate-fade-in">
                                  <div className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-full px-2.5 py-1.5 shadow-xl whitespace-nowrap">
                                    <button type="button" onClick={() => setLikedComments(prev => ({ ...prev, [parent.id]: 'like' }))} className="hover:scale-125 transition-transform text-xs cursor-pointer">👍</button>
                                    <button type="button" onClick={() => setLikedComments(prev => ({ ...prev, [parent.id]: 'love' }))} className="hover:scale-125 transition-transform text-xs cursor-pointer">❤️</button>
                                    <button type="button" onClick={() => setLikedComments(prev => ({ ...prev, [parent.id]: 'haha' }))} className="hover:scale-125 transition-transform text-xs cursor-pointer">😂</button>
                                  </div>
                                </div>
                              </div>

                              {/* Reply action button */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (activeReplyTarget?.parentId === parent.id && activeReplyTarget?.author === parent.author) {
                                    setActiveReplyTarget(null);
                                    setInlineReplyText('');
                                  } else {
                                    setActiveReplyTarget({ parentId: parent.id, author: parent.author });
                                    setInlineReplyText(`@${parent.author} `);
                                  }
                                }}
                                className="hover:text-[var(--gold)] transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                              >
                                <CornerUpLeft size={13} />
                                <span>Trả lời</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Child Nested Replies (with vertical line matching Image 2) */}
                        {parent.replies && parent.replies.length > 0 && (
                          <div className="ml-5 pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-4 pt-1">
                            {parent.replies.map((child: any) => {
                              const childReaction = likedComments[child.id] || null;

                              return (
                                <div key={child.id} className="flex items-start gap-2.5 relative group/child">
                                  {/* Horizontal connector line */}
                                  <div className="absolute -left-6 top-4 w-4 h-[2px] bg-slate-200 dark:bg-slate-800" />
                                  
                                  <Link to={child.authorId ? `/profile/${child.authorId}` : '#'} className="block hover:scale-105 transition-transform flex-shrink-0">
                                    <img src={child.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-[var(--border-subtle)] shadow-xs" />
                                  </Link>

                                  <div className="flex-1 space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <Link to={child.authorId ? `/profile/${child.authorId}` : '#'} className="font-bold text-[var(--text-primary)] text-xs hover:text-[var(--gold)] transition-colors">
                                        {child.author}
                                      </Link>
                                    </div>

                                    <p className="text-xs text-[var(--text-primary)] leading-normal break-words">
                                      <CommentTextWithMentions text={child.cleanText || child.text} />
                                    </p>

                                    {/* Child Sub-actions */}
                                    <div className="flex items-center gap-3 text-[10px] font-semibold text-[var(--text-muted)] pt-1">
                                      <span className="flex items-center gap-0.5">
                                        <Clock size={11} className="text-slate-400" />
                                        {child.date}
                                      </span>

                                      <button
                                        type="button"
                                        onClick={() => setLikedComments(prev => ({ ...prev, [child.id]: prev[child.id] === 'like' ? null : 'like' }))}
                                        className="hover:text-[var(--gold)] transition-colors font-bold cursor-pointer"
                                      >
                                        {childReaction === 'like' ? '👍 Thích' : 'Thích'}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (activeReplyTarget?.parentId === parent.id && activeReplyTarget?.author === child.author) {
                                            setActiveReplyTarget(null);
                                            setInlineReplyText('');
                                          } else {
                                            setActiveReplyTarget({ parentId: parent.id, author: child.author });
                                            setInlineReplyText(`@${child.author} `);
                                          }
                                        }}
                                        className="hover:text-[var(--gold)] transition-colors flex items-center gap-0.5 cursor-pointer"
                                      >
                                        <CornerUpLeft size={11} />
                                        <span>Trả lời</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Inline Reply Composer Box (Facebook Style) */}
                        {activeReplyTarget?.parentId === parent.id && (
                          <form
                            onSubmit={(e) => void handleSendInlineReply(e, parent.id)}
                            className="flex items-center gap-2 mt-2 ml-5 sm:ml-7 p-2 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--gold)]/40 shadow-sm animate-fade-in"
                          >
                            <img
                              src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                              alt=""
                              className="w-7 h-7 rounded-full object-cover border border-[var(--border-subtle)] flex-shrink-0"
                            />
                            <input
                              type="text"
                              autoFocus
                              value={inlineReplyText}
                              onChange={e => setInlineReplyText(e.target.value)}
                              placeholder={`Trả lời @${activeReplyTarget?.author ?? ''}...`}
                              className="flex-1 bg-transparent text-[var(--text-primary)] px-2 py-1 text-xs focus:outline-none placeholder:text-[var(--text-muted)]"
                            />
                            <button
                              type="submit"
                              disabled={!inlineReplyText.trim()}
                              className="px-3.5 py-1 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 cursor-pointer"
                            >
                              Gửi
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveReplyTarget(null);
                                setInlineReplyText('');
                              }}
                              className="text-xs text-[var(--text-muted)] hover:text-rose-500 font-bold px-1.5 cursor-pointer"
                            >
                              ✕
                            </button>
                          </form>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
        </article>
      </div>

      {/* Share Modal Popup */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        postUrl={window.location.href}
        title={post?.title || 'Bài viết Terraholic'}
        description={post?.excerpt || 'Khám phá hành trình tuyệt đẹp trên Terraholic!'}
      />
    </div>
  );
}
