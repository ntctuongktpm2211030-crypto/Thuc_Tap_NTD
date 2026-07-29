import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Compass, Sparkles, Loader2, ArrowLeft,
  AlertCircle, Send, Bot, MessageSquare, Zap
} from 'lucide-react';
import { KnowledgeEngine, normalizeProvinceKey, type KnowledgeItem } from './KnowledgeEngine';
import BookPageReader from './BookPageReader';
import { PROVINCE_LANDMARK_SLIDESHOW, DEFAULT_SLIDESHOW_IMAGES } from './ProvinceLandmarkData';
import { LANDMARK_IMAGES_MAPPING, getCategoryFallbackImage } from './LandmarkData';

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

function renderFormattedContent(text: string) {
  if (!text) return null;
  const normalized = text.normalize('NFC');
  const rawParagraphs = normalized.split(/\n\s*\n/);

  return (
    <div className="space-y-4 w-full">
      {rawParagraphs.map((rawPara, idx) => {
        const cleanedPara = rawPara.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
        if (!cleanedPara) return null;

        // Detect if this line is a heading/sub-heading (e.g. "MỸ THUẬT CỔ TRUYỀN")
        const isHeading = cleanedPara.length < 90 && (
          cleanedPara === cleanedPara.toUpperCase() ||
          /^[0-9IVXLCDM]+\.\s+/i.test(cleanedPara) ||
          cleanedPara.endsWith(':')
        );

        if (isHeading) {
          return (
            <h4 key={idx} className="font-black text-sm sm:text-base text-slate-900 dark:text-white mt-6 mb-2 text-center border-b border-slate-200 dark:border-slate-800 pb-2 tracking-wide uppercase">
              {cleanedPara}
            </h4>
          );
        }

        return (
          <p key={idx} className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 text-center font-normal tracking-normal">
            {cleanedPara}
          </p>
        );
      })}
    </div>
  );
}

// LandmarkCard component with exact mapped images + random 1-of-3 province photo fallback + Wikipedia lookup
function LandmarkCard({
  item,
  onClick,
  provincePhotos,
  fallbackBanner
}: {
  item: KnowledgeItem;
  onClick: (resolvedImage: string) => void;
  provincePhotos?: string[];
  fallbackBanner?: string;
}) {
  // Randomly pick 1 out of the 3 province photos for this landmark
  const [randomProvinceImage] = useState<string>(() => {
    if (provincePhotos && provincePhotos.length > 0) {
      const hash = item.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return provincePhotos[hash % provincePhotos.length];
    }
    return fallbackBanner || '';
  });

  const [imageUrl, setImageUrl] = useState<string>(() => {
    const upperName = item.name.toUpperCase();
    if (LANDMARK_IMAGES_MAPPING[upperName]) {
      return LANDMARK_IMAGES_MAPPING[upperName];
    }
    const matchedKey = Object.keys(LANDMARK_IMAGES_MAPPING).find(key => upperName.includes(key) || key.includes(upperName));
    if (matchedKey) {
      return LANDMARK_IMAGES_MAPPING[matchedKey];
    }
    return randomProvinceImage || '';
  });

  const categoryFallback = useMemo(() => {
    return randomProvinceImage || getCategoryFallbackImage(item);
  }, [item, randomProvinceImage]);

  useEffect(() => {
    if (imageUrl) return; // Already resolved via mapping or province photo

    let isMounted = true;
    const cleanQuery = item.name
      .replace(/^Lễ hội\s+/i, '')
      .replace(/^Chùa\s+/i, '')
      .replace(/^Ao\s+/i, '')
      .replace(/^Đền\s+/i, '')
      .replace(/^Thành cổ\s+/i, 'Thành nhà ')
      .replace(/^Cây đa\s+/i, '');

    fetch(`https://vi.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(item.name)}|${encodeURIComponent(cleanQuery)}|${encodeURIComponent(item.name + ' (' + item.province + ')')}&prop=pageimages&format=json&pithumbsize=600&origin=*`)
      .then(r => r.json())
      .then(data => {
        if (!isMounted) return;
        const pages = data.query?.pages;
        if (pages) {
          const firstPageWithImg = Object.values(pages).find((p: any) => p.thumbnail?.source) as any;
          if (firstPageWithImg?.thumbnail?.source) {
            setImageUrl(firstPageWithImg.thumbnail.source);
            return;
          }
        }
        setImageUrl(categoryFallback);
      })
      .catch(() => {
        if (isMounted) setImageUrl(categoryFallback);
      });

    return () => { isMounted = false; };
  }, [item.name, item.province, categoryFallback, imageUrl]);

  const normalizedContent = normalizeParagraphs(item.content);
  const previewText = normalizedContent.length > 130 ? normalizedContent.slice(0, 130).trim() + '...' : normalizedContent;
  const activeImage = imageUrl || categoryFallback;

  return (
    <div
      onClick={() => onClick(activeImage)}
      className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer group"
    >
      <div>
        {/* Image Box */}
        <div className="relative w-full h-44 rounded-[18px] overflow-hidden mb-4 bg-slate-100 dark:bg-slate-800">
          <img
            src={activeImage}
            alt={item.name}
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackBanner || 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800';
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Subcategory Pill */}
          <div className="absolute top-3 left-3 bg-[#1859B4] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
            <Compass size={11} className="text-white" />
            <span>{item.subCategory}</span>
          </div>
        </div>

        <h4 className="text-base font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors mb-2 line-clamp-1">
          {item.name}
        </h4>

        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4">
          {previewText}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:underline">
          Xem chi tiết →
        </span>
        <div className="w-7 h-7 rounded-full border border-blue-200 text-blue-600 flex items-center justify-center text-xs">
          <Sparkles size={13} />
        </div>
      </div>
    </div>
  );
}

export default function ProvinceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // AI assistant states
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  // Active modal item state for popup details (stores item + resolved outer card image)
  const [activeModalItem, setActiveModalItem] = useState<{ item: KnowledgeItem; resolvedImage: string } | null>(null);

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
  const handleAiConsult = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const queryStr = overrideQuery || aiQuestion;
    if (!queryStr.trim()) return;

    if (overrideQuery) {
      setAiQuestion(overrideQuery);
    }

    setAiLoading(true);
    setAiResponse('');
    try {
      // Mock an AI model response running strictly on the generated context
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const query = queryStr.toLowerCase().trim();
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
      <div className="relative min-h-[400px] sm:min-h-[450px] flex items-end pb-16 px-6 sm:px-12 shadow-2xl overflow-hidden border-b border-teal-500/20">
        {/* Back Button Directly Inside Banner Top-Left */}
        <div className="absolute top-6 left-6 z-30">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900/60 backdrop-blur-sm hover:bg-slate-900/80 border border-white/10 text-white transition-all text-[13px] font-semibold shadow-xl cursor-pointer hover:scale-105"
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
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent z-10 pointer-events-none" />

        <div className="max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4 relative z-20 w-full">
          {/* Blue Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1859B4] text-white text-[11px] font-bold uppercase tracking-wider shadow-md">
            <MapPin size={12} className="text-white" />
            ĐỊA DANH VIỆT NAM
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white drop-shadow-xl">{formattedName}</h1>
          
          <p className="text-sm sm:text-base text-slate-200 max-w-2xl leading-relaxed drop-shadow-md font-medium">
            {taglineText}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center gap-2 text-white/90 text-[13px] font-semibold bg-slate-900/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
              <Compass size={14} className="text-white" />
              <span>Diện tích: 2.360 km²</span>
            </div>
            <div className="flex items-center gap-2 text-white/90 text-[13px] font-semibold bg-slate-900/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
              <Sparkles size={14} className="text-white" />
              <span>Dân số: 1.006.000+</span>
            </div>
          </div>

          {/* Slide Indicator Dots */}
          {bannerPhotos.length > 1 && (
            <div className="absolute right-0 bottom-0 flex items-center gap-2 z-20">
              {bannerPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBannerSlide(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    i === bannerSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* ── TOP SECTION: OVERVIEW (7 COLUMNS / ~60%) & AI ASSISTANT (5 COLUMNS / ~40%) - UNIFIED 580PX FIXED HEIGHT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Overview Reading Section (Book Card - Unified 580px Fixed Height matching AI Card) */}
          <div className="lg:col-span-7 h-[580px] flex flex-col justify-between bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-5 sm:p-6 overflow-hidden">
            {overviewItem && overviewPages.length > 0 && (
              <BookPageReader 
                title="Tổng Quan Địa Lý & Lịch Sử"
                pages={overviewPages}
                currentPage={overviewPage}
                onPageChange={setOverviewPage}
              />
            )}
          </div>

          {/* AI Assistant Sidebar (40% Width - Unified 580px Fixed Height & 200px Scrollable Response Viewport) */}
          <aside className="lg:col-span-5 h-[580px]">
            <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-5 sm:p-6 flex flex-col justify-between h-[580px] overflow-hidden transition-all">
              <div className="flex flex-col gap-3 shrink-0">
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        Trợ Lý Số Địa Phương
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <Bot size={12} className="text-blue-500 shrink-0" />
                        Hỏi về {formattedName} ngay tại đây!
                      </p>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                    <Send size={14} className="-rotate-12" />
                  </div>
                </div>

                {/* Sub-text Description Banner */}
                <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2.5">
                  <MessageSquare size={15} className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Tri thức chính thống tỉnh <span className="font-bold text-blue-600 dark:text-blue-400">{formattedName}</span>.
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Nhập câu hỏi chi tiết bên dưới để nhận thông tin giải đáp từ trợ lý AI.
                    </p>
                  </div>
                </div>

                {/* Quick Prompt Suggestion Chips */}
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Zap size={11} className="text-amber-500" /> Gợi ý nhanh:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      `Thắng cảnh ở ${formattedName}`,
                      `Đặc sản ${formattedName}`,
                      `Lễ hội truyền thống`
                    ].map((chipText, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAiConsult(undefined, chipText)}
                        className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/60 dark:border-slate-700/60 transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                      >
                        💡 {chipText}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Input Form */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-2xl p-2.5 relative transition-all shadow-inner group/input">
                  <form onSubmit={(e) => handleAiConsult(e)} className="flex flex-col">
                    <textarea
                      value={aiQuestion}
                      onChange={e => setAiQuestion(e.target.value)}
                      placeholder={`Hỏi về danh thắng hay lịch sử của ${formattedName}...`}
                      className="w-full text-xs sm:text-sm bg-transparent border-none text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none h-14 leading-relaxed scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
                    />
                    
                    {/* Clean Floating Avatar Badge */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
                      <span className="text-[10px] font-medium text-slate-400">AI Assistant v2.0</span>
                      <img 
                        src="https://cdn-icons-png.flaticon.com/512/8649/8649605.png" 
                        alt="AI Bot" 
                        className="w-4 h-4 object-contain opacity-70 group-hover/input:scale-110 transition-transform"
                      />
                    </div>
                  </form>
                </div>

                {/* Action Button (Tra Cứu Nhanh) */}
                <button
                  onClick={(e) => handleAiConsult(e)}
                  disabled={aiLoading || !aiQuestion.trim()}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/20 cursor-pointer transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.99] shrink-0"
                >
                  {aiLoading ? (
                    <Loader2 size={16} className="animate-spin text-white" />
                  ) : (
                    <>
                      <span>Tra Cứu Nhanh</span>
                      <Send size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              {/* AI Response Display Area - Internal Scrollable View (200px Viewport) */}
              {aiResponse && (
                <div className="mt-2 space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-2 animate-fade-in flex-1 min-h-0 flex flex-col justify-end">
                  <div className="flex items-center justify-between shrink-0">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/50">
                      <Sparkles size={11} /> Phản hồi từ Trợ lý AI
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-inner max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500">
                    {aiResponse}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* ── BOTTOM SECTION: TABS & ITEMS GRID (FULL WIDTH MATCHING MOCKUP) ── */}
        {subCategoriesList.length > 0 && (
          <div className="space-y-6 pt-8 border-t border-slate-200 dark:border-slate-800">
            {/* Header & Tabs Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase text-slate-900 dark:text-white tracking-tight">
                    THẮNG CẢNH & LỄ HỘI
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Khám phá những điều đặc sắc theo mùa ở {formattedName}
                  </p>
                </div>
              </div>

              {/* Blue Pill Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                {subCategoriesList.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`px-5 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                      activeTab === cat
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* 3-Column Grid Carousel with Navigation Arrows */}
            <div className="relative px-2 sm:px-6">
              {/* Previous Carousel Page Button */}
              {itemPage > 1 && (
                <button
                  onClick={() => setItemPage(prev => Math.max(prev - 1, 1))}
                  className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-center text-slate-700 dark:text-white hover:scale-110 transition-all cursor-pointer"
                >
                  &larr;
                </button>
              )}

              {/* Next Carousel Page Button */}
              {itemPage < totalItemPages && (
                <button
                  onClick={() => setItemPage(prev => Math.min(prev + 1, totalItemPages))}
                  className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-center text-slate-700 dark:text-white hover:scale-110 transition-all cursor-pointer"
                >
                  &rarr;
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch" id="province-items-anchor">
                {paginatedCategoryItems.slice(0, 3).map((item, idx) => (
                  <LandmarkCard
                    key={idx}
                    item={item}
                    provincePhotos={bannerPhotos}
                    fallbackBanner={bannerPhotos[idx % bannerPhotos.length]}
                    onClick={(imgUrl) => setActiveModalItem({ item, resolvedImage: imgUrl })}
                  />
                ))}
              </div>
            </div>

            {/* Pagination Dots */}
            {totalItemPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-4">
                {Array.from({ length: totalItemPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setItemPage(i + 1)}
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                      itemPage === i + 1 ? 'bg-blue-600 w-5' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {activeModalItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[99999] p-4 sm:p-6 pt-20 pb-8 animate-fade-in animate-duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative space-y-4">
            <button
              onClick={() => setActiveModalItem(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all text-lg font-bold z-10"
            >
              &times;
            </button>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 text-[10px] font-extrabold uppercase tracking-wider">
                <Compass size={12} className="text-teal-500" />
                {activeModalItem.item.subCategory}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight leading-snug">
                {activeModalItem.item.name}
              </h3>
            </div>

            {/* Display EXACT Resolved Image from Outer Card */}
            <div className="relative w-full h-56 sm:h-80 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-md my-4 shrink-0">
              <img
                src={activeModalItem.resolvedImage}
                alt={activeModalItem.item.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = bannerPhotos[0] || 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800';
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent pointer-events-none" />
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 w-full">
              {renderFormattedContent(activeModalItem.item.content)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
