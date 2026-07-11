import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, MapPin, Utensils, Landmark, ExternalLink, Sparkles,
  ChevronRight, Search, Filter, Layers, Tag, FileText,
} from 'lucide-react';
import { buildHandbook, type HandbookType } from './exploreHandbook';
import { getExplorePosts } from './explorePostsStore';

const VALID: HandbookType[] = ['am-thuc', 'van-hoa'];

export default function ExploreHandbookPage() {
  const { type } = useParams<{ type: string }>();
  const handbookType: HandbookType = VALID.includes(type as HandbookType) ? (type as HandbookType) : 'am-thuc';
  const doc = buildHandbook(getExplorePosts(), handbookType);
  const isFood = handbookType === 'am-thuc';
  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const allItems = useMemo(() => [...new Set(doc.sections.flatMap(s => s.items))], [doc.sections]);

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return doc.sections;
    return doc.sections.filter(
      s =>
        s.heading.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q) ||
        s.items.some(i => i.toLowerCase().includes(q)),
    );
  }, [doc.sections, query]);

  const accent = isFood
    ? { grad: 'from-amber-400 via-orange-400 to-rose-400', chip: 'bg-amber-100 text-amber-900 border-amber-200', hero: 'explore-handbook-hero--food' }
    : { grad: 'from-violet-500 via-purple-500 to-fuchsia-500', chip: 'bg-violet-100 text-violet-900 border-violet-200', hero: 'explore-handbook-hero--culture' };

  return (
    <div className="explore-page explore-handbook-page min-h-screen">
      <header className={`explore-handbook-hero ${accent.hero}`}>
        <div className="container-wide py-4 sm:py-6">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft size={18} /> Khám phá
          </Link>

          <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-end">
            <div className="space-y-4">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${accent.chip}`}>
                {isFood ? <Utensils size={14} /> : <Landmark size={14} />}
                Cẩm nang tổng hợp · SmartTravel
              </span>
              <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-slate-900 leading-tight">
                {doc.title}
              </h1>
              <p className="text-slate-600 text-base sm:text-lg max-w-2xl leading-relaxed">{doc.intro}</p>
              <p className="text-xs text-slate-500">{doc.subtitle} · Cập nhật {doc.updatedAt}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 min-w-[240px]">
              {[
                { n: doc.sections.length, l: 'Điểm đến', icon: MapPin },
                { n: allItems.length, l: isFood ? 'Món / quán' : 'Chủ đề', icon: Tag },
                { n: doc.sections.reduce((a, s) => a + s.sourcePostIds.length, 0), l: 'Bài nguồn', icon: FileText },
              ].map(({ n, l, icon: Icon }) => (
                <div key={l} className="explore-handbook-stat">
                  <Icon size={16} className={isFood ? 'text-amber-600' : 'text-violet-600'} />
                  <div className="text-xl font-extrabold text-slate-900">{n}</div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {allItems.length > 0 && (
            <div className="mt-8">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                <Sparkles size={12} /> Nổi bật
              </p>
              <div className="flex flex-wrap gap-2">
                {allItems.slice(0, 12).map(item => (
                  <span key={item} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${accent.chip}`}>
                    {item}
                  </span>
                ))}
                {allItems.length > 12 && (
                  <span className="text-xs text-slate-500 self-center">+{allItems.length - 12} khác</span>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="container-wide py-4 sm:py-6 pb-16">
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Tìm điểm đến, món ăn, chủ đề..."
              className="explore-search !py-2.5 !pl-10 w-full"
            />
          </div>
          <div className="flex gap-2">
            <Link
              to="/explore/cam-nang/am-thuc"
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors ${handbookType === 'am-thuc' ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-200'}`}
            >
              Ẩm thực
            </Link>
            <Link
              to="/explore/cam-nang/van-hoa"
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors ${handbookType === 'van-hoa' ? 'bg-violet-100 border-violet-300 text-violet-900' : 'bg-white border-slate-200 text-slate-600 hover:border-violet-200'}`}
            >
              Văn hóa
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="explore-sidebar-card lg:sticky lg:top-6 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <BookOpen size={14} /> Mục lục ({filteredSections.length})
              </h2>
              <nav className="space-y-1 max-h-[50vh] lg:max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
                {filteredSections.map((s, i) => (
                  <a
                    key={s.id}
                    href={`#section-${s.id}`}
                    onClick={() => setActiveSection(s.id)}
                    className={`explore-handbook-toc-item ${activeSection === s.id ? 'explore-handbook-toc-item--active' : ''}`}
                  >
                    <span className="text-[10px] font-bold text-slate-400 w-5">{i + 1}</span>
                    <span className="flex-1 min-w-0 truncate">{s.heading}</span>
                    <ChevronRight size={14} className="flex-shrink-0 opacity-40" />
                  </a>
                ))}
              </nav>
              {filteredSections.length === 0 && (
                <p className="text-sm text-slate-500 py-4 text-center">Không có mục phù hợp.</p>
              )}
            </div>
          </aside>

          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {filteredSections.length === 0 ? (
              <div className="explore-sidebar-card text-center py-16">
                <Filter size={32} className="mx-auto text-slate-300 mb-3" />
                <p className="font-semibold text-slate-700">Không tìm thấy nội dung</p>
                <p className="text-sm text-slate-500 mt-1">Thử từ khóa khác hoặc xem cẩm nang kia.</p>
              </div>
            ) : (
              filteredSections.map(section => (
                <article
                  key={section.id}
                  id={`section-${section.id}`}
                  className="explore-handbook-section-card scroll-mt-6"
                >
                  {section.coverImage && (
                    <div className="explore-handbook-section-card__media">
                      <img src={section.coverImage} alt="" loading="lazy" />
                      <div className={`absolute inset-0 bg-gradient-to-t ${isFood ? 'from-amber-950/80' : 'from-violet-950/80'} to-transparent`} />
                      <div className="absolute bottom-4 left-4 right-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${accent.chip}`}>
                          {section.province || section.destination}
                        </span>
                        <h2 className="font-editorial text-xl sm:text-2xl font-bold text-white mt-2">{section.heading}</h2>
                      </div>
                    </div>
                  )}

                  <div className="p-5 sm:p-6 space-y-4">
                    {!section.coverImage && (
                      <>
                        <h2 className="font-editorial text-xl sm:text-2xl font-bold text-slate-900">{section.heading}</h2>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <MapPin size={14} className="text-teal-600" />
                          {section.province || section.destination}
                        </p>
                      </>
                    )}

                    {section.excerpt && (
                      <p className="text-slate-600 leading-relaxed text-sm sm:text-base border-l-4 border-teal-400 pl-4">
                        {section.excerpt}
                      </p>
                    )}

                    {section.items.length > 0 && (
                      <div className={`rounded-xl p-4 ${isFood ? 'bg-amber-50/80 border border-amber-100' : 'bg-violet-50/80 border border-violet-100'}`}>
                        <p className="text-xs font-bold uppercase text-slate-600 mb-3 flex items-center gap-1.5">
                          <Layers size={13} />
                          {isFood ? 'Món & gợi ý ẩm thực' : 'Chủ đề văn hóa'}
                        </p>
                        <ul className="grid sm:grid-cols-2 gap-2">
                          {section.items.map(item => (
                            <li
                              key={item}
                              className="text-sm font-medium text-slate-800 bg-white/90 px-3 py-2 rounded-lg border border-slate-100 flex items-center gap-2"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isFood ? 'bg-amber-500' : 'bg-violet-500'}`} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <p className="text-xs text-slate-500">
                        {section.sourcePostIds.length} bài viết cộng đồng
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {section.sourcePostIds.slice(0, 3).map(pid => (
                          <Link
                            key={pid}
                            to={`/explore/post/${pid}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-100 transition-colors"
                          >
                            Đọc bài <ExternalLink size={10} />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 gap-4">
          <Link to="/explore" className="explore-handbook-cta">
            <Sparkles size={20} className="text-teal-600" />
            <div>
              <p className="font-bold text-slate-900">Khám phá thêm bài viết</p>
              <p className="text-xs text-slate-500 mt-0.5">Magazine du lịch từ cộng đồng</p>
            </div>
            <ChevronRight size={18} className="ml-auto text-slate-400" />
          </Link>
          <Link
            to={isFood ? '/explore/cam-nang/van-hoa' : '/explore/cam-nang/am-thuc'}
            className="explore-handbook-cta"
          >
            {isFood ? <Landmark size={20} className="text-violet-600" /> : <Utensils size={20} className="text-amber-600" />}
            <div>
              <p className="font-bold text-slate-900">
                {isFood ? 'Cẩm nang văn hóa' : 'Cẩm nang ẩm thực'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Chuyển sang chủ đề khác</p>
            </div>
            <ChevronRight size={18} className="ml-auto text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
