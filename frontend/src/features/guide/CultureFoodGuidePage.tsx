import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, MapPin, Clock, ChevronRight, Utensils, Landmark,
  Sparkles, Calendar, Star, BookOpen, Compass, ShieldCheck, Flame
} from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { ModernIconPod } from '../../config/modernIcons';
import guideVideo from '../../../../video.mp4';

const CATEGORIES = [
  { id: 'all', labelVi: 'Tất cả', labelEn: 'All', icon: Sparkles, variant: 'brand' as const },
  { id: 'culture', labelVi: 'Văn hóa', labelEn: 'Culture', icon: Landmark, variant: 'violet' as const },
  { id: 'food', labelVi: 'Ẩm thực', labelEn: 'Cuisine', icon: Utensils, variant: 'amber' as const },
  { id: 'festival', labelVi: 'Lễ hội', labelEn: 'Festivals', icon: Calendar, variant: 'rose' as const },
  { id: 'tips', labelVi: 'Mẹo du lịch', labelEn: 'Tips', icon: BookOpen, variant: 'emerald' as const },
] as const;

const ARTICLES = [
  {
    id: '1',
    category: 'food' as const,
    title: 'Phở Hà Nội — Hương vị buổi sáng của Thủ đô',
    excerpt: 'Từ nước dùng trong veo đến bánh phở nạc — bí quyết thưởng thức phở đúng cách và quán địa phương được lòng dân Hà Nội.',
    region: 'Hà Nội',
    readMin: 6,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    tags: ['Ẩm thực', 'Đồ ăn đường phố'],
  },
  {
    id: '2',
    category: 'culture' as const,
    title: 'Hội An — Phố cổ và nghề thủ công trăm năm',
    excerpt: 'Lồng đèn Hội An, chùa Cầu và nhịp sống chậm rãi giữa kiến trúc gỗ mái ngói.',
    region: 'Quảng Nam',
    readMin: 8,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
    tags: ['Di sản', 'Kiến trúc'],
  },
  {
    id: '3',
    category: 'festival' as const,
    title: 'Lễ hội Đền Hùng — Cội nguồn dân tộc',
    excerpt: 'Thời điểm, nghi thức và cách tham gia lễ hội Đền Hùng một cách trọn vẹn và trang nghiêm.',
    region: 'Phú Thọ',
    readMin: 5,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=800&q=80',
    tags: ['Lễ hội', 'Tâm linh'],
  },
  {
    id: '4',
    category: 'food' as const,
    title: 'Bún bò Huế — Cay nồng xứ cố đô',
    excerpt: 'Sự khác biệt giữa bún bò Huế chính gốc và biến thể hiện đại; không thể thiếu món ăn kèm theo.',
    region: 'Huế',
    readMin: 7,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
    tags: ['Ẩm thực', 'Miền Trung'],
  },
  {
    id: '5',
    category: 'culture' as const,
    title: 'Nhà hát Tuồng — Nghệ thuật sân khấu truyền thống',
    excerpt: 'Giới thiệu các vai diễn, trang phục và địa điểm xem tuồng tại TP.HCM và miền Trung.',
    region: 'Việt Nam',
    readMin: 9,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80',
    tags: ['Nghệ thuật', 'Biểu diễn'],
  },
  {
    id: '6',
    category: 'tips' as const,
    title: 'Ăn đường phố an toàn theo lịch trình',
    excerpt: 'Bí quyết lựa chọn quán ăn, nhận biết vệ sinh an toàn thực phẩm và tránh sốc văn hóa ẩm thực cho người mới.',
    region: 'Toàn quốc',
    readMin: 4,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    tags: ['Mẹo hay', 'Sức khỏe'],
  },
];

const BADGE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  food: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
  culture: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/20' },
  festival: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20' },
  tips: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
};

export default function CultureFoodGuidePage() {
  const { lang } = useLang();
  const vi = lang === 'vi';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');

  const filtered = ARTICLES.filter(a => {
    const matchCat = category === 'all' || a.category === category;
    const q = query.toLowerCase();
    const matchQ = !q || a.title.toLowerCase().includes(q) || a.region.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <div className="relative min-h-screen bg-slate-50/60 dark:bg-slate-950 pb-20 overflow-hidden">
      {/* ── Ambient Background Mesh & Glow Effects ── */}
      <div className="absolute top-10 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-brand-500/15 via-sky-500/10 to-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-96 right-10 w-[500px] h-[500px] bg-gradient-to-tl from-emerald-500/10 via-brand-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Subtle Travel Compass SVG Overlay Watermark */}
      <div className="absolute top-20 right-1/4 opacity-5 pointer-events-none hidden lg:block text-brand-600 dark:text-brand-400">
        <Compass size={400} className="animate-spin-slow stroke-[1]" />
      </div>

      <div className="relative z-10 container-wide pt-6">
        {/* Cinematic Hero Header Banner */}
        <section className="relative w-full rounded-[2.5rem] overflow-hidden mb-10 py-14 sm:py-20 shadow-2xl border border-slate-200/50 dark:border-slate-800/80 flex items-center">
          {/* Background Video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0 filter brightness-90"
          >
            <source src={guideVideo} type="video/mp4" />
          </video>

          {/* Premium Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/40 z-10" />

          <div className="relative z-20 px-6 sm:px-12 flex flex-col lg:flex-row justify-between items-center gap-10 text-white w-full">
            
            <div className="flex-1 space-y-6 max-w-2xl w-full">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-xs font-bold tracking-wider uppercase shadow-lg">
                <ModernIconPod icon={Utensils} variant="amber" size="sm" />
                <span>{vi ? 'HƯỚNG DẪN DU LỊCH THÔNG MINH' : 'SMART TRAVEL GUIDE'}</span>
              </div>
              
              <h1 className="font-editorial text-3.5xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white drop-shadow-sm">
                {vi ? 'Cẩm Nang Văn Hóa & Ẩm Thực' : 'Culture & Culinary Guide'}
              </h1>
              
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-medium max-w-xl">
                {vi
                  ? 'Khám phá di sản phong phú, lễ hội rực rỡ và nghệ thuật ẩm thực độc đáo Việt Nam trước mỗi chuyến đi cùng Smart Travel.'
                  : 'Explore rich heritage, vibrant festivals, and unique culinary art of Vietnam before every voyage with Smart Travel.'}
              </p>
              
              {/* Search Box & Action Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 max-w-xl w-full">
                <div className="relative flex-1 group">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-400 transition-colors" />
                  <input
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={vi ? 'Tìm món ăn, địa danh, lễ hội...' : 'Search dishes, places, festivals...'}
                    className="w-full bg-slate-900/80 backdrop-blur-xl border border-white/20 focus:border-brand-400 focus:bg-slate-900/95 rounded-2xl py-4 pl-12 pr-4 text-xs sm:text-sm placeholder-slate-400 text-white focus:outline-none focus:ring-4 focus:ring-brand-500/20 shadow-2xl transition-all duration-300"
                  />
                </div>
                <Link
                  to="/journeys/create"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-sky-500 to-blue-600 hover:from-brand-500 hover:to-sky-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-brand-600/30 transition-all duration-300 hover:-translate-y-0.5 justify-center shrink-0 group"
                >
                  {vi ? 'Chia sẻ trải nghiệm' : 'Share experience'}
                  <ChevronRight size={16} className="stroke-[2.5px] group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Glassmorphic Stats Cards */}
            <div className="flex flex-wrap sm:flex-nowrap gap-4 justify-center lg:justify-end w-full lg:w-auto">
              {[
                { n: '120+', l: vi ? 'BÀI VIẾT' : 'ARTICLES', icon: BookOpen, variant: 'sky' as const },
                { n: '34', l: vi ? 'TỈNH THÀNH' : 'PROVINCES', icon: MapPin, variant: 'emerald' as const },
                { n: '4.9', l: vi ? 'ĐÁNH GIÁ TB' : 'AVG RATING', icon: Star, variant: 'amber' as const },
              ].map(s => (
                <div
                  key={s.l}
                  className="group relative overflow-hidden bg-white/10 dark:bg-slate-900/40 backdrop-blur-xl border border-white/15 hover:border-white/30 rounded-3xl p-5 text-center shadow-2xl flex-1 sm:flex-initial sm:w-[140px] flex flex-col justify-center items-center transition-all duration-300 hover:-translate-y-1"
                >
                  <ModernIconPod icon={s.icon} variant={s.variant} size="sm" className="mb-2" />
                  <span className="text-white font-black text-2.5xl sm:text-3xl tracking-tight drop-shadow-sm">{s.n}</span>
                  <span className="text-[10px] font-bold text-slate-300 tracking-wider uppercase mt-1">{s.l}</span>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── Category Filters (Modern 3D Icon Pod Pills) ── */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-10 scrollbar-none">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const label = vi ? cat.labelVi : cat.labelEn;
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`group inline-flex items-center gap-3 px-5 py-3 rounded-2xl text-xs font-extrabold transition-all duration-300 cursor-pointer shrink-0 ${
                  active
                    ? 'bg-gradient-to-r from-brand-600 to-sky-500 text-white shadow-xl shadow-brand-500/25 ring-2 ring-brand-400/40 scale-102'
                    : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 hover:border-brand-500/40 hover:bg-white dark:hover:bg-slate-900 hover:shadow-lg'
                }`}
              >
                <ModernIconPod
                  icon={Icon}
                  variant={active ? 'glass' : cat.variant}
                  active={active}
                  size="sm"
                />
                <span className="tracking-wide">{label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Articles Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(article => {
            const badgeStyle = BADGE_STYLES[article.category] || BADGE_STYLES.food;
            return (
              <article
                key={article.id}
                className="group relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-brand-500/10 hover:-translate-y-1.5 transition-all duration-400 flex flex-col h-full"
              >
                {/* Image & Category Pill */}
                <div className="aspect-[16/10] relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-80" />

                  <span
                    className={`absolute top-4 left-4 text-[10px] font-black px-3 py-1.5 rounded-xl backdrop-blur-md border shadow-lg uppercase tracking-wider ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                  >
                    {CATEGORIES.find(c => c.id === article.category)?.[vi ? 'labelVi' : 'labelEn']}
                  </span>

                  <div className="absolute bottom-3 right-4 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md text-amber-400 px-2.5 py-1 rounded-lg border border-amber-500/30 text-xs font-bold shadow-lg">
                    <Star size={13} className="fill-current text-amber-400" />
                    <span>{article.rating}</span>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Meta info row */}
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-brand-500" />
                        {article.region}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} className="text-slate-500 dark:text-slate-400" />
                        {article.readMin} {vi ? 'phút đọc' : 'min read'}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-slate-900 dark:text-white font-extrabold text-lg leading-snug mb-3 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {article.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mb-5 line-clamp-3 font-medium">
                      {article.excerpt}
                    </p>
                  </div>

                  <div>
                    {/* Tag list */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {article.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Read Action Button */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="text-brand-600 dark:text-brand-400 font-extrabold text-xs inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all cursor-pointer">
                        {vi ? 'Khám phá ngay' : 'Explore guide'}
                        <ChevronRight size={14} className="stroke-[2.5px] transition-transform" />
                      </span>

                      <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Compass size={14} />
                      </div>
                    </div>
                  </div>

                </div>
              </article>
            );
          })}
        </div>

        {/* Empty Search Result Fallback */}
        {filtered.length === 0 && (
          <div className="text-center py-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 mb-4">
              <Search size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {vi ? 'Không tìm thấy kết quả phù hợp' : 'No matching results found'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
              {vi ? 'Hãy thử tìm kiếm với từ khóa khác hoặc chuyển danh mục.' : 'Try searching with a different keyword or category.'}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
