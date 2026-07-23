import React from 'react';
import { useToast } from '../../contexts/ToastContext';
import { AlertTriangle, HelpCircle, X, Trash2 } from 'lucide-react';

export const ConfirmModal: React.FC = () => {
  const { activeConfirm, closeConfirm } = useToast();

  if (!activeConfirm) return null;

  const {
    title,
    message,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    type = 'danger',
    onConfirm,
    onCancel,
  } = activeConfirm;

  const handleConfirm = () => {
    onConfirm();
    closeConfirm();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    closeConfirm();
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="w-6 h-6 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case 'info':
      default:
        return <HelpCircle className="w-6 h-6 text-brand-500" />;
    }
  };

  const getConfirmBtnStyle = () => {
    switch (type) {
      case 'danger':
        return 'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-700 hover:to-red-600 text-white shadow-lg shadow-rose-500/25';
      case 'warning':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25';
      case 'info':
      default:
        return 'bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-700 hover:to-sky-600 text-white shadow-lg shadow-brand-500/25';
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 overflow-hidden transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top subtle decoration line */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            type === 'danger'
              ? 'bg-rose-500'
              : type === 'warning'
              ? 'bg-amber-500'
              : 'bg-brand-500'
          }`}
        />

        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0">
            {getIcon()}
          </div>

          <div className="flex-1 pr-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {title || (type === 'danger' ? 'Xác nhận xóa' : 'Xác nhận hành động')}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <button
            onClick={handleCancel}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${getConfirmBtnStyle()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
