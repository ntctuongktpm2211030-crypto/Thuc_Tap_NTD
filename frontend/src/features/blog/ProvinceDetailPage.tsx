import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Compass, Sparkles, Loader2, ArrowLeft,
  AlertCircle, GraduationCap
} from 'lucide-react';
import { KnowledgeEngine, normalizeProvinceKey, type KnowledgeItem } from './KnowledgeEngine';
import BookPageReader from './BookPageReader';
import { PROVINCE_LANDMARK_SLIDESHOW, DEFAULT_SLIDESHOW_IMAGES } from './ProvinceLandmarkData';

function normalizeParagraphs(text: string): string {
  if (!text) return '';
  // Split by double newlines to find true paragraphs
  const paragraphs = text.split(/\n\s*\n/);
  // Replace single newlines within paragraphs with spaces, keeping actual double newlines
  const cleaned = paragraphs.map(p => {
    return p.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  });
  return cleaned.filter(Boolean).join('\n\n');
}

export default function ProvinceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // AI assistant states
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  // Active modal item state for popup details
  const [activeModalItem, setActiveModalItem] = useState<KnowledgeItem | null>(null);

  // Active modal item state removed since all contents are displayed fully on cards

  // Fetch and cache all knowledge items for this province
  const provinceItems = useMemo(() => {
    return KnowledgeEngine.getItemsForProvince(id ?? '');
  }, [id]);

  // Dynamic grouping by subCategory
  const groupedItems = useMemo(() => {
    const groups = new Map<string, KnowledgeItem[]>();
    for (const item of provinceItems) {
      const sub = item.subCategory.toUpperCase();
      const list = groups.get(sub) ?? [];
      list.push(item);
      groups.set(sub, list);
    }
    return groups;
  }, [provinceItems]);

  const overviewItem = useMemo(() => {
    return provinceItems.find(item => item.subCategory.toUpperCase() === 'TỔNG QUAN');
  }, [provinceItems]);

  const subCategoriesList = useMemo(() => {
    return Array.from(groupedItems.keys()).filter(cat => cat !== 'TỔNG QUAN');
  }, [groupedItems]);

  const [activeTab, setActiveTab] = useState<string>(() => {
    return subCategoriesList[0] ?? '';
  });

  const [itemPage, setItemPage] = useState(1);
  const itemsPerPage = 6;

  // Reset page when activeTab changes
  useEffect(() => {
    setItemPage(1);
  }, [activeTab]);

  const activeCategoryItems = useMemo(() => {
    return groupedItems.get(activeTab) ?? [];
  }, [groupedItems, activeTab]);

  const totalItemPages = Math.ceil(activeCategoryItems.length / itemsPerPage);

  const paginatedCategoryItems = useMemo(() => {
    const start = (itemPage - 1) * itemsPerPage;
    return activeCategoryItems.slice(start, start + itemsPerPage);
  }, [activeCategoryItems, itemPage]);

  // Overview pagination states
  const [overviewPage, setOverviewPage] = useState(1);

  const overviewPages = useMemo(() => {
    if (!overviewItem) return [];
    const cleanText = overviewItem.content.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
    const words = cleanText.split(' ').filter(Boolean);
    
    // ~280 words per page fills both 2 columns from top header line down to bottom footer line
    const wordsPerPage = 280;
    if (words.length <= wordsPerPage) {
      return [cleanText];
    }

    const pages: string[] = [];
    for (let i = 0; i < words.length; i += wordsPerPage) {
      pages.push(words.slice(i, i + wordsPerPage).join(' '));
    }

    return pages;
  }, [overviewItem]);

  // currentOverviewText memo removed since pages array is passed directly to BookPageReader

  useEffect(() => {
    setOverviewPage(1);
  }, [id]);

  const formattedName = useMemo(() => {
    if (!id) return '';
    let decoded = id;
    try {
      decoded = decodeURIComponent(id);
    } catch {}
    return decoded.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }, [id]);

  const bannerPhotos = useMemo(() => {
    if (!formattedName) return DEFAULT_SLIDESHOW_IMAGES;
    const normKey = normalizeProvinceKey(formattedName);
    const upperKey = formattedName.toUpperCase();
    const meta = PROVINCE_LANDMARK_SLIDESHOW[normKey] || 
                 PROVINCE_LANDMARK_SLIDESHOW[upperKey] || 
                 PROVINCE_LANDMARK_SLIDESHOW[normKey.replace(/\s*-\s*/g, '-')] || 
                 PROVINCE_LANDMARK_SLIDESHOW[normKey.replace(/-/g, ' - ')] || {};
    return (meta.images && meta.images.length > 0) ? meta.images : DEFAULT_SLIDESHOW_IMAGES;
  }, [formattedName]);

  const taglineText = useMemo(() => {
    if (!formattedName) return '';
    const normKey = normalizeProvinceKey(formattedName);
    const upperKey = formattedName.toUpperCase();
    const meta = PROVINCE_LANDMARK_SLIDESHOW[normKey] || 
                 PROVINCE_LANDMARK_SLIDESHOW[upperKey] || {};
    return meta.tagline || 'Hệ thống thông tin chính thống tổng hợp về địa lý, danh thắng di tích và các tập tục văn hóa đặc sắc bản địa.';
  }, [formattedName]);

  const [bannerSlide, setBannerSlide] = useState(0);

  useEffect(() => {
    setBannerSlide(0);
  }, [id]);

  useEffect(() => {
    if (bannerPhotos.length <= 1) return;
    const timer = setInterval(() => {
      setBannerSlide(prev => (prev + 1) % bannerPhotos.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [bannerPhotos]);

  // Handle AI consult strictly scoped to local repository context
  const handleAiConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    setAiLoading(true);
    setAiResponse('');
    try {
      // Mock an AI model response running strictly on the generated context
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
        matchedItems = provinceItems.filter(item => item.subCategory.toUpperCase() === 'LỄ HỘI');
        matchSource = 'Danh sách Lễ hội văn hóa & Lễ ký niệm';
      } else if (matchesIntent(INTENT_DICT.DI_TICH)) {
        matchedItems = provinceItems.filter(item => item.subCategory.toUpperCase() === 'DI TÍCH');
        matchSource = 'Danh sách Di tích lịch sử & Tâm linh';
      } else if (matchesIntent(INTENT_DICT.THANG_CANH)) {
        matchedItems = provinceItems.filter(item => item.subCategory.toUpperCase() === 'THẮNG CẢNH');
        matchSource = 'Danh sách Danh lam thắng cảnh & Điểm vui chơi';
      } else if (matchesIntent(INTENT_DICT.TONG_QUAN)) {
        matchedItems = provinceItems.filter(item => item.subCategory.toUpperCase() === 'TỔNG QUAN');
        matchSource = 'Tổng quan địa lý & Khí hậu';
      } else if (matchesIntent(INTENT_DICT.AM_THUC)) {
        matchedItems = provinceItems.filter(item => 
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
          const scored = provinceItems.map(item => {
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

      // 3. Last fallback
      if (matchedItems.length === 0) {
        matchedItems = provinceItems.filter(item => 
          item.name.toLowerCase().includes(query) || 
          item.content.toLowerCase().includes(query)
        );
        matchSource = 'Kết quả khớp từ khóa';
      }

      if (matchedItems.length > 0) {
        let responseText = `### 🤖 Phản hồi từ Trợ lý AI\n`;
        responseText += `*Nguồn dữ liệu: ${matchSource}*\n\n`;
        matchedItems.forEach(item => {
          responseText += `📍 **${item.name}** (${item.subCategory})\n${normalizeParagraphs(item.content)}\n\n`;
        });
        setAiResponse(responseText.trim());
      } else {
        setAiResponse(`Dữ liệu tri thức chính thống hiện tại về "${formattedName}" không nhắc đến thông tin chi tiết về phần này. Tôi xin lỗi vì không thể tự sáng tác câu trả lời ngoài tài liệu.`);
      }
    } catch {
      setAiResponse('Gặp lỗi khi truy vấn Trợ lý AI.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/guide/culture-food');
    }
  };

  if (provinceItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <AlertCircle className="text-red-500 mb-2" size={40} />
        <h3 className="text-lg font-bold">Không tìm thấy địa điểm</h3>
        <p className="text-sm text-slate-500">Tỉnh thành hoặc địa phương này chưa có trong cơ sở dữ liệu.</p>
        <button onClick={handleBack} className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold cursor-pointer">
          Quay lại Cẩm nang
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-16">
      
      {/* ── HEADER BANNER WITH CRISP AUTOMATIC SLIDESHOW ── */}
      <div className="relative min-h-[340px] sm:min-h-[380px] flex items-end pb-12 px-6 sm:px-12 shadow-2xl overflow-hidden border-b border-teal-500/20">
        {/* Back Button Directly Inside Banner Top-Left */}
        <div className="absolute top-6 left-6 z-30">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/50 hover:bg-slate-950/80 border border-white/25 text-white transition-all text-xs font-bold shadow-xl cursor-pointer hover:scale-105"
          >
            <ArrowLeft size={16} />
            Quay lại Cẩm nang
          </button>
        </div>

        {/* Crisp Slideshow Image Layers with Smooth Cross-fade Transition */}
        {bannerPhotos.map((imgSrc, idx) => (
          <div
            key={imgSrc + idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out bg-cover bg-center ${
              idx === bannerSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${imgSrc})` }}
          />
        ))}

        {/* Light Transparent Gradient for Legibility - Zero Blur, Crisp Photos */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-slate-950/40 z-10 pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-3 relative z-20 w-full">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/25 border border-teal-400/40 text-teal-200 text-[10px] font-black uppercase tracking-wider shadow-md">
            <MapPin size={11} className="animate-pulse text-teal-300" />
            ĐỊA DANH VIỆT NAM
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-xl">{formattedName}</h1>
          <p className="text-xs sm:text-sm text-slate-100 max-w-2xl leading-relaxed drop-shadow-md font-medium">
            {taglineText}
          </p>

          {/* Slide Indicator Dots */}
          {bannerPhotos.length > 1 && (
            <div className="flex items-center gap-2 pt-2 z-20">
              {bannerPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBannerSlide(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    i === bannerSlide ? 'w-6 bg-teal-400' : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-12">
        
        {/* ── TOP SECTION: OVERVIEW (8 COLUMNS) & AI ASSISTANT (4 COLUMNS) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Overview Reading Section */}
          <div className="lg:col-span-8">
            {overviewItem && overviewPages.length > 0 && (
              <BookPageReader 
                title="Tổng Quan Địa Lý & Lịch Sử"
                pages={overviewPages}
                currentPage={overviewPage}
                onPageChange={setOverviewPage}
              />
            )}
          </div>

          {/* AI Assistant Sidebar */}
          <aside className="lg:col-span-4 h-full">
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl border border-indigo-900/50 shadow-2xl p-5 space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-400/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-teal-350">Trợ Lý Số Địa Phương</h4>
                  <p className="text-[9px] text-slate-400">Trả lời nghiêm ngặt theo tư liệu</p>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-normal">
                Trợ lý AI này được cung cấp độc quyền tệp tri thức chính thống của tỉnh {formattedName}. Hãy hỏi các thông tin cụ thể về thắng cảnh, chùa chiền hay lịch sử.
              </p>

              <form onSubmit={handleAiConsult} className="space-y-3">
                <textarea
                  value={aiQuestion}
                  onChange={e => setAiQuestion(e.target.value)}
                  placeholder={`Hỏi về danh thắng hay lịch sử của ${formattedName}...`}
                  className="w-full text-xs bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 resize-none h-16 transition-all"
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiQuestion.trim()}
                  className="w-full py-2 bg-gradient-to-r from-teal-400 to-indigo-500 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-xl shadow-lg cursor-pointer transition-all hover:scale-101 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  Tra Cứu Nhanh
                </button>
              </form>

              {aiResponse && (
                <div className="space-y-2 border-t border-slate-850 pt-4 animate-fade-in">
                  <span className="text-[8px] font-black uppercase text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/25">Phản hồi của trợ lý</span>
                  <p className="text-[10px] text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-950/30 p-3 rounded-xl border border-slate-900/60 max-h-[220px] overflow-y-auto">
                    {aiResponse}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* ── BOTTOM SECTION: TABS & ITEMS GRID (FULL WIDTH) ── */}
        {subCategoriesList.length > 0 && (
          <div className="space-y-6 pt-4 border-t border-slate-250 dark:border-slate-850">
            {/* Dynamic Tabs (Newspaper Header Style) */}
            <div className="flex border-b border-slate-250 dark:border-slate-850 overflow-x-auto gap-2 pb-1.5 scrollbar-none">
              {subCategoriesList.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === cat
                      ? 'bg-teal-600 text-white rounded-lg'
                      : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Editorial 2-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch" id="province-items-anchor">
              {paginatedCategoryItems.map((item, idx) => {
                const normalizedContent = normalizeParagraphs(item.content);
                const isLongText = normalizedContent.length > 200;
                const previewText = isLongText ? normalizedContent.slice(0, 200).trim() + '...' : normalizedContent;

                return (
                  <article 
                    key={idx} 
                    onClick={() => setActiveModalItem(item)}
                    className="h-full bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/60 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-150/40 dark:shadow-none hover:shadow-2xl hover:border-teal-500/30 transition-all duration-300 flex flex-col justify-between space-y-6 group relative overflow-hidden cursor-pointer"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 text-[10px] font-extrabold uppercase tracking-wider">
                          <Compass size={12} className="text-teal-500" />
                          {item.subCategory}
                        </span>
                      </div>
                      
                      <h4 className="text-base sm:text-lg font-black text-slate-955 dark:text-white leading-snug tracking-tight group-hover:text-teal-600 dark:group-hover:text-teal-455 transition-colors">
                        {item.name}
                      </h4>
                      
                      <p className="text-xs sm:text-[13px] leading-6 text-slate-655 dark:text-slate-350 text-left whitespace-pre-wrap font-normal tracking-wide">
                        {previewText}
                      </p>

                      {isLongText && (
                        <span className="inline-block text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:underline">
                          Xem chi tiết &rarr;
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Items Pagination Controls */}
            {totalItemPages > 1 && (
              <div className="flex justify-center items-center gap-1.5 pt-6">
                <button
                  onClick={() => {
                    setItemPage(prev => Math.max(prev - 1, 1));
                    document.getElementById('province-items-anchor')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  disabled={itemPage === 1}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-900 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-200"
                >
                  Trước
                </button>
                
                {Array.from({ length: totalItemPages }).map((_, i) => {
                  const pageNum = i + 1;
                  const active = itemPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setItemPage(pageNum);
                        document.getElementById('province-items-anchor')?.scrollIntoView({ behavior: 'smooth' });
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
                    setItemPage(prev => Math.min(prev + 1, totalItemPages));
                    document.getElementById('province-items-anchor')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  disabled={itemPage === totalItemPages}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-900 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-200"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL POPUP FOR READING (COMPACT & PREVENTING CARD UNEVENNESS) ── */}
      {activeModalItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in animate-duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative space-y-6">
            <button
              onClick={() => setActiveModalItem(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all text-lg font-bold"
            >
              &times;
            </button>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 text-[10px] font-extrabold uppercase tracking-wider">
                <Compass size={12} className="text-teal-500" />
                {activeModalItem.subCategory}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-955 dark:text-white tracking-tight leading-snug">
                {activeModalItem.name}
              </h3>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-655 dark:text-slate-350 whitespace-pre-wrap text-justify border-t border-slate-100 dark:border-slate-800 pt-4 font-normal">
              {normalizeParagraphs(activeModalItem.content)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
