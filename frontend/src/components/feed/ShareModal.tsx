import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check, Share2, Globe, Smartphone } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: string;
  postUrl?: string;
  title?: string;
  description?: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  postId,
  postUrl,
  title = 'Bài viết từ Terraholic',
  description = 'Khám phá hành trình du lịch tuyệt đẹp trên Terraholic!',
}: ShareModalProps) {
  const { success } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const targetUrl = postUrl || `${window.location.origin}/?postId=${postId || ''}`;
  const encodedUrl = encodeURIComponent(targetUrl);

  // Direct Share Links
  const zaloShareUrl = `https://zalo.me/share?url=${encodedUrl}`;
  const messengerShareUrl = `https://www.facebook.com/dialog/send?link=${encodedUrl}&redirect_uri=${encodeURIComponent(window.location.origin)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  const handleZaloShare = () => {
    try {
      navigator.clipboard.writeText(`${title}\n${targetUrl}`);
      success('Đang mở Zalo... Liên kết bài viết đã được sao chép sẵn vào bộ nhớ tạm!');
    } catch {
      // fallback
    }
    window.open(zaloShareUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    success('Đã sao chép liên kết bài viết vào bộ nhớ tạm!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: targetUrl,
        });
        onClose();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Native share error:', err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[9999999] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-6 animate-scale-up text-slate-900 dark:text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
              <Share2 size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white leading-tight">
                CHIA SẺ BÀI VIẾT
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Lan tỏa câu chuyện hành trình đến bạn bè
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Đóng"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* Share Buttons Grid */}
        <div className="grid grid-cols-4 gap-3 text-center py-2 border-y border-slate-100 dark:border-slate-800/80">
          {/* Zalo */}
          <button
            type="button"
            onClick={handleZaloShare}
            className="flex flex-col items-center gap-2.5 group cursor-pointer border-0 bg-transparent py-2"
          >
            <div className="w-14 h-14 rounded-full bg-[#0068ff] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform duration-200">
              <span className="font-sans font-black text-sm tracking-tight">Zalo</span>
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-[#0068ff] transition-colors truncate max-w-[84px]">
              Tin nhắn Zalo
            </span>
          </button>

          {/* Messenger */}
          <a
            href={messengerShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex flex-col items-center gap-2.5 group cursor-pointer py-2"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#006aff] via-[#00b2ff] to-[#a832fc] text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.518 3.734 7.206V22l3.414-1.874c.91.252 1.88.389 2.852.389 5.523 0 10-4.145 10-9.257C22 6.145 17.523 2 12 2zm1.055 12.443l-2.55-2.72-4.975 2.72 5.474-5.811 2.616 2.72 4.909-2.72-5.474 5.811z"/>
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-[#006aff] transition-colors truncate max-w-[84px]">
              Messenger
            </span>
          </a>

          {/* Facebook */}
          <a
            href={facebookShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex flex-col items-center gap-2.5 group cursor-pointer py-2"
          >
            <div className="w-14 h-14 rounded-full bg-[#1877f2] text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-[#1877f2] transition-colors truncate max-w-[84px]">
              Facebook
            </span>
          </a>

          {/* Other Apps */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="flex flex-col items-center gap-2.5 group cursor-pointer border-0 bg-transparent py-2"
          >
            <div className="w-14 h-14 rounded-full bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
              <Smartphone size={24} strokeWidth={2.2} />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate max-w-[84px]">
              Ứng dụng khác
            </span>
          </button>
        </div>

        {/* Copy Direct Link Section */}
        <div className="space-y-2.5 pt-1">
          <label className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
            LIÊN KẾT TRỰC TIẾP BÀI VIẾT:
          </label>
          <div className="flex items-center gap-3 bg-slate-100/90 dark:bg-slate-800/80 p-2 sm:p-2.5 pl-4 rounded-full border border-slate-200/60 dark:border-slate-700/60">
            <Globe size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              readOnly
              value={targetUrl}
              className="w-full bg-transparent text-xs font-medium text-slate-600 dark:text-slate-300 outline-none truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25'
              }`}
            >
              {copied ? (
                <>
                  <Check size={15} strokeWidth={2.5} />
                  <span>Đã sao chép</span>
                </>
              ) : (
                <>
                  <Copy size={15} strokeWidth={2.5} />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
