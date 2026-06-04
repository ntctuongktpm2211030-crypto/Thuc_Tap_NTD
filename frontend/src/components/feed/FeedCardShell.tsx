import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onOpen: () => void;
  className?: string;
  readMoreLabel?: string;
  showReadMore?: boolean;
}

/** Vỏ thẻ feed — click mở popup; nút tương tác dùng stopPropagation bên trong */
export default function FeedCardShell({
  children,
  onOpen,
  className = '',
  readMoreLabel,
  showReadMore,
}: Props) {
  return (
    <article
      className={`feed-card-clickable group/card ${className}`}
    >
      <div
        role="button"
        tabIndex={0}
        className="feed-card-clickable-area cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] rounded-xl"
        onClick={onOpen}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        {children}
        {showReadMore && readMoreLabel && (
          <p className="feed-read-more-hint px-4 pb-2">{readMoreLabel} →</p>
        )}
      </div>
    </article>
  );
}
