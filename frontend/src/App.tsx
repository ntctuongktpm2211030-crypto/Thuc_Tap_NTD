import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import {
  Map, Home, Compass, Sparkles, Bell, Sun, Moon, Globe, Loader2,
  Menu, X, User, Send, Utensils, Bot, Search, Bookmark, Heart, MessageSquare, UserPlus, Clock,
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
import { io } from 'socket.io-client';

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

const MotionPlayground = lazy(() => import('./features/admin/MotionPlayground'));

function App() {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((s: RootState) => s.auth);
  const { toggleTheme, isDark } = useTheme();
  const { lang, setLang, t } = useLang();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState('');
  const [newNotifObj, setNewNotifObj] = useState<any>(null);

  const getNotifLink = (notif: any) => {
    if (notif.type === 'like' || notif.type === 'comment') {
      return notif.targetId ? `/?postId=${notif.targetId}` : '/';
    }
    if (notif.type === 'friend_request') {
      return '/profile/following';
    }
    return '/notifications';
  };

  const handleNotificationClick = async (notif: any) => {
    try {
      if (!notif.isRead) {
        await socialService.markAsRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error('Mark notification read failed:', err);
    }
    setNotifOpen(false);
    navigate(getNotifLink(notif));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getRelativeTime = (dateInput: string | Date, currentLang: string) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    const vi = currentLang === 'vi';

    if (diffSecs < 60) return vi ? 'Vừa xong' : 'Just now';
    if (diffMins < 60) return vi ? `${diffMins} phút trước` : `${diffMins}m ago`;
    if (diffHours < 24) return vi ? `${diffHours} giờ trước` : `${diffHours}h ago`;
    if (diffDays === 1) return vi ? 'Hôm qua' : 'Yesterday';
    if (diffDays < 7) return vi ? `${diffDays} ngày trước` : `${diffDays}d ago`;

    return date.toLocaleDateString(vi ? 'vi-VN' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={13} className="fill-rose-500 text-rose-500" />;
      case 'comment':
        return <MessageSquare size={13} className="text-blue-500 fill-blue-500/5" />;
      case 'friend_request':
        return <UserPlus size={13} className="text-emerald-500" />;
      default:
        return <Bell size={13} className="text-[var(--gold)]" />;
    }
  };

  const renderNotificationContent = (content: string, currentLang: string) => {
    if (currentLang === 'vi') {
      const match = content.match(/^(.*?)\s+(đã\s+.*)$/);
      if (match) {
        return (
          <p className="text-[11.5px] text-[var(--text-secondary)] leading-relaxed">
            <span className="font-bold text-[var(--text-primary)]">{match[1]}</span>{' '}
            <span>{match[2]}</span>
          </p>
        );
      }
    } else {
      const verbs = ['liked', 'commented', 'started', 'sent', 'followed'];
      for (const verb of verbs) {
        if (content.includes(` ${verb} `)) {
          const parts = content.split(` ${verb} `);
          return (
            <p className="text-[11.5px] text-[var(--text-secondary)] leading-relaxed">
              <span className="font-bold text-[var(--text-primary)]">{parts[0]}</span>{' '}
              <span>{verb} {parts.slice(1).join(` ${verb} `)}</span>
            </p>
          );
        }
      }
    }
    return <p className="text-[11.5px] text-[var(--text-primary)] leading-relaxed">{content}</p>;
  };

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

  // Connect to Notification socket room and listen for real-time notifications
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const socketUrl = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace('/api/v1', '') 
        : window.location.origin;

      const socket = io(socketUrl, {
        transports: ['websocket'],
        autoConnect: true
      });

      socket.on('connect', () => {
        console.log('[Socket.IO] Notification socket connected');
        socket.emit('register_user', user.id);
      });

      socket.on('new_notification', (newNotif: any) => {
        console.log('[Socket.IO] Received new notification:', newNotif);
        setNotifications(prev => [newNotif, ...prev]);
        setNewNotifObj(newNotif);
        setToastMessage(newNotif.content);
        setTimeout(() => setToastMessage(''), 4000);
      });

      return () => {
        socket.disconnect();
      };
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

  ];

  const createNavItems = isAuthenticated
    ? [{ to: '/journeys/create', label: lang === 'vi' ? 'Đăng hành trình' : 'Share Journey', Icon: Send }]
    : [];

  const navItems = [...browseNavItems, ...createNavItems];

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  // Trang auth = fullscreen standalone, không cần navbar/footer
  const isAuthPage = location.pathname === '/auth';
  const isEditPostPage = /^\/posts\/[^/]+\/edit$/.test(location.pathname);
  const isExploreReader =
    location.pathname.startsWith('/explore/post/') ||
    location.pathname.startsWith('/explore/cam-nang/');
  const isFullscreenCreate = isEditPostPage || isExploreReader;
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
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all focus:outline-none ${
                    lang === l
                      ? 'bg-[var(--gold)] text-white shadow-sm'
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
                  <div className="absolute right-0 mt-3.5 w-[360px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-4 z-50 transition-all duration-200">
                    <div className="flex justify-between items-center mb-3.5 pb-2.5 border-b border-[var(--border-subtle)]/60">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider">
                          {lang === 'vi' ? 'Thông báo' : 'Notifications'}
                        </h4>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 text-[9px] font-black bg-rose-500 text-white rounded-full leading-none animate-pulse">
                            {unreadCount}
                          </span>
                        )}
                      </div>
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
                          className="text-[11px] font-bold text-[var(--gold)] hover:text-[var(--gold-light)] transition-colors hover:underline"
                        >
                          {lang === 'vi' ? 'Đọc tất cả' : 'Mark all read'}
                        </button>
                      )}
                    </div>
                    <div className="max-h-[340px] overflow-y-auto space-y-2.5 pr-1.5 scrollbar-thin">
                      {notifications.length === 0 ? (
                        <div className="text-center py-8">
                          <Bell size={28} className="mx-auto text-[var(--text-muted)] opacity-60 mb-2" />
                          <p className="text-xs text-[var(--text-muted)] font-medium">
                            {lang === 'vi' ? 'Không có thông báo nào.' : 'No notifications.'}
                          </p>
                        </div>
                      ) : (
                        notifications.map(notif => {
                          const isUnread = !notif.isRead;
                          return (
                            <div
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`group flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                                isUnread
                                  ? 'bg-[var(--gold-glow)] border-[var(--gold)]/20 hover:bg-[var(--gold-glow-strong)] shadow-sm hover:shadow-md'
                                  : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border-transparent hover:border-[var(--border-subtle)]'
                              }`}
                            >
                              {/* Accent Left Line for Unread */}
                              {isUnread && (
                                <div className={`w-0.5 self-stretch rounded-full ${
                                  notif.type === 'like' ? 'bg-rose-500' :
                                  notif.type === 'comment' ? 'bg-blue-500' :
                                  notif.type === 'friend_request' ? 'bg-emerald-500' : 'bg-[var(--gold)]'
                                }`} />
                              )}

                              {/* Icon container */}
                              <div className={`flex-shrink-0 p-2 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 duration-200 ${
                                notif.type === 'like' ? 'bg-rose-500/10 text-rose-500' :
                                notif.type === 'comment' ? 'bg-blue-500/10 text-blue-500' :
                                notif.type === 'friend_request' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[var(--gold-glow)] text-[var(--gold)]'
                              }`}>
                                {getNotifIcon(notif.type)}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                {renderNotificationContent(notif.content, lang)}
                                <div className="flex items-center gap-1 text-[9px] text-[var(--text-muted)] mt-1.5 font-medium">
                                  <Clock size={10} className="opacity-75" />
                                  <span>{getRelativeTime(notif.createdAt, lang)}</span>
                                </div>
                              </div>

                              {/* Unread Status Dot */}
                              {isUnread && (
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 flex-shrink-0" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)]/60 text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setNotifOpen(false)}
                        className="text-xs font-bold text-[var(--gold)] hover:text-[var(--gold-light)] block w-full hover:underline transition-colors"
                      >
                        {lang === 'vi' ? 'Xem tất cả thông báo' : 'View all notifications'}
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
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all focus:outline-none ${lang === l ? 'bg-[var(--gold)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
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
          <Route path="/motion-playground" element={
            <Suspense fallback={
              <div className="flex items-center justify-center p-20 text-xs text-[var(--text-muted)] gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span>Loading Playground...</span>
              </div>
            }>
              <MotionPlayground />
            </Suspense>
          } />
          <Route path="/admin" element={<Navigate to="/" replace />} />
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

        </div>
      </footer>
      )}

      {/* Real-time Toast Notification */}
      {toastMessage && (
        <div 
          onClick={() => {
            if (newNotifObj) handleNotificationClick(newNotifObj);
            setToastMessage('');
          }}
          className="fixed bottom-6 right-6 z-[999999] flex items-center gap-3 bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-bold px-4.5 py-3.5 rounded-2xl border border-[var(--gold)]/50 shadow-2xl shadow-[var(--gold-glow)]/15 animate-fade-in cursor-pointer hover:border-[var(--gold)] transition-all"
        >
          <div className="p-1.5 rounded-lg bg-[var(--gold-glow)]/20 text-[var(--gold)]">
            <Bell size={14} className="animate-bounce" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
