import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  MapPin, Camera, Pencil, Users, Heart, MessageCircle, Share2,
  MoreHorizontal, Globe, Briefcase, GraduationCap, Image as ImageIcon,
  Bell
} from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import type { RootState, AppDispatch } from '../../store';
import { setUser } from '../../store/authSlice';
import { socialService } from '../../services/smartTravel.service';

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

type TabId = 'posts' | 'about' | 'photos' | 'trips' | 'notifications';

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

  const tabs: { id: TabId; label: string }[] = [
    { id: 'posts', label: t('profile.tab.posts') },
    { id: 'about', label: t('profile.tab.about') },
    { id: 'photos', label: t('profile.tab.photos') },
    { id: 'trips', label: t('profile.tab.trips') },
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
              <div className="fb-profile-card text-center py-12">
                <MapPin size={40} className="mx-auto text-[var(--gold)] mb-3" />
                <p className="text-[var(--text-secondary)] text-sm">
                  {vi ? 'Chưa có hành trình công khai.' : 'No public journeys yet.'}
                </p>
                <Link to="/journeys/create" className="btn-gold inline-flex mt-4 px-6 py-2.5 text-sm">
                  {vi ? 'Tạo hành trình đầu tiên' : 'Create your first journey'}
                </Link>
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
          </main>
        </div>
      </div>
    </div>
  );
}
