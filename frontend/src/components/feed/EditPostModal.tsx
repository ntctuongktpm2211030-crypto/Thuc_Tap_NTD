import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, MapPin, Navigation, Trash2 } from 'lucide-react';
import { postsService } from '../../services/smartTravel.service';
import LocationMapPicker from '../Map/LocationMapPicker';
import { reverseGeocode, searchPlaces } from '../../utils/geocodeUtils';
import type { PlaceSearchResult } from '../../utils/geocodeUtils';
import { validateImage, createPreviewUrl, revokePreviewUrl, resolveMediaUrl } from '../../utils/mediaUtils';
import {
  buildPostUpdateContent,
  parseFeedPostForEdit,
  type EditPostFormState,
} from '../../utils/postEditForm';
import type { FeedPost } from '../../utils/feedUtils';

interface Props {
  post: FeedPost;
  open: boolean;
  onClose: () => void;
  onPostUpdated?: (updatedPost: unknown) => void;
}

export default function EditPostModal({ post, open, onClose, onPostUpdated }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const skipSearchRef = useRef(false);

  const [form, setForm] = useState<EditPostFormState | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(parseFeedPostForEdit(post));
    setShowMap(true);
    setFormError('');
    setUploadError('');
    setSearchResults([]);
  }, [open, post]);

  useEffect(() => {
    if (!open || !form) return;
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    if (!form.location.trim() || form.location.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        setSearchResults(await searchPlaces(form.location));
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form?.location, form, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open || !form) return null;

  const patchForm = (patch: Partial<EditPostFormState>) => {
    setForm(prev => (prev ? { ...prev, ...patch } : prev));
  };

  const handleClose = () => {
    form.photos.forEach(url => {
      if (url.startsWith('blob:')) revokePreviewUrl(url);
    });
    onClose();
  };

  const handleSelectSuggestion = (item: PlaceSearchResult) => {
    skipSearchRef.current = true;
    patchForm({
      location: item.name || item.displayName,
      latitude: item.lat,
      longitude: item.lng,
    });
    setSearchResults([]);
  };

  const handleMapPick = async (loc: { lat: number; lng: number }) => {
    patchForm({ latitude: loc.lat, longitude: loc.lng });
    setGeocoding(true);
    const name = await reverseGeocode(loc.lat, loc.lng);
    if (name) {
      skipSearchRef.current = true;
      patchForm({ location: name });
    }
    setGeocoding(false);
  };

  const handlePhotos = (files: FileList | null) => {
    if (!files?.length) return;
    setUploadError('');
    const next = [...form.photos];
    for (let i = 0; i < files.length && next.length < 2; i++) {
      const err = validateImage(files[i]);
      if (err) {
        setUploadError(err);
        continue;
      }
      next.push(createPreviewUrl(files[i]));
    }
    patchForm({ photos: next });
    if (fileRef.current) fileRef.current.value = '';
  };

  const removePhoto = (url: string) => {
    if (url.startsWith('blob:')) revokePreviewUrl(url);
    patchForm({ photos: form.photos.filter(p => p !== url) });
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.content.trim().length < 10) {
      setFormError('Vui lòng nhập ít nhất 10 ký tự.');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      const mediaUrls = await Promise.all(
        form.photos.map(async url => {
          if (url.startsWith('blob:') || url.startsWith('data:')) {
            return resolveMediaUrl(url);
          }
          return url;
        }),
      );
      const updated = await postsService.updatePost(post.id, {
        content: buildPostUpdateContent(form),
        mediaUrls,
      });
      onPostUpdated?.(updated);
      handleClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Chỉnh sửa thất bại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[99999] flex items-center justify-center p-3 sm:p-4">
      <div className="edit-post-modal-panel w-[75vw] max-w-[75vw] h-[75vh] max-h-[75vh] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden animate-scale-up flex flex-col">
        <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center flex-shrink-0">
          <h3 className="font-bold text-sm text-[var(--text-primary)]">Chỉnh sửa bài đăng</h3>
          <button type="button" onClick={handleClose} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            Hủy
          </button>
        </div>

        <form onSubmit={handleUpdateSubmit} className="p-4 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">Nội dung bài viết</label>
                <textarea
                  value={form.content}
                  onChange={e => patchForm({ content: e.target.value })}
                  rows={5}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--gold)] rounded-xl p-3 text-sm text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-muted)] resize-none"
                  placeholder="Nhập nội dung chỉnh sửa (tối thiểu 10 ký tự)..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <ImagePlus size={14} className="text-sky-400" /> Ảnh bài viết ({form.photos.length}/2)
                  </label>
                  {form.photos.length < 2 && (
                    <button type="button" className="text-xs text-[var(--gold)] font-semibold hover:underline" onClick={() => fileRef.current?.click()}>
                      + Thêm ảnh
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handlePhotos(e.target.files)} />
                {form.photos.length > 0 ? (
                  <div className={`grid gap-2 ${form.photos.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {form.photos.map(url => (
                      <div key={url} className="relative rounded-xl overflow-hidden aspect-video bg-black/20 border border-[var(--border-subtle)]">
                        <img src={url} alt="" className="w-full h-full object-contain" />
                        <button type="button" onClick={() => removePhoto(url)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white hover:bg-black/90 flex items-center justify-center">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="w-full py-6 rounded-xl border border-dashed border-[var(--border-subtle)] hover:border-[var(--gold)]/55 bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] flex flex-col items-center justify-center text-[var(--text-muted)] transition-all"
                    onClick={() => fileRef.current?.click()}
                  >
                    <ImagePlus size={24} className="text-[var(--gold)] mb-1" />
                    <span className="text-xs font-semibold">Thêm ảnh (Tùy chọn)</span>
                  </button>
                )}
                {uploadError && <p className="text-xs text-rose-400">{uploadError}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <MapPin size={14} className="text-emerald-400" /> Vị trí địa điểm
                  </label>
                  <button type="button" className="text-xs text-[var(--gold)] font-semibold flex items-center gap-1 hover:underline" onClick={() => setShowMap(v => !v)}>
                    <Navigation size={10} />
                    {showMap ? 'Ẩn bản đồ' : 'Hiện bản đồ'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    value={form.location}
                    onChange={e => patchForm({ location: e.target.value })}
                    placeholder="Nhập tên địa điểm để tìm kiếm..."
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--gold)] rounded-xl p-3 pr-8 text-sm text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-muted)]"
                  />
                  {searching && (
                    <div className="absolute right-3 top-3.5 text-[var(--text-muted)]">
                      <Loader2 size={14} className="animate-spin" />
                    </div>
                  )}
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl shadow-lg z-30 divide-y divide-[var(--border-subtle)]">
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
                  <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> Đang lấy tên địa điểm…
                  </p>
                )}
                {showMap && (
                  <LocationMapPicker
                    center={form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude } : { lat: 16.0544, lng: 108.2022 }}
                    zoom={form.latitude ? 12 : 6}
                    marker={form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude } : null}
                    onLocationChange={handleMapPick}
                    height="280px"
                    className="mt-2 rounded-xl overflow-hidden border border-[var(--border-subtle)]"
                  />
                )}
              </div>
            </div>
          </div>
          {formError && <p className="text-xs text-rose-400">{formError}</p>}
        </form>

        <div className="p-4 border-t border-[var(--border-subtle)] flex justify-end gap-2 flex-shrink-0">
          <button type="button" onClick={handleClose} disabled={saving} className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] transition-colors">
            Đóng
          </button>
          <button
            type="button"
            onClick={handleUpdateSubmit}
            disabled={saving || !form.content.trim()}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[var(--gold)] to-blue-700 text-white hover:shadow-lg hover:shadow-blue-600/25 transition-all flex items-center gap-1.5"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
