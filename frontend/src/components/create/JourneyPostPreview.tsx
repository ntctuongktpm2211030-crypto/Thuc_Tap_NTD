import { MapPin, BookOpen } from 'lucide-react';
import { getPostStyleClasses, type PostLayoutId, type PostStyleSettings } from '../../config/postStylePresets';

export interface JourneyPreviewData {
  layoutId: PostLayoutId;
  style: PostStyleSettings;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  photos: string[];
  destinationLabel: string;
  categoryLabel: string;
  requestFeatured: boolean;
  tips: { content: string }[];
}

export default function JourneyPostPreview({ data }: { data: JourneyPreviewData }) {
  const previewImages = data.photos.length > 0 ? data.photos : (data.coverImage ? [data.coverImage] : []);
  const styleClass = getPostStyleClasses(data.style);
  const titleFont = 'post-preview-title';
  const bodyFont = 'post-preview-body';

  const renderHero = () => (
    <div className={`card-hero relative overflow-hidden min-h-[260px] ${styleClass}`}>
      {data.coverImage && (
        <img src={data.coverImage} alt="" className="card-hero-image absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="card-hero-overlay absolute inset-0" />
      <div className="absolute top-3 left-3 flex gap-2 z-10">
        <span className="badge-category text-[10px] post-preview-badge">
          {data.requestFeatured ? "Editor's Pick" : data.categoryLabel}
        </span>
        {data.destinationLabel && (
          <span className="flex items-center gap-1 bg-black/50 text-white/90 text-[10px] font-semibold px-2.5 py-1 rounded-full">
            <MapPin size={9} /> {data.destinationLabel}
          </span>
        )}
      </div>
      <div className="card-hero-content relative z-10 p-5 mt-28">
        <h2 className={`${titleFont} text-white font-bold text-lg leading-snug mb-2`}>
          {data.title || 'Tiêu đề…'}
        </h2>
        <p className={`${bodyFont} text-sm text-gray-300 line-clamp-2`}>{data.excerpt || data.content}</p>
      </div>
    </div>
  );

  const renderMagazine = () => (
    <div className={`card-medium overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] ${styleClass}`}>
      {data.coverImage && (
        <div className="relative h-40">
          <img src={data.coverImage} alt="" className="w-full h-full object-cover" />
          <span className="absolute top-2 left-2 post-preview-badge px-2 py-0.5 rounded-md text-[10px] font-bold text-white">
            {data.categoryLabel}
          </span>
        </div>
      )}
      <div className="p-4 space-y-2">
        {data.destinationLabel && (
          <p className={`${bodyFont} text-[10px] post-preview-accent flex items-center gap-1`}>
            <MapPin size={10} /> {data.destinationLabel}
          </p>
        )}
        <h3 className={`${titleFont} font-bold text-[var(--text-primary)]`}>{data.title || 'Tiêu đề…'}</h3>
        <p className={`${bodyFont} text-xs text-[var(--text-secondary)] line-clamp-2`}>{data.excerpt}</p>
      </div>
    </div>
  );

  const renderSocial = (variant: 'default' | 'minimal' | 'gallery' | 'polaroid') => {
    if (variant === 'minimal') {
      return (
        <div className={`post-card p-4 flex gap-3 ${styleClass}`}>
          {previewImages[0] && (
            <img src={previewImages[0]} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className={`${bodyFont} text-sm text-[var(--text-secondary)] line-clamp-4`}>{data.content}</p>
            {data.destinationLabel && (
              <p className={`${bodyFont} text-[10px] post-preview-accent mt-2 flex items-center gap-1`}>
                <MapPin size={9} /> {data.destinationLabel}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (variant === 'gallery') {
      return (
        <div className={`post-card overflow-hidden ${styleClass}`}>
          <div className="p-4 pb-2">
            <p className={`${bodyFont} text-sm text-[var(--text-secondary)] line-clamp-2`}>{data.content}</p>
          </div>
          {previewImages.length > 0 && (
            <div className="grid grid-cols-3 gap-0.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="aspect-square bg-[var(--bg-elevated)]">
                  {previewImages[i] ? (
                    <img src={previewImages[i]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full opacity-30" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (variant === 'polaroid') {
      return (
        <div className={`post-card p-4 ${styleClass}`}>
          <p className={`${bodyFont} text-sm text-[var(--text-secondary)] mb-3`}>{data.content}</p>
          <div className="flex gap-3 flex-wrap justify-center">
            {previewImages.slice(0, 2).map(url => (
              <div key={url} className="post-polaroid-frame p-2 pb-6 bg-white shadow-lg rotate-[-1deg]">
                <img src={url} alt="" className="w-32 h-32 object-cover" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className={`post-card overflow-hidden ${styleClass}`}>
        <div className="p-4 pb-2">
          <p className={`${bodyFont} text-sm text-[var(--text-secondary)]`}>{data.content || 'Nội dung…'}</p>
        </div>
        {previewImages.length > 0 && (
          <div className={previewImages.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'}>
            {previewImages.slice(0, 2).map(url => (
              <img key={url} src={url} alt="" className={`w-full object-cover ${previewImages.length === 1 ? 'max-h-48' : 'h-36'}`} />
            ))}
          </div>
        )}
        {data.destinationLabel && (
          <p className={`px-4 py-2 text-[10px] post-preview-accent flex items-center gap-1`}>
            <MapPin size={10} /> {data.destinationLabel}
          </p>
        )}
      </div>
    );
  };

  const renderQuote = () => (
    <div className={`p-6 border-l-4 post-preview-accent-border bg-[var(--bg-elevated)] ${styleClass}`}>
      <blockquote className={`${titleFont} text-xl font-bold text-[var(--text-primary)] leading-relaxed mb-3`}>
        &ldquo;{data.excerpt || data.title || data.content.slice(0, 120) || 'Câu trích dẫn…'}&rdquo;
      </blockquote>
      <p className={`${bodyFont} text-xs post-preview-accent`}>— {data.title || 'Hành trình của bạn'}</p>
      {data.destinationLabel && (
        <p className={`${bodyFont} text-[10px] text-[var(--text-muted)] mt-2 flex items-center gap-1`}>
          <MapPin size={9} /> {data.destinationLabel}
        </p>
      )}
    </div>
  );

  const renderGuide = () => (
    <div className={`post-card p-4 space-y-3 ${styleClass}`}>
      <div className="flex items-center gap-2 post-preview-accent">
        <BookOpen size={16} />
        <span className={`${titleFont} text-sm font-bold`}>{data.title || 'Cẩm nang'}</span>
      </div>
      <ul className={`${bodyFont} space-y-2 text-sm text-[var(--text-secondary)]`}>
        {(data.tips.length > 0 ? data.tips : [{ content: data.excerpt || data.content.slice(0, 80) || 'Thêm mẹo ở bước lịch trình…' }])
          .slice(0, 4)
          .map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span className="post-preview-accent font-bold">{i + 1}.</span>
              <span>{tip.content}</span>
            </li>
          ))}
      </ul>
    </div>
  );

  switch (data.layoutId) {
    case 'hero':
      return renderHero();
    case 'magazine':
      return renderMagazine();
    case 'quote':
      return renderQuote();
    case 'guide':
      return renderGuide();
    case 'minimal':
      return renderSocial('minimal');
    case 'gallery':
      return renderSocial('gallery');
    case 'polaroid':
      return renderSocial('polaroid');
    case 'social':
    default:
      return renderSocial('default');
  }
}
