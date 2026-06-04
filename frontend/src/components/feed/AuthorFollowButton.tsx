import { useState } from 'react';
import { socialService } from '../../services/smartTravel.service';

interface Props {
  authorId?: string;
  currentUserId?: string;
  isFollowing: boolean;
  onFollowChange: (authorId: string, following: boolean) => void;
  requireAuth: (returnPath: string) => boolean;
}

/** Nút Theo dõi kiểu Instagram — chỉ hiện khi chưa theo dõi và không phải bài của mình */
export default function AuthorFollowButton({
  authorId,
  currentUserId,
  isFollowing,
  onFollowChange,
  requireAuth,
}: Props) {
  const [loading, setLoading] = useState(false);

  if (!authorId || !currentUserId || authorId === currentUserId || isFollowing) {
    return null;
  }

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth('/')) return;
    setLoading(true);
    try {
      const res = await socialService.toggleFollow(authorId);
      onFollowChange(authorId, res.following);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleFollow}
      disabled={loading}
      className="text-[11px] font-bold text-sky-500 hover:text-sky-400 transition-colors disabled:opacity-50 flex-shrink-0"
    >
      {loading ? '…' : 'Theo dõi'}
    </button>
  );
}
