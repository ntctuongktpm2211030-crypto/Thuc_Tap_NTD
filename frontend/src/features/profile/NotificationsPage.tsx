import { useState, useEffect } from 'react';
import { Bell, Heart, MessageSquare, UserPlus, CheckSquare, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../../contexts/LanguageContext';
import { socialService } from '../../services/smartTravel.service';

export default function NotificationsPage() {
  const { lang } = useLang();
  const vi = lang === 'vi';
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="text-rose-500 fill-rose-500" size={18} />;
      case 'comment':
        return <MessageSquare className="text-blue-500 fill-blue-500/10" size={18} />;
      case 'friend_request':
        return <UserPlus className="text-emerald-500" size={18} />;
      default:
        return <Bell className="text-[var(--gold)]" size={18} />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 min-h-[70vh]">
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
          {notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`flex items-start gap-4 p-4.5 rounded-2xl border cursor-pointer hover:bg-[var(--bg-elevated)] transition-all ${
                notif.isRead
                  ? 'bg-[var(--bg-surface)] border-[var(--border-subtle)] opacity-70'
                  : 'bg-[var(--bg-surface)] border-[var(--gold)]/30 shadow-lg shadow-[var(--gold-glow)]/5 ring-1 ring-[var(--gold)]/5'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] flex-shrink-0">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed">
                  {notif.content}
                </p>
                <span className="text-[10px] text-[var(--text-muted)] font-medium mt-2 block">
                  {new Date(notif.createdAt).toLocaleDateString(vi ? 'vi-VN' : 'en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {!notif.isRead && (
                <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 flex-shrink-0 animate-pulse" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
