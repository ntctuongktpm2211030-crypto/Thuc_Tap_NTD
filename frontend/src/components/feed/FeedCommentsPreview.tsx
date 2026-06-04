import { useEffect, useState } from 'react';
import { postsService, Comment } from '../../services/smartTravel.service';
import { toApiPostId } from '../../utils/postIds';

const PREVIEW_LIMIT = 2;

interface Props {
  postId: string;
  onOpenDetail: () => void;
}

function commentAuthorName(c: Comment): string {
  return c.author.profile?.fullName || 'Người dùng';
}

/** Tối đa 2 bình luận trên feed — bố cục bubble kiểu Facebook, không có dòng "Xem tất cả" */
export default function FeedCommentsPreview({ postId, onOpenDetail }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const apiId = toApiPostId(postId);
    if (!apiId) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    postsService
      .getComments(apiId)
      .then(data => {
        if (!cancelled) {
          setComments(data);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const preview = comments.slice(0, PREVIEW_LIMIT);
  if (!loaded || preview.length === 0) return null;

  return (
    <div className="feed-comments-preview" onClick={e => e.stopPropagation()}>
      {preview.map(c => (
        <button
          key={c.id}
          type="button"
          onClick={onOpenDetail}
          className="feed-comment-bubble w-full text-left"
        >
          <p className="feed-comment-bubble__text">
            <span className="feed-comment-bubble__author">{commentAuthorName(c)}</span>
            {' '}
            <span className="feed-comment-bubble__body">{c.content}</span>
          </p>
        </button>
      ))}
    </div>
  );
}
