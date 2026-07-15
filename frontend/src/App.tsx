import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  Map, Home, Compass, Sparkles, BarChart3, Bell, Sun, Moon, Globe, Loader2,
  Menu, X, User, Send, Utensils, Bot, Search,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from './store/authSlice';
import { socialService } from './services/smartTravel.service';
import type { RootState, AppDispatch } from './store';
import { useTheme } from './contexts/ThemeContext';
import { useLang } from './contexts/LanguageContext';
import AuthPage from './features/auth/AuthPage';
import logoImg from './assets/logo.png';
import UserMenuDropdown from './components/layout/UserMenuDropdown';

// ─── Page imports ──────────────────────────────────────────
import SocialFeedPage from './features/feed/SocialFeedPage';
import BlogPage from './features/blog/BlogPage';
import ExploreArticlePage from './features/blog/ExploreArticlePage';
import ExploreHandbookPage from './features/blog/ExploreHandbookPage';
import EditPostPage from './features/posts/EditPostPage';
import CreateStoryPage from './features/stories/CreateStoryPage';
import CultureFoodGuidePage from './features/guide/CultureFoodGuidePage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ProfilePage from './features/profile/ProfilePage';
import FollowingPage from './features/profile/FollowingPage';
import SavedPage from './features/profile/SavedPage';
import SettingsPage from './features/profile/SettingsPage';
import NotificationsPage from './features/profile/NotificationsPage';
import ChatbotPage from './features/chatbot/ChatbotPage';

// Lazy-loaded heavy pages — splits bundle so initial load is fast
const MapDashboard = lazy(() => import('./features/map/MapDashboard'));
const TripPlanner = lazy(() => import('./features/trips/TripPlanner'));
const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard'));

function App() {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((s: RootState) => s.auth);
  const { toggleTheme, isDark } = useTheme();
  const { lang, setLang, t } = useLang();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = () => {
    if (isAuthenticated && user) {
      socialService.notifications()
        .then(data => {
          if (Array.isArray(data)) setNotifications(data);
        })
        .catch(err => console.error('Fetch notifications failed in App:', err));
    }
  };

  useEffect(() => {
    fetchNotifications();
    if (isAuthenticated && user) {
      const interval = setInterval(fetchNotifications, 20000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, user]);

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
    { to: '/chat',      label: lang === 'vi' ? 'AI Trợ lý' : 'AI Chat', Icon: Bot },
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
  const isEditPostPage = /^\/posts\/[^/]+\/edit$/.test(location.pathname);
  const isExploreReader =
    location.pathname.startsWith('/explore/post/') ||
    location.pathname.startsWith('/explore/cam-nang/');
  const isFullscreenCreate = isCreateJourneyPage || isEditPostPage || isExploreReader;
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
        <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-10 h-[64px] md:h-[80px] flex items-center justify-between gap-4">

          {/* Left side: Logo + Slogan */}
          <Link to="/" className="flex items-center gap-3.5 flex-shrink-0 group" onClick={() => setMobileOpen(false)}>
            <div className="w-[160px] h-[160px] md:w-[160px] md:h-[160px] flex items-center justify-center group-hover:scale-105 transition-all">
              <img src={logoImg} alt="Terraholic Logo" className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block border-l border-[var(--border-subtle)] pl-3.5 py-0.5 max-w-[160px] md:max-w-[200px]">
              <div className="text-[9px] md:text-[10px] text-[var(--gold)] font-bold tracking-widest uppercase leading-relaxed">
                Khám phá bằng đam mê, kết nối bằng hành trình.
              </div>
            </div>
          </Link>

          {/* Center: Search Bar */}
          <div className={`w-full max-w-xs lg:max-w-md hidden md:block transition-all duration-200 ${searchFocused ? 'max-w-md lg:max-w-lg' : ''}`}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder={t('nav.search')}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`w-full bg-[var(--bg-elevated)] border rounded-full pl-9 pr-4 py-2 text-xs text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-muted)] transition-all duration-200 ${
                  searchFocused
                    ? 'border-[var(--gold)] shadow-md shadow-[var(--gold-glow)]'
                    : 'border-[var(--border-subtle)] hover:border-[var(--border-normal)]'
                }`}
              />
              {searchFocused && (
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-[var(--text-muted)] bg-[var(--bg-overlay)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">⌘K</kbd>
              )}
            </div>
          </div>

          {/* Right side: Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">

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
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="icon-btn relative" aria-label="Notifications">
                <Bell size={17} className="text-[var(--text-secondary)]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-[var(--bg-primary)] animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-3.5 w-80 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-4.5 z-50 transition-all duration-200">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-[var(--border-subtle)]">
                      <h4 className="font-bold text-[10px] text-[var(--text-primary)] uppercase tracking-wider">
                        {lang === 'vi' ? 'Thông báo' : 'Notifications'}
                      </h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={async () => {
                            try {
                              await socialService.markAllRead();
                              setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                            } catch (err) {
                              console.error('Mark all read failed:', err);
                            }
                          }}
                          className="text-[10px] font-black text-[var(--gold)] hover:underline hover:text-[var(--gold-light)]"
                        >
                          {lang === 'vi' ? 'Đọc tất cả' : 'Mark all read'}
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-center text-xs text-[var(--text-muted)] py-6">
                          {lang === 'vi' ? 'Không có thông báo nào.' : 'No notifications.'}
                        </p>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif.id}
                            className={`flex items-start gap-3 p-3 rounded-xl transition-all border ${
                              notif.isRead ? 'opacity-65 border-transparent' : 'bg-[var(--gold-glow)]/20 border-[var(--border-glow)] shadow-sm'
                            }`}
                          >
                            <div className="mt-0.5 p-1.5 rounded-lg bg-[var(--bg-elevated)] text-[var(--gold)]">
                              <Bell size={12} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-[var(--text-primary)] font-medium leading-relaxed">{notif.content}</p>
                              <p className="text-[9px] text-[var(--text-muted)] mt-1.5">
                                {new Date(notif.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="mt-3.5 pt-2 border-t border-[var(--border-subtle)] text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setNotifOpen(false)}
                        className="text-xs font-bold text-[var(--gold)] hover:underline hover:text-[var(--gold-light)] block w-full"
                      >
                        {lang === 'vi' ? 'Xem tất cả' : 'View all'}
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--gold)] to-blue-700 text-xs font-bold text-white hover:shadow-lg hover:shadow-blue-600/25 transition-all hover:scale-105"
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
          <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-10 hidden md:flex items-center gap-1 h-[46px] overflow-x-auto">
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
          <Route path="/explore/post/:id" element={<ExploreArticlePage />} />
          <Route path="/explore/cam-nang/:type" element={<ExploreHandbookPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/posts/:id/edit" element={<ProtectedRoute><EditPostPage /></ProtectedRoute>} />
          <Route path="/map" element={
            <Suspense fallback={
              <div className="flex items-center justify-center p-20 text-xs text-[var(--text-muted)] gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span>Loading Map...</span>
              </div>
            }>
              <MapDashboard />
            </Suspense>
          } />
          <Route path="/trips" element={
            <Suspense fallback={
              <div className="flex items-center justify-center p-20 text-xs text-[var(--text-muted)] gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span>Loading Planner...</span>
              </div>
            }>
              <TripPlanner />
            </Suspense>
          } />
          <Route path="/chat" element={<ProtectedRoute><ChatbotPage /></ProtectedRoute>} />
          <Route path="/guide/culture-food" element={<CultureFoodGuidePage />} />
          <Route path="/journeys/create" element={<ProtectedRoute><CreateStoryPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/profile/following" element={<ProtectedRoute><FollowingPage /></ProtectedRoute>} />
          <Route path="/profile/saved" element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />
          <Route path="/profile/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/analytics" element={
            <Suspense fallback={
              <div className="flex items-center justify-center p-20 text-xs text-[var(--text-muted)] gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span>Loading Analytics...</span>
              </div>
            }>
              <AdminDashboard />
            </Suspense>
          } />
          <Route path="/admin" element={<Navigate to="/analytics" replace />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </main>

      {/* ── Footer ── */}
      {!isFullscreenCreate && (
      <footer className="border-t border-[var(--border-subtle)] py-8 bg-[var(--bg-surface)]">
        <div className="max-w-screen-xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src={logoImg} alt="Terraholic Logo" className="w-full h-full object-contain" />
            </div>
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
