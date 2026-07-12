import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react';
import FeedCommentsPreview from './FeedCommentsPreview';

interface PostEngagementBlockProps {
  postId: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  saved: boolean;
  onLike: (e: React.MouseEvent) => void;
  onBookmark: (e: React.MouseEvent) => void;
  onOpenDetail: () => void;
  onOpenLikers?: () => void;
}

/** Hàng thống kê + preview bình luận + thanh Thích / Bình luận / Lưu (đồng bộ cấu trúc feed) */
export default function PostEngagementBlock({
  postId,
  likeCount,
  commentCount,
  liked,
  saved,
  onLike,
  onBookmark,
  onOpenDetail,
  onOpenLikers,
}: PostEngagementBlockProps) {
  return (
    <>
      <div className="flex items-center justify-between p-3 px-4 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] rounded-b-2xl">
        {/* Left: Like button & count */}
        <div className="flex items-center gap-2 group/like">
          <button
            type="button"
            onClick={onLike}
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
              liked ? 'bg-rose-500 hover:bg-rose-600 scale-105' : 'bg-rose-500/10 hover:bg-rose-500/20 hover:scale-105'
            }`}
            title={liked ? 'Bỏ thích' : 'Thích'}
          >
            <Heart size={10} className={liked ? 'text-white fill-white' : 'text-rose-500'} />
          </button>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              if (likeCount > 0) onOpenLikers?.();
            }}
            className={`font-semibold transition-colors hover:underline ${
              liked ? 'text-rose-600' : 'text-slate-600 dark:text-slate-400 hover:text-rose-500'
            }`}
            disabled={likeCount === 0}
          >
            {likeCount.toLocaleString()} lượt thích
          </button>
        </div>

        {/* Right: Comment, Save, Share */}
        <div className="flex items-center gap-4 sm:gap-5">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onOpenDetail(); }}
            className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors group/comment"
          >
            <MessageCircle size={14} className="text-blue-500 transition-colors" />
            <span>{commentCount} bình luận</span>
          </button>

          <button
            type="button"
            onClick={onBookmark}
            className={`flex items-center gap-1.5 font-semibold transition-colors group/save ${
              saved ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
            }`}
          >
            <Bookmark size={14} className={`text-amber-500 ${saved ? 'fill-current' : ''} transition-colors`} />
            <span>{saved ? 'Đã lưu' : 'Lưu'}</span>
          </button>

          <button
            type="button"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors group/share"
          >
            <Share2 size={14} className="text-emerald-500 transition-colors" />
            <span>Chia sẻ</span>
          </button>
        </div>
      </div>

      <FeedCommentsPreview postId={postId} onOpenDetail={onOpenDetail} />
    </>
  );
}
