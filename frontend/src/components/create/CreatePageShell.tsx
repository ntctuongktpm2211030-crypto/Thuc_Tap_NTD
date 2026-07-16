import type { ReactNode } from 'react';
import { ArrowLeft, Check } from 'lucide-react';

interface CreatePageShellProps {
  variant: 'post' | 'journey';
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  onBack?: () => void;
  actions?: ReactNode;
  progress?: ReactNode;
  children: ReactNode;
  noHeader?: boolean;
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
  noHeader = false,
}: CreatePageShellProps) {
  return (
    <div className={`create-page create-page--${variant}`}>
      <div className="create-bg-orbs" aria-hidden="true">
        <span className="create-orb create-orb-1" />
        <span className="create-orb create-orb-2" />
        {variant === 'journey' && <span className="create-orb create-orb-3" />}
      </div>

      {!noHeader && (
        <header className={variant === 'journey' ? "bg-white border-b border-slate-200/60 select-none" : "sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 select-none"}>
          <div className="max-w-[1600px] mx-auto w-full h-[64px] px-4 flex items-center justify-between gap-4">
            {/* Left: Back button & Title grouped together */}
            <div className="flex items-center gap-3 min-w-0">
              <button 
                type="button" 
                onClick={onBack} 
                className="w-9 h-9 rounded-xl border border-slate-200/70 flex items-center justify-center bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex-shrink-0 cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="min-w-0">
                <h1 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-1.5 truncate">
                  <span className="p-1 rounded-lg bg-[var(--gold-glow)] text-[var(--gold)] flex items-center justify-center">
                    {icon}
                  </span>
                  {title}
                </h1>
                <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5 max-w-[180px] sm:max-w-md md:max-w-lg lg:max-w-xl">
                  {subtitle}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          </div>
          {progress && <div className="create-header-progress">{progress}</div>}
        </header>
      )}

      <main className={variant === 'journey' ? 'container-wide py-4 sm:py-6' : `container-wide create-main create-main--${variant}`}>
        {children}
      </main>
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
