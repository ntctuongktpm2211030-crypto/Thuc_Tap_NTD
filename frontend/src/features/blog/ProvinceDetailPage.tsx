import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapPin, Compass, Sparkles, ArrowLeft, AlertCircle
} from 'lucide-react';
import { KnowledgeEngine, normalizeProvinceKey, parseJsonHandbookContent, type KnowledgeItem } from './KnowledgeEngine';
import BookPageReader from './BookPageReader';
import { PROVINCE_LANDMARK_SLIDESHOW, DEFAULT_SLIDESHOW_IMAGES } from './ProvinceLandmarkData';
import { LANDMARK_IMAGES_MAPPING, getCategoryFallbackImage } from './LandmarkData';
import api from '../../services/api';
import { fetchJson } from '../../utils/fetchUtils';

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

function renderFormattedContent(text: string, titleHint?: string) {
  if (!text) return null;

  let cleaned = text.normalize('NFC');

  // Strip recurring PDF page header artifacts
  cleaned = cleaned
    .replace(/CÁC DÂN TỘC VIỆT NAM/gi, '')
    .replace(/CÁC TỈNH\s*&\s*THÀNH PHỐ/gi, '')
    .replace(/CÁC TỈNH\s*VÀ\s*THÀNH PHỐ/gi, '');

  if (titleHint) {
    const cleanHint = titleHint.replace(/^(DÂN TỘC|TỈNH|TP\.|THÀNH PHỐ)\s+/i, '').trim();
    if (cleanHint.length >= 2) {
      const hintRegex = new RegExp(`^DÂN TỘC\\s+${cleanHint.toUpperCase()}$`, 'gim');
      cleaned = cleaned.replace(hintRegex, '');
    }
  }

  // Split into paragraphs by double newlines or block elements
  const rawParagraphs = cleaned.split(/\r?\n\s*\r?\n/);
  const blocks: string[] = [];

  rawParagraphs.forEach(p => {
    const trimmed = p.trim();
    if (!trimmed) return;

    // If it contains headings or bullet points, preserve line splits for those
    if (trimmed.includes('#') || trimmed.includes('•') || trimmed.includes('- ')) {
      const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      blocks.push(...lines);
    } else {
      // Merge single line breaks in normal body paragraph
      const merged = trimmed.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
      if (merged) blocks.push(merged);
    }
  });

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
    <div className="space-y-4 w-full text-justify my-2">
      {blocks.map((block, idx) => {
        // Headings (e.g. ### Heading)
        if (block.startsWith('#') || block.startsWith('###')) {
          const cleanHeading = block.replace(/^#+\s*/, '').trim();
          return (
            <h4 key={idx} className="text-base sm:text-lg font-black text-blue-700 dark:text-blue-400 mt-5 mb-2 pb-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 text-left w-full">
              <span>{cleanHeading}</span>
            </h4>
          );
        }

        // Bullet points (e.g. • Item or - Item)
        if (block.startsWith('•') || block.startsWith('-') || block.startsWith('* ')) {
          const content = block.replace(/^[•\-\*]\s*/, '').trim();
          return (
            <div key={idx} className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-3.5 px-4 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shadow-sm hover:border-blue-300 transition-colors w-full">
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 shrink-0 shadow-sm" />
              <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium text-justify w-full block">
                {parseInline(content)}
              </span>
            </div>
          );
        }

        // Standard Full-Width Paragraph
        return (
          <p key={idx} className="text-xs sm:text-sm leading-relaxed sm:leading-loose text-slate-700 dark:text-slate-300 font-normal text-justify w-full block tracking-normal">
            {parseInline(block)}
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

    fetchJson(`https://vi.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(item.name)}|${encodeURIComponent(cleanQuery)}|${encodeURIComponent(item.name + ' (' + item.province + ')')}&prop=pageimages&format=json&pithumbsize=600&origin=*`)
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


  // Active modal item state for popup details (stores item + resolved outer card image)
  const [activeModalItem, setActiveModalItem] = useState<{ item: KnowledgeItem; resolvedImage: string } | null>(null);

  // Active modal item state removed since all contents are displayed fully on cards

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

  const [searchParams] = useSearchParams();
  const catParam = searchParams.get('category');

  const [activeTab, setActiveTab] = useState<string>(() => {
    return subCategoriesList[0] ?? '';
  });

  useEffect(() => {
    if (catParam && subCategoriesList.length > 0) {
      const targetCat = catParam.toUpperCase();
      const match = subCategoriesList.find(c => c.includes(targetCat) || targetCat.includes(c));
      if (match) {
        setActiveTab(match);
      }
    }
  }, [catParam, subCategoriesList]);

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

  const formattedName = useMemo(() => {
    if (!id) return '';
    let decoded = id;
    try {
      decoded = decodeURIComponent(id);
    } catch {}
    return decoded.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }, [id]);

  const overviewPages = useMemo(() => {
    let contentToUse = overviewItem?.content;
    if (!contentToUse && provinceItems.length > 0) {
      const firstItem = provinceItems[0];
      if (firstItem?.content) {
        contentToUse = `${formattedName} là địa danh du lịch nổi tiếng với nhiều danh thắng và di sản văn hóa đặc sắc. ${firstItem.content}`;
      }
    }
    if (!contentToUse) return [];

    const cleanText = contentToUse.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
    const words = cleanText.split(' ').filter(Boolean);
    
    // ~330 words per page fills both 2 columns in larger book layout
    const wordsPerPage = 330;
    if (words.length <= wordsPerPage) {
      return [cleanText];
    }

    const pages: string[] = [];
    for (let i = 0; i < words.length; i += wordsPerPage) {
      pages.push(words.slice(i, i + wordsPerPage).join(' '));
    }

    return pages;
  }, [overviewItem, provinceItems, formattedName]);

  useEffect(() => {
    setOverviewPage(1);
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
        
        {/* ── TOP SECTION: OVERVIEW (BOOK CARD - CENTERED & BALANCED LAYOUT) ── */}
        {overviewPages.length > 0 && (
          <div className="max-w-6xl mx-auto w-full">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-5 sm:p-8 overflow-hidden">
              <BookPageReader 
                title={`Tổng Quan Địa Lý & Lịch Sử ${formattedName}`}
                pages={overviewPages}
                currentPage={overviewPage}
                onPageChange={setOverviewPage}
              />
            </div>
          </div>
        )}

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
              {renderFormattedContent(activeModalItem.item.content, activeModalItem.item.name)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
