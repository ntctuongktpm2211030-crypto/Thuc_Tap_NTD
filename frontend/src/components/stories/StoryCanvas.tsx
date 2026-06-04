import { useRef } from 'react';
import { MapPin } from 'lucide-react';
import type { StoryLayoutId, StoryTextLayer } from '../../types/story';
import { STORY_FONT_CLASSES } from '../../config/storyFonts';
import StoryLayoutGrid from './StoryLayoutGrid';
import StoryTextOverlay from './StoryTextOverlay';

interface Props {
  layoutId: StoryLayoutId;
  images: string[];
  texts: StoryTextLayer[];
  selectedTextId: string | null;
  onSelectText: (id: string | null) => void;
  onUpdateText: (id: string, patch: Partial<StoryTextLayer>) => void;
  interactive?: boolean;
  locationLabel?: string;
}

export default function StoryCanvas({
  layoutId,
  images,
  texts,
  selectedTextId,
  onSelectText,
  onUpdateText,
  interactive = true,
  locationLabel,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="story-canvas"
      onClick={() => interactive && onSelectText(null)}
    >
      <div className="story-canvas-media absolute inset-0 z-[1] pointer-events-none">
        <StoryLayoutGrid layoutId={layoutId} images={images} className="w-full h-full" />
      </div>
      <div className="story-canvas-vignette pointer-events-none absolute inset-0 z-[2]" />

      <div className="story-canvas-text-layer absolute inset-0 z-[30]">
        {interactive && texts.map(layer => (
          <StoryTextOverlay
            key={layer.id}
            layer={layer}
            selected={selectedTextId === layer.id}
            onSelect={() => onSelectText(layer.id)}
            onChange={patch => onUpdateText(layer.id, patch)}
            containerRef={containerRef}
          />
        ))}
        {!interactive && texts.map(layer => (
          <div
            key={layer.id}
            className="absolute max-w-[88%] pointer-events-none"
            style={{
              left: `${layer.x}%`,
              top: `${layer.y}%`,
              transform: 'translate(-50%, -50%)',
              textAlign: layer.align,
            }}
          >
            <p
              className={`story-text-display px-2 py-1 rounded-md break-words ${STORY_FONT_CLASSES[layer.fontId]}`}
              style={{
                color: layer.color,
                background: layer.bgColor ?? undefined,
                fontSize: layer.fontSize,
              }}
            >
              {layer.text}
            </p>
          </div>
        ))}
      </div>

      {locationLabel && (
        <div className="story-canvas-location absolute bottom-3 left-0 right-0 z-[40] flex justify-center pointer-events-none px-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-sm text-white text-[11px] font-semibold max-w-full truncate shadow-lg">
            <MapPin size={12} className="text-[var(--gold)] flex-shrink-0" />
            {locationLabel}
          </span>
        </div>
      )}
    </div>
  );
}
