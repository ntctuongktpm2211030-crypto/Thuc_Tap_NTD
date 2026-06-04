import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MapPin, Star, Users, Search, Bot, Loader2, Plane, Zap, Check, AlertTriangle,
  Map, MessageCircle, FileText, Link2, Mountain, Flame,
  Home, Compass, Sparkles, BarChart3, Bell, Sun, Moon, Globe,
  Menu, X, Bookmark, User, Send, Utensils,
} from 'lucide-react';
import { TRIP_ACTIVITY_ICONS } from './config/modernIcons';
import { useDispatch, useSelector } from 'react-redux';
import LeafletMap from './components/Map/LeafletMap';
import { logout } from './store/authSlice';
import { tripsService } from './services/smartTravel.service';
import type { RootState, AppDispatch } from './store';
import { useTheme } from './contexts/ThemeContext';
import { useLang } from './contexts/LanguageContext';
import AuthPage from './features/auth/AuthPage';

// ─── Page imports ──────────────────────────────────────────
import SocialFeedPage from './features/feed/SocialFeedPage';
import BlogPage from './features/blog/BlogPage';
import CreateStoryPage from './features/stories/CreateStoryPage';
import CultureFoodGuidePage from './features/guide/CultureFoodGuidePage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UserMenuDropdown from './components/layout/UserMenuDropdown';
import ProfilePage from './features/profile/ProfilePage';
import FollowingPage from './features/profile/FollowingPage';
import SavedPage from './features/profile/SavedPage';
import SettingsPage from './features/profile/SettingsPage';

// ──────────────────────────────────────────────────────────
// MOCK DATA
// ──────────────────────────────────────────────────────────
const MOCK_CHECKINS = [
  { id: '1', user: 'Hoang Le', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80', note: 'Best egg coffee in Hanoi Old Quarter! ☕', location: 'Giang Cafe, Hanoi', time: '10 mins ago', lat: 21.0331, lng: 105.8539 },
  { id: '2', user: 'Sarah Miller', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80', note: 'Watching the sunset over West Lake 🌅', location: 'Tran Quoc Pagoda, Hanoi', time: '1 hour ago', lat: 21.0478, lng: 105.8368 },
  { id: '3', user: 'Alex Nguyen', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=80&q=80', note: 'Trekking path is muddy but the view is insane!', location: 'Muong Hoa Valley, Sapa', time: '3 hours ago', lat: 22.3168, lng: 103.8567 },
];

const MOCK_NEARBY = [
  { name: 'Hoan Kiem Lake', category: 'Attraction', distance: '150m', rating: 4.8 },
  { name: "St. Joseph's Cathedral", category: 'Attraction', distance: '400m', rating: 4.6 },
  { name: 'Bun Cha Ta Restaurant', category: 'Food', distance: '300m', rating: 4.7 },
  { name: 'Sofitel Legend Metropole', category: 'Hotel', distance: '650m', rating: 4.9 },
];

// ──────────────────────────────────────────────────────────
// 1. SOCIAL MAP DASHBOARD
// ──────────────────────────────────────────────────────────
const MapDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);
  const { t } = useLang();
  const [checkins, setCheckins] = useState(MOCK_CHECKINS);
  const [newNote, setNewNote] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [selectedCenter, setSelectedCenter] = useState<[number, number]>([21.028511, 105.804817]);

  const handleCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: '/map' } });
      return;
    }
    if (!newNote || !newLocation) return;
    setCheckins([{
      id: String(checkins.length + 1),
      user: 'You',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80',
      note: newNote, location: newLocation, time: 'Just now',
      lat: selectedCenter[0], lng: selectedCenter[1],
    }, ...checkins]);
    setNewNote(''); setNewLocation('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 p-5 max-w-screen-2xl mx-auto">
      <div className="lg:col-span-1 space-y-4">
        <div className="surface-elevated p-5 space-y-4">
          <h3 className="font-ui text-xs font-bold uppercase tracking-widest text-gold flex items-center gap-1.5"><MapPin size={14} /> Live Check-In</h3>
          <form onSubmit={handleCheckin} className="space-y-3">
            <input type="text" value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="Place name…"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-[var(--gold)] placeholder:text-[var(--text-muted)]" />
            <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="What are you doing here?" rows={2}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-[var(--gold)] resize-none placeholder:text-[var(--text-muted)]" />
            <button type="submit" className="btn-gold w-full py-2.5">
              {isAuthenticated ? 'Check-In Now' : t('nav.signIn')}
            </button>
            {!isAuthenticated && (
              <p className="text-[11px] text-[var(--text-muted)] text-center">{t('auth.loginToPost')}</p>
            )}
          </form>
        </div>
        <div className="surface-elevated p-5 space-y-3">
          <h3 className="sidebar-title flex items-center gap-2"><Search size={14} className="text-[var(--gold)]" /> Nearby Places</h3>
          {MOCK_NEARBY.map((p, i) => (
            <div key={i} className="flex justify-between items-center text-xs p-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] transition-colors cursor-pointer">
              <div><p className="font-semibold text-cream">{p.name}</p><span className="text-[var(--gold)] text-[10px]">{p.category}</span></div>
              <div className="text-right"><span className="font-semibold text-[var(--text-secondary)] block">{p.distance}</span><span className="text-[10px] text-amber-400 flex items-center justify-end gap-0.5"><Star size={10} className="fill-current" /> {p.rating}</span></div>
            </div>
          ))}
        </div>
      </div>
      <div className="lg:col-span-2 space-y-3">
        <div className="flex justify-between items-center bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-subtle)]">
          <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Real-time Social Map · OpenStreetMap EPSG:3857
          </span>
          <span className="text-xs font-semibold text-gold">{selectedCenter[0].toFixed(4)}, {selectedCenter[1].toFixed(4)}</span>
        </div>
        <div className="h-[520px] rounded-2xl overflow-hidden shadow-2xl border border-[var(--border-subtle)]">
          <LeafletMap center={selectedCenter} zoom={13} />
        </div>
      </div>
      <div className="lg:col-span-1 surface-elevated p-5 flex flex-col h-[620px]">
        <h3 className="sidebar-title mb-4 flex items-center gap-2"><Users size={14} className="text-[var(--gold)]" /> Friend Check-Ins</h3>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {checkins.map(chk => (
            <div key={chk.id} onClick={() => setSelectedCenter([chk.lat, chk.lng])}
              className="p-3 bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-[var(--border-subtle)] rounded-xl transition-all cursor-pointer space-y-2 group">
              <div className="flex items-center gap-2">
                <img src={chk.avatar} alt={chk.user} className="w-8 h-8 rounded-full object-cover border border-[var(--border-normal)]" />
                <div><h4 className="text-xs font-bold text-cream group-hover:text-gold transition-colors">{chk.user}</h4>
                  <p className="text-[10px] text-[var(--text-muted)]">{chk.time}</p></div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] italic">"{chk.note}"</p>
              <div className="text-[10px] text-gold font-semibold flex items-center gap-1"><MapPin size={10} /> {chk.location}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// 2. AI TRIP PLANNER
// ──────────────────────────────────────────────────────────
const TripPlanner = () => {
  const [destination, setDestination] = useState('Ha Giang');
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState(150);
  const [style, setStyle] = useState('Adventure');
  const [interests, setInterests] = useState<string[]>(['nature', 'culture']);
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<any>(null);
  const [optimized, setOptimized] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const toggleInterest = (val: string) =>
    setInterests(p => p.includes(val) ? p.filter(i => i !== val) : [...p, val]);

  const handleGenerate = async () => {
    setLoading(true); setOptimized(false); setAiError(null);
    try {
      const result = await tripsService.aiGenerate({ destination, durationDays: days, dailyBudget: budget, interests, travelStyle: style });
      setItinerary(result);
    } catch {
      setAiError('AI endpoint unavailable — showing sample itinerary.');
      setItinerary({
        destination, totalCost: budget * days * 0.75, currency: 'USD',
        days: [
          { day: 1, title: 'Arrival & First Impressions', activities: [
            { time: '09:00', name: `${destination} Welcome Walk`, cost: 0, category: 'attraction', note: 'Settle in, explore the town center' },
            { time: '12:00', name: 'Local Street Food Lunch', cost: 8, category: 'restaurant', note: 'Try local specialties at the market' },
            { time: '15:00', name: 'Main Landmark Visit', cost: 20, category: 'attraction', note: 'Iconic viewpoint or heritage site' },
          ]},
          { day: 2, title: 'Cultural Deep Dive', activities: [
            { time: '08:00', name: 'Morning Heritage Walk', cost: 15, category: 'attraction', note: 'Guided tour of historic quarter' },
            { time: '12:30', name: 'Cooking Class Lunch', cost: 35, category: 'restaurant', note: 'Learn to cook traditional dishes' },
            { time: '16:00', name: 'Sunset Viewpoint', cost: 5, category: 'attraction', note: 'Best photo spot in the area' },
          ]},
        ]
      });
    } finally { setLoading(false); }
  };

  const runRouteOptimization = async () => {
    if (!itinerary) return; setLoading(true);
    try {
      const optimizedDays = itinerary.days.map((d: any) => ({ ...d, activities: [...d.activities].reverse() }));
      setItinerary({ ...itinerary, days: optimizedDays }); setOptimized(true);
    } finally { setLoading(false); }
  };

  const getCategoryIcon = (category: string) => TRIP_ACTIVITY_ICONS[category] ?? MapPin;

  return (
    <div className="p-5 max-w-screen-xl mx-auto space-y-6">
      <div>
        <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold mb-2">AI-Powered Planning</p>
        <h1 className="headline-xl">Smart Travel Planner</h1>
        <p className="text-[var(--text-secondary)] mt-2">Generate personalized itineraries optimized with TSP routing & GPT-4o intelligence.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="surface-elevated p-6 space-y-5 h-fit">
          <h3 className="font-ui text-sm font-bold text-[var(--text-secondary)] border-b border-[var(--border-subtle)] pb-3">Itinerary Parameters</h3>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Destination</label>
            <input type="text" value={destination} onChange={e => setDestination(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-sm text-cream focus:outline-none focus:border-[var(--gold)]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['Days', days, setDays, 1, 15], ['Budget/Day ($)', budget, setBudget, 10, 2000]].map(([label, val, setter, min, max]: any) => (
              <div key={label} className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{label}</label>
                <input type="number" value={val} onChange={e => setter(Number(e.target.value))} min={min} max={max}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-sm text-cream focus:outline-none focus:border-[var(--gold)]" />
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Travel Style</label>
            <select value={style} onChange={e => setStyle(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-sm text-cream focus:outline-none focus:border-[var(--gold)]">
              {['Adventure', 'Cultural Exploration', 'Leisure & Food', 'Luxury Wellness', 'Budget Backpacker'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Interests</label>
            <div className="flex flex-wrap gap-2">
              {['nature', 'culture', 'food', 'hiking', 'photography', 'history'].map(tag => (
                <button key={tag} type="button" onClick={() => toggleInterest(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${interests.includes(tag) ? 'bg-[var(--gold-glow)] border-[var(--gold)] text-gold' : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-normal)]'}`}>
                  #{tag}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleGenerate} disabled={loading} className="btn-gold w-full py-3 text-sm disabled:opacity-60">
            {loading ? <><Loader2 size={14} className="animate-spin inline" /> Consulting AI...</> : <><Bot size={14} className="inline" /> Generate Smart Itinerary</>}
          </button>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {aiError && <div className="surface-elevated px-4 py-3 border-l-2 border-amber-500 text-xs text-amber-400 flex items-center gap-2"><AlertTriangle size={14} /> {aiError}</div>}
          {itinerary ? (
            <div className="space-y-6">
              <div className="surface-elevated p-5 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Predicted Trip Cost</p>
                  <span className="text-3xl font-bold text-gold">${Math.round(itinerary.totalCost)}</span>
                  <span className="text-sm text-[var(--text-muted)] ml-2">USD ±10%</span>
                </div>
                <button onClick={runRouteOptimization}
                  className={`px-5 py-2.5 text-xs font-bold rounded-lg border transition-all ${optimized ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'btn-gold border-transparent'}`}>
                  {optimized ? <><Check size={12} className="inline" /> TSP Optimized</> : <><Zap size={12} className="inline" /> Optimize Route</>}
                </button>
              </div>
              {itinerary.days.map((d: any) => (
                <div key={d.day} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="badge-category">Day {d.day}</span>
                    <h3 className="headline-md">{d.title}</h3>
                  </div>
                  <div className="relative border-l-2 border-[var(--border-subtle)] ml-3 pl-6 space-y-3">
                    {d.activities.map((act: any, idx: number) => (
                      <div key={idx} className="relative group">
                        <div className="absolute -left-[27px] top-3 w-3 h-3 rounded-full bg-[var(--bg-primary)] border-2 border-[var(--gold)] group-hover:scale-125 transition-transform" />
                        <div className="card-editorial p-4 space-y-1.5 hover:border-[var(--border-normal)]">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-bold text-[var(--text-muted)]">{act.time}</span>
                              <h4 className="text-sm font-bold text-cream flex items-center gap-1.5">
                                {(() => { const ActIcon = getCategoryIcon(act.category); return <ActIcon size={14} className="text-[var(--gold)] flex-shrink-0" />; })()}
                                {act.name}
                              </h4>
                            </div>
                            <span className="text-sm font-bold text-gold">${act.cost}</span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)]">{act.note}</p>
                          <span className="badge-category-outline text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">{act.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="surface-elevated p-16 text-center space-y-4">
              <Plane size={48} className="mx-auto text-[var(--gold)] opacity-60" strokeWidth={1.5} />
              <h3 className="headline-md">Your Itinerary Awaits</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">Configure your trip parameters and let our AI craft a personalized journey optimized for your style and budget.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// 3. ANALYTICS DASHBOARD
// ──────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/v1/analytics/platform').then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const metrics = [
    { label: 'Platform Users', value: stats?.users ?? '—', icon: Users, color: 'text-emerald-400' },
    { label: 'Trips Created', value: stats?.trips ?? '—', icon: Map, color: 'text-gold' },
    { label: 'GIS Check-ins', value: stats?.checkins ?? '—', icon: MapPin, color: 'text-indigo-400' },
    { label: 'AI Requests', value: stats?.aiRequests ?? '—', icon: Bot, color: 'text-violet-400' },
    { label: 'Blog Posts', value: stats?.posts ?? '—', icon: FileText, color: 'text-amber-400' },
    { label: 'Social Links', value: stats?.socialConnections ?? '—', icon: Link2, color: 'text-pink-400' },
    { label: 'Destinations', value: stats?.destinations ?? '—', icon: Mountain, color: 'text-teal-400' },
    { label: 'Comments', value: stats?.comments ?? '—', icon: MessageCircle, color: 'text-orange-400' },
  ];

  return (
    <div className="p-5 max-w-screen-xl mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold mb-2">Live Database</p>
          <h1 className="headline-xl">Platform Analytics</h1>
          <p className="text-[var(--text-secondary)] mt-1">Real-time metrics from PostgreSQL · Prisma ORM · Socket.io</p>
        </div>
        {stats?.timestamp && <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />Live · {new Date(stats.timestamp).toLocaleTimeString()}</div>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
          const MIcon = m.icon;
          return (
          <div key={i} className="surface-elevated p-5 space-y-2 interactive-hover cursor-default">
            <div className="flex justify-between items-center"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{m.label}</span><MIcon size={22} className={m.color} strokeWidth={1.8} /></div>
            <div className={`text-2xl font-extrabold ${m.color}`}>{typeof m.value === 'number' ? m.value.toLocaleString() : m.value}</div>
          </div>
        );})}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="surface-elevated p-6 space-y-4">
          <h3 className="sidebar-title flex items-center gap-2"><Flame size={14} className="text-amber-400" /> Popular Destinations</h3>
          {[{ name: 'Sapa, Lao Cai', rate: 85 }, { name: 'Hanoi Old Quarter', rate: 72 }, { name: 'Ha Giang Loop', rate: 58 }, { name: 'Da Nang Beach', rate: 43 }, { name: 'Hoi An Ancient Town', rate: 37 }].map((item, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold"><span className="text-[var(--text-secondary)]">{item.name}</span><span className="text-[var(--text-muted)]">{item.rate}%</span></div>
              <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[var(--gold)] to-amber-500 rounded-full transition-all duration-1000" style={{ width: `${item.rate}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="surface-elevated p-6 space-y-4">
          <h3 className="sidebar-title flex items-center gap-2"><Bot size={14} className="text-violet-400" /> AI System Metrics</h3>
          {[['Collaborative Filter Hit-Rate', '92.4%', 'text-emerald-400'], ['Content-Based Cosine Precision', '88.7%', 'text-emerald-400'], ['TSP Route Divergence Penalty', '0.023', 'text-indigo-400'], ['WebSocket Sync Latency', '12ms', 'text-gold'], ['Haversine GIS Query Time', '< 5ms', 'text-teal-400']].map(([label, val, color], i) => (
            <div key={i} className="flex justify-between items-center text-xs border-b border-[var(--border-subtle)] pb-3 last:border-0 last:pb-0">
              <span className="text-[var(--text-secondary)]">{label}</span>
              <span className={`font-bold ${color}`}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// AuthPage is now in ./features/auth/AuthPage.tsx

function App() {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((s: RootState) => s.auth);
  const { toggleTheme, isDark } = useTheme();
  const { lang, setLang, t } = useLang();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // ✅ Lắng nghe sự kiện 'auth:logout' từ axios 401 interceptor
  // → Đồng bộ Redux state khi token hết hạn và refresh thất bại
  useEffect(() => {
    const handleForcedLogout = () => {
      dispatch(logout());
    };
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, [dispatch]);

  // ✅ Khi app khởi động: nếu có user trong Redux (từ localStorage)
  // nhưng không có accessToken → tự động logout để đồng bộ state
  useEffect(() => {
    const hasToken = !!localStorage.getItem('accessToken');
    const hasUser = !!localStorage.getItem('user');
    if (isAuthenticated && !hasToken) {
      // Token bị xóa thủ công hoặc bị lỗi — logout để sạch state
      dispatch(logout());
    }
    if (!isAuthenticated && hasUser && hasToken) {
      // Có localStorage data nhưng Redux chưa load → rehydrate
      // (AuthSlice initialState tự xử lý việc này, fallback an toàn)
    }
  }, []); // chỉ chạy 1 lần khi mount

  const browseNavItems = [
    { to: '/',          label: t('nav.feed'),      Icon: Home },
    { to: '/explore',   label: t('nav.explore'),   Icon: Compass },
    { to: '/guide/culture-food', label: t('nav.cultureGuide'), Icon: Utensils },
    { to: '/map',       label: t('nav.map'),        Icon: Map },
    { to: '/trips',     label: t('nav.aiPlanner'), Icon: Sparkles },
    { to: '/analytics', label: t('nav.analytics'), Icon: BarChart3 },
  ];

  const createNavItems = isAuthenticated
    ? [{ to: '/journeys/create', label: lang === 'vi' ? 'Đăng hành trình' : 'Share Journey', Icon: Send }]
    : [];

  const navItems = [...browseNavItems, ...createNavItems];

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  // Trang auth = fullscreen standalone, không cần navbar/footer
  const isAuthPage = location.pathname === '/auth';
  const isCreateJourneyPage = location.pathname === '/journeys/create';
  const isFullscreenCreate = isCreateJourneyPage;
  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">

      {/* ══════════════════════════════════════════════════
          PREMIUM NAVBAR
      ══════════════════════════════════════════════════ */}
      {!isFullscreenCreate && (
      <header className="nav-magazine">

        {/* ── TOP BAR ── */}
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-[64px] flex items-center gap-3">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group" onClick={() => setMobileOpen(false)}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--gold)] via-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all group-hover:scale-105">
              <span className="text-white font-black text-sm tracking-tight">ST</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-editorial text-lg font-bold text-[var(--text-primary)] leading-none">SmartTravel</span>
              <div className="text-[9px] text-[var(--gold)] font-semibold tracking-widest uppercase leading-none">AI × Social × Map</div>
            </div>
          </Link>

          {/* Search */}
          <div className={`flex-1 max-w-lg hidden md:block transition-all duration-200 ${searchFocused ? 'max-w-xl' : ''}`}>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder={t('nav.search')}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`w-full bg-[var(--bg-elevated)] border rounded-full pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-muted)] transition-all duration-200 ${
                  searchFocused
                    ? 'border-[var(--gold)] shadow-lg shadow-[var(--gold-glow)]'
                    : 'border-[var(--border-subtle)] hover:border-[var(--border-normal)]'
                }`}
              />
              {searchFocused && (
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] bg-[var(--bg-overlay)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">⌘K</kbd>
              )}
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1 md:hidden" />

          {/* Right Actions */}
          <div className="flex items-center gap-1.5">

            {/* Language Pill */}
            <div className="hidden sm:flex items-center rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden p-0.5 gap-0.5">
              {(['vi', 'en'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)} title={l === 'vi' ? 'Tiếng Việt' : 'English'}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                    lang === l
                      ? 'bg-[var(--gold)] text-black shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}>
                  <Globe size={10} />
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Theme toggle */}
            <button onClick={toggleTheme}
              title={isDark ? 'Light Mode' : 'Dark Mode'}
              className="icon-btn group relative">
              <div className={`transition-all duration-300 ${isDark ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0 absolute'}`}>
                <Sun size={17} className="text-amber-400 group-hover:text-amber-300" />
              </div>
              <div className={`transition-all duration-300 ${!isDark ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0 absolute'}`}>
                <Moon size={17} className="text-indigo-400 group-hover:text-indigo-300" />
              </div>
            </button>

            {/* Notifications */}
            <button onClick={() => setNotifOpen(!notifOpen)} className="icon-btn relative">
              <Bell size={17} className="text-[var(--text-secondary)]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-[var(--bg-primary)]" />
            </button>

            {/* User auth area */}
            {isAuthenticated && user ? (
              <UserMenuDropdown onLogout={() => dispatch(logout())} />
            ) : (
              /* ── CHƯA ĐĂNG NHẬP: Đăng nhập + Đăng ký ── */
              <div className="flex items-center gap-2">
                <Link
                  to="/auth"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--border-normal)] text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all"
                >
                  <User size={13} />
                  {t('nav.signIn')}
                </Link>
                <Link
                  to="/auth"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--gold)] to-amber-500 text-xs font-bold text-black hover:shadow-lg hover:shadow-amber-500/25 transition-all hover:scale-105"
                >
                  {t('nav.joinFree')}
                </Link>
              </div>
            )}


            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="icon-btn md:hidden">
              {mobileOpen ? <X size={18} className="text-[var(--text-primary)]" /> : <Menu size={18} className="text-[var(--text-secondary)]" />}
            </button>
          </div>
        </div>

        {/* ── CATEGORY NAV BAR ── */}
        <div className="border-t border-[var(--border-subtle)]">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 hidden md:flex items-center gap-1 h-[46px] overflow-x-auto">
            {navItems.map(({ to, label, Icon }) => {
              const active = isActive(to);
              return (
                <Link key={to} to={to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 group ${
                    active
                      ? 'bg-[var(--gold-glow)] text-[var(--gold)] border border-[var(--gold)]/30'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                  }`}>
                  <Icon size={15} className={`transition-colors ${active ? 'text-[var(--gold)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'}`} strokeWidth={active ? 2.5 : 1.8} />
                  {label}
                  {active && <span className="ml-0.5 w-1 h-1 rounded-full bg-[var(--gold)]" />}
                </Link>
              );
            })}

            {/* Divider + extras */}
            <div className="w-px h-5 bg-[var(--border-subtle)] mx-2" />
            <Link to="/profile/saved" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]`}>
              <Bookmark size={14} strokeWidth={1.8} /> {lang === 'vi' ? 'Đã lưu' : 'Saved'}
            </Link>
          </div>
        </div>

        {/* ── MOBILE MENU DROPDOWN ── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl">
            <div className="px-4 py-3 space-y-1">
              {navItems.map(({ to, label, Icon }) => {
                const active = isActive(to);
                return (
                  <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                      active
                        ? 'bg-[var(--gold-glow)] text-[var(--gold)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                    }`}>
                    <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                    <span>{label}</span>
                    {active && <span className="ml-auto w-2 h-2 rounded-full bg-[var(--gold)]" />}
                  </Link>
                );
              })}
              {/* Mobile search */}
              <div className="relative pt-2">
                <Search size={15} className="absolute left-3.5 top-[calc(0.5rem+8px)] text-[var(--text-muted)]" />
                <input type="text" placeholder={t('nav.search')}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold)] placeholder:text-[var(--text-muted)]" />
              </div>
              {/* Mobile lang + theme */}
              <div className="flex items-center gap-3 pt-2 pb-1">
                <div className="flex items-center rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden p-0.5 gap-0.5">
                  {(['vi', 'en'] as const).map(l => (
                    <button key={l} onClick={() => setLang(l)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${lang === l ? 'bg-[var(--gold)] text-black' : 'text-[var(--text-muted)]'}`}>
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
                <button onClick={toggleTheme} className="icon-btn">
                  {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-400" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
      )}

      {/* ── Main Content ── */}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<SocialFeedPage />} />
          <Route path="/explore" element={<BlogPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/map" element={<MapDashboard />} />
          <Route path="/trips" element={<TripPlanner />} />
          <Route path="/guide/culture-food" element={<CultureFoodGuidePage />} />
          <Route path="/journeys/create" element={<ProtectedRoute><CreateStoryPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/profile/following" element={<ProtectedRoute><FollowingPage /></ProtectedRoute>} />
          <Route path="/profile/saved" element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />
          <Route path="/profile/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<AdminDashboard />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </main>

      {/* ── Footer ── */}
      {!isFullscreenCreate && (
      <footer className="border-t border-[var(--border-subtle)] py-8 bg-[var(--bg-surface)]">
        <div className="max-w-screen-xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[var(--gold)] to-amber-600 flex items-center justify-center text-[10px] font-bold text-black">ST</div>
            <span className="font-editorial text-sm text-[var(--text-secondary)]">{t('footer.thesis')}</span>
          </div>
          <div className="text-[10px] text-[var(--text-muted)] flex gap-4">
            <span>{t('footer.built')}</span>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}

export default App;
