import { useRef, useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  X, ChevronLeft, ImagePlus, LayoutGrid, Type, Trash2, Send, AlignLeft, AlignCenter, AlignRight, MapPin,
} from 'lucide-react';
import type { RootState } from '../../store';
import type { StoryLayoutId, StoryTextLayer, StoredStory, StoryFontId } from '../../types/story';
import { validateImage, createPreviewUrl, revokePreviewUrl, resolveMediaUrls } from '../../utils/mediaUtils';
import { saveUserStory } from '../../utils/storyStorage';
import { layoutsForPhotoCount, defaultLayoutForCount, STORY_QUICK_LOCATIONS, layoutCategoryLabel } from '../../config/storyLayouts';
import StoryLayoutGrid from './StoryLayoutGrid';
import {
  STORY_FONT_OPTIONS,
  STORY_TEXT_COLORS,
  STORY_BG_COLORS,
} from '../../config/storyFonts';
import StoryCanvas from './StoryCanvas';

type Phase = 'photos' | 'layout' | 'edit';

const MAX_STORY_PHOTOS = 6;

function newTextLayer(): StoryTextLayer {
  return {
    id: `t-${Date.now()}`,
    text: '',
    x: 50,
    y: 45,
    fontSize: 26,
    fontId: 'classic',
    color: '#ffffff',
    bgColor: null,
    align: 'center',
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  onPublished: (story: StoredStory) => void;
  labels: Record<string, string>;
}

export default function StoryCreatorModal({ open, onClose, onPublished, labels }: Props) {
  const user = useSelector((s: RootState) => s.auth.user);
  const fileRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>('photos');
  const [photos, setPhotos] = useState<string[]>([]);
  const [layoutId, setLayoutId] = useState<StoryLayoutId>('single');
  const [texts, setTexts] = useState<StoryTextLayer[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [publishing, setPublishing] = useState(false);

  const availableLayouts = useMemo(() => layoutsForPhotoCount(photos.length), [photos.length]);
  const selectedText = texts.find(t => t.id === selectedTextId);

  const reset = () => {
    photos.forEach(revokePreviewUrl);
    setPhase('photos');
    setPhotos([]);
    setLayoutId('single');
    setTexts([]);
    setSelectedTextId(null);
    setLocation('');
    setUploadError('');
  };

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    setUploadError('');
    const next = [...photos];
    for (let i = 0; i < files.length && next.length < MAX_STORY_PHOTOS; i++) {
      const err = validateImage(files[i]);
      if (err) {
        setUploadError(err);
        continue;
      }
      next.push(createPreviewUrl(files[i]));
    }
    setPhotos(next);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removePhoto = (url: string) => {
    revokePreviewUrl(url);
    setPhotos(prev => prev.filter(p => p !== url));
  };

  const goLayout = () => {
    if (photos.length === 0) {
      setUploadError(labels.needPhoto);
      return;
    }
    setLayoutId(defaultLayoutForCount(photos.length));
    setPhase('layout');
  };

  const goEdit = () => {
    setPhase('edit');
    if (texts.length === 0) {
      const t = newTextLayer();
      setTexts([t]);
      setSelectedTextId(t.id);
    }
  };

  const addText = () => {
    const t = newTextLayer();
    setTexts(prev => [...prev, t]);
    setSelectedTextId(t.id);
  };

  const updateText = (id: string, patch: Partial<StoryTextLayer>) => {
    setTexts(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
  };

  const deleteText = () => {
    if (!selectedTextId) return;
    setTexts(prev => prev.filter(t => t.id !== selectedTextId));
    setSelectedTextId(null);
  };

  const handlePublish = async () => {
    if (photos.length === 0) return;
    setPublishing(true);
    try {
      const resolvedPhotos = await resolveMediaUrls(photos);
      const name = user?.fullName || 'Bạn';
      const avatar = user?.avatarUrl || '';
      const story: StoredStory = {
        id: `story-${Date.now()}`,
        user: name,
        avatar: avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80',
        location: location.trim(),
        coverImage: resolvedPhotos[0],
        layoutId,
        images: resolvedPhotos,
        texts,
        createdAt: Date.now(),
      };
      saveUserStory(story);
      onPublished(story);
    } catch (err) {
      console.error('Failed to resolve story media URLs:', err);
    } finally {
      setPublishing(false);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="story-creator-backdrop" role="presentation">
      <div className={`story-creator-shell ${phase === 'edit' ? 'story-creator-shell--edit' : ''}`}>
        <header className="story-creator-header">
          {phase !== 'photos' ? (
            <button
              type="button"
              className="story-creator-icon-btn"
              onClick={() => setPhase(phase === 'edit' ? 'layout' : 'photos')}
            >
              <ChevronLeft size={22} />
            </button>
          ) : (
            <span className="w-10" />
          )}
          <h2 className="story-creator-title">{labels.title}</h2>
          <button type="button" className="story-creator-icon-btn" onClick={onClose} aria-label={labels.close}>
            <X size={22} />
          </button>
        </header>

        {phase === 'photos' && (
          <div className="story-creator-body">
            <p className="text-sm text-[var(--text-muted)] mb-4">{labels.photosHint}</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
            {photos.length === 0 ? (
              <button
                type="button"
                className="story-upload-zone"
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus size={40} className="text-[var(--gold)] mb-3" />
                <p className="font-semibold text-[var(--text-primary)]">{labels.pickPhotos}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{labels.pickPhotosSub}</p>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {photos.map(url => (
                    <div key={url} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(url)}
                        className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {photos.length < MAX_STORY_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-[var(--border-normal)] flex flex-col items-center justify-center gap-1 hover:border-[var(--gold)] transition-colors"
                    >
                      <ImagePlus size={24} className="text-[var(--text-muted)]" />
                      <span className="text-[10px] text-[var(--text-muted)]">{labels.addMore}</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)]">{photos.length}/{MAX_STORY_PHOTOS} ảnh</p>
              </div>
            )}
            {uploadError && <p className="text-xs text-rose-400 mt-2">{uploadError}</p>}
            <footer className="story-creator-footer">
              <button type="button" className="btn-outline flex-1 py-3" onClick={onClose}>{labels.cancel}</button>
              <button type="button" className="btn-gold flex-1 py-3" onClick={goLayout} disabled={photos.length === 0}>
                {labels.next}
              </button>
            </footer>
          </div>
        )}

        {phase === 'layout' && (
          <div className="story-creator-body story-creator-body--layout">
            <div className="story-layout-live-preview">
              <StoryCanvas
                layoutId={layoutId}
                images={photos}
                texts={[]}
                selectedTextId={null}
                onSelectText={() => {}}
                onUpdateText={() => {}}
                interactive={false}
              />
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-3 flex items-center gap-2">
              <LayoutGrid size={16} className="text-[var(--gold)]" />
              {labels.layoutHint}
              <span className="ml-auto text-xs font-bold text-[var(--gold)]">{availableLayouts.length} mẫu</span>
            </p>
            <div className="story-layout-pick-grid">
              {availableLayouts.map(layout => (
                <button
                  key={layout.id}
                  type="button"
                  onClick={() => setLayoutId(layout.id)}
                  className={`story-layout-pick ${layoutId === layout.id ? 'story-layout-pick--active' : ''}`}
                >
                  <div className="story-layout-pick-preview">
                    <StoryLayoutGrid layoutId={layout.id} images={photos} compact />
                  </div>
                  <span className="text-xs font-bold text-[var(--text-primary)]">{layout.label}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{layout.description}</span>
                  <span className="story-layout-pick-badge">{layoutCategoryLabel(layout.category, layout.slots)}</span>
                </button>
              ))}
            </div>
            {availableLayouts.length === 0 && (
              <p className="text-sm text-amber-400">{labels.layoutFallback}</p>
            )}
            <footer className="story-creator-footer">
              <button type="button" className="btn-gold w-full py-3" onClick={goEdit}>{labels.nextEdit}</button>
            </footer>
          </div>
        )}

        {phase === 'edit' && (
          <div className="story-creator-edit">
            <div className="story-creator-canvas-wrap">
              <StoryCanvas
                layoutId={layoutId}
                images={photos}
                texts={texts}
                selectedTextId={selectedTextId}
                onSelectText={setSelectedTextId}
                onUpdateText={updateText}
                locationLabel={location.trim() || undefined}
              />
            </div>

            <div className="story-creator-controls">
            {selectedText && (
              <div className="story-text-toolbar">
                <div className="story-text-edit-row">
                  <Type size={16} className="text-[var(--gold)] flex-shrink-0" />
                  <textarea
                    value={selectedText.text}
                    onChange={e => updateText(selectedText.id, { text: e.target.value })}
                    placeholder="Nhập chữ… (Enter xuống dòng, Esc đóng)"
                    rows={2}
                    className="story-text-edit-input flex-1"
                  />
                </div>
                <div className="flex gap-1 overflow-x-auto pb-2">
                  {STORY_FONT_OPTIONS.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => updateText(selectedText.id, { fontId: f.id as StoryFontId })}
                      className={`story-font-chip ${selectedText.fontId === f.id ? 'story-font-chip--active' : ''}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex gap-1">
                    {STORY_TEXT_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        className={`story-color-dot ${selectedText.color === c ? 'ring-2 ring-white' : ''}`}
                        style={{ background: c }}
                        onClick={() => updateText(selectedText.id, { color: c })}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {STORY_BG_COLORS.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`story-bg-chip ${selectedText.bgColor === c ? 'ring-2 ring-[var(--gold)]' : ''}`}
                        style={{ background: c ?? 'transparent' }}
                        title={c ? 'Nền' : 'Không nền'}
                        onClick={() => updateText(selectedText.id, { bgColor: c })}
                      />
                    ))}
                  </div>
                  <input
                    type="range"
                    min={16}
                    max={56}
                    value={selectedText.fontSize}
                    onChange={e => updateText(selectedText.id, { fontSize: Number(e.target.value) })}
                    className="story-font-size-range flex-1 min-w-[100px]"
                  />
                  <button type="button" onClick={() => updateText(selectedText.id, { align: 'left' })} className="story-creator-icon-btn">
                    <AlignLeft size={18} />
                  </button>
                  <button type="button" onClick={() => updateText(selectedText.id, { align: 'center' })} className="story-creator-icon-btn">
                    <AlignCenter size={18} />
                  </button>
                  <button type="button" onClick={() => updateText(selectedText.id, { align: 'right' })} className="story-creator-icon-btn">
                    <AlignRight size={18} />
                  </button>
                  <button type="button" onClick={deleteText} className="story-creator-icon-btn text-rose-400">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )}

            <div className="story-creator-tools">
              <button type="button" className="story-tool-btn" onClick={addText}>
                <Type size={20} />
                <span>{labels.addText}</span>
              </button>
              <button type="button" className="story-tool-btn" onClick={() => fileRef.current?.click()}>
                <ImagePlus size={20} />
              </button>
            </div>

            <div className="story-location-section px-4 pb-2">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                <MapPin size={12} className="text-[var(--gold)]" />
                {labels.locationLabel}
              </label>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder={labels.locationPlaceholder}
                className="story-location-input w-full mb-2"
              />
              <div className="flex flex-wrap gap-1.5">
                {STORY_QUICK_LOCATIONS.map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocation(loc)}
                    className={`story-location-chip ${location === loc ? 'story-location-chip--active' : ''}`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <footer className="story-creator-footer">
              <button type="button" className="btn-gold w-full py-3 flex items-center justify-center gap-2" onClick={handlePublish} disabled={publishing}>
                <Send size={16} />
                {publishing ? labels.publishing : labels.publish}
              </button>
            </footer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
