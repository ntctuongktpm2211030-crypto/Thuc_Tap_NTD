// SavedPage v2 – 3-column layout (same as SocialFeedPage)
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import {
  Bookmark, ExternalLink, Heart, MessageCircle, Trash2,
  Calendar, DollarSign, MapPin, Compass, Clock, Sparkles,
  FileImage, LayoutGrid, List, Globe, TrendingUp, Users, Flame,
  Home, Bot, X,
} from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { postsService, tripsService, socialService, mapService, Post } from '../../services/smartTravel.service';
import { mapApiPostsToFeed } from '../../utils/apiPostMapper';
import { FeedPost, getPostImages } from '../../utils/feedUtils';
import PostDetailModal from '../../components/feed/PostDetailModal';
import { loadUserProfileCache } from '../../utils/feedPostStorage';

import { computeHotDestinationsThisMonth, sortCompanionsByFollowers, cleanCardText } from '../../utils/feedUtils';

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
    notes: cleanCardText(originalNotes),
    activityName: act.destination?.name || act.activityName || 'Điểm tham quan',
    locationName: act.destination?.address || act.destination?.name || act.locationName || 'Địa điểm',
  };
}

// ── LEFT SIDEBAR ──────────────────────────────────────────────
const SavedLeftSidebar = ({ savedCount }: { savedCount: number }) => {
  const { t } = useLang();
  const user = useSelector((s: RootState) => s.auth.user);
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const profileCache = loadUserProfileCache();
  const [profileStats, setProfileStats] = useState({
    posts: savedCount,
    trips: 0,
    followers: 0,
    location: profileCache.location || 'Chưa cập nhật vị trí'
  });

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      socialService.getProfile(user.id)
        .then(data => {
          if (data) {
            setProfileStats({
              posts: data._count?.posts ?? savedCount,
              trips: data._count?.trips ?? 0,
              followers: data._count?.followers ?? 0,
              location: data.profile?.homeLocation || data.homeLocation || profileCache.location || 'Chưa cập nhật vị trí'
            });
          }
        })
        .catch(err => console.error('Sidebar fetch profile error:', err));

      tripsService.LayDanhSachChuyenDi()
        .then(trips => {
          if (Array.isArray(trips)) {
            setProfileStats(prev => ({ ...prev, trips: trips.length }));
          }
        })
        .catch(() => {});
    }
  }, [user?.id, isAuthenticated, savedCount]);

  const displayName = isAuthenticated && user?.fullName ? user.fullName : t('auth.loginToPost');
  const locationLabel = isAuthenticated ? profileStats.location : 'Đăng nhập để xem hồ sơ';

  const navLinks = [
    { icon: Home,    label: t('nav.quick.feed'),      href: '/',               color: 'text-amber-400' },
    { icon: Compass, label: t('nav.quick.explore'),   href: '/explore',        color: 'text-violet-400' },
    { icon: MapPin,  label: t('nav.quick.map'),        href: '/map',            color: 'text-teal-400' },
    { icon: Sparkles,label: t('nav.quick.aiPlanner'), href: '/trips',          color: 'text-sky-400' },
    { icon: Bot,     label: 'Trợ lý ảo',               href: '/chat',           color: 'text-rose-400' },
  ];

  return (
    <div className="space-y-4">
      {/* Profile mini card */}
      <div className="profile-mini animate-fade-in">
        <div className="profile-mini-cover">
          <div className="absolute top-2 right-4 w-8 h-8 rounded-full bg-[var(--gold)]/20 animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute top-4 right-10 w-5 h-5 rounded-full bg-violet-500/20 animate-float" style={{ animationDelay: '1s' }} />
        </div>
        <Link to={isAuthenticated ? '/profile' : '/auth'} className="block cursor-pointer group">
          <div className="profile-mini-avatar">
            <img src={user?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} alt="" className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform" />
          </div>
          <div className="pt-9 pb-4 px-4">
            <h4 className="font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--gold)] transition-colors">{displayName}</h4>
            <p className="text-[11px] text-[var(--text-muted)] mb-3 flex items-center gap-1 truncate">
              <MapPin size={10} className="text-[var(--gold)] flex-shrink-0" /> {locationLabel}
            </p>
            <div className="grid grid-cols-3 gap-0 divide-x divide-[var(--border-subtle)] text-center py-2 bg-[var(--bg-elevated)] rounded-xl">
              {[
                [String(profileStats.posts), t('sidebar.profile.posts')],
                [String(profileStats.trips), t('sidebar.profile.trips')],
                [String(profileStats.followers), t('sidebar.profile.followers')],
              ].map(([n, l], i) => (
                <div key={i} className="py-1">
                  <div className="text-sm font-bold text-[var(--text-primary)]">{n}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </Link>
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

const SavedRightSidebar = () => {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const vi = lang === 'vi';

  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [apiPosts, setApiPosts] = useState<any[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const loggedInUser = useSelector((s: RootState) => s.auth.user);

  useEffect(() => {
    socialService.searchUsers('')
      .then(users => {
        if (Array.isArray(users)) setRegisteredUsers(users);
      })
      .catch(err => console.error(err));

    postsService.feed({ page: 1, limit: 6 })
      .then(res => {
        if (res && Array.isArray(res.posts)) setApiPosts(res.posts);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (loggedInUser?.id) {
      socialService.getFollowing(loggedInUser.id)
        .then((list: { id: string }[]) => setFollowingIds(new Set(list.map(u => u.id))))
        .catch(() => setFollowingIds(new Set()));
    }
  }, [loggedInUser?.id]);

  const hotDestinations = useMemo(() => {
    // Map backend format to FeedPost format for computeHotDestinationsThisMonth
    const mapped = apiPosts.map(p => {
      const parsed = (() => {
        try {
          return JSON.parse(p.content);
        } catch {
          return null;
        }
      })();
      return {
        id: p.id,
        destination: p.destinationName || parsed?.destination || 'Việt Nam',
        destinationKey: (p.destinationName || parsed?.destination || 'vietnam').toLowerCase().replace(/\s+/g, '-'),
        postedAt: new Date(p.createdAt),
        images: p.mediaUrls || parsed?.mediaUrls || []
      };
    });
    return computeHotDestinationsThisMonth(mapped as any);
  }, [apiPosts]);

  const dynamicCompanions = useMemo(() => {
    const list = registeredUsers
      .filter(u => u.id !== loggedInUser?.id)
      .map(u => ({
        id: u.id,
        name: u.profile?.fullName || u.fullName || u.email,
        avatar: u.profile?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
        handle: `@${(u.profile?.fullName || u.fullName || u.email).split(' ').pop().toLowerCase()}`,
        followers: u._count?.followers ?? u.followers ?? 0,
      }));
    return sortCompanionsByFollowers(list as any, 5);
  }, [registeredUsers, loggedInUser?.id]);

  const handleToggleFollowUser = async (userId: string) => {
    if (!loggedInUser) {
      navigate('/auth');
      return;
    }
    try {
      const res = await socialService.toggleFollow(userId);
      setFollowingIds(prev => {
        const next = new Set(prev);
        if (res.following) next.add(userId);
        else next.delete(userId);
        return next;
      });

      setRegisteredUsers(prev => prev.map(u => {
        if (u.id === userId) {
          const currentCount = u._count?.followers ?? u.followers ?? 0;
          const updatedCount = typeof res.followersCount === 'number'
            ? res.followersCount
            : (res.following ? currentCount + 1 : Math.max(0, currentCount - 1));
          return {
            ...u,
            followers: updatedCount,
            _count: {
              ...(u._count || {}),
              followers: updatedCount,
            }
          };
        }
        return u;
      }));
    } catch (err) {
      console.error(err);
    }
  };

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
          {dynamicCompanions.map((traveler: any) => (
            <div key={traveler.id} className="flex items-center gap-3 group">
              <Link to={`/profile/${traveler.id}`} className="block hover:scale-105 transition-transform cursor-pointer flex-shrink-0">
                <img src={traveler.avatar} alt={traveler.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-[var(--border-normal)] group-hover:ring-[var(--gold)] transition-all" />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-[var(--text-primary)] truncate">{traveler.name}</span>
                  {followingIds.has(traveler.id) && (
                    <span className="text-[9px] text-blue-500 font-extrabold flex-shrink-0">
                      {vi ? 'Đã theo dõi' : 'Followed'}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[var(--text-muted)]">{traveler.handle} · {traveler.followers} {t('sidebar.followers')}</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleFollowUser(traveler.id)}
                className={`btn-follow text-[10px] px-3 py-1.5 flex-shrink-0 cursor-pointer ${
                  followingIds.has(traveler.id) ? 'bg-transparent text-slate-500 border border-slate-300' : ''
                }`}
              >
                {followingIds.has(traveler.id) ? (vi ? 'Bỏ theo dõi' : 'Unfollow') : (vi ? 'Theo dõi' : 'Follow')}
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
  const cleaned = cleanCardText(content);
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object') {
      return {
        headline: cleanCardText(parsed.headline || parsed.title),
        body: cleanCardText(parsed.body || parsed.excerpt || parsed.content || parsed.note || cleaned),
        category: parsed.category || ''
      };
    }
  } catch (e) {}
  return {
    headline: '',
    body: cleaned,
    category: ''
  };
}

function extractCardImage(item: any): string | null {
  if (!item) return null;

  if (Array.isArray(item.images) && item.images.length > 0) {
    const valid = item.images.find((img: any) => typeof img === 'string' && img.trim().length > 0);
    if (valid) return valid;
  }

  if (Array.isArray(item.imageUrls) && item.imageUrls.length > 0) {
    const valid = item.imageUrls.find((img: any) => typeof img === 'string' && img.trim().length > 0);
    if (valid) return valid;
  }

  if (Array.isArray(item.photos) && item.photos.length > 0) {
    const valid = item.photos.find((img: any) => typeof img === 'string' && img.trim().length > 0);
    if (valid) return valid;
  }

  if (Array.isArray(item.mediaUrls) && item.mediaUrls.length > 0) {
    const valid = item.mediaUrls.find((img: any) => typeof img === 'string' && img.trim().length > 0);
    if (valid) return valid;
  }

  if (typeof item.imageUrl === 'string' && item.imageUrl.trim().length > 0) return item.imageUrl;
  if (typeof item.image === 'string' && item.image.trim().length > 0) return item.image;
  if (typeof item.cover === 'string' && item.cover.trim().length > 0) return item.cover;
  if (typeof item.coverUrl === 'string' && item.coverUrl.trim().length > 0) return item.coverUrl;

  if (item.rawCheckin) {
    const rawResult = extractCardImage(item.rawCheckin);
    if (rawResult) return rawResult;
  }

  const rawContent = item.content || item.note;
  if (typeof rawContent === 'string' && rawContent.trim().length > 0) {
    try {
      const parsed = JSON.parse(rawContent);
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.imageUrls) && parsed.imageUrls.length > 0) {
          const v = parsed.imageUrls.find((img: any) => typeof img === 'string' && img.trim().length > 0);
          if (v) return v;
        }
        if (Array.isArray(parsed.images) && parsed.images.length > 0) {
          const v = parsed.images.find((img: any) => typeof img === 'string' && img.trim().length > 0);
          if (v) return v;
        }
        if (Array.isArray(parsed.photos) && parsed.photos.length > 0) {
          const v = parsed.photos.find((img: any) => typeof img === 'string' && img.trim().length > 0);
          if (v) return v;
        }
        if (Array.isArray(parsed.mediaUrls) && parsed.mediaUrls.length > 0) {
          const v = parsed.mediaUrls.find((img: any) => typeof img === 'string' && img.trim().length > 0);
          if (v) return v;
        }
        if (typeof parsed.imageUrl === 'string' && parsed.imageUrl.trim().length > 0) return parsed.imageUrl;
        if (typeof parsed.image === 'string' && parsed.image.trim().length > 0) return parsed.image;
        if (typeof parsed.cover === 'string' && parsed.cover.trim().length > 0) return parsed.cover;
      }
    } catch {}
  }

  return null;
}

function formatTripForSavedPage(item: any, vi: boolean) {
  if (!item) return null;

  const rawDest = item.destinationName || item.destination || item.itinerary?.destination || item.itinerary?.destinationName || 'Việt Nam';
  const destName = typeof rawDest === 'object' ? (rawDest.name || rawDest.address || 'Việt Nam') : String(rawDest);
  const capDest = destName.replace(/\b\w/g, (c: string) => c.toUpperCase());

  const rawDays = item.days || item.itinerary?.days || [];
  const durationDays = item.durationDays || (Array.isArray(rawDays) ? rawDays.length : 1);

  const daysArr = Array.isArray(rawDays) && rawDays.length > 0 ? rawDays.map((d: any, idx: number) => ({
    id: d.id || `day-${idx + 1}`,
    dayIndex: d.dayIndex || d.day || (idx + 1),
    title: d.title || d.dayTitle || (vi ? `Ngày ${idx + 1}` : `Day ${idx + 1}`),
    activities: (d.activities || []).map((act: any, actIdx: number) => ({
      id: act.id || `act-${actIdx + 1}`,
      activityName: act.activityName || act.name || 'Hoạt động trải nghiệm',
      locationName: act.locationName || act.address || destName,
      startTime: act.startTime || (act.timeSlot ? act.timeSlot.split('-')[0]?.trim() : '08:00'),
      endTime: act.endTime || (act.timeSlot ? act.timeSlot.split('-')[1]?.trim() : '10:00'),
      notes: act.notes || act.description || act.note || '',
      estimatedCost: Number(act.estimatedCost) || 0,
    }))
  })) : Array.from({ length: durationDays }, (_, idx) => ({
    id: `day-${idx + 1}`,
    dayIndex: idx + 1,
    title: vi ? `Ngày ${idx + 1}` : `Day ${idx + 1}`,
    activities: [
      {
        id: `act-1`,
        activityName: vi ? `Tham quan & Khám phá ${capDest}` : `Explore ${capDest}`,
        locationName: capDest,
        startTime: '08:00',
        endTime: '12:00',
        notes: vi ? `Hành trình tự do khám phá các điểm nổi tiếng tại ${capDest}.` : `Self-guided exploration at ${capDest}.`,
        estimatedCost: 0
      }
    ]
  }));

  const title = item.title || (vi ? `Khám phá ${capDest} (${durationDays} ngày)` : `Explore ${capDest} (${durationDays} days)`);
  const travelStyle = item.travelStyle || item.style || 'Phiêu lưu';
  const totalBudget = item.totalBudget || item.totalEstimatedCost || item.itinerary?.totalEstimatedCost || 0;
  const startDate = item.startDate || item.createdAt || new Date().toISOString();
  const createdAt = item.createdAt || item.updatedAt || new Date().toISOString();

  return {
    ...item,
    id: item.id || `trip-${Date.now()}-${Math.random()}`,
    title,
    destinationName: capDest,
    travelStyle,
    totalBudget,
    startDate,
    createdAt,
    days: daysArr,
    description: item.description || (vi ? `Lộ trình khám phá ${capDest} trong ${durationDays} ngày cùng Terraholic AI Planner.` : `Itinerary for ${capDest} (${durationDays} days) with Terraholic AI Planner.`),
  };
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function SavedPage() {
  const { lang } = useLang();
  const vi = lang === 'vi';

  const [activeTab, setActiveTab] = useState<'posts' | 'trips' | 'checkins'>('posts');
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [savedTrips, setSavedTrips] = useState<any[]>([]);
  const [savedCheckins, setSavedCheckins] = useState<any[]>([]);
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
      const [posts, tripsRes, aiHistoryRes, backendCheckinsRes] = await Promise.all([
        postsService.LayBaiVietDaLuuCuaToi().catch(() => []),
        tripsService.LayDanhSachChuyenDi().catch(() => []),
        tripsService.LayLichSuTaoChuyenDiAI().catch(() => []),
        mapService.myCheckins().catch(() => []),
      ]);
      setSavedPosts(posts);

      const rawAiHistory = localStorage.getItem('smarttravel_ai_history');
      const localAiHistory = rawAiHistory ? JSON.parse(rawAiHistory) : [];

      const mergedTripsMap = new Map();

      if (Array.isArray(tripsRes)) {
        tripsRes.forEach((t: any) => {
          if (t.id) {
            const formatted = formatTripForSavedPage(t, vi);
            if (formatted) mergedTripsMap.set(t.id, formatted);
          }
        });
      }

      if (Array.isArray(aiHistoryRes)) {
        aiHistoryRes.forEach((h: any) => {
          if (h.id && !mergedTripsMap.has(h.id)) {
            const formatted = formatTripForSavedPage(h, vi);
            if (formatted) mergedTripsMap.set(h.id, formatted);
          }
        });
      }

      if (Array.isArray(localAiHistory)) {
        localAiHistory.forEach((h: any) => {
          if (h.id && !mergedTripsMap.has(h.id)) {
            const formatted = formatTripForSavedPage(h, vi);
            if (formatted) mergedTripsMap.set(h.id, formatted);
          }
        });
      }

      setSavedTrips(Array.from(mergedTripsMap.values()));

      const rawCheckins = localStorage.getItem('saved_checkins');
      const localCheckins = rawCheckins ? JSON.parse(rawCheckins) : [];

      const formattedBackendCheckins = Array.isArray(backendCheckinsRes) ? backendCheckinsRes.map(c => {
        let noteText = '';
        let checkinImages: string[] = [];
        if (c.destination?.imageUrl) checkinImages.push(c.destination.imageUrl);

        if (c.note && typeof c.note === 'string') {
          const trimmed = c.note.trim();
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
              const parsed = JSON.parse(trimmed);
              noteText = parsed.text || parsed.note || parsed.body || parsed.content || '';
              if (typeof parsed.imageUrl === 'string' && parsed.imageUrl.trim().length > 0) checkinImages.push(parsed.imageUrl);
              if (Array.isArray(parsed.imageUrls)) checkinImages.push(...parsed.imageUrls);
              if (Array.isArray(parsed.images)) checkinImages.push(...parsed.images);
              if (Array.isArray(parsed.photos)) checkinImages.push(...parsed.photos);
              if (Array.isArray(parsed.mediaUrls)) checkinImages.push(...parsed.mediaUrls);
            } catch (e) {
              noteText = c.note;
            }
          } else {
            noteText = c.note;
          }
        }

        const validImages = Array.from(new Set(checkinImages.filter((img: any) => typeof img === 'string' && img.trim().length > 0)));

        return {
          id: `checkin-db-${c.id}`,
          destination: cleanCardText(c.destination?.name || c.destination?.address || 'Địa điểm check-in'),
          content: cleanCardText(noteText || `Đã check-in tại ${c.destination?.name || 'địa điểm du lịch'}`),
          images: validImages,
          imageUrls: validImages,
          imageUrl: validImages[0] || '',
          coverUrl: validImages[0] || '',
          date: new Date(c.createdAt).toLocaleDateString('vi-VN'),
          author: {
            name: c.user?.profile?.fullName || c.user?.fullName || c.user?.email || 'Tôi',
            avatar: c.user?.profile?.avatarUrl || (c.user as any)?.avatarUrl || c.user?.avatar,
          },
          likes: 0,
          rawCheckin: c,
        };
      }) : [];

      const mergedCheckinsMap = new Map();
      localCheckins.forEach((item: any) => { if (item.id) mergedCheckinsMap.set(item.id, item); });
      formattedBackendCheckins.forEach((item: any) => { if (item.id && !mergedCheckinsMap.has(item.id)) mergedCheckinsMap.set(item.id, item); });

      setSavedCheckins(Array.from(mergedCheckinsMap.values()));
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

  const handleUnsaveCheckin = (e: React.MouseEvent, checkinId: string) => {
    e.stopPropagation();
    try {
      const raw = localStorage.getItem('saved_checkins');
      let currentSavedList = raw ? JSON.parse(raw) : [];
      currentSavedList = currentSavedList.filter((p: any) => p.id !== checkinId);
      localStorage.setItem('saved_checkins', JSON.stringify(currentSavedList));
      setSavedCheckins(currentSavedList);
    } catch (err) {
      console.error(err);
    }
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
      await tripsService.XoaChuyenDi(tripId).catch(() => {});

      const rawAiHistory = localStorage.getItem('smarttravel_ai_history');
      if (rawAiHistory) {
        try {
          const parsed = JSON.parse(rawAiHistory);
          const updated = parsed.filter((h: any) => h.id !== tripId);
          localStorage.setItem('smarttravel_ai_history', JSON.stringify(updated));
        } catch (e) {}
      }

      setSavedTrips(prev => prev.filter(t => t.id !== tripId));
    } catch (err) { console.error(err); }
  };

  const handlePostClick = (post: any) => {
    if (post.id && post.id.startsWith('checkin-')) {
      setSelectedPost(post);
      return;
    }
    const mapped = mapApiPostsToFeed([post])[0];
    if (mapped) setSelectedPost(mapped);
  };

  return (
    <div className="relative min-h-screen bg-slate-50/80 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans overflow-x-clip animate-fade-in">
      {/* ── Travel Geo-Grid & Pattern Vector Overlay ── */}
      <svg className="absolute inset-0 w-full h-full opacity-25 dark:opacity-10 pointer-events-none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="travel-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <circle cx="40" cy="40" r="1.5" className="fill-brand-500/50" />
            <path d="M0 40H80M40 0V80" strokeWidth="0.5" strokeDasharray="6 6" className="stroke-slate-300 dark:stroke-slate-800" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#travel-grid)" />
      </svg>

      {/* ── Background Compass & Flight Arc Vector Artwork ── */}
      <svg className="absolute top-12 right-12 w-96 h-96 opacity-15 dark:opacity-10 text-brand-500 pointer-events-none" viewBox="0 0 200 200" fill="none" stroke="currentColor">
        <circle cx="100" cy="100" r="80" strokeWidth="1" strokeDasharray="6 6" />
        <circle cx="100" cy="100" r="60" strokeWidth="0.5" />
        <path d="M100 10 L100 190 M10 100 L190 100" strokeWidth="1" />
      </svg>

      {/* ── Multi-Layer Vibrant Ambient Glow Mesh ── */}
      <div className="absolute top-10 left-10 w-[700px] h-[700px] bg-gradient-to-tr from-brand-500/20 via-sky-500/15 to-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[500px] right-10 w-[600px] h-[600px] bg-gradient-to-bl from-purple-600/18 via-pink-500/15 to-amber-500/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[550px] h-[550px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

      {/* Modals outside relative container to prevent stacking context z-index issues with Navbar */}
      {/* Post Detail Modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => {
            setSelectedPost(null);
            void fetchSavedData();
          }}
          labels={{ close: vi ? 'Đóng' : 'Close', readTime: '', likes: vi ? 'lượt thích' : 'likes', comments: vi ? 'bình luận' : 'comments' }}
        />
      )}

      {/* Trip Detail Modal */}
      {selectedTrip && createPortal(
        <div className="fixed inset-0 z-[9999999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in" onClick={() => { setSelectedTrip(null); setSelectedDayIdx(0); }}>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="p-5 sm:p-6 border-b border-[var(--border-subtle)] flex items-start justify-between bg-gradient-to-r from-[var(--gold)]/10 via-transparent to-transparent">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-[var(--gold)] font-bold uppercase tracking-wider">
                  <Compass size={14} /> {vi ? 'Lịch trình du lịch' : 'Travel Itinerary'}
                </div>
                <h2 className="text-xl font-editorial font-bold text-[var(--text-primary)]">{selectedTrip.title}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)] pt-1">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {selectedTrip.destinationName}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(selectedTrip.startDate).toLocaleDateString('vi-VN')}</span>
                  <span className="flex items-center gap-1"><DollarSign size={12} /> {selectedTrip.totalBudget?.toLocaleString('vi-VN')} đ</span>
                  <span className="flex items-center gap-1"><Sparkles size={12} className="text-yellow-500" /> {selectedTrip.travelStyle}</span>
                </div>
              </div>
              <button onClick={() => { setSelectedTrip(null); setSelectedDayIdx(0); }} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer shrink-0">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row min-h-0">
              <div className="w-full md:w-48 border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 space-y-1 overflow-y-auto">
                {selectedTrip.days.map((day: any, idx: number) => (
                  <button key={day.id || idx} onClick={() => setSelectedDayIdx(idx)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs transition-all flex items-center justify-between border cursor-pointer ${selectedDayIdx === idx ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 font-extrabold' : 'bg-transparent text-[var(--text-primary)] border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                    <span className="font-extrabold">{vi ? `Ngày ${idx + 1}` : `Day ${idx + 1}`}</span>
                    <span className={`text-[10px] font-semibold ${selectedDayIdx === idx ? 'text-white/90' : 'opacity-75'}`}>{day.activities?.length || 0} {vi ? 'hoạt động' : 'acts'}</span>
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
        </div>,
        document.body
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && createPortal(
        <div className="fixed inset-0 z-[9999999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
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
        </div>,
        document.body
      )}

      <div className="relative z-10 space-y-6 max-w-[1750px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] xl:grid-cols-[320px_1fr_320px] gap-4 lg:gap-5">

        {/* LEFT SIDEBAR */}
        <aside className="hidden lg:block h-full">
          <div className="sticky top-24 space-y-4">
            <SavedLeftSidebar savedCount={savedPosts.length} />
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
                    {loading ? (vi ? 'Đang tải...' : 'Loading...') : (vi ? `${savedPosts.length} bài viết · ${savedCheckins.length} địa điểm · ${savedTrips.length} hành trình` : `${savedPosts.length} posts · ${savedCheckins.length} checkins · ${savedTrips.length} itineraries`)}
                  </p>
                </div>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title={vi ? 'Hiển thị dạng lưới' : 'Grid View'}
                >
                  <LayoutGrid size={16} strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title={vi ? 'Hiển thị dạng danh sách' : 'List View'}
                >
                  <List size={16} strokeWidth={2.2} />
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
              <button onClick={() => setActiveTab('checkins')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'checkins' ? 'bg-gradient-to-r from-[var(--gold)] to-blue-700 text-white shadow-lg' : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--gold)]/50 hover:text-[var(--gold)]'}`}>
                <MapPin size={13} />
                {vi ? 'Địa điểm check-in' : 'Check-ins'}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${activeTab === 'checkins' ? 'bg-black/20 text-white' : 'bg-[var(--bg-elevated)]'}`}>{savedCheckins.length}</span>
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
                  const mappedPost = mapApiPostsToFeed([post])[0];
                  const cardImg = mappedPost ? (getPostImages(mappedPost)[0] || extractCardImage(post)) : extractCardImage(post);
                  const dateString = new Date(post.createdAt).toLocaleDateString('vi-VN');
                  const parsed = parsePostContent(post.content);

                  if (viewMode === 'list') {
                    return (
                      <div key={post.id} onClick={() => handlePostClick(post)}
                        className="surface-elevated border border-[var(--border-subtle)] hover:border-[var(--gold)]/40 rounded-2xl cursor-pointer hover:shadow-lg transition-all duration-300 flex gap-3 p-4 group">
                        {cardImg && (
                          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                            <img src={cardImg} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                          </div>
                        )}
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
                      {cardImg ? (
                        <div className="h-44 relative bg-gradient-to-br from-violet-600/20 to-rose-600/20 overflow-hidden">
                          <img src={cardImg} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                          <button onClick={(e) => handleUnsavePost(e, post.id)} className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50 hover:bg-rose-600/90 text-white flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100" title={vi ? 'Bỏ lưu' : 'Unsave'}>
                            <Trash2 size={12} />
                          </button>
                          <span className="absolute bottom-2.5 left-2.5 bg-black/50 text-[10px] text-white/90 px-2 py-0.5 rounded-md backdrop-blur-sm">{dateString}</span>
                        </div>
                      ) : (
                        <div className="p-4 pb-0 flex justify-between items-center">
                          <span className="text-[10px] text-[var(--text-muted)]">{dateString}</span>
                          <button onClick={(e) => handleUnsavePost(e, post.id)} className="w-7 h-7 rounded-full bg-black/5 hover:bg-rose-600/90 hover:text-white flex items-center justify-center transition-all" title={vi ? 'Bỏ lưu' : 'Unsave'}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
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
          ) : activeTab === 'checkins' ? (
            savedCheckins.length === 0 ? (
              <div className="surface-elevated py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center">
                  <MapPin size={28} className="text-[var(--text-muted)]" />
                </div>
                <div className="text-center space-y-1.5 max-w-xs">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">{vi ? 'Chưa có địa điểm check-in nào được lưu' : 'No saved check-in locations yet'}</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{vi ? 'Khám phá bản đồ và ghim lại các địa điểm check-in thú vị.' : 'Explore the map and bookmark interesting check-in locations.'}</p>
                </div>
                <Link to="/map" className="btn-gold inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl">
                  <MapPin size={13} strokeWidth={2.5} /> {vi ? 'Xem Bản Đồ' : 'View Map'}
                </Link>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-3'}>
                {savedCheckins.map(post => {
                  const authorName = post.author?.name || 'Người dùng';
                  const avatar = post.author?.avatar;
                  const cardImg = extractCardImage(post);
                  const dateString = post.date || 'Gần đây';

                  if (viewMode === 'list') {
                    return (
                      <div key={post.id} onClick={() => handlePostClick(post)}
                        className="surface-elevated border border-[var(--border-subtle)] hover:border-[var(--gold)]/40 rounded-2xl cursor-pointer hover:shadow-lg transition-all duration-300 flex gap-3 p-4 group">
                        {cardImg && (
                          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                            <img src={cardImg} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              {avatar ? <img src={avatar} alt="" className="w-4 h-4 rounded-full object-cover" /> : <div className="w-4 h-4 rounded-full bg-[var(--gold)] text-black font-bold flex items-center justify-center text-[8px]">{authorName.charAt(0)}</div>}
                              <span className="text-[11px] font-bold text-[var(--text-secondary)]">{authorName}</span>
                              <span className="text-[10px] text-[var(--text-muted)]">· {dateString}</span>
                            </div>
                            <h4 className="text-xs font-bold text-[var(--text-primary)] line-clamp-1 mb-1">{cleanCardText(post.destination)}</h4>
                            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">{cleanCardText(post.content)}</p>
                          </div>
                          <div className="flex items-center justify-between pt-2 text-[10px] text-[var(--text-muted)]">
                            <div className="flex gap-3">
                              <span className="flex items-center gap-1"><Heart size={10} className="text-rose-500 fill-rose-500/20" /> {post.likes}</span>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleUnsaveCheckin(e, post.id); }} className="text-[var(--text-muted)] hover:text-rose-500 transition-colors p-1"><Trash2 size={11} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={post.id} onClick={() => handlePostClick(post)}
                      className="surface-elevated overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--gold)]/40 rounded-2xl cursor-pointer hover:shadow-xl transition-all duration-300 flex flex-col group">
                      {cardImg ? (
                        <div className="h-44 relative bg-gradient-to-br from-violet-600/20 to-rose-600/20 overflow-hidden">
                          <img src={cardImg} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                          <button onClick={(e) => { e.stopPropagation(); handleUnsaveCheckin(e, post.id); }} className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50 hover:bg-rose-600/90 text-white flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100" title={vi ? 'Bỏ lưu' : 'Unsave'}>
                            <Trash2 size={12} />
                          </button>
                          <span className="absolute bottom-2.5 left-2.5 bg-black/50 text-[10px] text-white/90 px-2 py-0.5 rounded-md backdrop-blur-sm">{dateString}</span>
                        </div>
                      ) : (
                        <div className="p-4 pb-0 flex justify-between items-center">
                          <span className="text-[10px] text-[var(--text-muted)]">{dateString}</span>
                          <button onClick={(e) => { e.stopPropagation(); handleUnsaveCheckin(e, post.id); }} className="w-7 h-7 rounded-full bg-black/5 hover:bg-rose-600/90 hover:text-white flex items-center justify-center transition-all" title={vi ? 'Bỏ lưu' : 'Unsave'}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {avatar ? <img src={avatar} alt="" className="w-5 h-5 rounded-full object-cover border border-[var(--border-subtle)]" /> : <div className="w-5 h-5 rounded-full bg-[var(--gold)] text-black font-bold flex items-center justify-center text-[9px]">{authorName.charAt(0)}</div>}
                            <span className="text-[11px] font-bold text-[var(--text-secondary)] truncate">{authorName}</span>
                          </div>
                          <h3 className="text-xs font-bold text-[var(--text-primary)] line-clamp-1">{cleanCardText(post.destination)}</h3>
                          <p className="text-[11px] text-[var(--text-secondary)] leading-normal line-clamp-3">{cleanCardText(post.content)}</p>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-3">
                          <div className="flex gap-3">
                            <span className="flex items-center gap-1"><Heart size={10} className="text-rose-500 fill-rose-500/30" /> {post.likes}</span>
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
                            <span className="text-[9px] font-extrabold bg-blue-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">{trip.travelStyle || 'Explore'}</span>
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
                          <span className="inline-flex text-[10px] font-extrabold bg-blue-600 text-white px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md border border-white/20">{trip.travelStyle || 'Explore'}</span>
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
        <aside className="hidden lg:block h-full">
          <div className="sticky top-24 space-y-4">
            <SavedRightSidebar />
          </div>
        </aside>

      </div>
      </div>
    </div>
  );
}
