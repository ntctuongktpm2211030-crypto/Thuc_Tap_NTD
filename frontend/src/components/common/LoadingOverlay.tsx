
interface LoadingOverlayProps {
  message?: string;
  isVisible: boolean;
}

export default function LoadingOverlay({ message = 'Đang xử lý...', isVisible }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
      {/* Dynamic spinner with glow */}
      <div className="relative flex items-center justify-center">
        {/* Glow behind */}
        <div className="absolute w-24 h-24 rounded-full bg-[var(--gold)]/25 blur-xl animate-pulse" />
        
        {/* Spinner rings */}
        <div className="w-16 h-16 rounded-full border-4 border-t-[var(--gold)] border-r-transparent border-b-violet-500 border-l-transparent animate-spin duration-1000" />
        <div className="absolute w-12 h-12 rounded-full border-4 border-t-transparent border-r-teal-400 border-b-transparent border-l-amber-400 animate-spin-reverse duration-700" />
        
        {/* Center dot */}
        <div className="absolute w-3 h-3 rounded-full bg-[var(--gold)] shadow-lg shadow-[var(--gold)]" />
      </div>

      {/* Message and loading text */}
      <div className="mt-6 text-center space-y-2">
        <p className="text-white font-semibold tracking-wide text-base animate-pulse">
          {message}
        </p>
        <div className="flex justify-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[var(--gold)] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
