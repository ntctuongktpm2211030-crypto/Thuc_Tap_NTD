import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, MapPin, Clock, ChevronRight, Utensils, Landmark,
  Sparkles, Calendar, Star, BookOpen,
} from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

const CATEGORIES = [
  { id: 'all', labelVi: 'cả', labelEn: 'All', icon: Sparkles },
  { id: 'culture', labelVi: 'Văn phòng', labelEn: 'Culture', icon: Landmark },
  { id: 'food', labelVi: 'Ẩm thực', labelEn: 'Cuisine', icon: Utensils },
  { id: 'festival', labelVi: 'Lễ hội', labelEn: 'Festivals', icon: Calendar },
  { id: 'tips', labelVi: 'kinh nghiệm pháp lý', labelEn: 'Tips', icon: BookOpen },
] as const;

const ARTICLES = [
  {
    id: '1',
    category: 'food' as const,
    title: 'Phở Hà Nội — Hương vị buổi sáng của Thủ đô',
    excerpt: 'Từ nước dùng trong veo đến bánh phở nạc — bi quyết thưởng thức thực phở đúng cách và quán địa phương được lòng dân Hà Nội.',
    region: 'Hà Nội',
    readMin: 6,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    tags: ['Ẩm thực', 'Đồ ăn đường phố'],
  },
  {
    id: '2',
    category: 'culture' as const,
    title: 'Hội An — Phố cổ và nghệ thủ công công công trăm năm',
    excerpt: 'Lồng đèn, hội An, chùa Cầu và nhịp sống chậm rãi giữa kiến trúc gỗ mái ngói.',
    region: 'Quảng Nam',
    readMin: 8,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
    tags: ['Di', 'Kiến trúc'],
  },
  {
    id: '3',
    category: 'festival' as const,
    title: 'Lễ hội Đền Hùng — Cội nguồn dân tộc',
    excerpt: 'Thời điểm, nghi thức và cách tham gia lễ hội Đền Hùng một cách tôn giáo trong văn hóa.',
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
    title: 'Nhà hát Tượng — Nghệ thuật sân khấu truyền thống',
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
    excerpt: 'Danh sách kiểm tra lựa chọn quán, nhận biết bao vệ sinh và tránh sốc văn hóa ẩm thực cho tân thủ.',
    region: 'toàn quốc',
    readMin: 4,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    tags: ['Mẹo hay', 'Sức khỏe'],
  },
];

const BADGE_STYLES: Record<string, string> = {
  food: 'bg-amber-100 text-amber-800 border border-amber-200',
  culture: 'bg-orange-50 text-orange-800 border border-orange-200',
  festival: 'bg-rose-100 text-rose-800 border border-rose-200',
  tips: 'bg-teal-50 text-teal-800 border border-teal-200',
};

const TAG_STYLES: Record<string, string> = {
  food: 'bg-orange-50 text-orange-700 border border-orange-100',
  culture: 'bg-amber-50 text-amber-800 border border-amber-100',
  festival: 'bg-rose-50/70 text-rose-700 border border-rose-100',
  tips: 'bg-teal-50/70 text-teal-700 border border-teal-100',
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
    <div className="min-h-screen bg-slate-50/50 pb-16">
      
      {/* Light Blue Curved Hero Header Banner */}
      <section className="bg-gradient-to-b from-[#e0f2fe]/50 to-[#eff6ff]/70 rounded-b-[40px] border-b border-blue-100/40">
        <div className="container-wide py-10 sm:py-14 flex flex-col lg:flex-row justify-between items-center gap-8">
          
          <div className="flex-1 space-y-4 max-w-2xl w-full">
            <span className="text-[#ea580c] font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Utensils size={14} className="stroke-[3px]" /> 
              {vi ? 'HƯỚNG DẪN DU LỊCH THÔNG MINH' : 'SMART TRAVEL GUIDE'}
            </span>
            
            <h1 className="font-editorial text-3xl sm:text-4.5xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
              {vi ? 'Cẩm nang văn hóa — ẩm thực' : 'Culture & Culinary Guide'}
            </h1>
            
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {vi
                ? 'Khám phá di sản, lễ hội và hương vị địa phương trước mỗi chuyến đi. Nội dung được biên soạn cho du khách yêu văn hóa Việt Nam.'
                : 'Explore heritage, festivals and local flavors before every trip. Curated for culture-loving travellers in Vietnam.'}
            </p>
            
            {/* Search Box */}
            <div className="relative max-w-md w-full pt-2">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={vi ? 'Tìm món ăn, địa danh, lễ hội...' : 'Search dishes, places, festivals...'}
                className="w-full bg-white border border-amber-300 rounded-xl py-3 pl-11 pr-4 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent shadow-sm text-slate-800 transition-all duration-200"
              />
            </div>
          </div>

          {/* Stats Boxes (aligned right) */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4 justify-center lg:justify-end w-full lg:w-auto">
            {[
              { n: '120+', l: vi ? 'BÀI VIẾT VỀ NANG' : 'ARTICLES' },
              { n: '34', l: vi ? 'TỈNH THÀNH' : 'PROVINCES' },
              { n: '4.8', l: vi ? 'ĐÁNH GIÁ TB' : 'AVG RATING' },
            ].map(s => (
              <div key={s.l} className="bg-white border border-amber-200/50 rounded-2xl p-5 text-center shadow-[0_4px_12px_rgba(245,158,11,0.04)] flex-1 sm:flex-initial sm:w-[130px] flex flex-col justify-center items-center">
                <span className="text-orange-500 font-black text-2xl sm:text-3.5xl tracking-tight">{s.n}</span>
                <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase mt-1.5">{s.l}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Main Body */}
      <div className="container-wide py-8">
        
        {/* Category Filters (Pills) */}
        <div className="flex flex-wrap gap-2.5 mb-8">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const label = vi ? cat.labelVi : cat.labelEn;
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                  active 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10 border-transparent hover:bg-blue-700' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon size={14} className={active ? 'text-white' : 'text-slate-500'} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(article => (
            <article key={article.id} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
              
              {/* Image & Badge */}
              <div className="aspect-[16/10] relative overflow-hidden bg-slate-100">
                <img src={article.image} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
                <span className={`absolute top-3.5 left-3.5 text-[9px] font-black px-2.5 py-1 rounded shadow-sm uppercase tracking-wider ${
                  BADGE_STYLES[article.category] || 'bg-white text-slate-800'
                }`}>
                  {CATEGORIES.find(c => c.id === article.category)?.[vi ? 'labelVi' : 'labelEn']}
                </span>
              </div>
              
              {/* Content body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  
                  {/* Meta items row */}
                  <div className="flex items-center gap-3.5 text-[11px] text-slate-400 font-bold mb-3.5">
                    <span className="flex items-center gap-1"><MapPin size={13} className="text-slate-400" /> {article.region}</span>
                    <span className="flex items-center gap-1"><Clock size={13} className="text-slate-400" /> {article.readMin} {vi ? 'phút' : 'min'}</span>
                    <span className="flex items-center gap-1 text-orange-500"><Star size={13} className="fill-current" /> {article.rating}</span>
                  </div>
                  
                  {/* Title */}
                  <h2 className="text-slate-900 font-black text-sm sm:text-base leading-snug mb-2.5 hover:text-blue-600 transition-colors">
                    {article.title}
                  </h2>
                  
                  {/* Excerpt */}
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>
                </div>

                <div>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {article.tags.map(tag => (
                      <span key={tag} className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        TAG_STYLES[article.category] || 'bg-slate-100 text-slate-700'
                      }`}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Read button link */}
                  <div className="pt-3.5 border-t border-slate-100 flex items-center">
                    <span className="text-orange-500 font-bold text-xs hover:text-orange-600 transition-colors cursor-pointer inline-flex items-center gap-1">
                      {vi ? 'nang hoa quả' : 'Read guide'} <ChevronRight size={13} className="stroke-[2.5px]" />
                    </span>
                  </div>
                </div>

              </div>
            </article>
          ))}
        </div>

        {/* Empty status */}
        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
            <p className="text-slate-500 text-sm font-semibold">{vi ? 'Không tìm thấy bài viết phù hợp.' : 'No matching articles found.'}</p>
          </div>
        )}

        {/* CTA Footer banner */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-sm mt-12">
          <div className="text-center sm:text-left space-y-1">
            <h3 className="text-slate-900 font-black text-lg sm:text-xl">
              {vi ? 'Có câu chuyện riêng tư không?' : 'Have your own story?'}
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-normal">
              {vi ? 'Chia sẻ hành trình và món ăn yêu thích với cộng đồng SmartTravel.' : 'Share your journey and favorite dishes with the community.'}
            </p>
          </div>
          <Link to="/journeys/create" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 w-full sm:w-auto justify-center">
            {vi ? 'Đăng hành trình' : 'Share journey'} <ChevronRight size={15} className="stroke-[2.5px]" />
          </Link>
        </div>

      </div>
    </div>
  );
}
