import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postsService, Comment } from '../../services/smartTravel.service';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Send, Reply, Clock, MessageCircle } from 'lucide-react';


interface CommentsSectionProps {
  postId: string;
  onCommentCountChange?: (count: number) => void;
}

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

function normalizeCommentsSectionItem(c: any): any {
  if (!c) return null;
  const content = c.content || c.text || '';
  const authorObj = typeof c.author === 'object' && c.author ? c.author : {
    profile: {
      fullName: typeof c.author === 'string' ? c.author : 'Người dùng',
      avatarUrl: c.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
    }
  };
  const replies = Array.isArray(c.replies) ? c.replies.map(normalizeCommentsSectionItem).filter(Boolean) : [];

  return {
    ...c,
    id: String(c.id || Date.now()),
    content,
    author: authorObj,
    createdAt: c.createdAt || c.date || new Date().toISOString(),
    replies,
  };
}

export default function CommentsSection({ postId, onCommentCountChange }: CommentsSectionProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Input for new top-level comment
  const [newCommentText, setNewCommentText] = useState('');
  
  // State to track which comment ID is being replied to
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Track liked comments locally (for UI state)
  const [likedComments, setLikedComments] = useState<Record<string, 'like' | 'love' | 'haha' | null>>({});
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const loadComments = async () => {
    let localList: any[] = [];
    const rawId = postId.replace(/^api-/, '');
    const keys = [
      `terraholic_comments_${postId}`,
      `terraholic_comments_${rawId}`,
      `terraholic_comments_api-${rawId}`,
    ];

    for (const k of keys) {
      try {
        const localRaw = localStorage.getItem(k);
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (Array.isArray(parsed)) {
            parsed.forEach(item => {
              const norm = normalizeCommentsSectionItem(item);
              if (norm) localList.push(norm);
            });
          }
        }
      } catch {}
    }

    if (postId.startsWith('checkin-')) {
      setComments(localList);
      if (onCommentCountChange) onCommentCountChange(localList.length);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await postsService.getComments(postId);
      const map = new Map<string, any>();
      (data || []).forEach(c => {
        const norm = normalizeCommentsSectionItem(c);
        if (norm) map.set(norm.id, norm);
      });
      localList.forEach(c => {
        if (!map.has(c.id)) map.set(c.id, c);
      });
      const merged = Array.from(map.values());

      setComments(merged);
      
      // Calculate total comments count (top-level + replies)
      let totalCount = merged.length;
      merged.forEach(c => {
        if (c.replies) totalCount += c.replies.length;
      });
      if (onCommentCountChange) onCommentCountChange(totalCount);
    } catch (err) {
      console.error(err);
      if (localList.length > 0) {
        setComments(localList);
        if (onCommentCountChange) onCommentCountChange(localList.length);
      } else {
        setError('Không tải được bình luận.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadComments();

    const handleSync = () => {
      void loadComments();
    };

    window.addEventListener('terraholic_comments_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('terraholic_comments_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [postId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    if (!newCommentText.trim()) return;

    if (postId.startsWith('checkin-')) {
      const mockComment = {
        id: `mock-comment-${Date.now()}`,
        content: newCommentText,
        createdAt: new Date().toISOString(),
        author: {
          profile: {
            fullName: user?.fullName || 'Bạn',
            avatarUrl: user?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
          }
        },
        replies: [],
      };
      const updated = [mockComment as any, ...comments];
      setComments(updated);
      try {
        localStorage.setItem(`terraholic_comments_${postId}`, JSON.stringify(updated));
      } catch {}
      setNewCommentText('');
      if (onCommentCountChange) onCommentCountChange(updated.length);
      return;
    }

    try {
      const newComment = await postsService.addComment(postId, newCommentText);
      // Backend returns the comment, we insert it at the top of comments
      const updated = [{ ...newComment, replies: [] }, ...comments];
      setComments(updated);
      try {
        localStorage.setItem(`terraholic_comments_${postId}`, JSON.stringify(updated));
        if (postId.startsWith('api-')) {
          localStorage.setItem(`terraholic_comments_${postId.replace('api-', '')}`, JSON.stringify(updated));
        } else {
          localStorage.setItem(`terraholic_comments_api-${postId}`, JSON.stringify(updated));
        }
      } catch {}
      window.dispatchEvent(new CustomEvent('terraholic_comments_updated', { detail: { postId } }));
      setNewCommentText('');
      
      // Recalculate total count
      let totalCount = updated.length;
      updated.forEach(c => {
        if (c.replies) totalCount += c.replies.length;
      });
      if (onCommentCountChange) onCommentCountChange(totalCount);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddReply = async (parentId: string) => {
    if (!isAuthenticated) return;
    if (!replyText.trim()) return;

    if (postId.startsWith('checkin-')) {
      const mockReply = {
        id: `mock-reply-${Date.now()}`,
        content: replyText,
        createdAt: new Date().toISOString(),
        author: {
          profile: {
            fullName: user?.fullName || 'Bạn',
            avatarUrl: user?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
          }
        },
      };
      setComments(prev => prev.map(c => {
        if (c.id === parentId) {
          return {
            ...c,
            replies: [...(c.replies || []), mockReply as any]
          };
        }
        return c;
      }));
      setReplyText('');
      setActiveReplyId(null);

      // Recalculate total count
      let totalCount = comments.length + 1;
      comments.forEach(c => {
        if (c.replies) totalCount += c.replies.length;
      });
      if (onCommentCountChange) onCommentCountChange(totalCount);
      return;
    }

    try {
      const newReply = await postsService.addComment(postId, replyText, parentId);
      
      const updated = comments.map(c => {
        if (c.id === parentId) {
          return {
            ...c,
            replies: [...(c.replies || []), newReply]
          };
        }
        return c;
      });
      
      setComments(updated);
      try {
        localStorage.setItem(`terraholic_comments_${postId}`, JSON.stringify(updated));
        if (postId.startsWith('api-')) {
          localStorage.setItem(`terraholic_comments_${postId.replace('api-', '')}`, JSON.stringify(updated));
        } else {
          localStorage.setItem(`terraholic_comments_api-${postId}`, JSON.stringify(updated));
        }
      } catch {}
      window.dispatchEvent(new CustomEvent('terraholic_comments_updated', { detail: { postId } }));

      setReplyText('');
      setActiveReplyId(null);

      // Recalculate total count
      let totalCount = comments.length;
      comments.forEach(c => {
        if (c.id === parentId) {
          totalCount += (c.replies?.length || 0) + 1;
        } else if (c.replies) {
          totalCount += c.replies.length;
        }
      });
      if (onCommentCountChange) onCommentCountChange(totalCount);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReactionSelect = (commentId: string, reaction: 'like' | 'love' | 'haha' | null) => {
    if (!isAuthenticated) {
      showToast('Bạn cần đăng nhập để tương tác!');
      return;
    }
    setLikedComments(prev => ({
      ...prev,
      [commentId]: prev[commentId] === reaction ? null : reaction
    }));
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <h4 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2 flex items-center gap-2">
        <span>Bình luận</span>
        {loading && <span className="w-3.5 h-3.5 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />}
      </h4>

      {error && (
        <p className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg">{error}</p>
      )}

      {/* Write Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleAddComment} className="flex gap-2.5 items-start mt-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-3 shadow-sm focus-within:border-[var(--gold)]/50 transition-colors">
          <img src={user?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} alt="" className="w-8 h-8 rounded-full object-cover border border-[var(--border-subtle)] flex-shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              value={newCommentText}
              onChange={e => setNewCommentText(e.target.value)}
              placeholder="Chia sẻ suy nghĩ của bạn về bài viết này..."
              rows={2}
              className="w-full bg-transparent border-none text-sm text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-muted)] resize-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleAddComment(e as any);
                }
              }}
            />
            <div className="flex justify-between items-center border-t border-[var(--border-subtle)] pt-2 mt-1">
              <span className="text-[9px] text-[var(--text-muted)] italic">
                Nhấn Enter để gửi · Shift+Enter để xuống dòng
              </span>
              <button 
                type="submit" 
                disabled={!newCommentText.trim()} 
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                  newCommentText.trim() 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                    : 'bg-slate-200 dark:bg-slate-800 text-[var(--text-muted)] cursor-not-allowed'
                }`}
              >
                <Send size={10} /> Gửi
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="flex gap-2 items-center mt-2 opacity-75">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8 rounded-full bg-[#b0b3b8] flex-shrink-0"
          >
            <circle cx="12" cy="10" r="4.5" fill="#FFFFFF" />
            <path
              d="M12 16C8.5 16 5.5 18.5 5 22H19C18.5 18.5 15.5 16 12 16Z"
              fill="#FFFFFF"
            />
          </svg>
          <div className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl px-4 py-2.5 text-xs text-[var(--text-muted)] cursor-not-allowed select-none">
            Bạn cần đăng nhập để bình luận...
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="comments-section-list space-y-4 pr-1">
        {comments.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-[var(--bg-elevated)]/30 border border-dashed border-[var(--border-subtle)] rounded-2xl p-4">
            <MessageCircle className="w-8 h-8 text-[var(--text-muted)] mb-2 opacity-50" />
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Chưa có bình luận nào</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Hãy là người đầu tiên chia sẻ cảm nghĩ của bạn!</p>
          </div>
        ) : (
          comments.map(c => {
            const currentReaction = likedComments[c.id] || null;
            return (
              <div key={c.id} className="space-y-2 group/comment relative">
                {/* Main Parent Comment */}
                <div className="flex gap-2 items-start relative z-10">
                  <Link to={`/profile/${c.author.id}`} className="block hover:scale-105 transition-transform cursor-pointer flex-shrink-0">
                    <img src={c.author.profile?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} alt="" className="w-8 h-8 rounded-full object-cover border border-[var(--border-subtle)]" />
                  </Link>
                  <div className="flex-1">
                    <div className="relative bg-[var(--bg-elevated)] rounded-2xl rounded-tl-sm px-3.5 py-2 text-sm text-[var(--text-secondary)] inline-block max-w-[90%] hover:brightness-105 transition-all">
                      <p className="font-bold text-[var(--text-primary)] text-xs mb-0.5">{c.author.profile?.fullName || 'Người dùng'}</p>
                      <p className="whitespace-pre-wrap break-all leading-normal text-xs">
                        <CommentTextWithMentions text={c.content} />
                      </p>
                      {currentReaction && (
                        <span className="absolute -bottom-1.5 -right-1.5 flex items-center bg-white dark:bg-slate-700 border border-[var(--border-subtle)] rounded-full px-1.5 py-0.5 shadow-sm text-[10px] scale-90 z-20">
                          {currentReaction === 'like' && '👍'}
                          {currentReaction === 'love' && '❤️'}
                          {currentReaction === 'haha' && '😂'}
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] mt-1 ml-2">
                      <span className="flex items-center gap-0.5"><Clock size={9} />{formatDate(c.createdAt)}</span>
                      <div className="relative group inline-block">
                        <button
                          type="button"
                          onClick={() => handleReactionSelect(c.id, currentReaction ? null : 'like')}
                          className={`hover:text-[var(--gold)] transition-colors font-bold flex items-center gap-0.5 ${
                            currentReaction === 'like' ? 'text-blue-500 font-bold' :
                            currentReaction === 'love' ? 'text-rose-500 font-extrabold' :
                            currentReaction === 'haha' ? 'text-amber-500 font-extrabold' : ''
                          }`}
                        >
                          {currentReaction === 'like' ? 'Thích' :
                           currentReaction === 'love' ? 'Yêu thích' :
                           currentReaction === 'haha' ? 'Haha' : 'Thích'}
                        </button>
                        
                        {/* Hover Reactions Panel with transparent bridge to prevent hover loss */}
                        <div className="absolute bottom-full left-0 pb-2 hidden group-hover:flex z-30 animate-fade-in">
                          <div className="flex items-center gap-2.5 bg-white dark:bg-slate-800 border border-[var(--border-subtle)] rounded-full px-3 py-2 shadow-xl whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleReactionSelect(c.id, 'like')}
                              className="hover:scale-125 transition-transform duration-100 text-base"
                              title="Thích"
                            >
                              👍
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReactionSelect(c.id, 'love')}
                              className="hover:scale-125 transition-transform duration-100 text-base"
                              title="Yêu thích"
                            >
                              ❤️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReactionSelect(c.id, 'haha')}
                              className="hover:scale-125 transition-transform duration-100 text-base"
                              title="Haha"
                            >
                              😂
                            </button>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isAuthenticated) {
                            showToast('Bạn cần đăng nhập để phản hồi bình luận!');
                            return;
                          }
                          setActiveReplyId(activeReplyId === c.id ? null : c.id);
                          setReplyText('');
                        }}
                        className="hover:text-[var(--gold)] transition-colors font-bold flex items-center gap-0.5"
                      >
                        <Reply size={9} /> Trả lời
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-Replies (Level 2 Comments) */}
                <div className="pl-10 space-y-3 relative">
                  {/* Vertical thread connector line */}
                  {((c.replies && c.replies.length > 0) || (activeReplyId === c.id && isAuthenticated)) && (
                    <div className="absolute left-[15px] top-[-8px] bottom-[20px] w-[1.5px] bg-[var(--border-subtle)]" />
                  )}

                  {c.replies && c.replies.map(reply => {
                    const replyReaction = likedComments[reply.id] || null;
                    return (
                      <div key={reply.id} className="flex gap-2 items-start animate-fade-in relative z-10">
                        {/* Horizontal branch line from vertical thread to child avatar */}
                        <div className="absolute left-[-25px] top-[14px] w-[20px] h-[1.5px] bg-[var(--border-subtle)]" />
                        
                        <Link to={`/profile/${reply.author.id}`} className="block hover:scale-105 transition-transform cursor-pointer flex-shrink-0">
                          <img src={reply.author.profile?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} alt="" className="w-7 h-7 rounded-full object-cover border border-[var(--border-subtle)]" />
                        </Link>
                        <div className="flex-1">
                          <div className="relative bg-[var(--bg-elevated)] rounded-2xl rounded-tl-sm px-3.5 py-1.5 text-sm text-[var(--text-secondary)] inline-block max-w-[90%] hover:brightness-105 transition-all">
                            <p className="font-bold text-[var(--text-primary)] text-[11px] mb-0.5">{reply.author.profile?.fullName || 'Người dùng'}</p>
                            <p className="whitespace-pre-wrap break-all leading-normal text-xs">
                              <CommentTextWithMentions text={reply.content} />
                            </p>
                            {replyReaction && (
                              <span className="absolute -bottom-1.5 -right-1.5 flex items-center bg-white dark:bg-slate-700 border border-[var(--border-subtle)] rounded-full px-1.5 py-0.5 shadow-sm text-[9px] scale-90 z-20">
                                {replyReaction === 'like' && '👍'}
                                {replyReaction === 'love' && '❤️'}
                                {replyReaction === 'haha' && '😂'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] mt-0.5 ml-2">
                            <span className="flex items-center gap-0.5"><Clock size={8} />{formatDate(reply.createdAt)}</span>
                            <div className="relative group inline-block">
                              <button
                                type="button"
                                onClick={() => handleReactionSelect(reply.id, replyReaction ? null : 'like')}
                                className={`hover:text-[var(--gold)] transition-colors font-bold flex items-center gap-0.5 ${
                                  replyReaction === 'like' ? 'text-blue-500 font-bold' :
                                  replyReaction === 'love' ? 'text-rose-500 font-extrabold' :
                                  replyReaction === 'haha' ? 'text-amber-500 font-extrabold' : ''
                                }`}
                              >
                                {replyReaction === 'like' ? 'Thích' :
                                 replyReaction === 'love' ? 'Yêu thích' :
                                 replyReaction === 'haha' ? 'Haha' : 'Thích'}
                              </button>
                              
                              {/* Hover Reactions Panel with transparent bridge to prevent hover loss */}
                              <div className="absolute bottom-full left-0 pb-2 hidden group-hover:flex z-30 animate-fade-in">
                                <div className="flex items-center gap-2.5 bg-white dark:bg-slate-800 border border-[var(--border-subtle)] rounded-full px-3 py-2 shadow-xl whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => handleReactionSelect(reply.id, 'like')}
                                    className="hover:scale-125 transition-transform duration-100 text-base"
                                    title="Thích"
                                  >
                                    👍
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReactionSelect(reply.id, 'love')}
                                    className="hover:scale-125 transition-transform duration-100 text-base"
                                    title="Yêu thích"
                                  >
                                    ❤️
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReactionSelect(reply.id, 'haha')}
                                    className="hover:scale-125 transition-transform duration-100 text-base"
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
                  })}

                  {/* Reply Input Box (Visible when replying to this comment) */}
                  {activeReplyId === c.id && isAuthenticated && (
                    <div className="flex gap-2 items-center mt-2 animate-slide-down relative z-10">
                      {/* Horizontal branch line for reply box */}
                      <div className="absolute left-[-25px] top-[14px] w-[20px] h-[1.5px] bg-[var(--border-subtle)]" />
                      
                      <img src={user?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} alt="" className="w-7 h-7 rounded-full object-cover border border-[var(--border-subtle)] flex-shrink-0" />
                      <div className="flex-1 flex items-center bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus-within:border-[var(--gold)] rounded-2xl px-3 transition-colors">
                        <input
                          type="text"
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder={`Phản hồi ${c.author.profile?.fullName || 'bình luận'}...`}
                          className="flex-1 bg-transparent py-1.5 text-xs text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-muted)]"
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddReply(c.id);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddReply(c.id)}
                          disabled={!replyText.trim()}
                          className={`p-1 transition-colors ${replyText.trim() ? 'text-[var(--gold)]' : 'text-[var(--text-muted)]'}`}
                        >
                          <Send size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
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
