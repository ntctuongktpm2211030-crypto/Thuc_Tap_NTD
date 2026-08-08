import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Mail, Lock, User, Eye, EyeOff, ArrowRight,
  Check, AlertCircle, Plane, MapPin, Globe, ChevronLeft, Shield, RefreshCw,
} from 'lucide-react';
import { loginThunk, registerThunk, clearError, loginGoogleThunk } from '../../store/authSlice';
import type { RootState, AppDispatch } from '../../store';
import { useLang } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import { loginGoogle } from '../../config/firebase';
import { authService } from '../../services/smartTravel.service';
import api from '../../services/api';
import logoImg from '../../assets/logo.png';
import { RippleButton } from '@/components/ui/ripple-button';

// ──────────────────────────────────────────────────────────────
// BACKGROUND SLIDES — travel imagery carousel
// ──────────────────────────────────────────────────────────────
const BG_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1200&q=80',
    destination: 'Thung lũng Mường Hoa, Sapa',
    quote: 'Mỗi hành trình bắt đầu bằng một bước chân nhỏ.',
  },
  {
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
    destination: 'Phố cổ Hội An, Quảng Nam',
    quote: 'Du lịch là cách tốt nhất để mở rộng tầm nhìn của bạn.',
  },
  {
    image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80',
    destination: 'Kyoto, Nhật Bản',
    quote: 'Thế giới là một cuốn sách — kẻ không đi sẽ chỉ đọc một trang.',
  },
];

// ──────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ──────────────────────────────────────────────────────────────
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isStrongPassword = (v: string) => v.length >= 8;

interface FieldState {
  value: string;
  touched: boolean;
  error: string;
}

const field = (value = ''): FieldState => ({ value, touched: false, error: '' });

// ──────────────────────────────────────────────────────────────
// INPUT COMPONENT
// ──────────────────────────────────────────────────────────────
interface InputProps {
  id: string;
  type?: string;
  label?: string;
  placeholder: string;
  value: string;
  error?: string;
  touched?: boolean;
  onChange: (v: string) => void;
  onBlur?: () => void;
  icon: React.ReactNode;
  rightElement?: React.ReactNode;
  autoComplete?: string;
}

const Input = ({ id, type = 'text', label, placeholder, value, error, touched, onChange, onBlur, icon, rightElement, autoComplete }: InputProps) => {
  const hasError = touched && error;
  const isValid = touched && !error && value;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none z-10 ${hasError ? 'text-rose-400' : isValid ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
          {icon}
        </div>
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          className={`w-full bg-[var(--bg-elevated)] border rounded-xl pl-10 ${rightElement ? 'pr-11' : 'pr-4'} py-3.5 text-sm text-[var(--text-primary)] focus:outline-none transition-all placeholder:text-[var(--text-muted)] ${
            hasError
              ? 'border-rose-500/60 focus:border-rose-500 bg-rose-500/5'
              : isValid
              ? 'border-emerald-500/40 focus:border-emerald-500'
              : 'border-[var(--border-subtle)] hover:border-[var(--border-normal)] focus:border-[var(--gold)] focus:shadow-lg focus:shadow-[var(--gold-glow)]'
          }`}
        />
        {rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center z-10">{rightElement}</div>
        )}
        {isValid && !rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center z-10 pointer-events-none">
            <Check size={16} className="text-emerald-400" />
          </div>
        )}
      </div>
      {hasError && (
        <p className="flex items-center gap-1.5 text-xs text-rose-400 animate-fade-in">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// PASSWORD STRENGTH METER
// ──────────────────────────────────────────────────────────────
const PasswordStrength = ({ password }: { password: string }) => {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-400', 'bg-emerald-500'];
  const labels = ['Yếu', 'Trung bình', 'Khá', 'Mạnh'];

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < score ? colors[score - 1] : 'bg-[var(--border-subtle)]'}`} />
        ))}
      </div>
      <p className={`text-[11px] font-semibold ${score >= 3 ? 'text-emerald-400' : score >= 2 ? 'text-amber-400' : 'text-rose-400'}`}>
        {password.length > 0 ? `Độ mạnh mật khẩu: ${labels[score - 1] || 'Yếu'}` : ''}
      </p>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// GOOGLE SIGN-IN BUTTON
// ──────────────────────────────────────────────────────────────
const GoogleButton = ({ label, onClick }: { label: string; onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-[var(--border-normal)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] hover:border-[var(--gold)] transition-all text-sm font-semibold text-[var(--text-primary)] group"
  >
    {/* Google SVG logo */}
    <svg width="18" height="18" viewBox="0 0 24 24" className="flex-shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
    <span className="group-hover:text-[var(--gold)] transition-colors">{label}</span>
  </button>
);

// ──────────────────────────────────────────────────────────────
// DIVIDER
// ──────────────────────────────────────────────────────────────
const Divider = ({ label }: { label: string }) => (
  <div className="relative flex items-center gap-3">
    <div className="flex-1 h-px bg-[var(--border-subtle)]" />
    <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap px-2">{label}</span>
    <div className="flex-1 h-px bg-[var(--border-subtle)]" />
  </div>
);

// ──────────────────────────────────────────────────────────────
// LEFT PANEL — travel imagery carousel
// ──────────────────────────────────────────────────────────────
const LeftPanel = () => {
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSlideIdx(i => (i + 1) % BG_SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = BG_SLIDES[slideIdx];

  return (
    <div className="relative hidden lg:flex flex-col w-[480px] xl:w-[560px] flex-shrink-0 overflow-hidden">
      {/* Background image with smooth crossfade */}
      {BG_SLIDES.map((s, i) => (
        <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === slideIdx ? 'opacity-100' : 'opacity-0'}`}>
          <img src={s.image} alt={s.destination} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
        </div>
      ))}

      {/* Top: Logo */}
      <div className="relative z-10 p-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-12 h-12 flex items-center justify-center">
            <img src={logoImg} alt="Terraholic Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-editorial text-white font-bold text-lg leading-none block">Terraholic</span>
            <span className="text-[10px] text-blue-300 font-semibold tracking-widest uppercase">Khám phá bằng đam mê, kết nối bằng hành trình</span>
          </div>
        </Link>
      </div>

      {/* Bottom: Quote + destination */}
      <div className="relative z-10 mt-auto p-8 space-y-4">
        <p className="font-editorial text-white text-xl font-semibold leading-relaxed italic">
          "{slide.quote}"
        </p>
        <div className="flex items-center gap-2 text-sm text-white/70">
          <MapPin size={14} className="text-amber-400 flex-shrink-0" />
          <span>{slide.destination}</span>
        </div>

        {/* Slide dots */}
        <div className="flex gap-2 pt-2">
          {BG_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlideIdx(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === slideIdx ? 'w-6 bg-amber-400' : 'w-1.5 bg-white/30 hover:bg-white/50'}`} />
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
          {[['10K+', 'Lữ khách'], ['500+', 'Điểm đến'], ['50K+', 'Bài viết']].map(([n, l]) => (
            <div key={l} className="text-center">
              <div className="text-lg font-bold text-amber-300">{n}</div>
              <div className="text-[11px] text-white/60">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating features */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10 space-y-3">
        {[
          { icon: <Plane size={14} />, label: 'AI Trip Planner' },
          { icon: <MapPin size={14} />, label: 'Social Map' },
          { icon: <Globe size={14} />, label: 'Travel Feed' },
        ].map(f => (
          <div key={f.label} className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-2 text-white/80 text-xs font-medium">
            <span className="text-amber-400">{f.icon}</span>
            {f.label}
          </div>
        ))}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// MAIN AUTH PAGE
// ──────────────────────────────────────────────────────────────
export default function AuthPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || '/';
  const { isLoading, error, isAuthenticated, user } = useSelector((s: RootState) => s.auth);
  const { t } = useLang();
  const { error: toastError } = useToast();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'otp' | 'reset'>('login');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Forgot Password / OTP / Reset State
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetPwdVal, setResetPwdVal] = useState(field());
  const [resetConfirmVal, setResetConfirmVal] = useState(field());
  const [forgotStatus, setForgotStatus] = useState<{ text: string; isError: boolean } | null>(null);
  const [forgotLoadingState, setForgotLoadingState] = useState(false);

  // OTP Countdown Timers (3 minutes = 180 seconds)
  const [resendTimer, setResendTimer] = useState(0);
  const [regResendTimer, setRegResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (regResendTimer <= 0) return;
    const interval = setInterval(() => {
      setRegResendTimer(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [regResendTimer]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || forgotLoadingState) return;
    if (!forgotEmail) {
      setForgotStatus({ text: 'Vui lòng nhập Email để gửi lại mã OTP', isError: true });
      switchMode('forgot');
      return;
    }
    setForgotStatus(null);
    setForgotLoadingState(true);
    try {
      await authService.forgotPassword(forgotEmail);
      setForgotStatus({ text: `Mã OTP mới đã được gửi thành công đến email ${forgotEmail}.`, isError: false });
      setResendTimer(180);
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      const msg = err.response?.data?.error || 'Có lỗi xảy ra khi gửi lại mã OTP.';
      setForgotStatus({ text: msg, isError: true });
    } finally {
      setForgotLoadingState(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmail(forgotEmail)) {
      setForgotStatus({ text: 'Email không hợp lệ', isError: true });
      return;
    }
    setForgotStatus(null);
    setForgotLoadingState(true);
    try {
      await authService.forgotPassword(forgotEmail);
      setForgotStatus({ text: 'Mã OTP 6 chữ số đã được gửi về email của bạn.', isError: false });
      setResendTimer(180); // Bắt đầu đếm ngược 3 phút
      setTimeout(() => {
        setForgotStatus(null);
        setMode('otp');
      }, 1200);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      const msg = err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại sau.';
      setForgotStatus({ text: msg, isError: true });
    } finally {
      setForgotLoadingState(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) {
      setForgotStatus({ text: 'Vui lòng nhập đầy đủ mã OTP 6 chữ số', isError: true });
      return;
    }
    setForgotStatus(null);
    setForgotLoadingState(true);
    try {
      const res = await authService.verifyOtp(forgotEmail, otpCode);
      setResetToken(res.resetToken);
      setForgotStatus(null);
      setMode('reset');
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      const msg = err.response?.data?.error || 'Mã OTP không hợp lệ hoặc đã hết hiệu lực.';
      setForgotStatus({ text: msg, isError: true });
    } finally {
      setForgotLoadingState(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStrongPassword(resetPwdVal.value)) {
      setResetPwdVal(p => ({ ...p, error: 'Mật khẩu phải có ít nhất 8 ký tự', touched: true }));
      return;
    }
    if (resetConfirmVal.value !== resetPwdVal.value) {
      setResetConfirmVal(p => ({ ...p, error: 'Mật khẩu nhập lại không khớp', touched: true }));
      return;
    }
    setForgotStatus(null);
    setForgotLoadingState(true);
    try {
      await authService.resetPassword(forgotEmail, resetToken, resetPwdVal.value);
      setForgotStatus({ text: 'Đổi mật khẩu thành công. Đang quay lại trang đăng nhập...', isError: false });
      setTimeout(() => {
        setForgotStatus(null);
        setMode('login');
        setForgotEmail('');
        setOtpCode('');
        setResetToken('');
        setResetPwdVal(field());
        setResetConfirmVal(field());
      }, 2000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      const msg = err.response?.data?.error || 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
      setForgotStatus({ text: msg, isError: true });
    } finally {
      setForgotLoadingState(false);
    }
  };

  // LOGIN state
  const [loginId, setLoginId] = useState(field());
  const [loginPwd, setLoginPwd] = useState(field());

  // REGISTER state
  const [regName, setRegName] = useState(field());
  const [regEmail, setRegEmail] = useState(field());
  const [regPwd, setRegPwd] = useState(field());
  const [regConfirm, setRegConfirm] = useState(field());
  const [regOtpCode, setRegOtpCode] = useState(field());
  const [sendingRegOtp, setSendingRegOtp] = useState(false);
  const [regOtpMsg, setRegOtpMsg] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleSendRegisterOtp = async () => {
    if (regResendTimer > 0 || sendingRegOtp) return;
    if (!isEmail(regEmail.value)) {
      setRegEmail(p => ({ ...p, error: 'Vui lòng nhập Email hợp lệ trước khi gửi mã OTP', touched: true }));
      return;
    }
    setSendingRegOtp(true);
    setRegOtpMsg('');
    try {
      const res = await api.post('/auth/send-register-otp', { email: regEmail.value.trim() });
      const msg = res.data?.message || `Mã OTP 6 số đã được gửi tới email ${regEmail.value}. Vui lòng kiểm tra hòm thư của bạn.`;
      setRegOtpMsg(`📧 ${msg}`);
      setRegResendTimer(180);
    } catch (err: any) {
      console.error('Send register OTP error:', err);
      const errMsg = err.response?.data?.error || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại email.';
      setRegOtpMsg(`⚠️ ${errMsg}`);
    } finally {
      setSendingRegOtp(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, user, navigate, redirectTo]);

  const handleGoogleLogin = async () => {
    try {
      const result = await loginGoogle();
      const idToken = await result.user.getIdToken();
      const res = await dispatch(loginGoogleThunk(idToken));
      if (loginGoogleThunk.fulfilled.match(res)) {
        navigate(redirectTo, { replace: true });
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        toastError('Đăng nhập Google thất bại: ' + (err.message || err));
      }
    }
  };

  // Clear Redux error on mode switch
  const switchMode = (m: 'login' | 'register' | 'forgot' | 'otp' | 'reset') => {
    setMode(m);
    dispatch(clearError());
    setForgotStatus(null);
  };

  // ──── VALIDATION ────
  const validateLogin = () => {
    let ok = true;
    if (!loginId.value.trim()) {
      setLoginId(p => ({ ...p, error: 'Vui lòng nhập email hoặc tên đăng nhập', touched: true })); ok = false;
    } else setLoginId(p => ({ ...p, error: '' }));

    if (!loginPwd.value) {
      setLoginPwd(p => ({ ...p, error: 'Vui lòng nhập mật khẩu', touched: true })); ok = false;
    } else setLoginPwd(p => ({ ...p, error: '' }));

    return ok;
  };

  const validateRegister = () => {
    let ok = true;
    if (!regName.value.trim() || regName.value.trim().length < 2) {
      setRegName(p => ({ ...p, error: 'Họ tên phải có ít nhất 2 ký tự', touched: true })); ok = false;
    } else setRegName(p => ({ ...p, error: '' }));

    if (!isEmail(regEmail.value)) {
      setRegEmail(p => ({ ...p, error: 'Email không hợp lệ', touched: true })); ok = false;
    } else setRegEmail(p => ({ ...p, error: '' }));

    if (!isStrongPassword(regPwd.value)) {
      setRegPwd(p => ({ ...p, error: 'Mật khẩu phải có ít nhất 8 ký tự', touched: true })); ok = false;
    } else setRegPwd(p => ({ ...p, error: '' }));

    if (regConfirm.value !== regPwd.value) {
      setRegConfirm(p => ({ ...p, error: 'Mật khẩu nhập lại không khớp', touched: true })); ok = false;
    } else setRegConfirm(p => ({ ...p, error: '' }));

    if (!regOtpCode.value || regOtpCode.value.trim().length !== 6) {
      setRegOtpCode(p => ({ ...p, error: 'Vui lòng bấm Gửi mã OTP và nhập 6 chữ số', touched: true })); ok = false;
    } else setRegOtpCode(p => ({ ...p, error: '' }));

    if (!agreed) { ok = false; }

    return ok;
  };

  // ──── SUBMIT ────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;
    dispatch(clearError());
    // Backend expects email — if input looks like email use directly, else treat as email too
    const email = loginId.value.includes('@') ? loginId.value : loginId.value; // future: resolve username
    const result = await dispatch(loginThunk({ email, password: loginPwd.value }));
    if (loginThunk.fulfilled.match(result)) navigate(redirectTo, { replace: true });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegister()) return;
    dispatch(clearError());
    const email = regEmail.value.trim();
    const result = await dispatch(registerThunk({
      fullName: regName.value.trim(),
      email,
      password: regPwd.value,
      otpCode: regOtpCode.value
    } as any));

    if (registerThunk.fulfilled.match(result)) {
      navigate(redirectTo, { replace: true });
    }
  };

  // ──────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)]">
      <LoadingOverlay isVisible={isLoading} message={mode === 'login' ? 'Đang đăng nhập vào hệ thống...' : 'Đang tạo tài khoản mới...'} />
      {/* LEFT — Travel imagery panel */}
      <LeftPanel />

      {/* RIGHT — Auth form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
        {/* Back to home (mobile only) */}
        <div className="w-full max-w-[420px] mb-6 lg:hidden">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors">
            <ChevronLeft size={16} /> Về trang chủ
          </Link>
        </div>

        <div className="w-full max-w-[420px] space-y-6">
          {/* Heading */}
          <div className="space-y-1">
            <h1 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
              {mode === 'login' && t('auth.welcome')}
              {mode === 'register' && t('auth.startJourney')}
              {mode === 'forgot' && 'Quên mật khẩu?'}
              {mode === 'otp' && 'Nhập mã OTP'}
              {mode === 'reset' && 'Đặt lại mật khẩu'}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              {mode === 'login' && t('auth.signInSub')}
              {mode === 'register' && t('auth.signUpSub')}
              {mode === 'forgot' && 'Nhập email của bạn để nhận mã OTP khôi phục mật khẩu.'}
              {mode === 'otp' && `Nhập mã xác thực 6 chữ số đã được gửi đến email ${forgotEmail}.`}
              {mode === 'reset' && 'Nhập mật khẩu mới cho tài khoản của bạn.'}
            </p>
            {redirectTo !== '/' && (
              <p className="text-xs text-[var(--gold)] bg-[var(--gold-glow)] border border-[var(--gold)]/25 rounded-lg px-3 py-2 mt-2">
                {t('auth.loginToPost')}
              </p>
            )}
          </div>

          {/* Mode tabs */}
          {(mode === 'login' || mode === 'register') && (
            <div className="flex bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-1">
              {(['login', 'register'] as const).map(m => (
                <button key={m} onClick={() => switchMode(m)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    mode === m
                      ? 'bg-[var(--gold)] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}>
                  {m === 'login' ? t('auth.signIn') : t('auth.createAccount')}
                </button>
              ))}
            </div>
          )}

          {/* API error banner */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-sm text-rose-400 animate-fade-in">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* OTP/Forgot password status banner */}
          {forgotStatus && (
            <div className={`flex items-start gap-2.5 p-3.5 border rounded-xl text-sm animate-fade-in ${
              forgotStatus.isError 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{forgotStatus.text}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              LOGIN FORM
          ══════════════════════════════════════════════ */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Google */}
              <GoogleButton label="Đăng nhập với Google" onClick={handleGoogleLogin} />
              <Divider label="hoặc đăng nhập với" />

              <Input
                id="login-id"
                label="Email hoặc tên đăng nhập"
                placeholder="example@email.com hoặc @username"
                value={loginId.value}
                error={loginId.error}
                touched={loginId.touched}
                autoComplete="username"
                onChange={v => setLoginId(p => ({ ...p, value: v, touched: true, error: v.trim() ? '' : 'Vui lòng nhập email hoặc tên đăng nhập' }))}
                onBlur={() => setLoginId(p => ({ ...p, touched: true }))}
                icon={<Mail size={16} />}
              />

              <Input
                id="login-password"
                type={showPwd ? 'text' : 'password'}
                label="Mật khẩu"
                placeholder="Nhập mật khẩu của bạn"
                value={loginPwd.value}
                error={loginPwd.error}
                touched={loginPwd.touched}
                autoComplete="current-password"
                onChange={v => setLoginPwd(p => ({ ...p, value: v, touched: true, error: v ? '' : 'Vui lòng nhập mật khẩu' }))}
                onBlur={() => setLoginPwd(p => ({ ...p, touched: true }))}
                icon={<Lock size={16} />}
                rightElement={
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer">
                  <input type="checkbox" className="rounded border-[var(--border-subtle)] bg-[var(--bg-elevated)]" />
                  Ghi nhớ đăng nhập
                </label>
                <button type="button" onClick={() => switchMode('forgot')} className="text-xs font-semibold text-[var(--gold)] hover:underline">
                  Quên mật khẩu?
                </button>
              </div>

              <RippleButton
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[var(--gold)] to-blue-700 text-white font-bold text-sm hover:shadow-xl hover:shadow-blue-600/25 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <><span className="animate-spin">⏳</span> {t('auth.loading')}</>
                ) : (
                  <>{t('auth.signIn')} <ArrowRight size={16} /></>
                )}
              </RippleButton>
            </form>
          )}

          {/* ══════════════════════════════════════════════
              FORGOT PASSWORD FORM
          ══════════════════════════════════════════════ */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <Input
                id="forgot-email"
                type="email"
                label="Email của bạn"
                placeholder="example@email.com"
                value={forgotEmail}
                onChange={v => setForgotEmail(v)}
                icon={<Mail size={16} />}
              />

              <button
                type="submit"
                disabled={forgotLoadingState || !forgotEmail}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[var(--gold)] to-blue-700 text-white font-bold text-sm hover:shadow-xl hover:shadow-blue-600/25 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {forgotLoadingState ? (
                  <><span className="animate-spin">⏳</span> Gửi...</>
                ) : (
                  <>Gửi mã OTP <ArrowRight size={16} /></>
                )}
              </button>

              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full py-2.5 text-center text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:underline"
              >
                Quay lại đăng nhập
              </button>
            </form>
          )}

          {/* ══════════════════════════════════════════════
              OTP VERIFICATION FORM
          ══════════════════════════════════════════════ */}
          {mode === 'otp' && (
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <Input
                id="otp-code"
                type="text"
                label="Mã xác thực OTP (6 chữ số)"
                placeholder="123456"
                value={otpCode}
                onChange={v => setOtpCode(v.replace(/\D/g, '').slice(0, 6))}
                icon={<Lock size={16} />}
              />

              <button
                type="submit"
                disabled={forgotLoadingState || otpCode.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[var(--gold)] to-blue-700 text-white font-bold text-sm hover:shadow-xl hover:shadow-blue-600/25 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {forgotLoadingState ? (
                  <><span className="animate-spin">⏳</span> Xác minh...</>
                ) : (
                  <>Xác minh mã OTP <ArrowRight size={16} /></>
                )}
              </button>

              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0 || forgotLoadingState}
                    className={`font-bold flex items-center gap-1.5 transition-all ${
                      resendTimer > 0 || forgotLoadingState
                        ? 'text-[var(--text-muted)] opacity-60 cursor-not-allowed'
                        : 'text-[var(--gold)] hover:underline cursor-pointer'
                    }`}
                  >
                    <RefreshCw size={13} className={forgotLoadingState ? 'animate-spin' : ''} />
                    {resendTimer > 0 ? (
                      <span>Gửi lại mã OTP ({formatTimer(resendTimer)})</span>
                    ) : (
                      <span>Gửi lại mã OTP mới</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-semibold text-[var(--text-muted)] hover:underline"
                  >
                    Quay lại đăng nhập
                  </button>
                </div>

                {resendTimer > 0 ? (
                  <p className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border-subtle)] leading-relaxed">
                    📩 Mã OTP đã được gửi. Nếu chưa thấy trong Hộp thư đến, vui lòng kiểm tra mục <strong>Spam / Thư rác</strong> hoặc bấm <strong>Gửi lại mã OTP mới</strong> sau <strong className="text-[var(--gold)]">{formatTimer(resendTimer)}</strong>.
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-500 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 leading-relaxed font-medium">
                    💡 Bạn vẫn chưa nhận được email? Hãy bấm nút <strong>Gửi lại mã OTP mới</strong> ở trên để hệ thống gửi lại ngay.
                  </p>
                )}
              </div>
            </form>
          )}

          {/* ══════════════════════════════════════════════
              RESET PASSWORD FORM
          ══════════════════════════════════════════════ */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="reset-password"
                  type={showPwd ? 'text' : 'password'}
                  label="Mật khẩu mới"
                  placeholder="Tối thiểu 8 ký tự"
                  value={resetPwdVal.value}
                  error={resetPwdVal.error}
                  touched={resetPwdVal.touched}
                  autoComplete="new-password"
                  onChange={v => setResetPwdVal(p => ({ ...p, value: v, touched: true, error: isStrongPassword(v) ? '' : 'Mật khẩu phải có ít nhất 8 ký tự' }))}
                  onBlur={() => setResetPwdVal(p => ({ ...p, touched: true }))}
                  icon={<Lock size={16} />}
                  rightElement={
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
                <PasswordStrength password={resetPwdVal.value} />
              </div>

              <Input
                id="reset-confirm"
                type={showConfirm ? 'text' : 'password'}
                label="Nhập lại mật khẩu mới"
                placeholder="Nhập lại mật khẩu"
                value={resetConfirmVal.value}
                error={resetConfirmVal.error}
                touched={resetConfirmVal.touched}
                autoComplete="new-password"
                onChange={v => setResetConfirmVal(p => ({ ...p, value: v, touched: true, error: v === resetPwdVal.value ? '' : 'Mật khẩu nhập lại không khớp' }))}
                onBlur={() => setResetConfirmVal(p => ({ ...p, touched: true }))}
                icon={<Lock size={16} />}
                rightElement={
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <button
                type="submit"
                disabled={forgotLoadingState}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[var(--gold)] to-blue-700 text-white font-bold text-sm hover:shadow-xl hover:shadow-blue-600/25 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {forgotLoadingState ? (
                  <><span className="animate-spin">⏳</span> Đang lưu...</>
                ) : (
                  <>Lưu mật khẩu mới <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          )}

          {/* ══════════════════════════════════════════════
              REGISTER FORM
          ══════════════════════════════════════════════ */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Google */}
              <GoogleButton label="Đăng ký với Google" onClick={handleGoogleLogin} />
              <Divider label="hoặc đăng ký với email" />

              <Input
                id="reg-name"
                label="Họ và tên"
                placeholder="Nguyễn Văn A"
                value={regName.value}
                error={regName.error}
                touched={regName.touched}
                autoComplete="name"
                onChange={v => setRegName(p => ({ ...p, value: v, touched: true, error: v.trim().length >= 2 ? '' : 'Họ tên phải có ít nhất 2 ký tự' }))}
                onBlur={() => setRegName(p => ({ ...p, touched: true }))}
                icon={<User size={16} />}
              />

              <Input
                id="reg-email"
                type="email"
                label="Email"
                placeholder="example@email.com"
                value={regEmail.value}
                error={regEmail.error}
                touched={regEmail.touched}
                autoComplete="email"
                onChange={v => setRegEmail(p => ({ ...p, value: v, touched: true, error: isEmail(v) ? '' : 'Email không hợp lệ' }))}
                onBlur={() => setRegEmail(p => ({ ...p, touched: true }))}
                icon={<Mail size={16} />}
              />

              <div className="space-y-2">
                <Input
                  id="reg-password"
                  type={showPwd ? 'text' : 'password'}
                  label="Mật khẩu"
                  placeholder="Tối thiểu 8 ký tự"
                  value={regPwd.value}
                  error={regPwd.error}
                  touched={regPwd.touched}
                  autoComplete="new-password"
                  onChange={v => setRegPwd(p => ({ ...p, value: v, touched: true, error: isStrongPassword(v) ? '' : 'Mật khẩu phải có ít nhất 8 ký tự' }))}
                  onBlur={() => setRegPwd(p => ({ ...p, touched: true }))}
                  icon={<Lock size={16} />}
                  rightElement={
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
                <PasswordStrength password={regPwd.value} />
              </div>

              <Input
                id="reg-confirm"
                type={showConfirm ? 'text' : 'password'}
                label="Nhập lại mật khẩu"
                placeholder="Nhập lại mật khẩu"
                value={regConfirm.value}
                error={regConfirm.error}
                touched={regConfirm.touched}
                autoComplete="new-password"
                onChange={v => setRegConfirm(p => ({ ...p, value: v, touched: true, error: v === regPwd.value ? '' : 'Mật khẩu nhập lại không khớp' }))}
                onBlur={() => setRegConfirm(p => ({ ...p, touched: true }))}
                icon={<Lock size={16} />}
                rightElement={
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              {/* MÃ XÁC THỰC OTP EMAIL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                  Mã xác thực OTP Email
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="reg-otp"
                      type="text"
                      placeholder="Nhập 6 số OTP..."
                      value={regOtpCode.value}
                      error={regOtpCode.error}
                      touched={regOtpCode.touched}
                      autoComplete="one-time-code"
                      onChange={v => setRegOtpCode(p => ({ ...p, value: v.replace(/\D/g, '').slice(0, 6), touched: true, error: v.length === 6 ? '' : 'Nhập mã 6 chữ số' }))}
                      onBlur={() => setRegOtpCode(p => ({ ...p, touched: true }))}
                      icon={<Shield size={16} />}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendRegisterOtp}
                    disabled={sendingRegOtp || regResendTimer > 0}
                    className="px-4 py-3 bg-[var(--gold)]/15 hover:bg-[var(--gold)]/25 text-[var(--gold)] border border-[var(--gold)]/40 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shrink-0 h-[46px] flex items-center gap-1.5 shadow-sm"
                  >
                    {sendingRegOtp ? (
                      <span className="animate-spin">⏳</span>
                    ) : regResendTimer > 0 ? (
                      <RefreshCw size={13} />
                    ) : (
                      <Mail size={14} />
                    )}
                    {sendingRegOtp ? 'Đang gửi...' : regResendTimer > 0 ? `Gửi lại (${formatTimer(regResendTimer)})` : 'Gửi mã OTP'}
                  </button>
                </div>
                {regOtpMsg && (
                  <div className={`text-xs font-bold p-3 rounded-xl border mt-1 flex flex-col gap-1 ${
                    regOtpMsg.includes('⚠️')
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  }`}>
                    <div>{regOtpMsg}</div>
                  </div>
                )}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${agreed ? 'bg-[var(--gold)] border-[var(--gold)]' : 'border-[var(--border-normal)] group-hover:border-[var(--gold)]'}`}
                  onClick={() => setAgreed(!agreed)}>
                  {agreed && <Check size={10} className="text-black" strokeWidth={3} />}
                </div>
                <span className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Tôi đồng ý với{' '}
                  <button type="button" className="text-[var(--gold)] hover:underline font-semibold">Điều khoản dịch vụ</button>{' '}
                  và{' '}
                  <button type="button" className="text-[var(--gold)] hover:underline font-semibold">Chính sách bảo mật</button>
                </span>
              </label>
              {!agreed && regConfirm.touched && (
                <p className="text-xs text-rose-400 flex items-center gap-1"><AlertCircle size={12} /> Vui lòng đồng ý với điều khoản để tiếp tục</p>
              )}

              <button
                type="submit"
                disabled={isLoading || !agreed}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[var(--gold)] to-blue-700 text-white font-bold text-sm hover:shadow-xl hover:shadow-blue-600/25 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <><span className="animate-spin">⏳</span> {t('auth.loading')}</>
                ) : (
                  <>{t('auth.createAccount')} <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          )}

          {/* Switch mode */}
          <p className="text-center text-xs text-[var(--text-muted)]">
            {mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}
            <button onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="ml-1 text-[var(--gold)] font-semibold hover:underline">
              {mode === 'login' ? t('auth.signUp') : t('auth.signIn')}
            </button>
          </p>

          {/* Back to home (desktop) */}
          <div className="hidden lg:flex justify-center">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors">
              <ChevronLeft size={14} /> Về trang chủ Terraholic
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
