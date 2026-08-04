import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check, Share2, MessageCircle, Globe, Smartphone } from 'lucide-react';
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
      // fallback copy error
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
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999999] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-up text-slate-900 dark:text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider">Chia Sẻ Bài Viết</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Lan tỏa câu chuyện hành trình đến bạn bè</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Share App Buttons Grid */}
        <div className="grid grid-cols-4 gap-3 text-center">
          {/* Zalo Message / App Share */}
          <button
            type="button"
            onClick={handleZaloShare}
            className="flex flex-col items-center gap-2 group cursor-pointer border-0 bg-transparent"
          >
            <div className="w-13 h-13 rounded-2xl bg-[#0068ff] text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              Zalo
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600">Tin nhắn Zalo</span>
          </button>

          {/* Messenger Share */}
          <a
            href={messengerShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#006aff] via-[#00b2ff] to-[#9900ff] text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <MessageCircle size={24} />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600">Messenger</span>
          </a>

          {/* Facebook Feed Share */}
          <a
            href={facebookShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-13 h-13 rounded-2xl bg-[#1877f2] text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
              f
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600">Facebook</span>
          </a>

          {/* Native Phone Share */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-13 h-13 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Smartphone size={22} />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600">Ứng dụng khác</span>
          </button>
        </div>

        {/* Copy Link Input Bar */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Liên kết trực tiếp bài viết:
          </label>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Globe size={16} className="text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              readOnly
              value={targetUrl}
              className="w-full bg-transparent text-xs font-mono text-slate-600 dark:text-slate-300 outline-none truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-95'
              }`}
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>Đã chép</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
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
