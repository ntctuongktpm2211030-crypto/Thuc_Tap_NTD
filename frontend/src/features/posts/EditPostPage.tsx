import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Globe, ImagePlus, Loader2, MapPin, MoreHorizontal, Navigation, Trash2, Users,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { postsService } from '../../services/smartTravel.service';
import LocationMapPicker from '../../components/Map/LocationMapPicker';
import { reverseGeocode, searchPlaces } from '../../utils/geocodeUtils';
import type { PlaceSearchResult } from '../../utils/geocodeUtils';
import { validateImage, createPreviewUrl, revokePreviewUrl, resolveMediaUrl } from '../../utils/mediaUtils';
import {
  buildPostUpdateContent,
  parseApiPostForEdit,
  type EditPostFormState,
} from '../../utils/postEditForm';

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const fileRef = useRef<HTMLInputElement>(null);
  const skipSearchRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState<EditPostFormState | null>(null);
  const [privacy, setPrivacy] = useState<'public' | 'friends'>('public');
  const [showMap, setShowMap] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoadError('Không tìm thấy bài viết.');
      setLoading(false);
      return;
    }
    setLoading(true);
    postsService
      .get(id)
      .then(post => setForm(parseApiPostForEdit(post)))
      .catch(() => setLoadError('Không tải được bài viết.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!form) return;
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
  }, [form?.location, form]);

  const patchForm = (patch: Partial<EditPostFormState>) => {
    setForm(prev => (prev ? { ...prev, ...patch } : prev));
  };

  const handleCancel = () => {
    form?.photos.forEach(url => {
      if (url.startsWith('blob:')) revokePreviewUrl(url);
    });
    navigate(-1);
  };

  const handleSubmit = async () => {
    if (!id || !form) return;
    if (form.content.trim().length < 10) {
      setFormError('Vui lòng nhập ít nhất 10 ký tự.');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      const mediaUrls = await Promise.all(
        form.photos.map(async url => {
          if (url.startsWith('blob:') || url.startsWith('data:')) return resolveMediaUrl(url);
          return url;
        }),
      );
      await postsService.updatePost(id, {
        content: buildPostUpdateContent(form),
        mediaUrls,
      });
      navigate('/', { replace: true, state: { refreshFeed: true } });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Chỉnh sửa thất bại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fb-edit-page min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  if (loadError || !form) {
    return (
      <div className="fb-edit-page min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-[var(--text-muted)]">{loadError || 'Lỗi tải bài viết'}</p>
        <button type="button" onClick={handleCancel} className="text-sm font-semibold text-[var(--gold)]">
          Quay lại
        </button>
      </div>
    );
  }

  const previewText = form.content.slice(0, 500);

  return (
    <div className="fb-edit-page min-h-screen bg-[var(--bg-primary)]">
      <header className="fb-edit-header sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <button type="button" onClick={handleCancel} className="flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Quay lại</span>
          </button>
          <h1 className="text-sm font-bold text-[var(--text-primary)]">Chỉnh sửa bài viết</h1>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !form.content.trim()}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-[var(--gold)] text-black hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Lưu
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Composer — giống Facebook */}
        <div className="fb-edit-composer space-y-4">
          <div className="fb-edit-card">
            <div className="flex items-center gap-3 mb-4">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gold)] to-violet-500 flex items-center justify-center text-white font-bold">
                  {user?.fullName?.charAt(0) ?? '?'}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">{user?.fullName ?? 'Bạn'}</p>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setPrivacy('public')}
                    className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${privacy === 'public' ? 'bg-[var(--gold-glow)] border-[var(--gold)] text-[var(--gold)]' : 'border-[var(--border-subtle)] text-[var(--text-muted)]'}`}
                  >
                    <Globe size={12} /> Công khai
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrivacy('friends')}
                    className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${privacy === 'friends' ? 'bg-[var(--gold-glow)] border-[var(--gold)] text-[var(--gold)]' : 'border-[var(--border-subtle)] text-[var(--text-muted)]'}`}
                  >
                    <Users size={12} /> Bạn bè
                  </button>
                </div>
              </div>
            </div>

            <textarea
              value={form.content}
              onChange={e => patchForm({ content: e.target.value })}
              rows={8}
              placeholder={`${user?.fullName?.split(' ')[0] ?? 'Bạn'} ơi, bạn đang nghĩ gì?`}
              className="w-full bg-transparent text-[var(--text-primary)] text-lg placeholder:text-[var(--text-muted)] focus:outline-none resize-none min-h-[160px]"
            />

            {form.photos.length > 0 && (
              <div className={`grid gap-2 mt-3 ${form.photos.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {form.photos.map(url => (
                  <div key={url} className="relative rounded-xl overflow-hidden aspect-video bg-[var(--bg-elevated)]">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        if (url.startsWith('blob:')) revokePreviewUrl(url);
                        patchForm({ photos: form.photos.filter(p => p !== url) });
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--border-subtle)]">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase">Thêm vào bài viết</span>
              <div className="flex gap-1">
                {form.photos.length < 2 && (
                  <button type="button" onClick={() => fileRef.current?.click()} className="p-2.5 rounded-full hover:bg-[var(--bg-elevated)] text-emerald-500" title="Ảnh">
                    <ImagePlus size={22} />
                  </button>
                )}
                <button type="button" onClick={() => setShowMap(v => !v)} className="p-2.5 rounded-full hover:bg-[var(--bg-elevated)] text-rose-500" title="Vị trí">
                  <MapPin size={22} />
                </button>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => {
              if (!e.target.files?.length) return;
              const next = [...form.photos];
              for (let i = 0; i < e.target.files.length && next.length < 2; i++) {
                const err = validateImage(e.target.files[i]);
                if (!err) next.push(createPreviewUrl(e.target.files[i]));
                else setUploadError(err);
              }
              patchForm({ photos: next });
              if (fileRef.current) fileRef.current.value = '';
            }} />
            {uploadError && <p className="text-xs text-rose-400 mt-2">{uploadError}</p>}
          </div>

          {showMap && (
            <div className="fb-edit-card space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1">
                  <MapPin size={14} className="text-emerald-400" /> Check-in / địa điểm
                </label>
                <Navigation size={14} className="text-[var(--text-muted)]" />
              </div>
              <div className="relative">
                <input
                  value={form.location}
                  onChange={e => patchForm({ location: e.target.value })}
                  placeholder="Bạn đang ở đâu?"
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-sm focus:border-[var(--gold)] focus:outline-none"
                />
                {searching && <Loader2 size={14} className="absolute right-3 top-3 animate-spin text-[var(--text-muted)]" />}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 z-20 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl shadow-lg max-h-36 overflow-y-auto">
                    {searchResults.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          skipSearchRef.current = true;
                          patchForm({
                            location: item.name || item.displayName,
                            latitude: item.lat,
                            longitude: item.lng,
                          });
                          setSearchResults([]);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--bg-overlay)]"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {geocoding && <p className="text-[11px] text-[var(--text-muted)]">Đang lấy địa chỉ…</p>}
              <LocationMapPicker
                center={form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude } : { lat: 16.0544, lng: 108.2022 }}
                zoom={form.latitude ? 12 : 6}
                marker={form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude } : null}
                onLocationChange={async loc => {
                  patchForm({ latitude: loc.lat, longitude: loc.lng });
                  setGeocoding(true);
                  const name = await reverseGeocode(loc.lat, loc.lng);
                  if (name) {
                    skipSearchRef.current = true;
                    patchForm({ location: name });
                  }
                  setGeocoding(false);
                }}
                height="220px"
                className="rounded-xl overflow-hidden border border-[var(--border-subtle)]"
              />
            </div>
          )}

          {formError && <p className="text-sm text-rose-400">{formError}</p>}
        </div>

        {/* Preview */}
        <aside className="lg:sticky lg:top-20 h-fit">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Xem trước</p>
          <div className="fb-edit-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--gold)] to-violet-500" />
                )}
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{user?.fullName ?? 'Bạn'}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Vừa xong · {privacy === 'public' ? 'Công khai' : 'Bạn bè'}</p>
                </div>
              </div>
              <MoreHorizontal size={18} className="text-[var(--text-muted)]" />
            </div>
            {previewText && <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap mb-3">{previewText}</p>}
            {form.photos[0] && (
              <img src={form.photos[0]} alt="" className="w-full rounded-xl object-cover max-h-48 mb-2" />
            )}
            {form.location && (
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                <MapPin size={12} /> {form.location}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
