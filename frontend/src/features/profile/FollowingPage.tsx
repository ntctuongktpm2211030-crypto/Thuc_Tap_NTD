import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, Search } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

const MOCK_FOLLOWING = [
  { id: '1', name: 'Minh Quân Nguyễn', handle: '@minhquan', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80', trips: 12 },
  { id: '2', name: 'Sarah Lee', handle: '@sarahlee', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80', trips: 8 },
  { id: '3', name: 'Linh Trần', handle: '@linhtran', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80', trips: 15 },
];

export default function FollowingPage() {
  const { t, lang } = useLang();
  const vi = lang === 'vi';
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'following' | 'followers'>('following');

  const list = MOCK_FOLLOWING.filter(u =>
    !query || u.name.toLowerCase().includes(query.toLowerCase()) || u.handle.includes(query.toLowerCase())
  );

  return (
    <div className="profile-page">
      <div className="container-wide py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[var(--gold-glow)] border border-[var(--gold)]/30 flex items-center justify-center text-[var(--gold)]">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{t('userMenu.following')}</h1>
            <p className="text-sm text-[var(--text-muted)]">
              {vi ? 'Người bạn đang theo dõi và người theo dõi bạn' : 'People you follow and your followers'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {(['following', 'followers'] as const).map(key => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                tab === key
                  ? 'bg-[var(--gold)] text-black'
                  : 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]'
              }`}
            >
              {key === 'following' ? (vi ? 'Đang theo dõi' : 'Following') : (vi ? 'Người theo dõi' : 'Followers')}
              <span className="ml-1 opacity-70">({MOCK_FOLLOWING.length})</span>
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={vi ? 'Tìm tên hoặc @handle…' : 'Search name or @handle…'}
            className="input-premium pl-10 w-full"
          />
        </div>

        <div className="profile-section-card space-y-2">
          {list.length === 0 ? (
            <p className="text-center text-sm text-[var(--text-muted)] py-8">{vi ? 'Không tìm thấy.' : 'No results.'}</p>
          ) : (
            list.map(person => (
              <div key={person.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors">
                <img src={person.avatar} alt={person.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-[var(--border-subtle)]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)] truncate">{person.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{person.handle} · {person.trips} {vi ? 'chuyến đi' : 'trips'}</p>
                </div>
                <button type="button" className="btn-outline text-[10px] px-3 py-1.5 flex items-center gap-1">
                  <UserPlus size={12} /> {vi ? 'Đã theo dõi' : 'Following'}
                </button>
              </div>
            ))
          )}
        </div>

        <Link to="/profile" className="inline-block mt-6 text-sm font-semibold text-[var(--gold)] hover:underline">
          ← {vi ? 'Về hồ sơ' : 'Back to profile'}
        </Link>
      </div>
    </div>
  );
}
