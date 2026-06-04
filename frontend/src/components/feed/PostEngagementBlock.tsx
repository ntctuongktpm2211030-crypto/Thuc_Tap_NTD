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
      <div className="post-engagement-stats">
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            if (likeCount > 0) onOpenLikers?.();
          }}
          className="post-engagement-stats__likes"
        >
          <span className="post-engagement-stats__like-icon" aria-hidden>
            <Heart size={9} className="text-white fill-white" />
          </span>
          <span>{likeCount.toLocaleString()} lượt thích</span>
        </button>
        <button type="button" onClick={e => { e.stopPropagation(); onOpenDetail(); }} className="post-engagement-stats__comments">
          {commentCount} bình luận
        </button>
      </div>

      <FeedCommentsPreview postId={postId} onOpenDetail={onOpenDetail} />

      <div className="reaction-bar">
        <button type="button" onClick={onLike} className={`reaction-btn flex-1 justify-center gap-2 ${liked ? 'liked' : ''}`}>
          <Heart size={15} className={liked ? 'fill-current' : ''} />
          <span className="text-xs">{liked ? 'Đã thích' : 'Thích'}</span>
        </button>
        <button type="button" onClick={e => { e.stopPropagation(); onOpenDetail(); }} className="reaction-btn flex-1 justify-center gap-2">
          <MessageCircle size={15} />
          <span className="text-xs">Bình luận</span>
        </button>
        <button type="button" onClick={onBookmark} className={`reaction-btn flex-1 justify-center gap-2 ${saved ? 'bookmarked' : ''}`}>
          <Bookmark size={15} className={saved ? 'fill-current' : ''} />
          <span className="text-xs">{saved ? 'Đã lưu' : 'Lưu'}</span>
        </button>
        <button type="button" className="reaction-btn justify-center gap-2 px-3" onClick={e => e.stopPropagation()}>
          <Share2 size={15} />
        </button>
      </div>
    </>
  );
}
