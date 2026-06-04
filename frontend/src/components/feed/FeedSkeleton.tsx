export default function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {/* Skeleton 1: Hero Card style */}
      <div className="w-full h-64 sm:h-80 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden relative animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="w-20 h-5 bg-white/10 rounded-full" />
          <div className="w-24 h-5 bg-white/10 rounded-full" />
        </div>
        <div className="absolute bottom-6 left-6 right-6 space-y-3">
          <div className="w-3/4 h-6 bg-white/20 rounded-md" />
          <div className="w-1/2 h-4 bg-white/10 rounded-md" />
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15" />
              <div className="space-y-1.5">
                <div className="w-24 h-3 bg-white/15 rounded" />
                <div className="w-16 h-2 bg-white/10 rounded" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-16 h-8 bg-white/15 rounded-full" />
              <div className="w-12 h-8 bg-white/15 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Skeleton 2: Social Post Card style */}
      <div className="w-full rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4 space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[var(--border-subtle)]" />
            <div className="space-y-2">
              <div className="w-28 h-4 bg-[var(--border-subtle)] rounded" />
              <div className="w-20 h-3 bg-[var(--border-subtle)] rounded" />
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-[var(--border-subtle)]" />
        </div>
        <div className="space-y-2">
          <div className="w-full h-4 bg-[var(--border-subtle)] rounded" />
          <div className="w-5/6 h-4 bg-[var(--border-subtle)] rounded" />
        </div>
        <div className="w-full h-48 rounded-xl bg-[var(--border-subtle)]" />
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
          <div className="w-16 h-8 bg-[var(--border-subtle)] rounded-full" />
          <div className="w-16 h-8 bg-[var(--border-subtle)] rounded-full" />
          <div className="w-16 h-8 bg-[var(--border-subtle)] rounded-full" />
        </div>
      </div>

      {/* Skeleton 3: Magazine style */}
      <div className="w-full rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden animate-pulse">
        <div className="w-full h-40 bg-[var(--border-subtle)]" />
        <div className="p-4 space-y-3">
          <div className="w-1/3 h-3 bg-[var(--border-subtle)] rounded" />
          <div className="w-3/4 h-5 bg-[var(--border-subtle)] rounded" />
          <div className="w-full h-4 bg-[var(--border-subtle)] rounded" />
          <div className="flex items-center gap-3 pt-2">
            <div className="w-8 h-8 rounded-full bg-[var(--border-subtle)]" />
            <div className="space-y-1.5 flex-1">
              <div className="w-24 h-3 bg-[var(--border-subtle)] rounded" />
              <div className="w-16 h-2 bg-[var(--border-subtle)] rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
