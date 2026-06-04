import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Link, Edit2, Trash2, Share2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { postsService } from '../../services/smartTravel.service';

interface PostMenuDropdownProps {
  postId: string;
  postAuthorId: string;
  postContent: string;
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (postId: string, newContent: string) => void;
}

export default function PostMenuDropdown({
  postId,
  postAuthorId,
  postContent,
  onPostDeleted,
  onPostUpdated,
}: PostMenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(postContent);
  const [toastMessage, setToastMessage] = useState('');
  
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isOwner = isAuthenticated && user && user.id === postAuthorId;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleCopyLink = async () => {
    try {
      const link = `${window.location.origin}/posts/${postId}`;
      await navigator.clipboard.writeText(link);
      showToast('Đã sao chép liên kết vào bộ nhớ tạm!');
    } catch (err) {
      showToast('Không thể sao chép liên kết.');
    }
    setIsOpen(false);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/posts/${postId}`;
    const shareData = {
      title: 'Khám phá bài viết trên SmartTravel',
      text: postContent.slice(0, 100),
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          showToast('Chia sẻ thất bại.');
        }
      }
    } else {
      // Fallback: Open Facebook share dialog in new tab
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
      window.open(fbUrl, '_blank');
    }
    setIsOpen(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;
    try {
      await postsService.delete(postId);
      showToast('Đã xóa bài viết thành công.');
      if (onPostDeleted) onPostDeleted(postId);
    } catch (err) {
      showToast('Xóa bài viết thất bại.');
    }
    setIsOpen(false);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    try {
      await postsService.updatePost(postId, { content: editContent });
      showToast('Đã chỉnh sửa bài viết!');
      setIsEditing(false);
      if (onPostUpdated) onPostUpdated(postId, editContent);
    } catch (err) {
      showToast('Chỉnh sửa thất bại.');
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-black/90 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-[var(--gold)]/30 shadow-lg shadow-black/50 animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* 3 dots icon in circle container */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-[var(--border-subtle)] hover:border-[var(--gold)]/40 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
        type="button"
      >
        <MoreHorizontal size={15} />
      </button>

      {/* Dropdown Options */}
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
                  onClick={() => {
                    setIsEditing(true);
                    setIsOpen(false);
                  }}
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

      {/* Editing Dialog Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center">
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Chỉnh sửa bài đăng</h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Hủy
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="p-4 space-y-4">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={5}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--gold)] rounded-xl p-3 text-sm text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-muted)] resize-none"
                placeholder="Nhập nội dung chỉnh sửa..."
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)]"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={!editContent.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[var(--gold)] to-amber-500 text-black hover:shadow-lg hover:shadow-amber-500/25 transition-all"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
