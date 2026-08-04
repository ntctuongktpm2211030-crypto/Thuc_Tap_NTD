import { useEffect, useMemo, useState } from 'react';
import { postsService, Comment } from '../../services/smartTravel.service';
import { toApiPostId } from '../../utils/postIds';

interface Props {
  postId: string;
  onOpenDetail: () => void;
  onCommentCountLoaded?: (count: number) => void;
}

function commentAuthorName(c: Comment): string {
  if (c.author?.profile?.fullName) return c.author.profile.fullName;
  if ((c.author as any)?.name) return (c.author as any).name;
  return 'Người dùng Terraholic';
}

function commentAuthorAvatar(c: Comment): string | undefined {
  return c.author?.profile?.avatarUrl || (c.author as any)?.avatar;
}

/** Hiển thị 1 bình luận mới nhất trên feed — chuẩn phong cách Facebook */
export default function FeedCommentsPreview({ postId, onOpenDetail, onCommentCountLoaded }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Load local comments fallback from localStorage
    let localList: Comment[] = [];
    try {
      const localRaw = localStorage.getItem(`terraholic_comments_${postId}`);
      if (localRaw) localList = JSON.parse(localRaw);
    } catch {
      // ignore
    }

    const apiId = toApiPostId(postId);
    if (!apiId) {
      if (!cancelled) {
        setComments(localList);
        setLoaded(true);
        if (onCommentCountLoaded) onCommentCountLoaded(localList.length);
      }
      return;
    }

    postsService
      .getComments(apiId)
      .then(data => {
        if (!cancelled) {
          const map = new Map<string, Comment>();
          (data || []).forEach(c => map.set(c.id, c));
          localList.forEach(c => map.set(c.id, c));
          const merged = Array.from(map.values());
          setComments(merged);
          setLoaded(true);
          if (onCommentCountLoaded) onCommentCountLoaded(merged.length);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setComments(localList);
          setLoaded(true);
          if (onCommentCountLoaded && localList.length > 0) {
            onCommentCountLoaded(localList.length);
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [postId, onCommentCountLoaded]);

  // Lay 1 binh luan moi nhat (Facebook style single comment preview)
  const newestComment = useMemo(() => {
    if (!comments || comments.length === 0) return null;
    const sorted = [...comments].sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tB - tA;
    });
    return sorted[0];
  }, [comments]);

  if (!loaded || !newestComment) return null;

  const authorName = commentAuthorName(newestComment);
  const avatar = commentAuthorAvatar(newestComment);

  return (
    <div className="feed-comments-preview w-full px-4 pb-3 pt-1" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={onOpenDetail}
        className="feed-comment-bubble w-full text-left flex items-start gap-2.5 group/bubble cursor-pointer border-0 bg-transparent p-0"
      >
        {/* Avatar */}
        {avatar ? (
          <img
            src={avatar}
            alt={authorName}
            className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            {authorName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Facebook-style Comment Bubble */}
        <div className="bg-slate-100 dark:bg-slate-800/80 group-hover/bubble:bg-slate-200/80 dark:group-hover/bubble:bg-slate-800 px-3.5 py-2 rounded-2xl text-xs max-w-[90%] transition-colors">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-bold text-slate-900 dark:text-slate-100 group-hover/bubble:text-blue-600 dark:group-hover/bubble:text-blue-400 transition-colors">
              {authorName}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">· Bình luận mới nhất</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 font-normal leading-relaxed break-words">
            {newestComment.content}
          </p>
        </div>
      </button>
    </div>
  );
}
