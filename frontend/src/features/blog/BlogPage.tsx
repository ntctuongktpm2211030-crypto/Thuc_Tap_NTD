import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Trophy, Users, Check,
  Search, Sparkles, Clock, ArrowRight, Utensils, Landmark,
} from 'lucide-react';
import { searchPlaces } from '../../utils/geocodeUtils';
import { postsService } from '../../services/smartTravel.service';
import ExploreFiltersPanel, { DEFAULT_EXPLORE_FILTERS, type ExploreFilterState } from './ExploreFiltersPanel';
import { distanceKm, type ExplorePost } from './exploreBlogData';
import { toExplorePostId } from '../../utils/postIds';
import { getExplorePosts, setExplorePosts } from './explorePostsStore';
import { buildHandbook } from './exploreHandbook';

const TRENDING_TAGS = ['sapa', 'hagiang', 'danang', 'ẩm thực', 'motorbiking', 'thiên nhiên', 'bãi biển', 'văn hóa'];
const EXPLORE_LIST_PREVIEW = 3;

const CATEGORY_STYLES: Record<string, string> = {
  'Thiên nhiên': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Ẩm thực': 'bg-amber-100 text-amber-800 border-amber-200',
  'Phiêu lưu': 'bg-rose-100 text-rose-700 border-rose-200',
  'Văn hóa': 'bg-violet-100 text-violet-700 border-violet-200',
  'Sang trọng': 'bg-sky-100 text-sky-700 border-sky-200',
};

const SUGGESTED_TRAVELLERS = [
  { name: 'Sarah K.', handle: '@sarahk_world', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80', posts: 142 },
  { name: 'Đức Minh', handle: '@ducminh_vn', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=80&q=80', posts: 87 },
  { name: 'Maya Patel', handle: '@maya_roams', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=80&q=80', posts: 215 },
];

const CategoryBadge = ({ category }: { category: string }) => (
  <span className={`explore-tag border ${CATEGORY_STYLES[category] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
    {category}
  </span>
);

const isCultureOrFood = (category: string) => category === 'Ẩm thực' || category === 'Văn hóa';

const BlogArticleCard = ({
  post,
  distanceLabel,
  onOpenDetail,
}: {
  post: ExplorePost;
  distanceLabel?: string;
  onOpenDetail: (post: ExplorePost) => void;
}) => {
  const cultureFood = isCultureOrFood(post.category);

  return (
    <article
      className={`blog-article ${cultureFood ? 'blog-article--culture-food' : ''}`}
      onClick={() => onOpenDetail(post)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpenDetail(post)}
    >
      <div className="blog-article__media">
        <img src={post.coverImage} alt={post.title} loading="lazy" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <CategoryBadge category={post.category} />
        </div>
      </div>
      <div className="blog-article__body">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
          <Clock size={12} />
          {post.readTime} phút đọc
          <span className="text-slate-300">|</span>
          <MapPin size={12} className="text-teal-600" />
          <span className="normal-case tracking-normal text-slate-600">{post.province}</span>
        </div>

        <h2 className="blog-article__title">{post.title}</h2>
        <p className="blog-article__dek">{post.excerpt}</p>

        {cultureFood && post.dishes.length > 0 && (
          <div className="blog-article__highlight blog-article__highlight--food">
            <p className="font-bold flex items-center gap-1.5 mb-1">
              <Utensils size={13} /> Món ẩm thực nổi bật
            </p>
            <p>{post.dishes.slice(0, 6).join(' · ')}</p>
          </div>
        )}

        {cultureFood && post.cultureThemes.length > 0 && (
          <div className="blog-article__highlight blog-article__highlight--culture">
            <p className="font-bold flex items-center gap-1.5 mb-1">
              <Landmark size={13} /> Văn hóa & trải nghiệm
            </p>
            <p>{post.cultureThemes.slice(0, 5).join(' · ')}</p>
          </div>
        )}

        {!cultureFood && post.destinations.length > 0 && (
          <p className="text-xs text-teal-700 font-medium">
            Điểm đến: {post.destinations.join(', ')}
          </p>
        )}

        <div className="blog-article__byline">
          <div className="flex items-center gap-2">
            <img src={post.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            <div>
              <span className="font-bold text-slate-800 text-sm flex items-center gap-1">
                {post.author}
                {post.verified && <Check size={11} className="text-sky-500" />}
              </span>
              <span className="block text-[11px] text-slate-500">
                {post.date}
                {distanceLabel && ` · cách bạn ${distanceLabel}`}
              </span>
            </div>
          </div>
          <span className="text-sm font-semibold text-teal-700 flex items-center gap-1 group-hover:gap-2 transition-all">
            Đọc toàn bộ <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </article>
  );
};

const HeroPostCard = ({
  post,
  onOpenDetail,
}: {
  post: ExplorePost;
  onOpenDetail: (post: ExplorePost) => void;
}) => (
  <article className="explore-featured cursor-pointer group" onClick={() => onOpenDetail(post)}>
    <img src={post.coverImage} alt={post.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/35 to-slate-900/10" />
    <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge category={post.category} />
        <span className="explore-tag bg-white/20 text-white border-white/30 backdrop-blur-sm flex items-center gap-1">
          <Trophy size={11} /> Nổi bật
        </span>
      </div>
      <h1 className="font-editorial text-2xl sm:text-4xl font-bold text-white leading-tight max-w-3xl">
        {post.title}
      </h1>
      <p className="text-sm sm:text-base text-white/85 max-w-2xl line-clamp-2 leading-relaxed">{post.excerpt}</p>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <img src={post.avatar} alt={post.author} className="w-11 h-11 rounded-full object-cover ring-2 ring-amber-300" />
          <div>
            <span className="text-sm font-bold text-white block">{post.author}</span>
            <p className="text-[11px] text-white/70 flex items-center gap-1">
              {post.date} · {post.readTime} phút · <MapPin size={10} /> {post.location}
            </p>
          </div>
        </div>
        <span className="text-xs text-white/60">
          {post.likes.toLocaleString()} lượt thích · {post.comments.length} bình luận
        </span>
      </div>
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-200 group-hover:gap-2 transition-all">
        Đọc bài báo đầy đủ <ArrowRight size={16} />
      </span>
    </div>
  </article>
);

function mapApiToExplorePost(raw: {
  id: string;
  content: string;
  mediaUrls?: string[];
  createdAt: string;
  author: { email: string; profile?: { fullName?: string; avatarUrl?: string | null } | null };
  _count?: { likes?: number; comments?: number };
  isLiked?: boolean;
  isBookmarked?: boolean;
}): ExplorePost | null {
  try {
    const payload = JSON.parse(raw.content);
    const category =
      payload.category === 'food' || (payload.categories as string[])?.includes('food')
        ? 'Ẩm thực'
        : payload.displayType === 'social'
          ? 'Phiêu lưu'
          : 'Văn hóa';
    const dest = payload.destination || payload.location?.name || 'Việt Nam';
    const body = payload.body || payload.content || raw.content;
    return {
      id: toExplorePostId(raw.id),
      author: raw.author.profile?.fullName || raw.author.email.split('@')[0],
      handle: `@${raw.author.email.split('@')[0]}`,
      avatar: raw.author.profile?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
      verified: false,
      title: payload.headline || payload.title || body.slice(0, 60) || 'Bài viết mới',
      excerpt: payload.excerpt || body.slice(0, 160),
      content: body,
      coverImage: raw.mediaUrls?.[0] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80',
      tags: (payload.tags as string[]) || [],
      category,
      location: dest,
      province: dest,
      region: 'Trung',
      lat: payload.location?.lat ?? 16,
      lng: payload.location?.lng ?? 108,
      destinations: [dest],
      dishes: category === 'Ẩm thực' ? ['Món địa phương'] : [],
      cultureThemes: category === 'Văn hóa' ? ['Văn hóa địa phương'] : [],
      date: new Date(raw.createdAt).toLocaleDateString('vi-VN'),
      readTime: Math.max(3, Math.round(body.length / 400)),
      likes: raw._count?.likes ?? 0,
      comments: [],
      bookmarked: !!raw.isBookmarked,
      liked: !!raw.isLiked,
    };
  } catch {
    return null;
  }
}

function applyExploreFilters(posts: ExplorePost[], searchQuery: string, filters: ExploreFilterState): ExplorePost[] {
  const q = searchQuery.trim().toLowerCase();

  let list = posts.filter(p => {
    if (filters.onlyBookmarked && !p.bookmarked) return false;
    if (filters.activeCategory !== 'Tất cả' && p.category !== filters.activeCategory) return false;
    if (filters.activeRegion !== 'Tất cả miền' && p.region !== filters.activeRegion) return false;

    if (filters.selectedDestinations.length > 0) {
      const hit = filters.selectedDestinations.some(
        d => p.destinations.includes(d) || p.location.toLowerCase().includes(d.toLowerCase()) || p.province.includes(d),
      );
      if (!hit) return false;
    }

    if (filters.selectedDishes.length > 0) {
      if (!filters.selectedDishes.some(d => p.dishes.includes(d))) return false;
    }

    if (filters.selectedCulture.length > 0) {
      if (!filters.selectedCulture.some(c => p.cultureThemes.includes(c))) return false;
    }

    if (filters.userLat != null && filters.userLng != null && filters.maxDistanceKm != null) {
      const dist = distanceKm(filters.userLat, filters.userLng, p.lat, p.lng);
      if (dist > filters.maxDistanceKm) return false;
    }

    if (filters.userAddress.trim()) {
      const addr = filters.userAddress.toLowerCase();
      const locMatch =
        p.location.toLowerCase().includes(addr) ||
        p.province.toLowerCase().includes(addr) ||
        p.region.toLowerCase().includes(addr) ||
        p.destinations.some(d => d.toLowerCase().includes(addr));
      if (!locMatch && filters.userLat == null) return false;
    }

    if (q) {
      const hay = [
        p.title, p.excerpt, p.author, p.location, p.province, p.category,
        ...p.tags, ...p.destinations, ...p.dishes, ...p.cultureThemes,
      ].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (filters.sortBy === 'short' && p.readTime >= 5) return false;

    return true;
  });

  if (filters.sortBy === 'popular') {
    list = [...list].sort((a, b) => b.likes - a.likes);
  } else if (filters.sortBy === 'nearest' && filters.userLat != null && filters.userLng != null) {
    list = [...list].sort(
      (a, b) =>
        distanceKm(filters.userLat!, filters.userLng!, a.lat, a.lng) -
        distanceKm(filters.userLat!, filters.userLng!, b.lat, b.lng),
    );
  } else if (filters.sortBy === 'short') {
    list = [...list].sort((a, b) => a.readTime - b.readTime);
  }

  return list;
}

export default function BlogPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ExplorePost[]>(() => getExplorePosts());
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ExploreFilterState>(DEFAULT_EXPLORE_FILTERS);
  const [locating, setLocating] = useState(false);
  const [showAllCulture, setShowAllCulture] = useState(false);
  const [showAllOther, setShowAllOther] = useState(false);

  useEffect(() => {
    postsService
      .feed({ page: 1, limit: 30 })
      .then(({ posts: apiPosts }) => {
        const mapped = apiPosts
          .map((p: Parameters<typeof mapApiToExplorePost>[0]) => mapApiToExplorePost(p))
          .filter((p): p is ExplorePost => p !== null);
        if (mapped.length > 0) {
          const merged = [...getExplorePosts()];
          for (const m of mapped) {
            if (!merged.some(x => x.id === m.id)) merged.unshift(m);
          }
          setExplorePosts(merged);
          setPosts(merged);
        }
      })
      .catch(() => {});
  }, []);

  const openPost = (post: ExplorePost) => navigate(`/explore/post/${post.id}`);

  const patchFilters = (patch: Partial<ExploreFilterState>) => {
    setFilters(prev => ({ ...prev, ...patch }));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        patchFilters({ userLat: latitude, userLng: longitude });
        try {
          const results = await searchPlaces(`${latitude},${longitude}`);
          if (results[0]) {
            patchFilters({
              userAddress: results[0].displayName || results[0].name,
              userLat: results[0].lat,
              userLng: results[0].lng,
            });
          }
        } catch {
          /* keep coords */
        }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const filteredPosts = useMemo(
    () => applyExploreFilters(posts, searchQuery, filters),
    [posts, searchQuery, filters],
  );

  const getDistanceLabel = (post: ExplorePost) => {
    if (filters.userLat == null || filters.userLng == null) return undefined;
    const km = distanceKm(filters.userLat, filters.userLng, post.lat, post.lng);
    return km < 1 ? `${Math.round(km * 1000)} m` : `${Math.round(km)} km`;
  };

  const heroPost = filteredPosts[0];
  const listPosts = filteredPosts.slice(1);

  const cultureFoodPosts = listPosts.filter(p => isCultureOrFood(p.category));
  const otherPosts = listPosts.filter(p => !isCultureOrFood(p.category));
  const visibleCulture = showAllCulture ? cultureFoodPosts : cultureFoodPosts.slice(0, EXPLORE_LIST_PREVIEW);
  const visibleOther = showAllOther ? otherPosts : otherPosts.slice(0, EXPLORE_LIST_PREVIEW);
  const foodHandbook = useMemo(() => buildHandbook(posts, 'am-thuc'), [posts]);
  const cultureHandbook = useMemo(() => buildHandbook(posts, 'van-hoa'), [posts]);

  useEffect(() => {
    setShowAllCulture(false);
    setShowAllOther(false);
  }, [searchQuery, filters]);

  return (
    <div className="explore-page explore-page--magazine">
      <header className="explore-hero">
        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-16 space-y-8">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-amber-200 text-amber-800 text-xs font-bold shadow-sm">
              <Sparkles size={14} className="text-amber-500" /> SmartTravel Magazine
            </span>
            <h1 className="font-editorial text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
              Khám phá{' '}
              <span className="bg-gradient-to-r from-teal-600 via-sky-600 to-violet-600 bg-clip-text text-transparent">
                câu chuyện du lịch
              </span>
            </h1>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              Blog du lịch với góc nhìn tươi mới — hành trình thực tế, mẹo hay và cảm hứng từ cộng đồng travellers Việt Nam.
            </p>
          </div>

          <div className="max-w-xl mx-auto relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm bài viết, địa điểm, tác giả..."
              className="explore-search"
            />
          </div>

        </div>
      </header>

      <div className="explore-page__body max-w-6xl mx-auto px-4 py-8 sm:py-10">
        <section className="grid sm:grid-cols-2 gap-4 mb-10">
          <Link
            to="/explore/cam-nang/am-thuc"
            className="explore-handbook-banner explore-handbook-banner--food group"
          >
            <Utensils size={28} className="text-amber-600 mb-2" />
            <h2 className="font-editorial text-lg font-bold text-slate-900 group-hover:text-amber-800">
              {foodHandbook.title}
            </h2>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{foodHandbook.intro}</p>
            <span className="text-xs font-bold text-amber-700 mt-3 flex items-center gap-1">
              Đọc cẩm nang <ArrowRight size={12} />
            </span>
          </Link>
          <Link
            to="/explore/cam-nang/van-hoa"
            className="explore-handbook-banner explore-handbook-banner--culture group"
          >
            <Landmark size={28} className="text-violet-600 mb-2" />
            <h2 className="font-editorial text-lg font-bold text-slate-900 group-hover:text-violet-800">
              {cultureHandbook.title}
            </h2>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{cultureHandbook.intro}</p>
            <span className="text-xs font-bold text-violet-700 mt-3 flex items-center gap-1">
              Đọc cẩm nang <ArrowRight size={12} />
            </span>
          </Link>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          <div className="lg:col-span-8 space-y-8">
            {heroPost && (
              <HeroPostCard post={heroPost} onOpenDetail={openPost} />
            )}

            {listPosts.length > 0 ? (
              <div className="space-y-10">
                {cultureFoodPosts.length > 0 && (
                  <section>
                    <h2 className="blog-article-list__heading flex items-center gap-2 mb-4">
                      <Utensils size={14} className="text-amber-600" />
                      Văn hóa & ẩm thực
                    </h2>
                    <div className="blog-article-list">
                      {visibleCulture.map(post => (
                        <BlogArticleCard
                          key={post.id}
                          post={post}
                          distanceLabel={getDistanceLabel(post)}
                          onOpenDetail={openPost}
                        />
                      ))}
                    </div>
                    {cultureFoodPosts.length > EXPLORE_LIST_PREVIEW && (
                      <button
                        type="button"
                        onClick={() => setShowAllCulture(v => !v)}
                        className="explore-show-more-btn mt-4"
                      >
                        {showAllCulture
                          ? 'Thu gọn'
                          : `Xem thêm ${cultureFoodPosts.length - EXPLORE_LIST_PREVIEW} bài`}
                        <ArrowRight size={14} className={showAllCulture ? 'rotate-90' : ''} />
                      </button>
                    )}
                  </section>
                )}

                {otherPosts.length > 0 && (
                  <section>
                    {cultureFoodPosts.length > 0 && (
                      <h2 className="blog-article-list__heading mb-4">Hành trình & khám phá</h2>
                    )}
                    <div className="blog-article-list">
                      {visibleOther.map(post => (
                        <BlogArticleCard
                          key={post.id}
                          post={post}
                          distanceLabel={getDistanceLabel(post)}
                          onOpenDetail={openPost}
                        />
                      ))}
                    </div>
                    {otherPosts.length > EXPLORE_LIST_PREVIEW && (
                      <button
                        type="button"
                        onClick={() => setShowAllOther(v => !v)}
                        className="explore-show-more-btn mt-4"
                      >
                        {showAllOther
                          ? 'Thu gọn'
                          : `Xem thêm ${otherPosts.length - EXPLORE_LIST_PREVIEW} bài`}
                        <ArrowRight size={14} className={showAllOther ? 'rotate-90' : ''} />
                      </button>
                    )}
                  </section>
                )}
              </div>
            ) : (
              !heroPost && (
                <div className="text-center py-20 text-slate-500">
                  <p className="font-semibold text-lg">Không tìm thấy bài viết</p>
                  <p className="text-sm mt-1">Thử đổi từ khóa hoặc danh mục khác.</p>
                </div>
              )
            )}
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <ExploreFiltersPanel
              filters={filters}
              onChange={patchFilters}
              onReset={() => setFilters(DEFAULT_EXPLORE_FILTERS)}
              locating={locating}
              onUseMyLocation={handleUseMyLocation}
              resultCount={filteredPosts.length}
              totalCount={posts.length}
            />

            <div className="explore-sidebar-card space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Chủ đề hot</h3>
              <div className="flex flex-wrap gap-2">
                {TRENDING_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSearchQuery(tag)}
                    className="text-[11px] font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="explore-sidebar-card space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users size={14} className="text-violet-500" /> Nhà văn đề xuất
              </h3>
              {SUGGESTED_TRAVELLERS.map(t => (
                <div key={t.handle} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={t.avatar} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-violet-100" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{t.name}</p>
                      <p className="text-[11px] text-slate-500">{t.posts} bài viết</p>
                    </div>
                  </div>
                  <button type="button" className="text-[10px] font-bold text-violet-700 border border-violet-200 px-2.5 py-1 rounded-lg hover:bg-violet-50 flex-shrink-0">
                    Theo dõi
                  </button>
                </div>
              ))}
            </div>

            <div className="explore-sidebar-card bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-3">Cộng đồng</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { n: '12K+', l: 'Bài viết', c: 'text-amber-700' },
                  { n: '4.9K', l: 'Thành viên', c: 'text-teal-700' },
                  { n: '1K+', l: 'Điểm đến', c: 'text-violet-700' },
                ].map(s => (
                  <div key={s.l} className="bg-white/70 rounded-xl py-3 border border-white">
                    <div className={`text-sm font-extrabold ${s.c}`}>{s.n}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

    </div>
  );
}
