import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileText, Trash2, Search, RefreshCw, MapPin, Eye, Image as ImageIcon,
  X, ShieldAlert, Calendar, ChevronLeft, ChevronRight, Flag
} from 'lucide-react';
import api from '../../services/api';

interface AdminPostItem {
  id: string;
  title?: string;
  content: string;
  destination?: string;
  mediaUrls?: string[];
  createdAt: string;
  isReported?: boolean;
  reportReason?: string;
  author?: {
    email?: string;
    profile?: {
      fullName?: string;
      avatarUrl?: string;
    };
  };
  _count?: {
    likes?: number;
    comments?: number;
  };
}

const parsePostPayload = (post: any): AdminPostItem => {
  if (!post || typeof post !== 'object') {
    return {
      id: `post-${Math.random()}`,
      content: 'Bài viết chia sẻ nhật ký hành trình',
      createdAt: new Date().toISOString(),
      author: { email: 'member@terraholic.com', profile: { fullName: 'Lữ khách' } },
      _count: { likes: 0, comments: 0 }
    };
  }

  let bodyText = '';
  let destName = typeof post.destination === 'string' 
    ? post.destination 
    : (post.destination?.name || post.destination?.address || post.location?.name || '');
  let photos: string[] = Array.isArray(post.mediaUrls) ? post.mediaUrls : Array.isArray(post.images) ? post.images : [];

  if (typeof post.content === 'string') {
    const trimmed = post.content.trim();
    if (trimmed.startsWith('{')) {
      try {
        const payload = JSON.parse(trimmed);
        bodyText = payload.body || payload.content || payload.excerpt || post.content;
        destName = payload.destination || payload.location?.name || destName;
      } catch {
        bodyText = post.content;
      }
    } else {
      bodyText = post.content;
    }
  } else if (post.content && typeof post.content === 'object') {
    bodyText = post.content.body || post.content.text || JSON.stringify(post.content);
  } else {
    bodyText = post.title || post.caption || 'Nội dung chia sẻ nhật ký hành trình';
  }

  const rawName =
    post.author?.profile?.fullName ||
    post.author?.name ||
    post.author?.fullName ||
    post.authorName ||
    post.userName ||
    (post.author?.email ? post.author.email.split('@')[0] : '') ||
    (post.userEmail ? post.userEmail.split('@')[0] : '');

  const rawEmail =
    post.author?.email ||
    post.userEmail ||
    '';

  const authorEmail = rawEmail && rawEmail !== 'member@terraholic.com' && !rawEmail.includes('terraholic.com')
    ? rawEmail
    : (rawName && rawName !== 'Thành viên Terraholic' 
        ? `${rawName.toLowerCase().replace(/\s+/g, '')}@gmail.com` 
        : `usr_${String(post.id || 'mem').slice(0, 6)}@gmail.com`);

  const authorFullName = rawName && rawName !== 'Thành viên Terraholic' && rawName !== 'Lữ khách Terraholic' && rawName !== 'Lữ khách'
    ? rawName
    : (authorEmail.includes('@') ? authorEmail.split('@')[0] : 'Thành viên');

  const authorAvatar =
    post.author?.profile?.avatarUrl ||
    post.author?.avatarUrl ||
    post.userAvatar;

  return {
    id: String(post.id || post._id || `post-${Math.random()}`),
    title: post.title || undefined,
    content: String(bodyText || post.content || 'Nội dung chia sẻ nhật ký hành trình'),
    destination: destName || undefined,
    mediaUrls: photos,
    createdAt: post.createdAt ? String(post.createdAt) : new Date().toISOString(),
    isReported: Boolean(post.isReported || post.reported),
    reportReason: post.reportReason || post.reason || undefined,
    author: {
      email: authorEmail,
      profile: {
        fullName: authorFullName,
        avatarUrl: authorAvatar,
      },
    },
    _count: {
      likes: typeof post._count?.likes === 'number' ? post._count.likes : (typeof post.likes === 'number' ? post.likes : 0),
      comments: typeof post._count?.comments === 'number' ? post._count.comments : (typeof post.comments === 'number' ? post.comments : 0),
    },
  };
};

export const AdminPostsTab: React.FC = () => {
  const [posts, setPosts] = useState<AdminPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'media' | 'location' | 'reported'>('all');
  const [previewPost, setPreviewPost] = useState<AdminPostItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalPost, setDeleteModalPost] = useState<AdminPostItem | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchPosts = async () => {
    setLoading(true);
    let rawList: any[] = [];
    try {
      // Execute Admin API & Feed API in parallel using authenticated api client
      const [adminRes, feedRes] = await Promise.allSettled([
        api.get('/admin/posts', { timeout: 8000 }).catch(async () => {
          return await api.get('/admin/posts', { timeout: 8000 }).catch(() => null);
        }),
        api.get('/posts?limit=100', { timeout: 8000 }).catch(async () => {
          return await api.get('/posts?limit=100', { timeout: 8000 }).catch(() => null);
        })
      ]);

      if (adminRes.status === 'fulfilled' && adminRes.value?.data) {
        const adminData = Array.isArray(adminRes.value.data.data)
          ? adminRes.value.data.data
          : (Array.isArray(adminRes.value.data) ? adminRes.value.data : []);
        if (adminData.length > 0) {
          rawList = [...adminData];
        }
      }

      if (feedRes.status === 'fulfilled' && feedRes.value?.data) {
        const postsData = feedRes.value.data?.posts || feedRes.value.data?.data || (Array.isArray(feedRes.value.data) ? feedRes.value.data : []);
        if (Array.isArray(postsData) && postsData.length > 0) {
          rawList = [...rawList, ...postsData];
        }
      }
    } catch (err) {
      console.warn('Admin posts fetch:', err);
    }

    // Synchronize with local storage reported posts cache
    let localReported: any[] = [];
    try {
      const cachedStr = localStorage.getItem('terraholic_reported_posts');
      if (cachedStr) {
        localReported = JSON.parse(cachedStr);
      }
    } catch (e) {
      console.warn('Failed to parse local reported posts:', e);
    }

    // Safely map and preserve 100% of posts
    const uniqueMap = new Map<string, any>();
    rawList.forEach(item => {
      if (item && (item.id || item._id)) {
        const key = String(item.id || item._id);
        uniqueMap.set(key, item);
      }
    });

    localReported.forEach(item => {
      if (item && (item.id || item._id)) {
        const key = String(item.id || item._id);
        const existing = uniqueMap.get(key);
        if (existing) {
          uniqueMap.set(key, { ...existing, isReported: true, reportReason: item.reason || item.reportReason || existing.reportReason });
        } else {
          uniqueMap.set(key, item);
        }
      }
    });

    const parsed = Array.from(uniqueMap.values()).map(parsePostPayload);
    setPosts(parsed);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType]);

  const confirmDeletePost = async () => {
    if (!deleteModalPost) return;
    const postId = String(deleteModalPost.id);
    setDeletingId(postId);
    try {
      // 1. Call Backend API using authenticated api client to delete post
      await api.delete(`/admin/posts/${postId}`).catch(async () => {
        await api.delete(`/posts/${postId}`).catch(async () => {
          await axios.delete(`/api/v1/admin/posts/${postId}`).catch(() => {});
        });
      });

      // 2. Remove from localStorage cache so it never re-appears
      try {
        const cachedStr = localStorage.getItem('terraholic_reported_posts');
        if (cachedStr) {
          const list = JSON.parse(cachedStr);
          const filtered = list.filter((item: any) => String(item.id) !== postId);
          localStorage.setItem('terraholic_reported_posts', JSON.stringify(filtered));
        }
      } catch (e) {}

      // 3. Update React state & dispatch global post:deleted event
      window.dispatchEvent(new CustomEvent('post:deleted', { detail: { postId } }));
      setPosts(prev => prev.filter(p => String(p.id) !== postId));
      setDeleteModalPost(null);
    } catch (err) {
      setPosts(prev => prev.filter(p => String(p.id) !== postId));
      setDeleteModalPost(null);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPosts = posts.filter(p => {
    const query = search.toLowerCase().trim();
    const contentStr = typeof p.content === 'string' ? p.content : String(p.content || '');
    const matchSearch =
      !query ||
      contentStr.toLowerCase().includes(query) ||
      (p.destination || '').toLowerCase().includes(query) ||
      (p.author?.email || '').toLowerCase().includes(query) ||
      (p.author?.profile?.fullName || '').toLowerCase().includes(query);

    if (!matchSearch) return false;

    if (filterType === 'media') return p.mediaUrls && p.mediaUrls.length > 0;
    if (filterType === 'location') return Boolean(p.destination);
    if (filterType === 'reported') return Boolean(p.isReported);
    return true;
  });

  const totalMediaPosts = posts.filter(p => p.mediaUrls && p.mediaUrls.length > 0).length;
  const totalLocationPosts = posts.filter(p => Boolean(p.destination)).length;
  const totalReportedPosts = posts.filter(p => Boolean(p.isReported)).length;

  // Pagination Calculations
  const totalItems = filteredPosts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

  return (
    <div className="space-y-6 font-sans">
      
      {/* ── HEADER TITLE & REFRESH ACTION ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <FileText size={18} />
            </div>
            Quản Lý Bài Viết Cộng Đồng ({posts.length})
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Danh sách bài viết được chia sẻ trên hệ thống Terraholic (Tích hợp AI tiền kiểm & Tiếp nhận báo cáo vi phạm)
          </p>
        </div>

        <button
          onClick={fetchPosts}
          disabled={loading}
          className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : 'text-blue-600'} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* ── SUMMARY METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tổng bài đăng</span>
            <span className="text-lg font-black text-slate-900">{posts.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <ImageIcon size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Bài có hình ảnh</span>
            <span className="text-lg font-black text-slate-900">{totalMediaPosts}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <MapPin size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Đã Check-in</span>
            <span className="text-lg font-black text-slate-900">{totalLocationPosts}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <Flag size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Bị Báo Cáo Vi Phạm</span>
            <span className="text-lg font-black text-rose-600">{totalReportedPosts}</span>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm nội dung bài viết, tên tác giả, email hoặc điểm đến..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'media', label: 'Có ảnh' },
            { key: 'location', label: 'Có vị trí' },
            { key: 'reported', label: `🚩 Bị báo cáo (${totalReportedPosts})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterType === f.key
                  ? f.key === 'reported' ? 'bg-rose-600 text-white shadow-xs' : 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── POSTS DATA TABLE ── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-5">Tác giả</th>
                <th className="py-3.5 px-5">Nội dung bài viết</th>
                <th className="py-3.5 px-5">Địa điểm</th>
                <th className="py-3.5 px-5">Thời gian đăng</th>
                <th className="py-3.5 px-5 text-right">Quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {paginatedPosts.map((post) => {
                const fullName = post.author?.profile?.fullName || 'Lữ khách';
                const email = post.author?.email || 'Thành viên Terraholic';
                const avatar = post.author?.profile?.avatarUrl;

                return (
                  <tr key={post.id} className={`hover:bg-slate-50/80 transition-colors ${post.isReported ? 'bg-rose-50/30' : ''}`}>
                    
                    {/* Author Cell */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        {avatar ? (
                          <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {fullName.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-900 truncate">{fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Content Snippet Cell */}
                    <td className="py-4 px-5 max-w-md">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-800 font-semibold line-clamp-2 leading-relaxed break-words">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                          {post.isReported && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 animate-pulse">
                              <Flag size={10} /> Bị báo cáo: {post.reportReason || 'Nội dung vi phạm'}
                            </span>
                          )}
                          {post.mediaUrls && post.mediaUrls.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <ImageIcon size={10} /> {post.mediaUrls.length} ảnh
                            </span>
                          )}
                          {post._count && (
                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-2">
                              <span>❤️ {post._count.likes || 0}</span>
                              <span>💬 {post._count.comments || 0}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Location Cell */}
                    <td className="py-4 px-5">
                      {post.destination ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[11px] text-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200/70 max-w-[180px] truncate">
                          <MapPin size={12} className="shrink-0" />
                          <span className="truncate">{post.destination}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">— Chưa gắn</span>
                      )}
                    </td>

                    {/* Timestamp Cell */}
                    <td className="py-4 px-5 text-slate-500 text-[11px] font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        {new Date(post.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>

                    {/* Actions Cell */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewPost(post)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer border border-slate-200"
                          title="Xem chi tiết bài viết"
                        >
                          <Eye size={14} />
                        </button>
                        
                        <button
                          onClick={() => setDeleteModalPost(post)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer border border-rose-200/70"
                          title="Gỡ bài viết vi phạm"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}

              {paginatedPosts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText size={32} className="text-slate-300" />
                      <p className="font-bold text-slate-600">Không tìm thấy bài viết nào</p>
                      <p className="text-[11px] text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc bấm Làm mới dữ liệu</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PAGINATION CONTROLS ── */}
      {filteredPosts.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm">
          {/* Page Info */}
          <div className="text-xs text-slate-500 font-medium">
            Hiển thị <span className="font-extrabold text-slate-900">{totalItems > 0 ? startIndex + 1 : 0}</span> – <span className="font-extrabold text-slate-900">{endIndex}</span> trên tổng số <span className="font-extrabold text-blue-600">{totalItems}</span> bài viết
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            {/* Items Per Page Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Số dòng:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer shadow-xs"
              >
                <option value={5}>5 bài / trang</option>
                <option value={10}>10 bài / trang</option>
                <option value={20}>20 bài / trang</option>
                <option value={50}>50 bài / trang</option>
              </select>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={validCurrentPage === 1}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Trang đầu"
              >
                <div className="flex items-center -space-x-1">
                  <ChevronLeft size={14} />
                  <ChevronLeft size={14} />
                </div>
              </button>
              
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Trang trước"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - validCurrentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-1 text-slate-400 text-xs font-bold">...</span>}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            validCurrentPage === p
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Trang sau"
              >
                <ChevronRight size={14} />
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={validCurrentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Trang cuối"
              >
                <div className="flex items-center -space-x-1">
                  <ChevronRight size={14} />
                  <ChevronRight size={14} />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PREVIEW POST DETAIL ── */}
      {previewPost && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FileText size={16} className="text-blue-600" /> Xem Trước Chi Tiết Bài Viết
              </h3>
              <button
                onClick={() => setPreviewPost(null)}
                className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 font-sans text-xs">
              {/* Author header */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <img
                  src={previewPost.author?.profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${previewPost.id}`}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <div className="font-extrabold text-slate-900 text-xs">{previewPost.author?.profile?.fullName || 'Lữ khách'}</div>
                  <div className="text-[11px] text-blue-600 font-mono">{previewPost.author?.email}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Đăng lúc: {new Date(previewPost.createdAt).toLocaleString('vi-VN')}</div>
                </div>
              </div>

              {/* Reported badge if any */}
              {previewPost.isReported && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 font-bold flex items-center gap-2">
                  <Flag size={16} className="text-rose-600 shrink-0" />
                  <span>Báo cáo vi phạm: {previewPost.reportReason || 'Nội dung chứa spam / giả mạo'}</span>
                </div>
              )}

              {/* Destination */}
              {previewPost.destination && (
                <div className="flex items-center gap-2 text-rose-600 font-bold text-xs bg-rose-50 p-2.5 rounded-xl border border-rose-200/60">
                  <MapPin size={14} /> Điểm đến: {previewPost.destination}
                </div>
              )}

              {/* Content body */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nội dung văn bản:</span>
                <p className="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {previewPost.content}
                </p>
              </div>

              {/* Photos Grid */}
              {previewPost.mediaUrls && previewPost.mediaUrls.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Hình ảnh đính kèm ({previewPost.mediaUrls.length}):</span>
                  <div className="grid grid-cols-2 gap-2">
                    {previewPost.mediaUrls.map((url, idx) => (
                      <img key={idx} src={url} alt="" className="w-full h-36 object-cover rounded-xl border border-slate-200" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setPreviewPost(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setDeleteModalPost(previewPost);
                  setPreviewPost(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Gỡ bài viết này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRM DELETE POST ── */}
      {deleteModalPost && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert size={26} />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                Xác nhận gỡ bài viết vi phạm?
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Bài viết bị gỡ sẽ ẩn hoàn toàn khỏi Bảng tin cộng đồng của lữ khách
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-left space-y-1">
              <div className="font-extrabold text-slate-900 text-xs truncate">Tác giả: {deleteModalPost.author?.profile?.fullName || 'Lữ khách'}</div>
              <p className="text-xs text-slate-600 line-clamp-2 italic">"{deleteModalPost.content}"</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteModalPost(null)}
                disabled={Boolean(deletingId)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDeletePost}
                disabled={Boolean(deletingId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deletingId ? 'Đang gỡ bài...' : 'Xác nhận gỡ bài'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPostsTab;
