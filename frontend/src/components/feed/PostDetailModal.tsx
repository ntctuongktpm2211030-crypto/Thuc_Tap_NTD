import { useEffect, useState } from 'react';
import {
  X, MapPin, Clock, BookOpen, Heart, MessageCircle, Bookmark, Share2,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { postsService } from '../../services/smartTravel.service';
import CommentsSection from './CommentsSection';
import type { FeedPost } from '../../utils/feedUtils';
import {
  getPostFullBody,
  getPostImages,
  getRoutePointsFromPost,
  getPostDetailTitle,
  getPostDetailSubtitle,
  parsePostPayload,
  estimateReadTime,
} from '../../utils/feedUtils';
import JourneyRouteMap from '../Map/JourneyRouteMap';
import { routePointRoleLabel, type RoutePoint } from '../../types/route';
import {
  PostDetailMetaRow,
  PostDetailTags,
  PostDetailItinerary,
  PostDetailTips,
} from './PostDetailJourneySections';

interface Props {
  post: FeedPost | null;
  onClose: () => void;
  onPostUpdated?: (postId: string, likesCount: number, commentsCount: number, isLiked: boolean) => void;
  labels: {
    close: string;
    readTime: string;
    likes: string;
    comments: string;
  };
}

export default function PostDetailModal({ post, onClose, onPostUpdated, labels }: Props) {
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [likers, setLikers] = useState<{ id: string; name: string; avatar?: string }[]>([]);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  useEffect(() => {
    if (!post) return;
    setLiked(!!post.isLiked);
    setLikeCount(post.likes);
    setSaved(!!post.isBookmarked);
    setCommentCount(post.comments);
    setLikers([]);
  }, [post]);

  useEffect(() => {
    if (!post) return;
    postsService.get(post.id)
      .then(data => {
        if (data.likes) {
          const list = data.likes.map((l: any) => ({
            id: l.user.id,
            name: l.user.profile?.fullName || l.user.email.split('@')[0],
            avatar: l.user.profile?.avatarUrl || undefined
          }));
          setLikers(list);
        }
      })
      .catch(err => {
        console.error("Failed to fetch full post details:", err);
      });
  }, [post]);

  useEffect(() => {
    if (!post) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [post, onClose]);

  // Propagate commentCount changes back to parent
  useEffect(() => {
    if (onPostUpdated && post) {
      onPostUpdated(post.id, likeCount, commentCount, liked);
    }
  }, [commentCount]);

  const handleLike = async () => {
    if (!post) return;
    if (!isAuthenticated) {
      showToast('Bạn cần đăng nhập để thích bài viết!');
      return;
    }
    try {
      const res = await postsService.toggleLike(post.id);
      const isNowLiked = res.liked;
      setLiked(isNowLiked);
      
      setLikeCount(prev => {
        const newCount = isNowLiked ? prev + 1 : Math.max(0, prev - 1);
        if (onPostUpdated) {
          onPostUpdated(post.id, newCount, commentCount, isNowLiked);
        }
        return newCount;
      });

      // Update likers list immediately
      if (isNowLiked) {
        if (user) {
          const currentLiker = {
            id: user.id,
            name: user.fullName || user.email.split('@')[0],
            avatar: user.avatarUrl
          };
          setLikers(prev => {
            if (prev.some(l => l.id === user.id)) return prev;
            return [...prev, currentLiker];
          });
        }
      } else {
        if (user) {
          setLikers(prev => prev.filter(l => l.id !== user.id));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookmark = async () => {
    if (!post) return;
    if (!isAuthenticated) {
      showToast('Bạn cần đăng nhập để lưu bài viết!');
      return;
    }
    try {
      const res = await postsService.toggleBookmark(post.id);
      setSaved(res.bookmarked);
      if (onPostUpdated) {
        onPostUpdated(post.id, likeCount, commentCount, liked);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!post) return null;

  const payload = parsePostPayload(post);
  const body = getPostFullBody(post);
  const images = getPostImages(post);
  const routePts: RoutePoint[] = getRoutePointsFromPost(post);
  const readTime =
    post.displayType !== 'social' && 'readTime' in post
      ? post.readTime
      : estimateReadTime(body, payload?.excerpt ?? '', payload?.headline ?? '');
  const title = getPostDetailTitle(post);
  const subtitle = getPostDetailSubtitle(post);
  const showSubtitle = subtitle && subtitle !== body.trim();
  const hasItinerary = (payload?.days?.length ?? 0) > 0;
  const hasTips = (payload?.tips?.filter(t => t.content?.trim()).length ?? 0) > 0;

  return (
    <div
      className="post-detail-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="post-detail-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-detail-title"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="post-detail-close"
          aria-label={labels.close}
        >
          <X size={20} />
        </button>

        <div className="post-detail-split-container">
          {images.length > 0 && (
            <div className="post-detail-media-side">
              <div className={`post-detail-hero-slider ${images.length > 1 ? 'post-detail-hero--grid' : ''}`}>
                {images.map((src, i) => (
                  <img key={`${src}-${i}`} src={src} alt="" className="post-detail-hero-img" loading="lazy" />
                ))}
              </div>
            </div>
          )}

          <div className="post-detail-content-side">
            <div className="post-detail-body">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-[var(--gold)]/40 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--text-primary)]">{post.author.name}</span>
                      {post.author.verified && (
                        <span className="w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">✓</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[var(--text-muted)] mt-0.5">
                      <span className="flex items-center gap-1"><Clock size={10} />{post.date}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><BookOpen size={10} />{readTime}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-[var(--gold)]">
                        <MapPin size={10} />{post.destination.replace(/^📍\s*/, '')}
                      </span>
                    </div>
                  </div>
                </div>

                {post.displayType !== 'social' && 'category' in post && (
                  <span className="flex-shrink-0 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[var(--gold-glow)] text-[var(--gold)] border border-[var(--gold)]/30">
                    {post.category}
                  </span>
                )}
              </div>

              <h2 id="post-detail-title" className="font-editorial text-xl sm:text-2xl font-bold text-[var(--text-primary)] leading-snug mb-3">
                {title}
              </h2>

              {showSubtitle && (
                <p className="text-sm text-[var(--text-secondary)] font-medium mb-4 border-l-2 border-[var(--gold)] pl-3">
                  {subtitle}
                </p>
              )}

              {payload && <PostDetailMetaRow payload={payload} />}
              {payload?.tags && payload.tags.length > 0 && <PostDetailTags tags={payload.tags} />}

              {body && (
                <div className="post-detail-content prose-feed text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap mt-4">
                  {body}
                </div>
              )}

              {routePts.length >= 1 && (
                <div className="post-detail-route mt-6">
                  <h3 className="post-detail-section-title mb-2">
                    <MapPin size={16} className="text-[var(--gold)]" />
                    Tuyến đường đề xuất
                    {routePts.length >= 2 && (
                      <span className="post-detail-section-count">{routePts.length} điểm</span>
                    )}
                  </h3>
                  <div className="space-y-2 mb-3">
                    {routePts.map((p, i) => (
                      <div key={p.id} className="flex gap-2 p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                        <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-emerald-500 text-white' : 'bg-[var(--gold)] text-black'}`}>
                          {i === 0 ? '▶' : i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-[var(--gold)] uppercase">{routePointRoleLabel(i, routePts.length)}</p>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{p.name}</p>
                          {p.address && p.address !== p.name && (
                            <p className="text-[11px] text-[var(--text-muted)] leading-snug">{p.address}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <JourneyRouteMap points={routePts} interactive={false} height="300px" />
                </div>
              )}

              {hasItinerary && payload && <PostDetailItinerary days={payload.days} />}
              {hasTips && payload && <PostDetailTips tips={payload.tips} />}

              <div className="flex items-center justify-between p-3 px-4 mt-6 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                {/* Left: Like button & count */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLike}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      liked ? 'bg-rose-500 hover:bg-rose-600 scale-105' : 'bg-rose-500/10 hover:bg-rose-500/20 hover:scale-105'
                    }`}
                    title={liked ? 'Bỏ thích' : 'Thích'}
                  >
                    <Heart size={12} className={liked ? 'text-white fill-white' : 'text-rose-500'} />
                  </button>
                  <span className={`font-semibold ${liked ? 'text-rose-600' : 'text-slate-600 dark:text-slate-400'}`}>
                    {likeCount.toLocaleString()} {labels.likes}
                  </span>
                </div>

                {/* Right: Comment, Save, Share */}
                <div className="flex items-center gap-4 sm:gap-5">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400">
                    <MessageCircle size={14} className="text-blue-500" />
                    <span>{commentCount} {labels.comments}</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleBookmark}
                    className={`flex items-center gap-1.5 font-semibold transition-colors ${
                      saved ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
                    }`}
                  >
                    <Bookmark size={14} className={`text-amber-500 ${saved ? 'fill-current' : ''} transition-colors`} />
                    <span>{saved ? 'Đã lưu' : 'Lưu'}</span>
                  </button>

                  <button
                    type="button"
                    className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    <Share2 size={14} className="text-emerald-500" />
                    <span>Chia sẻ</span>
                  </button>
                </div>
              </div>

              {/* Likers section */}
              {likers.length > 0 && (
                <div className="mt-4 p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] animate-fade-in">
                  <p className="text-xs font-bold text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
                    <Heart size={12} className="text-rose-500 fill-rose-500 animate-pulse" /> Đã thích bởi ({likers.length})
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    {likers.map((liker) => (
                      <div
                        key={liker.id}
                        className="flex items-center gap-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-overlay)] px-2.5 py-1 rounded-full border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] transition-colors cursor-pointer group"
                        title={liker.name}
                      >
                        {liker.avatar ? (
                          <img
                            src={liker.avatar}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--gold)] to-violet-500 text-white flex items-center justify-center font-bold text-[10px]">
                            {liker.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-semibold">{liker.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 border-t border-[var(--border-subtle)] pt-6">
                <CommentsSection postId={post.id} onCommentCountChange={setCommentCount} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-[999999] bg-black/90 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-[var(--gold)]/30 shadow-lg shadow-black/50 animate-fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
