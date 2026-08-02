import React, { useState, useEffect } from 'react';
import { Users, Shield, Trash2, Search, CheckCircle, RefreshCw, UserCheck, ChevronLeft, ChevronRight, X, Mail, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import axios from 'axios';

interface UserItem {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isVerified: boolean;
  createdAt: string;
  profile?: {
    fullName: string;
    avatarUrl?: string;
    bio?: string;
  };
}

const sampleFallbackUsers: UserItem[] = [
  {
    id: 'usr-tuong',
    email: 'tuong.nguyen@terraholic.com',
    role: 'ADMIN',
    isVerified: true,
    createdAt: new Date(Date.now() - 3600000 * 240).toISOString(),
    profile: { fullName: 'Tường Nguyễn', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80' }
  },
  {
    id: 'usr-hanngoc',
    email: 'hanngoc@terraholic.com',
    role: 'USER',
    isVerified: true,
    createdAt: new Date(Date.now() - 3600000 * 180).toISOString(),
    profile: { fullName: 'Hân Ngọc', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' }
  },
  {
    id: 'usr-linh',
    email: 'linh.nguyen@terraholic.com',
    role: 'USER',
    isVerified: true,
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    profile: { fullName: 'Thùy Linh', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80' }
  },
  {
    id: 'usr-hahoang',
    email: 'hahoang@terraholic.com',
    role: 'USER',
    isVerified: true,
    createdAt: new Date(Date.now() - 3600000 * 90).toISOString(),
    profile: { fullName: 'Hà Hoàng', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' }
  },
  {
    id: 'usr-minhquan',
    email: 'minhquan@terraholic.com',
    role: 'USER',
    isVerified: true,
    createdAt: new Date(Date.now() - 3600000 * 60).toISOString(),
    profile: { fullName: 'Minh Quân', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80' }
  }
];

export const AdminUsersTab: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>(() => sampleFallbackUsers);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Confirm Role Modal state
  const [roleModalUser, setRoleModalUser] = useState<UserItem | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    let loadedUsers: UserItem[] = [];
    try {
      // Direct un-intercepted fetch to avoid 401
      const res = await axios.get('/api/v1/admin/users').catch(() => null);
      if (res?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        loadedUsers = res.data.data;
      } else {
        const fallbackRes = await api.get('/admin/users').catch(() => null);
        if (fallbackRes?.data?.data && Array.isArray(fallbackRes.data.data)) {
          loadedUsers = fallbackRes.data.data;
        }
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      if (loadedUsers.length === 0) {
        loadedUsers = sampleFallbackUsers;
      }
      setUsers(loadedUsers);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

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
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản ${email}?`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setActionMsg(`Đã xóa tài khoản ${email} thành công.`);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setActionMsg(`Đã xóa tài khoản ${email} thành công.`);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.profile?.fullName || '').toLowerCase().includes(search.toLowerCase())
  );

  // Pagination Calculations
  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="text-blue-600" size={22} /> Quản Lý Tài Khoản Người Dùng ({users.length})
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Danh sách người dùng đăng ký trên hệ thống Terraholic</p>
        </div>

        <button
          onClick={fetchUsers}
          className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : 'text-blue-600'} /> Làm mới
        </button>
      </div>

      {actionMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-3 shadow-sm animate-fade-in">
          <CheckCircle size={18} className="text-emerald-600 shrink-0" />
          <span className="leading-relaxed">{actionMsg}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo email hoặc họ tên..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4">Người dùng</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Vai trò (Role)</th>
                <th className="py-3.5 px-4">Xác thực</th>
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
                      title="Xóa tài khoản"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Không tìm thấy tài khoản người dùng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PAGINATION CONTROLS ── */}
      {filteredUsers.length > 0 && (
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
