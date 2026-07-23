import { useState, useEffect } from 'react';
import { Bell, Heart, MessageSquare, UserPlus, CheckSquare, ArrowLeft, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../../contexts/LanguageContext';
import { socialService } from '../../services/smartTravel.service';

export default function NotificationsPage() {
  const { lang } = useLang();
  const vi = lang === 'vi';
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getRelativeTime = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return vi ? 'Vừa xong' : 'Just now';
    if (diffMins < 60) return vi ? `${diffMins} phút trước` : `${diffMins}m ago`;
    if (diffHours < 24) return vi ? `${diffHours} giờ trước` : `${diffHours}h ago`;
    if (diffDays === 1) return vi ? 'Hôm qua' : 'Yesterday';
    if (diffDays < 7) return vi ? `${diffDays} ngày trước` : `${diffDays}d ago`;

    return date.toLocaleDateString(vi ? 'vi-VN' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderNotificationContent = (content: string) => {
    if (vi) {
      const match = content.match(/^(.*?)\s+(đã\s+.*)$/);
      if (match) {
        return (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
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
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              <span className="font-bold text-[var(--text-primary)]">{parts[0]}</span>{' '}
              <span>{verb} {parts.slice(1).join(` ${verb} `)}</span>
            </p>
          );
        }
      }
    }
    return <p className="text-sm text-[var(--text-primary)] leading-relaxed">{content}</p>;
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={15} className="fill-rose-500 text-rose-500" />;
      case 'comment':
        return <MessageSquare size={15} className="text-blue-500 fill-blue-500/5" />;
      case 'friend_request':
        return <UserPlus size={15} className="text-emerald-500" />;
      default:
        return <Bell size={15} className="text-[var(--gold)]" />;
    }
  };

  const getNotifIconBg = (type: string) => {
    switch (type) {
      case 'like':
        return 'bg-rose-500/10 text-rose-500';
      case 'comment':
        return 'bg-blue-500/10 text-blue-500';
      case 'friend_request':
        return 'bg-emerald-500/10 text-emerald-500';
      default:
        return 'bg-[var(--gold-glow)] text-[var(--gold)]';
    }
  };

  const getNotifBorderAccent = (type: string) => {
    switch (type) {
      case 'like':
        return 'border-l-[3px] border-l-rose-500';
      case 'comment':
        return 'border-l-[3px] border-l-blue-500';
      case 'friend_request':
        return 'border-l-[3px] border-l-emerald-500';
      default:
        return 'border-l-[3px] border-l-[var(--gold)]';
    }
  };

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
      console.error('Failed to mark notification as read:', err);
    }
    navigate(getNotifLink(notif));
  };

  const fetchNotifications = async () => {
    try {
      const data = await socialService.notifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await socialService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50/80 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans overflow-hidden animate-fade-in">
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
        <polygon points="100,20 108,92 180,100 108,108 100,180 92,108 20,100 92,92" fill="currentColor" opacity="0.2" />
      </svg>

      {/* ── Multi-Layer Vibrant Ambient Glow Mesh ── */}
      <div className="absolute top-10 left-10 w-[700px] h-[700px] bg-gradient-to-tr from-brand-500/20 via-sky-500/15 to-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[500px] right-10 w-[600px] h-[600px] bg-gradient-to-bl from-purple-600/18 via-pink-500/15 to-amber-500/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[550px] h-[550px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 space-y-6 max-w-[1750px] mx-auto">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-all">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
            {vi ? 'Tất cả thông báo' : 'All Notifications'}
          </h1>
        </div>

        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--gold)] hover:bg-[var(--gold-glow)]/10 hover:border-[var(--gold)] transition-all"
          >
            <CheckSquare size={13} />
            {vi ? 'Đọc tất cả' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--gold)] border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] shadow-sm">
          <Bell size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
          <p className="text-[var(--text-secondary)] font-medium">
            {vi ? 'Không có thông báo nào.' : 'You have no notifications.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => {
            const isUnread = !notif.isRead;
            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`group flex items-start gap-4 p-4.5 rounded-2xl border cursor-pointer hover:bg-[var(--bg-elevated)] transition-all duration-200 ${
                  isUnread
                    ? `bg-[var(--bg-surface)] border-[var(--gold)]/20 shadow-md ring-1 ring-[var(--gold)]/5 ${getNotifBorderAccent(notif.type)}`
                    : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] opacity-70'
                }`}
              >
                <div className={`p-2.5 rounded-xl flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 duration-200 ${getNotifIconBg(notif.type)}`}>
                  {getNotifIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  {renderNotificationContent(notif.content)}
                  <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] font-medium mt-2">
                    <Clock size={11} className="opacity-75" />
                    <span>{getRelativeTime(notif.createdAt)}</span>
                  </div>
                </div>
                {isUnread && (
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 flex-shrink-0 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
