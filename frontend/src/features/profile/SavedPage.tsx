// SavedPage v2 – 3-column layout (same as SocialFeedPage)
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import {
  Bookmark, ExternalLink, Heart, MessageCircle, Trash2,
  Calendar, DollarSign, MapPin, Compass, Clock, Sparkles,
  FileImage, LayoutGrid, List, Globe, TrendingUp, Users, Flame,
  Home, Search, Bot,
} from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { postsService, tripsService, Post } from '../../services/smartTravel.service';
import { mapApiPostsToFeed } from '../../utils/apiPostMapper';
import { FeedPost } from '../../utils/feedUtils';
import PostDetailModal from '../../components/feed/PostDetailModal';
import { loadUserProfileCache } from '../../utils/feedPostStorage';
import { loadUserStories } from '../../utils/storyStorage';
import { COMPANION_CANDIDATES, FEED_POSTS } from '../../data/feedData';
import { computeHotDestinationsThisMonth } from '../../utils/feedUtils';

function unpackActivityNotes(act: any) {
  let extra: any = {};
  if (act.notes) {
    try {
      const trimmed = act.notes.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        extra = JSON.parse(trimmed);
      }
    } catch (e) {}
  }
  const originalNotes = extra.originalNotes !== undefined ? extra.originalNotes : act.notes;
  return {
    ...act,
    ...extra,
    notes: originalNotes,
    activityName: act.destination?.name || act.activityName || 'Điểm tham quan',
    locationName: act.destination?.address || act.destination?.name || act.locationName || 'Địa điểm',
  };
}

// ── LEFT SIDEBAR ──────────────────────────────────────────────
const SavedLeftSidebar = ({ savedCount, tripsCount }: { savedCount: number; tripsCount: number }) => {
  const { t } = useLang();
  const user = useSelector((s: RootState) => s.auth.user);
  const profileCache = loadUserProfileCache();
  const storyCount = loadUserStories().length;
  const displayName = user?.fullName || t('auth.loginToPost');
  const locationLabel = profileCache.location || 'Chưa cập nhật vị trí';

  const navLinks = [
    { icon: Home,    label: t('nav.quick.feed'),      href: '/',               color: 'text-amber-400' },
    { icon: Compass, label: t('nav.quick.explore'),   href: '/explore',        color: 'text-violet-400' },
    { icon: MapPin,  label: t('nav.quick.map'),        href: '/map',            color: 'text-teal-400' },
    { icon: Sparkles,label: t('nav.quick.aiPlanner'), href: '/trips',          color: 'text-sky-400' },
    { icon: Bot,     label: 'AI Trợ lý',               href: '/chat',           color: 'text-rose-400' },
  ];

  return (
    <div className="space-y-4">
      {/* Profile mini card */}
      <div className="profile-mini animate-fade-in">
        <div className="profile-mini-cover">
          <div className="absolute top-2 right-4 w-8 h-8 rounded-full bg-[var(--gold)]/20 animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute top-4 right-10 w-5 h-5 rounded-full bg-violet-500/20 animate-float" style={{ animationDelay: '1s' }} />
        </div>
        <div className="profile-mini-avatar">
          <img src={user?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} alt="" className="w-full h-full object-cover rounded-full" />
        </div>
        <div className="pt-9 pb-4 px-4">
          <h4 className="font-bold text-[var(--text-primary)] truncate">{displayName}</h4>
          <p className="text-[11px] text-[var(--text-muted)] mb-3 flex items-center gap-1 truncate">
            <MapPin size={10} className="text-[var(--gold)] flex-shrink-0" /> {locationLabel}
          </p>
          <div className="grid grid-cols-3 gap-0 divide-x divide-[var(--border-subtle)] text-center py-2 bg-[var(--bg-elevated)] rounded-xl">
            {[
              [String(savedCount), t('sidebar.profile.posts')],
              [String(storyCount), 'Hành trình'],
              ['0', t('sidebar.profile.followers')],
            ].map(([n, l], i) => (
              <div key={i} className="py-1">
                <div className="text-sm font-bold text-[var(--text-primary)]">{n}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <div className="sidebar-section space-y-0.5">
        {navLinks.map(({ icon: Icon, label, href, color }) => (
          <Link key={href} to={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-elevated)] transition-all group cursor-pointer">
            <span className={`w-6 flex justify-center transition-transform group-hover:scale-110 ${color}`}><Icon size={17} strokeWidth={2} /></span>
            <span className="text-sm font-semibold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{label}</span>
          </Link>
        ))}
      </div>

      {/* Stats card */}
      <div className="feature-strip text-center space-y-2 animate-fade-in">
        <div className="text-xs font-bold text-[var(--gold)] uppercase tracking-widest">Cộng đồng</div>
        <div className="grid grid-cols-3 gap-2">
          {[['10K+', 'Thành viên', 'text-amber-400'], ['500+', 'Điểm đến', 'text-teal-400'], ['50K+', 'Bài viết', 'text-violet-400']].map(([n, l, c]) => (
            <div key={l} className="bg-[var(--bg-elevated)] rounded-xl p-2">
              <div className={`text-sm font-extrabold ${c}`}>{n}</div>
              <div className="text-[10px] text-[var(--text-muted)]">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── RIGHT SIDEBAR ─────────────────────────────────────────────
const SavedRightSidebar = () => {
  const { t } = useLang();
  const hotDestinations = computeHotDestinationsThisMonth(FEED_POSTS);
  const companions = COMPANION_CANDIDATES.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Hot destinations */}
      <div className="sidebar-section animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={14} className="text-[var(--gold)]" />
          <p className="sidebar-title mb-0">{t('sidebar.trending')}</p>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mb-3 pl-6">{t('sidebar.trending.month')}</p>
        <div className="space-y-2">
          {hotDestinations.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] px-2">—</p>
          ) : hotDestinations.map((dest, i) => (
            <div key={dest.name} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-elevated)] transition-all cursor-pointer group">
              <span className="text-xs font-extrabold text-[var(--text-muted)] w-4 flex-shrink-0">{i + 1}</span>
              <div className="relative flex-shrink-0">
                <img src={dest.image} alt={dest.name} className="w-10 h-10 rounded-xl object-cover group-hover:scale-105 transition-transform" />
                {dest.hot && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center">
                    <Flame size={9} className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--gold)] transition-colors">{dest.name}</p>
                <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                  <Globe size={9} /> {dest.country} · {dest.postCount} {t('sidebar.postsThisMonth')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gợi ý bạn đồng hành */}
      <div className="sidebar-section animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className="text-[var(--gold)]" />
          <p className="sidebar-title mb-0">{t('sidebar.suggested')}</p>
        </div>
        <div className="space-y-3">
          {companions.map((traveler: any) => (
            <div key={traveler.id} className="flex items-center gap-3 group">
              <img src={traveler.avatar} alt={traveler.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-[var(--border-normal)] group-hover:ring-[var(--gold)] transition-all" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[var(--text-primary)] truncate">{traveler.name}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{traveler.handle} · {traveler.followersLabel} {t('sidebar.followers')}</p>
              </div>
              <button type="button" className="btn-follow text-[10px] px-3 py-1.5 flex-shrink-0">
                {t('sidebar.follow')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="sidebar-section animate-fade-in">
        <p className="sidebar-title">{t('sidebar.topics')}</p>
        <div className="flex flex-wrap gap-1.5">
          {['#HaGiang', '#SapaLoop', '#HoiAn', '#StreetFood', '#BudgetTravel', '#VietnamVibes', '#OffBeatAsia'].map((tag) => (
            <span key={tag} className="badge-destination badge-gold cursor-pointer hover:scale-105 transition-transform text-[11px] px-2.5 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

function parsePostContent(content: string) {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object') {
      return {
        headline: parsed.headline || parsed.title || '',
        body: parsed.body || parsed.excerpt || '',
        category: parsed.category || ''
      };
    }
  } catch (e) {}
  return {
    headline: '',
    body: content,
    category: ''
  };
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function SavedPage() {
  const { lang } = useLang();
  const vi = lang === 'vi';

  const [activeTab, setActiveTab] = useState<'posts' | 'trips'>('posts');
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [savedTrips, setSavedTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchSavedData = async () => {
    setLoading(true);
    setError('');
    try {
      const [posts, trips] = await Promise.all([
        postsService.LayBaiVietDaLuuCuaToi(),
        tripsService.LayDanhSachChuyenDi()
      ]);
      setSavedPosts(posts);
      setSavedTrips(trips);
    } catch (err) {
      console.error(err);
      setError(vi ? 'Không thể tải bộ sưu tập đã lưu.' : 'Failed to load saved collection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchSavedData(); }, []);

  const handleUnsavePost = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    try {
      await postsService.LuuHoacBoLuu(postId);
      setSavedPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) { console.error(err); }
  };

  const handleDeleteTrip = (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    setDeleteConfirmId(tripId);
  };

  const confirmDeleteTrip = async () => {
    if (!deleteConfirmId) return;
    const tripId = deleteConfirmId;
    setDeleteConfirmId(null);
    try {
      await tripsService.XoaChuyenDi(tripId);
      setSavedTrips(prev => prev.filter(t => t.id !== tripId));
    } catch (err) { console.error(err); }
  };

  const handlePostClick = (post: Post) => {
    const mapped = mapApiPostsToFeed([post])[0];
    if (mapped) setSelectedPost(mapped);
  };

  return (
    <div className="container-wide py-4 sm:py-6">

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          labels={{ close: vi ? 'Đóng' : 'Close', readTime: '', likes: vi ? 'lượt thích' : 'likes', comments: vi ? 'bình luận' : 'comments' }}
        />
      )}

      {/* Trip Detail Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-[var(--border-subtle)] flex items-start justify-between bg-gradient-to-r from-[var(--gold)]/10 via-transparent to-transparent">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-[var(--gold)] font-bold uppercase tracking-wider">
                  <Compass size={12} /> {vi ? 'Lịch trình du lịch' : 'Travel Itinerary'}
                </div>
                <h2 className="text-xl font-editorial font-bold text-[var(--text-primary)]">{selectedTrip.title}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)] pt-1">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {selectedTrip.destinationName}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(selectedTrip.startDate).toLocaleDateString('vi-VN')}</span>
                  <span className="flex items-center gap-1"><DollarSign size={12} /> {selectedTrip.totalBudget?.toLocaleString('vi-VN')} đ</span>
                  <span className="flex items-center gap-1"><Sparkles size={12} className="text-yellow-500" /> {selectedTrip.travelStyle}</span>
                </div>
              </div>
              <button onClick={() => { setSelectedTrip(null); setSelectedDayIdx(0); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 hover:bg-[var(--bg-elevated)] rounded-full border border-[var(--border-subtle)]">
                <span className="text-lg font-bold">&times;</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row min-h-0">
              <div className="w-full md:w-48 border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 space-y-1 overflow-y-auto">
                {selectedTrip.days.map((day: any, idx: number) => (
                  <button key={day.id || idx} onClick={() => setSelectedDayIdx(idx)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${selectedDayIdx === idx ? 'bg-[var(--gold)] text-black border-[var(--gold)]' : 'bg-transparent text-[var(--text-primary)] border-transparent hover:bg-black/5'}`}>
                    <span>{vi ? `Ngày ${idx + 1}` : `Day ${idx + 1}`}</span>
                    <span className="text-[10px] opacity-75">{day.activities?.length || 0} {vi ? 'hoạt động' : 'acts'}</span>
                  </button>
                ))}
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {selectedTrip.days[selectedDayIdx]?.activities?.map((act: any, actIdx: number) => {
                  const extra = unpackActivityNotes(act);
                  return (
                    <div key={act.id || actIdx} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-xs font-bold text-[var(--gold)]">{actIdx + 1}</div>
                        {actIdx < selectedTrip.days[selectedDayIdx].activities.length - 1 && <div className="w-0.5 flex-1 bg-[var(--border-subtle)] my-1" />}
                      </div>
                      <div className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-4 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-xs font-bold text-[var(--text-primary)]">{extra.activityName}</h4>
                            <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1"><MapPin size={10} /> {extra.locationName}</p>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[10px] bg-black/5 text-[var(--text-muted)] px-2.5 py-0.5 rounded-full font-bold">
                            <Clock size={9} /> {act.startTime} - {act.endTime}
                          </span>
                        </div>
                        {extra.notes && <p className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg-surface)] p-2.5 rounded-xl border border-[var(--border-subtle)] italic leading-relaxed">{extra.notes}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500"><Trash2 size={20} /></div>
              <div>
                <h3 className="text-sm font-extrabold text-[var(--text-primary)]">{vi ? 'Xóa hành trình?' : 'Delete Itinerary?'}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{vi ? 'Hành động không thể hoàn tác' : 'This action is irreversible'}</p>
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{vi ? 'Bạn có chắc chắn muốn xóa vĩnh viễn hành trình này?' : 'Are you sure you want to permanently delete this itinerary?'}</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] font-bold cursor-pointer transition-all">{vi ? 'Hủy bỏ' : 'Cancel'}</button>
              <button onClick={confirmDeleteTrip} className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-xs text-white font-extrabold cursor-pointer transition-all flex items-center justify-center gap-1.5"><Trash2 size={13} />{vi ? 'Xác nhận xóa' : 'Confirm Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3-COLUMN LAYOUT (same as SocialFeedPage) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] xl:grid-cols-[320px_1fr_320px] gap-4 lg:gap-5">

        {/* LEFT SIDEBAR */}
        <aside className="hidden lg:block">
          <div className="sticky top-[142px]">
            <SavedLeftSidebar savedCount={savedPosts.length} tripsCount={savedTrips.length} />
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="min-w-0 space-y-4">

          {/* Page Header */}
          <div className="surface-elevated p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-violet-500/20 border border-rose-500/20 flex items-center justify-center">
                  <Bookmark size={20} className="text-rose-400 fill-rose-400/30" />
                </div>
                <div>
                  <h1 className="text-lg font-editorial font-bold text-[var(--text-primary)]">
                    {vi ? 'Bộ sưu tập đã lưu' : 'Saved Collection'}
                  </h1>
                  <p className="text-xs text-[var(--text-muted)]">
                    {loading ? (vi ? 'Đang tải...' : 'Loading...') : (vi ? `${savedPosts.length} bài viết · ${savedTrips.length} hành trình` : `${savedPosts.length} posts · ${savedTrips.length} itineraries`)}
                  </p>
                </div>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center gap-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-1">
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[var(--gold)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                  <LayoutGrid size={14} />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[var(--gold)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                  <List size={14} />
                </button>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-2">
              <button onClick={() => setActiveTab('posts')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'posts' ? 'bg-gradient-to-r from-[var(--gold)] to-blue-700 text-white shadow-lg' : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--gold)]/50 hover:text-[var(--gold)]'}`}>
                <Bookmark size={13} />
                {vi ? 'Bài viết' : 'Posts'}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${activeTab === 'posts' ? 'bg-black/20 text-white' : 'bg-[var(--bg-elevated)]'}`}>{savedPosts.length}</span>
              </button>
              <button onClick={() => setActiveTab('trips')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'trips' ? 'bg-gradient-to-r from-[var(--gold)] to-blue-700 text-white shadow-lg' : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--gold)]/50 hover:text-[var(--gold)]'}`}>
                <Compass size={13} />
                {vi ? 'Hành trình' : 'Itineraries'}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${activeTab === 'trips' ? 'bg-black/20 text-white' : 'bg-[var(--bg-elevated)]'}`}>{savedTrips.length}</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          {loading ? (
            <div className="surface-elevated py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 rounded-full border-4 border-t-[var(--gold)] border-r-transparent border-b-rose-500 border-l-transparent animate-spin" />
              <p className="text-sm text-[var(--text-muted)]">{vi ? 'Đang tải danh sách đã lưu...' : 'Loading saved list...'}</p>
            </div>
          ) : error ? (
            <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center text-rose-400 text-sm">{error}</div>
          ) : activeTab === 'posts' ? (
            savedPosts.length === 0 ? (
              <div className="surface-elevated py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center">
                  <FileImage size={28} className="text-[var(--text-muted)]" />
                </div>
                <div className="text-center space-y-1.5 max-w-xs">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">{vi ? 'Chưa có bài viết nào được lưu' : 'No saved posts yet'}</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{vi ? 'Duyệt bảng tin và bấm vào biểu tượng 🔖 để lưu lại các bài viết hành trình yêu thích.' : 'Browse the feed and tap 🔖 to save your favorite travel posts.'}</p>
                </div>
                <Link to="/" className="btn-gold inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl">
                  <Globe size={13} /> {vi ? 'Khám phá bảng tin' : 'Explore Feed'}
                </Link>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-3'}>
                {savedPosts.map(post => {
                  const authorName = post.author.profile?.fullName || 'Người dùng';
                  const avatar = post.author.profile?.avatarUrl;
                  const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;
                  const dateString = new Date(post.createdAt).toLocaleDateString('vi-VN');
                  const parsed = parsePostContent(post.content);

                  if (viewMode === 'list') {
                    return (
                      <div key={post.id} onClick={() => handlePostClick(post)}
                        className="surface-elevated border border-[var(--border-subtle)] hover:border-[var(--gold)]/40 rounded-2xl cursor-pointer hover:shadow-lg transition-all duration-300 flex gap-3 p-4 group">
                        {hasMedia && <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0"><img src={post.mediaUrls[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" /></div>}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              {avatar ? <img src={avatar} alt="" className="w-4 h-4 rounded-full object-cover" /> : <div className="w-4 h-4 rounded-full bg-[var(--gold)] text-black font-bold flex items-center justify-center text-[8px]">{authorName.charAt(0)}</div>}
                              <span className="text-[11px] font-bold text-[var(--text-secondary)]">{authorName}</span>
                              <span className="text-[10px] text-[var(--text-muted)]">· {dateString}</span>
                            </div>
                            {parsed.headline && <h4 className="text-xs font-bold text-[var(--text-primary)] line-clamp-1 mb-1">{parsed.headline}</h4>}
                            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">{parsed.body}</p>
                          </div>
                          <div className="flex items-center justify-between pt-2 text-[10px] text-[var(--text-muted)]">
                            <div className="flex gap-3">
                              <span className="flex items-center gap-1"><Heart size={10} className="text-rose-500" /> {post._count?.likes ?? 0}</span>
                              <span className="flex items-center gap-1"><MessageCircle size={10} /> {post._count?.comments ?? 0}</span>
                            </div>
                            <button onClick={(e) => handleUnsavePost(e, post.id)} className="text-[var(--text-muted)] hover:text-rose-500 transition-colors p-1"><Trash2 size={11} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={post.id} onClick={() => handlePostClick(post)}
                      className="surface-elevated overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--gold)]/40 rounded-2xl cursor-pointer hover:shadow-xl transition-all duration-300 flex flex-col group">
                      <div className="h-44 relative bg-gradient-to-br from-violet-600/20 to-rose-600/20 overflow-hidden">
                        {hasMedia ? <img src={post.mediaUrls[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          : <div className="w-full h-full flex items-center justify-center"><FileImage size={28} className="text-[var(--text-muted)] opacity-30" /></div>}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <button onClick={(e) => handleUnsavePost(e, post.id)} className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50 hover:bg-rose-600/90 text-white flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100" title={vi ? 'Bỏ lưu' : 'Unsave'}>
                          <Trash2 size={12} />
                        </button>
                        <span className="absolute bottom-2.5 left-2.5 bg-black/50 text-[10px] text-white/90 px-2 py-0.5 rounded-md backdrop-blur-sm">{dateString}</span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {avatar ? <img src={avatar} alt="" className="w-5 h-5 rounded-full object-cover border border-[var(--border-subtle)]" /> : <div className="w-5 h-5 rounded-full bg-[var(--gold)] text-black font-bold flex items-center justify-center text-[9px]">{authorName.charAt(0)}</div>}
                            <span className="text-[11px] font-bold text-[var(--text-secondary)] truncate">{authorName}</span>
                          </div>
                          {parsed.headline && <h3 className="text-xs font-bold text-[var(--text-primary)] line-clamp-1">{parsed.headline}</h3>}
                          <p className="text-[11px] text-[var(--text-secondary)] leading-normal line-clamp-3">{parsed.body}</p>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-3">
                          <div className="flex gap-3">
                            <span className="flex items-center gap-1"><Heart size={10} className="text-rose-500 fill-rose-500/30" /> {post._count?.likes ?? 0}</span>
                            <span className="flex items-center gap-1"><MessageCircle size={10} /> {post._count?.comments ?? 0}</span>
                          </div>
                          <span className="text-[var(--gold)] font-semibold flex items-center gap-1 group-hover:underline">{vi ? 'Xem chi tiết' : 'Details'} <ExternalLink size={9} /></span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Hành trình tab */
            savedTrips.length === 0 ? (
              <div className="surface-elevated py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center">
                  <Compass size={28} className="text-[var(--text-muted)]" />
                </div>
                <div className="text-center space-y-1.5 max-w-xs">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">{vi ? 'Chưa có hành trình nào' : 'No itineraries yet'}</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{vi ? 'Hãy tạo hành trình bằng công cụ AI để lên kế hoạch chuyến đi hoàn hảo.' : 'Create itineraries using AI Planner to plan your perfect trip.'}</p>
                </div>
                <Link to="/trips" className="btn-gold inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl">
                  <Sparkles size={13} /> {vi ? 'Tạo hành trình AI' : 'Plan with AI'}
                </Link>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-3'}>
                {savedTrips.map(trip => {
                  const totalDays = trip.days?.length || 1;
                  const formattedCost = trip.totalBudget ? trip.totalBudget.toLocaleString('vi-VN') : '0';
                  const createdDate = new Date(trip.createdAt).toLocaleDateString('vi-VN');

                  if (viewMode === 'list') {
                    return (
                      <div key={trip.id} onClick={() => setSelectedTrip(trip)}
                        className="surface-elevated border border-[var(--border-subtle)] hover:border-[var(--gold)]/40 rounded-2xl cursor-pointer hover:shadow-lg transition-all duration-300 flex gap-3 p-4 group">
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-teal-500/30 to-[var(--gold)]/30 flex-shrink-0 flex items-center justify-center border border-[var(--border-subtle)]">
                          <Compass size={22} className="text-[var(--gold)]" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-bold bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">{trip.travelStyle || 'Explore'}</span>
                            <h3 className="text-sm font-bold text-[var(--text-primary)] line-clamp-1 mt-1">{trip.title}</h3>
                            <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1"><MapPin size={10} /> {trip.destinationName}</p>
                          </div>
                          <div className="flex items-center justify-between pt-2 text-[10px] text-[var(--text-muted)]">
                            <div className="flex gap-3">
                              <span className="font-bold text-[var(--text-primary)]">{totalDays} {vi ? 'ngày' : 'days'}</span>
                              <span>{formattedCost} đ</span>
                              <span>{createdDate}</span>
                            </div>
                            <button onClick={(e) => handleDeleteTrip(e, trip.id)} className="text-[var(--text-muted)] hover:text-rose-500 transition-colors p-1"><Trash2 size={11} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={trip.id} onClick={() => setSelectedTrip(trip)}
                      className="surface-elevated overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--gold)]/40 rounded-2xl cursor-pointer hover:shadow-xl transition-all duration-300 flex flex-col group">
                      <div className="h-44 relative bg-gradient-to-br from-teal-500/20 via-[var(--bg-elevated)] to-[var(--gold)]/20 overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-all duration-300" />
                        <div className="relative z-10 text-center p-4 space-y-2">
                          <span className="inline-flex text-[9px] font-extrabold bg-[var(--gold)] text-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">{trip.travelStyle || 'Explore'}</span>
                          <h3 className="text-sm font-editorial font-bold text-white line-clamp-2 px-2 drop-shadow-md">{trip.title}</h3>
                        </div>
                        <button onClick={(e) => handleDeleteTrip(e, trip.id)} className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50 hover:bg-rose-600/90 text-white flex items-center justify-center backdrop-blur-sm transition-all z-20 opacity-0 group-hover:opacity-100" title={vi ? 'Xóa hành trình' : 'Delete'}>
                          <Trash2 size={12} />
                        </button>
                        <span className="absolute bottom-2.5 left-2.5 bg-black/50 text-[10px] text-white/90 px-2 py-0.5 rounded-md backdrop-blur-sm z-10">{createdDate}</span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                            <MapPin size={12} className="text-[var(--gold)]" /><span>{trip.destinationName}</span>
                          </div>
                          {trip.description && <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">{trip.description}</p>}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-3">
                          <div className="flex gap-4">
                            <span className="font-bold text-[var(--text-primary)]">{totalDays} {vi ? 'ngày' : 'days'}</span>
                            <span>{formattedCost} đ</span>
                          </div>
                          <span className="text-[var(--gold)] font-semibold flex items-center gap-1 group-hover:underline">{vi ? 'Xem lịch trình' : 'View'} <ExternalLink size={9} /></span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden lg:block">
          <div className="sticky top-[142px]">
            <SavedRightSidebar />
          </div>
        </aside>

      </div>
    </div>
  );
}
