import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Settings, Globe, Bell, Shield } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import type { RootState } from '../../store';

export default function SettingsPage() {
  const { t, lang, setLang } = useLang();
  const { isDark, toggleTheme } = useTheme();
  const user = useSelector((s: RootState) => s.auth.user);
  const vi = lang === 'vi';

  return (
    <div className="profile-page">
      <div className="container-wide py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Settings size={22} className="text-[var(--gold)]" />
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{t('userMenu.settings')}</h1>
        </div>

        <div className="profile-section-card space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-[var(--text-muted)]" />
              <span className="text-sm font-semibold">{vi ? 'Ngôn ngữ' : 'Language'}</span>
            </div>
            <div className="flex rounded-full border border-[var(--border-subtle)] overflow-hidden">
              {(['vi', 'en'] as const).map(l => (
                <button key={l} type="button" onClick={() => setLang(l)}
                  className={`px-3 py-1 text-xs font-bold ${lang === l ? 'bg-[var(--gold)] text-black' : 'text-[var(--text-muted)]'}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-[var(--text-muted)]" />
              <span className="text-sm font-semibold">{vi ? 'Giao diện' : 'Theme'}</span>
            </div>
            <button type="button" onClick={toggleTheme} className="btn-outline text-xs px-3 py-1.5">
              {isDark ? (vi ? 'Sáng' : 'Light') : (vi ? 'Tối' : 'Dark')}
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-[var(--text-muted)]" />
              <span className="text-sm font-semibold">Email</span>
            </div>
            <span className="text-xs text-[var(--text-muted)]">{user?.email}</span>
          </div>
        </div>

        <Link to="/profile" className="inline-block mt-6 text-sm font-semibold text-[var(--gold)] hover:underline">
          ← {vi ? 'Về hồ sơ' : 'Back to profile'}
        </Link>
      </div>
    </div>
  );
}
