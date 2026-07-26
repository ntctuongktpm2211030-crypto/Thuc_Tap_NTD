import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Landmark, BookOpen, Compass, Search, Sparkles,
  Loader2, FileText, ChevronRight
} from 'lucide-react';
import { KnowledgeEngine, normalizeProvinceKey, type KnowledgeItem } from './KnowledgeEngine';
import { SearchEngine } from './SearchEngine';
import blogVideo from '../../../../video.mp4';
import { KineticText } from '../../components/ui/kinetic-text';
import {
  PROVINCE_LANDMARK_SLIDESHOW,
  DEFAULT_SLIDESHOW_IMAGES,
  FALLBACK_LANDMARK_IMAGE
} from './ProvinceLandmarkData';

function normalizeParagraphs(text: string): string {
  if (!text) return '';
  const paragraphs = text.split(/\n\s*\n/);
  const cleaned = paragraphs.map(p => {
    return p.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  });
  return cleaned.filter(Boolean).join('\n\n');
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
    return ethnicGroups.filter(e => 
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

  // Filtered provinces list based on category & real-time search query
  const filteredProvinces = useMemo(() => {
    const canonicalList = KnowledgeEngine.getCanonicalProvincesList();

    let list = canonicalList.map(p => {
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
      list = list.filter(p => {
        const provItems = KnowledgeEngine.getItemsForProvince(p.key);
        return provItems.some(i => {
          const sub = i.subCategory.toUpperCase();
          if (activeCategory === 'VĂN HÓA') {
            return sub === 'VĂN HÓA' || sub === 'CULTURE' || i.category === 'culture';
          }
          return sub === activeCategory;
        });
      });
    }

    // Real-time search query filtering on the grid
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(p => {
        const provItems = KnowledgeEngine.getItemsForProvince(p.key);
        const matchesName = p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q);
        const matchesTagline = p.tagline.toLowerCase().includes(q);
        const matchesItems = provItems.some(i => 
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
    return ['TẤT CẢ', 'THẤNG CẢNH', 'DI TÍCH', 'LỄ HỘI', 'ẨM THỰC', 'VĂN HÓA', 'DÂN TỘC'];
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      const map = KnowledgeEngine.groupByProvince();
      const items = map.get(aiSelectedProvince.toUpperCase()) || [];
      
      const queryStr = aiQuestion.toLowerCase().trim();
      let matchedItems: KnowledgeItem[] = [];
      let matchSource = '';

      const INTENT_DICT = {
        LE_HOI: ['lễ hội', 'le hoi', 'hội', 'hoi', 'lễ', 'le', 'tết', 'tet', 'kỷ niệm', 'ky niem', 'truyền thống', 'truyen thong', 'hội hè', 'hoi he'],
        DI_TICH: ['di tích', 'di tich', 'lịch sử', 'lich su', 'chùa', 'chua', 'nhà thờ', 'nha tho', 'bảo tàng', 'bao tang', 'đền', 'den', 'miếu', 'mieu', 'lăng', 'lang', 'cổ kính', 'co kinh', 'di sản', 'di san'],
        THANG_CANH: ['thắng cảnh', 'thang canh', 'tham quan', 'vui chơi', 'vui choi', 'du lịch', 'du lich', 'chỗ chơi', 'cho choi', 'công viên', 'cong vien', 'địa điểm', 'dia diem', 'cảnh đẹp', 'canh dep', 'khám phá', 'kham pha', 'giải trí', 'giai tri', 'checkin', 'chụp hình', 'chup hinh'],
        TONG_QUAN: ['tổng quan', 'tong quan', 'địa lý', 'dia ly', 'giới thiệu', 'gioi thieu', 'khí hậu', 'khi hau', 'thời tiết', 'thoi tiet', 'mùa', 'mua', 'nhiệt độ', 'nhiet do', 'vị trí', 'vi tri', 'diện tích', 'dien tich', 'dân số', 'dan so', 'bản đồ', 'ban do'],
        AM_THUC: ['ăn gì', 'an gi', 'món ăn', 'mon an', 'đặc sản', 'dac san', 'ẩm thực', 'am thuc', 'nhà hàng', 'nha hang', 'quán', 'quan', 'đồ ăn', 'do an', 'thức uống', 'thuc uong', 'ngon']
      };

      const matchesIntent = (keywords: string[]) => keywords.some(kw => queryStr.includes(kw));

      if (matchesIntent(INTENT_DICT.LE_HOI)) {
        matchedItems = items.filter(item => item.subCategory.toUpperCase() === 'LỄ HỘI');
        matchSource = 'Danh sách Lễ hội văn hóa';
      } else if (matchesIntent(INTENT_DICT.DI_TICH)) {
        matchedItems = items.filter(item => item.subCategory.toUpperCase() === 'DI TÍCH');
        matchSource = 'Danh sách Di tích lịch sử & Tâm linh';
      } else if (matchesIntent(INTENT_DICT.THANG_CANH)) {
        matchedItems = items.filter(item => item.subCategory.toUpperCase() === 'THẤNG CẢNH');
        matchSource = 'Danh sách Danh lam thắng cảnh & Điểm vui chơi';
      } else if (matchesIntent(INTENT_DICT.TONG_QUAN)) {
        matchedItems = items.filter(item => item.subCategory.toUpperCase() === 'TỔNG QUAN');
        matchSource = 'Tổng quan địa lý & Khí hậu';
      } else if (matchesIntent(INTENT_DICT.AM_THUC)) {
        matchedItems = items.filter(item => 
          item.name.toLowerCase().includes('ẩm thực') || 
          item.name.toLowerCase().includes('ăn') ||
          item.content.toLowerCase().includes('ẩm thực') ||
          item.content.toLowerCase().includes('đặc sản') ||
          item.content.toLowerCase().includes('món ăn')
        );
        matchSource = 'Đề xuất Ẩm thực & Đặc sản địa phương';
      }

      if (matchedItems.length === 0) {
        const tokens = queryStr.split(/\s+/).filter(t => t.length >= 2);
        if (tokens.length > 0) {
          const scored = items.map(item => {
            let score = 0;
            const nameLower = item.name.toLowerCase();
            const contentLower = item.content.toLowerCase();
            tokens.forEach(t => {
              if (nameLower.includes(t)) score += 3;
              if (contentLower.includes(t)) score += 1;
            });
            return { item, score };
          });

          const filtered = scored
            .filter(e => e.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(e => e.item);

          matchedItems = filtered.slice(0, 3);
          matchSource = 'Tư liệu liên quan nhất';
        }
      }

      if (matchedItems.length === 0) {
        matchedItems = items.filter(item => 
          item.name.toLowerCase().includes(queryStr) || 
          item.content.toLowerCase().includes(queryStr)
        );
        matchSource = 'Kết quả khớp từ khóa';
      }

      const provName = allProvincesForAi.find((p: { key: string; name: string }) => p.key === aiSelectedProvince)?.name || aiSelectedProvince;

      if (matchedItems.length > 0) {
        let responseText = `### 🤖 Phản hồi từ Trợ lý AI về ${provName}\n`;
        responseText += `*Nguồn dữ liệu: ${matchSource}*\n\n`;
        matchedItems.forEach(item => {
          responseText += `📍 **${item.name}** (${item.subCategory})\n${normalizeParagraphs(item.content)}\n\n`;
        });
        setAiResponse(responseText.trim());
      } else {
        setAiResponse(`Dữ liệu tri thức chính thống hiện tại về "${provName}" không nhắc đến thông tin chi tiết về phần này. Tôi xin lỗi vì không thể tự sáng tác câu trả lời ngoài tài liệu.`);
      }
    } catch {
      setAiResponse('Gặp lỗi khi liên kết với Trợ lý AI du lịch.');
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-5xl mx-auto -mt-20 relative z-20">
          {[
            { label: 'Tỉnh thành', value: stats.totalProvinces, icon: MapPin, color: 'text-rose-500' },
            { label: 'Thắng cảnh', value: stats.totalLandmarks, icon: Compass, color: 'text-emerald-500' },
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
                  {filteredEthnicGroups.map((ethnic) => (
                    <div
                      key={ethnic.id}
                      onClick={() => setActiveEthnicModal(ethnic)}
                      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg hover:shadow-2xl hover:border-[var(--gold)] transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--gold)] bg-[var(--gold)]/10 px-2.5 py-1 rounded-md border border-[var(--gold)]/20">
                            Văn hóa & Dân tộc
                          </span>
                          <Sparkles size={14} className="text-amber-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-[var(--gold)] transition-colors mb-2">
                          {ethnic.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-4 leading-relaxed">
                          {ethnic.content.split('\n')[0]}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[var(--gold)]">
                        <span>Xem chi tiết bản sắc</span>
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
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
                  {paginatedProvinces.map((prov) => (
                    <ProvinceCard
                      key={prov.key}
                      prov={prov}
                      meta={{
                        images: prov.images,
                        tagline: prov.tagline,
                        category: prov.category,
                      }}
                      onNavigate={() => navigate(`/explore/province/${prov.key}`)}
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
          <aside className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-5 space-y-4 relative overflow-hidden group">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--gold)] text-white flex items-center justify-center font-bold">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[var(--gold)]">TRỢ LÝ TRI THỨC AI</h4>
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
                  TRA CỨU TRỢ LÝ
                </button>
              </form>

              {aiResponse && (
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4 animate-fade-in">
                  <span className="text-[8px] font-black uppercase text-[var(--gold)] bg-[var(--gold)]/10 px-2 py-0.5 rounded border border-[var(--gold)]/20">KẾT QUẢ TRA CỨU</span>
                  <p className="text-[10px] text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 max-h-[220px] overflow-y-auto whitespace-pre-wrap">
                    {aiResponse}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* ── ETHNIC GROUP MODAL ── */}
      {activeEthnicModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--gold)] bg-[var(--gold)]/10 px-2.5 py-1 rounded-md border border-[var(--gold)]/20">
                  VĂN HÓA DÂN TỘC VIỆT NAM
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {activeEthnicModal.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveEthnicModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {activeEthnicModal.content}
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveEthnicModal(null)}
                className="px-5 py-2 bg-[var(--gold)] text-white text-xs font-bold rounded-xl hover:bg-[var(--gold-dark)] cursor-pointer shadow"
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
