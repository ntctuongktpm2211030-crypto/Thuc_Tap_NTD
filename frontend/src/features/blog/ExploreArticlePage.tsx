import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Bookmark, Check, Heart, MapPin, MessageCircle, Loader2, Share2,
} from 'lucide-react';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { postsService } from '../../services/smartTravel.service';
import { toApiPostId } from '../../utils/postIds';
import { syncToggleBookmark, syncToggleLike } from '../../utils/postEngagement';
import { getExplorePostById, patchExplorePostEngagement } from './explorePostsStore';

const CATEGORY_STYLES: Record<string, string> = {
  'Thiên nhiên': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Ẩm thực': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Phiêu lưu': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Văn hóa': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Sang trọng': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  'Biển đảo': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Nghỉ dưỡng': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
};



export default function ExploreArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { requireAuth } = useRequireAuth();

  const [post, setPost] = useState(() => (id ? getExplorePostById(id) : undefined));
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post?.comments ?? []);
  const [likedComments, setLikedComments] = useState<Record<string, 'like' | 'love' | 'haha' | null>>({});
  const [engagementLoading, setEngagementLoading] = useState(false);

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
        patchExplorePostEngagement(id, { liked, bookmarked, likes });
        const refreshed = getExplorePostById(id);
        if (refreshed) applyPost(refreshed);
      })
      .catch(() => {});
  }, [id, applyPost]);

  if (!post) {
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

  const addComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const next = [
      {
        id: String(Date.now()),
        author: 'Bạn',
        avatar: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
        text: commentText.trim(),
        date: 'Vừa xong',
      },
      ...comments,
    ];
    setComments(next);
    patchExplorePostEngagement(post.id, { comments: next });
    setCommentText('');
  };

  const catClass = CATEGORY_STYLES[post.category] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20';

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
            <button
              type="button"
              onClick={() => void toggleBookmark()}
              disabled={engagementLoading}
              className={`p-2 rounded-full hover:bg-[var(--bg-elevated)] transition-colors ${
                post.bookmarked ? 'text-[var(--gold)]' : 'text-[var(--text-muted)]'
              }`}
              title="Lưu bài viết"
            >
              <Bookmark size={20} className={post.bookmarked ? 'fill-current' : ''} />
            </button>
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
              <img src={post.avatar} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-[var(--gold)]/20" />
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-[var(--text-primary)] text-sm sm:text-base flex items-center gap-1">
                    {post.author}
                    {post.verified && <Check size={13} className="text-sky-500" />}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{post.handle}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--text-muted)] mt-0.5">
                  <span className="flex items-center gap-0.5 text-[var(--gold)]">
                    <MapPin size={12} className="flex-shrink-0" /> {post.location}
                  </span>
                  <span>·</span>
                  <span>{post.date}</span>
                </div>
              </div>
            </div>

            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${catClass}`}>
              {post.category}
            </span>
          </div>



          {/* Title and Excerpt */}
          <div className="space-y-3">
            <h1 className="font-editorial text-2xl sm:text-3.5xl font-bold text-[var(--text-primary)] leading-snug">
              {post.title}
            </h1>
            
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed border-l-4 border-[var(--gold)] pl-3 italic bg-[var(--bg-elevated)]/30 py-2 pr-2 rounded-r-md">
              {post.excerpt}
            </p>
          </div>

          {/* Post Images Masonry Layout (medium size) */}
          <div className="columns-1 sm:columns-2 md:columns-3 gap-3 space-y-3 mt-4">
            {[
              post.coverImage,
              'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80',
              'https://images.unsplash.com/photo-1552083375-1447ce886485?auto=format&fit=crop&w=900&q=80'
            ].map((src, i) => (
              <div key={`${src}-${i}`} className="break-inside-avoid rounded-xl overflow-hidden shadow-sm border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                <img src={src} alt="" className="w-full h-auto object-cover hover:scale-[1.01] transition-transform duration-300" loading="lazy" />
              </div>
            ))}
          </div>

          {/* Post Content */}
          <div className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed space-y-4 pt-1">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {post.tags.map(tag => (
                <span key={tag} className="text-xs text-[var(--gold)] bg-[var(--gold)]/10 px-2.5 py-1 rounded-full border border-[var(--gold)]/15 font-semibold">
                  #{tag}
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
                className={`flex items-center gap-2 hover:text-[var(--gold)] transition-colors ${
                  post.bookmarked ? 'text-[var(--gold)]' : ''
                }`}
              >
                <Bookmark size={16} className={`text-amber-500 ${post.bookmarked ? 'fill-current' : ''}`} />
                <span>{post.bookmarked ? 'Đã lưu' : 'Lưu'}</span>
              </button>

              {/* Share link copying */}
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Đã sao chép liên kết bài viết vào bộ nhớ tạm!');
                }}
                className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors"
              >
                <Share2 size={16} className="text-emerald-500" />
                <span>Chia</span>
              </button>
            </div>
          </div>

            {/* Rich Comments section */}
            <section className="space-y-4 pt-1">
              
              {/* Form composer */}
              <form onSubmit={addComment} className="flex gap-2">
                <input
                  id="comment-composer-input"
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Viết bình luận..."
                  className="flex-1 rounded-full border border-[var(--border-normal)] bg-[var(--bg-elevated)] text-[var(--text-primary)] px-4 py-2 text-xs sm:text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
                />
                <button type="submit" className="btn-gold px-5 py-2 rounded-full text-xs sm:text-sm font-bold">
                  Gửi
                </button>
              </form>

              {/* Comment bubbles */}
              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-center text-xs text-[var(--text-muted)] py-4">Chưa có bình luận nào. Hãy bắt đầu cuộc trò chuyện!</p>
                ) : (
                  comments.map(c => {
                    const commentReaction = likedComments[c.id] || null;
                    return (
                      <div key={c.id} className="flex gap-2.5 items-start group/comment relative">
                        <img src={c.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-[var(--border-subtle)] flex-shrink-0" />
                        
                        <div className="flex-1">
                          
                          {/* Bubble */}
                          <div className="relative bg-[var(--bg-elevated)] rounded-2xl rounded-tl-sm px-3.5 py-2 text-sm text-[var(--text-secondary)] inline-block max-w-[90%] hover:brightness-105 transition-all">
                            <span className="font-bold text-[var(--text-primary)] text-xs block mb-0.5">{c.author}</span>
                            <p className="whitespace-pre-wrap break-all leading-normal text-xs">{c.text}</p>
                            
                            {commentReaction && (
                              <span className="absolute -bottom-1.5 -right-1.5 flex items-center bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-full px-1.5 py-0.5 shadow-sm text-[10px] scale-90 z-20">
                                {commentReaction === 'like' && '👍'}
                                {commentReaction === 'love' && '❤️'}
                                {commentReaction === 'haha' && '😂'}
                              </span>
                            )}
                          </div>

                          {/* Comment sub actions */}
                          <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] mt-1 ml-2">
                            <span>{c.date}</span>
                            
                            <div className="relative group inline-block">
                              <button
                                type="button"
                                onClick={() => {
                                  setLikedComments(prev => ({
                                    ...prev,
                                    [c.id]: prev[c.id] === 'like' ? null : 'like'
                                  }));
                                }}
                                className={`hover:text-[var(--gold)] transition-colors font-bold flex items-center gap-0.5 ${
                                  commentReaction === 'like' ? 'text-blue-500' :
                                  commentReaction === 'love' ? 'text-rose-500 font-extrabold' :
                                  commentReaction === 'haha' ? 'text-amber-500 font-extrabold' : ''
                                }`}
                              >
                                {commentReaction === 'like' ? 'Thích' :
                                 commentReaction === 'love' ? 'Yêu thích' :
                                 commentReaction === 'haha' ? 'Haha' : 'Thích'}
                              </button>
                              
                              {/* Hover reaction panel with transparent bridge to prevent hover loss */}
                              <div className="absolute bottom-full left-0 pb-2 hidden group-hover:flex z-30 animate-fade-in">
                                <div className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-full px-2.5 py-1.5 shadow-xl whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => setLikedComments(prev => ({ ...prev, [c.id]: 'like' }))}
                                    className="hover:scale-125 transition-transform duration-100 text-xs"
                                    title="Thích"
                                  >
                                    👍
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setLikedComments(prev => ({ ...prev, [c.id]: 'love' }))}
                                    className="hover:scale-125 transition-transform duration-100 text-xs"
                                    title="Yêu thích"
                                  >
                                    ❤️
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setLikedComments(prev => ({ ...prev, [c.id]: 'haha' }))}
                                    className="hover:scale-125 transition-transform duration-100 text-xs"
                                    title="Haha"
                                  >
                                    😂
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
        </article>
      </div>

    </div>
  );
}
