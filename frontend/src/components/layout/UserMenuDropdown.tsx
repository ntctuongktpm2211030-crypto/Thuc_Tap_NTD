import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Users, Bookmark, Settings, LogOut, ChevronDown,
} from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import type { RootState } from '../../store';
import { useSelector } from 'react-redux';

interface UserMenuDropdownProps {
  onLogout: () => void;
}

export default function UserMenuDropdown({ onLogout }: UserMenuDropdownProps) {
  const { t } = useLang();
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  if (!user) return null;

  const menuItems = [
    { to: '/profile', icon: User, label: t('userMenu.profile') },
    { to: '/profile/following', icon: Users, label: t('userMenu.following') },
    { to: '/profile/saved', icon: Bookmark, label: t('userMenu.saved') },
    { to: '/profile/settings', icon: Settings, label: t('userMenu.settings') },
  ];

  const handleNav = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`user-menu-trigger ${open ? 'user-menu-trigger--open' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--gold)] to-blue-700 flex items-center justify-center text-xs font-black text-white flex-shrink-0">
          <img src={user.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} alt="" className="w-full h-full rounded-full object-cover" />
        </div>
        <span className="text-xs font-semibold text-[var(--text-primary)] hidden lg:block max-w-[100px] truncate">
          {user.fullName}
        </span>
        <ChevronDown size={14} className={`text-[var(--text-muted)] hidden lg:block transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="user-menu-panel" role="menu">
          <div className="user-menu-header">
            <div className="user-menu-avatar overflow-hidden">
              <img src={user.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="user-menu-name">{user.fullName}</p>
              <p className="user-menu-email">{user.email}</p>
            </div>
          </div>

          <div className="user-menu-divider" />

          <nav className="user-menu-list">
            {menuItems.map(({ to, icon: Icon, label }) => (
              <button
                key={to}
                type="button"
                role="menuitem"
                onClick={() => handleNav(to)}
                className="user-menu-item"
              >
                <Icon size={16} strokeWidth={2} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="user-menu-divider" />

          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); onLogout(); }}
            className="user-menu-item user-menu-item--danger"
          >
            <LogOut size={16} />
            <span>{t('nav.signOut')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
