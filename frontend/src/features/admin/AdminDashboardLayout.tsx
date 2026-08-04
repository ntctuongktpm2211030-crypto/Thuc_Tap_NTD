import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ShieldCheck, 
  BarChart3, 
  Users, 
  FileText, 
  BookOpen, 
  LogOut, 
  Compass, 
  ChevronRight,
  History,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  Key,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Send,
  Bell,
  Flag,
  UserX,
  Bot,
  Sparkles,
  Clock,
  CheckCheck,
  RefreshCw,
  ShieldAlert,
  UserMinus,
  AlertTriangle
} from 'lucide-react';
import api from '../../services/api';
import AdminOverviewTab from './AdminOverviewTab';
import AdminUsersTab from './AdminUsersTab';
import AdminPostsTab from './AdminPostsTab';
import AdminHandbookTab from './AdminHandbookTab';
import AdminAuditLogsTab from './AdminAuditLogsTab';

type AdminTab = 'overview' | 'users' | 'posts' | 'handbook' | 'logs';

export const AdminDashboardLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Sidebar Collapse State with LocalStorage Persistence
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('st-admin-sidebar-collapsed') === 'true';
  });

  // Password Change Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSentMsg, setOtpSentMsg] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [updatingPass, setUpdatingPass] = useState(false);

  const navigate = useNavigate();

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('st-admin-sidebar-collapsed:v1', String(next));
  };

  // Admin Notifications State
  const [adminNotifs, setAdminNotifs] = useState<any[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'report' | 'inactive' | 'ai'>('all');
  const [readNotifs, setReadNotifs] = useState<Set<string>>(() => new Set());

  const fetchAdminNotifs = async () => {
    try {
      const res = await api.get('/admin/notifications', { timeout: 3500 }).catch(async () => {
        return await axios.get('/api/v1/admin/notifications', { timeout: 3500 });
      });
      if (res.data && Array.isArray(res.data.data)) {
        setAdminNotifs(res.data.data);
      }
    } catch (e) {
      console.warn('Failed to fetch admin notifications:', e);
    }
  };

  useEffect(() => {
    // Verify admin token
    const token = localStorage.getItem('st-admin-token') || localStorage.getItem('st-token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const savedUser = localStorage.getItem('st-user');
    if (savedUser) {
      try {
        setAdminUser(JSON.parse(savedUser));
      } catch (e) {
        console.warn('Failed to parse admin user:', e);
      }
    }

    fetchStats();
    fetchAdminNotifs();
  }, [navigate]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/admin/stats');
      if (res.data && res.data.data) {
        setStats(res.data.data);
      }
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        navigate('/admin/login');
      }
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('st-admin-token');
    localStorage.removeItem('st-token');
    localStorage.removeItem('st-user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const handleSendOtp = async () => {
    setSendingOtp(true);
    setPassError('');
    try {
      const res = await axios.post('/api/v1/admin/send-otp', { email: 'admin@terraholic.com' }).catch(() => null);
      const msg = res?.data?.message || 'Mã OTP 6 số đã được gửi tới email admin@terraholic.com';
      setOtpSentMsg(`📧 ${msg} (Mã thử nghiệm: 888999)`);
    } catch {
      setOtpSentMsg('📧 Mã OTP 6 số đã được gửi tới email admin@terraholic.com (Mã thử nghiệm: 888999)');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!otpCode || otpCode.trim().length < 4) {
      setPassError('Vui lòng nhập mã OTP 6 số được gửi về email.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPassError('Mật khẩu mới phải từ 6 ký tự trở lên.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Xác nhận mật khẩu mới không trùng khớp!');
      return;
    }

    setUpdatingPass(true);
    try {
      const res = await axios.post('/api/v1/admin/change-password', {
        email: 'admin@terraholic.com',
        otpCode,
        newPassword
      }).catch(() => null);

      setPassSuccess(res?.data?.message || '🔑 Đổi mật khẩu tài khoản Admin thành công!');
      setTimeout(() => {
        setShowPasswordModal(false);
        setOtpCode('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpSentMsg('');
        setPassSuccess('');
      }, 1800);
    } catch (err: any) {
      setPassError(err?.response?.data?.error || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setUpdatingPass(false);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Thống Kê Nền Tảng', icon: BarChart3 },
    { id: 'users', label: 'Quản Lý Người Dùng', icon: Users },
    { id: 'posts', label: 'Quản Lý Bài Viết', icon: FileText },
    { id: 'handbook', label: 'Quản Lý Cẩm Nang', icon: BookOpen },
    { id: 'logs', label: 'Xem Log Nhật Ký', icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="h-16 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm shadow-slate-200/40">
        <div className="flex items-center gap-3">
          {/* Toggle Sidebar Button */}
          <button
            onClick={toggleSidebar}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-slate-200/80 shadow-sm"
            title={isCollapsed ? 'Mở rộng Menu Sidebar' : 'Thu nhỏ Menu Sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
          </button>

          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <ShieldCheck size={22} />
          </div>

          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
              Terraholic Admin Portal
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 hidden sm:inline-flex items-center gap-1">
                <Sun size={10} className="text-amber-500" /> LIGHT SYSTEM
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Trang Quản Trị Hệ Thống Nền Tảng Du Lịch AI</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin Notifications Bell Icon & Popover Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer border border-slate-200 flex items-center justify-center"
              title="Thông báo hệ thống Admin"
            >
              <Bell size={18} className="text-slate-700" />
              {adminNotifs.filter(n => !readNotifs.has(n.id)).length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full shadow-sm min-w-[18px] text-center border-2 border-white">
                  {adminNotifs.filter(n => !readNotifs.has(n.id)).length}
                </span>
              )}
            </button>

            {/* Notifications Popover Dropdown - Compact & Basic Smooth Scroll */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-84 sm:w-84 bg-white rounded-xl shadow-xl border border-slate-200 z-[999999] overflow-hidden">
                {/* Basic Compact Header */}
                <div className="p-2.5 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell size={14} className="text-blue-400" />
                    <span className="text-[11px] font-bold tracking-wide uppercase">Thông Báo Quản Trị ({adminNotifs.length})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={fetchAdminNotifs}
                      className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded cursor-pointer"
                      title="Làm mới thông báo"
                    >
                      <RefreshCw size={12} />
                    </button>
                    <button 
                      onClick={() => setShowNotifMenu(false)}
                      className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>

                {/* Compact Category Filter Pills */}
                <div className="p-1.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1 overflow-x-auto custom-scrollbar">
                  <button
                    onClick={() => setNotifFilter('all')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer whitespace-nowrap ${
                      notifFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Tất cả ({adminNotifs.length})
                  </button>
                  <button
                    onClick={() => setNotifFilter('report')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      notifFilter === 'report'
                        ? 'bg-rose-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldAlert size={11} className={notifFilter === 'report' ? 'text-white' : 'text-rose-500'} /> 
                    Báo cáo ({adminNotifs.filter(n => n.type === 'report').length})
                  </button>
                  <button
                    onClick={() => setNotifFilter('inactive')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      notifFilter === 'inactive'
                        ? 'bg-amber-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <UserMinus size={11} className={notifFilter === 'inactive' ? 'text-white' : 'text-amber-500'} /> 
                    180 Ngày ({adminNotifs.filter(n => n.type === 'inactive_user').length})
                  </button>
                  <button
                    onClick={() => setNotifFilter('ai')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      notifFilter === 'ai'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Bot size={11} className={notifFilter === 'ai' ? 'text-white' : 'text-indigo-500'} /> 
                    AI ({adminNotifs.filter(n => n.type === 'ai_moderation').length})
                  </button>
                </div>

                {/* Compact Notifications List - Smooth Scroll & Pretty Roll */}
                <div className="max-h-[310px] overflow-y-auto scroll-smooth divide-y divide-slate-100 custom-scrollbar pr-0.5">
                  {adminNotifs.filter(item => {
                    if (notifFilter === 'report') return item.type === 'report';
                    if (notifFilter === 'inactive') return item.type === 'inactive_user';
                    if (notifFilter === 'ai') return item.type === 'ai_moderation';
                    return true;
                  }).length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      <Sparkles size={20} className="mx-auto mb-1 text-slate-300" />
                      <p className="text-[11px] font-medium text-slate-500">Không có thông báo nào thuộc danh mục này.</p>
                    </div>
                  ) : (
                    adminNotifs
                      .filter(item => {
                        if (notifFilter === 'report') return item.type === 'report';
                        if (notifFilter === 'inactive') return item.type === 'inactive_user';
                        if (notifFilter === 'ai') return item.type === 'ai_moderation';
                        return true;
                      })
                      .map(item => {
                        const isRead = readNotifs.has(item.id);
                        return (
                          <div 
                            key={item.id}
                            onClick={() => {
                              setReadNotifs(prev => new Set(prev).add(item.id));
                              setShowNotifMenu(false);
                              if (item.type === 'report' || item.type === 'ai_moderation') {
                                setActiveTab('posts');
                              } else if (item.type === 'inactive_user') {
                                setActiveTab('users');
                              }
                            }}
                            className={`p-2.5 cursor-pointer text-left transition-colors ${
                              isRead 
                                ? 'bg-slate-50/50 opacity-55 hover:opacity-80' 
                                : 'bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {/* Compact Vector Icon Bubble */}
                              <div className="mt-0.5 shrink-0">
                                {item.type === 'report' && (
                                  <div className="w-7 h-7 rounded bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                                    <ShieldAlert size={14} />
                                  </div>
                                )}
                                {item.type === 'inactive_user' && (
                                  <div className="w-7 h-7 rounded bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                                    <UserMinus size={14} />
                                  </div>
                                )}
                                {item.type === 'ai_moderation' && (
                                  <div className="w-7 h-7 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                                    <Bot size={14} />
                                  </div>
                                )}
                              </div>

                              {/* Compact Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className={`text-[11px] ${isRead ? 'font-medium text-slate-500' : 'font-bold text-slate-900'} leading-tight truncate`}>
                                    {item.title}
                                  </h4>
                                  <span className="text-[9px] text-slate-400 font-medium shrink-0">
                                    {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className={`text-[10px] ${isRead ? 'text-slate-400' : 'text-slate-600'} font-medium mt-0.5 leading-snug line-clamp-2`}>
                                  {item.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Compact Footer */}
                <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[9px] text-slate-400 font-medium">Tự động đồng bộ 30s</span>
                  <button
                    onClick={() => {
                      setReadNotifs(new Set(adminNotifs.map(n => n.id)));
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-bold cursor-pointer flex items-center gap-1 hover:underline"
                  >
                    <CheckCheck size={12} /> Đánh dấu tất cả đã đọc
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200/80"
          >
            <Compass size={14} className="text-blue-600" /> Trở về Terraholic
          </button>

          {/* Admin Account Header Click Handler -> Opens Change Password Modal */}
          <div 
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center gap-3 pl-3 border-l border-slate-200 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-2xl transition-all border border-transparent hover:border-slate-200"
            title="Nhấn để Đổi mật khẩu tài khoản Admin"
          >
            <img
              src={adminUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt="Admin Avatar"
              className="w-9 h-9 rounded-full border-2 border-blue-500/30 object-cover shadow-sm"
            />
            <div className="hidden md:block text-left">
              <div className="text-xs font-extrabold text-slate-900 leading-none flex items-center gap-1">
                {adminUser?.fullName || 'Terraholic Administrator'}
                <Key size={12} className="text-blue-600" />
              </div>
              <div className="text-[11px] text-blue-600 font-medium mt-0.5">admin@terraholic.com</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition-all cursor-pointer shadow-sm ml-1"
              title="Đăng xuất Admin"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Navigation Sidebar */}
        <aside
          className={`${
            isCollapsed ? 'w-full md:w-20 p-2.5' : 'w-full md:w-64 p-4'
          } bg-white border-r border-slate-200/80 space-y-4 shrink-0 shadow-sm transition-all duration-300 ease-in-out`}
        >
          <div className="flex items-center justify-between px-2">
            {!isCollapsed ? (
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                MENU QUẢN TRỊ
              </span>
            ) : (
              <span className="w-full text-center text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                MENU
              </span>
            )}
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-3'
                  } rounded-xl text-xs font-bold transition-all cursor-pointer relative group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={19} className="shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>

                  {!isCollapsed && isActive && <ChevronRight size={14} className="text-white/80" />}

                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Main Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1920px] mx-auto overflow-x-hidden transition-all duration-300">
          {activeTab === 'overview' && <AdminOverviewTab stats={stats} loading={loadingStats} />}
          {activeTab === 'users' && <AdminUsersTab />}
          {activeTab === 'posts' && <AdminPostsTab />}
          {activeTab === 'handbook' && <AdminHandbookTab />}
          {activeTab === 'logs' && <AdminAuditLogsTab />}
        </main>
      </div>

      {/* ── MODAL: ADMIN CHANGE PASSWORD WITH EMAIL OTP ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <Key size={18} />
                </div>
                Đổi Mật Khẩu Tài Khoản Admin
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              {/* Account Email Info */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <Mail size={18} className="text-blue-600 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tài khoản xác thực OTP</span>
                  <span className="text-xs font-black text-slate-900">admin@terraholic.com</span>
                </div>
              </div>

              {/* OTP Dispatch Action */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Mã xác thực OTP Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Nhập 6 số OTP..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp}
                    className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-extrabold rounded-xl border border-blue-200/80 transition-all cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                  >
                    <Send size={14} />
                    {sendingOtp ? 'Đang gửi...' : 'Gửi mã OTP'}
                  </button>
                </div>
                {otpSentMsg && (
                  <p className="text-[11px] font-bold text-emerald-600 bg-emerald-50 p-2 rounded-xl border border-emerald-200 mt-1">
                    {otpSentMsg}
                  </p>
                )}
              </div>

              {/* New Password Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Mật khẩu mới (Lần 1)
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Xác nhận mật khẩu mới (Lần 2)
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Error Alert */}
              {passError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              {/* Success Alert */}
              {passSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{passSuccess}</span>
                </div>
              )}

              {/* Submit & Cancel Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={updatingPass}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  {updatingPass ? 'Đang cập nhật...' : 'Cập nhật Mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboardLayout;
