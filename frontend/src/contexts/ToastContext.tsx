import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'location';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  badge?: string; // e.g. "199m", "AI Suggestion"
  actionLabel?: string;
  onAction?: () => void;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, options?: Partial<ToastItem>) => string;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  location: (message: string, badge?: string, options?: Partial<ToastItem>) => string;
  removeToast: (id: string) => void;
  confirm: (options: ConfirmOptions) => void;
  activeConfirm: ConfirmOptions | null;
  closeConfirm: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Global reference to enable imperative toast usage anywhere if needed
let globalShowToast: ((message: string, type?: ToastType, options?: Partial<ToastItem>) => string) | null = null;

export const toast = {
  show: (message: string, type: ToastType = 'info', options?: Partial<ToastItem>) => {
    if (globalShowToast) return globalShowToast(message, type, options);
    console.log('[Toast Fallback]:', message);
    return '';
  },
  success: (message: string, title?: string) => toast.show(message, 'success', { title }),
  error: (message: string, title?: string) => toast.show(message, 'error', { title }),
  info: (message: string, title?: string) => toast.show(message, 'info', { title }),
  warning: (message: string, title?: string) => toast.show(message, 'warning', { title }),
  location: (message: string, badge?: string, options?: Partial<ToastItem>) =>
    toast.show(message, 'location', { badge, ...options }),
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [activeConfirm, setActiveConfirm] = useState<ConfirmOptions | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', options?: Partial<ToastItem>) => {
      const id = 'toast-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
      const newToast: ToastItem = {
        id,
        message,
        type,
        duration: options?.duration ?? (type === 'location' ? 7000 : 4500),
        ...options,
      };

      setToasts((prev) => {
        // Prevent exact duplicate toasts showing back-to-back
        const isDuplicate = prev.some((t) => t.message === message && t.type === type);
        if (isDuplicate) return prev;
        const updated = [...prev, newToast];
        if (updated.length > 5) updated.shift();
        return updated;
      });

      return id;
    },
    []
  );

  const success = useCallback(
    (message: string, title?: string) => showToast(message, 'success', { title }),
    [showToast]
  );
  const error = useCallback(
    (message: string, title?: string) => showToast(message, 'error', { title }),
    [showToast]
  );
  const info = useCallback(
    (message: string, title?: string) => showToast(message, 'info', { title }),
    [showToast]
  );
  const warning = useCallback(
    (message: string, title?: string) => showToast(message, 'warning', { title }),
    [showToast]
  );
  const location = useCallback(
    (message: string, badge?: string, options?: Partial<ToastItem>) =>
      showToast(message, 'location', { badge, ...options }),
    [showToast]
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    setActiveConfirm(options);
  }, []);

  const closeConfirm = useCallback(() => {
    setActiveConfirm(null);
  }, []);

  // Update global ref
  useEffect(() => {
    globalShowToast = showToast;
  }, [showToast]);

  // Override standard window.alert so native "localhost:3000 says..." popups are intercepted
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg?: any) => {
      const text = String(msg ?? '');
      if (!text) return;
      showToast(text, 'info');
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        success,
        error,
        info,
        warning,
        location,
        removeToast,
        confirm,
        activeConfirm,
        closeConfirm,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
