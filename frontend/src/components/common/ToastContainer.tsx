import React, { useEffect, useState } from 'react';
import { useToast, ToastItem } from '../../contexts/ToastContext';
import {
  MapPin,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  Sparkles,
  Compass,
} from 'lucide-react';

const SingleToast: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const duration = toast.duration || 4500;

  useEffect(() => {
    if (isPaused) return;

    const intervalTime = 50;
    const decrement = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= decrement) {
          clearInterval(timer);
          onDismiss(toast.id);
          return 0;
        }
        return prev - decrement;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [duration, isPaused, onDismiss, toast.id]);

  // Style variations based on type
  const getConfig = () => {
    switch (toast.type) {
      case 'location':
        return {
          icon: <MapPin className="w-5 h-5 text-emerald-500 animate-bounce" />,
          badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          gradientBg: 'from-emerald-500/10 via-teal-500/5 to-transparent',
          borderColor: 'border-emerald-500/30 dark:border-emerald-500/40',
          barBg: 'bg-gradient-to-r from-emerald-500 to-teal-400',
          defaultTitle: 'Địa danh lân cận',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          gradientBg: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
          borderColor: 'border-emerald-500/30 dark:border-emerald-500/40',
          barBg: 'bg-emerald-500',
          defaultTitle: 'Thành công',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
          badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          gradientBg: 'from-rose-500/10 via-rose-500/5 to-transparent',
          borderColor: 'border-rose-500/30 dark:border-rose-500/40',
          barBg: 'bg-rose-500',
          defaultTitle: 'Đã xảy ra lỗi',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          gradientBg: 'from-amber-500/10 via-amber-500/5 to-transparent',
          borderColor: 'border-amber-500/30 dark:border-amber-500/40',
          barBg: 'bg-amber-500',
          defaultTitle: 'Lưu ý',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-sky-500" />,
          badgeBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
          gradientBg: 'from-sky-500/10 via-brand-500/5 to-transparent',
          borderColor: 'border-sky-500/30 dark:border-sky-500/40',
          barBg: 'bg-sky-500',
          defaultTitle: 'Thông báo',
        };
    }
  };

  const config = getConfig();

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`group relative overflow-hidden w-full max-w-sm sm:max-w-md rounded-2xl shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border ${config.borderColor} transition-all duration-300 transform translate-y-0 animate-fade-in hover:shadow-emerald-500/10`}
    >
      {/* Background soft ambient gradient glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradientBg} pointer-events-none`} />

      <div className="relative p-4 flex items-start gap-3.5">
        {/* Icon / Badge */}
        <div className="shrink-0 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 shadow-inner flex items-center justify-center">
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {toast.title || config.defaultTitle}
            </span>

            {toast.type === 'location' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Compass className="w-3 h-3" />
                {toast.badge || 'Đang khám phá'}
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed break-words">
            {toast.message}
          </p>

          {toast.actionLabel && toast.onAction && (
            <button
              onClick={() => {
                toast.onAction?.();
                onDismiss(toast.id);
              }}
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {toast.actionLabel}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => onDismiss(toast.id)}
          className="absolute top-3.5 right-3.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Countdown progress bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 overflow-hidden">
        <div
          className={`h-full ${config.barBg} transition-all duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-4 left-4 sm:left-auto sm:right-6 z-[99999] flex flex-col gap-3 pointer-events-none max-w-md w-full sm:w-auto items-center sm:items-end"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full flex justify-end">
          <SingleToast toast={toast} onDismiss={removeToast} />
        </div>
      ))}
    </div>
  );
};
