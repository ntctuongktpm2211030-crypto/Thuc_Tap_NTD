import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, MapPin, Clock, ChevronRight, Utensils, Landmark,
  Sparkles, Leaf, Calendar, Star,
} from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

const CATEGORIES = [
  { id: 'all', labelVi: 'Tất cả', labelEn: 'All', icon: Sparkles },
  { id: 'culture', labelVi: 'Văn hóa', labelEn: 'Culture', icon: Landmark },
  { id: 'food', labelVi: 'Ẩm thực', labelEn: 'Cuisine', icon: Utensils },
  { id: 'festival', labelVi: 'Lễ hội', labelEn: 'Festivals', icon: Calendar },
  { id: 'tips', labelVi: 'Mẹo trải nghiệm', labelEn: 'Tips', icon: Leaf },
] as const;

const ARTICLES = [
  {
    id: '1',
    category: 'food' as const,
    title: 'Phở Hà Nội — Hương vị buổi sáng của Thủ đô',
    excerpt: 'Từ nước dùng trong veo đến bánh phở mỏng — bí quyết thưởng thức phở đúng cách và quán địa phương được lòng dân Hà Nội.',
    region: 'Hà Nội',
    readMin: 6,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1591814468924-caf38d1232e9?auto=format&fit=crop&w=800&q=80',
    tags: ['Ẩm thực', 'Street food'],
  },
  {
    id: '2',
    category: 'culture' as const,
    title: 'Hội An — Phố cổ và nghề thủ công trăm năm',
    excerpt: 'Đèn lồng, hội An, chùa Cầu và nhịp sống chậm rãi giữa kiến trúc gỗ mái ngói.',
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
    excerpt: 'Thời điểm, nghi thức và cách tham gia lễ hội Đền Hùng một cách tôn trọng văn hóa.',
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
    excerpt: 'Sự khác biệt giữa bún bò Huế chính gốc và biến thể hiện đại; món ăn kèm không thể thiếu.',
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
    title: 'Ăn đường phố an toàn khi du lịch',
    excerpt: 'Checklist chọn quán, nhận biết vệ sinh và tránh shock văn hóa ẩm thực cho tân thủ.',
    region: 'Toàn quốc',
    readMin: 4,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    tags: ['Mẹo hay', 'Sức khỏe'],
  },
];

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
    <div className="culture-guide-page">
      <section className="culture-guide-hero">
        <div className="container-wide culture-guide-hero-inner">
          <div className="culture-guide-hero-text">
            <span className="culture-guide-kicker">
              <Utensils size={14} /> {vi ? 'SmartTravel Guide' : 'SmartTravel Guide'}
            </span>
            <h1 className="culture-guide-title">
              {vi ? 'Cẩm nang văn hóa — ẩm thực' : 'Culture & Culinary Guide'}
            </h1>
            <p className="culture-guide-subtitle">
              {vi
                ? 'Khám phá di sản, lễ hội và hương vị địa phương trước mỗi chuyến đi. Nội dung được biên soạn cho du khách yêu văn hóa Việt Nam.'
                : 'Explore heritage, festivals and local flavors before every trip. Curated for culture-loving travellers in Vietnam.'}
            </p>
            <div className="culture-guide-search">
              <Search size={18} className="culture-guide-search-icon" />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={vi ? 'Tìm món ăn, địa danh, lễ hội…' : 'Search dishes, places, festivals…'}
              />
            </div>
          </div>
          <div className="culture-guide-hero-stats">
            {[
              { n: '120+', l: vi ? 'Bài cẩm nang' : 'Articles' },
              { n: '34', l: vi ? 'Tỉnh thành' : 'Provinces' },
              { n: '4.8', l: vi ? 'Đánh giá TB' : 'Avg rating' },
            ].map(s => (
              <div key={s.l} className="culture-guide-stat">
                <span className="culture-guide-stat-n">{s.n}</span>
                <span className="culture-guide-stat-l">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container-wide culture-guide-body">
        <div className="culture-guide-filters">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const label = vi ? cat.labelVi : cat.labelEn;
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`culture-guide-filter ${active ? 'culture-guide-filter--active' : ''}`}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </div>

        <div className="culture-guide-grid">
          {filtered.map(article => (
            <article key={article.id} className="culture-guide-card">
              <div className="culture-guide-card-image">
                <img src={article.image} alt={article.title} loading="lazy" />
                <span className="culture-guide-card-badge">
                  {CATEGORIES.find(c => c.id === article.category)?.[vi ? 'labelVi' : 'labelEn']}
                </span>
              </div>
              <div className="culture-guide-card-body">
                <div className="culture-guide-card-meta">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {article.region}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {article.readMin} {vi ? 'phút' : 'min'}</span>
                  <span className="flex items-center gap-1 text-amber-600"><Star size={12} className="fill-current" /> {article.rating}</span>
                </div>
                <h2 className="culture-guide-card-title">{article.title}</h2>
                <p className="culture-guide-card-excerpt">{article.excerpt}</p>
                <div className="culture-guide-card-tags">
                  {article.tags.map(tag => (
                    <span key={tag} className="culture-guide-tag">{tag}</span>
                  ))}
                </div>
                <button type="button" className="culture-guide-read-btn">
                  {vi ? 'Đọc cẩm nang' : 'Read guide'} <ChevronRight size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="culture-guide-empty">{vi ? 'Không tìm thấy bài phù hợp.' : 'No matching articles.'}</p>
        )}

        <div className="culture-guide-cta">
          <div>
            <h3>{vi ? 'Có câu chuyện riêng?' : 'Have your own story?'}</h3>
            <p>{vi ? 'Chia sẻ hành trình và món ăn yêu thích với cộng đồng SmartTravel.' : 'Share your journey and favorite dishes with the community.'}</p>
          </div>
          <Link to="/journeys/create" className="culture-guide-cta-btn">
            {vi ? 'Đăng hành trình' : 'Share journey'} <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
