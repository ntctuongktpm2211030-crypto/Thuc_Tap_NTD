import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, Compass, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@terraholic.com');
  const [password, setPassword] = useState('123456@Aa');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/admin/login', { email, password });
      if (res.data && res.data.accessToken) {
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('st-token', res.data.accessToken);
        localStorage.setItem('st-admin-token', res.data.accessToken);
        localStorage.setItem('st-user', JSON.stringify(res.data.user));
        navigate('/admin');
      } else {
        setErrorMsg('Đăng nhập không thành công. Vui lòng thử lại.');
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      setErrorMsg(err.response?.data?.error || 'Đăng nhập không thành công. Kiểm tra lại thông tin.');
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
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 mb-2">
            <ShieldCheck size={36} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center justify-center gap-2">
            Terraholic <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Admin Portal</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">Trang Đăng Nhập Quản Trị Viên Hệ Thống</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold text-center animate-shake">
            {errorMsg}
          </div>
        )}

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
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Mật khẩu Admin</label>
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
          </div>

          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/80 text-[11px] text-slate-600 space-y-1">
            <p className="font-extrabold text-blue-700">🔑 Tài khoản Admin Mặc định:</p>
            <p>• Username: <code className="text-slate-900 font-mono font-bold">admin</code> hoặc <code className="text-slate-900 font-mono font-bold">admin@terraholic.com</code></p>
            <p>• Mật khẩu: <code className="text-slate-900 font-mono font-bold">123456@Aa</code></p>
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

        <div className="pt-2 text-center">
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
