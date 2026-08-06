import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Users, Search, Sparkles, Clock, ArrowRight,
  Utensils, Landmark, Heart, Compass,
  Navigation, AlertCircle, Bookmark, Image as ImageIcon
} from 'lucide-react';
import { searchPlaces } from '../../utils/geocodeUtils';
import { postsService } from '../../services/smartTravel.service';
import ExploreFiltersPanel, { DEFAULT_EXPLORE_FILTERS, type ExploreFilterState } from './ExploreFiltersPanel';
import { distanceKm, type ExplorePost, EXPLORE_DESTINATIONS, EXPLORE_DISHES, EXPLORE_CULTURE } from './exploreBlogData';
import { toExplorePostId } from '../../utils/postIds';
import { getExplorePosts, setExplorePosts } from './explorePostsStore';
import blogVideo from '../../../../video.mp4';
import { KineticText } from '../../components/ui/kinetic-text';
import { toast } from '../../contexts/ToastContext';

// Local storage key for search history
const HISTORY_KEY = 'terraholic_explore_search_history';



export default function ExploreHub() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ExplorePost[]>(() => getExplorePosts());
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [filters, setFilters] = useState<ExploreFilterState>(DEFAULT_EXPLORE_FILTERS);
  const [locating, setLocating] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedPage, setFeedPage] = useState(1);
  const postsPerPage = 6;

  // Infinite Scroll Trigger Ref
  const loaderRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset feed page when query or filters change
  useEffect(() => {
    setFeedPage(1);
  }, [debouncedSearch, filters]);

  // Load feed posts initially
  useEffect(() => {
    postsService
      .feed({ page: 1, limit: 30 })
      .then(({ posts: apiPosts }) => {
        const mapped = apiPosts
          .map((p: any) => {
            try {
              const payload = JSON.parse(p.content);
              const category = payload.category === 'food' || p.content.includes('am-thuc') ? 'Ẩm thực' : 'Văn hóa';
              return {
                id: toExplorePostId(p.id),
                author: p.author.profile?.fullName || p.author.email.split('@')[0],
                handle: `@${p.author.email.split('@')[0]}`,
                avatar: p.author.profile?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
                verified: p.author.role === 'admin' || p.likes?.length > 10,
                title: payload.title || payload.headline || 'Khám phá Việt Nam',
                excerpt: payload.excerpt || p.content.slice(0, 150),
                content: p.content,
                coverImage: p.mediaUrls?.[0] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80',
                tags: payload.tags || [],
                category,
                location: payload.destination || 'Việt Nam',
                province: payload.destination || 'Việt Nam',
                region: 'Bắc' as const,
                lat: payload.location?.lat || 21.0285,
                lng: payload.location?.lng || 105.8542,
                destinations: [payload.destination || 'Việt Nam'],
                dishes: category === 'Ẩm thực' ? ['Món ngon'] : [],
                cultureThemes: category === 'Văn hóa' ? ['Văn hóa'] : [],
                date: new Date(p.createdAt).toLocaleDateString('vi-VN'),
                readTime: 4,
                likes: p._count?.likes || 0,
                comments: [],
                bookmarked: !!p.isBookmarked,
                liked: !!p.isLiked,
              };
            } catch {
              return null;
            }
          })
          .filter(Boolean) as ExplorePost[];

        if (mapped.length > 0) {
          const merged = [...getExplorePosts()];
          for (const m of mapped) {
            if (m && !merged.some(x => x.id === m.id)) merged.unshift(m);
          }
          setExplorePosts(merged);
          setPosts(merged);
        }
      })
      .catch(() => {});
  }, []);

  // Infinite Scroll Trigger
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page]);

  const loadMorePosts = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { posts: apiPosts } = await postsService.feed({ page: nextPage, limit: 12 });
      if (apiPosts.length === 0) {
        setHasMore(false);
      } else {
        const mapped = apiPosts
          .map((p: any) => {
            try {
              const payload = JSON.parse(p.content);
              return {
                id: toExplorePostId(p.id),
                author: p.author.profile?.fullName || p.author.email.split('@')[0],
                handle: `@${p.author.email.split('@')[0]}`,
                avatar: p.author.profile?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
                verified: false,
                title: payload.title || payload.headline || 'Khám phá mới',
                excerpt: payload.excerpt || p.content.slice(0, 150),
                content: p.content,
                coverImage: p.mediaUrls?.[0] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80',
                tags: payload.tags || [],
                category: 'Phiêu lưu',
                location: payload.destination || 'Việt Nam',
                province: payload.destination || 'Việt Nam',
                region: 'Bắc' as const,
                lat: payload.location?.lat || 21.0285,
                lng: payload.location?.lng || 105.8542,
                destinations: [payload.destination || 'Việt Nam'],
                dishes: [],
                cultureThemes: [],
                date: new Date(p.createdAt).toLocaleDateString('vi-VN'),
                readTime: 3,
                likes: p._count?.likes || 0,
                comments: [],
                bookmarked: !!p.isBookmarked,
                liked: !!p.isLiked,
              };
            } catch {
              return null;
            }
          })
          .filter(Boolean) as ExplorePost[];

        if (mapped.length > 0) {
          setPosts(prev => [...prev, ...mapped]);
          setPage(nextPage);
        } else {
          setHasMore(false);
        }
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleUseMyLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      setFilters(prev => ({ ...prev, userAddress: 'TP. Hồ Chí Minh', userLat: 10.7769, userLng: 106.7009 }));
      toast.info('Trình duyệt không hỗ trợ định vị. Đã tự động chọn vị trí TP. Hồ Chí Minh.');
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        setFilters(prev => ({ ...prev, userLat: latitude, userLng: longitude }));
        try {
          const results = await searchPlaces(`${latitude},${longitude}`);
          if (results[0]) {
            setFilters(prev => ({
              ...prev,
              userAddress: results[0].displayName || results[0].name,
              userLat: results[0].lat,
              userLng: results[0].lng,
            }));
          } else {
            setFilters(prev => ({
              ...prev,
              userAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              userLat: latitude,
              userLng: longitude,
            }));
          }
        } catch {
          setFilters(prev => ({
            ...prev,
            userAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            userLat: latitude,
            userLng: longitude,
          }));
        } finally {
          setLocating(false);
        }
      },
      () => {
        // Fallback gracefully on GPS denial or error
        setFilters(prev => ({ ...prev, userAddress: 'TP. Hồ Chí Minh', userLat: 10.7769, userLng: 106.7009 }));
        toast.info('Đã bật vị trí TP. Hồ Chí Minh (Bật GPS trình duyệt để định vị chính xác).');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 6000 },
    );
  };

  // Add search query to history list
  const addSearchHistory = (q: string) => {
    if (!q.trim()) return;
    const filtered = searchHistory.filter(x => x !== q);
    const next = [q, ...filtered].slice(0, 5);
    setSearchHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  // Apply filters on post list
  const filteredPosts = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return posts.filter(p => {
      if (filters.onlyBookmarked && !p.bookmarked) return false;
      if (filters.activeCategory !== 'Tất cả' && p.category !== filters.activeCategory) return false;
      if (filters.activeRegion !== 'Tất cả miền' && p.region !== filters.activeRegion) return false;

      if (filters.selectedDestinations.length > 0) {
        if (!filters.selectedDestinations.some(d => p.destinations.includes(d) || p.province.includes(d))) return false;
      }

      if (filters.userLat != null && filters.userLng != null && filters.maxDistanceKm != null) {
        const dist = distanceKm(filters.userLat, filters.userLng, p.lat, p.lng);
        if (dist > filters.maxDistanceKm) return false;
      }

      if (q) {
        const hay = [
          p.title, p.excerpt, p.author, p.location, p.province, p.category,
          ...p.tags, ...p.destinations, ...p.dishes, ...p.cultureThemes
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [posts, debouncedSearch, filters]);

  // Resolve Search Auto-Suggestions
  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    
    const matchedDests = EXPLORE_DESTINATIONS.filter(d => d.toLowerCase().includes(q)).map(d => ({ text: d, type: 'destination' }));
    const matchedDishes = EXPLORE_DISHES.filter(d => d.toLowerCase().includes(q)).map(d => ({ text: d, type: 'dish' }));
    const matchedCulture = EXPLORE_CULTURE.filter(c => c.toLowerCase().includes(q)).map(c => ({ text: c, type: 'culture' }));

    return [...matchedDests, ...matchedDishes, ...matchedCulture].slice(0, 6);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredPosts.slice(1).length / postsPerPage);
  const pagedPosts = useMemo(() => {
    const start = (feedPage - 1) * postsPerPage;
    const end = start + postsPerPage;
    return filteredPosts.slice(1).slice(start, end);
  }, [filteredPosts, feedPage, postsPerPage]);

  const handleNextPage = () => {
    if (feedPage < totalPages) {
      setFeedPage(prev => prev + 1);
      document.getElementById('feed-start-anchor')?.scrollIntoView({ behavior: 'smooth' });
    } else if (hasMore && !loadingMore) {
      loadMorePosts().then(() => {
        setFeedPage(prev => prev + 1);
        document.getElementById('feed-start-anchor')?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  };

  // Nearby Discovery Items
  const nearbyStories = useMemo(() => {
    if (filters.userLat == null || filters.userLng == null) return [];
    return posts
      .map(p => {
        const dist = distanceKm(filters.userLat!, filters.userLng!, p.lat, p.lng);
        return { ...p, dist };
      })
      .filter(p => p.dist <= 100)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 4);
  }, [posts, filters.userLat, filters.userLng]);

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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 dark:bg-slate-900/40 border border-white/30 text-[10px] font-bold text-white uppercase tracking-widest backdrop-blur-md">
            <Sparkles size={11} className="text-amber-300 animate-pulse" />
            Khám Phá Bản Đồ Trải Nghiệm Việt Nam
          </span>
          <h1 className="font-editorial text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight drop-shadow-sm flex flex-wrap justify-center gap-x-3 select-none">
            <KineticText text="Khám Phá" as="span" className="text-white" />
            <KineticText text="Câu Chuyện Du Lịch" as="span" className="bg-gradient-to-r from-teal-300 via-sky-300 to-brand-300 bg-clip-text text-transparent" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-100 font-bold max-w-xl mx-auto drop-shadow">
            Tổng hợp cẩm nang ẩm thực đặc sản, di sản văn hóa, và những hành trình phiêu lưu kỳ vĩ chia sẻ bởi cộng đồng lữ hành Terraholic.
          </p>
        </div>
      </header>

      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* ── 1. UNIVERSAL SMART SEARCH & FLOATING PANEL ── */}
        <div className="relative max-w-3xl mx-auto -mt-16 z-20">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-3 flex items-center gap-2 relative group focus-within:border-blue-500 transition-all">
            <Search className="text-slate-400 dark:text-slate-500 ml-2" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowSearchSuggestions(true);
              }}
              onFocus={() => setShowSearchSuggestions(true)}
              placeholder="Tìm điểm đến, món ngon đặc sản, văn hóa địa phương, tác giả..."
              className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 border-none outline-none focus:ring-0"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchSuggestions(false);
                }}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2"
              >
                ✕
              </button>
            )}
            <button
              onClick={() => {
                addSearchHistory(searchQuery);
                setShowSearchSuggestions(false);
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
            >
              Tìm kiếm
            </button>
            
            {/* Auto-suggest dropdown & History */}
            {showSearchSuggestions && (
              <div className="absolute left-0 right-0 top-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mt-2 shadow-2xl overflow-hidden z-30 p-2 animate-fade-in">
                {searchSuggestions.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1">Đề xuất tìm kiếm</p>
                    {searchSuggestions.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setSearchQuery(item.text);
                          addSearchHistory(item.text);
                          setShowSearchSuggestions(false);
                        }}
                        className="flex items-center justify-between px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg cursor-pointer text-xs"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {item.type === 'destination' ? '📍' : item.type === 'dish' ? '🍲' : '🎭'} {item.text}
                        </span>
                        <span className="text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase">
                          {item.type}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Search History */}
                {searchHistory.length > 0 && (
                  <div className="border-t border-slate-150 dark:border-slate-800/60 mt-1.5 pt-2">
                    <div className="flex justify-between items-center px-3 py-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tìm kiếm gần đây</p>
                      <button onClick={clearHistory} className="text-[9px] text-rose-500 font-bold hover:underline bg-transparent border-none cursor-pointer">Xóa lịch sử</button>
                    </div>
                    {searchHistory.map((h, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setSearchQuery(h);
                          setShowSearchSuggestions(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg cursor-pointer text-xs text-slate-600 dark:text-slate-350"
                      >
                        <span>🕒</span>
                        <span className="truncate">{h}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {searchSuggestions.length === 0 && searchHistory.length === 0 && (
                  <p className="text-center text-[10px] text-slate-400 py-4">Nhập từ khóa để bắt đầu tìm kiếm thông minh</p>
                )}
              </div>
            )}
          </div>
          
          {/* Overlay mask click-away helper */}
          {showSearchSuggestions && (
            <div className="fixed inset-0 z-10" onClick={() => setShowSearchSuggestions(false)} />
          )}
        </div>

        {/* ── 2. QUICK DISCOVERY CATEGORIES ── */}
        <div className="flex flex-wrap gap-2 justify-center border-b border-slate-200/50 dark:border-slate-800/80 pb-6">
          {['Tất cả', 'Thiên nhiên', 'Ẩm thực', 'Phiêu lưu', 'Văn hóa', 'Sang trọng', 'Biển đảo', 'Nghỉ dưỡng'].map(cat => {
            const active = filters.activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilters(prev => ({ ...prev, activeCategory: cat }))}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white border-transparent shadow-lg shadow-blue-500/20 scale-102'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:border-blue-500/30'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── SIDEBAR: ADVANCED FILTERS PANEL (STICKY ON SCROLL) ── */}
          <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-24 self-start">
            <ExploreFiltersPanel
              filters={filters}
              onChange={patch => setFilters(prev => ({ ...prev, ...patch }))}
              onReset={() => setFilters(DEFAULT_EXPLORE_FILTERS)}
              locating={locating}
              onUseMyLocation={handleUseMyLocation}
              resultCount={filteredPosts.length}
              totalCount={posts.length}
            />

          </aside>

          {/* ── MAIN CONTENT AREA (9 COLUMNS) ── */}
          <div className="lg:col-span-9 space-y-10">

            {/* ── 3. GIS NEARBY DISCOVERY SECTION ── */}
            {filters.userLat != null && filters.userLng != null && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Navigation size={16} className="text-rose-500 animate-pulse" />
                    Trải Nghiệm & Điểm Đến Lân Cận Bạn
                  </h3>
                  <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                    Vị trí hiện tại: {filters.userAddress || 'Đã định vị GPS'}
                  </span>
                </div>

                {nearbyStories.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Không tìm thấy bài viết hoặc địa điểm nào trong bán kính 100km gần bạn.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {nearbyStories.map((post, idx) => (
                      <div
                        key={idx}
                        onClick={() => navigate(`/explore/post/${post.id}`)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-2xl overflow-hidden p-3.5 hover:-translate-y-1 hover:shadow-md cursor-pointer transition-all duration-300 group"
                      >
                        <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-200 relative mb-3">
                          <img src={post.coverImage} alt={post.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-103 transition-transform" />
                          <span className="absolute top-2 left-2 bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <MapPin size={9} /> {post.dist < 1 ? `${Math.round(post.dist * 1000)}m` : `${Math.round(post.dist)}km`}
                          </span>
                        </div>
                        <h4 className="text-[11px] font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-500 transition-colors">{post.title}</h4>
                        <p className="text-[9px] text-slate-400 mt-1 truncate">{post.location}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── 4. TRAVEL HANDBOOKS COMPILATION (PLACED ABOVE FEATURED ARTICLE) ── */}
            <div className="grid sm:grid-cols-2 gap-6">
              <Link
                to="/explore/cam-nang/am-thuc"
                className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 hover:from-amber-500/15 hover:to-orange-500/10 border border-amber-500/25 rounded-3xl p-6 flex items-start gap-4 transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-all shrink-0">
                  <Utensils size={22} />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Cẩm Nang Ẩm Thực</h4>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Khám phá vị ngon ba miền</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">Tổng hợp các quán ăn gia truyền, món ngon đường phố nổi tiếng được lữ khách đánh giá cao.</p>
                </div>
              </Link>

              <Link
                to="/explore/cam-nang/van-hoa"
                className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 hover:from-violet-500/15 hover:to-purple-500/10 border border-violet-500/25 rounded-3xl p-6 flex items-start gap-4 transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-2xl bg-violet-500 text-white flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-all shrink-0">
                  <Landmark size={22} />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">Di Sản & Lễ Hội</h4>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Trải nghiệm chiều sâu văn hóa</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">Khám phá các ngôi chùa cổ kính, lễ hội dân gian và văn hóa làng nghề truyền thống lâu đời.</p>
                </div>
              </Link>
            </div>

            {/* ── 5. FEATURED STYLISH ARTICLE CARD (HERO CARD) ── */}
            {filteredPosts.length > 0 && (
              <div
                onClick={() => navigate(`/explore/post/${filteredPosts[0].id}`)}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-md hover:shadow-xl flex flex-col md:flex-row gap-6 items-stretch cursor-pointer transition-all duration-300 group md:h-[280px]"
              >
                {/* Left Column: Widescreen Rounded Image Container */}
                <div className="md:w-[44%] aspect-[16/10] md:aspect-auto overflow-hidden relative rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0 min-h-[220px]">
                  <img
                    src={filteredPosts[0].coverImage}
                    alt={filteredPosts[0].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5 z-10 flex-wrap">
                    <span className="bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                      {filteredPosts[0].category}
                    </span>
                    <span className="bg-slate-950/80 text-amber-300 border border-amber-400/50 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1 shadow-sm">
                      ★ NỔI BẬT
                    </span>
                  </div>

                  {/* Bottom Photo Count Badge */}
                  <div className="absolute bottom-3 left-3 z-10">
                    <span className="bg-slate-950/75 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl backdrop-blur-md flex items-center gap-1.5 border border-white/10 shadow-sm">
                      <ImageIcon size={12} /> {(filteredPosts[0] as any).dishes?.length ? (filteredPosts[0] as any).dishes.length + 2 : 3} ẢNH
                    </span>
                  </div>
                </div>

                {/* Right Column: Content Area */}
                <div className="md:w-[56%] py-1 sm:py-2 flex flex-col justify-between flex-1 space-y-3">
                  <div className="space-y-2.5">
                    {/* Top Meta Line: Read Time + Location (Matching other posts) */}
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                      <div className="flex items-center gap-2 tracking-wider whitespace-nowrap overflow-hidden">
                        <span className="inline-flex items-center gap-1.5 shrink-0 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          <Clock size={11} className="text-slate-400 shrink-0" />
                          {String(filteredPosts[0].readTime || '').includes('phút') ? String(filteredPosts[0].readTime) : `${filteredPosts[0].readTime} phút đọc`}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700 shrink-0">·</span>
                        <span className="inline-flex items-center gap-1.5 shrink-0 text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider text-[10px] truncate">
                          <MapPin size={11} className="shrink-0 text-teal-600" />
                          {filteredPosts[0].province}
                        </span>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 ml-2"
                        title="Lưu bài viết"
                      >
                        <Bookmark size={15} />
                      </button>
                    </div>

                    {/* Article Title (Matching blog card title size) */}
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-2">
                      {filteredPosts[0].title}
                    </h2>

                    {/* Excerpt (Matching blog card excerpt size) */}
                    <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {filteredPosts[0].excerpt}
                    </p>
                  </div>

                  {/* Divider & Author Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2.5">
                      {filteredPosts[0].avatar ? (
                        <img src={filteredPosts[0].avatar} alt={filteredPosts[0].author || 'Tác giả'} className="w-8 h-8 rounded-full object-cover ring-2 ring-teal-500/20" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                          {filteredPosts[0].author?.charAt(0) || 'T'}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{filteredPosts[0].author}</span>
                        <span className="text-[10px] font-medium text-slate-400 mt-0.5">{filteredPosts[0].date}</span>
                      </div>
                    </div>

                    <button className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 group-hover:scale-102 transition-all duration-300">
                      Đọc bài viết <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── 6. PAGINATED STORY FEED (CÂU CHUYỆN MỚI TỪ CỘNG ĐỒNG) ── */}
            <div id="feed-start-anchor" className="space-y-6 scroll-mt-20">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass size={16} className="text-blue-500" />
                Câu Chuyện Mới Từ Cộng Đồng
              </h3>
              
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {pagedPosts.map((post) => (
                  <article
                    key={post.id}
                    onClick={() => navigate(`/explore/post/${post.id}`)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-lg cursor-pointer transition-all duration-300 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-[16/10] bg-slate-200 relative overflow-hidden">
                        <img src={post.coverImage} alt={post.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-101 transition-transform" />
                        <span className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white text-[9px] font-bold px-2 py-0.5 rounded-md border border-slate-250 dark:border-slate-800">
                          {post.category}
                        </span>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap overflow-hidden">
                          <span className="inline-flex items-center gap-1 shrink-0"><Clock size={10} className="shrink-0" /> {String(post.readTime || '').includes('phút') ? String(post.readTime) : `${post.readTime} phút đọc`}</span>
                          <span className="text-slate-300 shrink-0">·</span>
                          <span className="inline-flex items-center gap-1 truncate text-teal-600 dark:text-teal-400"><MapPin size={10} className="shrink-0" /> {post.province}</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-500 transition-colors">
                          {post.title}
                        </h4>
                        <p className="text-[11px] text-slate-450 dark:text-slate-400 line-clamp-3 leading-relaxed">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <img src={post.avatar} alt={post.author || 'Tác giả'} loading="lazy" className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350">{post.author}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="flex items-center gap-0.5"><Heart size={10} className="text-rose-500 fill-current" /> {post.likes}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <button
                    disabled={feedPage === 1}
                    onClick={() => {
                      setFeedPage(prev => Math.max(prev - 1, 1));
                      document.getElementById('feed-start-anchor')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                    <button
                      key={num}
                      onClick={() => {
                        setFeedPage(num);
                        document.getElementById('feed-start-anchor')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${
                        feedPage === num
                          ? 'bg-blue-600 border-transparent text-white shadow-md shadow-blue-500/10'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    disabled={feedPage === totalPages && !hasMore}
                    onClick={handleNextPage}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau
                  </button>
                </div>
              )}

              {filteredPosts.length <= 1 && (
                <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                </div>
              )}
            </div>

            {/* ── 7. COMMUNITY & CONTRIBUTORS CENTER (PLACED BELOW CÂU CHUYỆN MỚI TỪ CỘNG ĐỒNG) ── */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users size={16} className="text-blue-500" />
                Cộng Đồng Lữ Khách Terraholic
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { name: 'Sarah K.', handle: '@sarahk_world', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80', score: 'Level 5 Traveler', role: 'Top Contributor' },
                  { name: 'Đức Minh', handle: '@ducminh_vn', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=80&q=80', score: 'Level 4 Explorer', role: 'Adventure Expert' },
                  { name: 'Maya Patel', handle: '@maya_roams', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=80&q=80', score: 'Level 5 Foodie', role: 'Culinary Guru' },
                  { name: 'Quốc Bảo', handle: '@bao_vietnam', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80', score: 'Level 4 Historian', role: 'Culture Ambassador' }
                ].map((user, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col items-center text-center space-y-2 hover:shadow"
                  >
                    <img src={user.avatar} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20" />
                    <div>
                      <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</span>
                      <span className="block text-[9px] text-slate-400">{user.handle}</span>
                    </div>
                    <span className="text-[8px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
