import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ExternalLink, Heart, MessageCircle, Trash2, ArrowLeft } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { postsService, Post } from '../../services/smartTravel.service';
import { mapApiPostsToFeed } from '../../utils/apiPostMapper';
import { FeedPost } from '../../utils/feedUtils';
import PostDetailModal from '../../components/feed/PostDetailModal';

export default function SavedPage() {
  const { lang } = useLang();
  const vi = lang === 'vi';

  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);

  const fetchSavedPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const posts = await postsService.myBookmarks();
      setSavedPosts(posts);
    } catch (err) {
      console.error(err);
      setError(vi ? 'Không thể tải các bài viết đã lưu.' : 'Failed to load saved posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSavedPosts();
  }, []);

  const handleUnsave = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    try {
      await postsService.toggleBookmark(postId);
      // Animate item out of list
      setSavedPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostClick = (post: Post) => {
    const mapped = mapApiPostsToFeed([post])[0];
    if (mapped) {
      setSelectedPost(mapped);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-8">
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          labels={{
            close: vi ? 'Đóng' : 'Close',
            readTime: '',
            likes: vi ? 'lượt thích' : 'likes',
            comments: vi ? 'bình luận' : 'comments',
          }}
        />
      )}

      <div className="container-wide max-w-6xl mx-auto px-4 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
          <div className="space-y-1">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors mb-2">
              <ArrowLeft size={14} /> {vi ? 'Quay lại bảng tin' : 'Back to Feed'}
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Bookmark size={20} className="fill-current" />
              </div>
              <div>
                <h1 className="text-2xl font-editorial font-bold text-[var(--text-primary)]">
                  {vi ? 'Bộ sưu tập đã lưu' : 'Saved Collection'}
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  {vi ? `${savedPosts.length} bài viết đã lưu` : `${savedPosts.length} saved items`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Items Content */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-t-[var(--gold)] border-r-transparent border-b-rose-500 border-l-transparent animate-spin duration-1000" />
            <p className="text-sm text-[var(--text-muted)]">{vi ? 'Đang tải danh sách đã lưu...' : 'Loading saved list...'}</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center text-rose-300">
            {error}
          </div>
        ) : savedPosts.length === 0 ? (
          <div className="text-center py-20 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
              <Bookmark size={24} />
            </div>
            <div className="space-y-1 px-6">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {vi ? 'Bộ sưu tập của bạn đang trống' : 'Your collection is empty'}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {vi 
                  ? 'Hãy duyệt bảng tin và bấm vào biểu tượng lưu để giữ lại các bài viết và hành trình thú vị.' 
                  : 'Browse the feed and save interesting articles or journeys for later.'}
              </p>
            </div>
            <Link to="/" className="btn-gold inline-flex px-6 py-2.5 text-xs">
              {vi ? 'Khám phá ngay' : 'Explore Now'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedPosts.map(post => {
              const authorName = post.author.profile?.fullName || 'Người dùng';
              const avatar = post.author.profile?.avatarUrl;
              const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;
              const dateString = new Date(post.createdAt).toLocaleDateString('vi-VN');

              return (
                <div 
                  key={post.id}
                  onClick={() => handlePostClick(post)}
                  className="surface-elevated overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--gold)]/40 rounded-2xl cursor-pointer hover:shadow-xl transition-all duration-300 flex flex-col group relative"
                >
                  {/* Media Cover */}
                  <div className="h-44 relative bg-black/10 overflow-hidden">
                    {hasMedia ? (
                      <img 
                        src={post.mediaUrls[0]} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-600/30 to-rose-600/30 flex items-center justify-center text-[var(--text-muted)] font-editorial text-sm">
                        Terraholic Journey
                      </div>
                    )}
                    
                    {/* Unsave button overlay */}
                    <button
                      onClick={(e) => handleUnsave(e, post.id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-rose-600/90 text-white flex items-center justify-center backdrop-blur-sm shadow-md transition-all duration-200"
                      title={vi ? 'Bỏ lưu bài viết' : 'Unsave item'}
                    >
                      <Trash2 size={13} />
                    </button>

                    {/* Date label */}
                    <span className="absolute bottom-3 left-3 bg-black/50 text-[10px] text-white/90 px-2 py-0.5 rounded-md backdrop-blur-sm">
                      {dateString}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      {/* Author */}
                      <div className="flex items-center gap-2">
                        {avatar ? (
                          <img src={avatar} alt="" className="w-5 h-5 rounded-full object-cover border border-[var(--border-subtle)]" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-[var(--gold)] text-black font-bold flex items-center justify-center text-[9px]">
                            {authorName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] truncate">{authorName}</span>
                      </div>

                      {/* Content excerpt */}
                      <p className="text-xs text-[var(--text-primary)] font-semibold leading-normal line-clamp-3">
                        {post.content}
                      </p>
                    </div>

                    {/* Footer Stats & details Link */}
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-3">
                      <div className="flex gap-3">
                        <span className="flex items-center gap-1"><Heart size={10} className="text-rose-500 fill-rose-500/10" /> {post._count?.likes ?? 0}</span>
                        <span className="flex items-center gap-1"><MessageCircle size={10} /> {post._count?.comments ?? 0}</span>
                      </div>
                      <span className="text-gold font-semibold flex items-center gap-1 group-hover:underline">
                        {vi ? 'Xem chi tiết' : 'Details'} <ExternalLink size={9} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
