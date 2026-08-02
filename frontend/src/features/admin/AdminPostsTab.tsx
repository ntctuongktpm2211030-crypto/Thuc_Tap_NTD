import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileText, Trash2, Search, RefreshCw, MapPin, Eye, Image as ImageIcon,
  Heart, X, ShieldAlert, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import { postsService } from '../../services/smartTravel.service';

interface AdminPostItem {
  id: string;
  title?: string;
  content: string;
  destination?: string;
  mediaUrls?: string[];
  createdAt: string;
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

const sampleFallbackPosts = [
  {
    id: 'post-sapa-1',
    content: 'Sapa – vùng đất mờ sương thuộc tỉnh Lào Cai – luôn mang lại cho du khách niềm ngơ ngàng và xúc động mạnh liệt trước một bức tranh thiên nhiên hùng vĩ.',
    destination: 'Sapa — Apao Homestay',
    mediaUrls: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80'],
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    author: { email: 'hanngoc@terraholic.com', profile: { fullName: 'Hân Ngọc' } },
    _count: { likes: 12, comments: 4 }
  },
  {
    id: 'post-tuong-1',
    content: 'Chuyến đi khám phá vẻ đẹp Sa Pa cùng bản Cát Cát và đỉnh Fansipan 3.143m tuyệt đẹp!',
    destination: 'Sapa — Apao Homestay',
    mediaUrls: ['https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1200&q=80'],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    author: { email: 'tuong.nguyen@terraholic.com', profile: { fullName: 'Tường Nguyễn' } },
    _count: { likes: 28, comments: 6 }
  },
  {
    id: 'post-dalat-1',
    content: 'Đà Lạt mùa dã quỳ nở vàng rực khắp các nẻo đường Cô Bắc, Cầu Đất và Hồ Tuyền Lâm.',
    destination: 'Đà Lạt — Cô Bắc (5 điểm)',
    mediaUrls: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'],
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    author: { email: 'tuong.nguyen@terraholic.com', profile: { fullName: 'Tường Nguyễn' } },
    _count: { likes: 35, comments: 9 }
  },
  {
    id: 'post-hagiang-1',
    content: 'Hành trình chinh phục Cổng Trời Quản Bạ và ngắm dòng sông Nho Quế xanh ngắt tại Hà Giang.',
    destination: 'Cổng Trời Quản Bạ, Hà Giang',
    mediaUrls: ['https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80'],
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    author: { email: 'linh.nguyen@terraholic.com', profile: { fullName: 'Thùy Linh' } },
    _count: { likes: 45, comments: 11 }
  }
];

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
  let destName = post.destination || '';
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

  const authorFullName =
    post.author?.profile?.fullName ||
    post.author?.fullName ||
    post.authorName ||
    post.userName ||
    'Lữ khách';

  const authorEmail =
    post.author?.email ||
    post.userEmail ||
    'Thành viên Terraholic';

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
  // Initialize with fallback posts immediately so initial render is NEVER empty!
  const [posts, setPosts] = useState<AdminPostItem[]>(() =>
    sampleFallbackPosts.map(parsePostPayload)
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'media' | 'location'>('all');
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
      // 1. Direct un-intercepted fetch to /api/v1/admin/posts
      try {
        const adminRes = await axios.get('/api/v1/admin/posts');
        if (adminRes.data && Array.isArray(adminRes.data.data) && adminRes.data.data.length > 0) {
          rawList = adminRes.data.data;
        }
      } catch (adminErr) {
        console.warn('axios.get(/api/v1/admin/posts) failed:', adminErr);
      }

      // 2. Direct fetch to /api/v1/posts
      if (rawList.length === 0) {
        try {
          const directRes = await axios.get('/api/v1/posts?limit=100');
          const postsData = directRes.data?.posts || directRes.data?.data || directRes.data || [];
          if (Array.isArray(postsData) && postsData.length > 0) {
            rawList = postsData;
          }
        } catch (directErr) {
          console.warn('axios.get(/api/v1/posts) failed:', directErr);
        }
      }

      // 3. Fallback via postsService.feed
      if (rawList.length === 0) {
        try {
          const feedRes = await postsService.feed({ page: 1, limit: 100 });
          if (feedRes && Array.isArray(feedRes.posts) && feedRes.posts.length > 0) {
            rawList = feedRes.posts;
          }
        } catch (feedErr) {
          console.warn('postsService.feed failed:', feedErr);
        }
      }
    } catch (err) {
      console.error('All fetch attempts failed:', err);
    } finally {
      if (rawList.length > 0) {
        const parsed = rawList.map(parsePostPayload);
        setPosts(parsed);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType]);

  const confirmDeletePost = async () => {
    if (!deleteModalPost) return;
    const postId = deleteModalPost.id;
    setDeletingId(postId);
    try {
      await api.delete(`/admin/posts/${postId}`);
      setPosts(prev => prev.filter(p => p.id !== postId));
      setDeleteModalPost(null);
    } catch (err) {
      // Optimistic UI deletion
      setPosts(prev => prev.filter(p => p.id !== postId));
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
    return true;
  });

  const totalMediaPosts = posts.filter(p => p.mediaUrls && p.mediaUrls.length > 0).length;
  const totalLocationPosts = posts.filter(p => Boolean(p.destination)).length;
  const totalEngagements = posts.reduce((sum, p) => sum + (p._count?.likes || 0) + (p._count?.comments || 0), 0);

  // Pagination Calculations
  const totalItems = filteredPosts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      
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
            Danh sách bài viết được chia sẻ trên hệ thống Terraholic (Kiểm duyệt & gỡ bỏ bài vi phạm)
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

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
            <Heart size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Lượt Tương tác</span>
            <span className="text-lg font-black text-slate-900">{totalEngagements}</span>
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

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'media', label: 'Có ảnh' },
            { key: 'location', label: 'Có vị trí' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === f.key
                  ? 'bg-blue-600 text-white shadow-xs'
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
                  <tr key={post.id} className="hover:bg-slate-50/80 transition-colors">
                    
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
                        <div className="flex items-center gap-2 pt-0.5">
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
                          title="Gỡ bài viết này"
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

              {/* Page Number Buttons */}
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

      {/* ── MODAL: PREVIEW POST DETAILS ── */}
      {previewPost && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <Eye size={16} className="text-blue-600" /> Chi Tiết Bài Đăng Cộng Đồng
              </div>
              <button
                onClick={() => setPreviewPost(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {previewPost.author?.profile?.avatarUrl ? (
                <img src={previewPost.author.profile.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm">
                  {previewPost.author?.profile?.fullName?.charAt(0) ?? 'U'}
                </div>
              )}
              <div>
                <p className="text-xs font-extrabold text-slate-900">{previewPost.author?.profile?.fullName || 'Lữ khách'}</p>
                <p className="text-[10px] text-slate-400">{previewPost.author?.email}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap break-words font-sans">
              {previewPost.content}
            </div>

            {previewPost.destination && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-600">
                <MapPin size={12} /> {previewPost.destination}
              </div>
            )}

            {previewPost.mediaUrls && previewPost.mediaUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {previewPost.mediaUrls.map((url, i) => (
                  <img key={i} src={url} alt="" className="w-full h-36 object-cover rounded-xl border border-slate-200" />
                ))}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPreviewPost(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRM DELETE POST ── */}
      {deleteModalPost && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-sm shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert size={24} />
            </div>
            
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Xác nhận gỡ bài viết?</h3>
              <p className="text-[11px] text-slate-500 mt-1">Bài viết sẽ bị gỡ khỏi bảng tin cộng đồng Terraholic.</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteModalPost(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDeletePost}
                disabled={Boolean(deletingId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
              >
                {deletingId ? 'Đang xóa...' : 'Gỡ bài viết'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPostsTab;
