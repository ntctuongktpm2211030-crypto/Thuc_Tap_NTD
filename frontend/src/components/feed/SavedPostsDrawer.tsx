import { useState, useEffect } from 'react';
import { X, Bookmark, ExternalLink } from 'lucide-react';
import { postsService, Post } from '../../services/smartTravel.service';
import { mapApiPostsToFeed } from '../../utils/apiPostMapper';
import { FeedPost } from '../../utils/feedUtils';

interface SavedPostsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPost: (post: FeedPost) => void;
}

export default function SavedPostsDrawer({ isOpen, onClose, onSelectPost }: SavedPostsDrawerProps) {
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSavedPosts = async () => {
    if (!isOpen) return;
    setLoading(true);
    setError('');
    try {
      const posts = await postsService.myBookmarks();
      setSavedPosts(posts);
    } catch (err) {
      console.error(err);
      setError('Không thể tải các bài viết đã lưu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSavedPosts();
  }, [isOpen]);

  const handleUnsave = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    try {
      await postsService.toggleBookmark(postId);
      // Remove from list
      setSavedPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostClick = (post: Post) => {
    // Map backend Post format to UI FeedPost format
    const mapped = mapApiPostsToFeed([post])[0];
    if (mapped) {
      onSelectPost(mapped);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] shadow-2xl flex flex-col animate-slide-left">
          
          {/* Drawer Header */}
          <div className="px-4 py-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark size={18} className="text-rose-400 fill-rose-400/20" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">Bài viết đã lưu</h2>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="w-8 h-8 border-3 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-[var(--text-muted)]">Đang tải bài viết đã lưu...</p>
              </div>
            ) : error ? (
              <p className="text-center text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl">{error}</p>
            ) : savedPosts.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                  <Bookmark size={20} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[var(--text-primary)]">Không có bài viết đã lưu</p>
                  <p className="text-[10px] text-[var(--text-muted)] max-w-xs mx-auto">
                    Các bài viết bạn đã đánh dấu lưu sẽ hiển thị ở đây để xem lại bất cứ lúc nào.
                  </p>
                </div>
              </div>
            ) : (
              savedPosts.map(post => {
                const authorName = post.author.profile?.fullName || 'Người dùng';
                const avatar = post.author.profile?.avatarUrl;
                const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;
                
                return (
                  <div 
                    key={post.id}
                    onClick={() => handlePostClick(post)}
                    className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--gold)]/40 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-300 flex gap-3 group relative overflow-hidden"
                  >
                    {/* Media preview if available */}
                    {hasMedia ? (
                      <img 
                        src={post.mediaUrls[0]} 
                        alt="" 
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-black/10"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0 text-[var(--text-muted)] text-[10px] font-bold">
                        Bản tin
                      </div>
                    )}

                    {/* Post text preview */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          {avatar ? (
                            <img src={avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-[var(--gold)] text-white font-bold flex items-center justify-center text-[7px]">
                              {authorName.charAt(0)}
                            </div>
                          )}
                          <span className="text-[10px] font-bold text-[var(--text-secondary)] truncate">{authorName}</span>
                        </div>
                        <p className="text-xs text-[var(--text-primary)] leading-normal font-semibold line-clamp-2 pr-4">
                          {post.content}
                        </p>
                      </div>
                      
                      {/* Meta information */}
                      <span className="text-[9px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
                        Xem chi tiết <ExternalLink size={8} />
                      </span>
                    </div>

                    {/* Unsave action button overlay on hover */}
                    <button
                      onClick={(e) => handleUnsave(e, post.id)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Bỏ lưu bài viết"
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
