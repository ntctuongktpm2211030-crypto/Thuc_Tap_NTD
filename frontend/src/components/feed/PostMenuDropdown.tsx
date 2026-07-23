import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Link, Edit2, Trash2, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { postsService } from '../../services/smartTravel.service';
import type { FeedPost } from '../../utils/feedUtils';

import { useToast } from '../../contexts/ToastContext';

interface PostMenuDropdownProps {
  post: FeedPost;
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (updatedPost: any) => void;
}

export default function PostMenuDropdown({
  post,
  onPostDeleted,
}: PostMenuDropdownProps) {
  const navigate = useNavigate();
  const { confirm, success, error } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const isOwner = isAuthenticated && user && (user.id === (post as any).authorId || user.id === (post as any).userId || user.email === (post as any).userEmail);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/?postId=${post.id}`;
    navigator.clipboard.writeText(shareUrl);
    success('Đã sao chép liên kết bài viết.');
    setIsOpen(false);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?postId=${post.id}`;
    const pAny = post as any;
    const shareData = {
      title: pAny.title || 'Bài viết từ Smart Travel',
      text: pAny.content ? String(pAny.content).substring(0, 100) : '',
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          error('Chia sẻ thất bại.');
        }
      }
    } else {
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
      window.open(fbUrl, '_blank');
    }
    setIsOpen(false);
  };

  const handleDelete = () => {
    setIsOpen(false);
    confirm({
      title: 'Xóa bài viết',
      message: 'Bạn có chắc chắn muốn xóa bài viết này không? Hành động này sẽ không thể hoàn tác.',
      confirmText: 'Xóa bài viết',
      cancelText: 'Hủy',
      type: 'danger',
      onConfirm: async () => {
        try {
          await postsService.delete(post.id);
          success('Đã xóa bài viết thành công.');
          if (onPostDeleted) onPostDeleted(post.id);
        } catch {
          error('Xóa bài viết thất bại.');
        }
      },
    });
  };

  const handleEdit = () => {
    setIsOpen(false);
    navigate(`/posts/${post.id}/edit`);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-[var(--border-subtle)] hover:border-[var(--gold)]/40 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
        type="button"
      >
        <MoreHorizontal size={15} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-xl z-20 overflow-hidden animate-slide-down">
          <div className="py-1">
            <button
              onClick={handleCopyLink}
              className="w-full text-left px-4 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] flex items-center gap-2 transition-colors"
            >
              <Link size={13} /> Sao chép liên kết
            </button>
            <button
              onClick={handleShare}
              className="w-full text-left px-4 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] flex items-center gap-2 transition-colors"
            >
              <Share2 size={13} /> Chia sẻ liên kết
            </button>
            {isOwner && (
              <>
                <button
                  onClick={handleEdit}
                  className="w-full text-left px-4 py-2.5 text-xs text-amber-400 hover:bg-[var(--bg-elevated)] hover:text-amber-300 flex items-center gap-2 transition-colors border-t border-[var(--border-subtle)]"
                >
                  <Edit2 size={13} /> Chỉnh sửa bài viết
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2.5 text-xs text-rose-400 hover:bg-[var(--bg-elevated)] hover:text-rose-300 flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={13} /> Xóa bài viết
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
