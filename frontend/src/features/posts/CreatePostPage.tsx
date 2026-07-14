import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Send, Eye, Upload, X, MapPin, Tag, Globe,
  Lock, UserCheck, Image as ImageIcon, Video, Check, AlertCircle,
  BookOpen, Navigation, Sparkles,
} from 'lucide-react';
import { POST_CATEGORIES } from '../../config/modernIcons';
import LocationMapPicker from '../../components/Map/LocationMapPicker';
import CreatePageShell, { CreateSuccessScreen } from '../../components/create/CreatePageShell';
import { postsService } from '../../services/smartTravel.service';
import type { RootState } from '../../store';
import {
  validateImage, validateVideo, createPreviewUrl, revokePreviewUrl,
  resolveMediaUrl, MAX_PHOTOS, MAX_VIDEOS, cleanDeadBlobUrls,
} from '../../utils/mediaUtils';

const DRAFT_KEY = 'smarttravel_post_draft';

const POPULAR_TAGS = ['#DuLich', '#AmThuc', '#CheckIn', '#Review', '#MeoHay', '#VietNam'];

interface PostFormData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  location: string;
  latitude: number | null;
  longitude: number | null;
  coverImage: string;
  photos: string[];
  videos: string[];
  privacy: 'public' | 'friends' | 'private';
}

const DEFAULT_DATA: PostFormData = {
  title: '', excerpt: '', content: '', category: '', tags: [],
  location: '', latitude: null, longitude: null,
  coverImage: '', photos: [], videos: [], privacy: 'public',
};

function buildPostContent(data: PostFormData) {
  return JSON.stringify({
    type: 'post',
    title: data.title,
    excerpt: data.excerpt || data.content.slice(0, 160),
    body: data.content,
    category: data.category,
    tags: data.tags,
    location: { name: data.location, lat: data.latitude, lng: data.longitude },
    privacy: data.privacy,
    readTime: Math.max(1, Math.round(data.content.length / 600)),
  });
}

function saveDraft(data: PostFormData) {
  try {
    const cleaned = cleanDeadBlobUrls(data);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(cleaned));
    return true;
  } catch { return false; }
}

function loadDraft(): PostFormData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? cleanDeadBlobUrls(JSON.parse(raw)) : null;
  } catch { return null; }
}

function clearDraft() { localStorage.removeItem(DRAFT_KEY); }

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);
  const [data, setData] = useState<PostFormData>(() => loadDraft() || DEFAULT_DATA);
  const [tagInput, setTagInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const coverRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const onChange = (updates: Partial<PostFormData>) => setData(prev => ({ ...prev, ...updates }));

  const addTag = (tag: string) => {
    const clean = tag.startsWith('#') ? tag : `#${tag}`;
    if (!data.tags.includes(clean)) onChange({ tags: [...data.tags, clean] });
    setTagInput('');
  };

  const handleCover = (files: FileList | null) => {
    if (!files?.[0]) return;
    const err = validateImage(files[0]);
    if (err) { setUploadError(err); return; }
    setUploadError('');
    if (data.coverImage.startsWith('blob:')) revokePreviewUrl(data.coverImage);
    onChange({ coverImage: createPreviewUrl(files[0]) });
  };

  const handlePhotos = (files: FileList | null) => {
    if (!files?.length) return;
    const added: string[] = [];
    for (let i = 0; i < Math.min(files.length, MAX_PHOTOS - data.photos.length); i++) {
      if (!validateImage(files[i])) added.push(createPreviewUrl(files[i]));
    }
    if (added.length) onChange({ photos: [...data.photos, ...added], coverImage: data.coverImage || added[0] });
  };

  const handleVideos = (files: FileList | null) => {
    if (!files?.length) return;
    const added: string[] = [];
    for (let i = 0; i < Math.min(files.length, MAX_VIDEOS - data.videos.length); i++) {
      if (!validateVideo(files[i])) added.push(createPreviewUrl(files[i]));
    }
    if (added.length) onChange({ videos: [...data.videos, ...added] });
  };

  const removePhoto = (url: string) => {
    revokePreviewUrl(url);
    const photos = data.photos.filter(p => p !== url);
    onChange({ photos, coverImage: data.coverImage === url ? (photos[0] || '') : data.coverImage });
  };

  const handleSaveDraft = () => {
    const ok = saveDraft(data);
    setDraftSaved(ok);
    setTimeout(() => setDraftSaved(false), 2500);
  };

  const isReady = data.title.trim().length >= 5 && data.content.trim().length >= 30 && !!data.category;

  const handlePublish = async () => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: '/posts/create' } });
      return;
    }
    setPublishing(true);
    setPublishError('');
    try {
      const coverUrl = data.coverImage ? await resolveMediaUrl(data.coverImage) : '';
      const photoUrls = await Promise.all(data.photos.map(resolveMediaUrl));
      const videoUrls = await Promise.all(data.videos.map(resolveMediaUrl));
      const mediaUrls = [coverUrl, ...photoUrls, ...videoUrls].filter(Boolean);
      await postsService.create({ content: buildPostContent(data), mediaUrls });

      clearDraft();
      setPublished(true);
    } catch (err: unknown) {
      setPublishError(err instanceof Error ? err.message : 'Không thể đăng bài. Vui lòng thử lại.');
    } finally {
      setPublishing(false);
    }
  };

  if (published) {
    return (
      <CreateSuccessScreen
        variant="post"
        title="Bài viết đã đăng! 🎉"
        message={<>Bài viết &ldquo;<strong>{data.title}</strong>&rdquo; đã được chia sẻ với cộng đồng Terraholic.</>}
        actions={
          <>
            <button onClick={() => navigate('/', { state: { refreshFeed: true } })} className="btn-post px-6 py-3">Về Bảng tin</button>
            <button onClick={() => navigate('/explore')} className="btn-outline px-6 py-3">Xem Khám phá</button>
            <button onClick={() => { setData(DEFAULT_DATA); setPublished(false); }} className="btn-outline px-6 py-3">Viết thêm</button>
          </>
        }
      />
    );
  }

  const cat = POST_CATEGORIES.find(c => c.id === data.category);

  return (
    <CreatePageShell
      variant="post"
      title="Đăng bài viết"
      subtitle="Chia sẻ câu chuyện, review và mẹo du lịch"
      icon={<BookOpen size={18} />}
      onBack={() => navigate(-1)}
      actions={
        <>
          <button type="button" onClick={() => setShowPreview(p => !p)}
            className={`btn-outline text-xs px-3 py-2 hidden md:flex items-center gap-1.5 ${showPreview ? 'border-sky-400 text-sky-300' : ''}`}>
            <Eye size={13} /> {showPreview ? 'Ẩn preview' : 'Xem trước'}
          </button>
          <button type="button" onClick={handleSaveDraft} className="btn-outline text-xs px-3 py-2 hidden sm:flex items-center gap-1.5">
            <Sparkles size={13} /> {draftSaved ? 'Đã lưu!' : 'Lưu nháp'}
          </button>
          <button onClick={handlePublish} disabled={!isReady || publishing} className="btn-post px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50">
            {publishing ? 'Đang đăng...' : <><Send size={14} /> Đăng bài</>}
          </button>
        </>
      }
    >
      <div className="create-hero mb-6 animate-fade-in">
        <p className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400 mb-2">✍️ Trình soạn thảo</p>
        <h1 className="headline-md text-gradient-hero mb-2">Viết bài chia sẻ trải nghiệm</h1>
        <p className="text-sm text-[var(--text-secondary)]">Thêm ảnh bìa, nội dung và vị trí — bài viết sẽ hiện trên bảng tin.</p>
      </div>

      <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-[1fr_360px]' : 'max-w-3xl mx-auto'}`}>
        <div className="space-y-5">
          <div className="create-panel create-panel--sky">
            <div className="create-section-label">
              <span className="create-section-icon create-section-icon--sky"><ImageIcon size={15} /></span>
              Ảnh bìa
            </div>
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => { handleCover(e.target.files); e.target.value = ''; }} />
            {data.coverImage ? (
              <div className="create-cover-frame h-44 sm:h-56 group">
                <img src={data.coverImage} alt="cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 z-10 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2">
                  <button type="button" onClick={() => coverRef.current?.click()} className="opacity-0 group-hover:opacity-100 btn-post text-xs px-4 py-2">Đổi ảnh</button>
                  <button type="button" onClick={() => { if (data.coverImage.startsWith('blob:')) revokePreviewUrl(data.coverImage); onChange({ coverImage: '' }); }}
                    className="opacity-0 group-hover:opacity-100 bg-rose-500 text-white rounded-full p-2"><X size={14} /></button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => coverRef.current?.click()} className="create-upload-zone">
                <Upload size={32} className="mx-auto mb-3 text-sky-400" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">Thêm ảnh bìa</p>
              </button>
            )}
          </div>

          <div className="create-panel create-panel--violet space-y-5">
            <div className="create-section-label">
              <span className="create-section-icon create-section-icon--violet"><BookOpen size={15} /></span>
              Nội dung
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-2">Tiêu đề *</label>
              <input value={data.title} onChange={e => onChange({ title: e.target.value })} className="input-premium text-lg font-semibold" maxLength={150} placeholder="Tiêu đề bài viết..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-2">Mô tả ngắn</label>
              <input value={data.excerpt} onChange={e => onChange({ excerpt: e.target.value })} className="input-premium text-sm" maxLength={200} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-2">Nội dung *</label>
              <textarea value={data.content} onChange={e => onChange({ content: e.target.value })} rows={10} className="create-textarea" placeholder="Viết nội dung bài viết..." />
              <p className="text-[10px] text-[var(--text-muted)] mt-1 text-right">{data.content.length} ký tự</p>
            </div>
          </div>

          <div className="create-panel create-panel--amber space-y-4">
            <div className="create-section-label">
              <span className="create-section-icon create-section-icon--gold"><Tag size={14} /></span>
              Danh mục &amp; thẻ
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {POST_CATEGORIES.map(c => {
                const CatIcon = c.icon;
                return (
                <button key={c.id} type="button" onClick={() => onChange({ category: c.id })}
                  className={`create-chip create-chip--${c.chip} ${data.category === c.id ? 'create-chip--active' : ''} flex items-center gap-2`}>
                  <CatIcon size={15} strokeWidth={2} /> {c.label}
                </button>
              );})}
            </div>
            <div className="flex flex-wrap gap-2">
              {data.tags.map(tag => (
                <span key={tag} className="create-tag">{tag}
                  <button type="button" onClick={() => onChange({ tags: data.tags.filter(t => t !== tag) })}><X size={11} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && tagInput.trim() && (e.preventDefault(), addTag(tagInput.trim()))}
                className="input-premium flex-1 py-2 text-sm" placeholder="Thẻ + Enter" />
              <button type="button" onClick={() => tagInput.trim() && addTag(tagInput.trim())} className="btn-post px-4 py-2 text-xs">Thêm</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_TAGS.filter(t => !data.tags.includes(t)).map(tag => (
                <button key={tag} type="button" onClick={() => addTag(tag)} className="px-2 py-1 rounded-full text-[11px] border border-white/10 text-[var(--text-muted)] hover:text-sky-300">{tag}</button>
              ))}
            </div>
          </div>

          <div className="create-panel create-panel--emerald space-y-3">
            <div className="flex justify-between items-center">
              <div className="create-section-label mb-0">
                <span className="create-section-icon create-section-icon--emerald"><MapPin size={14} /></span>
                Địa điểm
              </div>
              <button type="button" onClick={() => setShowMap(m => !m)} className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <Navigation size={12} /> {showMap ? 'Ẩn map' : 'Gắn map'}
              </button>
            </div>
            <input value={data.location} onChange={e => onChange({ location: e.target.value })} className="input-premium text-sm" placeholder="Địa điểm..." />
            {showMap && (
              <LocationMapPicker
                center={data.latitude && data.longitude ? { lat: data.latitude, lng: data.longitude } : { lat: 16.0544, lng: 108.2022 }}
                zoom={data.latitude ? 12 : 6}
                marker={data.latitude && data.longitude ? { lat: data.latitude, lng: data.longitude } : null}
                onLocationChange={loc => onChange({ latitude: loc.lat, longitude: loc.lng })}
                height="220px"
              />
            )}
          </div>

          <div className="create-panel create-panel--rose space-y-3">
            <div className="create-section-label">
              <span className="create-section-icon create-section-icon--rose"><Video size={14} /></span>
              Media
            </div>
            <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { handlePhotos(e.target.files); e.target.value = ''; }} />
            <input ref={videoRef} type="file" accept="video/*" multiple className="hidden" onChange={e => { handleVideos(e.target.files); e.target.value = ''; }} />
            <div className="flex gap-2">
              <button type="button" onClick={() => photoRef.current?.click()} className="text-xs font-bold text-sky-400 px-3 py-2 rounded-lg border border-sky-500/30 bg-sky-500/10">+ Ảnh ({data.photos.length})</button>
              <button type="button" onClick={() => videoRef.current?.click()} className="text-xs font-bold text-violet-400 px-3 py-2 rounded-lg border border-violet-500/30 bg-violet-500/10">+ Video ({data.videos.length})</button>
            </div>
            {(data.photos.length > 0 || data.videos.length > 0) && (
              <div className="grid grid-cols-3 gap-2">
                {data.photos.map(url => (
                  <div key={url} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removePhoto(url)} className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1 text-[10px]"><X size={10} /></button>
                  </div>
                ))}
                {data.videos.map(url => (
                  <div key={url} className="relative aspect-video rounded-lg overflow-hidden bg-black">
                    <video src={url} className="w-full h-full object-cover" muted />
                  </div>
                ))}
              </div>
            )}
            {uploadError && <p className="create-alert create-alert--error"><AlertCircle size={12} /> {uploadError}</p>}
          </div>

          <div className="create-panel create-panel--gold">
            <div className="create-section-label">
              <span className="create-section-icon create-section-icon--gold"><Globe size={14} /></span>
              Quyền riêng tư
            </div>
            <div className="flex gap-2">
              {([['public', 'Công khai', Globe], ['friends', 'Bạn bè', UserCheck], ['private', 'Riêng tư', Lock]] as const).map(([id, label, Icon]) => (
                <button key={id} type="button" onClick={() => onChange({ privacy: id })}
                  className={`create-chip flex-1 flex-col py-3 ${data.privacy === id ? 'create-chip--active border-[var(--gold)]/50 bg-[var(--gold-glow)] text-[var(--gold)]' : ''}`}>
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
          </div>

          {!isReady && <div className="create-alert create-alert--warn"><AlertCircle size={12} /> Cần tiêu đề, nội dung (≥30 ký tự) và danh mục</div>}
          {publishError && <div className="create-alert create-alert--error"><AlertCircle size={12} /> {publishError}</div>}
        </div>

        {showPreview && (
          <aside className="hidden lg:block create-preview-sticky">
            <p className="create-section-label"><Eye size={14} className="text-sky-400" /> Preview</p>
            <div className="create-preview-card">
              {data.coverImage ? <div className="h-40"><img src={data.coverImage} alt="" className="w-full h-full object-cover" /></div> : null}
              <div className="p-4 space-y-2">
                <p className="text-xs font-bold">{user?.fullName || 'Bạn'}</p>
                {cat && (
                  <span className="badge-category text-[10px] flex items-center gap-1 w-fit">
                    <cat.icon size={10} /> {cat.label}
                  </span>
                )}
                <h3 className="font-editorial font-bold">{data.title || 'Tiêu đề...'}</h3>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-3">{data.excerpt || data.content}</p>
              </div>
            </div>
            <div className="create-panel mt-3 !p-4">
              {[
                { label: 'Tiêu đề', ok: data.title.length >= 5 },
                { label: 'Nội dung', ok: data.content.length >= 30 },
                { label: 'Danh mục', ok: !!data.category },
              ].map(item => (
                <div key={item.label} className="create-checklist-item">
                  <div className={`create-checklist-dot ${item.ok ? 'create-checklist-dot--done' : ''}`}>{item.ok && <Check size={10} className="text-white" />}</div>
                  <span className="text-xs">{item.label}</span>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </CreatePageShell>
  );
}
