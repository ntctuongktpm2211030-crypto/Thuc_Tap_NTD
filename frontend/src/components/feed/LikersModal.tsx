import { useEffect, useState } from 'react';
import { X, Heart } from 'lucide-react';
import { postsService } from '../../services/smartTravel.service';

export interface Liker {
  id: string;
  name: string;
  avatar?: string;
}

interface Props {
  postId: string | null;
  likeCount: number;
  onClose: () => void;
}

export async function fetchPostLikers(postId: string): Promise<Liker[]> {
  const data = await postsService.get(postId);
  if (!data.likes?.length) return [];
  return data.likes.map((l: {
    user: {
      id: string;
      email: string;
      profile?: { fullName?: string; avatarUrl?: string | null } | null;
    };
  }) => ({
    id: l.user.id,
    name: l.user.profile?.fullName || l.user.email.split('@')[0],
    avatar: l.user.profile?.avatarUrl || undefined,
  }));
}

export default function LikersModal({ postId, likeCount, onClose }: Props) {
  const [likers, setLikers] = useState<Liker[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    setLikers([]);
    fetchPostLikers(postId)
      .then(setLikers)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    if (!postId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [postId, onClose]);

  if (!postId) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Danh sách lượt thích"
        className="w-full sm:max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Heart size={16} className="text-rose-500 fill-rose-500" />
            Lượt thích
            <span className="text-[var(--text-muted)] font-semibold">({likeCount.toLocaleString()})</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-colors"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {loading && (
            <p className="text-center text-sm text-[var(--text-muted)] py-8">Đang tải…</p>
          )}
          {!loading && likers.length === 0 && (
            <p className="text-center text-sm text-[var(--text-muted)] py-8">Chưa có lượt thích nào</p>
          )}
          {!loading &&
            likers.map(liker => (
              <div
                key={liker.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors"
              >
                {liker.avatar ? (
                  <img src={liker.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gold)] to-violet-500 flex items-center justify-center font-bold text-white text-sm">
                    {liker.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-semibold text-[var(--text-primary)]">{liker.name}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
