import { useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import type { FeedStoryItem } from '../../types/story';
import StoryCanvas from './StoryCanvas';

interface Props {
  story: FeedStoryItem | null;
  onClose: () => void;
}

export default function StoryViewerModal({ story, onClose }: Props) {
  useEffect(() => {
    if (!story) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [story, onClose]);

  if (!story) return null;
  const p = story.payload;

  return (
    <div className="story-viewer-backdrop" onClick={onClose} role="presentation">
      <div className="story-viewer-panel" onClick={e => e.stopPropagation()}>
        <button type="button" className="story-viewer-close" onClick={onClose} aria-label="Đóng">
          <X size={22} />
        </button>
        <div className="story-viewer-canvas-wrap">
          {p ? (
            <StoryCanvas
              layoutId={p.layoutId}
              images={p.images}
              texts={p.texts}
              selectedTextId={null}
              onSelectText={() => {}}
              onUpdateText={() => {}}
              interactive={false}
              locationLabel={p.location || undefined}
            />
          ) : (
            <img src={story.image} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="story-viewer-meta">
          <img src={story.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
          <div>
            <p className="text-sm font-bold text-white">{story.user}</p>
            {story.location && (
              <p className="text-xs text-white/70 flex items-center gap-1">
                <MapPin size={10} /> {story.location}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
