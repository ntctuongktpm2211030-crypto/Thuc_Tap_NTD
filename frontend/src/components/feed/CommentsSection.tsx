import { useState, useEffect } from 'react';
import { postsService, Comment } from '../../services/smartTravel.service';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Send, Reply, Clock, MessageCircle } from 'lucide-react';


interface CommentsSectionProps {
  postId: string;
  onCommentCountChange?: (count: number) => void;
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
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const loadComments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await postsService.getComments(postId);
      setComments(data);
      
      // Calculate total comments count (top-level + replies)
      let totalCount = data.length;
      data.forEach(c => {
        if (c.replies) totalCount += c.replies.length;
      });
      if (onCommentCountChange) onCommentCountChange(totalCount);
    } catch (err) {
      console.error(err);
      setError('Không tải được bình luận.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadComments();
  }, [postId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    if (!newCommentText.trim()) return;

    try {
      const newComment = await postsService.addComment(postId, newCommentText);
      // Backend returns the comment, we insert it at the top of comments
      setComments(prev => [
        { ...newComment, replies: [] },
        ...prev
      ]);
      setNewCommentText('');
      
      // Recalculate total count
      let totalCount = comments.length + 1;
      comments.forEach(c => {
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

    try {
      const newReply = await postsService.addComment(postId, replyText, parentId);
      
      // Update comments list in state by appending the reply to parent
      setComments(prev => prev.map(c => {
        if (c.id === parentId) {
          return {
            ...c,
            replies: [...(c.replies || []), newReply]
          };
        }
        return c;
      }));
      
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

  const toggleLikeComment = (commentId: string) => {
    if (!isAuthenticated) {
      showToast('Bạn cần đăng nhập để thích bình luận!');
      return;
    }
    setLikedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
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
        <form onSubmit={handleAddComment} className="flex gap-2 items-start mt-2">
          <img src={user?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} alt="" className="w-8 h-8 rounded-full object-cover border border-[var(--border-subtle)] flex-shrink-0" />
          <div className="flex-1 flex items-center bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus-within:border-[var(--gold)] rounded-2xl px-3 transition-colors">
            <input
              type="text"
              value={newCommentText}
              onChange={e => setNewCommentText(e.target.value)}
              placeholder="Viết bình luận công khai..."
              className="flex-1 bg-transparent py-2 text-sm text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-muted)]"
            />
            <button type="submit" disabled={!newCommentText.trim()} className={`p-1.5 transition-colors ${newCommentText.trim() ? 'text-[var(--gold)]' : 'text-[var(--text-muted)]'}`}>
              <Send size={14} />
            </button>
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
            const isLiked = likedComments[c.id] || false;
            return (
              <div key={c.id} className="space-y-2 group/comment relative">
                {/* Main Parent Comment */}
                <div className="flex gap-2 items-start relative z-10">
                  <img src={c.author.profile?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} alt="" className="w-8 h-8 rounded-full object-cover border border-[var(--border-subtle)] flex-shrink-0" />
                  <div className="flex-1">
                    <div className="bg-[var(--bg-elevated)] rounded-2xl rounded-tl-sm px-3.5 py-2 text-sm text-[var(--text-secondary)] inline-block max-w-[90%] hover:brightness-105 transition-all">
                      <p className="font-bold text-[var(--text-primary)] text-xs mb-0.5">{c.author.profile?.fullName || 'Người dùng'}</p>
                      <p className="whitespace-pre-wrap break-all leading-normal text-xs">{c.content}</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] mt-1 ml-2">
                      <span className="flex items-center gap-0.5"><Clock size={9} />{formatDate(c.createdAt)}</span>
                      <button
                        type="button"
                        onClick={() => toggleLikeComment(c.id)}
                        className={`hover:text-[var(--gold)] transition-colors font-bold ${isLiked ? 'text-[var(--gold)]' : ''}`}
                      >
                        Thích
                      </button>
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
                    const isReplyLiked = likedComments[reply.id] || false;
                    return (
                      <div key={reply.id} className="flex gap-2 items-start animate-fade-in relative z-10">
                        {/* Horizontal branch line from vertical thread to child avatar */}
                        <div className="absolute left-[-25px] top-[14px] w-[20px] h-[1.5px] bg-[var(--border-subtle)]" />
                        
                        <img src={reply.author.profile?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} alt="" className="w-7 h-7 rounded-full object-cover border border-[var(--border-subtle)] flex-shrink-0" />
                        <div className="flex-1">
                          <div className="bg-[var(--bg-elevated)] rounded-2xl rounded-tl-sm px-3.5 py-1.5 text-sm text-[var(--text-secondary)] inline-block max-w-[90%] hover:brightness-105 transition-all">
                            <p className="font-bold text-[var(--text-primary)] text-[11px] mb-0.5">{reply.author.profile?.fullName || 'Người dùng'}</p>
                            <p className="whitespace-pre-wrap break-all leading-normal text-xs">{reply.content}</p>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] mt-0.5 ml-2">
                            <span className="flex items-center gap-0.5"><Clock size={8} />{formatDate(reply.createdAt)}</span>
                            <button
                              type="button"
                              onClick={() => toggleLikeComment(reply.id)}
                              className={`hover:text-[var(--gold)] transition-colors font-bold ${isReplyLiked ? 'text-[var(--gold)]' : ''}`}
                            >
                              Thích
                            </button>
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
