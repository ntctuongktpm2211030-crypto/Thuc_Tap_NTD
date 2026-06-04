import type { ReactNode } from 'react';
import { ArrowLeft, Check } from 'lucide-react';

interface CreatePageShellProps {
  variant: 'post' | 'journey';
  title: string;
  subtitle: string;
  icon: ReactNode;
  onBack: () => void;
  actions?: ReactNode;
  progress?: ReactNode;
  children: ReactNode;
}

export default function CreatePageShell({
  variant,
  title,
  subtitle,
  icon,
  onBack,
  actions,
  progress,
  children,
}: CreatePageShellProps) {
  return (
    <div className={`create-page create-page--${variant}`}>
      <div className="create-bg-orbs" aria-hidden="true">
        <span className="create-orb create-orb-1" />
        <span className="create-orb create-orb-2" />
        {variant === 'journey' && <span className="create-orb create-orb-3" />}
      </div>

      <header className={`create-header create-header--${variant}`}>
        <div className="container-wide h-[68px] flex items-center justify-between gap-4">
          <button type="button" onClick={onBack} className="create-back-btn flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <ArrowLeft size={18} />
            <span className="text-sm font-semibold hidden sm:block">Quay lại</span>
          </button>

          <div className="flex items-center gap-3 min-w-0">
            <div className={`create-header-icon create-header-icon--${variant}`}>{icon}</div>
            <div className="hidden sm:block min-w-0">
              <p className="font-editorial font-bold text-[var(--text-primary)] truncate">{title}</p>
              <p className="text-[11px] text-[var(--text-muted)] truncate">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        </div>
        {progress && <div className="create-header-progress">{progress}</div>}
      </header>

      <main className={`container-wide create-main create-main--${variant}`}>{children}</main>
    </div>
  );
}

export function CreateSuccessScreen({
  variant,
  title,
  message,
  actions,
}: {
  variant: 'post' | 'journey';
  title: string;
  message: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className={`create-page create-page--${variant} min-h-screen flex items-center justify-center px-4`}>
      <div className="create-bg-orbs" aria-hidden="true">
        <span className="create-orb create-orb-1" />
        <span className="create-orb create-orb-2" />
      </div>
      <div className="create-success-card animate-scale-in text-center max-w-md space-y-6 relative z-10">
        <div className={`create-success-icon create-success-icon--${variant}`}>
          <Check size={36} strokeWidth={2.5} />
        </div>
        <h1 className="headline-lg text-gradient-hero">{title}</h1>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-center flex-wrap">{actions}</div>
      </div>
    </div>
  );
}
