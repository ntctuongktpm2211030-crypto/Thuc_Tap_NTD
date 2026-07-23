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
    <div className="relative min-h-screen bg-slate-50/80 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans overflow-hidden animate-fade-in">
      {/* ── Travel Geo-Grid & Pattern Vector Overlay ── */}
      <svg className="absolute inset-0 w-full h-full opacity-25 dark:opacity-10 pointer-events-none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="travel-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <circle cx="40" cy="40" r="1.5" className="fill-brand-500/50" />
            <path d="M0 40H80M40 0V80" strokeWidth="0.5" strokeDasharray="6 6" className="stroke-slate-300 dark:stroke-slate-800" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#travel-grid)" />
      </svg>

      {/* ── Background Compass & Flight Arc Vector Artwork ── */}
      <svg className="absolute top-12 right-12 w-96 h-96 opacity-15 dark:opacity-10 text-brand-500 pointer-events-none" viewBox="0 0 200 200" fill="none" stroke="currentColor">
        <circle cx="100" cy="100" r="80" strokeWidth="1" strokeDasharray="6 6" />
        <circle cx="100" cy="100" r="60" strokeWidth="0.5" />
        <path d="M100 10 L100 190 M10 100 L190 100" strokeWidth="1" />
        <polygon points="100,20 108,92 180,100 108,108 100,180 92,108 20,100 92,92" fill="currentColor" opacity="0.2" />
      </svg>

      {/* ── Multi-Layer Vibrant Ambient Glow Mesh ── */}
      <div className="absolute top-10 left-10 w-[700px] h-[700px] bg-gradient-to-tr from-brand-500/20 via-sky-500/15 to-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[500px] right-10 w-[600px] h-[600px] bg-gradient-to-bl from-purple-600/18 via-pink-500/15 to-amber-500/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[550px] h-[550px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 space-y-6 max-w-[1750px] mx-auto">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('userMenu.following')}</h1>
              <p className="text-xs font-medium text-slate-500">
                {vi ? 'Người bạn đang theo dõi và người theo dõi bạn' : 'People you follow and your followers'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {(['following', 'followers'] as const).map(key => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  tab === key
                    ? 'bg-gradient-to-r from-brand-600 to-sky-500 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {key === 'following' ? (vi ? 'Đang theo dõi' : 'Following') : (vi ? 'Người theo dõi' : 'Followers')}
                <span className="ml-1 opacity-80">({MOCK_FOLLOWING.length})</span>
              </button>
            ))}
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={vi ? 'Tìm tên hoặc @handle…' : 'Search name or @handle…'}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-10 pr-4 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="space-y-2">
            {list.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8 font-medium">{vi ? 'Không tìm thấy.' : 'No results.'}</p>
            ) : (
              list.map(person => (
                <div key={person.id} className="flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800/60 transition-all">
                  <img src={person.avatar} alt={person.name} className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{person.name}</p>
                    <p className="text-[11px] font-semibold text-slate-400">{person.handle} · {person.trips} {vi ? 'chuyến đi' : 'trips'}</p>
                  </div>
                  <button type="button" className="px-4 py-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
                    <UserPlus size={14} />
                    <span>{vi ? 'Đã theo dõi' : 'Following'}</span>
                  </button>
                </div>
              ))
            )}
          </div>

          <Link to="/profile" className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline">
            ← {vi ? 'Về hồ sơ' : 'Back to profile'}
          </Link>
        </div>
      </div>
    </div>
  );
}
