import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  MapPin, Camera, Pencil, Users, Heart, MessageCircle, Share2,
  MoreHorizontal, Globe, Image as ImageIcon,
  Bell, Sparkles, Send,
  Plus, Trash2, Calendar, DollarSign, Loader2, CheckCircle, X
} from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import type { RootState, AppDispatch } from '../../store';
import { setUser } from '../../store/authSlice';
import { authService, socialService, travelHistoryService, tripsService, postsService } from '../../services/smartTravel.service';
import { useIsMounted } from '../../hooks/useIsMounted';
import { cleanCardText } from '../../utils/feedUtils';



type TabId = 'posts' | 'about' | 'photos' | 'trips' | 'notifications' | 'history';

export default function ProfilePage() {
  const { t, lang } = useLang();
  const { success, error } = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const isMounted = useIsMounted();
  const loggedInUser = useSelector((s: RootState) => s.auth.user);
  const vi = lang === 'vi';

  const [profileUser, setProfileUser] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [followingIdsState, setFollowingIdsState] = useState<Set<string>>(new Set());

  const isOwnProfile = !userId || userId === loggedInUser?.id;
  const user = profileUser || loggedInUser;

  const [activeTab, setActiveTab] = useState<TabId>('posts');
  const [composeText, setComposeText] = useState('');

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

  // Edit Profile Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editHomeLocation, setEditHomeLocation] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const openEditProfileModal = () => {
    setEditFullName(user?.fullName || '');
    setEditBio(user?.bio || user?.profile?.bio || '');
    setEditHomeLocation(user?.homeLocation || user?.profile?.homeLocation || '');
    setShowEditModal(true);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await socialService.updateProfile({
        fullName: editFullName,
        bio: editBio,
        homeLocation: editHomeLocation,
      });

      const updatedUser = {
        ...user,
        fullName: editFullName,
        bio: editBio,
        homeLocation: editHomeLocation,
        profile: {
          ...(user?.profile || {}),
          fullName: editFullName,
          bio: editBio,
          homeLocation: editHomeLocation,
        }
      };

      dispatch(setUser(updatedUser));
      setProfileUser((prev: any) => prev ? {
        ...prev,
        fullName: editFullName,
        bio: editBio,
        homeLocation: editHomeLocation,
        profile: {
          ...(prev.profile || {}),
          fullName: editFullName,
          bio: editBio,
          homeLocation: editHomeLocation,
        }
      } : updatedUser);

      setShowEditModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Update profile error:', err);
      error(vi ? 'Cập nhật thông tin thất bại.' : 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Form states
  const [historyLocation, setHistoryLocation] = useState('');
  const [historyTime, setHistoryTime] = useState('');
  const [historyRating, setHistoryRating] = useState('5');
  const [historyCost, setHistoryCost] = useState<string>('');

  // Real user posts states
  const [profilePosts, setProfilePosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const profilePhotos = useMemo(() => {
    const photos: string[] = [];
    profilePosts.forEach((p: any) => {
      const imgList = (p.images && p.images.length > 0) ? p.images : (p.mediaUrls && p.mediaUrls.length > 0) ? p.mediaUrls : [];
      if (Array.isArray(imgList)) {
        imgList.forEach((img: string) => {
          if (img && typeof img === 'string' && !photos.includes(img)) {
            photos.push(img);
          }
        });
      }
    });
    return photos;
  }, [profilePosts]);

  const fetchProfilePosts = async (targetUserId: string) => {
    setLoadingPosts(true);
    try {
      const res = await postsService.feed({ authorId: targetUserId, limit: 30 } as any);
      if (res && Array.isArray(res.posts)) {
        const mapped = res.posts.map((p: any) => {
          const parsed = (() => {
            try {
              return JSON.parse(p.content);
            } catch {
              return null;
            }
          })();
          const images = (p.mediaUrls && p.mediaUrls.length > 0)
            ? p.mediaUrls
            : (parsed?.mediaUrls && Array.isArray(parsed.mediaUrls))
            ? parsed.mediaUrls
            : (parsed?.images && Array.isArray(parsed.images))
            ? parsed.images
            : [];
          return {
            id: p.id,
            content: cleanCardText(parsed?.body || parsed?.content || p.content || ''),
            date: new Date(p.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }),
            likes: p._count?.likes || 0,
            comments: p._count?.comments || 0,
            bookmarks: p._count?.bookmarks || 0,
            images
          };
        });
        setProfilePosts(mapped);
      }
    } catch (err) {
      console.error('Failed to load profile posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Fetch posts when the active user ID changes
  useEffect(() => {
    if (user?.id) {
      fetchProfilePosts(user.id);
    }
  }, [user?.id, lang]);

  // Fetch viewed user profile (whether own profile or someone else's)
  useEffect(() => {
    const targetId = userId || loggedInUser?.id;
    if (targetId) {
      setLoadingProfile(true);
      socialService.getProfile(targetId)
        .then(data => {
          if (!isMounted()) return;
          const normalized = {
            id: data.id,
            email: data.email,
            fullName: data.profile?.fullName || data.fullName || 'Người dùng',
            avatarUrl: data.profile?.avatarUrl || '',
            coverUrl: data.profile?.coverUrl || '',
            bio: data.profile?.bio || '',
            homeLocation: data.profile?.homeLocation || '',
            _count: data._count,
            preferences: data.preferences,
            profile: data.profile,
          };
          setProfileUser(normalized);
        })
        .catch(err => {
          if (!isMounted()) return;
          console.error('Failed to load user profile:', err);
          error(vi ? 'Không tìm thấy người dùng này.' : 'User not found.');
        })
        .finally(() => {
          if (isMounted()) {
            setLoadingProfile(false);
          }
        });
    } else {
      setProfileUser(null);
      setLoadingProfile(false);
    }
  }, [userId, loggedInUser?.id]);

  // Load followers list and notifications for own profile, and followingIds for logged-in user
  useEffect(() => {
    if (loggedInUser) {
      socialService.getFollowing(loggedInUser.id)
        .then(data => {
          if (!isMounted()) return;
          if (Array.isArray(data)) {
            setFollowingIdsState(new Set(data.map(u => u.id)));
            if (isOwnProfile) {
              setFollowing(data);
            }
          }
        })
        .catch(err => console.error('Get following failed:', err));

      if (isOwnProfile) {
        socialService.notifications()
          .then(data => {
            if (!isMounted()) return;
            if (Array.isArray(data)) setNotifications(data);
          })
          .catch(err => console.error('Get notifications failed:', err));

        fetchPlannedTrips();
      }
    }
  }, [loggedInUser, isOwnProfile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const res = await socialService.updateProfile({ avatarUrl: base64 });
        const newAvatarUrl = res?.avatarUrl || base64;

        const updatedUser = {
          ...user,
          avatarUrl: newAvatarUrl,
          profile: {
            ...(user.profile || {}),
            avatarUrl: newAvatarUrl,
          }
        };

        dispatch(setUser(updatedUser));
        authService.LuuUser(updatedUser);

        setProfileUser((prev: any) => prev ? {
          ...prev,
          avatarUrl: newAvatarUrl,
          profile: {
            ...(prev?.profile || {}),
            avatarUrl: newAvatarUrl,
          }
        } : updatedUser);

        success(vi ? 'Cập nhật ảnh đại diện thành công!' : 'Avatar updated successfully!');
      } catch (err) {
        console.error('Update avatar failed:', err);
        error(vi ? 'Cập nhật ảnh đại diện thất bại' : 'Failed to update avatar');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        await socialService.updateProfile({ coverUrl: base64 });
        setProfileUser((prev: any) => ({
          ...prev,
          coverUrl: base64,
          profile: { ...(prev?.profile || {}), coverUrl: base64 }
        }));
        dispatch(setUser({ ...user, coverUrl: base64 }));
        success(vi ? 'Cập nhật ảnh bìa thành công!' : 'Cover photo updated successfully!');
      } catch (err) {
        console.error('Update cover failed:', err);
        error(vi ? 'Cập nhật ảnh bìa thất bại' : 'Failed to update cover photo');
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

  // Only show full-screen loader if we have NO profile data at all
  if (loadingProfile && !profileUser && !loggedInUser) {
    return (
      <div className="flex items-center justify-center p-20 text-xs text-[var(--text-muted)] gap-2">
        <Loader2 size={16} className="animate-spin text-brand-500" />
        <span>{vi ? 'Đang tải thông tin cá nhân...' : 'Loading profile...'}</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center p-6">
        <Users className="w-12 h-12 text-slate-400" />
        <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
          {vi ? 'Chưa đăng nhập tài khoản' : 'Not logged in'}
        </h3>
        <p className="text-xs text-slate-500 max-w-sm">
          {vi ? 'Vui lòng đăng nhập để xem thông tin trang cá nhân của bạn.' : 'Please log in to view your profile page.'}
        </p>
        <button
          onClick={() => navigate('/auth')}
          className="btn-gold px-5 py-2 text-xs font-bold rounded-xl cursor-pointer"
        >
          {vi ? 'Đăng nhập ngay' : 'Log In Now'}
        </button>
      </div>
    );
  }

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
        cost: historyCost ? Number(historyCost) : 0,
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
      setHistoryCost('');
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

  const tabs = [
    { id: 'posts', label: t('profile.tab.posts') },
    { id: 'about', label: t('profile.tab.about') },
    { id: 'photos', label: t('profile.tab.photos') },
    { id: 'trips', label: t('profile.tab.trips') },
    { id: 'history', label: vi ? 'Nhật ký di chuyển' : 'Travel History' },
    isOwnProfile && { id: 'notifications', label: vi ? 'Thông báo' : 'Notifications' },
  ].filter((t): t is { id: TabId; label: string } => !!t);

  const statFriends = user?._count?.following ?? 0;
  const statFollowers = user?._count?.followers ?? 0;

  return (
    <div className="relative min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans overflow-x-clip animate-fade-in">
      {/* ── Ambient Background Glow Mesh ── */}
      <div className="absolute top-10 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-brand-500/15 via-sky-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[600px] right-10 w-[500px] h-[500px] bg-gradient-to-tl from-emerald-500/10 via-brand-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── Main Container matching exact page bounds ── */}
      <div className="relative z-10 space-y-6 max-w-[1750px] mx-auto">
        
        {/* ── Header Cover & Profile Banner Card ── */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          {/* Cover Photo Area */}
          <div className="relative h-48 sm:h-64 lg:h-72 w-full overflow-hidden bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-700">
            <img
              src={user.coverUrl || user.profile?.coverUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80'}
              alt="Cover"
              className="w-full h-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
            {isOwnProfile && (
              <label
                htmlFor="cover-upload"
                className="absolute bottom-4 right-4 px-3.5 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg hover:scale-105 active:scale-95"
              >
                <Camera size={14} />
                <span>{vi ? 'Chỉnh sửa ảnh bìa' : 'Edit Cover'}</span>
                <input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              </label>
            )}
          </div>

          {/* Profile Details & Avatar Bar */}
          <div className="px-6 pb-6 pt-2 flex flex-col md:flex-row items-center md:items-end justify-between gap-5 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
              {/* Profile Avatar with Camera Upload Badge */}
              <div className="relative -mt-16 sm:-mt-20 group shrink-0">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white dark:border-slate-900 shadow-2xl overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <img
                    src={user.avatarUrl || user.profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'User')}&background=0D9488&color=fff`}
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'User')}&background=0D9488&color=fff`;
                    }}
                  />
                </div>
                {isOwnProfile && (
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-1 right-1 p-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-full shadow-lg border-2 border-white dark:border-slate-900 cursor-pointer transition-all hover:scale-110 flex items-center justify-center"
                  >
                    <Camera size={16} />
                    <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                )}
              </div>

              {/* User Info */}
              <div className="space-y-1 sm:pb-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {user.fullName}
                </h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-extrabold">
                    <Users size={14} className="text-brand-500" />
                    <strong>{statFriends}</strong> {vi ? 'đang theo dõi' : 'following'}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-extrabold">
                    <strong>{statFollowers}</strong> {vi ? 'người theo dõi' : 'followers'}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 text-rose-500 font-bold">
                    <MapPin size={14} /> {user.homeLocation || (vi ? 'Chưa cập nhật quê quán' : 'Home location not set')}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-center">
              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    onClick={openEditProfileModal}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-2xl shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <Pencil size={15} />
                    <span>{vi ? 'Chỉnh sửa trang cá nhân' : 'Edit Profile'}</span>
                  </button>
                  <Link
                    to="/profile/following"
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-extrabold rounded-2xl border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Users size={15} />
                    <span>{t('userMenu.following')}</span>
                  </Link>
                </>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    if (!loggedInUser) {
                      navigate('/auth');
                      return;
                    }
                    try {
                      const res = await socialService.toggleFollow(user.id);
                      const updatedFollowers = typeof res.followersCount === 'number'
                        ? res.followersCount
                        : (res.following ? ((profileUser?._count?.followers ?? 0) + 1) : Math.max(0, (profileUser?._count?.followers ?? 0) - 1));

                      setProfileUser((prev: any) => prev ? {
                        ...prev,
                        _count: {
                          ...(prev._count || {}),
                          followers: updatedFollowers
                        }
                      } : prev);

                      if (res.following) {
                        setFollowingIdsState(prev => new Set([...prev, user.id]));
                        success(vi ? 'Đã theo dõi người dùng này!' : 'Following user!');
                      } else {
                        setFollowingIdsState(prev => {
                          const next = new Set(prev);
                          next.delete(user.id);
                          return next;
                        });
                        success(vi ? 'Đã bỏ theo dõi người dùng này.' : 'Unfollowed user.');
                      }
                    } catch (err) {
                      console.error('Follow failed:', err);
                    }
                  }}
                  className={`px-6 py-2.5 text-xs font-extrabold rounded-2xl border transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    followingIdsState.has(user.id)
                      ? 'bg-transparent text-slate-500 border-slate-300 hover:text-red-500 hover:border-red-500'
                      : 'bg-brand-600 text-white border-transparent hover:bg-brand-500 shadow-brand-500/25'
                  }`}
                >
                  <Users size={15} />
                  <span>{followingIdsState.has(user.id) ? (vi ? 'Đang theo dõi' : 'Following') : (vi ? 'Theo dõi' : 'Follow')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Modern Navigation Tabs Bar ── */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-2 rounded-2xl shadow-xl flex items-center gap-2 overflow-x-auto scrollbar-none">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-brand-600 to-sky-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>{tab.label}</span>
              {tab.id === 'notifications' && notifications.some(n => !n.isRead) && (
                <span className="flex h-2 w-2 rounded-full bg-rose-500" />
              )}
            </button>
          ))}
        </div>

        {/* ── 2-Column Main Content Body Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Card 1: Giới thiệu (Intro) */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-2">
                <Sparkles size={16} className="text-brand-500" />
                {vi ? 'GIỚI THIỆU' : 'INTRO'}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
                "{user.bio || (vi ? 'Chưa cập nhật giới thiệu bản thân' : 'No bio available')}"
              </p>

              <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                  <MapPin size={16} className="text-rose-500 shrink-0" />
                  <span>{user.homeLocation || (vi ? 'Chưa cập nhật quê quán' : 'Home location not set')}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300 font-semibold truncate">
                  <Globe size={16} className="text-emerald-500 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>

              {isOwnProfile && (
                <button
                  type="button"
                  onClick={openEditProfileModal}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>{vi ? 'Chỉnh sửa chi tiết' : 'Edit details'}</span>
                </button>
              )}
            </div>

            {/* Card 2: Bộ sưu tập Ảnh */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-2">
                  <ImageIcon size={16} className="text-brand-500" />
                  {vi ? 'BỘ SƯU TẬP ẢNH' : 'PHOTOS'}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('photos')}
                  className="text-xs font-bold text-brand-600 hover:underline cursor-pointer"
                >
                  {vi ? 'Xem tất cả' : 'See all'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {profilePhotos.length > 0 ? (
                  profilePhotos.slice(0, 6).map((src: string, i: number) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveTab('photos')}
                      className="aspect-square rounded-2xl overflow-hidden group border border-slate-200 dark:border-slate-700/60 cursor-pointer"
                    >
                      <img
                        src={src}
                        alt="Thumbnail"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </button>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-4 text-xs font-semibold text-slate-400">
                    {vi ? 'Chưa có ảnh nào.' : 'No photos yet.'}
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: Đang theo dõi (Following) */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-2">
                  <Users size={16} className="text-brand-500" />
                  {vi ? 'ĐANG THEO DÕI' : 'FOLLOWING'}
                </h3>
                <Link to="/profile/following" className="text-xs font-bold text-brand-600 hover:underline">
                  {vi ? 'Xem tất cả' : 'See all'}
                </Link>
              </div>

              <p className="text-xs text-slate-500 font-medium">
                {statFriends} {vi ? 'đang theo dõi' : 'following'}
              </p>

              <div className="grid grid-cols-3 gap-3">
                {following.length > 0 ? (
                  following.slice(0, 6).map(f => {
                    const profileData = f.profile || f.following?.profile || f;
                    const name = profileData?.fullName || f.fullName || f.name || f.email?.split('@')[0] || 'Thành viên';
                    const targetId = f.id || f.userId || f.followingId || f.following?.id;
                    const rawAvatar = profileData?.avatarUrl || f.avatarUrl || f.avatar || f.following?.avatarUrl;
                    const avatarUrl = rawAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D9488&color=fff`;
                    return (
                      <Link to={`/profile/${targetId}`} key={targetId} className="text-center space-y-1 group cursor-pointer block">
                        <div className="aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm relative bg-slate-100 dark:bg-slate-800">
                          <img
                            src={avatarUrl}
                            alt={name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D9488&color=fff`;
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate">{name.split(' ').pop() || name}</span>
                      </Link>
                    );
                  })
                ) : (
                  <div className="col-span-3 text-center py-4 text-xs font-semibold text-slate-400">
                    {vi ? 'Chưa theo dõi ai.' : 'Not following anyone.'}
                  </div>
                )}
              </div>
            </div>

          </aside>

          {/* Right Main Column */}
          <main className="lg:col-span-8 space-y-6">
            
            {activeTab === 'posts' && (
              <>
                {/* Compose Card */}
                {isOwnProfile && (
                  <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-brand-500">
                        <img src={user.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} alt="" className="w-full h-full object-cover" />
                      </div>
                      <input
                        type="text"
                        value={composeText}
                        onChange={e => setComposeText(e.target.value)}
                        placeholder={vi ? 'Bạn đang nghĩ gì về chuyến đi tiếp theo?' : "What's on your mind?"}
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <button type="button" className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer">
                          <ImageIcon size={16} />
                          <span>{vi ? 'Ảnh/Video' : 'Photo/Video'}</span>
                        </button>
                        <button type="button" className="px-3 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer">
                          <MapPin size={16} />
                          <span>Check-in</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        className="px-5 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        <Send size={14} />
                        <span>{vi ? 'Đăng' : 'Post'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Timeline posts */}
                {loadingPosts ? (
                  <div className="flex items-center justify-center p-10 text-xs text-[var(--text-muted)] gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>{vi ? 'Đang tải bài viết...' : 'Loading posts...'}</span>
                  </div>
                ) : profilePosts.length === 0 ? (
                  <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-8 rounded-3xl text-center text-xs text-slate-500 font-bold">
                    {vi ? 'Chưa có bài viết nào.' : 'No posts yet.'}
                  </div>
                ) : (
                  profilePosts.map(post => (
                    <article key={post.id} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                            <img src={user.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{user.fullName}</h4>
                            <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                              <span>{post.date}</span>
                              <span>·</span>
                              <Globe size={11} />
                            </p>
                          </div>
                        </div>
                        <button type="button" className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                          <MoreHorizontal size={18} />
                        </button>
                      </div>

                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">{post.content}</p>

                      {post.images && post.images.length > 0 && (
                        <div className={`grid ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800`}>
                          {post.images.map((src: string, i: number) => (
                            <img key={i} src={src} alt="" className="w-full h-48 object-cover" />
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1.5">
                          <Heart size={14} className="text-rose-500 fill-rose-500" />
                          <span>{post.likes}</span>
                        </span>
                        <span>{post.comments} {vi ? 'bình luận' : 'comments'}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" className="py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-600 dark:text-slate-300 hover:text-rose-600 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                          <Heart size={16} />
                          <span>{vi ? 'Thích' : 'Like'}</span>
                        </button>
                        <button type="button" className="py-2 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950/30 text-slate-600 dark:text-slate-300 hover:text-brand-600 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                          <MessageCircle size={16} />
                          <span>{vi ? 'Bình luận' : 'Comment'}</span>
                        </button>
                        <button type="button" className="py-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/30 text-slate-600 dark:text-slate-300 hover:text-purple-600 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                          <Share2 size={16} />
                          <span>{vi ? 'Chia sẻ' : 'Share'}</span>
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </>
            )}

            {activeTab === 'about' && (
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
                <h3 className="text-sm font-black uppercase text-brand-600 dark:text-brand-400">{vi ? 'Giới thiệu bản thân' : 'About you'}</h3>
                <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <p><strong className="text-slate-900 dark:text-white">{vi ? 'Họ tên:' : 'Name:'}</strong> {user.fullName}</p>
                  <p><strong className="text-slate-900 dark:text-white">Email:</strong> {user.email}</p>
                  <p><strong className="text-slate-900 dark:text-white">{vi ? 'Vai trò:' : 'Role:'}</strong> {user.role}</p>
                  <p><strong className="text-slate-900 dark:text-white">{vi ? 'Sở thích:' : 'Interests:'}</strong> {vi ? 'Du lịch, ẩm thực, nhiếp ảnh' : 'Travel, food, photography'}</p>
                </div>
              </div>
            )}

            {activeTab === 'photos' && (
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-black uppercase text-brand-600 dark:text-brand-400">{vi ? 'Ảnh của bạn' : 'Your photos'}</h3>
                  <span className="text-xs font-semibold text-slate-400">{profilePhotos.length} {vi ? 'ảnh' : 'photos'}</span>
                </div>
                {profilePhotos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {profilePhotos.map((src, i) => (
                      <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm group">
                        <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-xs font-semibold text-slate-400">
                    {vi ? 'Chưa có ảnh nào từ các bài viết bạn đã đăng tải.' : 'No photos published in your posts yet.'}
                  </div>
                )}
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
                        {isOwnProfile && (
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
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-black uppercase text-brand-600 dark:text-brand-400">{vi ? 'Thông báo gần đây' : 'Recent Notifications'}</h3>
                  {notifications.some(n => !n.isRead) && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-xs font-bold text-brand-600 hover:underline cursor-pointer"
                    >
                      {vi ? 'Đánh dấu tất cả đã đọc' : 'Mark all as read'}
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-8 font-medium">
                      {vi ? 'Không có thông báo nào.' : 'No notifications.'}
                    </p>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`flex items-start gap-3.5 p-4 rounded-2xl transition-all border ${
                          notif.isRead ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800' : 'bg-brand-50/50 dark:bg-brand-950/30 border-brand-200 dark:border-brand-800 shadow-sm'
                        }`}
                      >
                        <div className="mt-0.5 p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                          <Bell size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">{notif.content}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">
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
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEntry(null);
                        setHistoryLocation('');
                        setHistoryTime('');
                        setHistoryRating('5');
                        setHistoryCost('');
                        setShowHistoryModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[var(--gold)] to-blue-700 hover:shadow-md hover:shadow-blue-600/10 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
                    >
                      <Plus size={14} />
                      {vi ? 'Thêm nhật ký' : 'Add History'}
                    </button>
                  )}
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
                        {isOwnProfile && (
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
                                setHistoryCost(item.cost ? String(item.cost) : '');
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
                        )}
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
                        setHistoryCost('');
                      } else {
                        const selected = plannedTrips.find(t => t.id === val);
                        if (selected) {
                          setHistoryLocation(selected.destinationName || selected.title);
                          const dateStr = selected.startDate ? selected.startDate.split('T')[0] : '';
                          setHistoryTime(dateStr);
                          setHistoryCost(selected.totalBudget ? String(selected.totalBudget) : '');
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
                  type="text"
                  inputMode="numeric"
                  value={historyCost ? Number(String(historyCost).replace(/\D/g, '')).toLocaleString('vi-VN') : ''}
                  onChange={e => {
                    const raw = e.target.value;
                    const digitsOnly = raw.replace(/\D/g, '');
                    if (!digitsOnly) {
                      setHistoryCost('');
                      return;
                    }
                    const cleaned = digitsOnly.replace(/^0+(?=\d)/, '');
                    setHistoryCost(cleaned);
                  }}
                  placeholder="200.000.000"
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

      {/* ── MODAL: CHỈNH SỬA THÔNG TIN CÁ NHÂN ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fade-in">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-normal)] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-elevated)]">
              <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <Pencil size={16} className="text-brand-500" />
                {vi ? 'Chỉnh sửa thông tin cá nhân' : 'Edit Personal Profile'}
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[var(--text-secondary)]">
                  {vi ? 'Họ và tên' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  placeholder={vi ? 'Nhập họ và tên của bạn...' : 'Enter your full name...'}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] font-semibold focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[var(--text-secondary)]">
                  {vi ? 'Quê quán / Vị trí' : 'Home Location'}
                </label>
                <input
                  type="text"
                  value={editHomeLocation}
                  onChange={e => setEditHomeLocation(e.target.value)}
                  placeholder={vi ? 'Ví dụ: Hà Nội, Đà Nẵng, TP. Hồ Chí Minh...' : 'e.g. Hanoi, Da Nang...'}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] font-semibold focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[var(--text-secondary)]">
                  {vi ? 'Giới thiệu bản thân (Bio)' : 'Bio / Short Description'}
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder={vi ? 'Chia sẻ câu nói yêu thích hoặc niềm đam mê xê dịch của bạn...' : 'Share something about yourself...'}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] font-medium focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 border border-[var(--border-normal)] text-xs font-extrabold text-[var(--text-secondary)] rounded-xl hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
                >
                  {vi ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {savingProfile ? <Loader2 size={15} className="animate-spin" /> : null}
                  <span>{vi ? 'Lưu thay đổi' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL THÔNG BÁO THÀNH CÔNG ĐẸP MẮT ── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fade-in">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-normal)] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-5 animate-scale-up relative overflow-hidden">
            {/* Glow ambient background inside modal */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-brand-500/20 rounded-full blur-2xl pointer-events-none" />
            
            {/* Icon Badge */}
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle size={36} className="animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-[var(--text-primary)]">
                {vi ? 'Cập nhật thành công!' : 'Update Successful!'}
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed">
                {vi ? 'Thông tin cá nhân của bạn đã được lưu và cập nhật trên toàn hệ thống.' : 'Your profile information has been saved.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-2xl shadow-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              {vi ? 'Đồng ý & Đóng' : 'OK & Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
