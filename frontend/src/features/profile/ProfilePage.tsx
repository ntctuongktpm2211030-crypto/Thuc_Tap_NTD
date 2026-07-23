import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  MapPin, Camera, Pencil, Users, Heart, MessageCircle, Share2,
  MoreHorizontal, Globe, Briefcase, GraduationCap, Image as ImageIcon,
  Bell, Plus, Trash2, Star, Calendar, DollarSign, Loader2
} from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import type { RootState, AppDispatch } from '../../store';
import { setUser } from '../../store/authSlice';
import { socialService, travelHistoryService, tripsService } from '../../services/smartTravel.service';

const MY_POSTS = [
  {
    id: '1',
    time: '2 giờ trước',
    content: 'Vừa hoàn thành chuyến đi Hà Giang Loop 4 ngày — cảnh đèo đẹp không tưởng! Ai có kế hoạch đi tháng 9 thì nhắn mình chia lịch trình chi tiết nhé.',
    image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=900&q=80',
    likes: 48, comments: 12,
  },
  {
    id: '2',
    time: '3 ngày trước',
    content: 'Mẹo nhỏ khi đến Hội An: thuê xe đạp sáng sớm, ghé chợ trước 7h để tránh đông. Ăn cao lầu bà Phương — xếp hàng nhưng xứng đáng!',
    images: [
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1540202403-b7abd6747a18?auto=format&fit=crop&w=500&q=80',
    ],
    likes: 124, comments: 31,
  },
];

const PHOTOS = [
  'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1557750255-c76072a7aad1?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80',
];

const FRIENDS_PREVIEW = [
  { name: 'Minh Quân', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80' },
  { name: 'Sarah Lee', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80' },
  { name: 'Linh Trần', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80' },
  { name: 'Alex Chen', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=80&q=80' },
  { name: 'Tom Vũ', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80' },
  { name: 'Hương Ngô', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=80&q=80' },
];

type TabId = 'posts' | 'about' | 'photos' | 'trips' | 'notifications' | 'history';

export default function ProfilePage() {
  const { t, lang } = useLang();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);
  const vi = lang === 'vi';
  const [activeTab, setActiveTab] = useState<TabId>('posts');
  const [composeText, setComposeText] = useState('');

  if (!user) return null;

  const [notifications, setNotifications] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);

  // Travel History states
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);

  // Planned Trips state
  const [plannedTrips, setPlannedTrips] = useState<any[]>([]);

  const fetchPlannedTrips = async () => {
    try {
      const data = await tripsService.LayDanhSachChuyenDi();
      if (Array.isArray(data)) setPlannedTrips(data);
    } catch (err) {
      console.error('Fetch planned trips failed:', err);
    }
  };

  // Form states
  const [historyLocation, setHistoryLocation] = useState('');
  const [historyTime, setHistoryTime] = useState('');
  const [historyRating, setHistoryRating] = useState('5');
  const [historyCost, setHistoryCost] = useState(0);

  useEffect(() => {
    if (user) {
      socialService.getFollowing(user.id)
        .then(data => {
          if (Array.isArray(data)) setFollowing(data);
        })
        .catch(err => console.error('Get following failed:', err));

      socialService.notifications()
        .then(data => {
          if (Array.isArray(data)) setNotifications(data);
        })
        .catch(err => console.error('Get notifications failed:', err));

      fetchPlannedTrips();
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        await socialService.updateProfile({ avatarUrl: base64 });
        dispatch(setUser({ ...user, avatarUrl: base64 }));
      } catch (err) {
        console.error('Update avatar failed:', err);
        alert(vi ? 'Cập nhật ảnh đại diện thất bại' : 'Failed to update avatar');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMarkAllRead = async () => {
    try {
      await socialService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Mark all read failed:', err);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await travelHistoryService.LayDanhSachNhatKy();
      if (Array.isArray(data)) setHistoryList(data);
    } catch (err) {
      console.error('Fetch travel history failed:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const handleHistorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyLocation.trim()) {
      alert(vi ? 'Vui lòng nhập địa điểm!' : 'Please enter location!');
      return;
    }
    if (!historyTime) {
      alert(vi ? 'Vui lòng chọn thời gian!' : 'Please choose time!');
      return;
    }

    try {
      const payload = {
        location: historyLocation.trim(),
        time: new Date(historyTime).toISOString(),
        rating: historyRating,
        cost: Number(historyCost),
      };

      if (editingEntry) {
        await travelHistoryService.CapNhatNhatKy(editingEntry.id, payload);
        alert(vi ? 'Cập nhật nhật ký thành công!' : 'Travel history updated successfully!');
      } else {
        await travelHistoryService.TaoNhatKy(payload);
        alert(vi ? 'Thêm nhật ký thành công!' : 'Travel history added successfully!');
      }
      setShowHistoryModal(false);
      setEditingEntry(null);
      setHistoryLocation('');
      setHistoryTime('');
      setHistoryRating('5');
      setHistoryCost(0);
      fetchHistory();
    } catch (err) {
      console.error('Save history failed:', err);
      alert(vi ? 'Lưu nhật ký thất bại!' : 'Failed to save travel history!');
    }
  };

  const handleHistoryDelete = async (id: string) => {
    if (!confirm(vi ? 'Bạn có chắc chắn muốn xóa nhật ký này không?' : 'Are you sure you want to delete this entry?')) return;
    try {
      await travelHistoryService.XoaNhatKy(id);
      fetchHistory();
    } catch (err) {
      console.error('Delete history failed:', err);
      alert(vi ? 'Xóa thất bại!' : 'Delete failed!');
    }
  };

  const handlePlannedTripDelete = async (id: string) => {
    if (!confirm(vi ? 'Bạn có chắc chắn muốn xóa chuyến đi này?' : 'Are you sure you want to delete this trip?')) return;
    try {
      await tripsService.XoaChuyenDi(id);
      fetchPlannedTrips();
    } catch (err) {
      console.error('Delete planned trip failed:', err);
      alert(vi ? 'Xóa chuyến đi thất bại!' : 'Delete trip failed!');
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'posts', label: t('profile.tab.posts') },
    { id: 'about', label: t('profile.tab.about') },
    { id: 'photos', label: t('profile.tab.photos') },
    { id: 'trips', label: t('profile.tab.trips') },
    { id: 'history', label: vi ? 'Nhật ký di chuyển' : 'Travel History' },
    { id: 'notifications', label: vi ? 'Thông báo' : 'Notifications' },
  ];

  const statFriends = 128;
  const statFollowers = 342;

  return (
    <div className="fb-profile pt-6">

      <div className="fb-profile-container">
        {/* Header: avatar + info + actions */}
        <div className="fb-profile-header">
          <div className="fb-profile-avatar-wrap">
            <div className="fb-profile-avatar">
              <img src={user.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} alt="" />
            </div>
            <label htmlFor="avatar-upload" className="fb-profile-avatar-edit cursor-pointer" aria-label="Edit avatar">
              <Camera size={14} />
              <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>

          <div className="fb-profile-header-main">
            <h1 className="fb-profile-name">{user.fullName}</h1>
            <p className="fb-profile-friends">
              <strong>{following.length > 0 ? following.length : statFriends}</strong> {vi ? 'đang theo dõi' : 'following'} · <strong>{statFollowers}</strong> {vi ? 'người theo dõi' : 'followers'}
            </p>
            <p className="fb-profile-location">
              <MapPin size={14} /> {vi ? 'Hà Nội, Việt Nam' : 'Hanoi, Vietnam'}
            </p>
          </div>

          <div className="fb-profile-actions">
            <Link to="/profile/settings" className="fb-profile-btn fb-profile-btn--primary">
              <Pencil size={15} /> {vi ? 'Chỉnh sửa trang cá nhân' : 'Edit profile'}
            </Link>
            <Link to="/profile/following" className="fb-profile-btn fb-profile-btn--secondary">
              <Users size={15} /> {t('userMenu.following')}
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="fb-profile-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`fb-profile-tab ${activeTab === tab.id ? 'fb-profile-tab--active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body: 2 columns like Facebook */}
        <div className="fb-profile-body">
          <aside className="fb-profile-sidebar">
            <div className="fb-profile-card">
              <h3 className="fb-profile-card-title">{vi ? 'Giới thiệu' : 'Intro'}</h3>
              <p className="fb-profile-intro-text">
                {vi
                  ? 'Yêu du lịch khám phá, ẩm thực địa phương và chia sẻ hành trình thực tế trên Terraholic.'
                  : 'Love exploring, local food, and sharing real travel stories on Terraholic.'}
              </p>
              <ul className="fb-profile-intro-list">
                <li><Briefcase size={16} /> {vi ? 'Làm việc tại Terraholic' : 'Works at Terraholic'}</li>
                <li><GraduationCap size={16} /> {vi ? 'Học tại CTUT' : 'Studied at CTUT'}</li>
                <li><MapPin size={16} /> {vi ? 'Sống tại Hà Nội' : 'Lives in Hanoi'}</li>
                <li><Globe size={16} /> {user.email}</li>
              </ul>
              <Link to="/profile/settings" className="fb-profile-link-btn">
                {vi ? 'Chỉnh sửa chi tiết' : 'Edit details'}
              </Link>
            </div>

            <div className="fb-profile-card">
              <div className="fb-profile-card-head">
                <h3 className="fb-profile-card-title">{vi ? 'Ảnh' : 'Photos'}</h3>
                <button type="button" className="fb-profile-see-all" onClick={() => setActiveTab('photos')}>
                  {vi ? 'Xem tất cả' : 'See all'}
                </button>
              </div>
              <div className="fb-profile-photo-grid">
                {PHOTOS.slice(0, 6).map((src, i) => (
                  <button key={i} type="button" className="fb-profile-photo-cell" onClick={() => setActiveTab('photos')}>
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>

            <div className="fb-profile-card">
              <div className="fb-profile-card-head">
                <h3 className="fb-profile-card-title">{vi ? 'Đang theo dõi' : 'Following'}</h3>
                <Link to="/profile/following" className="fb-profile-see-all">{vi ? 'Xem tất cả' : 'See all'}</Link>
              </div>
              <p className="fb-profile-friends-sub">
                {following.length > 0 ? following.length : statFriends} {vi ? 'người' : 'people'}
              </p>
              <div className="fb-profile-friends-grid">
                {following.length > 0 ? (
                  following.slice(0, 6).map(f => {
                    const profileData = f.following?.profile || f;
                    const avatarUrl = profileData.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
                    const name = profileData.fullName || f.name || '';
                    return (
                      <div key={f.id} className="fb-profile-friend">
                        <img src={avatarUrl} alt={name} />
                        <span>{name.split(' ').pop()}</span>
                      </div>
                    );
                  })
                ) : (
                  FRIENDS_PREVIEW.map(f => (
                    <div key={f.name} className="fb-profile-friend">
                      <img src={f.avatar} alt={f.name} />
                      <span>{f.name.split(' ').pop()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>

          <main className="fb-profile-main">
            {activeTab === 'posts' && (
              <>
                {/* Compose */}
                <div className="fb-profile-card fb-profile-compose">
                  <div className="fb-profile-compose-top">
                    <div className="fb-profile-compose-avatar">
                      {user.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <input
                      type="text"
                      value={composeText}
                      onChange={e => setComposeText(e.target.value)}
                      placeholder={vi ? 'Bạn đang nghĩ gì?' : "What's on your mind?"}
                      className="fb-profile-compose-input"
                    />
                  </div>
                  <div className="fb-profile-compose-actions">
                    <button type="button" className="fb-profile-compose-action">
                      <ImageIcon size={18} className="text-emerald-500" /> {vi ? 'Ảnh/Video' : 'Photo/Video'}
                    </button>
                    <button type="button" className="fb-profile-compose-action">
                      <MapPin size={18} className="text-rose-500" /> {vi ? 'Check in' : 'Check in'}
                    </button>
                  </div>
                </div>

                {/* Timeline posts */}
                {MY_POSTS.map(post => (
                  <article key={post.id} className="fb-profile-card fb-profile-post">
                    <div className="fb-profile-post-head">
                      <div className="fb-profile-post-author">
                        <div className="fb-profile-compose-avatar">{user.fullName?.charAt(0)}</div>
                        <div>
                          <p className="fb-profile-post-name">{user.fullName}</p>
                          <p className="fb-profile-post-time">{post.time} · <Globe size={11} className="inline" /></p>
                        </div>
                      </div>
                      <button type="button" className="fb-profile-post-more"><MoreHorizontal size={18} /></button>
                    </div>
                    <p className="fb-profile-post-content">{post.content}</p>
                    {'image' in post && post.image && (
                      <img src={post.image} alt="" className="fb-profile-post-image w-full" />
                    )}
                    {'images' in post && post.images && (
                      <div className={`fb-profile-post-gallery fb-profile-post-gallery--${post.images.length}`}>
                        {post.images.map((src, i) => (
                          <img key={i} src={src} alt="" />
                        ))}
                      </div>
                    )}
                    <div className="fb-profile-post-stats">
                      <span><Heart size={14} className="inline text-rose-500 fill-rose-500" /> {post.likes}</span>
                      <span>{post.comments} {vi ? 'bình luận' : 'comments'}</span>
                    </div>
                    <div className="fb-profile-post-actions">
                      <button type="button"><Heart size={18} /> {vi ? 'Thích' : 'Like'}</button>
                      <button type="button"><MessageCircle size={18} /> {vi ? 'Bình luận' : 'Comment'}</button>
                      <button type="button"><Share2 size={18} /> {vi ? 'Chia sẻ' : 'Share'}</button>
                    </div>
                  </article>
                ))}
              </>
            )}

            {activeTab === 'about' && (
              <div className="fb-profile-card">
                <h3 className="fb-profile-card-title mb-4">{vi ? 'Giới thiệu bản thân' : 'About you'}</h3>
                <div className="space-y-4 text-sm text-[var(--text-secondary)]">
                  <p><strong className="text-[var(--text-primary)]">{vi ? 'Họ tên:' : 'Name:'}</strong> {user.fullName}</p>
                  <p><strong className="text-[var(--text-primary)]">Email:</strong> {user.email}</p>
                  <p><strong className="text-[var(--text-primary)]">{vi ? 'Vai trò:' : 'Role:'}</strong> {user.role}</p>
                  <p><strong className="text-[var(--text-primary)]">{vi ? 'Sở thích:' : 'Interests:'}</strong> {vi ? 'Du lịch, ẩm thực, nhiếp ảnh' : 'Travel, food, photography'}</p>
                </div>
              </div>
            )}

            {activeTab === 'photos' && (
              <div className="fb-profile-card">
                <h3 className="fb-profile-card-title mb-4">{vi ? 'Ảnh của bạn' : 'Your photos'}</h3>
                <div className="fb-profile-photo-grid fb-profile-photo-grid--large">
                  {PHOTOS.map((src, i) => (
                    <div key={i} className="fb-profile-photo-cell">
                      <img src={src} alt="" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'trips' && (
              <div className="fb-profile-card">
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-[var(--border-subtle)]">
                  <h3 className="fb-profile-card-title">{vi ? 'Chuyến đi đã lên kế hoạch' : 'Planned Trips'}</h3>
                  <Link
                    to="/trips"
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[var(--gold)] to-blue-700 hover:shadow-md hover:shadow-blue-600/10 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
                  >
                    <Plus size={14} />
                    {vi ? 'Lên kế hoạch mới' : 'Plan New Trip'}
                  </Link>
                </div>

                {plannedTrips.length === 0 ? (
                  <div className="text-center py-12 text-[var(--text-muted)] text-sm">
                    <MapPin size={40} className="mx-auto text-[var(--gold)]/40 mb-3" />
                    <p>{vi ? 'Chưa có chuyến đi nào được lên kế hoạch.' : 'No planned trips yet.'}</p>
                    <Link to="/trips" className="btn-gold inline-flex mt-4 px-6 py-2.5 text-sm">
                      {vi ? 'Lên lịch trình bằng AI ngay' : 'Plan trip with AI now'}
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plannedTrips.map(trip => (
                      <div key={trip.id} className="p-4 rounded-xl border border-[var(--border-normal)] bg-[var(--bg-elevated)] relative hover:border-[var(--gold)]/50 transition-all flex flex-col justify-between group shadow-sm">
                        <div>
                          <h4 className="font-bold text-sm text-[var(--text-primary)]">
                            ✈ {trip.title}
                          </h4>
                          <p className="text-xs text-[var(--text-muted)] mt-1">
                            {vi ? 'Điểm đến:' : 'Destination:'} <span className="font-semibold text-[var(--text-secondary)]">{trip.destinationName}</span>
                          </p>
                          <div className="mt-3 space-y-1.5 text-xs text-[var(--text-secondary)]">
                            <p className="flex items-center gap-1.5">
                              <Calendar size={12} className="opacity-75" />
                              <span>
                                {new Date(trip.startDate).toLocaleDateString(vi ? 'vi-VN' : 'en-US')} - {new Date(trip.endDate).toLocaleDateString(vi ? 'vi-VN' : 'en-US')}
                              </span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <DollarSign size={12} className="opacity-75 text-emerald-500" />
                              <span>{vi ? 'Ngân sách dự kiến:' : 'Budget estimate:'} <strong className="text-[var(--text-primary)]">{Number(trip.totalBudget).toLocaleString(vi ? 'vi-VN' : 'en-US')} {vi ? 'VND' : 'USD'}</strong></span>
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setHistoryLocation(trip.destinationName || trip.title);
                              const dateStr = trip.startDate ? trip.startDate.split('T')[0] : '';
                              setHistoryTime(dateStr);
                              setHistoryCost(trip.totalBudget || 0);
                              setEditingEntry(null);
                              setActiveTab('history');
                              setShowHistoryModal(true);
                            }}
                            className="flex-1 text-center px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:shadow-md text-white text-[11px] font-bold transition-all hover:scale-[1.02] cursor-pointer"
                          >
                            ⭐ {vi ? 'Đánh giá & Lưu Nhật ký' : 'Rate & Log'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePlannedTripDelete(trip.id)}
                            className="px-3 py-2 rounded-xl border border-red-500/30 text-rose-500 hover:bg-rose-500/5 transition-all cursor-pointer"
                            title={vi ? 'Xóa chuyến đi' : 'Delete Trip'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="fb-profile-card">
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-[var(--border-subtle)]">
                  <h3 className="fb-profile-card-title">{vi ? 'Thông báo gần đây' : 'Recent Notifications'}</h3>
                  {notifications.some(n => !n.isRead) && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-xs font-bold text-[var(--gold)] hover:underline"
                    >
                      {vi ? 'Đánh dấu tất cả đã đọc' : 'Mark all as read'}
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {notifications.length === 0 ? (
                    <p className="text-center text-sm text-[var(--text-muted)] py-8">
                      {vi ? 'Không có thông báo nào.' : 'No notifications.'}
                    </p>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`flex items-start gap-3.5 p-4 rounded-xl transition-all border ${
                          notif.isRead ? 'opacity-70 bg-transparent border-transparent' : 'bg-[var(--gold-glow)]/20 border-[var(--border-glow)] shadow-sm'
                        }`}
                      >
                        <div className="mt-0.5 p-2 rounded-xl bg-[var(--bg-elevated)] text-[var(--gold)]">
                          <Bell size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed">{notif.content}</p>
                          <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                            {new Date(notif.createdAt).toLocaleDateString(vi ? 'vi-VN' : 'en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="fb-profile-card">
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-[var(--border-subtle)]">
                  <h3 className="fb-profile-card-title">{vi ? 'Nhật ký di chuyển' : 'Travel History'}</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEntry(null);
                      setHistoryLocation('');
                      setHistoryTime('');
                      setHistoryRating('5');
                      setHistoryCost(0);
                      setShowHistoryModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[var(--gold)] to-blue-700 hover:shadow-md hover:shadow-blue-600/10 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
                  >
                    <Plus size={14} />
                    {vi ? 'Thêm nhật ký' : 'Add History'}
                  </button>
                </div>

                {loadingHistory ? (
                  <div className="flex items-center justify-center py-12 text-[var(--text-muted)] text-xs gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>{vi ? 'Đang tải nhật ký di chuyển...' : 'Loading travel history...'}</span>
                  </div>
                ) : historyList.length === 0 ? (
                  <div className="text-center py-12 text-[var(--text-muted)] text-sm">
                    <MapPin size={32} className="mx-auto text-[var(--gold)]/40 mb-3" />
                    <p>{vi ? 'Chưa có bản ghi nhật ký di chuyển nào.' : 'No travel history entries yet.'}</p>
                    <p className="text-xs mt-1 text-[var(--text-muted)]/70">
                      {vi ? 'Hãy thêm những chuyến hành trình thực tế bạn đã trải qua.' : 'Add real travel journeys you have experienced.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {historyList.map(item => (
                      <div key={item.id} className="p-4 rounded-xl border border-[var(--border-normal)] bg-[var(--bg-elevated)] relative hover:border-[var(--gold)]/50 transition-all flex flex-col justify-between group shadow-sm">
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                              📍 {item.location}
                            </h4>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                                ★ {item.rating || '5'}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 space-y-1.5 text-xs text-[var(--text-secondary)]">
                            <p className="flex items-center gap-1.5">
                              <Calendar size={12} className="opacity-75" />
                              <span>{new Date(item.time).toLocaleDateString(vi ? 'vi-VN' : 'en-US')}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <DollarSign size={12} className="opacity-75 text-emerald-500" />
                              <span className="font-semibold text-[var(--text-primary)]">
                                {Number(item.cost).toLocaleString(vi ? 'vi-VN' : 'en-US')} {vi ? 'VND' : 'USD'}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEntry(item);
                              setHistoryLocation(item.location);
                              const dateObj = new Date(item.time);
                              const formattedDate = dateObj.toISOString().split('T')[0];
                              setHistoryTime(formattedDate);
                              setHistoryRating(item.rating || '5');
                              setHistoryCost(item.cost || 0);
                              setShowHistoryModal(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-[var(--border-normal)] text-[10px] font-bold text-[var(--text-secondary)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all cursor-pointer"
                          >
                            {vi ? 'Sửa' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleHistoryDelete(item.id)}
                            className="px-2.5 py-1.5 rounded-lg border border-red-500/30 text-[10px] font-bold text-rose-500 hover:bg-rose-500/5 transition-all cursor-pointer"
                          >
                            <Trash2 size={11} className="inline mr-0.5" />
                            {vi ? 'Xóa' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ─── MODAL: THÊM / SỬA NHẬT KÝ DI CHUYỂN ─── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-normal)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-elevated)]">
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                {editingEntry ? (vi ? 'Cập nhật nhật ký' : 'Update Travel History') : (vi ? 'Thêm nhật ký di chuyển' : 'Add Travel History')}
              </h3>
              <button
                type="button"
                onClick={() => { setShowHistoryModal(false); setEditingEntry(null); }}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleHistorySubmit} className="p-5 space-y-4">
              {!editingEntry && plannedTrips.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[var(--text-secondary)]">
                    {vi ? 'Liên kết với chuyến đi đã lên kế hoạch' : 'Link to a planned trip'}
                  </label>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        setHistoryLocation('');
                        setHistoryTime('');
                        setHistoryCost(0);
                      } else {
                        const selected = plannedTrips.find(t => t.id === val);
                        if (selected) {
                          setHistoryLocation(selected.destinationName || selected.title);
                          const dateStr = selected.startDate ? selected.startDate.split('T')[0] : '';
                          setHistoryTime(dateStr);
                          setHistoryCost(selected.totalBudget || 0);
                        }
                      }
                    }}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold)]"
                  >
                    <option value="custom">{vi ? '-- Tự nhập địa điểm tự do --' : '-- Enter custom location --'}</option>
                    {plannedTrips.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.destinationName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[var(--text-secondary)]">
                  {vi ? 'Địa điểm đã đi' : 'Location Visited'}
                </label>
                <input
                  type="text"
                  value={historyLocation}
                  onChange={e => setHistoryLocation(e.target.value)}
                  placeholder={vi ? 'Ví dụ: Hạ Long, Sapa...' : 'e.g. Sapa, Ha Long...'}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[var(--text-secondary)]">
                    {vi ? 'Thời gian' : 'Time'}
                  </label>
                  <input
                    type="date"
                    value={historyTime}
                    onChange={e => setHistoryTime(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[var(--text-secondary)]">
                    {vi ? 'Đánh giá (sao)' : 'Rating (stars)'}
                  </label>
                  <select
                    value={historyRating}
                    onChange={e => setHistoryRating(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold)]"
                  >
                    <option value="5">★★★★★ (5)</option>
                    <option value="4">★★★★☆ (4)</option>
                    <option value="3">★★★☆☆ (3)</option>
                    <option value="2">★★☆☆☆ (2)</option>
                    <option value="1">★☆☆☆☆ (1)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[var(--text-secondary)]">
                  {vi ? 'Chi phí chuyến đi (VND)' : 'Trip Cost (VND)'}
                </label>
                <input
                  type="number"
                  value={historyCost}
                  onChange={e => setHistoryCost(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
                />
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowHistoryModal(false); setEditingEntry(null); }}
                  className="px-4 py-2 border border-[var(--border-normal)] text-xs font-semibold text-[var(--text-secondary)] rounded-xl hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
                >
                  {vi ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[var(--gold)] to-blue-700 text-white text-xs font-bold rounded-xl hover:shadow-lg transition-all cursor-pointer"
                >
                  {editingEntry ? (vi ? 'Cập nhật' : 'Update') : (vi ? 'Thêm mới' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
