import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Landmark, BookOpen, Compass, Search, Sparkles, HelpCircle,
  Loader2, AlertCircle, FileText, ChevronRight, BarChart3, Users
} from 'lucide-react';
import { KnowledgeEngine, type KnowledgeItem } from './KnowledgeEngine';
import { SearchEngine, type SearchResult } from './SearchEngine';
import { AIContextBuilder } from './AIContextBuilder';
import blogVideo from '../../../../video.mp4';
import { KineticText } from '../../components/ui/kinetic-text';

function normalizeParagraphs(text: string): string {
  if (!text) return '';
  const paragraphs = text.split(/\n\s*\n/);
  const cleaned = paragraphs.map(p => {
    return p.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  });
  return cleaned.filter(Boolean).join('\n\n');
}

export default function ExploreHandbookHub() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('TẤT CẢ');

  // AI assistant states
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiSelectedProvince, setAiSelectedProvince] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  // Loaded engine statistics
  const stats = useMemo(() => KnowledgeEngine.buildStatistics(), []);
  
  // Paginated provinces states
  const [handbookPage, setHandbookPage] = useState(1);
  const itemsPerPage = 9;

  // Filtered provinces list based on category
  const filteredProvinces = useMemo(() => {
    const all = KnowledgeEngine.loadAll();
    const map = new Map<string, KnowledgeItem[]>();
    for (const item of all) {
      if (activeCategory !== 'TẤT CẢ' && item.subCategory.toUpperCase() !== activeCategory) {
        continue;
      }
      const prov = item.province.toUpperCase();
      const list = map.get(prov) ?? [];
      list.push(item);
      map.set(prov, list);
    }

    return Array.from(map.entries())
      .map(([name, items]) => ({
        name: name.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        key: name,
        itemRealCount: items.length
      }))
      .filter(p => p.itemRealCount > 0)
      .sort((a, b) => b.itemRealCount - a.itemRealCount);
  }, [activeCategory]);

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

  // Unique categories extracted dynamically from parsed records
  const categories = useMemo(() => {
    const all = KnowledgeEngine.loadAll();
    const uniqueCats = new Set(all.map(x => x.subCategory.toUpperCase()));
    return ['TẤT CẢ', ...Array.from(uniqueCats)].filter(c => c !== 'TỔNG QUAN');
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
      // Mock an AI model response running strictly on the generated context
      await new Promise(resolve => setTimeout(resolve, 1000));
      const map = KnowledgeEngine.groupByProvince();
      const items = map.get(aiSelectedProvince.toUpperCase()) || [];
      
      const query = aiQuestion.toLowerCase().trim();
      let matchedItems: KnowledgeItem[] = [];
      let matchSource = '';

      // Dictionary of rich semantic intents for category routing
      const INTENT_DICT = {
        LE_HOI: [
          'lễ hội', 'le hoi', 'hội', 'hoi', 'lễ', 'le', 'tết', 'tet', 
          'kỷ niệm', 'ky niem', 'truyền thống', 'truyen thong', 'hội hè', 'hoi he'
        ],
        DI_TICH: [
          'di tích', 'di tich', 'lịch sử', 'lich su', 'chùa', 'chua', 
          'nhà thờ', 'nha tho', 'bảo tàng', 'bao tang', 'đền', 'den', 
          'miếu', 'mieu', 'lăng', 'lang', 'cổ kính', 'co kinh', 'di sản', 'di san'
        ],
        THANG_CANH: [
          'thắng cảnh', 'thang canh', 'tham quan', 'vui chơi', 'vui choi', 
          'du lịch', 'du lich', 'chỗ chơi', 'cho choi', 'công viên', 'cong vien', 
          'địa điểm', 'dia diem', 'cảnh đẹp', 'canh dep', 'khám phá', 'kham pha',
          'giải trí', 'giai tri', 'checkin', 'chụp hình', 'chup hinh'
        ],
        TONG_QUAN: [
          'tổng quan', 'tong quan', 'địa lý', 'dia ly', 'giới thiệu', 'gioi thieu', 
          'khí hậu', 'khi hau', 'thời tiết', 'thoi tiet', 'mùa', 'mua', 'nhiệt độ', 'nhiet do',
          'vị trí', 'vi tri', 'diện tích', 'dien tich', 'dân số', 'dan so', 'bản đồ', 'ban do'
        ],
        AM_THUC: [
          'ăn gì', 'an gi', 'món ăn', 'mon an', 'đặc sản', 'dac san', 
          'ẩm thực', 'am thuc', 'nhà hàng', 'nha hang', 'quán', 'quan', 
          'đồ ăn', 'do an', 'thức uống', 'thuc uong', 'ngon'
        ]
      };

      const matchesIntent = (keywords: string[]) => keywords.some(kw => query.includes(kw));

      // 1. Resolve category routes
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

      // 2. Token Relevance Scoring (Fuzzy matching)
      if (matchedItems.length === 0) {
        const tokens = query.split(/\s+/).filter(t => t.length >= 2);
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

      // 3. Fallback
      if (matchedItems.length === 0) {
        matchedItems = items.filter(item => 
          item.name.toLowerCase().includes(query) || 
          item.content.toLowerCase().includes(query)
        );
        matchSource = 'Kết quả khớp từ khóa';
      }

      const provName = allProvincesForAi.find(p => p.key === aiSelectedProvince)?.name || aiSelectedProvince;

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
      
      {/* ── CINEMATIC HERO VIDEO HEADER (Giữ nguyên style) ── */}
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 dark:bg-slate-900/40 border border-white/30 text-[10px] font-bold text-white uppercase tracking-widest backdrop-blur-md">
            <Sparkles size={11} className="text-amber-300 animate-pulse" />
            Cơ sở dữ liệu tri thức du lịch Việt Nam
          </span>
          <h1 className="font-editorial text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight drop-shadow-sm flex flex-wrap justify-center gap-x-3 select-none">
            <KineticText text="Cẩm Nang" as="span" className="text-white" />
            <KineticText text="Tri Thức Du Lịch" as="span" className="bg-gradient-to-r from-teal-300 via-sky-300 to-brand-300 bg-clip-text text-transparent" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-100 font-bold max-w-xl mx-auto drop-shadow">
            Hệ tri thức số hóa chuẩn quốc gia về danh thắng địa lý, di sản văn hóa, ẩm thực đặc sản, lễ hội truyền thống của 63 tỉnh thành Việt Nam.
          </p>
        </div>
      </header>

      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* ── 1. KNOWLEDGE STATISTICS (Đếm số tự động từ JSON) ── */}
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-3 flex items-center gap-2 relative group focus-within:border-teal-500 transition-all">
            <Search className="text-slate-400 dark:text-slate-500 ml-2" size={18} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Nhập tên thắng cảnh, món đặc sản, lễ hội cổ truyền (Ví dụ: Núi Cấm, Cù lao Ông Hổ...)"
              className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 border-none outline-none focus:ring-0"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2">✕</button>
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

        {/* ── 3. CATEGORY EXPLORER (Sinh động từ JSON) ── */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 justify-center">
            <BarChart3 size={16} className="text-teal-500" />
            Khám Phá Danh Mục Tri Thức
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-teal-600 border-transparent text-white shadow-lg shadow-teal-500/20 scale-102'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:border-teal-500/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── 4. 63 PROVINCES GRID SELECTOR (9 COLUMNS) ── */}
          <div className="lg:col-span-9 space-y-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin size={16} className="text-teal-500" />
              Bản Đồ Hành Chính & Thư Viện Địa Phương
            </h3>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6" id="handbook-feed-anchor">
              {paginatedProvinces.map((prov, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(`/explore/province/${prov.key}`)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl p-5 hover:-translate-y-1 hover:shadow-2xl cursor-pointer transition-all duration-300 group flex justify-between items-center"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">TỈNH THÀNH</span>
                    <h4 className="text-sm font-black text-slate-950 dark:text-white group-hover:text-teal-500 transition-colors">{prov.name}</h4>
                    <span className="inline-block text-[9px] font-extrabold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded">
                      {prov.itemRealCount} tư liệu
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-teal-500 group-hover:text-white transition-all">
                    <ChevronRight size={16} />
                  </div>
                </div>
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
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-900 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-200"
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
                      className={`w-8 h-8 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        active
                          ? 'bg-teal-600 text-white border-transparent shadow'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800'
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
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-900 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-200"
                >
                  Sau
                </button>
              </div>
            )}
          </div>

          {/* ── 5. STRICT AI TRAVEL ASSISTANT (3 COLUMNS) ── */}
          <aside className="lg:col-span-3">
            <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-3xl border border-teal-900/60 shadow-2xl p-5 space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-400/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-teal-300">Trợ Lý Tri Thức AI</h4>
                  <p className="text-[9px] text-slate-400">Trả lời nghiêm ngặt theo JSON</p>
                </div>
              </div>

              <form onSubmit={handleAiConsult} className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Chọn Tỉnh Thành</label>
                  <select
                    value={aiSelectedProvince}
                    onChange={e => setAiSelectedProvince(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-teal-400"
                  >
                    <option value="" className="bg-slate-900">-- Lựa chọn tỉnh --</option>
                    {allProvincesForAi.map(p => (
                      <option key={p.key} value={p.key} className="bg-slate-900">{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Câu hỏi tra cứu</label>
                  <textarea
                    value={aiQuestion}
                    onChange={e => setAiQuestion(e.target.value)}
                    placeholder="VD: Núi Cấm ở đâu? có cảnh đẹp gì..."
                    disabled={!aiSelectedProvince}
                    className="w-full text-xs bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 resize-none h-16 disabled:opacity-40 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={aiLoading || !aiQuestion.trim() || !aiSelectedProvince}
                  className="w-full py-2 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-lg cursor-pointer transition-all hover:scale-101 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                  Tra Cứu Trợ Lý
                </button>
              </form>

              {/* Response Block */}
              {aiResponse && (
                <div className="space-y-2 border-t border-slate-850 pt-4 animate-fade-in">
                  <span className="text-[8px] font-black uppercase text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/25">Kết quả tra cứu</span>
                  <p className="text-[10px] text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-950/30 p-3 rounded-xl border border-slate-900/60 max-h-[220px] overflow-y-auto">
                    {aiResponse}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
