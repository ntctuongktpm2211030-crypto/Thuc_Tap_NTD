import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Globe, ImagePlus, Loader2, MapPin, MoreHorizontal, Trash2, Users, Lock,
  CheckCircle2, AlertCircle, Hash, Eye, Edit3, Heart, MessageCircle, Share2, Bookmark, Sparkles
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

const QUICK_HASHTAGS = ['#DuLichVietNam', '#AmThuc', '#KhamPha', '#Checkin', '#Phuot', '#NhatKyHanhTrinh'];
const EMOJI_CHIPS = ['✈️', '📸', '🏞️', '🍜', '☕', '🌅', '🏕️', '❤️'];

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const fileRef = useRef<HTMLInputElement>(null);
  const skipSearchRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState<EditPostFormState | null>(null);
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
  const [showMap, setShowMap] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoadError('Không tìm thấy mã bài viết.');
      setLoading(false);
      return;
    }
    setLoading(true);
    postsService
      .get(id)
      .then(post => setForm(parseApiPostForEdit(post)))
      .catch(() => setLoadError('Không tải được thông tin bài viết từ máy chủ.'))
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

  const insertText = (textToInsert: string) => {
    if (!form) return;
    patchForm({ content: form.content + (form.content.endsWith(' ') || !form.content ? '' : ' ') + textToInsert });
  };

  const handleSubmit = async () => {
    if (!id || !form) return;
    if (form.content.trim().length < 10) {
      setFormError('Nội dung bài viết phải chứa ít nhất 10 ký tự.');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      const mediaUrls = await Promise.all(
        form.photos.map(async url => {
          if (url.startsWith('blob:') || url.startsWith('data:')) {
            try {
              return await Promise.race([
                resolveMediaUrl(url),
                new Promise<string>(resolve => setTimeout(() => resolve(url), 1500))
              ]);
            } catch {
              return url;
            }
          }
          return url;
        }),
      );

      await Promise.race([
        postsService.updatePost(id, {
          content: buildPostUpdateContent(form),
          mediaUrls,
        }),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);

      window.scrollTo(0, 0);
      navigate('/', { replace: true, state: { refreshFeed: true } });
    } catch (err) {
      console.error(err);
      window.scrollTo(0, 0);
      navigate('/', { replace: true, state: { refreshFeed: true } });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-800">
        <Loader2 size={36} className="animate-spin text-blue-600" />
        <p className="text-xs font-bold text-slate-500">Đang tải dữ liệu bài viết…</p>
      </div>
    );
  }

  if (loadError || !form) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center mb-4 shadow-sm">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">{loadError || 'Không thể tải bài viết'}</h2>
        <p className="text-xs text-slate-500 max-w-sm mb-6">Bài viết có thể đã bị xóa hoặc bạn không có quyền chỉnh sửa.</p>
        <button
          type="button"
          onClick={handleCancel}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition-all shadow-md"
        >
          Quay lại Trang chủ
        </button>
      </div>
    );
  }

  const wordCount = form.content.trim() ? form.content.trim().split(/\s+/).length : 0;
  const charCount = form.content.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      
      {/* ── TOP NAVIGATION BAR (LIGHT THEME + RECOLORED BLUE SAVE BUTTON) ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Back Button */}
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Hủy & Quay lại</span>
          </button>

          {/* Title Badge */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <Edit3 size={16} />
            </div>
            <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
              Chỉnh Sửa Bài Viết
            </h1>
          </div>

          {/* SAVE BUTTON: ROYAL BLUE GRADIENT WITH HIGH CONTRAST */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !form.content.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-95 cursor-pointer border border-blue-400/30"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin text-white" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                <span>Cập Nhật Bài Viết</span>
              </>
            )}
          </button>

        </div>
      </header>

      {/* ── MAIN STUDIO CONTENT AREA ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
        
        {/* LEFT COLUMN: EDITING STUDIO */}
        <div className="space-y-6 min-w-0">
          
          {/* Card 1: Main Content Editor */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-5">
            
            {/* User Profile & Audience Selector Header */}
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-3">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-sm" />
                ) : (
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                    {user?.fullName?.charAt(0) ?? 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                    {user?.fullName ?? 'Người dùng'}
                    <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Tác giả</span>
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium truncate">Chỉnh sửa nội dung nhật ký du lịch</p>
                </div>
              </div>

              {/* Privacy Pills */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200">
                {[
                  { key: 'public', label: 'Công khai', icon: Globe },
                  { key: 'friends', label: 'Bạn bè', icon: Users },
                  { key: 'private', label: 'Riêng tư', icon: Lock },
                ].map(item => {
                  const Icon = item.icon;
                  const active = privacy === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setPrivacy(item.key as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        active
                          ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <Icon size={12} />
                      <span className="hidden sm:inline">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Textarea with STRICT NO-OVERFLOW WRAPPING */}
            <div className="space-y-3 min-w-0 max-w-full">
              <div className="relative min-w-0 max-w-full">
                <textarea
                  value={form.content}
                  onChange={e => patchForm({ content: e.target.value })}
                  rows={8}
                  placeholder="Chia sẻ chi tiết hành trình, cảm xúc, kinh nghiệm du lịch của bạn tại đây..."
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl p-4 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all leading-relaxed resize-y min-h-[160px] break-words max-w-full font-sans"
                />
              </div>

              {/* Character & Word Count Toolbar */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span>Sức chứa: <strong className="text-slate-800">{charCount}</strong> ký tự</span>
                  <span>•</span>
                  <span>Tổng cộng: <strong className="text-slate-800">{wordCount}</strong> từ</span>
                </div>
                {charCount < 10 && (
                  <span className="text-rose-600 font-bold">Ít nhất 10 ký tự ({10 - charCount} nữa)</span>
                )}
              </div>
            </div>

            {/* Quick Hashtag & Emoji Insert Chips */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Hash size={12} className="text-blue-600" /> Gợi ý thẻ băm & cảm xúc:
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_CHIPS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertText(emoji)}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs border border-slate-200 transition-all active:scale-95 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
                {QUICK_HASHTAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertText(tag)}
                    className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-[11px] font-bold text-blue-700 border border-blue-200 transition-all active:scale-95 cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Card 2: Media Gallery Upload & Management */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                  <ImagePlus size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Hình Ảnh Hành Trình</h3>
                  <p className="text-[11px] text-slate-500">Tối đa 2 hình ảnh đính kèm cho bài đăng</p>
                </div>
              </div>

              {form.photos.length < 2 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ImagePlus size={14} /> Thêm ảnh mới
                </button>
              )}
            </div>

            {/* Photos Preview Grid */}
            {form.photos.length > 0 ? (
              <div className={`grid gap-4 ${form.photos.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {form.photos.map((url, idx) => (
                  <div key={url} className="relative rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-200 group shadow-sm">
                    <img src={url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                      Ảnh {idx + 1}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (url.startsWith('blob:')) revokePreviewUrl(url);
                        patchForm({ photos: form.photos.filter(p => p !== url) });
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
                      title="Xóa ảnh"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-50 hover:bg-blue-50/30 group"
              >
                <ImagePlus size={32} className="mx-auto text-slate-400 group-hover:text-blue-600 transition-colors mb-2" />
                <p className="text-xs font-bold text-slate-700">Nhấn vào đây để tải lên hình ảnh hành trình</p>
                <p className="text-[10px] text-slate-500 mt-1">Hỗ trợ định dạng JPG, PNG, WEBP (Tối đa 10MB)</p>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => {
                if (!e.target.files?.length) return;
                const next = [...form.photos];
                for (let i = 0; i < e.target.files.length && next.length < 2; i++) {
                  const err = validateImage(e.target.files[i]);
                  if (!err) next.push(createPreviewUrl(e.target.files[i]));
                  else setUploadError(err);
                }
                patchForm({ photos: next });
                if (fileRef.current) fileRef.current.value = '';
              }}
            />
            {uploadError && <p className="text-xs text-rose-600 font-bold">{uploadError}</p>}
          </div>

          {/* Card 3: Location Check-in & GIS Map Picker */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                  <MapPin size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Vị Trí Check-in</h3>
                  <p className="text-[11px] text-slate-500">Gắn vị trí hoặc địa điểm chính cho bài đăng</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMap(v => !v)}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                {showMap ? 'Ẩn bản đồ' : 'Mở bản đồ'}
              </button>
            </div>

            <div className="relative">
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={form.location}
                  onChange={e => patchForm({ location: e.target.value })}
                  placeholder="Nhập tên thành phố, danh thắng hoặc địa điểm (VD: Fansipan, Sa Pa)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                />
                {searching && <Loader2 size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-blue-600" />}
              </div>

              {/* Search Suggestions Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
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
                      className="w-full text-left px-4 py-3 text-xs text-slate-800 hover:bg-blue-50 hover:text-blue-800 transition-colors flex items-center justify-between"
                    >
                      <span className="font-bold">{item.name}</span>
                      <span className="text-[10px] text-blue-600 font-mono font-bold">📍 Chọn</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {geocoding && <p className="text-[11px] text-blue-600 font-bold">Đang tìm tọa độ địa lý...</p>}

            {showMap && (
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
                className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner"
              />
            )}
          </div>

          {formError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: LIVE REAL-TIME PREVIEW */}
        <aside className="lg:sticky lg:top-24 h-fit space-y-3 min-w-0 max-w-full overflow-hidden">
          
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
              <Eye size={14} /> XEM TRƯỚC BÀI ĐĂNG
            </span>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded border border-slate-300">
              Live Mockup
            </span>
          </div>

          {/* Social Card Mockup Container */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-lg space-y-4 max-w-full overflow-hidden min-w-0">
            
            {/* Author Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                    {user?.fullName?.charAt(0) ?? 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.fullName ?? 'Tường Nguyễn'}</p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <span>Vừa xong</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-blue-600 font-semibold">
                      {privacy === 'public' ? <Globe size={10} /> : privacy === 'friends' ? <Users size={10} /> : <Lock size={10} />}
                      {privacy === 'public' ? 'Công khai' : privacy === 'friends' ? 'Bạn bè' : 'Riêng tư'}
                    </span>
                  </p>
                </div>
              </div>

              <button type="button" className="text-slate-400 hover:text-slate-600 shrink-0">
                <MoreHorizontal size={18} />
              </button>
            </div>

            {/* Post Body Content with STRICT WORD BREAK / WRAPPING */}
            <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans break-words break-all max-w-full overflow-hidden">
              {form.content.trim() ? (
                form.content
              ) : (
                <span className="text-slate-400 italic">Nội dung bài viết sẽ hiển thị trực tiếp tại đây...</span>
              )}
            </div>

            {/* Attached Photos Grid Preview */}
            {form.photos.length > 0 && (
              <div className={`grid gap-2 rounded-2xl overflow-hidden border border-slate-200 ${form.photos.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {form.photos.map(url => (
                  <img key={url} src={url} alt="" className="w-full h-44 object-cover" />
                ))}
              </div>
            )}

            {/* Location Badge */}
            {form.location && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700 max-w-full truncate">
                <MapPin size={12} className="shrink-0 text-rose-500" />
                <span className="truncate">{form.location}</span>
              </div>
            )}

            {/* Mock Engagement Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-500 text-xs">
              <div className="flex items-center gap-4">
                <button type="button" className="flex items-center gap-1.5 hover:text-rose-600 transition-colors font-medium">
                  <Heart size={15} /> <span>12</span>
                </button>
                <button type="button" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors font-medium">
                  <MessageCircle size={15} /> <span>3</span>
                </button>
                <button type="button" className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors font-medium">
                  <Share2 size={15} />
                </button>
              </div>
              <button type="button" className="hover:text-blue-600 transition-colors">
                <Bookmark size={15} />
              </button>
            </div>

          </div>

          <div className="bg-blue-50/60 rounded-2xl p-3.5 border border-blue-200/80 text-[11px] text-blue-900 leading-relaxed">
            <p className="flex items-center gap-1.5 font-extrabold text-blue-900 mb-1">
              <Sparkles size={13} className="text-blue-600" /> Lưu ý chỉnh sửa
            </p>
            Mọi thay đổi trên nội dung bài đăng sẽ được lưu và hiển thị trực tiếp trên trang chủ.
          </div>

        </aside>

      </main>
    </div>
  );
}
