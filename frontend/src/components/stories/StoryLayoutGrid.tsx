import type { StoryLayoutId } from '../../types/story';
import { STORY_LAYOUTS } from '../../config/storyLayouts';

interface Props {
  layoutId: StoryLayoutId;
  images: string[];
  className?: string;
  /** Thu nhỏ cho thumbnail chọn khung */
  compact?: boolean;
}

export default function StoryLayoutGrid({ layoutId, images, className = '', compact = false }: Props) {
  const layout = STORY_LAYOUTS.find(l => l.id === layoutId) ?? STORY_LAYOUTS[0];
  const slots = Array.from({ length: layout.slots }, (_, i) => images[i] ?? '');

  return (
    <div className={`story-layout-grid ${layout.gridClass} ${compact ? 'story-layout-grid--compact' : ''} ${className}`}>
      {slots.map((src, i) => (
        <div key={i} className="story-layout-cell">
          {src ? (
            <img src={src} alt="" className="story-layout-img" draggable={false} />
          ) : (
            <div className="story-layout-empty" />
          )}
        </div>
      ))}
    </div>
  );
}
