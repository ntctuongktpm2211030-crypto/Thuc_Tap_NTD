import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  MapPin, DollarSign, Users, Calendar,
  ChevronRight, ChevronLeft, Upload, X, Plus, Star, Globe,
  Lock, UserCheck, Clock,
  Check, Eye, Send, Loader2,
  Image as ImageIcon, Lightbulb, AlertCircle, Video, Navigation, Route, BookOpen, Sparkles,
} from 'lucide-react';
import JourneyRouteMap from '../../components/Map/JourneyRouteMap';
import { searchPlaces, type PlaceSearchResult } from '../../utils/geocodeUtils';
import { newRoutePoint, routeDestinationLabel, routePointRoleLabel, normalizeRoutePoint, type RoutePoint } from '../../types/route';
import CreatePageShell, { CreateSuccessScreen } from '../../components/create/CreatePageShell';
import JourneyProgressSidebar from '../../components/create/JourneyProgressSidebar';
import SectionHeader from '../../components/create/SectionHeader';
import IconChip from '../../components/create/IconChip';
import {
  JOURNEY_CATEGORIES, MOODS, TRANSPORTS, TIP_CATEGORIES, ACTIVITY_TYPES,
  WEATHER_OPTIONS, RATING_LABELS, JOURNEY_STEPS,
} from '../../config/modernIcons';
import { postsService, tripsService } from '../../services/smartTravel.service';
import type { RootState } from '../../store';
import {
  validateImage, validateVideo, createPreviewUrl, revokePreviewUrl,
  resolveMediaUrl, saveJourneyDraft, saveJourneyDraftAsync, loadJourneyDraftEnvelope,
  clearJourneyDraft, journeyDraftHasContent,
  MAX_PHOTOS, MAX_VIDEOS,
} from '../../utils/mediaUtils';
import type { PostDisplayType } from '../../utils/feedUtils';
import {
  FEED_DISPLAY_OPTIONS,
  estimateReadTime,
  journeyCategoryToFeedLabel,
  journeyStepCanAdvance,
  isJourneyReadyToPublish,
  getJourneyCompletionItems,
  classifyPostDisplay,
} from '../../utils/feedUtils';
import {
  DEFAULT_POST_STYLE,
  layoutIdToDisplayType,
  type PostLayoutId,
  type PostTypography,
  type PostTheme,
  type PostCardShape,
} from '../../config/postStylePresets';
import PostStyleCustomizer from '../../components/create/PostStyleCustomizer';
import JourneyPostPreview from '../../components/create/JourneyPostPreview';

// ──────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────
interface DayActivity {
  time: string;
  title: string;
  description: string;
  icon: string;
  cost?: string;
  routePointId?: string;
}

interface StoryDay {
  day: number;
  title: string;
  location: string;
  routePointId?: string;
  activities: DayActivity[];
}

interface TravelTip {
  id: string;
  category: string;
  content: string;
}

interface StoryData {
  // Kiểu hiển thị trên bảng tin
  displayType: PostDisplayType;
  layoutId: PostLayoutId;
  typography: PostTypography;
  theme: PostTheme;
  cardShape: PostCardShape;
  excerpt: string;
  requestFeatured: boolean;

  // Step 1 — Story
  title: string;
  content: string;
  mood: string;
  rating: number;
  privacy: 'public' | 'friends' | 'private';
  categories: string[];
  tags: string[];

  // Step 2 — Media
  coverImage: string;
  photos: string[];
  videos: string[];

  // Step 3 — Trip Details
  destination: string;
  latitude: number | null;
  longitude: number | null;
  locationAddress: string;
  routePoints: RoutePoint[];
  country: string;
  emoji: string;
  startDate: string;
  endDate: string;
  duration: number;
  budget: string;
  currency: string;
  travelStyle: string;
  companions: string;
  transport: string[];
  weather: string;

  // Step 4 — Itinerary
  days: StoryDay[];
  tips: TravelTip[];
}

// ──────────────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────────────
const TRAVEL_STYLES = ['Solo', 'Cặp đôi', 'Gia đình', 'Nhóm bạn', 'Công tác + Du lịch'];
const POPULAR_TAGS = ['#ThienNhien', '#AmThuc', '#PhieuLuu', '#NghiDuong', '#VanHoa', '#Budget', '#Luxury', '#SoloTravel', '#CouplesTrip', '#FamilyTrip', '#Backpacking', '#SunriseView'];

const STEP_HINTS: Record<number, string> = {
  1: 'Chọn bố cục hiển thị và điền nội dung phù hợp cho bài viết',
  2: 'Thêm ảnh bìa và các hình ảnh mô tả cho chuyến đi của bạn',
  3: 'Tìm điểm trên bản đồ, thêm các điểm di chuyển và nối tuyến đường',
  4: 'Lịch trình chi tiết và các mẹo du lịch hữu ích',
  5: 'Chọn dạng bài, kiểu chữ, màu sắc và xem trước trước khi đăng',
};

function getPostStyleFromData(data: StoryData) {
  return {
    layoutId: data.layoutId,
    typography: data.typography,
    theme: data.theme,
    cardShape: data.cardShape,
  };
}

function syncRouteToDestination(points: RoutePoint[]): Partial<StoryData> {
  if (points.length === 0) {
    return {
      routePoints: [],
      destination: '',
      latitude: null,
      longitude: null,
      locationAddress: '',
    };
  }
  const label = routeDestinationLabel(points);
  return {
    routePoints: points,
    destination: label,
    latitude: points[0].lat,
    longitude: points[0].lng,
    locationAddress: points.map(p => p.address || p.name).join(' → '),
  };
}

function toPublishFields(data: StoryData) {
  return {
    displayType: data.displayType,
    title: data.title,
    content: data.content,
    excerpt: data.excerpt,
    coverImage: data.coverImage,
    photos: data.photos,
    destination: data.destination,
    latitude: data.latitude,
    longitude: data.longitude,
    routePoints: data.routePoints.map(p => ({ name: p.name, address: p.address, lat: p.lat, lng: p.lng })),
    categories: data.categories,
    requestFeatured: data.requestFeatured,
  };
}

const DESTINATIONS = [
  { name: 'Hà Giang', country: 'Việt Nam', emoji: '🇻🇳', lat: 22.8233, lng: 104.9784 },
  { name: 'Sapa', country: 'Việt Nam', emoji: '🇻🇳', lat: 22.3364, lng: 103.8438 },
  { name: 'Hội An', country: 'Việt Nam', emoji: '🇻🇳', lat: 15.8801, lng: 108.3380 },
  { name: 'Đà Lạt', country: 'Việt Nam', emoji: '🇻🇳', lat: 11.9404, lng: 108.4583 },
  { name: 'Phú Quốc', country: 'Việt Nam', emoji: '🇻🇳', lat: 10.2899, lng: 103.9840 },
  { name: 'Ninh Bình', country: 'Việt Nam', emoji: '🇻🇳', lat: 20.2506, lng: 105.9745 },
  { name: 'Đà Nẵng', country: 'Việt Nam', emoji: '🇻🇳', lat: 16.0544, lng: 108.2022 },
  { name: 'Hà Nội', country: 'Việt Nam', emoji: '🇻🇳', lat: 21.0285, lng: 105.8542 },
  { name: 'Kyoto', country: 'Nhật Bản', emoji: '🇯🇵', lat: 35.0116, lng: 135.7681 },
  { name: 'Bali', country: 'Indonesia', emoji: '🇮🇩', lat: -8.4095, lng: 115.1889 },
  { name: 'Bangkok', country: 'Thái Lan', emoji: '🇹🇭', lat: 13.7563, lng: 100.5018 },
  { name: 'Singapore', country: 'Singapore', emoji: '🇸🇬', lat: 1.3521, lng: 103.8198 },
  { name: 'Paris', country: 'Pháp', emoji: '🇫🇷', lat: 48.8566, lng: 2.3522 },
];

// ──────────────────────────────────────────────────────────
// STEP 1 — STORY CONTENT
// ──────────────────────────────────────────────────────────
const Step1Story = ({
  data,
  onChange,
  onNext,
  canNext,
  onSaveDraft,
  draftSaved,
}: {
  data: StoryData;
  onChange: (d: Partial<StoryData>) => void;
  onNext: () => void;
  canNext: boolean;
  onSaveDraft: () => void;
  draftSaved: boolean;
}) => {
  const [tagInput, setTagInput] = useState('');
  const isSocial = data.displayType === 'social';
  const isMagazine = data.displayType === 'magazine';
  const isHero = data.displayType === 'hero';
  const minContent = isSocial ? 30 : 0;
  const minExcerpt = isHero ? 80 : 40;

  const toggleCategory = (id: string) => {
    const next = data.categories.includes(id)
      ? data.categories.filter(c => c !== id)
      : [...data.categories, id];
    onChange({ categories: next });
  };

  const addTag = (tag: string) => {
    const clean = tag.startsWith('#') ? tag : `#${tag}`;
    if (!data.tags.includes(clean)) onChange({ tags: [...data.tags, clean] });
    setTagInput('');
  };

  return (
    <div className="journey-notebook w-full transition-all duration-300">
      {/* LEFT PAGE OF NOTEBOOK */}
      <div className="journey-notebook-page-left space-y-6">
        <div>
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-1">
            <BookOpen size={16} className="text-[var(--gold)]" /> Bố cục hiển thị
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] mb-3">Chọn kiểu bài đăng hiển thị trên bảng tin</p>
          <div className="grid grid-cols-3 gap-3">
            {FEED_DISPLAY_OPTIONS.map(opt => {
              const selected = data.displayType === opt.id;
              const bgImages: Record<string, string> = {
                social: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
                magazine: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
                hero: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=400&q=80'
              };
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({
                    displayType: opt.id,
                    layoutId: opt.id as PostLayoutId,
                  })}
                  className={`display-option-card ${selected ? 'display-option-card-selected' : 'border-slate-200'}`}
                >
                  <div className="display-option-card-bg" style={{ backgroundImage: `url('${bgImages[opt.id]}')` }} />
                  <div className="display-option-card-overlay">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-blue-300 bg-black/25 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {opt.authorStyle}
                      </span>
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-black text-white">{opt.label}</h4>
                      <p className="text-[8px] text-slate-200 line-clamp-1 mt-0.5">{opt.description}</p>
                    </div>
                  </div>
                  {selected && (
                    <div className="absolute bottom-2 right-2 w-4.5 h-4.5 rounded-full bg-blue-500 flex items-center justify-center text-white border border-white shadow-sm z-10">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Headline / Excerpt / Content Form */}
        {(isMagazine || isHero) && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Tiêu đề (headline) *</label>
              <input 
                value={data.title} 
                onChange={e => onChange({ title: e.target.value })}
                placeholder={isHero
                  ? 'VD: Con đường đèo đẹp nhất thế giới: Hành trình Hà Giang Loop 4 ngày khó quên'
                  : 'VD: Chinh phục Fansipan: Bình minh sẽ thay đổi cuộc đời bạn'}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/20 transition-all shadow-sm" 
              />
              <div className="text-[10px] text-[var(--text-muted)] mt-1 text-right">{data.title.length}/150 ký tự</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">
                Tóm tắt (excerpt) * <span className="font-normal normal-case text-slate-400">— hiện trên thẻ bài</span>
              </label>
              <textarea 
                value={data.excerpt} 
                onChange={e => onChange({ excerpt: e.target.value })}
                rows={3}
                placeholder="Mô tả ngắn gọn, hấp dẫn — 2–3 câu khiến người đọc muốn mở bài…"
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/20 transition-all resize-none shadow-sm" 
              />
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
                <span>Tối thiểu {minExcerpt} ký tự</span>
                <span className={data.excerpt.length >= minExcerpt ? 'text-emerald-500 font-bold' : ''}>{data.excerpt.length} ký tự</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">
                Nội dung đầy đủ {isHero ? '(khuyến nghị)' : '(tuỳ chọn)'}
              </label>
              <textarea 
                value={data.content} 
                onChange={e => onChange({ content: e.target.value })}
                rows={5}
                placeholder="Chi tiết hành trình, kinh nghiệm, lịch trình gợi ý…"
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/20 transition-all resize-none shadow-sm" 
              />
              {isHero && (
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Bài nổi bật nên có nội dung phong phú (≥120 ký tự) hoặc tóm tắt dài.</p>
              )}
            </div>

            {isHero && (
              <label className="flex items-start gap-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={data.requestFeatured}
                  onChange={e => onChange({ requestFeatured: e.target.checked })}
                  className="mt-1 accent-amber-500"
                />
                <div>
                  <p className="text-xs font-bold text-slate-800">Đề cử Editor&apos;s Pick</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    Bài có thể hiển thị full-bleed như Minh Quân Nguyễn (ban biên tập duyệt).
                  </p>
                </div>
              </label>
            )}
          </div>
        )}

        {isSocial && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Nội dung chia sẻ *</label>
            <textarea 
              value={data.content} 
              onChange={e => onChange({ content: e.target.value })}
              rows={8}
              placeholder="VD: Vừa đến Hội An và tôi đã mê hoàn toàn! Mẹo nhỏ: thuê xe đạp (100k/ngày) và khám phá cánh đồng lúa lúc bình minh…"
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/20 transition-all resize-none shadow-sm" 
            />
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
              <span>Kiểu Linh Trần — caption ngắn, có thể kèm mẹo thực tế</span>
              <span className={data.content.length >= minContent ? 'text-emerald-500 font-bold' : ''}>{data.content.length} ký tự (≥{minContent})</span>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PAGE OF NOTEBOOK */}
      <div className="journey-notebook-page-right space-y-5">
        {/* Categories */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 flex items-center justify-between">
            <span>Danh mục {isSocial ? '(tuỳ chọn)' : '*'}</span>
            {data.categories.length > 0 && (
              <span className="text-[var(--gold)] normal-case font-bold text-[10px]">
                · {data.categories.length} đã chọn
              </span>
            )}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {JOURNEY_CATEGORIES.map(cat => {
              const selected = data.categories.includes(cat.id);
              const Icon = cat.icon;
              const accents: Record<string, { bg: string; text: string; border: string; bgSel: string }> = {
                violet: { bg: 'bg-violet-500/5', text: 'text-violet-500', border: 'border-violet-500/10', bgSel: 'bg-violet-500 text-white border-violet-600' },
                amber: { bg: 'bg-amber-500/5', text: 'text-amber-500', border: 'border-amber-500/10', bgSel: 'bg-amber-500 text-white border-amber-600' },
                rose: { bg: 'bg-rose-500/5', text: 'text-rose-500', border: 'border-rose-500/10', bgSel: 'bg-rose-500 text-white border-rose-600' },
                teal: { bg: 'bg-teal-500/5', text: 'text-teal-500', border: 'border-teal-500/10', bgSel: 'bg-teal-500 text-white border-teal-600' },
                sky: { bg: 'bg-sky-500/5', text: 'text-sky-500', border: 'border-sky-500/10', bgSel: 'bg-sky-500 text-white border-sky-600' },
                emerald: { bg: 'bg-emerald-500/5', text: 'text-emerald-500', border: 'border-emerald-500/10', bgSel: 'bg-emerald-500 text-white border-emerald-600' },
              };
              const colors = accents[cat.accent] || accents.violet;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                    selected 
                      ? `${colors.bgSel} shadow-sm` 
                      : `${colors.bg} ${colors.text} ${colors.border} hover:bg-slate-50 hover:border-slate-300`
                  }`}
                >
                  <div className={`p-1 rounded ${selected ? 'bg-white/25 text-white' : 'bg-white text-current shadow-sm'}`}>
                    <Icon size={12} />
                  </div>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Travel Mood */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Tâm trạng chuyến đi</label>
          <div className="flex flex-wrap gap-2.5">
            {MOODS.map(mood => {
              const selected = data.mood === mood.id;
              const Icon = mood.icon;
              return (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => onChange({ mood: mood.id })}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer relative group ${
                    selected
                      ? 'bg-[var(--gold)] text-white shadow-md scale-105'
                      : 'bg-white border border-slate-200 text-slate-500 hover:border-[var(--gold)] hover:text-[var(--gold)]'
                  }`}
                  title={mood.label}
                >
                  <Icon size={15} />
                  <span className="absolute bottom-full mb-1.5 px-2 py-0.5 bg-slate-800 text-[9px] font-bold text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                    {mood.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trip Rating */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Đánh giá chuyến đi</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button 
                key={n} 
                type="button" 
                onClick={() => onChange({ rating: n })}
                className="transition-all hover:scale-110 p-0.5 cursor-pointer"
              >
                <Star 
                  size={22} 
                  className={n <= data.rating ? 'text-amber-400 fill-current' : 'text-slate-200'} 
                  strokeWidth={1.5} 
                />
              </button>
            ))}
            {data.rating > 0 && RATING_LABELS[data.rating] && (
              <span className="ml-2 text-xs font-bold text-[var(--gold)]">
                {RATING_LABELS[data.rating].text}
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Thẻ từ khóa</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {data.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--gold-glow)] border border-[var(--gold)]/20 rounded-full text-[10px] font-bold text-[var(--gold)] font-mono">
                {tag}
                <button onClick={() => onChange({ tags: data.tags.filter(t => t !== tag) })} className="hover:text-rose-500 transition-colors">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-1.5 mb-2">
            <input 
              value={tagInput} 
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && tagInput.trim() && addTag(tagInput.trim())}
              placeholder="Nhập thẻ và nhấn Enter…"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[var(--gold)] shadow-sm" 
            />
            <button 
              onClick={() => tagInput.trim() && addTag(tagInput.trim())} 
              type="button"
              className="bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-all"
            >
              Thêm
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {POPULAR_TAGS.filter(t => !data.tags.includes(t)).slice(0, 6).map(tag => (
              <button 
                key={tag} 
                type="button" 
                onClick={() => addTag(tag)}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-100 text-slate-400 hover:border-[var(--gold)] hover:text-[var(--gold)] hover:bg-slate-50 transition-all cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Quyền riêng tư</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: 'public', label: 'Công khai', icon: Globe, desc: 'Mọi người' },
              { id: 'friends', label: 'Bạn bè', icon: UserCheck, desc: 'Người theo dõi' },
              { id: 'private', label: 'Riêng tư', icon: Lock, desc: 'Chỉ mình tôi' },
            ] as const).map(opt => {
              const Icon = opt.icon;
              const selected = data.privacy === opt.id;
              return (
                <button 
                  key={opt.id} 
                  type="button" 
                  onClick={() => onChange({ privacy: opt.id })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    selected 
                      ? 'border-[var(--gold)] bg-[var(--gold-glow)] text-[var(--gold)] font-bold shadow-sm' 
                      : 'border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Icon size={15} />
                  <span className="text-[10px] font-bold mt-0.5">{opt.label}</span>
                  <span className="text-[8px] opacity-75 hidden sm:block">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Alert / Warnings inside Notebook */}
        {!canNext && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-700 font-semibold flex items-start gap-1.5 animate-pulse">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>
              {isSocial && 'Vui lòng nhập nội dung chia sẻ (≥30 ký tự)'}
              {isMagazine && 'Vui lòng nhập tiêu đề, tóm tắt (≥40 ký tự) và chọn nhất 1 danh mục'}
              {isHero && 'Vui lòng nhập tiêu đề, tóm tắt (≥80 ký tự) và chọn nhất 1 danh mục'}
            </span>
          </div>
        )}

        {/* BOOK FOOTER NAVIGATION */}
        <div className="pt-4 border-t border-slate-200/60 mt-4 flex items-center justify-between gap-3 select-none">
          <button 
            type="button" 
            onClick={onSaveDraft}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            <Sparkles size={12} className="text-amber-500" /> {draftSaved ? 'Đã lưu!' : 'Lưu bản nháp'}
          </button>
          
          <span className="text-xs font-bold text-slate-400">1 / 5</span>

          <button 
            type="button" 
            onClick={onNext} 
            disabled={!canNext}
            className="px-5 py-2 bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer active:scale-95"
          >
            Tiếp theo <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// STEP 2 — PHOTOS & VIDEOS
// ──────────────────────────────────────────────────────────
const Step2Photos = ({ data, onChange }: { data: StoryData; onChange: (d: Partial<StoryData>) => void }) => {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState('');
  const isSocial = data.displayType === 'social';
  const maxPhotos = isSocial ? 3 : 10;

  const handleCoverSelect = (files: FileList | null) => {
    if (!files?.[0]) return;
    const err = validateImage(files[0]);
    if (err) { setUploadError(err); return; }
    setUploadError('');
    if (data.coverImage.startsWith('blob:')) revokePreviewUrl(data.coverImage);
    onChange({ coverImage: createPreviewUrl(files[0]) });
  };

  const handlePhotosSelect = (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = maxPhotos - data.photos.length;
    if (remaining <= 0) { setUploadError(`Tối đa ${maxPhotos} ảnh`); return; }
    const newPhotos: string[] = [];
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const err = validateImage(files[i]);
      if (err) { setUploadError(err); continue; }
      newPhotos.push(createPreviewUrl(files[i]));
    }
    if (newPhotos.length) {
      setUploadError('');
      const updated = [...data.photos, ...newPhotos];
      onChange({
        photos: updated,
        coverImage: data.coverImage || newPhotos[0],
      });
    }
  };

  const handleVideosSelect = (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = MAX_VIDEOS - data.videos.length;
    if (remaining <= 0) { setUploadError(`Tối đa ${MAX_VIDEOS} video`); return; }
    const newVideos: string[] = [];
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const err = validateVideo(files[i]);
      if (err) { setUploadError(err); continue; }
      newVideos.push(createPreviewUrl(files[i]));
    }
    if (newVideos.length) {
      setUploadError('');
      onChange({ videos: [...data.videos, ...newVideos] });
    }
  };

  const removePhoto = (url: string) => {
    revokePreviewUrl(url);
    const photos = data.photos.filter(p => p !== url);
    onChange({
      photos,
      coverImage: data.coverImage === url ? (photos[0] || '') : data.coverImage,
    });
  };

  const removeVideo = (url: string) => {
    revokePreviewUrl(url);
    onChange({ videos: data.videos.filter(v => v !== url) });
  };

  const setAsCover = (url: string) => onChange({ coverImage: url });

  return (
    <div className="journey-step-content animate-fade-in">
      <SectionHeader
        icon={ImageIcon}
        title={isSocial ? 'Ảnh chia sẻ hành trình' : 'Ảnh bìa & album hình ảnh'}
        subtitle={isSocial ? 'Chọn tối đa 3 ảnh hiển thị trên bảng tin' : 'Ảnh bìa bắt buộc và album tối đa 10 ảnh'}
        accent="gold"
      />

      <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { handleCoverSelect(e.target.files); e.target.value = ''; }} />
      <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => { handlePhotosSelect(e.target.files); e.target.value = ''; }} />
      <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden"
        onChange={e => { handleVideosSelect(e.target.files); e.target.value = ''; }} />

      {/* Cover image — magazine / hero */}
      {!isSocial && (
      <div>
        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
          Ảnh bìa *
          <span className="ml-2 text-[10px] font-normal text-[var(--text-muted)] normal-case">Hiển thị trên thẻ magazine / hero</span>
        </label>
        {data.coverImage ? (
          <div className="relative rounded-2xl overflow-hidden h-48 sm:h-64 group">
            <img src={data.coverImage} alt="cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-3">
              <button type="button" onClick={() => coverInputRef.current?.click()}
                className="opacity-0 group-hover:opacity-100 transition-all bg-[var(--gold)] text-black rounded-full px-4 py-2 text-xs font-bold">
                Đổi ảnh bìa
              </button>
              <button type="button" onClick={() => {
                if (data.coverImage.startsWith('blob:')) revokePreviewUrl(data.coverImage);
                onChange({ coverImage: '' });
              }}
                className="opacity-0 group-hover:opacity-100 transition-all bg-rose-500 text-white rounded-full p-2 hover:scale-110">
                <X size={16} />
              </button>
            </div>
            <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">Ảnh bìa</div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-[var(--border-normal)] rounded-2xl p-8 text-center hover:border-[var(--gold)] transition-colors cursor-pointer group"
            onClick={() => coverInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleCoverSelect(e.dataTransfer.files); }}>
            <Upload size={32} className="mx-auto mb-3 text-[var(--text-muted)] group-hover:text-[var(--gold)] transition-colors" />
            <p className="text-sm font-semibold text-[var(--text-secondary)] mb-1">Kéo thả hoặc nhấn để chọn ảnh bìa</p>
            <p className="text-xs text-[var(--text-muted)]">JPG, PNG, WEBP — Tối đa 10MB</p>
          </div>
        )}
      </div>
      )}

      {/* Photo gallery */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
            {isSocial ? `Ảnh chia sẻ (${data.photos.length}/${maxPhotos}) *` : `Album ảnh (${data.photos.length}/${maxPhotos})`}
          </label>
          <button type="button" onClick={() => photoInputRef.current?.click()}
            className="text-[11px] font-bold text-[var(--gold)] hover:underline flex items-center gap-1">
            <Plus size={12} /> Thêm ảnh
          </button>
        </div>

        {data.photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.photos.map((url, i) => {
              const isCover = data.coverImage === url;
              return (
                <div key={url} className="relative rounded-xl overflow-hidden aspect-square group">
                  <img src={url} alt={`photo ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {!isCover && (
                      <button type="button" onClick={() => setAsCover(url)}
                        className="bg-[var(--gold)] text-black text-[10px] font-bold px-2 py-1 rounded-full">
                        Làm bìa
                      </button>
                    )}
                    <button type="button" onClick={() => removePhoto(url)}
                      className="bg-rose-500 text-white rounded-full p-1.5">
                      <X size={12} />
                    </button>
                  </div>
                  {isCover && (
                    <div className="absolute bottom-2 left-2 bg-[var(--gold)] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">Bìa</div>
                  )}
                </div>
              );
            })}
            {data.photos.length < maxPhotos && (
              <button type="button" onClick={() => photoInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-[var(--border-normal)] flex flex-col items-center justify-center gap-2 hover:border-[var(--gold)] transition-colors group">
                <Plus size={24} className="text-[var(--text-muted)] group-hover:text-[var(--gold)]" />
                <span className="text-xs text-[var(--text-muted)]">Thêm ảnh</span>
              </button>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed border-[var(--border-normal)] rounded-2xl p-6 text-center cursor-pointer hover:border-[var(--gold)] transition-colors"
            onClick={() => photoInputRef.current?.click()}>
            <ImageIcon size={28} className="mx-auto mb-2 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-secondary)]">Thêm ảnh hành trình của bạn</p>
          </div>
        )}
      </div>

      {/* Videos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
            <Video size={14} /> Video hành trình ({data.videos.length}/{MAX_VIDEOS})
          </label>
          <button type="button" onClick={() => videoInputRef.current?.click()}
            className="text-[11px] font-bold text-violet-400 hover:underline flex items-center gap-1">
            <Plus size={12} /> Thêm video
          </button>
        </div>

        {data.videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.videos.map((url, i) => (
              <div key={url} className="relative rounded-xl overflow-hidden aspect-video bg-black group">
                <video src={url} className="w-full h-full object-cover" controls muted />
                <button type="button" onClick={() => removeVideo(url)}
                  className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={12} />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                  Video {i + 1}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-violet-500/30 rounded-2xl p-6 text-center cursor-pointer hover:border-violet-500/60 transition-colors bg-violet-500/5"
            onClick={() => videoInputRef.current?.click()}>
            <Video size={28} className="mx-auto mb-2 text-violet-400" />
            <p className="text-sm text-[var(--text-secondary)]">Thêm video khoảnh khắc đáng nhớ</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">MP4, WEBM, MOV — Tối đa 100MB</p>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 text-rose-400 text-xs p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
          <AlertCircle size={14} /> {uploadError}
        </div>
      )}

      {/* Photo tips */}
      <div className="p-4 bg-sky-500/8 border border-sky-500/20 rounded-xl">
        <div className="flex items-start gap-2">
          <Lightbulb size={15} className="text-sky-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-sky-300 mb-1">Tips để ảnh & video thu hút</p>
            <ul className="text-[11px] text-[var(--text-muted)] space-y-0.5 list-disc list-inside">
              <li>Dùng ảnh ngang (landscape) cho ảnh bìa</li>
              <li>Video ngắn 15–60 giây thường được tương tác nhiều hơn</li>
              <li>Kết hợp cảnh rộng, cận cảnh và khoảnh khắc con người</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// STEP 3 — TRIP DETAILS
// ──────────────────────────────────────────────────────────
const Step3Details = ({ data, onChange }: { data: StoryData; onChange: (d: Partial<StoryData>) => void }) => {
  const [destSearch, setDestSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [addedFlash, setAddedFlash] = useState('');
  const [mapResults, setMapResults] = useState<PlaceSearchResult[]>([]);
  const [mapQuery, setMapQuery] = useState('');
  const [showSearchPanel, setShowSearchPanel] = useState(true);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPointOnRoute = (lat: number, lng: number) =>
    data.routePoints.some(p => Math.abs(p.lat - lat) < 0.0002 && Math.abs(p.lng - lng) < 0.0002);

  const filteredDest = destSearch.length >= 1
    ? DESTINATIONS.filter(d =>
        d.name.toLowerCase().includes(destSearch.toLowerCase()) ||
        d.country.toLowerCase().includes(destSearch.toLowerCase()),
      )
    : [];

  const addPoint = (name: string, lat: number, lng: number, address: string) => {
    const pt = newRoutePoint(name, lat, lng, address);
    onChange(syncRouteToDestination([...data.routePoints, pt]));
    setHighlightId(pt.id);
    setAddedFlash(pt.name);
    setTimeout(() => setAddedFlash(''), 2500);
  };

  const selectDest = (d: typeof DESTINATIONS[0]) => {
    onChange({ country: d.country, emoji: d.emoji });
    const addr = `${d.name}, ${d.country}`;
    addPoint(d.name, d.lat, d.lng, addr);
  };

  const selectRemote = (r: PlaceSearchResult) => {
    addPoint(r.name, r.lat, r.lng, r.displayName);
  };

  const handleSearchChange = (value: string) => {
    setDestSearch(value);
    setShowSearchPanel(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (value.trim().length < 2) {
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      const q = value.trim();
      setMapQuery(q);
      const results = await searchPlaces(value);
      setMapResults(results);
      setSearching(false);
    }, 450);
  };

  const displayMapResults = mapResults;
  const displayMapQuery = mapQuery;
  const showPanel =
    showSearchPanel &&
    (destSearch.length >= 1 || displayMapResults.length > 0 || searching || displayMapQuery.length >= 2);

  const handleRouteChange = (points: RoutePoint[]) => {
    onChange(syncRouteToDestination(points));
  };

  const removePoint = (id: string) => {
    handleRouteChange(data.routePoints.filter(p => p.id !== id));
  };

  const movePoint = (idx: number, dir: -1 | 1) => {
    const next = [...data.routePoints];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    handleRouteChange(next);
  };

  const hasSearchPanel = showPanel;

  return (
    <div className="journey-step-content animate-fade-in">
      <div>
        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">
          Tìm địa điểm cụ thể trên bản đồ *
        </label>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Gõ địa chỉ / địa danh → chọn kết quả → kiểm tra trên map. <strong>Điểm 1 = vị trí bắt đầu</strong>, các điểm sau nối bằng tuyến đường thực.
        </p>
        <div className="journey-location-search-wrap">
          <MapPin size={18} className="journey-location-search-icon text-[var(--gold)]" />
          <input
            value={destSearch}
            onChange={e => handleSearchChange(e.target.value)}
            onFocus={() => setShowSearchPanel(true)}
            placeholder="VD: 28 Phố cổ Hội An, Chùa Cầu, Fansipan…"
            className="journey-location-search-input"
          />
          {searching && <Loader2 size={16} className="journey-location-search-spinner animate-spin text-[var(--gold)]" />}
        </div>

        {addedFlash && (
          <p className="mt-2 text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <Check size={14} /> Đã thêm: {addedFlash}
          </p>
        )}

        {hasSearchPanel && (
          <div className="journey-search-results-panel mt-3">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Kết quả tìm kiếm</span>
              <button
                type="button"
                className="text-[10px] text-[var(--text-muted)] hover:text-[var(--gold)]"
                onClick={() => setShowSearchPanel(false)}
              >
                Thu gọn
              </button>
            </div>
            {searching && (
              <p className="px-3 py-2 text-xs text-[var(--text-muted)] flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Đang tìm &quot;{destSearch.trim()}&quot; trên bản đồ…
              </p>
            )}
            {!searching && displayMapQuery && displayMapResults.length === 0 && destSearch.trim().length >= 2 && (
              <p className="px-3 py-3 text-xs text-[var(--text-muted)]">Không tìm thấy — thử tên đường hoặc địa danh cụ thể hơn</p>
            )}
            {filteredDest.length > 0 && destSearch.length >= 1 && (
              <>
                <p className="journey-search-results-heading">Gợi ý phổ biến</p>
                {filteredDest.slice(0, 5).map(d => (
                  <button key={d.name} type="button" onClick={() => selectDest(d)} className="journey-search-result-row">
                    <span className="journey-search-result-icon journey-search-result-icon--gold"><Globe size={16} /></span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{d.name}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{d.country}</p>
                    </div>
                  </button>
                ))}
              </>
            )}
            {displayMapResults.length > 0 && (
              <>
                <p className="journey-search-results-heading border-t border-[var(--border-subtle)]">
                  Kết quả bản đồ {displayMapQuery ? `· "${displayMapQuery}"` : ''} ({displayMapResults.length})
                </p>
                {displayMapResults.map((r, i) => {
                  const added = isPointOnRoute(r.lat, r.lng);
                  return (
                    <button
                      key={`${r.lat}-${i}`}
                      type="button"
                      onClick={() => !added && selectRemote(r)}
                      className={`journey-search-result-row ${added ? 'journey-search-result-row--added' : ''}`}
                    >
                      <span className="journey-search-result-icon journey-search-result-icon--emerald"><Navigation size={16} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{r.name}</p>
                        <p className="text-[11px] text-[var(--text-muted)] leading-snug">{r.displayName}</p>
                      </div>
                      {added && <span className="text-[10px] font-bold text-emerald-400 flex-shrink-0">✓ Đã thêm</span>}
                    </button>
                  );
                })}
              </>
            )}
            {destSearch.length >= 1 && displayMapResults.length === 0 && !searching && filteredDest.length === 0 && (
              <p className="px-3 py-3 text-xs text-[var(--text-muted)]">Gõ ít nhất 2 ký tự để tìm trên bản đồ</p>
            )}
          </div>
        )}
        {!showSearchPanel && (displayMapResults.length > 0 || destSearch.length >= 1) && (
          <button type="button" className="text-xs text-[var(--gold)] font-semibold mt-2" onClick={() => setShowSearchPanel(true)}>
            Hiện lại kết quả tìm kiếm
          </button>
        )}

        {data.destination && (
          <p className="mt-3 text-xs text-[var(--gold)] font-semibold flex items-center gap-1.5">
            <Route size={14} /> {data.destination}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 flex items-center gap-2">
          <Navigation size={14} className="text-emerald-400" /> Bản đồ hành trình *
        </label>
        <JourneyRouteMap
          points={data.routePoints}
          interactive
          onPointsChange={handleRouteChange}
          highlightId={highlightId}
          height="380px"
        />
      </div>

      {data.routePoints.length > 0 && (
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
            Các điểm di chuyển ({data.routePoints.length})
          </label>
          {data.routePoints.map((pt, idx) => (
            <div
              key={pt.id}
              className={`journey-route-point-row ${highlightId === pt.id ? 'journey-route-point-row--active' : ''}`}
              onMouseEnter={() => setHighlightId(pt.id)}
            >
              <span className={`journey-route-point-badge ${idx === 0 ? 'journey-route-point-badge--start' : idx === data.routePoints.length - 1 && data.routePoints.length > 1 ? 'journey-route-point-badge--end' : ''}`}>
                {idx === 0 ? '▶' : idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gold)] mb-0.5">
                  {routePointRoleLabel(idx, data.routePoints.length)}
                </p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{pt.name}</p>
                <p className="text-[11px] text-[var(--text-muted)] leading-snug mt-0.5">{pt.address}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button type="button" disabled={idx === 0} onClick={() => movePoint(idx, -1)}
                  className="w-7 h-7 rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--gold)] disabled:opacity-30 text-xs">↑</button>
                <button type="button" disabled={idx === data.routePoints.length - 1} onClick={() => movePoint(idx, 1)}
                  className="w-7 h-7 rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--gold)] disabled:opacity-30 text-xs">↓</button>
                <button type="button" onClick={() => removePoint(pt.id)}
                  className="w-7 h-7 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10">
                  <X size={14} className="mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Ngày bắt đầu</label>
          <div className="relative">
            <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="date" value={data.startDate} onChange={e => onChange({ startDate: e.target.value })}
              className="input-premium pl-10 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Ngày kết thúc</label>
          <div className="relative">
            <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="date" value={data.endDate} onChange={e => onChange({ endDate: e.target.value })}
              className="input-premium pl-10 text-sm" />
          </div>
        </div>
      </div>

      {/* Duration calc */}
      {data.startDate && data.endDate && (
        <div className="flex items-center gap-2 p-3 bg-[var(--gold-glow)] border border-[var(--gold)]/30 rounded-xl">
          <Clock size={15} className="text-[var(--gold)]" />
          <span className="text-sm font-semibold text-[var(--gold)]">
            Tổng thời gian: {Math.max(1, Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / 86400000) + 1)} ngày{' '}
            {Math.max(0, Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / 86400000))} đêm
          </span>
        </div>
      )}

      {/* Budget */}
      <div>
        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Ngân sách tổng</label>
        <div className="flex gap-2">
          <div className="input-premium flex items-center p-0 gap-0 overflow-hidden focus-within:border-[var(--gold)] focus-within:ring-2 focus-within:ring-[var(--gold-glow)] transition-all w-full">
            <div className="pl-3 text-[var(--text-muted)] flex-shrink-0 flex items-center justify-center">
              <DollarSign size={15} />
            </div>
            <input type="number" value={data.budget} onChange={e => onChange({ budget: e.target.value })}
              placeholder="5,000,000"
              className="w-full bg-transparent border-none outline-none py-3 pl-2 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
            <div className="h-6 w-[1px] bg-slate-300 dark:bg-slate-700 flex-shrink-0"></div>
            <select value={data.currency} onChange={e => onChange({ currency: e.target.value })}
              className="bg-transparent border-none outline-none py-3 pl-3 pr-8 text-sm text-[var(--text-primary)] w-28 cursor-pointer flex-shrink-0">
              <option value="VND">VND ₫</option>
              <option value="USD">USD $</option>
              <option value="JPY">JPY ¥</option>
              <option value="EUR">EUR €</option>
            </select>
          </div>
        </div>
      </div>

      {/* Travel style */}
      <div>
        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Hình thức đi</label>
        <div className="flex flex-wrap gap-2">
          {TRAVEL_STYLES.map(style => (
            <button key={style} type="button" onClick={() => onChange({ companions: style })}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all
                ${data.companions === style
                  ? 'border-[var(--gold)] bg-[var(--gold-glow)] text-[var(--gold)]'
                  : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-normal)]'}`}>
              <Users size={13} />
              {style}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Phương tiện di chuyển</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TRANSPORTS.map(t => (
            <IconChip key={t.id} icon={t.icon} label={t.label} accent="gold"
              selected={data.transport.includes(t.id)}
              onClick={() => onChange({
                transport: data.transport.includes(t.id)
                  ? data.transport.filter(x => x !== t.id)
                  : [...data.transport, t.id],
              })} />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Thời tiết khi đến</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {WEATHER_OPTIONS.map(w => (
            <IconChip key={w.id} icon={w.icon} label={w.label} accent="sky"
              selected={data.weather === w.id}
              onClick={() => onChange({ weather: w.id })} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// STEP 4 — ITINERARY & TIPS
// ──────────────────────────────────────────────────────────
const Step4Itinerary = ({ data, onChange }: { data: StoryData; onChange: (d: Partial<StoryData>) => void }) => {
  const isSocial = data.displayType === 'social';
  const routePoints = data.routePoints;

  const getRoutePoint = (id?: string, dayIdx = 0) => {
    if (!routePoints.length) return undefined;
    if (id) return routePoints.find(p => p.id === id);
    return routePoints[dayIdx % routePoints.length];
  };

  const addDay = () => {
    const n = data.days.length + 1;
    const pt = getRoutePoint(undefined, data.days.length);
    const newDay: StoryDay = {
      day: n,
      title: `Ngày ${n}`,
      location: pt?.name ?? '',
      routePointId: pt?.id,
      activities: [],
    };
    onChange({ days: [...data.days, newDay] });
  };

  const addDaysFromRoute = () => {
    if (!routePoints.length) return;
    const existing = new Set(data.days.map(d => d.routePointId).filter(Boolean));
    const toAdd = routePoints.filter(p => !existing.has(p.id));
    if (!toAdd.length) {
      addDay();
      return;
    }
    const newDays: StoryDay[] = toAdd.map((pt, i) => ({
      day: data.days.length + i + 1,
      title: `Ngày ${data.days.length + i + 1}`,
      location: pt.name,
      routePointId: pt.id,
      activities: [],
    }));
    onChange({ days: [...data.days, ...newDays].map((d, i) => ({ ...d, day: i + 1 })) });
  };

  const setDayRoutePoint = (dayIdx: number, pointId: string) => {
    const pt = routePoints.find(p => p.id === pointId);
    const days = [...data.days];
    days[dayIdx] = {
      ...days[dayIdx],
      routePointId: pointId,
      location: pt?.name ?? days[dayIdx].location,
    };
    onChange({ days });
  };

  const addActivity = (dayIdx: number) => {
    const newAct: DayActivity = {
      time: '08:00',
      title: '',
      description: '',
      icon: 'place',
    };
    const days = [...data.days];
    days[dayIdx] = { ...days[dayIdx], activities: [...days[dayIdx].activities, newAct] };
    onChange({ days });
  };

  const updateActivity = (dayIdx: number, actIdx: number, field: keyof DayActivity, value: string) => {
    const days = [...data.days];
    days[dayIdx].activities[actIdx] = { ...days[dayIdx].activities[actIdx], [field]: value };
    onChange({ days });
  };

  const updateActivityType = (dayIdx: number, actIdx: number, iconId: string) => {
    const type = ACTIVITY_TYPES.find(a => a.id === iconId);
    const days = [...data.days];
    const act = { ...days[dayIdx].activities[actIdx], icon: iconId };
    if (type && !act.title.trim()) act.title = type.label;
    days[dayIdx].activities[actIdx] = act;
    onChange({ days });
  };

  const getActivityIcon = (id: string) => ACTIVITY_TYPES.find(a => a.id === id)?.icon ?? MapPin;

  const removeActivity = (dayIdx: number, actIdx: number) => {
    const days = [...data.days];
    days[dayIdx].activities.splice(actIdx, 1);
    onChange({ days });
  };

  const addTip = () => {
    onChange({ tips: [...data.tips, { id: Date.now().toString(), category: 'general', content: '' }] });
  };

  const updateTip = (id: string, field: keyof TravelTip, value: string) => {
    onChange({ tips: data.tips.map(t => t.id === id ? { ...t, [field]: value } : t) });
  };

  const removeTip = (id: string) => {
    onChange({ tips: data.tips.filter(t => t.id !== id) });
  };

  return (
    <div className="journey-step-content animate-fade-in">
      {isSocial && (
        <div className="journey-alert journey-alert--info mb-4 flex items-start gap-2">
          <Lightbulb size={15} className="flex-shrink-0 mt-0.5 text-[var(--gold)]" />
          <p className="text-xs text-[var(--text-secondary)]">
            Kiểu <strong>Chia sẻ nhanh</strong> — bước này tuỳ chọn. Bạn có thể bỏ qua và đăng ngay sau bước xem trước.
          </p>
        </div>
      )}
      {/* Itinerary */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-[var(--text-primary)]">Lịch trình từng ngày</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {routePoints.length > 0
                ? `Gắn hoạt động theo ${routePoints.length} điểm đã chọn trên tuyến`
                : isSocial
                  ? 'Tuỳ chọn — không bắt buộc với chia sẻ nhanh'
                  : 'Chi tiết hành trình sẽ giúp người đọc lên kế hoạch theo'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {routePoints.length > 0 && (
              <button type="button" onClick={addDaysFromRoute}
                className="btn-outline text-xs px-4 py-2 flex items-center gap-1.5">
                <MapPin size={13} /> Tạo theo tuyến
              </button>
            )}
            <button type="button" onClick={addDay}
              className="btn-gold text-xs px-4 py-2 flex items-center gap-1.5">
              <Plus size={13} /> Thêm ngày
            </button>
          </div>
        </div>

        {routePoints.length > 0 && (
          <div className="journey-route-chips mb-4">
            {routePoints.map((pt, i) => (
              <span key={pt.id} className="journey-route-chip">
                <span className="journey-route-chip__num">{i === 0 ? '▶' : i + 1}</span>
                {pt.name}
              </span>
            ))}
          </div>
        )}

        {data.days.length === 0 ? (
          <button type="button" onClick={addDay}
            className="w-full border-2 border-dashed border-[var(--border-normal)] rounded-2xl p-8 text-center hover:border-[var(--gold)] transition-colors group">
            <Calendar size={32} className="mx-auto mb-3 text-[var(--text-muted)] group-hover:text-[var(--gold)] transition-colors" />
            <p className="text-sm font-semibold text-[var(--text-secondary)]">Thêm lịch trình ngày đầu tiên</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Bổ sung chi tiết từng hoạt động trong ngày</p>
          </button>
        ) : (
          <div className="space-y-4">
            {data.days.map((day, dayIdx) => (
              <div key={dayIdx} className="card-editorial overflow-hidden">
                <div className="journey-day-header">
                  <div className="journey-day-badge">{dayIdx + 1}</div>
                  <div className="journey-day-header-fields">
                    <input
                      value={day.title}
                      onChange={e => {
                        const days = [...data.days];
                        days[dayIdx].title = e.target.value;
                        onChange({ days });
                      }}
                      placeholder={`Ngày ${dayIdx + 1}`}
                      className="input-premium py-2 text-sm font-semibold min-w-0"
                    />
                    {routePoints.length > 0 ? (
                      <select
                        value={day.routePointId ?? ''}
                        onChange={e => setDayRoutePoint(dayIdx, e.target.value)}
                        className="input-premium py-2 text-sm min-w-0"
                        aria-label="Khu vực trong ngày"
                      >
                        <option value="">Chọn khu vực…</option>
                        {routePoints.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={day.location}
                        onChange={e => {
                          const days = [...data.days];
                          days[dayIdx].location = e.target.value;
                          onChange({ days });
                        }}
                        placeholder="Khu vực / địa điểm…"
                        className="input-premium py-2 text-sm min-w-0"
                      />
                    )}
                  </div>
                  <button type="button" onClick={() => {
                    const days = data.days.filter((_, i) => i !== dayIdx).map((d, i) => ({ ...d, day: i + 1 }));
                    onChange({ days });
                  }} className="journey-day-remove text-[var(--text-muted)] hover:text-rose-400 transition-colors">
                    <X size={16} />
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  {day.activities.map((act, actIdx) => {
                    const ActIcon = getActivityIcon(act.icon);
                    return (
                      <div key={actIdx} className="journey-activity-card group">
                        <div className="journey-activity-type-col">
                          <div className="journey-activity-icon-badge" aria-hidden>
                            <ActIcon size={16} strokeWidth={2} />
                          </div>
                          <select
                            value={act.icon}
                            onChange={e => updateActivityType(dayIdx, actIdx, e.target.value)}
                            className="input-premium journey-activity-type-select"
                            aria-label="Loại hoạt động"
                          >
                            {ACTIVITY_TYPES.map(a => (
                              <option key={a.id} value={a.id}>{a.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="journey-activity-card__body">
                          <div className="journey-activity-row-primary">
                            <input
                              type="time"
                              value={act.time}
                              onChange={e => updateActivity(dayIdx, actIdx, 'time', e.target.value)}
                              className="input-premium journey-activity-time"
                              aria-label="Giờ"
                            />
                            <input
                              value={act.title}
                              onChange={e => updateActivity(dayIdx, actIdx, 'title', e.target.value)}
                              placeholder="Chi tiết (tuỳ chọn)…"
                              className="input-premium journey-activity-title"
                            />
                            <input
                              value={act.cost || ''}
                              onChange={e => updateActivity(dayIdx, actIdx, 'cost', e.target.value)}
                              placeholder="Chi phí"
                              className="input-premium journey-activity-cost"
                            />
                          </div>
                          <input
                            value={act.description}
                            onChange={e => updateActivity(dayIdx, actIdx, 'description', e.target.value)}
                            placeholder="Mô tả ngắn (tuỳ chọn)…"
                            className="input-premium journey-activity-desc"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeActivity(dayIdx, actIdx)}
                          className="journey-activity-remove"
                          aria-label="Xóa hoạt động"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}

                  <button type="button" onClick={() => addActivity(dayIdx)}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-[var(--border-normal)] rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all">
                    <Plus size={13} /> Thêm hoạt động
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Travel Tips */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Lightbulb size={16} className="text-[var(--gold)]" /> Mẹo du lịch
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Chia sẻ kinh nghiệm quý giá cho người đọc</p>
          </div>
          <button type="button" onClick={addTip}
            className="btn-outline text-xs px-4 py-2 flex items-center gap-1.5">
            <Plus size={13} /> Thêm mẹo
          </button>
        </div>

        {data.tips.length === 0 ? (
          <div className="p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl text-center">
            <AlertCircle size={20} className="mx-auto mb-2 text-amber-400" />
            <p className="text-sm text-[var(--text-secondary)]">Chưa có mẹo nào — hãy chia sẻ kinh nghiệm!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.tips.map(tip => (
              <div key={tip.id} className="journey-tip-card group">
                <select
                  value={tip.category}
                  onChange={e => updateTip(tip.id, 'category', e.target.value)}
                  className="input-premium journey-tip-category"
                  aria-label="Loại mẹo"
                >
                  {TIP_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
                <input
                  value={tip.content}
                  onChange={e => updateTip(tip.id, 'content', e.target.value)}
                  placeholder="Mẹo du lịch của bạn…"
                  className="input-premium journey-tip-content"
                />
                <button
                  type="button"
                  onClick={() => removeTip(tip.id)}
                  className="journey-tip-remove"
                  aria-label="Xóa mẹo"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// STEP 5 — PREVIEW & STYLE
// ──────────────────────────────────────────────────────────
const Step5Preview = ({ data, onChange }: { data: StoryData; onChange: (d: Partial<StoryData>) => void }) => {
  const catLabel = data.categories.length
    ? data.categories.map(c => journeyCategoryToFeedLabel(c)).join(' · ')
    : 'Du lịch';
  const destLabel = data.destination
    ? `${data.emoji ? `${data.emoji} ` : ''}${data.destination}${data.country ? `, ${data.country}` : ''}`
    : '';
  const previewImages = data.photos.length > 0 ? data.photos : (data.coverImage ? [data.coverImage] : []);
  const resolvedType = classifyPostDisplay({
    isFeatured: data.requestFeatured,
    headline: data.title,
    excerpt: data.excerpt,
    content: data.content,
    image: data.coverImage,
    images: previewImages,
    readTime: estimateReadTime(data.excerpt, data.content),
  });
  const feedDisplayType = layoutIdToDisplayType(data.layoutId);

  const handleStyleChange = (updates: Partial<StoryData>) => {
    if (updates.layoutId) {
      const displayType = layoutIdToDisplayType(updates.layoutId);
      onChange({
        ...updates,
        displayType,
        requestFeatured: updates.layoutId === 'hero' ? data.requestFeatured : false,
      });
      return;
    }
    onChange(updates);
  };

  return (
    <div className="journey-step-content animate-fade-in space-y-5">
      <SectionHeader icon={Eye} title="Tùy chỉnh & xem trước" subtitle="Chọn dạng bài, phong cách, kiểu chữ — cập nhật ngay bên dưới" accent="gold" />

      <PostStyleCustomizer
        style={getPostStyleFromData(data)}
        requestFeatured={data.requestFeatured}
        onChange={u => handleStyleChange(u as Partial<StoryData>)}
      />

      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
        <p className="text-sm font-bold text-emerald-300 mb-1">Xem trước bảng tin</p>
        <p className="text-xs text-[var(--text-muted)]">
          Layout: <strong>{data.layoutId}</strong>
          {resolvedType !== feedDisplayType && (
            <span className="text-amber-400"> · Dữ liệu có thể render kiểu {resolvedType}</span>
          )}
        </p>
      </div>

      <JourneyPostPreview
        data={{
          layoutId: data.layoutId,
          style: getPostStyleFromData(data),
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          coverImage: data.coverImage,
          photos: data.photos,
          destinationLabel: destLabel,
          categoryLabel: catLabel,
          requestFeatured: data.requestFeatured,
          tips: data.tips,
        }}
      />

      {(data.days.length > 0 || data.tips.length > 0 || data.tags.length > 0) && (
        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-2">
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Thông tin thêm (không hiện trên thẻ feed)</p>
          {data.days.length > 0 && <p className="text-sm text-[var(--text-secondary)]">Lịch trình {data.days.length} ngày</p>}
          {data.tips.length > 0 && <p className="text-sm text-[var(--text-secondary)]">{data.tips.length} mẹo du lịch</p>}
          {data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {data.tags.map(tag => <span key={tag} className="badge-destination text-[11px]">{tag}</span>)}
            </div>
          )}
        </div>
      )}

      {/* Completeness */}
      <div className="p-4 bg-[var(--bg-elevated)] rounded-xl space-y-3">
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Độ hoàn chỉnh</p>
        {getJourneyCompletionItems(toPublishFields(data)).map(item => (
          <div key={item.label} className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-emerald-500' : 'bg-[var(--bg-overlay)] border border-[var(--border-normal)]'}`}>
              {item.done && <Check size={11} className="text-white" />}
            </div>
            <span className={`text-sm ${item.done ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────────────────
const DEFAULT_DATA: StoryData = {
  displayType: 'magazine',
  layoutId: DEFAULT_POST_STYLE.layoutId,
  typography: DEFAULT_POST_STYLE.typography,
  theme: DEFAULT_POST_STYLE.theme,
  cardShape: DEFAULT_POST_STYLE.cardShape,
  excerpt: '',
  requestFeatured: false,
  title: '', content: '', mood: '', rating: 0, privacy: 'public', categories: [], tags: [],
  coverImage: '', photos: [], videos: [],
  destination: '', latitude: null, longitude: null, locationAddress: '', routePoints: [],
  country: 'Việt Nam', emoji: '🇻🇳', startDate: '', endDate: '', duration: 0,
  budget: '', currency: 'VND', travelStyle: '', companions: '', transport: [], weather: '',
  days: [], tips: [],
};

function normalizeJourneyDraft(draft: Partial<StoryData>): StoryData {
  return {
    ...DEFAULT_DATA,
    ...draft,
    displayType: draft.displayType ?? DEFAULT_DATA.displayType,
    layoutId: (draft.layoutId ?? draft.displayType ?? 'magazine') as StoryData['layoutId'],
    typography: draft.typography ?? DEFAULT_POST_STYLE.typography,
    theme: draft.theme ?? DEFAULT_POST_STYLE.theme,
    cardShape: draft.cardShape ?? DEFAULT_POST_STYLE.cardShape,
    excerpt: draft.excerpt ?? '',
    requestFeatured: draft.requestFeatured ?? false,
    photos: draft.photos ?? [],
    videos: draft.videos ?? [],
    tags: draft.tags ?? [],
    transport: draft.transport ?? [],
    days: draft.days ?? [],
    tips: draft.tips ?? [],
    categories: draft.categories?.length
      ? draft.categories
      : (draft as StoryData & { category?: string }).category
        ? [(draft as StoryData & { category?: string }).category!]
        : [],
    routePoints: draft.routePoints?.length
      ? draft.routePoints.map(p => normalizeRoutePoint(p))
      : draft.latitude != null && draft.longitude != null
        ? [newRoutePoint(draft.destination || 'Điểm 1', draft.latitude, draft.longitude, draft.locationAddress)]
        : [],
  };
}

function buildJourneyContent(data: StoryData) {
  const readTime = estimateReadTime(data.excerpt, data.content, data.title);
  const feedCategory = data.categories[0]
    ? journeyCategoryToFeedLabel(data.categories[0])
    : undefined;
  return JSON.stringify({
    type: 'journey',
    displayType: data.displayType,
    layoutId: data.layoutId,
    postStyle: getPostStyleFromData(data),
    isFeatured: data.requestFeatured,
    headline: data.title,
    excerpt: data.excerpt || (data.displayType === 'social' ? '' : data.content.slice(0, 220)),
    readTime,
    feedCategory,
    title: data.title,
    body: data.content,
    categories: data.categories,
    category: data.categories[0] ?? '',
    tags: data.tags,
    mood: data.mood,
    rating: data.rating,
    privacy: data.privacy,
    destination: data.destination,
    country: data.country,
    emoji: data.emoji,
    location: {
      address: data.locationAddress,
      lat: data.latitude,
      lng: data.longitude,
    },
    route: {
      points: data.routePoints.map((p, i) => ({
        order: i + 1,
        role: i === 0 ? 'start' : i === data.routePoints.length - 1 ? 'end' : 'waypoint',
        name: p.name,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
      })),
    },
    dates: { start: data.startDate, end: data.endDate },
    budget: { amount: data.budget, currency: data.currency },
    companions: data.companions,
    transport: data.transport,
    weather: data.weather,
    days: data.days,
    tips: data.tips,
  });
}

function getJourneyCompletion(data: StoryData) {
  const items = getJourneyCompletionItems(toPublishFields(data));
  const percent = Math.round((items.filter(i => i.done).length / items.length) * 100);
  return { items, percent };
}

function getInitialJourneyState() {
  const env = loadJourneyDraftEnvelope<StoryData>();
  return {
    step: env?.step ?? 1,
    data: env?.data ? normalizeJourneyDraft(env.data) : DEFAULT_DATA,
    restored: journeyDraftHasContent(env?.data as unknown as Record<string, unknown>),
  };
}

export default function CreateStoryPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);
  const [initial] = useState(getInitialJourneyState);

  const [step, setStep] = useState(initial.step);
  const [data, setData] = useState<StoryData>(initial.data);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftRestored] = useState(initial.restored);
  const topRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const dataRef = useRef(data);
  const stepRef = useRef(step);

  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => { stepRef.current = step; }, [step]);

  const onChange = (updates: Partial<StoryData>) => setData(prev => ({ ...prev, ...updates }));

  const publishedRef = useRef(published);
  useEffect(() => { publishedRef.current = published; }, [published]);

  const flushDraftSave = async (syncFallback = false) => {
    if (publishedRef.current) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (syncFallback) {
      saveJourneyDraft(dataRef.current, stepRef.current);
      return;
    }
    if (savingRef.current) return;
    savingRef.current = true;
    await saveJourneyDraftAsync(stepRef.current, dataRef.current);
    savingRef.current = false;
  };

  useEffect(() => {
    if (published) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void flushDraftSave();
    }, 700);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounced autosave
  }, [data, step, published]);

  useEffect(() => {
    const onBeforeUnload = () => { void flushDraftSave(true); };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      void flushDraftSave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flush on unmount
  }, []);

  const canNext = () => journeyStepCanAdvance(step, toPublishFields(data));

  const next = () => {
    if (step < 5) {
      setStep(step + 1);
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
      void flushDraftSave();
    }
  };

  const prev = () => {
    if (step > 1) {
      setStep(step - 1);
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
      void flushDraftSave();
    }
  };

  const handleSaveDraft = async () => {
    const ok = await saveJourneyDraftAsync(step, data);
    setDraftSaved(ok);
    setTimeout(() => setDraftSaved(false), 2500);
  };

  const handleLeave = () => {
    void flushDraftSave(true);
    navigate('/');
  };

  const handlePublish = async () => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: '/journeys/create' } });
      return;
    }

    setPublishing(true);
    setPublishError('');

    try {
      const coverSource = data.coverImage || data.photos[0] || '';
      const coverUrl = coverSource ? await resolveMediaUrl(coverSource) : '';
      const photoUrls = await Promise.all(data.photos.map(resolveMediaUrl));
      const videoUrls = await Promise.all(data.videos.map(resolveMediaUrl));
      const mediaUrls = [coverUrl, ...photoUrls, ...videoUrls].filter(Boolean);

      let tripId: string | undefined;
      if (data.days.length > 0) {
        try {
          const trip = await tripsService.TaoChuyenDi({
            title: data.title,
            destinationName: data.destination,
            startDate: data.startDate || new Date().toISOString(),
            endDate: data.endDate || new Date().toISOString(),
            totalBudget: parseFloat(data.budget) || 0,
            travelStyle: data.companions || data.travelStyle || 'Solo',
            isPublic: data.privacy === 'public',
            days: data.days.map(d => ({
              dayNumber: d.day,
              title: d.title,
              activities: d.activities.map(a => ({
                time: a.time,
                name: a.title,
                note: a.description,
                cost: parseFloat(a.cost || '0') || 0,
              })),
            })),
          });
          tripId = trip?.id;
        } catch {
          // Trip creation optional — post still publishes
        }
      }

      const journeyContent = buildJourneyContent(data);
      await postsService.TaoBaiViet({
        content: journeyContent,
        mediaUrls,
        tripId,
      });

      clearJourneyDraft();
      setPublished(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể đăng hành trình. Vui lòng thử lại.';
      setPublishError(msg);
    } finally {
      setPublishing(false);
    }
  };

  if (published) {
    return (
      <CreateSuccessScreen
        variant="journey"
        title="Hành trình đã đăng!"
        message={(
          <>
            Bài viết dạng <strong>{FEED_DISPLAY_OPTIONS.find(o => o.id === data.displayType)?.authorStyle}</strong>
            {data.title ? <> — <strong>{data.title}</strong></> : null} đã được chia sẻ với cộng đồng Terraholic.
          </>
        )}
        actions={
          <>
            <button type="button" onClick={() => navigate('/', { state: { refreshFeed: true } })} className="btn-gold px-6 py-3">Về Bảng tin</button>
            <button type="button" onClick={() => { clearJourneyDraft(); setData(DEFAULT_DATA); setStep(1); setPublished(false); }} className="btn-outline px-6 py-3">Viết thêm</button>
          </>
        }
      />
    );
  }

  const isReadyToPublish = isJourneyReadyToPublish(toPublishFields(data));

  const { items: completionItems, percent: completionPercent } = getJourneyCompletion(data);
  const currentStepMeta = JOURNEY_STEPS[step - 1];
  const CurrentStepIcon = currentStepMeta?.icon ?? Route;

  return (
    <div ref={topRef}>
      <CreatePageShell
        variant="journey"
        noHeader={true}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] xl:grid-cols-[320px_1fr_320px] gap-4 lg:gap-5 relative">
          {/* LEFT SIDEBAR (stepper progress) */}
          <aside className="hidden lg:block">
            <div className="sticky top-[88px]">
              <JourneyProgressSidebar
                current={step}
                completion={completionItems}
                percent={completionPercent}
              />
            </div>
          </aside>

          {/* CENTER COLUMN (creation content) */}
          <div className="journey-create-main">
            
            {/* Premium Scenery Top Banner */}
            <div 
              className="journey-step-banner relative overflow-hidden rounded-2xl border border-slate-200/50 p-6 flex items-center justify-between min-h-[120px] shadow-sm mb-2"
              style={{
                backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.65)), url('https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: '#fff'
              }}
            >
              <div className="flex items-center gap-4 z-10">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-md">
                  <CurrentStepIcon size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">BƯỚC {step} / {JOURNEY_STEPS.length}</p>
                  <h2 className="text-lg font-black text-white mt-0.5">{currentStepMeta?.label}</h2>
                  <p className="text-xs text-slate-200 mt-0.5 max-w-lg leading-relaxed">{STEP_HINTS[step]}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-[10px] sm:text-xs font-bold text-white z-10">
                <span>{completionPercent}% hoàn thành</span>
              </div>
            </div>

            {/* Content Form Wrapper: Notebook Diary Layout for Step 1, standard card panel for others */}
            {step === 1 ? (
              <Step1Story data={data} onChange={onChange} onNext={next} canNext={canNext()} onSaveDraft={handleSaveDraft} draftSaved={draftSaved} />
            ) : (
              <div className="create-panel create-panel--journey journey-form-panel">
                {step === 2 && <Step2Photos data={data} onChange={onChange} />}
                {step === 3 && <Step3Details data={data} onChange={onChange} />}
                {step === 4 && <Step4Itinerary data={data} onChange={onChange} />}
                {step === 5 && <Step5Preview data={data} onChange={onChange} />}
              </div>
            )}

            {/* Standard Warning / Publish Alerts for Step > 1 */}
            {step > 1 && !canNext() && (
              <div className="journey-alert journey-alert--warn">
                <AlertCircle size={15} />
                {step === 2 && data.displayType === 'social' && 'Vui lòng thêm ít nhất 1 ảnh (tối đa 2)'}
                {step === 2 && data.displayType !== 'social' && 'Vui lòng chọn ảnh bìa'}
                {step === 3 && 'Vui lòng thêm ít nhất 1 điểm trên bản đồ tuyến đường'}
              </div>
            )}

            {publishError && (
              <div className="journey-alert journey-alert--error">
                <AlertCircle size={15} /> {publishError}
              </div>
            )}

            {/* Standard Footer Navigation for Step > 1 (Step 1 handles navigation internally within notebook page) */}
            {step > 1 && (
              <div className="journey-create-footer">
                <button type="button" onClick={prev}
                  className="modern-nav-btn modern-nav-btn--ghost">
                  <ChevronLeft size={16} /> Bước trước
                </button>

                <div className="flex items-center gap-3">
                  <button type="button" onClick={handleSaveDraft}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer">
                    <Sparkles size={12} className="text-amber-500" /> {draftSaved ? 'Đã lưu!' : 'Lưu bản nháp'}
                  </button>

                  <span className="journey-footer-step">{step} / {JOURNEY_STEPS.length}</span>
                </div>

                {step < 5 ? (
                  <button type="button" onClick={next} disabled={!canNext()}
                    className="modern-nav-btn modern-nav-btn--primary disabled:opacity-50">
                    Tiếp theo <ChevronRight size={16} />
                  </button>
                ) : (
                  <button type="button" onClick={handlePublish} disabled={!isReadyToPublish || publishing}
                    className="modern-nav-btn modern-nav-btn--primary disabled:opacity-50">
                    {publishing ? <><Loader2 size={15} className="animate-spin" /> Đang đăng...</> : <><Send size={15} /> Đăng hành trình</>}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR (inspiration card and guidelines) */}
          <aside className="hidden lg:block">
            <div className="sticky top-[88px] space-y-4">
              {/* Travel Inspiration Card */}
              <div className="sidebar-section select-none animate-fade-in space-y-3">
                <h4 className="sidebar-title flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500 animate-pulse" /> Cảm hứng du lịch
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  Hãy chia sẻ những câu chuyện thực tế và các địa điểm nổi tiếng để bài viết thu hút nhiều tương tác hơn nhé!
                </p>
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden group">
                  <img 
                    src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=500&q=80" 
                    alt="Famous Destination" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
                    <div>
                      <p className="text-xs font-black text-white">Vịnh Hạ Long, Việt Nam</p>
                      <p className="text-[9px] text-slate-200 font-medium">Kỳ quan thiên nhiên thế giới</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Travel Tips Card */}
              <div className="sidebar-section select-none animate-fade-in space-y-2">
                <h4 className="sidebar-title">Mẹo viết bài hữu ích</h4>
                <ul className="text-[10px] text-slate-500 space-y-1.5 list-disc pl-3">
                  <li>Hình ảnh chất lượng cao giúp tăng 80% lượt tương tác.</li>
                  <li>Gắn thẻ các hoạt động cụ thể (ẩm thực, trekking...).</li>
                  <li>Gợi ý lộ trình chi tiết để người đọc dễ theo dõi.</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </CreatePageShell>
    </div>
  );
}
