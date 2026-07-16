import { useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X, ImagePlus, MapPin, Send, Navigation, Trash2, Loader2 } from 'lucide-react';
import type { RootState } from '../../store';
import LocationMapPicker from '../Map/LocationMapPicker';
import { validateImage, createPreviewUrl, revokePreviewUrl, resolveMediaUrl } from '../../utils/mediaUtils';
import { reverseGeocode, searchPlaces } from '../../utils/geocodeUtils';
import type { PlaceSearchResult } from '../../utils/geocodeUtils';
import { saveUserProfileCache } from '../../utils/feedPostStorage';
import { postsService } from '../../services/smartTravel.service';

const MAX_PHOTOS = 2;
const MIN_CONTENT = 10;

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80';

interface Props {
  open: boolean;
  onClose: () => void;
  onPublished: () => void;
  labels: {
    title: string;
    placeholder: string;
    addPhoto: string;
    location: string;
    locationHint: string;
    showMap: string;
    hideMap: string;
    publish: string;
    publishing: string;
    cancel: string;
    styleHint: string;
    needContent: string;
    needPhoto: string;
  };
}

export default function QuickComposeModal({ open, onClose, onPublished, labels }: Props) {
  const user = useSelector((s: RootState) => s.auth.user);
  const fileRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [formError, setFormError] = useState('');
  const [publishing, setPublishing] = useState(false);

  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const skipSearchRef = useRef(false);

  // Debounced location search
  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    if (!location.trim() || location.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchPlaces(location);
        setSearchResults(results);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [location]);

  const handleSelectSuggestion = (item: PlaceSearchResult) => {
    skipSearchRef.current = true;
    setLocation(item.name || item.displayName);
    setLatitude(item.lat);
    setLongitude(item.lng);
    setSearchResults([]);
  };

  const reset = () => {
    photos.forEach(revokePreviewUrl);
    setText('');
    setPhotos([]);
    setLocation('');
    setLatitude(null);
    setLongitude(null);
    setShowMap(true);
    setUploadError('');
    setFormError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePhotos = (files: FileList | null) => {
    if (!files?.length) return;
    setUploadError('');
    const next = [...photos];
    const MAX_QUICK_PHOTOS = 3;
    for (let i = 0; i < files.length && next.length < MAX_QUICK_PHOTOS; i++) {
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

  const handleMapPick = async (loc: { lat: number; lng: number }) => {
    setLatitude(loc.lat);
    setLongitude(loc.lng);
    setGeocoding(true);
    const name = await reverseGeocode(loc.lat, loc.lng);
    if (name) {
      skipSearchRef.current = true;
      setLocation(name);
    }
    setGeocoding(false);
  };

  const handlePublish = async () => {
    if (text.trim().length < MIN_CONTENT) {
      setFormError(labels.needContent);
      return;
    }
    setFormError('');
    setPublishing(true);

    const destLabel = location.trim() || 'Việt Nam';

    try {
      const mediaUrls = await Promise.all(photos.slice(0, MAX_PHOTOS).map(resolveMediaUrl));
      const content = JSON.stringify({
        type: 'journey',
        displayType: 'social',
        body: text.trim(),
        excerpt: text.trim(),
        destination: destLabel,
        location: { name: destLabel, lat: latitude, lng: longitude },
      });

      await postsService.TaoBaiViet({ content, mediaUrls });

      if (location.trim()) {
        saveUserProfileCache({
          location: location.trim(),
          latitude,
          longitude,
        });
      }

      onPublished();
      handleClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể đăng bài. Vui lòng đăng nhập và thử lại.');
    } finally {
      setPublishing(false);
    }
  };

  if (!open) return null;

  const authorName = user?.fullName || 'Bạn';
  const avatar = user?.avatarUrl || DEFAULT_AVATAR;

  return (
    <div className="quick-compose-backdrop" role="presentation">
      <div className="quick-compose-shell">
        <header className="quick-compose-header">
          <div>
            <h2 className="quick-compose-title">{labels.title}</h2>
            <p className="quick-compose-subtitle">{labels.styleHint}</p>
          </div>
          <button type="button" className="story-creator-icon-btn" onClick={handleClose} aria-label={labels.cancel}>
            <X size={22} />
          </button>
        </header>

        <div className="quick-compose-body">
          {/* Preview kiểu Linh Trần */}
          <div className="quick-compose-preview">
            <div className="post-card quick-compose-preview-card">
              <div className="flex items-center gap-3 p-4 pb-3">
                <img src={avatar} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-[var(--border-normal)]" />
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{authorName}</p>
                  <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                    Vừa xong
                    {location && (
                      <>
                        <span>·</span>
                        <MapPin size={10} className="text-[var(--gold)]" />
                        <span className="text-[var(--gold)] font-medium">{location}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              {text.trim() && (
                <div className="px-4 pb-3">
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-4">{text}</p>
                </div>
              )}
              {photos.length > 0 && (
                <div className={`${photos.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'} overflow-hidden`}>
                  {photos.map((img, i) => (
                    <img key={i} src={img} alt="" className={`w-full object-cover ${photos.length === 1 ? 'max-h-48' : 'h-28'}`} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="quick-compose-form">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={labels.placeholder}
              rows={4}
              className="quick-compose-textarea"
              autoFocus
            />

            <div className="quick-compose-section">
              <div className="flex items-center justify-between mb-2">
                <label className="quick-compose-label">
                  <ImagePlus size={14} className="text-sky-400" />
                  {labels.addPhoto} ({photos.length}/3)
                </label>
                {photos.length < 3 && (
                  <button type="button" className="quick-compose-link" onClick={() => fileRef.current?.click()}>
                    + Thêm ảnh
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => handlePhotos(e.target.files)}
              />
              {photos.length > 0 ? (
                <div className={`grid gap-2 ${photos.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {photos.map(url => (
                    <div key={url} className="relative rounded-xl overflow-hidden aspect-video bg-black/20">
                      <img src={url} alt="" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => removePhoto(url)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <button type="button" className="quick-compose-upload" onClick={() => fileRef.current?.click()}>
                  <ImagePlus size={28} className="text-[var(--gold)] mb-2" />
                  <span className="text-sm font-semibold">Chọn 1–2 ảnh chia sẻ</span>
                </button>
              )}
              {uploadError && <p className="text-xs text-rose-400 mt-1">{uploadError}</p>}
            </div>

            <div className="quick-compose-section">
              <div className="flex items-center justify-between mb-2">
                <label className="quick-compose-label">
                  <MapPin size={14} className="text-emerald-400" />
                  {labels.location}
                </label>
                <button
                  type="button"
                  className="quick-compose-link flex items-center gap-1"
                  onClick={() => setShowMap(v => !v)}
                >
                  <Navigation size={12} />
                  {showMap ? labels.hideMap : labels.showMap}
                </button>
              </div>
              <div className="relative">
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder={labels.locationHint}
                  className="quick-compose-input w-full pr-8"
                />
                {searching && (
                  <div className="absolute right-3 top-3.5 text-[var(--text-muted)]">
                    <Loader2 size={14} className="animate-spin" />
                  </div>
                )}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl shadow-lg z-30 divide-y divide-[var(--border-subtle)]">
                    {searchResults.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="w-full text-left px-4 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)] transition-colors flex flex-col gap-0.5"
                      >
                        <span className="font-semibold text-[var(--text-primary)]">{item.name}</span>
                        <span className="text-[10px] text-[var(--text-muted)] truncate">{item.displayName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {geocoding && (
                <p className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> Đang lấy tên địa điểm…
                </p>
              )}
              {showMap && (
                <LocationMapPicker
                  center={latitude && longitude ? { lat: latitude, lng: longitude } : { lat: 16.0544, lng: 108.2022 }}
                  zoom={latitude ? 12 : 6}
                  marker={latitude && longitude ? { lat: latitude, lng: longitude } : null}
                  onLocationChange={handleMapPick}
                  height="200px"
                  className="mt-2"
                />
              )}
            </div>

            {formError && <p className="text-xs text-rose-400">{formError}</p>}
          </div>
        </div>

        <footer className="quick-compose-footer">
          <button type="button" className="btn-outline flex-1 py-3" onClick={handleClose}>
            {labels.cancel}
          </button>
          <button
            type="button"
            className="btn-gold flex-1 py-3 flex items-center justify-center gap-2"
            onClick={handlePublish}
            disabled={publishing}
          >
            <Send size={16} />
            {publishing ? labels.publishing : labels.publish}
          </button>
        </footer>
      </div>
    </div>
  );
}
