import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, Compass, Eye, EyeOff, KeyRound, RefreshCw, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

export const AdminLoginPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'forgot' | 'otp'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Forgot Password & OTP state
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const navigate = useNavigate();

  // 3-Minute Resend Countdown Timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  // 1. ADMIN LOGIN
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await api.post('/admin/login', { email, password });
      if (res.data && res.data.accessToken) {
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('st-token', res.data.accessToken);
        localStorage.setItem('st-admin-token', res.data.accessToken);
        localStorage.setItem('st-user', JSON.stringify(res.data.user));
        navigate('/admin');
      } else {
        setStatusMsg({ text: 'Đăng nhập không thành công. Vui lòng thử lại.', isError: true });
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      setStatusMsg({ text: err.response?.data?.error || 'Đăng nhập không thành công. Kiểm tra lại thông tin.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  // 2. SEND DIRECT NEW PASSWORD TO EMAIL
  const handleSendDirectPassword = async () => {
    if (!email.trim()) {
      setStatusMsg({ text: 'Vui lòng nhập Email Admin.', isError: true });
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.post('/admin/forgot-password', { email: email.trim(), mode: 'direct_reset' });
      setStatusMsg({
        text: res.data.message || `🔑 Mật khẩu mới đã được khởi tạo và gửi về email ${email}!`,
        isError: false
      });
      setResendTimer(180);
    } catch (err: any) {
      console.error('Direct reset error:', err);
      setStatusMsg({ text: err.response?.data?.error || 'Không thể gửi mật khẩu mới. Vui lòng thử lại.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  // 3. SEND OTP CODE TO EMAIL
  const handleSendOtpCode = async () => {
    if (!email.trim()) {
      setStatusMsg({ text: 'Vui lòng nhập Email Admin.', isError: true });
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.post('/admin/forgot-password', { email: email.trim(), mode: 'otp' });
      setStatusMsg({
        text: res.data.message || `🚀 Mã OTP 6 chữ số đã được gửi về email ${email}!`,
        isError: false
      });
      setResendTimer(180);
      setTimeout(() => {
        setMode('otp');
      }, 1200);
    } catch (err: any) {
      console.error('Send OTP error:', err);
      setStatusMsg({ text: err.response?.data?.error || 'Không thể gửi mã OTP. Vui lòng thử lại.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  // 4. VERIFY OTP & RESET PASSWORD
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setStatusMsg({ text: 'Vui lòng nhập mã OTP 6 chữ số.', isError: true });
      return;
    }
    if (newPassword.length < 6) {
      setStatusMsg({ text: 'Mật khẩu mới phải có ít nhất 6 ký tự.', isError: true });
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.post('/admin/reset-password', { email: email.trim(), otp: otpCode, newPassword });
      setStatusMsg({ text: res.data.message || '🎉 Đặt lại mật khẩu thành công! Hãy đăng nhập bằng mật khẩu mới.', isError: false });
      setPassword(newPassword);
      setTimeout(() => {
        setMode('login');
        setOtpCode('');
        setNewPassword('');
      }, 1800);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setStatusMsg({ text: err.response?.data?.error || 'Mã OTP không hợp lệ hoặc đã hết hạn.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-blue-50/30 text-slate-800 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Soft Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-200/50 relative z-10 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 mb-2">
            {mode === 'login' ? <ShieldCheck size={36} /> : <KeyRound size={34} />}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center justify-center gap-2">
            Terraholic <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Admin Portal</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {mode === 'login' && 'Trang Đăng Nhập Quản Trị Viên Hệ Thống'}
            {mode === 'forgot' && 'Khôi Phục Mật Khẩu Quản Trị Viên'}
            {mode === 'otp' && 'Nhập Mã OTP & Đổi Mật Khẩu Admin'}
          </p>
        </div>

        {/* Status Message Banner */}
        {statusMsg && (
          <div className={`p-3.5 rounded-xl border text-xs font-bold text-center leading-relaxed flex items-start gap-2.5 ${
            statusMsg.isError
              ? 'bg-rose-50 border-rose-200 text-rose-600'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            {statusMsg.isError ? (
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
            ) : (
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
            )}
            <span className="flex-1 text-left">{statusMsg.text}</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            1. LOGIN FORM
        ══════════════════════════════════════════════ */}
        {mode === 'login' && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Tên đăng nhập / Email Admin</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@terraholic.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Mật khẩu Admin</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => { setStatusMsg(null); setMode('forgot'); }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
            </div>



            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Đang xác thực quyền Admin...
                </>
              ) : (
                <>
                  Đăng Nhập Trang Quản Trị <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* ══════════════════════════════════════════════
            2. FORGOT PASSWORD FORM
        ══════════════════════════════════════════════ */}
        {mode === 'forgot' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Email Quản Trị Viên (Admin)</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 text-slate-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@terraholic.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleSendDirectPassword}
                disabled={loading || resendTimer > 0}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <KeyRound size={16} />
                )}
                {resendTimer > 0 ? `Tạo & Gửi lại mật khẩu mới (${formatTimer(resendTimer)})` : '🔑 Gửi Mật Khẩu Mới Trực Tiếp Về Email'}
              </button>

              <button
                type="button"
                onClick={handleSendOtpCode}
                disabled={loading || resendTimer > 0}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Mail size={15} /> Gửi Mã OTP 6 Chữ Số Để Tự Đổi Mật Khẩu
              </button>
            </div>

            <button
              type="button"
              onClick={() => { setStatusMsg(null); setMode('login'); }}
              className="w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={14} /> Quay lại trang Đăng nhập Admin
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            3. OTP VERIFICATION FORM
        ══════════════════════════════════════════════ */}
        {mode === 'otp' && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Mã xác thực OTP (6 chữ số)</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 font-mono tracking-widest font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Mật khẩu Admin mới</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-slate-400" size={18} />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự..."
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6 || newPassword.length < 6}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Xác Nhận Đặt Mật Khẩu Admin Mới
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={handleSendOtpCode}
                disabled={loading || resendTimer > 0}
                className={`font-bold inline-flex items-center gap-1 ${
                  resendTimer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600 hover:underline cursor-pointer'
                }`}
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                {resendTimer > 0 ? `Gửi lại OTP (${formatTimer(resendTimer)})` : 'Gửi lại mã OTP'}
              </button>

              <button
                type="button"
                onClick={() => { setStatusMsg(null); setMode('login'); }}
                className="font-semibold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
              >
                Quay lại Đăng nhập
              </button>
            </div>
          </form>
        )}

        {/* Footer link back to home */}
        <div className="pt-2 text-center border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-slate-500 hover:text-blue-600 font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <Compass size={14} /> Quay về Trang chủ Terraholic
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
