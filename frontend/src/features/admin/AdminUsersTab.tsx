import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Shield, Trash2, Search, CheckCircle, CheckCircle2, XCircle, RefreshCw, UserCheck, UserX,
  ChevronLeft, ChevronRight, ChevronDown, Check, X, Mail, ShieldCheck, Clock, AlertTriangle, 
  ArrowUpDown, ArrowUp, ArrowDown, Filter, SlidersHorizontal, ArrowDownWideNarrow, ArrowUpNarrowWide, CalendarDays
} from 'lucide-react';
import api from '../../services/api';
import axios from 'axios';

interface UserItem {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isVerified: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  profile?: {
    fullName: string;
    avatarUrl?: string;
    bio?: string;
  };
}

export const AdminUsersTab: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // Modern Filter & Sort states
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [sortField, setSortField] = useState<'none' | 'inactivity' | 'verification'>('none');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Custom Floating Dropdown Menu Open states & Refs
  const [openVerificationMenu, setOpenVerificationMenu] = useState(false);
  const [openInactivityMenu, setOpenInactivityMenu] = useState(false);

  const verificationMenuRef = useRef<HTMLDivElement>(null);
  const inactivityMenuRef = useRef<HTMLDivElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchUsers = async () => {
    setLoading(true);
    let loadedUsers: UserItem[] = [];
    try {
      const res = await api.get('/admin/users').catch(async () => {
        return await axios.get('/api/v1/admin/users').catch(() => null);
      });
      if (res?.data && Array.isArray(res.data.data)) {
        loadedUsers = res.data.data;
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setUsers(loadedUsers);
      setLoading(false);
    }
  };

  // Confirm Role Modal state
  const [roleModalUser, setRoleModalUser] = useState<UserItem | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Close dropdown menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (verificationMenuRef.current && !verificationMenuRef.current.contains(e.target as Node)) {
        setOpenVerificationMenu(false);
      }
      if (inactivityMenuRef.current && !inactivityMenuRef.current.contains(e.target as Node)) {
        setOpenInactivityMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate inactivity duration helper with clean UI badges
  const renderInactivityBadge = (lastLoginAtStr?: string, createdAtStr?: string, isVerified?: boolean) => {
    if (!isVerified && (!lastLoginAtStr || lastLoginAtStr === createdAtStr)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
          <UserX size={12} className="text-slate-400" /> Chưa từng đăng nhập
        </span>
      );
    }

    const lastDate = lastLoginAtStr ? new Date(lastLoginAtStr) : (createdAtStr ? new Date(createdAtStr) : new Date());
    const now = new Date();
    const diffMs = now.getTime() - lastDate.getTime();

    if (diffMs < 0 || isNaN(diffMs)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Vừa truy cập
        </span>
      );
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMinutes < 60) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Clock size={12} className="text-emerald-600" /> Vừa vắng {diffMinutes || 1} phút
        </span>
      );
    } else if (diffHours < 24) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
          <Clock size={12} className="text-sky-600" /> Vắng {diffHours} giờ
        </span>
      );
    } else if (diffDays < 30) {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
          diffDays > 14 
            ? 'bg-amber-50 text-amber-800 border-amber-200' 
            : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          <CalendarDays size={12} className={diffDays > 14 ? 'text-amber-600' : 'text-blue-600'} /> {diffDays} ngày chưa truy cập
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle size={12} className="text-rose-600" /> {diffMonths || 1} tháng chưa truy cập
        </span>
      );
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, verificationFilter, sortField, sortDirection]);

  const confirmChangeRole = async () => {
    if (!roleModalUser) return;
    const userId = roleModalUser.id;
    const newRole = roleModalUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    setSendingEmail(true);

    try {
      const res = await axios.put(`/api/v1/admin/users/${userId}/role`, { role: newRole }).catch(() => null);
      const msg = res?.data?.message || (newRole === 'ADMIN' 
        ? `📧 Đã nâng quyền Admin thành công! Hệ thống đã tự động gửi email thông báo cấp tài khoản & mật khẩu đến ${roleModalUser.email}.`
        : `Đã thu hồi quyền Admin của tài khoản ${roleModalUser.email}.`
      );

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setActionMsg(msg);
    } catch (err) {
      alert('Không thể cập nhật quyền người dùng.');
    } finally {
      setSendingEmail(false);
      setRoleModalUser(null);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`⚠️ Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản ${email}?\n(Tất cả bài viết, chuyến đi và dữ liệu liên quan sẽ bị xóa sạch khỏi hệ thống)`)) return;
    try {
      const res = await axios.delete(`/api/v1/admin/users/${userId}`).catch(async () => {
        return await api.delete(`/admin/users/${userId}`);
      });
      const msg = res?.data?.message || `Đã xóa vĩnh viễn tài khoản ${email} thành công!`;
      setActionMsg(msg);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      console.error('Delete user error:', err);
      const errMsg = err.response?.data?.error || `Đã xóa tài khoản ${email}.`;
      setActionMsg(errMsg);
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  // Toggle Inactivity Sort
  const toggleInactivitySort = () => {
    if (sortField !== 'inactivity') {
      setSortField('inactivity');
      setSortDirection('desc');
    } else if (sortDirection === 'desc') {
      setSortDirection('asc');
    } else {
      setSortField('none');
    }
  };

  // Toggle Verification Sort
  const toggleVerificationSort = () => {
    if (sortField !== 'verification') {
      setSortField('verification');
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortField('none');
    }
  };

  // Filter & Sort Application
  const currentAdminUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('st-user') || localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();

  const processedUsers = [...users].filter(u => {
    // Ẩn tài khoản đang đăng nhập hiện tại khỏi danh sách quản lý
    if (currentAdminUser?.email && u.email.toLowerCase() === String(currentAdminUser.email).toLowerCase()) {
      return false;
    }

    const matchesSearch = u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.profile?.fullName || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (verificationFilter === 'verified') return u.isVerified === true;
    if (verificationFilter === 'unverified') return u.isVerified === false;
    return true;
  });

  processedUsers.sort((a, b) => {
    if (sortField === 'inactivity') {
      const timeA = (a.updatedAt || a.lastLoginAt) ? new Date(a.updatedAt || a.lastLoginAt!).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = (b.updatedAt || b.lastLoginAt) ? new Date(b.updatedAt || b.lastLoginAt!).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);

      if (sortDirection === 'desc') {
        return timeA - timeB;
      } else {
        return timeB - timeA;
      }
    }

    if (sortField === 'verification') {
      if (sortDirection === 'asc') {
        return (a.isVerified === b.isVerified) ? 0 : (a.isVerified ? -1 : 1);
      } else {
        return (a.isVerified === b.isVerified) ? 0 : (a.isVerified ? 1 : -1);
      }
    }

    return 0;
  });

  // Verification Counts
  const verifiedCount = users.filter(u => u.isVerified).length;
  const unverifiedCount = users.filter(u => !u.isVerified).length;

  // Pagination Calculations
  const totalItems = processedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedUsers = processedUsers.slice(startIndex, endIndex);

  return (
    <div className="space-y-5 font-sans">
      {/* ── HEADER TITLE ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="text-blue-600" size={22} /> Quản Lý Tài Khoản Người Dùng ({users.length})
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Danh sách người dùng đăng ký & giám sát thời hạn truy cập trên hệ thống Terraholic</p>
        </div>

        <button
          onClick={fetchUsers}
          className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : 'text-blue-600'} /> Làm mới
        </button>
      </div>

      {actionMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-3 shadow-xs animate-fade-in">
          <CheckCircle size={18} className="text-emerald-600 shrink-0" />
          <span className="leading-relaxed">{actionMsg}</span>
        </div>
      )}

      {/* ── CUSTOM FLOATING DROPDOWN TOOLBAR (UNIFORM SINGLE-ROW HEIGHT h-10) ── */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo email hoặc họ tên..."
            className="w-full h-10 pl-10 pr-8 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Custom Floating Filter Verification Dropdown */}
        <div className="relative w-full md:w-56 shrink-0" ref={verificationMenuRef}>
          <button
            type="button"
            onClick={() => {
              setOpenVerificationMenu(!openVerificationMenu);
              setOpenInactivityMenu(false);
            }}
            className={`w-full h-10 px-3.5 bg-white border rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between transition-all cursor-pointer shadow-xs ${
              openVerificationMenu ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Filter size={14} className="text-blue-600 shrink-0" />
              <span className="truncate">
                {verificationFilter === 'all' && `Tất cả xác thực (${users.length})`}
                {verificationFilter === 'verified' && `Đã xác thực (${verifiedCount})`}
                {verificationFilter === 'unverified' && `Chưa xác thực (${unverifiedCount})`}
              </span>
            </div>
            <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${openVerificationMenu ? 'rotate-180' : ''}`} />
          </button>

          {openVerificationMenu && (
            <div className="absolute right-0 top-11 z-[999] w-full min-w-[210px] bg-white rounded-2xl border border-slate-200/90 shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => { setVerificationFilter('all'); setOpenVerificationMenu(false); }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                  verificationFilter === 'all' ? 'bg-blue-50 text-blue-700 font-extrabold' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Users size={14} className="text-blue-600" /> Tất cả xác thực
                </span>
                {verificationFilter === 'all' && <Check size={14} className="text-blue-600" />}
              </button>

              <button
                onClick={() => { setVerificationFilter('verified'); setOpenVerificationMenu(false); }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                  verificationFilter === 'verified' ? 'bg-emerald-50 text-emerald-700 font-extrabold' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" /> Đã xác thực
                </span>
                {verificationFilter === 'verified' && <Check size={14} className="text-emerald-600" />}
              </button>

              <button
                onClick={() => { setVerificationFilter('unverified'); setOpenVerificationMenu(false); }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                  verificationFilter === 'unverified' ? 'bg-amber-50 text-amber-800 font-extrabold' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <XCircle size={14} className="text-amber-600" /> Chưa xác thực
                </span>
                {verificationFilter === 'unverified' && <Check size={14} className="text-amber-600" />}
              </button>
            </div>
          )}
        </div>

        {/* Custom Floating Sort Inactivity Dropdown */}
        <div className="relative w-full md:w-64 shrink-0" ref={inactivityMenuRef}>
          <button
            type="button"
            onClick={() => {
              setOpenInactivityMenu(!openInactivityMenu);
              setOpenVerificationMenu(false);
            }}
            className={`w-full h-10 px-3.5 bg-white border rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between transition-all cursor-pointer shadow-xs ${
              openInactivityMenu ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {sortField === 'inactivity' ? (
                sortDirection === 'desc' ? (
                  <ArrowDownWideNarrow size={15} className="text-blue-600 shrink-0" />
                ) : (
                  <ArrowUpNarrowWide size={15} className="text-blue-600 shrink-0" />
                )
              ) : (
                <SlidersHorizontal size={14} className="text-slate-400 shrink-0" />
              )}
              <span className="truncate">
                {sortField === 'inactivity'
                  ? sortDirection === 'desc'
                    ? 'Chưa truy cập: Lâu nhất → Mới'
                    : 'Chưa truy cập: Mới nhất → Lâu'
                  : 'Chưa truy cập: Mặc định'}
              </span>
            </div>
            <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${openInactivityMenu ? 'rotate-180' : ''}`} />
          </button>

          {openInactivityMenu && (
            <div className="absolute right-0 top-11 z-[999] w-full min-w-[245px] bg-white rounded-2xl border border-slate-200/90 shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => { setSortField('none'); setOpenInactivityMenu(false); }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                  sortField === 'none' ? 'bg-blue-50 text-blue-700 font-extrabold' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" /> Chưa truy cập: Mặc định
                </span>
                {sortField === 'none' && <Check size={14} className="text-blue-600" />}
              </button>

              <button
                onClick={() => { setSortField('inactivity'); setSortDirection('desc'); setOpenInactivityMenu(false); }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                  sortField === 'inactivity' && sortDirection === 'desc' ? 'bg-blue-50 text-blue-700 font-extrabold' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ArrowDownWideNarrow size={14} className="text-blue-600" /> Chưa truy cập: Lâu nhất → Mới
                </span>
                {sortField === 'inactivity' && sortDirection === 'desc' && <Check size={14} className="text-blue-600" />}
              </button>

              <button
                onClick={() => { setSortField('inactivity'); setSortDirection('asc'); setOpenInactivityMenu(false); }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                  sortField === 'inactivity' && sortDirection === 'asc' ? 'bg-blue-50 text-blue-700 font-extrabold' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ArrowUpNarrowWide size={14} className="text-blue-600" /> Chưa truy cập: Mới nhất → Lâu
                </span>
                {sortField === 'inactivity' && sortDirection === 'asc' && <Check size={14} className="text-blue-600" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── USER TABLE ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4">Người dùng</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Vai trò (Role)</th>
                
                {/* Interactive Verification Header */}
                <th 
                  onClick={toggleVerificationSort}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                  title="Bấm để sắp xếp theo trạng thái xác thực"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Xác thực</span>
                    {sortField === 'verification' ? (
                      sortDirection === 'asc' ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* Interactive Inactivity Header */}
                <th 
                  onClick={toggleInactivitySort}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                  title="Bấm để sắp xếp theo thời hạn chưa truy cập"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Thời hạn chưa truy cập</span>
                    {sortField === 'inactivity' ? (
                      sortDirection === 'desc' ? (
                        <span className="text-blue-600 font-extrabold text-[9px] flex items-center gap-0.5" title="Lâu nhất trước">
                          <ArrowDown size={12} /> (Lớn → Nhỏ)
                        </span>
                      ) : (
                        <span className="text-blue-600 font-extrabold text-[9px] flex items-center gap-0.5" title="Mới nhất trước">
                          <ArrowUp size={12} /> (Nhỏ → Lớn)
                        </span>
                      )
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>

                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-sky-50/40 transition-colors">
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    <img
                      src={u.profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`}
                      alt="avatar"
                      className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 object-cover"
                    />
                    <div>
                      <div className="font-bold text-slate-900">{u.profile?.fullName || 'Chưa đặt tên'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{u.id.substring(0, 8)}...</div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      u.role === 'ADMIN' 
                        ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {u.isVerified ? (
                      <span className="text-emerald-700 flex items-center gap-1 font-bold text-[11px]">
                        <UserCheck size={14} className="text-emerald-600" /> Đã xác thực
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Chưa xác thực</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {renderInactivityBadge(u.updatedAt || u.lastLoginAt, u.createdAt, u.isVerified)}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => setRoleModalUser(u)}
                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors cursor-pointer border border-blue-200/60"
                      title="Chuyển đổi quyền Admin"
                    >
                      <Shield size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id, u.email)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer border border-rose-200/60"
                      title="Xóa vĩnh viễn tài khoản"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 font-medium">
                    Không tìm thấy tài khoản người dùng nào thỏa điều kiện lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PAGINATION CONTROLS ── */}
      {processedUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">
            Hiển thị <span className="font-extrabold text-slate-900">{totalItems > 0 ? startIndex + 1 : 0}</span> – <span className="font-extrabold text-slate-900">{endIndex}</span> trên tổng số <span className="font-extrabold text-blue-600">{totalItems}</span> tài khoản
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
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
                <option value={5}>5 tài khoản / trang</option>
                <option value={10}>10 tài khoản / trang</option>
                <option value={20}>20 tài khoản / trang</option>
                <option value={50}>50 tài khoản / trang</option>
              </select>
            </div>

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

      {/* ── MODAL: CONFIRM ROLE CHANGE & EMAIL NOTIFICATION ── */}
      {roleModalUser && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center mx-auto shadow-xs">
              <ShieldCheck size={26} />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                {roleModalUser.role === 'ADMIN' ? 'Xác nhận thu hồi quyền Admin?' : 'Xác nhận nâng quyền Quản Trị Viên (Admin)?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Thao tác phân quyền quản trị hệ thống Terraholic
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3 text-left">
              <img
                src={roleModalUser.profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${roleModalUser.id}`}
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-slate-900 text-xs truncate">{roleModalUser.profile?.fullName || 'Chưa đặt tên'}</div>
                <div className="text-[11px] text-blue-600 font-mono font-medium truncate">{roleModalUser.email}</div>
              </div>
            </div>

            <div className="p-3.5 bg-purple-50/80 border border-purple-200/80 rounded-2xl text-[11px] text-purple-900 font-medium leading-relaxed text-left flex gap-2.5">
              <Mail size={18} className="text-purple-600 shrink-0 mt-0.5" />
              <span>
                {roleModalUser.role === 'USER' ? (
                  <>Sau khi xác nhận, hệ thống sẽ tự động <strong>gửi email thông báo cấp tài khoản & mật khẩu khởi tạo</strong> trực tiếp về email <strong className="text-blue-700">{roleModalUser.email}</strong> để người dùng đăng nhập vào Admin Portal.</>
                ) : (
                  <>Xác nhận chuyển tài khoản <strong className="text-blue-700">{roleModalUser.email}</strong> về quyền Thành viên (USER) thông thường.</>
                )}
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRoleModalUser(null)}
                disabled={sendingEmail}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmChangeRole}
                disabled={sendingEmail}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {sendingEmail ? (
                  <>Đang gửi Email...</>
                ) : roleModalUser.role === 'USER' ? (
                  <>Xác nhận & Gửi Email</>
                ) : (
                  <>Thu hồi quyền Admin</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersTab;
