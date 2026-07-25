import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Map,
  BookOpen,
  Calendar,
  Compass,
  Bot,
  Globe,
  Heart,
  History,
  Star,
  FileText,
  Send,
  MessageSquare,
  Users,
  Trophy,
  Mail,
  Phone,
  Clock,
  Camera,
  Utensils,
  Sparkles,
  CheckCircle,
  X,
  ShieldCheck,
  FileText as TermIcon,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState<'privacy' | 'terms' | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail('');
    }
  };

  const handleSendContact = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setContactModalOpen(false);
      setContactMessage('');
    }, 2500);
  };

  return (
    <footer className="relative w-full overflow-hidden bg-[var(--bg-surface)] text-[var(--text-primary)] border-t border-[var(--border-subtle)] transition-colors duration-300">
      {/* ── Top Decorative Wave SVG Edge ── */}
      <div className="w-full overflow-hidden leading-none -mt-1 opacity-90 select-none pointer-events-none">
        <svg
          className="relative block w-full h-8 md:h-12 text-[var(--bg-surface)] fill-current"
          viewBox="0 0 1440 48"
          preserveAspectRatio="none"
        >
          <path d="M0,24 C320,48 480,0 720,24 C960,48 1120,0 1440,24 L1440,0 L0,0 Z" className="opacity-15 fill-[var(--gold)]" />
          <path d="M0,32 C280,8 540,48 880,18 C1180,0 1320,38 1440,32 L1440,48 L0,48 Z" className="fill-[var(--bg-surface)]" />
        </svg>
      </div>

      {/* ── Background Subtle Flight Arc Decorative Line ── */}
      <div className="absolute top-4 right-10 pointer-events-none opacity-20 hidden lg:block">
        <svg width="320" height="120" viewBox="0 0 320 120" fill="none">
          <path
            d="M10 100 C 100 20, 220 10, 300 40"
            stroke="var(--gold)"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />
          <g transform="translate(295, 38) rotate(25)">
            <path fill="var(--gold)" d="M0,0 L12,-4 L8,0 L12,4 Z" />
          </g>
        </svg>
      </div>

      {/* ── Main Container ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 relative z-10">
        
        {/* ── TOP SECTION: Grid 5 Columns ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-[var(--border-subtle)]">
          
          {/* COLUMN 1 & 2: BRAND & INTRODUCTION (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Brand Title & Tagline */}
            <div>
              <span className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                Terraholic
              </span>
              <p className="text-xs font-semibold text-[var(--text-muted)] tracking-wide mt-0.5">
                Khám phá <span className="text-[var(--amber)] font-bold">văn hóa</span> • <span className="text-[var(--gold)] font-bold">Du lịch</span> • <span className="text-[var(--emerald)] font-bold">Ẩm thực</span>
              </p>
            </div>

            {/* Platform Overview Description */}
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-normal">
              Terraholic là nền tảng kết nối cộng đồng yêu du lịch, văn hóa và ẩm thực Việt Nam. Cùng AI và Social Map, chúng tôi giúp bạn khám phá những trải nghiệm tuyệt vời với một cách thông minh và chân thực nhất.
            </p>

            {/* 4 Core Feature Icon Highlights (Frameless Vertical Icon + Centered Text Stack) */}
            <div className="grid grid-cols-4 gap-2 pt-4 w-full">
              {/* Feature 1 */}
              <div className="flex flex-col items-center text-center space-y-1.5 group cursor-pointer">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--gold)] group-hover:scale-110 transition-transform">
                  <MapPin size={20} strokeWidth={1.75} />
                </div>
                <span className="text-[11px] sm:text-xs leading-tight font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                  Khám phá<br />địa điểm
                </span>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-center text-center space-y-1.5 group cursor-pointer">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--teal)] group-hover:scale-110 transition-transform">
                  <Utensils size={20} strokeWidth={1.75} />
                </div>
                <span className="text-[11px] sm:text-xs leading-tight font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                  Ẩm thực<br />đặc sắc
                </span>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-center text-center space-y-1.5 group cursor-pointer">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--amber)] group-hover:scale-110 transition-transform">
                  <Sparkles size={20} strokeWidth={1.75} />
                </div>
                <span className="text-[11px] sm:text-xs leading-tight font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                  Văn hóa<br />bản địa
                </span>
              </div>

              {/* Feature 4 */}
              <div className="flex flex-col items-center text-center space-y-1.5 group cursor-pointer">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--emerald)] group-hover:scale-110 transition-transform">
                  <Camera size={20} strokeWidth={1.75} />
                </div>
                <span className="text-[11px] sm:text-xs leading-tight font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                  Trải nghiệm<br />chân thực
                </span>
              </div>
            </div>
          </div>

          {/* COLUMN 3: KHÁM PHÁ (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2 flex items-center gap-1.5">
              <span>KHÁM PHÁ</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-[var(--text-secondary)]">
              <li>
                <Link to="/feed" className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors group">
                  <MapPin size={14} className="text-[var(--text-muted)] group-hover:text-[var(--gold)] transition-colors" />
                  <span>Điểm du lịch</span>
                </Link>
              </li>
              <li>
                <Link to="/map" className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors group">
                  <Map size={14} className="text-[var(--text-muted)] group-hover:text-[var(--gold)] transition-colors" />
                  <span>Bản đồ tương tác</span>
                </Link>
              </li>
              <li>
                <Link to="/culture-guide" className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors group">
                  <BookOpen size={14} className="text-[var(--text-muted)] group-hover:text-[var(--gold)] transition-colors" />
                  <span>Cẩm nang du lịch</span>
                </Link>
              </li>
              <li>
                <Link to="/feed" className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors group">
                  <Calendar size={14} className="text-[var(--text-muted)] group-hover:text-[var(--gold)] transition-colors" />
                  <span>Sự kiện & Lễ hội</span>
                </Link>
              </li>
              <li>
                <Link to="/planner" className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors group">
                  <Compass size={14} className="text-[var(--text-muted)] group-hover:text-[var(--gold)] transition-colors" />
                  <span>Gợi ý hành trình</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 4: TIỆN ÍCH (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
              TIỆN ÍCH
            </h4>
            <ul className="space-y-2.5 text-xs text-[var(--text-secondary)]">
              <li>
                <Link to="/chat" className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors group">
                  <Bot size={14} className="text-[var(--teal)] group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-[var(--text-primary)]">AI Travel Assistant</span>
                </Link>
              </li>
              <li>
                <Link to="/map" className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors group">
                  <Globe size={14} className="text-[var(--text-muted)] group-hover:text-[var(--gold)] transition-colors" />
                  <span>Social Map</span>
                </Link>
              </li>
              <li>
                <Link to="/saved" className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors group">
                  <Heart size={14} className="text-[var(--text-muted)] group-hover:text-[var(--rose)] transition-colors" />
                  <span>Yêu thích</span>
                </Link>
              </li>
              <li>
                <Link to="/planner" className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors group">
                  <History size={14} className="text-[var(--text-muted)] group-hover:text-[var(--gold)] transition-colors" />
                  <span>Lịch sử hành trình</span>
                </Link>
              </li>
              <li>
                <Link to="/feed" className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors group">
                  <Star size={14} className="text-[var(--text-muted)] group-hover:text-[var(--amber)] transition-colors" />
                  <span>Đánh giá & Nhận xét</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 5: CỘNG ĐỒNG (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
              CỘNG ĐỒNG
            </h4>
            <ul className="space-y-2.5 text-xs text-[var(--text-secondary)]">
              <li>
                <Link to="/feed" className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors group">
                  <FileText size={14} className="text-[var(--text-muted)] group-hover:text-[var(--gold)] transition-colors" />
                  <span>Bài viết nổi bật</span>
                </Link>
              </li>
              <li>
                <Link to="/feed" className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors group">
                  <Send size={14} className="text-[var(--text-muted)] group-hover:text-[var(--gold)] transition-colors" />
                  <span>Chia sẻ trải nghiệm</span>
                </Link>
              </li>
              <li>
                <Link to="/feed" className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors group">
                  <MessageSquare size={14} className="text-[var(--text-muted)] group-hover:text-[var(--gold)] transition-colors" />
                  <span>Bình luận</span>
                </Link>
              </li>
              <li>
                <Link to="/following" className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors group">
                  <Users size={14} className="text-[var(--text-muted)] group-hover:text-[var(--gold)] transition-colors" />
                  <span>Thành viên</span>
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors group">
                  <Trophy size={14} className="text-[var(--text-muted)] group-hover:text-[var(--amber)] transition-colors" />
                  <span>Bảng xếp hạng</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 6: LIÊN HỆ (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
              LIÊN HỆ
            </h4>
            <ul className="space-y-2.5 text-xs text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-[var(--gold)] shrink-0 mt-0.5" />
                <span>Cần Thơ, Việt Nam</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-[var(--gold)] shrink-0" />
                <a href="mailto:support@terraholic.vn" className="hover:text-[var(--gold)] transition-colors truncate">
                  support@terraholic.vn
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-[var(--gold)] shrink-0" />
                <a href="tel:+84123456789" className="hover:text-[var(--gold)] transition-colors">
                  +84 123 456 789
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock size={14} className="text-[var(--gold)] shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <p className="font-medium text-[var(--text-primary)]">Thứ 2 - Chủ nhật</p>
                  <p className="text-[11px] text-[var(--text-muted)]">8:00 - 22:00</p>
                </div>
              </li>
            </ul>

            {/* CTA Button */}
            <div className="pt-2">
              <button
                onClick={() => setContactModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--gold)] to-[var(--teal)] text-white text-xs font-bold shadow-md hover:shadow-lg hover:opacity-95 transition-all group"
              >
                <Send size={13} className="group-hover:translate-x-0.5 transition-transform" />
                <span>Liên hệ với chúng tôi</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── MIDDLE SECTION: Socials - Slogan Quote - Newsletter ── */}
        <div className="py-8 border-b border-[var(--border-subtle)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative">
          
          {/* Left: Connect With Us & Social Icons (lg:col-span-3) */}
          <div className="lg:col-span-3 space-y-3 text-center lg:text-left">
            <h5 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
              Kết nối với chúng tôi
            </h5>
            <div className="flex items-center justify-center lg:justify-start gap-2.5">
              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-normal)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-[#1877F2] hover:border-[#1877F2] transition-all shadow-sm group"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-normal)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 hover:border-transparent transition-all shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* TikTok */}
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
                className="w-9 h-9 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-normal)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-black hover:border-zinc-700 transition-all shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.67 2.58-4.96 1.66-1.47 3.97-2.12 6.16-1.76v4.08c-.96-.26-2.02-.15-2.91.31-.83.42-1.49 1.17-1.75 2.07-.3.97-.13 2.05.42 2.9.52.84 1.41 1.4 2.39 1.52.93.13 1.89-.09 2.68-.6.76-.48 1.3-1.27 1.47-2.14.07-.46.07-.94.07-1.41.01-4.99.01-9.97.01-14.96z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-normal)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-[#FF0000] hover:border-[#FF0000] transition-all shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              {/* GitHub */}
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="w-9 h-9 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-normal)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Center: Vietnamese Slogan Quote & Stylized Vector Art (lg:col-span-5) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center text-center space-y-2">
            <p className="font-editorial text-sm sm:text-base italic text-[var(--gold)] font-medium tracking-wide">
              "Đi để cảm nhận – Ăn để nhớ – Chia sẻ để kết nối" <Heart size={14} className="inline text-rose-500 fill-current animate-pulse ml-0.5" />
            </p>

            {/* Landmark Vector Line Art Illustration */}
            <div className="w-full max-w-sm h-12 flex items-center justify-center opacity-40 hover:opacity-75 transition-opacity text-[var(--text-secondary)]">
              <svg className="w-full h-full stroke-current" viewBox="0 0 400 40" fill="none">
                {/* Pagoda silhouette */}
                <path d="M40 38 V 24 L 50 18 L 60 24 V 38 M 44 24 H 56 M 48 30 H 52 M 35 38 H 65" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M50 12 L 42 18 H 58 Z" strokeWidth="1.2" />

                {/* Dotted connecting wave line */}
                <path d="M 68 35 Q 110 32, 140 35" strokeWidth="1" strokeDasharray="3 3" />

                {/* Cable stayed bridge */}
                <path d="M 140 38 L 170 15 L 200 38" strokeWidth="1.5" />
                <path d="M 170 15 V 38" strokeWidth="1.5" />
                <path d="M 170 20 L 150 38 M 170 20 L 190 38 M 170 26 L 160 38 M 170 26 L 180 38" strokeWidth="1" />
                <path d="M 130 38 H 210" strokeWidth="1.2" />

                {/* Dotted connecting wave line */}
                <path d="M 212 35 Q 240 32, 270 35" strokeWidth="1" strokeDasharray="3 3" />

                {/* Sun Ferris Wheel */}
                <circle cx="310" cy="24" r="12" strokeWidth="1.2" />
                <circle cx="310" cy="24" r="2" strokeWidth="1.5" />
                <path d="M 310 12 V 36 M 298 24 H 322 M 301 15 L 319 33 M 301 33 L 319 15" strokeWidth="0.8" />
                <path d="M 302 36 L 310 24 L 318 36" strokeWidth="1.2" />
                <path d="M 290 38 H 330" strokeWidth="1.2" />
              </svg>
            </div>
          </div>

          {/* Right: Newsletter Subscription (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-2">
            <h5 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
              Đăng ký nhận bản tin
            </h5>
            <p className="text-xs text-[var(--text-muted)]">
              Nhận ngay những gợi ý du lịch & ẩm thực mới nhất
            </p>

            <form onSubmit={handleSubscribe} className="relative mt-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn..."
                className="w-full pl-3.5 pr-12 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-normal)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] transition-all"
              />
              <button
                type="submit"
                aria-label="Đăng ký"
                className="absolute right-1 top-1 bottom-1 px-3 rounded-lg bg-gradient-to-r from-[var(--gold)] to-[var(--teal)] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow"
              >
                <Send size={13} />
              </button>
            </form>

            {subscribed && (
              <p className="text-[11px] text-[var(--emerald)] flex items-center gap-1 font-medium animate-fade-in">
                <CheckCircle size={12} />
                <span>Cảm ơn bạn! Đã đăng ký nhận bản tin thành công.</span>
              </p>
            )}
          </div>
        </div>

        {/* ── BOTTOM BAR: Copyright & Legal ── */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[var(--text-muted)]">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
            <span>© 2026 Terraholic. All Rights Reserved.</span>
            <span className="hidden sm:inline opacity-40">|</span>
            <span className="flex items-center gap-1">
              Made with <Heart size={12} className="text-rose-500 fill-current" /> for Vietnamese Tourism
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setPolicyModalOpen('privacy')}
              className="hover:text-[var(--gold)] transition-colors hover:underline"
            >
              Chính sách bảo mật
            </button>
            <span className="opacity-40">•</span>
            <button
              onClick={() => setPolicyModalOpen('terms')}
              className="hover:text-[var(--gold)] transition-colors hover:underline"
            >
              Điều khoản sử dụng
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTACT MODAL ── */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-normal)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setContactModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--gold)]/10 text-[var(--gold)] flex items-center justify-center">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">Gửi tin nhắn cho Terraholic</h3>
                <p className="text-xs text-[var(--text-muted)]">Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7</p>
              </div>
            </div>

            {contactSent ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle size={40} className="text-[var(--emerald)] mx-auto animate-bounce" />
                <h4 className="font-bold text-sm text-[var(--text-primary)]">Đã gửi lời nhắn thành công!</h4>
                <p className="text-xs text-[var(--text-secondary)]">
                  Cảm ơn bạn đã liên hệ. Đội ngũ Terraholic sẽ phản hồi qua email sớm nhất.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendContact} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Nội dung lời nhắn
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Nhập thắc mắc, góp ý hoặc yêu cầu hỗ trợ của bạn..."
                    className="w-full p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-normal)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold)] transition-all resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setContactModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--gold)] to-[var(--teal)] text-white text-xs font-bold shadow hover:opacity-90 transition-opacity"
                  >
                    Gửi ngay
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── PRIVACY / TERMS MODAL ── */}
      {policyModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-normal)] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col relative">
            <button
              onClick={() => setPolicyModalOpen(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--gold)]/10 text-[var(--gold)] flex items-center justify-center">
                {policyModalOpen === 'privacy' ? <ShieldCheck size={20} /> : <TermIcon size={20} />}
              </div>
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  {policyModalOpen === 'privacy' ? 'Chính sách bảo mật' : 'Điều khoản sử dụng'}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Nền tảng Terraholic Travel System</p>
              </div>
            </div>

            <div className="overflow-y-auto space-y-3 text-xs text-[var(--text-secondary)] leading-relaxed pr-2 border-y border-[var(--border-subtle)] py-4 my-2">
              {policyModalOpen === 'privacy' ? (
                <>
                  <p className="font-semibold text-[var(--text-primary)]">1. Thu thập thông tin</p>
                  <p>
                    Terraholic cam kết bảo vệ thông tin cá nhân của người dùng. Chúng tôi chỉ thu thập các dữ liệu cần thiết như địa điểm check-in, lịch sử chuyến đi và tài khoản để nâng cao trải nghiệm gợi ý AI.
                  </p>
                  <p className="font-semibold text-[var(--text-primary)]">2. Bảo mật dữ liệu & Quyền riêng tư</p>
                  <p>
                    Mọi dữ liệu vị trí trên Social Map chỉ được chia sẻ công khai khi người dùng đồng ý. Chúng tôi sử dụng mã hóa tiêu chuẩn và không bán thông tin người dùng cho bên thứ ba.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-[var(--text-primary)]">1. Quyền sở hữu nội dung</p>
                  <p>
                    Người dùng giữ bản quyền bài viết và hình ảnh tải lên Terraholic. Bằng việc đăng tải, bạn cấp quyền cho Terraholic hiển thị nội dung trên nền tảng bản đồ và feed cộng đồng.
                  </p>
                  <p className="font-semibold text-[var(--text-primary)]">2. Quy định cộng đồng</p>
                  <p>
                    Nghiêm cấm đăng tải nội dung sai sự thật về điểm đến, xúc phạm văn hóa địa phương hoặc vi phạm pháp luật Việt Nam.
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPolicyModalOpen(null)}
                className="px-5 py-2 rounded-xl bg-[var(--gold)] text-white text-xs font-bold shadow hover:opacity-90 transition-opacity"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
