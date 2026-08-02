import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Landmark, BookOpen, Compass, Search, Sparkles,
  Loader2, FileText, ChevronRight
} from 'lucide-react';
import { KnowledgeEngine, normalizeProvinceKey, parseJsonHandbookContent, type KnowledgeItem } from './KnowledgeEngine';
import api from '../../services/api';
import { SearchEngine } from './SearchEngine';
import blogVideo from '../../../../video.mp4';
import { KineticText } from '../../components/ui/kinetic-text';
import {
  PROVINCE_LANDMARK_SLIDESHOW,
  DEFAULT_SLIDESHOW_IMAGES,
  FALLBACK_LANDMARK_IMAGE
} from './ProvinceLandmarkData';
import { ETHNIC_IMAGES_MAPPING } from './EthnicGroupData';



function renderFormattedContent(text: string) {
  if (!text) return null;

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const parseInline = (str: string) => {
    const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-extrabold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-slate-600 dark:text-slate-400">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-2.5 w-full text-left my-2">
      {lines.map((line, idx) => {
        // Headings (e.g. ### Heading)
        if (line.startsWith('#') || line.startsWith('###')) {
          const cleanHeading = line.replace(/^#+\s*/, '').trim();
          return (
            <h4 key={idx} className="text-base sm:text-lg font-black text-blue-700 dark:text-blue-400 mt-5 mb-2 pb-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <span>{cleanHeading}</span>
            </h4>
          );
        }

        // Bullet points (e.g. • Item or - Item)
        if (line.startsWith('•') || line.startsWith('-') || line.startsWith('* ')) {
          const content = line.replace(/^[•\-\*]\s*/, '').trim();
          return (
            <div key={idx} className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-2.5 px-3.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shadow-sm hover:border-blue-300 transition-colors">
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 shrink-0 shadow-sm" />
              <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {parseInline(content)}
              </span>
            </div>
          );
        }

        // Standard Paragraph
        return (
          <p key={idx} className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-normal">
            {parseInline(line)}
          </p>
        );
      })}
    </div>
  );
}

// Interactive Province Card Component: Fixed Main Image by Default, Slideshow Only Starts When Hovered!
function ProvinceCard({
  prov,
  meta,
  onNavigate,
}: {
  prov: { name: string; key: string; itemRealCount: number };
  meta: { images: string[]; tagline: string; category?: string };
  onNavigate: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const imagesList = useMemo(() => {
    return meta.images && meta.images.length > 0 ? meta.images : DEFAULT_SLIDESHOW_IMAGES;
  }, [meta.images]);

  // Rotate images ONLY when the user hovers over the card
  useEffect(() => {
    if (!isHovered || imagesList.length <= 1) {
      setActiveIdx(0); // Reset to primary static image when mouse leaves
      return;
    }
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % imagesList.length);
    }, 1500); // 1.5-second rotation speed when hovered
    return () => clearInterval(interval);
  }, [isHovered, imagesList]);

  return (
    <div
      onClick={onNavigate}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden shadow-lg hover:-translate-y-1 hover:shadow-2xl cursor-pointer transition-all duration-300 group flex flex-col justify-between p-4 text-white bg-slate-800"
    >
      {/* Background Images with Cross-Fade Animation & Hotlink Protection */}
      {imagesList.map((img, i) => (
        <img
          key={i}
          src={img}
          alt={`${prov.name} ${i}`}
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_LANDMARK_IMAGE;
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:scale-105 ${
            i === activeIdx ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-slate-950/20 z-10 pointer-events-none" />

      {/* Top Location Icon, Category Tag & Hover Carousel Dots Indicator */}
      <div className="relative z-20 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] font-bold text-white/90">
          <MapPin size={11} className="text-white shrink-0" />
          <span>{meta.category || 'Thành phố'}</span>
        </div>

        {/* Carousel Indicator Dots shown when hovering */}
        {isHovered && imagesList.length > 1 && (
          <div className="flex items-center gap-1 bg-slate-950/50 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/20 animate-fade-in">
            {imagesList.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIdx ? 'bg-[var(--gold)] w-3' : 'bg-white/50 w-1.5'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Middle Title & Subtitle */}
      <div className="relative z-20 space-y-0.5 my-auto">
        <h4 className="text-xl sm:text-2xl font-black text-white drop-shadow-md tracking-tight transition-colors">
          {prov.name}
        </h4>
        <p className="text-[11px] text-slate-200/90 font-medium drop-shadow">
          {meta.tagline}
        </p>
      </div>

      {/* Bottom Controls Bar (Primary Badge + Circle Arrow Button) */}
      <div className="relative z-20 flex items-center justify-between pt-2">
        <span className="bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1 shadow-md">
          <MapPin size={11} className="shrink-0 text-white" />
          <span>{prov.itemRealCount} mục</span>
        </span>
        <div className="w-8 h-8 rounded-full bg-white text-slate-800 flex items-center justify-center shadow-md group-hover:bg-[var(--gold)] group-hover:text-white transition-all duration-300">
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
}

// Interactive Ethnic Card Component matching ProvinceCard aesthetics
function EthnicCard({
  ethnic,
  onClick,
}: {
  ethnic: KnowledgeItem;
  onClick: () => void;
}) {
  const imageUrl = ETHNIC_IMAGES_MAPPING[ethnic.name.toUpperCase()] || FALLBACK_LANDMARK_IMAGE;

  return (
    <div
      onClick={onClick}
      className="relative aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden shadow-lg hover:-translate-y-1 hover:shadow-2xl cursor-pointer transition-all duration-300 group flex flex-col justify-between p-4 text-white bg-slate-800"
    >
      <img
        src={imageUrl}
        alt={ethnic.name}
        referrerPolicy="no-referrer"
        onError={(e) => {
          (e.target as HTMLImageElement).src = FALLBACK_LANDMARK_IMAGE;
        }}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:scale-105 opacity-100"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-slate-950/20 z-10 pointer-events-none" />

      <div className="relative z-20 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] font-bold text-white/90">
          <BookOpen size={11} className="text-white shrink-0" />
          <span>Văn hóa & Dân tộc</span>
        </div>
      </div>

      <div className="relative z-20 space-y-0.5 my-auto">
        <h4 className="text-xl sm:text-2xl font-black text-white drop-shadow-md tracking-tight transition-colors">
          {ethnic.name}
        </h4>
        <p className="text-[11px] text-slate-200/90 font-medium drop-shadow line-clamp-2">
          {ethnic.content.split('\n')[0]}
        </p>
      </div>

      <div className="relative z-20 flex items-center justify-between pt-2">
        <span className="bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1 shadow-md">
          <Sparkles size={11} className="shrink-0 text-white" />
          <span>Khám phá</span>
        </span>
        <div className="w-8 h-8 rounded-full bg-white text-slate-800 flex items-center justify-center shadow-md group-hover:bg-[var(--gold)] group-hover:text-white transition-all duration-300">
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
}

export default function ExploreHandbookHub() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('TẤT CẢ');
  const [activeEthnicModal, setActiveEthnicModal] = useState<KnowledgeItem | null>(null);

  // Ethnic groups memo
  const ethnicGroups = useMemo(() => KnowledgeEngine.getEthnicGroups(), []);

  const filteredEthnicGroups = useMemo(() => {
    if (!query.trim()) return ethnicGroups;
    const q = query.toLowerCase().trim();
    return ethnicGroups.filter((e: KnowledgeItem) => 
      e.name.toLowerCase().includes(q) || 
      e.title.toLowerCase().includes(q) || 
      e.content.toLowerCase().includes(q)
    );
  }, [ethnicGroups, query]);

  // AI assistant states
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiSelectedProvince, setAiSelectedProvince] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  // Loaded engine statistics
  const stats = useMemo(() => KnowledgeEngine.buildStatistics(), []);
  
  // Paginated provinces states with sessionStorage persistence
  const [handbookPage, setHandbookPage] = useState<number>(() => {
    const saved = sessionStorage.getItem('handbookPage');
    return saved ? parseInt(saved, 10) : 1;
  });
  const itemsPerPage = 9;

  useEffect(() => {
    sessionStorage.setItem('handbookPage', handbookPage.toString());
  }, [handbookPage]);

  // Fetch custom admin handbook documents & parse JSON/Word/PDF/Markdown files into KnowledgeEngine
  useEffect(() => {
    async function loadAdminHandbooks() {
      try {
        const res = await api.get('/admin/handbooks');
        const docs = res.data?.data || [];
        docs.forEach((doc: any) => {
          if (doc.content) {
            const parsed = parseJsonHandbookContent(doc.content, doc.category || doc.fileType || 'AM-THUC');
            KnowledgeEngine.addCustomItems(parsed);
          }
        });
      } catch (err) {
        console.warn('Could not load admin custom handbooks:', err);
      }
    }
    loadAdminHandbooks();
  }, []);

  // Filtered provinces list based on category & real-time search query
  const filteredProvinces = useMemo(() => {
    const canonicalList = KnowledgeEngine.getCanonicalProvincesList();

    let list = canonicalList.map((p: any) => {
      const lookup = PROVINCE_LANDMARK_SLIDESHOW[p.key] || 
                     PROVINCE_LANDMARK_SLIDESHOW[normalizeProvinceKey(p.key)] || 
                     PROVINCE_LANDMARK_SLIDESHOW[p.key.replace(/\s*-\s*/g, '-')] || 
                     PROVINCE_LANDMARK_SLIDESHOW[p.key.replace(/-/g, ' - ')] || {};
      const items = KnowledgeEngine.getItemsForProvince(p.key);
      return {
        name: p.name,
        key: p.key,
        itemRealCount: items.length || p.itemRealCount,
        tagline: lookup.tagline || `Danh thắng & di sản văn hóa ${p.name}`,
        category: lookup.category || 'Tỉnh thành',
        images: (lookup.images && lookup.images.length > 0) ? lookup.images : DEFAULT_SLIDESHOW_IMAGES,
      };
    });

    // Category filter with proper Vietnamese mapping
    if (activeCategory !== 'TẤT CẢ') {
      list = list.filter((p: any) => {
        const provItems = KnowledgeEngine.getItemsForProvince(p.key);
        return provItems.some((i: KnowledgeItem) => {
          const sub = (i.subCategory || '').toUpperCase();
          const cat = (i.category || '').toLowerCase();
          const title = (i.title || '').toUpperCase();
          const content = (i.content || '').toUpperCase();

          if (activeCategory === 'DI TÍCH - VĂN HÓA') {
            return sub.includes('DI TÍCH') || sub.includes('VĂN HÓA') || sub.includes('CULTURE') || sub.includes('MONUMENT') || cat === 'culture';
          }
          if (activeCategory === 'ẨM THỰC') {
            return sub.includes('ẨM THỰC') || sub.includes('FOOD') || sub.includes('THỰC') || sub.includes('ĐẶC SẢN') || sub.includes('MÓN AN') || cat === 'food' || cat === 'restaurant' || title.includes('ẨM THỰC') || title.includes('ĐẶC SẢN') || content.includes('ĐẶC SẢN');
          }
          if (activeCategory === 'LỄ HỘI') {
            return sub.includes('LỄ HỘI') || sub.includes('HỘI') || sub.includes('FESTIVAL') || title.includes('LỄ HỘI');
          }
          if (activeCategory === 'DÂN TỘC') {
            return sub.includes('DÂN TỘC') || sub.includes('TỘC') || sub.includes('ETHNIC') || title.includes('DÂN TỘC');
          }
          return sub === activeCategory;
        });
      });
    }

    // Real-time search query filtering on the grid
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter((p: any) => {
        const provItems = KnowledgeEngine.getItemsForProvince(p.key);
        const matchesName = p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q);
        const matchesTagline = p.tagline.toLowerCase().includes(q);
        const matchesItems = provItems.some((i: KnowledgeItem) => 
          i.name.toLowerCase().includes(q) || 
          i.content.toLowerCase().includes(q) ||
          i.subCategory.toLowerCase().includes(q)
        );
        return matchesName || matchesTagline || matchesItems;
      });
    }

    return list;
  }, [activeCategory, query]);

  const totalHandbookPages = Math.ceil(filteredProvinces.length / itemsPerPage);

  const paginatedProvinces = useMemo(() => {
    const start = (handbookPage - 1) * itemsPerPage;
    return filteredProvinces.slice(start, start + itemsPerPage);
  }, [filteredProvinces, handbookPage]);

  // Reset page when category changes
  useEffect(() => {
    setHandbookPage(1);
  }, [activeCategory]);

  // For the AI select box we want all provinces regardless of category
  const allProvincesForAi = useMemo(() => KnowledgeEngine.getProvincesList(), []);

  // Clean canonical categories in Vietnamese without raw English tokens
  const categories = useMemo(() => {
    return ['TẤT CẢ', 'DI TÍCH - VĂN HÓA', 'LỄ HỘI', 'ẨM THỰC', 'DÂN TỘC'];
  }, []);

  // Search Results
  const searchResults = useMemo(() => {
    return SearchEngine.search(query);
  }, [query]);

  // Handle AI consult
  const handleAiConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim() || !aiSelectedProvince) return;

    setAiLoading(true);
    setAiResponse('');
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const { responseText, matchSource } = KnowledgeEngine.synthesizeAiAnswer(aiSelectedProvince, aiQuestion);
      setAiResponse(`### 🤖 Phản hồi từ Trợ lý Ảo\n*Nguồn dữ liệu: ${matchSource}*\n\n${responseText}`);
    } catch {
      setAiResponse('Gặp lỗi khi liên kết với Trợ lý Ảo du lịch.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans overflow-x-clip">
      
      {/* ── CINEMATIC HERO VIDEO HEADER ── */}
      <header className="relative w-full h-[55vh] min-h-[400px] overflow-hidden flex items-center justify-center border-b border-slate-200/50 dark:border-slate-800/80">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 filter brightness-75 dark:brightness-50"
        >
          <source src={blogVideo} type="video/mp4" />
        </video>
        
        {/* Ambient Gradient Masks */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-50 dark:to-slate-950 z-1" />
        
        <div className="relative z-10 text-center space-y-4 max-w-4xl px-4 animate-fade-in mt-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 dark:bg-slate-900/40 border border-white/30 text-[10px] font-bold text-white uppercase tracking-widest backdrop-blur-md">
            <Sparkles size={11} className="text-amber-300 animate-pulse" />
            Cơ sở dữ liệu tri thức du lịch Việt Nam
          </span>
          <h1 className="font-editorial text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight drop-shadow-sm flex flex-wrap justify-center gap-x-3 select-none">
            <KineticText text="Cẩm Nang" as="span" className="text-white" />
            <KineticText text="Tri Thức Du Lịch" as="span" className="bg-gradient-to-r from-blue-400 via-sky-300 to-[var(--gold)] bg-clip-text text-transparent" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-100 font-bold max-w-xl mx-auto drop-shadow">
            Hệ tri thức số hóa chuẩn quốc gia về danh thắng địa lý, di sản văn hóa, ẩm thực đặc sản, lễ hội truyền thống của 63 tỉnh thành Việt Nam.
          </p>
        </div>
      </header>

      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* ── 1. KNOWLEDGE STATISTICS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto -mt-20 relative z-20">
          {[
            { label: 'Tỉnh thành', value: stats.totalProvinces, icon: MapPin, color: 'text-rose-500' },
            { label: 'Di tích lịch sử', value: stats.totalMonuments, icon: Landmark, color: 'text-amber-500' },
            { label: 'Nét văn hóa', value: stats.totalCultureItems, icon: BookOpen, color: 'text-violet-500' },
            { label: 'Mục tri thức', value: stats.totalItems, icon: FileText, color: 'text-blue-500' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <span className="block text-lg font-black text-slate-900 dark:text-white leading-none">{stat.value}</span>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── 2. UNIVERSAL KNOWLEDGE SEARCH ── */}
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-3 flex items-center gap-2 relative group focus-within:border-[var(--gold)] transition-all">
            <Search className="text-slate-400 dark:text-slate-500 ml-2" size={18} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Nhập tên thắng cảnh, món đặc sản, lễ hội cổ truyền (Ví dụ: Núi Cấm, Cù lao Ông Hổ...)"
              className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 border-none outline-none focus:ring-0"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 cursor-pointer">✕</button>
            )}
          </div>

          {/* Search suggestions dropdown */}
          {query.trim() && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 max-h-[350px] overflow-y-auto space-y-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1">KẾT QUẢ ĐỒNG BỘ TRI THỨC ({searchResults.length})</p>
              {searchResults.map((res, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(`/explore/province/${res.item.province}`)}
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl cursor-pointer text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{res.item.name}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">{res.item.province} · {res.item.subCategory}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </div>
              ))}
              {searchResults.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-6">Không tìm thấy địa điểm hoặc văn hóa nào khớp với từ khóa.</p>
              )}
            </div>
          )}
        </div>

        {/* ── 3. CATEGORY EXPLORER (STRICT SINGLE ROW FLEX NO-WRAP) ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 justify-center text-xs font-bold text-[var(--gold)]">
            <Compass size={16} className="text-[var(--gold)]" />
            <span>Khám Phá Danh Mục Tri Thức</span>
          </div>
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto scrollbar-none py-1.5 px-2 max-w-full">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 whitespace-nowrap px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-[var(--gold)] text-white shadow-md shadow-blue-500/20 scale-102 font-extrabold'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-[var(--gold)]/40 hover:text-[var(--gold)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── 4. PROVINCES & ETHNIC GROUPS CARDS GRID ── */}
          <div className="lg:col-span-9 space-y-6">
            {activeCategory === 'DÂN TỘC' ? (
              <>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen size={16} className="text-[var(--gold)]" />
                  Thư Viện 54 Dân Tộc Việt Nam ({filteredEthnicGroups.length} Dân tộc)
                </h3>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6" id="handbook-feed-anchor">
                  {filteredEthnicGroups.map((ethnic: KnowledgeItem) => (
                    <EthnicCard
                      key={ethnic.id}
                      ethnic={ethnic}
                      onClick={() => setActiveEthnicModal(ethnic)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin size={16} className="text-[var(--gold)]" />
                  Bản Đồ Hành Chính & Thư Viện Địa Phương
                </h3>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6" id="handbook-feed-anchor">
                  {paginatedProvinces.map((prov: any) => (
                    <ProvinceCard
                      key={prov.key}
                      prov={prov}
                      meta={{
                        images: prov.images,
                        tagline: prov.tagline,
                        category: prov.category,
                      }}
                      onNavigate={() => {
                        if (activeCategory !== 'TẤT CẢ') {
                          navigate(`/explore/province/${prov.key}?category=${encodeURIComponent(activeCategory)}`);
                        } else {
                          navigate(`/explore/province/${prov.key}`);
                        }
                      }}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalHandbookPages > 1 && (
                  <div className="flex justify-center items-center gap-1.5 pt-6">
                    <button
                      onClick={() => {
                        setHandbookPage(prev => Math.max(prev - 1, 1));
                        document.getElementById('handbook-feed-anchor')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      disabled={handbookPage === 1}
                      className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-900 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      Trước
                    </button>
                    
                    {Array.from({ length: totalHandbookPages }).map((_, i) => {
                      const pageNum = i + 1;
                      const active = handbookPage === pageNum;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setHandbookPage(pageNum);
                            document.getElementById('handbook-feed-anchor')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            active
                              ? 'bg-[var(--gold)] text-white shadow font-extrabold'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-[var(--gold)]/40'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => {
                        setHandbookPage(prev => Math.min(prev + 1, totalHandbookPages));
                        document.getElementById('handbook-feed-anchor')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      disabled={handbookPage === totalHandbookPages}
                      className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-900 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── 5. AI KNOWLEDGE ASSISTANT ── */}
          <aside className="lg:col-span-3 lg:sticky lg:top-24 self-start">
            <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-5 space-y-4 relative overflow-hidden group">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--gold)] text-white flex items-center justify-center font-bold">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[var(--gold)]">TRỢ LÝ ẢO TRI THỨC</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Trả lời nhanh mọi thắc mắc</p>
                </div>
              </div>

              <form onSubmit={handleAiConsult} className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">CHỌN TỈNH THÀNH</label>
                  <select
                    value={aiSelectedProvince}
                    onChange={e => setAiSelectedProvince(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-white outline-none focus:border-[var(--gold)] cursor-pointer"
                  >
                    <option value="" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-white">-- Lựa chọn tỉnh --</option>
                    {allProvincesForAi.map((p: { key: string; name: string }) => (
                      <option key={p.key} value={p.key} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-white">{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">CÂU HỎI TRA CỨU</label>
                  <textarea
                    value={aiQuestion}
                    onChange={e => setAiQuestion(e.target.value)}
                    placeholder="VD: Núi Cấm ở đâu? có cảnh đẹp gi..."
                    disabled={!aiSelectedProvince}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[var(--gold)] resize-none h-24 disabled:opacity-40 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={aiLoading || !aiQuestion.trim() || !aiSelectedProvince}
                  className="w-full py-3 bg-[var(--gold)] hover:opacity-90 text-white font-black text-[11px] uppercase tracking-wider rounded-xl shadow-lg cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {aiLoading ? <Loader2 size={14} className="animate-spin text-white" /> : <Search size={14} className="text-white" />}
                  TRA CỨU TRỢ LÝ ẢO
                </button>
              </form>

              {aiResponse && (
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4 animate-fade-in">
                  <span className="text-[8px] font-black uppercase text-[var(--gold)] bg-[var(--gold)]/10 px-2 py-0.5 rounded border border-[var(--gold)]/20">KẾT QUẢ TRA CỨU</span>
                  <div className="text-[11px] text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 max-h-[240px] overflow-y-auto whitespace-pre-wrap">
                    {renderFormattedContent(aiResponse)}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* ── ETHNIC GROUP MODAL ── */}
      {activeEthnicModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 pt-20 pb-8 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Hero Card Image Banner */}
            <div className="relative w-full h-56 sm:h-72 overflow-hidden shrink-0 bg-slate-800">
              <img 
                src={ETHNIC_IMAGES_MAPPING[activeEthnicModal.name.toUpperCase()] || FALLBACK_LANDMARK_IMAGE} 
                alt={activeEthnicModal.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_LANDMARK_IMAGE;
                }}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />
              
              {/* Badge & Title Overlaid on Image */}
              <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between z-10">
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-[var(--gold)]/90 px-3 py-1 rounded-full shadow-md backdrop-blur-md">
                    <BookOpen size={11} className="text-white" /> VĂN HÓA & DÂN TỘC VIỆT NAM
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg tracking-tight">
                    {activeEthnicModal.name}
                  </h3>
                </div>
              </div>

              {/* Floating Close Button */}
              <button
                onClick={() => setActiveEthnicModal(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-950/90 text-white backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer transition-all hover:scale-110 z-20 shadow-lg"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Article Body Content */}
            <div className="p-6 sm:p-8 overflow-y-auto w-full space-y-4">
              {renderFormattedContent(activeEthnicModal.content)}
            </div>

            {/* Modal Footer Bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <Sparkles size={13} className="text-[var(--gold)]" />
                Cơ sở dữ liệu tri thức 54 Dân tộc Việt Nam
              </span>
              <button
                onClick={() => setActiveEthnicModal(null)}
                className="px-6 py-2.5 bg-[var(--gold)] text-white text-xs font-bold rounded-xl hover:bg-[var(--gold-dark)] cursor-pointer shadow-md transition-all active:scale-95"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
