import { useEffect, useState } from 'react';
import { X, MapPin, Heart } from 'lucide-react';
import type { FeedStoryItem } from '../../types/story';
import StoryCanvas from './StoryCanvas';

interface Props {
  story: FeedStoryItem | null;
  onClose: () => void;
}

interface FloatingHeart {
  id: number;
  x: number;
}

export default function StoryViewerModal({ story, onClose }: Props) {
  const [liked, setLiked] = useState(false);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [progressActive, setProgressActive] = useState(false);

  // Auto-close story after 5 seconds
  useEffect(() => {
    if (!story) return;
    
    // Reset states
    setLiked(false);
    setHearts([]);
    setProgressActive(false);

    // Trigger progress bar transition
    const progressTimer = setTimeout(() => setProgressActive(true), 50);

    // Auto close timer
    const autoCloseTimer = setTimeout(() => {
      onClose();
    }, 5000);

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(autoCloseTimer);
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [story, onClose]);

  if (!story) return null;
  const p = story.payload;

  const handleLikeStory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(true);
    const newHeart = {
      id: Date.now() + Math.random(),
      x: Math.random() * 30 - 15
    };
    setHearts(prev => [...prev, newHeart]);
  };

  return (
    <div className="story-viewer-backdrop" onClick={onClose} role="presentation">
      <div className="story-viewer-panel relative" onClick={e => e.stopPropagation()}>
        
        {/* Main Content Area wrapper */}
        <div className="story-viewer-canvas-wrap relative overflow-hidden group/canvas">
          
          {/* Top dark gradient overlay for info readability */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none" />
          
          {/* Bottom dark gradient overlay for heart button readability */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/50 to-transparent z-10 pointer-events-none" />

          {/* Progress Bar Indicator */}
          <div className="absolute top-2.5 left-2.5 right-2.5 h-[3px] bg-white/20 rounded-full overflow-hidden z-20">
            <div 
              className="h-full bg-white rounded-full transition-all duration-[5000ms] ease-linear"
              style={{ width: progressActive ? '100%' : '0%' }}
            />
          </div>

          {/* Profile metadata info overlay */}
          <div className="absolute top-5 left-3 right-3 z-20 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img src={story.avatar} alt={story.user} className="w-8 h-8 rounded-full border border-white/30 object-cover" />
              <div>
                <p className="text-xs font-bold text-white leading-tight">{story.user}</p>
                <p className="text-[9px] text-white/70 font-semibold flex items-center gap-0.5">
                  12 giờ trước
                  {story.location && (
                    <>
                      <span>•</span>
                      <MapPin size={8} className="text-[var(--gold)]" />
                      <span>{story.location}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Close Button Inside Card Area */}
            <button 
              type="button" 
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all border-none bg-transparent cursor-pointer" 
              onClick={onClose} 
              aria-label="Đóng"
            >
              <X size={16} />
            </button>
          </div>

          {/* Story Canvas payload */}
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
            <img src={story.image} alt="" className="w-full h-full object-cover animate-fade-in" />
          )}

          {/* Floating Hearts Reaction Panel */}
          {hearts.map(h => (
            <span
              key={h.id}
              className="absolute bottom-16 right-5 pointer-events-none text-rose-500 animate-float-heart z-30"
              style={{
                transform: `translateX(${h.x}px)`
              }}
              onAnimationEnd={() => {
                setHearts(prev => prev.filter(item => item.id !== h.id));
              }}
            >
              <Heart size={24} fill="#F43F5E" className="drop-shadow" />
            </span>
          ))}

          {/* Heart Button at the bottom right */}
          <div className="absolute bottom-4 right-4 z-20">
            <button 
              type="button" 
              onClick={handleLikeStory}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
                liked 
                  ? 'bg-rose-500 border-rose-600 text-white scale-110' 
                  : 'bg-black/35 border-white/20 text-white hover:bg-black/55'
              }`}
            >
              <Heart size={18} fill={liked ? '#FFF' : 'none'} className="transition-transform duration-200" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
