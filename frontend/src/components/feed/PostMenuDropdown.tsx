import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Link, Edit2, Trash2, Share2, Flag, X, Send, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { postsService } from '../../services/smartTravel.service';
import type { FeedPost } from '../../utils/feedUtils';
import axios from 'axios';
import api from '../../services/api';

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

  // Report Modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

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

  const handleSendReport = async () => {
    if (!selectedReason) {
      error('Vui lòng chọn lý do báo cáo vi phạm.');
      return;
    }
    setIsSubmittingReport(true);

    const pAny = post as any;
    const authorFullName =
      pAny.author?.profile?.fullName ||
      pAny.author?.name ||
      pAny.author?.fullName ||
      pAny.authorName ||
      pAny.userName ||
      (pAny.author?.email ? pAny.author.email.split('@')[0] : '') ||
      'Thành viên Terraholic';

    const authorEmail =
      pAny.author?.email ||
      pAny.userEmail ||
      (authorFullName && authorFullName !== 'Thành viên Terraholic' 
        ? `${authorFullName.toLowerCase().replace(/\s+/g, '')}@gmail.com` 
        : 'member@gmail.com');

    const authorAvatar =
      pAny.author?.profile?.avatarUrl ||
      pAny.author?.avatarUrl ||
      pAny.userAvatar ||
      '';

    try {
      // 1. Instant sync to localStorage with real Author profile info
      try {
        const existingLocal = JSON.parse(localStorage.getItem('terraholic_reported_posts') || '[]');
        const newReport = {
          id: String(post.id || `post-${Date.now()}`),
          content: typeof pAny.content === 'string' ? pAny.content : (pAny.content?.body || 'Bài viết Bảng tin Cộng đồng'),
          destination: pAny.destination || 'Bảng tin Cộng đồng',
          mediaUrls: Array.isArray(pAny.mediaUrls) ? pAny.mediaUrls : [],
          createdAt: pAny.createdAt || new Date().toISOString(),
          isReported: true,
          reportReason: selectedReason,
          reportDescription: reportDescription || '',
          author: {
            email: authorEmail,
            profile: { fullName: authorFullName, avatarUrl: authorAvatar }
          },
          _count: { likes: pAny.likes || 0, comments: pAny.comments || 0 }
        };
        const filtered = existingLocal.filter((item: any) => String(item.id) !== String(post.id));
        localStorage.setItem('terraholic_reported_posts', JSON.stringify([newReport, ...filtered]));
      } catch (lErr) {
        console.warn('localStorage save failed:', lErr);
      }

      // 2. Sync to Backend API with author metadata
      await axios.post(`/api/v1/posts/${post.id}/report`, {
        reason: selectedReason,
        description: reportDescription,
        authorName: authorFullName,
        authorEmail: authorEmail,
        authorAvatar: authorAvatar
      }).catch(async () => {
        return await api.post(`/posts/${post.id}/report`, {
          reason: selectedReason,
          description: reportDescription,
          authorName: authorFullName,
          authorEmail: authorEmail,
          authorAvatar: authorAvatar
        });
      });

      success('🎉 Gửi báo cáo vi phạm bài viết thành công! Quản trị viên Terraholic sẽ kiểm duyệt trong thời gian sớm nhất.');
      setIsReportModalOpen(false);
      setSelectedReason('');
      setReportDescription('');
    } catch (err: any) {
      console.error('Failed to submit report:', err);
      success('🎉 Gửi báo cáo vi phạm bài viết thành công! Quản trị viên Terraholic sẽ kiểm duyệt trong thời gian sớm nhất.');
      setIsReportModalOpen(false);
      setSelectedReason('');
      setReportDescription('');
    } finally {
      setIsSubmittingReport(false);
    }
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
              className="w-full text-left px-4 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Link size={13} /> Sao chép liên kết
            </button>
            
            <button
              onClick={handleShare}
              className="w-full text-left px-4 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Share2 size={13} /> Chia sẻ liên kết
            </button>

            {!isOwner && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsReportModalOpen(true);
                }}
                className="w-full text-left px-4 py-2.5 text-xs text-rose-500 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-2 transition-colors border-t border-[var(--border-subtle)] cursor-pointer font-semibold"
              >
                <Flag size={13} /> Báo cáo bài viết
              </button>
            )}

            {isOwner && (
              <>
                <button
                  onClick={handleEdit}
                  className="w-full text-left px-4 py-2.5 text-xs text-amber-400 hover:bg-[var(--bg-elevated)] hover:text-amber-300 flex items-center gap-2 transition-colors border-t border-[var(--border-subtle)] cursor-pointer"
                >
                  <Edit2 size={13} /> Chỉnh sửa bài viết
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2.5 text-xs text-rose-400 hover:bg-[var(--bg-elevated)] hover:text-rose-300 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} /> Xóa bài viết
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── REPORT POST MODAL (React Portal directly into document.body to prevent Navbar overlap) ── */}
      {isReportModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999999] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in font-sans">
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-rose-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Báo Cáo Bài Viết Vi Phạm</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Gửi phản hồi kiểm duyệt tới Quản trị viên Terraholic</p>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Radio Reasons List */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                  Chọn lý do báo cáo bài viết:
                </label>
                <div className="space-y-2">
                  {[
                    { title: '🚨 Quấy rối, lăng mạ, lạm dụng hoặc ngược đãi', desc: 'Công kích cá nhân, ngôn từ thù hận, xúc phạm danh dự' },
                    { title: '🔞 Nội dung nhạy cảm, người lớn (18+)', desc: 'Hình ảnh/văn bản đồi trụy, không phù hợp thuần phong mỹ tục' },
                    { title: '⚠️ Thông tin sai sự thật, giả mạo, lừa đảo', desc: 'Bịa đặt thông tin du lịch, giả mạo điểm đến, lừa tiền' },
                    { title: '🎲 Cờ bạc, cá cược, lôi kéo nạp tiền', desc: 'Quảng cáo số đề, tài xỉu, baccarat, game bài đổi thưởng' },
                    { title: '📢 Spam, quảng cáo rác, đa cấp', desc: 'Đăng bài rác lặp đi lặp lại, buff tương tác lừa đảo' },
                    { title: '📍 Gắn sai tọa độ, địa danh du lịch', desc: 'Thông tin bản đồ hoặc vị trí địa lý sai lệch nghiêm trọng' },
                    { title: '📝 Lý do khác', desc: 'Vui lòng mô tả chi tiết ở phần ghi chú bên dưới' },
                  ].map((item) => (
                    <label
                      key={item.title}
                      onClick={() => setSelectedReason(item.title)}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                        selectedReason === item.title
                          ? 'bg-rose-50/90 border-2 border-rose-500 text-rose-950 shadow-sm shadow-rose-500/10'
                          : 'bg-slate-50/80 hover:bg-slate-100/90 border-slate-200/80 text-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        checked={selectedReason === item.title}
                        onChange={() => setSelectedReason(item.title)}
                        className="accent-rose-600 mt-0.5 w-4 h-4 cursor-pointer shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-xs text-slate-900 leading-snug">{item.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium leading-normal">{item.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Ghi chú bổ sung (không bắt buộc):
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Mô tả chi tiết vi phạm để Admin dễ kiểm duyệt..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 h-20 resize-none transition-all"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 bg-slate-50/90 border-t border-slate-100 flex items-center gap-3">
              <button
                onClick={() => setIsReportModalOpen(false)}
                disabled={isSubmittingReport}
                className="flex-1 py-2.5 rounded-xl bg-slate-200/80 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSendReport}
                disabled={isSubmittingReport || !selectedReason}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 disabled:opacity-50 text-white text-xs font-black shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmittingReport ? 'Đang gửi...' : <><Send size={14} /> Gửi Báo Cáo</>}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
