import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ExternalLink, Heart, MessageCircle, Trash2, ArrowLeft, Calendar, DollarSign, MapPin, Compass, Clock, Sparkles } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { postsService, tripsService, Post } from '../../services/smartTravel.service';
import { mapApiPostsToFeed } from '../../utils/apiPostMapper';
import { FeedPost } from '../../utils/feedUtils';
import PostDetailModal from '../../components/feed/PostDetailModal';

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

  useEffect(() => {
    void fetchSavedData();
  }, []);

  const handleUnsavePost = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    try {
      await postsService.LuuHoacBoLuu(postId);
      setSavedPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTrip = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    if (!window.confirm(vi ? 'Bạn có chắc chắn muốn xóa hành trình này?' : 'Are you sure you want to delete this itinerary?')) return;
    try {
      await tripsService.XoaChuyenDi(tripId);
      setSavedTrips(prev => prev.filter(t => t.id !== tripId));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostClick = (post: Post) => {
    const mapped = mapApiPostsToFeed([post])[0];
    if (mapped) {
      setSelectedPost(mapped);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-8">
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          labels={{
            close: vi ? 'Đóng' : 'Close',
            readTime: '',
            likes: vi ? 'lượt thích' : 'likes',
            comments: vi ? 'bình luận' : 'comments',
          }}
        />
      )}

      {/* Itinerary Details Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-[var(--border-subtle)] flex items-start justify-between bg-gradient-to-r from-[var(--gold)]/10 via-transparent to-transparent">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-[var(--gold)] font-bold uppercase tracking-wider">
                  <Compass size={12} className="animate-spin duration-3000" />
                  {vi ? 'Lịch trình du lịch' : 'Travel Itinerary'}
                </div>
                <h2 className="text-xl font-editorial font-bold text-[var(--text-primary)]">{selectedTrip.title}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)] pt-1">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {selectedTrip.destinationName}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(selectedTrip.startDate).toLocaleDateString('vi-VN')}</span>
                  <span className="flex items-center gap-1"><DollarSign size={12} /> {selectedTrip.totalBudget.toLocaleString('vi-VN')} đ</span>
                  <span className="flex items-center gap-1"><Sparkles size={12} className="text-yellow-500" /> {selectedTrip.travelStyle}</span>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedTrip(null); setSelectedDayIdx(0); }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1.5 hover:bg-[var(--bg-elevated)] rounded-full border border-[var(--border-subtle)]"
              >
                <span className="text-lg font-bold">&times;</span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row min-h-0">
              {/* Left: Days list */}
              <div className="w-full md:w-48 border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 space-y-1 overflow-y-auto">
                {selectedTrip.days.map((day: any, idx: number) => (
                  <button
                    key={day.id || idx}
                    onClick={() => setSelectedDayIdx(idx)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
                      selectedDayIdx === idx
                        ? 'bg-[var(--gold)] text-black border-[var(--gold)] shadow-md'
                        : 'bg-transparent text-[var(--text-primary)] border-transparent hover:bg-black/5 hover:border-[var(--border-subtle)]'
                    }`}
                  >
                    <span>{vi ? `Ngày ${idx + 1}` : `Day ${idx + 1}`}</span>
                    <span className="text-[10px] opacity-75">{day.activities?.length || 0} {vi ? 'hoạt động' : 'acts'}</span>
                  </button>
                ))}
              </div>

              {/* Right: Activities list */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {selectedTrip.days[selectedDayIdx]?.activities?.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[var(--text-muted)]">
                    {vi ? 'Không có hoạt động nào được ghi nhận cho ngày này.' : 'No activities recorded for this day.'}
                  </div>
                ) : (
                  selectedTrip.days[selectedDayIdx]?.activities?.map((act: any, actIdx: number) => {
                    const extra = unpackActivityNotes(act);
                    return (
                      <div key={act.id || actIdx} className="flex gap-4 group relative">
                        {/* Timeline bullet */}
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-xs font-bold text-[var(--gold)] group-hover:border-[var(--gold)] transition-colors">
                            {actIdx + 1}
                          </div>
                          {actIdx < selectedTrip.days[selectedDayIdx].activities.length - 1 && (
                            <div className="w-0.5 flex-1 bg-[var(--border-subtle)] my-1" />
                          )}
                        </div>

                        {/* Activity Details */}
                        <div className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-4 space-y-2 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="text-xs font-bold text-[var(--text-primary)]">{extra.activityName}</h4>
                              <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 pt-0.5">
                                <MapPin size={10} /> {extra.locationName}
                              </p>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[10px] bg-black/5 text-[var(--text-muted)] px-2.5 py-0.5 rounded-full font-bold">
                              <Clock size={9} /> {act.startTime} - {act.endTime}
                            </span>
                          </div>
                          
                          {extra.notes && (
                            <p className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg-surface)] p-2.5 rounded-xl border border-[var(--border-subtle)] italic leading-relaxed">
                              {extra.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container-wide max-w-6xl mx-auto px-4 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
          <div className="space-y-1">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors mb-2">
              <ArrowLeft size={14} /> {vi ? 'Quay lại bảng tin' : 'Back to Feed'}
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Bookmark size={20} className="fill-current" />
              </div>
              <div>
                <h1 className="text-2xl font-editorial font-bold text-[var(--text-primary)]">
                  {vi ? 'Bộ sưu tập đã lưu' : 'Saved Collection'}
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  {vi 
                    ? `${savedPosts.length} bài viết và ${savedTrips.length} hành trình` 
                    : `${savedPosts.length} posts and ${savedTrips.length} itineraries`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs switcher */}
        <div className="flex border-b border-[var(--border-subtle)] gap-2">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-6 py-3 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'posts'
                ? 'border-[var(--gold)] text-[var(--gold)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Bookmark size={14} />
            {vi ? `Bài viết (${savedPosts.length})` : `Posts (${savedPosts.length})`}
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`px-6 py-3 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'trips'
                ? 'border-[var(--gold)] text-[var(--gold)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Compass size={14} />
            {vi ? `Hành trình (${savedTrips.length})` : `Itineraries (${savedTrips.length})`}
          </button>
        </div>

        {/* Saved Items Content */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-t-[var(--gold)] border-r-transparent border-b-rose-500 border-l-transparent animate-spin duration-1000" />
            <p className="text-sm text-[var(--text-muted)]">{vi ? 'Đang tải danh sách đã lưu...' : 'Loading saved list...'}</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center text-rose-300">
            {error}
          </div>
        ) : activeTab === 'posts' ? (
          /* Tab 1: POSTS */
          savedPosts.length === 0 ? (
            <div className="text-center py-20 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                <Bookmark size={24} />
              </div>
              <div className="space-y-1 px-6">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {vi ? 'Không có bài viết đã lưu' : 'No saved posts'}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {vi 
                    ? 'Hãy duyệt bảng tin và bấm vào biểu tượng lưu để giữ lại các bài viết thú vị.' 
                    : 'Browse the feed and save interesting articles for later.'}
                </p>
              </div>
              <Link to="/" className="btn-gold inline-flex px-6 py-2.5 text-xs">
                {vi ? 'Khám phá ngay' : 'Explore Now'}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedPosts.map(post => {
                const authorName = post.author.profile?.fullName || 'Người dùng';
                const avatar = post.author.profile?.avatarUrl;
                const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;
                const dateString = new Date(post.createdAt).toLocaleDateString('vi-VN');

                return (
                  <div 
                    key={post.id}
                    onClick={() => handlePostClick(post)}
                    className="surface-elevated overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--gold)]/40 rounded-2xl cursor-pointer hover:shadow-xl transition-all duration-300 flex flex-col group relative"
                  >
                    {/* Media Cover */}
                    <div className="h-44 relative bg-black/10 overflow-hidden">
                      {hasMedia ? (
                        <img 
                          src={post.mediaUrls[0]} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-600/30 to-rose-600/30 flex items-center justify-center text-[var(--text-muted)] font-editorial text-sm">
                          Terraholic Journey
                        </div>
                      )}
                      
                      {/* Unsave button overlay */}
                      <button
                        onClick={(e) => handleUnsavePost(e, post.id)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-rose-600/90 text-white flex items-center justify-center backdrop-blur-sm shadow-md transition-all duration-200"
                        title={vi ? 'Bỏ lưu bài viết' : 'Unsave item'}
                      >
                        <Trash2 size={13} />
                      </button>

                      {/* Date label */}
                      <span className="absolute bottom-3 left-3 bg-black/50 text-[10px] text-white/90 px-2 py-0.5 rounded-md backdrop-blur-sm">
                        {dateString}
                      </span>
                    </div>

                    {/* Body Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        {/* Author */}
                        <div className="flex items-center gap-2">
                          {avatar ? (
                            <img src={avatar} alt="" className="w-5 h-5 rounded-full object-cover border border-[var(--border-subtle)]" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-[var(--gold)] text-black font-bold flex items-center justify-center text-[9px]">
                              {authorName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-[11px] font-bold text-[var(--text-secondary)] truncate">{authorName}</span>
                        </div>

                        {/* Content excerpt */}
                        <p className="text-xs text-[var(--text-primary)] font-semibold leading-normal line-clamp-3">
                          {post.content}
                        </p>
                      </div>

                      {/* Footer Stats & details Link */}
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-3">
                        <div className="flex gap-3">
                          <span className="flex items-center gap-1"><Heart size={10} className="text-rose-500 fill-rose-500/10" /> {post._count?.likes ?? 0}</span>
                          <span className="flex items-center gap-1"><MessageCircle size={10} /> {post._count?.comments ?? 0}</span>
                        </div>
                        <span className="text-gold font-semibold flex items-center gap-1 group-hover:underline">
                          {vi ? 'Xem chi tiết' : 'Details'} <ExternalLink size={9} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Tab 2: TRIPS */
          savedTrips.length === 0 ? (
            <div className="text-center py-20 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                <Compass size={24} />
              </div>
              <div className="space-y-1 px-6">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {vi ? 'Không có hành trình đã lưu' : 'No saved itineraries'}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {vi 
                    ? 'Hãy tạo hành trình bằng công cụ AI hoặc lưu các lịch trình công khai để xem lại tại đây.' 
                    : 'Create itineraries using the AI Planner or save public ones to view here.'}
                </p>
              </div>
              <Link to="/trips" className="btn-gold inline-flex px-6 py-2.5 text-xs">
                {vi ? 'Tạo hành trình ngay' : 'Plan Now'}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedTrips.map(trip => {
                const totalDays = trip.days?.length || 1;
                const formattedCost = trip.totalBudget ? trip.totalBudget.toLocaleString('vi-VN') : '0';
                const createdDate = new Date(trip.createdAt).toLocaleDateString('vi-VN');

                return (
                  <div 
                    key={trip.id}
                    onClick={() => setSelectedTrip(trip)}
                    className="surface-elevated overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--gold)]/40 rounded-2xl cursor-pointer hover:shadow-xl transition-all duration-300 flex flex-col group relative"
                  >
                    {/* Cover Photo (Gradients for trip categories) */}
                    <div className="h-44 relative bg-gradient-to-br from-teal-500/20 via-transparent to-[var(--gold)]/20 overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] group-hover:backdrop-blur-0 transition-all duration-500" />
                      
                      <div className="relative text-center z-10 p-4 space-y-1.5">
                        <span className="inline-flex text-[9px] font-bold bg-[var(--gold)] text-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {trip.travelStyle || 'Explore'}
                        </span>
                        <h3 className="text-sm font-editorial font-bold text-white line-clamp-2 px-2 drop-shadow-md">
                          {trip.title}
                        </h3>
                      </div>

                      {/* Delete button overlay */}
                      <button
                        onClick={(e) => handleDeleteTrip(e, trip.id)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-rose-600/90 text-white flex items-center justify-center backdrop-blur-sm shadow-md transition-all duration-200 z-20"
                        title={vi ? 'Xóa hành trình' : 'Delete itinerary'}
                      >
                        <Trash2 size={13} />
                      </button>

                      {/* Date label */}
                      <span className="absolute bottom-3 left-3 bg-black/50 text-[10px] text-white/90 px-2 py-0.5 rounded-md backdrop-blur-sm z-10">
                        {createdDate}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                          <MapPin size={13} className="text-[var(--gold)]" />
                          <span>{trip.destinationName}</span>
                        </div>
                        {trip.description && (
                          <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                            {trip.description}
                          </p>
                        )}
                      </div>

                      {/* Details stats */}
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-3">
                        <div className="flex gap-4">
                          <span className="font-bold text-[var(--text-primary)]">{totalDays} {vi ? 'ngày' : 'days'}</span>
                          <span>{formattedCost} đ</span>
                        </div>
                        <span className="text-gold font-semibold flex items-center gap-1 group-hover:underline">
                          {vi ? 'Xem lịch trình' : 'View Details'} <ExternalLink size={9} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
