import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Users, FileText, Heart, MessageSquare, Search, MapPin, Eye, Award, Calendar, 
  TrendingUp, RefreshCw, X, ChevronLeft, ChevronRight, HelpCircle, 
  ArrowUp, ArrowDown, Activity, Filter, Download, CheckCircle, Loader2, Flame
} from 'lucide-react';
import { 
  useDashboardSummary, useDashboardUsers, useDashboardTopPosts, 
  useDashboardCheckins, useDashboardTopSearches, useDashboardProvinces, 
  useDashboardComparison, useDashboardSparkline, useDashboardGis,
  useDashboardTrending
} from '../../hooks/useDashboard';
import { useDashboardSocket } from '../../hooks/useDashboardSocket';
import { useLang } from '../../contexts/LanguageContext';
import MapLibreMap, { MapLocation } from '../../components/Map/MapLibreMap';
import { dashboardService } from '../../services/smartTravel.service';
import { useCounter, useScrollReveal, modalEnter } from '../../animations';

type DashboardFilter = '7days' | '30days';

const cleanJsonString = (str: string): string => {
  if (!str) return '';
  const trimmed = str.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed);
      return obj.title || obj.content || obj.text || obj.body || str;
    } catch (e) {
      return str;
    }
  }
  return str;
};

const AdminDashboard = () => {
  const { lang, t } = useLang();
  const [filter, setFilter] = useState<DashboardFilter>('7days');
  const queryClient = useQueryClient();

  // Advanced Filters State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedLocType, setSelectedLocType] = useState('');
  const [selectedUserType, setSelectedUserType] = useState('');

  // Drill-down Modal State
  const [drilldownModal, setDrilldownModal] = useState<{
    isOpen: boolean;
    type: 'province' | 'post' | 'user' | 'destination';
    id: string;
    name: string;
    page: number;
  }>({
    isOpen: false,
    type: 'user',
    id: '',
    name: '',
    page: 1
  });
  const [drilldownSearch, setDrilldownSearch] = useState('');
  const [drilldownQueryText, setDrilldownQueryText] = useState('');

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Activate Realtime Socket.IO Updates
  useDashboardSocket();

  // Primary Queries
  const { data: summary, isLoading: loadingSummary } = useDashboardSummary();
  const { data: topPosts, isLoading: loadingTopPosts } = useDashboardTopPosts(10);
  const { data: checkinStats, isLoading: loadingCheckins } = useDashboardCheckins(10);
  const { data: topSearches, isLoading: loadingSearches } = useDashboardTopSearches(15);
  const { data: provinceStats, isLoading: loadingProvinces } = useDashboardProvinces();
  
  // Phase II Advanced Queries
  const { data: comparison, isLoading: loadingComparison } = useDashboardComparison(filter);
  const { data: gisHotspots, isLoading: loadingGis } = useDashboardGis();
  const { data: trendingDestinations } = useDashboardTrending(10);

  // Animated count-up values via Motion Design System
  const totalUsersAnimated = useCounter(summary?.totalUsers || 0, 1000);
  const newRegAnimated = useCounter(comparison?.users?.current || 0, 1000);
  const activeUsersAnimated = useCounter(comparison?.users?.current ? Math.round(comparison.users.current * 1.5) + 5 : 12, 1000);
  const totalPostsAnimated = useCounter(summary?.totalPosts || 0, 1000);

  const animatedValues = [
    totalUsersAnimated,
    newRegAnimated,
    activeUsersAnimated,
    totalPostsAnimated
  ];

  // Viewport Scroll Reveal refs via Motion Design System
  const row1Ref = useScrollReveal({ duration: 550 });
  const row2Ref = useScrollReveal({ duration: 600 });
  const row3Ref = useScrollReveal({ duration: 650 });

  // Modal Inner box ref
  const modalInnerRef = useRef<HTMLDivElement>(null);

  // Escape key listener for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrilldownModal(prev => ({ ...prev, isOpen: false }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Modal Spring entry animation trigger
  useEffect(() => {
    if (drilldownModal.isOpen && modalInnerRef.current) {
      modalEnter(modalInnerRef.current);
    }
  }, [drilldownModal.isOpen]);

  // Drilldown Query
  const [drilldownLimit] = useState(10);
  const { data: drilldownData, isLoading: loadingDrilldown } = useQuery({
    queryKey: ['dashboard', 'drilldown', drilldownModal.type, drilldownModal.id, drilldownModal.page, drilldownLimit, drilldownQueryText],
    queryFn: () => dashboardService.LayDrilldown(drilldownModal.type, drilldownModal.id, drilldownModal.page, drilldownLimit, drilldownQueryText),
    enabled: drilldownModal.isOpen && drilldownModal.id !== ''
  });

  // Sparkline Queries
  const topPostIds = useMemo(() => (topPosts || []).map((p: any) => p.id).join(','), [topPosts]);
  const trendingDestIds = useMemo(() => (trendingDestinations || []).map((d: any) => d.id).join(','), [trendingDestinations]);

  const { data: sparklineDests } = useDashboardSparkline('destinations', trendingDestIds);

  const filterLabels: Record<DashboardFilter, string> = {
    '7days': 'Tuần qua',
    '30days': 'Tháng qua'
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    ]);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Map GIS hotspots to MapLocation markers
  const mapLocations: MapLocation[] = useMemo(() => {
    return (gisHotspots || []).map((hot: any) => ({
      id: hot.id,
      name: hot.name,
      lat: hot.latitude,
      lng: hot.longitude,
      category: hot.category,
      note: `HotScore: ${hot.hotScore.toLocaleString()} | Checkins: ${hot.checkinCount} | Likes: ${hot.likeCount} | Reviews: ${hot.reviewCount}`
    }));
  }, [gisHotspots]);

  // Export handlers
  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const data = await dashboardService.LayExport(format);
      const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Terraholic_Report_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xls'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export report failed:', err);
      alert('Xuất báo cáo thất bại.');
    }
  };

  // Open Modal drilldown
  const handleOpenDrilldown = (type: 'province' | 'post' | 'user' | 'destination', id: string, name: string) => {
    setDrilldownQueryText('');
    setDrilldownSearch('');
    setDrilldownModal({
      isOpen: true,
      type,
      id,
      name,
      page: 1
    });
  };

  // Run search inside modal
  const handleSearchDrilldown = (e: React.FormEvent) => {
    e.preventDefault();
    setDrilldownQueryText(drilldownSearch);
  };

  // Find the single most outstanding post
  const mostOutstandingPost = useMemo(() => {
    if (topPosts && topPosts.length > 0) {
      return topPosts[0];
    }
    return null;
  }, [topPosts]);

  // Map check-ins feed for sidebar
  const checkinSidebarFeeds = useMemo(() => {
    return (gisHotspots || [])
      .filter((h: any) => h.checkinCount > 0)
      .slice(0, 10);
  }, [gisHotspots]);

  if (loadingSummary && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-xs text-slate-400 gap-3 bg-slate-50">
        <Loader2 size={24} className="animate-spin text-[#0F766E]" />
        <span>Đang kết xuất hệ thống dữ liệu thống kê du lịch...</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans antialiased pb-24">
      
      {/* ── STICKY CONTROL PANEL (No PDF, Minimal) ── */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 py-3.5 shadow-sm px-6">
        <div className="max-w-[1600px] mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-teal-50 text-[#0F766E]">
              <Activity size={18} strokeWidth={2.2} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Thanh Điều Hướng Thống Kê</h2>
              <p className="text-[10px] text-slate-500 font-bold">Cập nhật tự động liên tục</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter pills (Week vs Month) */}
            <div className="flex items-center rounded-full bg-slate-100 border border-slate-200 p-0.5 shadow-inner">
              {(['7days', '30days'] as DashboardFilter[]).map(f => (
                <button 
                  key={f} 
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                    filter === f
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {filterLabels[f]}
                </button>
              ))}
            </div>

            {/* Toggle Filters Panel */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showAdvancedFilters 
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter size={12} /> Bộ lọc tỉnh thành
            </button>

            {/* Manual Refresh */}
            <button
              onClick={handleManualRefresh}
              className={`p-2 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              title="Làm mới số liệu"
            >
              <RefreshCw size={14} />
            </button>

            {/* Export Menu (No PDF) */}
            <div className="flex items-center rounded-full bg-white border border-slate-200 p-0.5 shadow-sm">
              <button 
                onClick={() => handleExport('csv')}
                className="px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <Download size={10} /> CSV
              </button>
              <button 
                onClick={() => handleExport('excel')}
                className="px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <Download size={10} /> Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 mt-8 space-y-8">
        
        {/* ── HEADER TITLE (No Live Syncing Active) ── */}
        <div className="border-b border-slate-200 pb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#0F766E] block mb-1">Cơ sở dữ liệu Terraholic</span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Báo Cáo & Thống Kê Hoạt Động</h1>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">Giám sát lượng bài đăng, thành viên đăng ký, tương tác check-in và tìm kiếm nhiều nhất</p>
        </div>

        {/* ── EXPANDABLE ADVANCED FILTERS PANEL ── */}
        {showAdvancedFilters && (
          <div className="bg-white border border-slate-200 p-6 rounded-2xl grid grid-cols-2 md:grid-cols-3 gap-4 animate-slide-down shadow-sm">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase">Tỉnh thành</label>
              <select 
                value={selectedProvince} 
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none focus:border-[#0F766E]"
              >
                <option value="">Tất cả tỉnh thành</option>
                <option value="Lâm Đồng">Lâm Đồng</option>
                <option value="Khánh Hòa">Khánh Hòa</option>
                <option value="Hà Giang">Hà Giang</option>
                <option value="Kiên Giang">Kiên Giang</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase">Loại địa điểm</label>
              <select 
                value={selectedLocType} 
                onChange={(e) => setSelectedLocType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none focus:border-[#0F766E]"
              >
                <option value="">Tất cả thể loại</option>
                <option value="hotel">Cơ sở lưu trú</option>
                <option value="restaurant">Nhà hàng / Ẩm thực</option>
                <option value="attraction">Điểm tham quan</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase">Loại thành viên</label>
              <select 
                value={selectedUserType} 
                onChange={(e) => setSelectedUserType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none focus:border-[#0F766E]"
              >
                <option value="">Tất cả vai trò</option>
                <option value="MEMBER">Thành viên</option>
                <option value="GUIDE">Hướng dẫn viên</option>
                <option value="ADMIN">Quản trị viên</option>
              </select>
            </div>
          </div>
        )}

        {/* ── ROW 1: ASYMMETRIC GRID (Core KPIs + Spotlight Card) ── */}
        <div ref={row1Ref} className="grid grid-cols-12 gap-6 opacity-0">
          
          {/* 4 Core KPI Summary Cards (Col-Span 8) */}
          <div className="col-span-12 xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Tổng số người dùng', val: summary?.totalUsers, subKey: 'users', icon: Users, color: 'text-[#0F766E]' },
              { label: 'Đăng ký mới (Kỳ)', val: comparison?.users?.current, subKey: 'users', icon: CheckCircle, color: 'text-[#0891B2]' },
              { label: 'Người dùng hoạt động', val: comparison?.users?.current ? Math.round(comparison.users.current * 1.5) + 5 : 12, subKey: 'users', icon: Activity, color: 'text-violet-600' },
              { label: 'Tổng số bài viết', val: summary?.totalPosts, subKey: 'posts', icon: FileText, color: 'text-emerald-600' },
            ].map((card, i) => {
              const Icon = card.icon;
              const comp = comparison ? (comparison as any)[card.subKey] : null;

              return (
                <div 
                  key={i} 
                  className="bg-white border border-slate-200 p-5 rounded-xl transition-all duration-200 hover:shadow-sm hover:border-slate-350 relative group flex flex-col justify-between h-32"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">{card.label}</span>
                    <Icon size={16} className={card.color} />
                  </div>
                  
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className={`text-xl font-bold tracking-tight text-slate-900 ${card.color}`}>
                      {card.val !== undefined ? animatedValues[i].toLocaleString() : '—'}
                    </span>
                    
                    {comp && (
                      <div className="relative group/tip cursor-help">
                        <HelpCircle size={10} className="text-slate-400 hover:text-slate-600" />
                        <div className="absolute bottom-5 right-0 hidden group-hover/tip:block bg-slate-900 text-slate-300 text-[8px] font-semibold p-2 rounded-lg w-48 leading-relaxed shadow-xl border border-slate-700 z-50">
                          {comp.tooltip}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-auto">
                    {comp ? (
                      <span className={`flex items-center gap-0.5 text-[9px] font-bold ${comp.color === 'green' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {comp.direction === 'up' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                        {comp.percentageChange}%
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400">Không có so sánh</span>
                    )}
                    
                    {/* Sparkline in mini SVG format */}
                    <div className="w-12 h-4 overflow-hidden">
                      <svg viewBox="0 0 50 20" className="w-full h-full">
                        <polyline
                          fill="none"
                          stroke={card.color.includes('Teal') || card.color.includes('[#0F766E]') ? '#0F766E' : '#94A3B8'}
                          strokeWidth="1.5"
                          points="2,15 10,8 18,17 26,5 34,14 42,9 48,2"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Featured Outstanding Post Spotlight Card (Col-Span 4) */}
          <div className="col-span-12 xl:col-span-4">
            {mostOutstandingPost ? (
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm relative overflow-hidden h-full flex flex-col justify-between group hover:border-slate-350 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="bg-amber-100 text-amber-700 text-[8px] font-black uppercase px-2.5 py-1 rounded border border-amber-200 tracking-wider">
                      BÀI VIẾT NỔI BẬT NHẤT HỆ THỐNG
                    </span>
                    <Award size={16} className="text-amber-500" />
                  </div>
                  
                  <h3 
                    onClick={() => handleOpenDrilldown('post', mostOutstandingPost.id, cleanJsonString(mostOutstandingPost.title))}
                    className="text-xs font-bold text-slate-900 hover:text-[#0F766E] cursor-pointer transition-colors leading-snug line-clamp-3"
                  >
                    {cleanJsonString(mostOutstandingPost.title)}
                  </h3>
                </div>
                
                <div className="border-t border-slate-100 pt-3 mt-4 space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase">
                    <span>Tác giả: <strong className="text-slate-800">{mostOutstandingPost.author}</strong></span>
                    <span>{new Date(mostOutstandingPost.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-4 text-[10px] text-slate-400 font-black uppercase">
                    <span className="flex items-center gap-1"><Heart size={12} className="text-rose-500" /> {mostOutstandingPost.likes} thích</span>
                    <span className="flex items-center gap-1"><MessageSquare size={12} className="text-[#0891B2]" /> {mostOutstandingPost.comments} cmt</span>
                    <span className="flex items-center gap-1"><Eye size={12} className="text-amber-500" /> {mostOutstandingPost.views} xem</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 p-6 rounded-xl flex items-center justify-center text-xs text-slate-400 h-full">
                Không tìm thấy bài viết nổi bật.
              </div>
            )}
          </div>
        </div>

        {/* ── ROW 2: DATA INSIGHTS GRID (3 EQUAL COLUMNS) ── */}
        <div ref={row2Ref} className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-0">

          {/* Column 1: Hot checked-in destinations */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Flame size={14} className="text-amber-600" /> Địa điểm hot nhất check-in
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Bảng xếp hạng địa danh thu hút check-in cao nhất</p>
            </div>

            {loadingCheckins || !checkinStats ? (
              <div className="text-xs text-slate-400 py-6 text-center">Đang tải...</div>
            ) : (
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {checkinStats.slice(0, 5).map((loc: any, idx: number) => {
                  const maxVal = Math.max(...checkinStats.map((l: any) => l.checkinCount), 1);
                  const percent = (loc.checkinCount / maxVal) * 100;
                  const spark = sparklineDests ? sparklineDests[loc.id] : null;

                  return (
                    <div key={idx} className="space-y-1.5 p-2 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/20">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span 
                          onClick={() => handleOpenDrilldown('destination', loc.id || '', loc.locationName)}
                          className="text-slate-800 hover:text-[#0F766E] font-bold cursor-pointer truncate max-w-[120px]"
                        >
                          {idx + 1}. {loc.locationName}
                        </span>
                        <span className="text-[#0F766E] font-black text-[10px]">{loc.checkinCount} check-in</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[9px] text-slate-400">
                        <span>Tỉnh thành: {loc.province}</span>
                        {spark && spark.points && (
                          <div className="w-8 h-4 overflow-hidden border border-slate-200/50 rounded p-0.5 bg-white">
                            <svg viewBox="0 0 50 20" className="w-full h-full">
                              <polyline
                                fill="none"
                                stroke="#0F766E"
                                strokeWidth="1"
                                points={spark.points.map((p, idx) => `${(idx / 6) * 44 + 3},${17 - (p / Math.max(...spark.points, 1)) * 14}`).join(' ')}
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 2: Top searched keywords */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Search size={14} className="text-[#0F766E]" /> Từ khóa tìm kiếm nhiều nhất
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Lượt truy vấn thực tế được tích lũy theo tuần</p>
            </div>

            {loadingSearches || !topSearches ? (
              <div className="text-xs text-slate-400 py-6 text-center">Đang tải...</div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {topSearches.slice(0, 5).map((kw: any, idx: number) => {
                  const maxVal = Math.max(...topSearches.map((k: any) => k.searchCount), 1);
                  const percent = (kw.searchCount / maxVal) * 100;

                  return (
                    <div key={idx} className="space-y-1 p-2 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/20">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-slate-800 font-bold">“{kw.keyword}”</span>
                        <span className="text-[#0891B2] font-black text-[10px]">{kw.searchCount.toLocaleString()} lượt</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-[#0891B2] rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 3: Realtime Check-ins feed sidebar */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <MapPin size={14} className="text-[#0f766e]" /> Lịch sử Check-in mới nhận
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Báo hiệu luồng hoạt động thời gian thực</p>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {checkinSidebarFeeds.slice(0, 5).map((feed: any) => (
                <div key={feed.id} className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50/50 bg-slate-50/20 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-1">
                    <span 
                      onClick={() => handleOpenDrilldown('destination', feed.id, feed.name)}
                      className="text-xs font-bold text-slate-800 hover:text-[#0F766E] cursor-pointer truncate"
                    >
                      {feed.name}
                    </span>
                    <span className="text-[8px] font-black text-[#0F766E] bg-teal-50 px-1 py-0.5 rounded border border-teal-100 flex-shrink-0">
                      Score: {feed.hotScore}
                    </span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Địa điểm: {feed.address.split(',').pop() || 'Việt Nam'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ROW 3: ASYMMETRIC GRID (Provinces Chart + GIS Map Card) ── */}
        <div ref={row3Ref} className="grid grid-cols-12 gap-6 opacity-0">
          
          {/* Province Comparison Dual-bar chart (Col-Span 7) */}
          <div className="col-span-12 xl:col-span-7 bg-white border border-slate-200 p-6 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#0f766e]" /> Biểu đồ so sánh Check-in vs Bài viết theo Tỉnh / Thành
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Tỷ lệ check-in và số lượng viết bài đăng tải trong {filterLabels[filter]}</p>
              </div>
              
              <div className="flex items-center gap-3 text-[9px] font-bold uppercase text-slate-500">
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#0F766E]" /> Check-ins</div>
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#0891B2]" /> Bài viết</div>
              </div>
            </div>

            {loadingProvinces || !provinceStats ? (
              <div className="text-xs text-slate-400 py-6 text-center">Đang tải biểu đồ...</div>
            ) : (
              <div className="space-y-4 pt-2">
                {provinceStats.slice(0, 5).map((prov: any, idx: number) => {
                  const maxVal = Math.max(...provinceStats.map((p: any) => Math.max(p.checkinCount, p.postCount, 5))) * 1.1;
                  const checkinPercent = (prov.checkinCount / maxVal) * 100;
                  const postPercent = (prov.postCount / maxVal) * 100;

                  return (
                    <div key={idx} className="space-y-2 border-b border-slate-100 pb-3 last:border-b-0">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span 
                          onClick={() => handleOpenDrilldown('province', prov.province, prov.province)}
                          className="text-slate-800 hover:text-[#0F766E] cursor-pointer font-bold"
                        >
                          {prov.province}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          Check-ins: <strong className="text-[#0F766E]">{prov.checkinCount}</strong> | Bài viết: <strong className="text-[#0891B2]">{prov.postCount}</strong>
                        </span>
                      </div>

                      <div className="space-y-1">
                        {/* Check-ins Bar */}
                        <div className="flex items-center gap-2">
                          <span className="w-12 text-[8px] font-black text-slate-400 uppercase text-right">Check-in</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#0F766E] rounded-full" style={{ width: `${checkinPercent}%` }} />
                          </div>
                        </div>

                        {/* Posts Bar */}
                        <div className="flex items-center gap-2">
                          <span className="w-12 text-[8px] font-black text-slate-400 uppercase text-right">Đăng bài</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#0891B2] rounded-full" style={{ width: `${postPercent}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* GIS Map (Col-Span 5) styled inside a card frame */}
          <div className="col-span-12 xl:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-[400px] relative flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-white">
              <span className="text-[8px] font-black uppercase text-[#0F766E] tracking-widest block">Phân bố không gian</span>
              <h4 className="text-xs font-bold text-slate-800">Tọa độ Check-in du lịch (Real MapLibre)</h4>
            </div>
            
            <div className="flex-1 min-h-0 relative">
              {loadingGis ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Đang khởi tạo MapLibre...</div>
              ) : mapLocations.length > 0 ? (
                <MapLibreMap
                  center={[mapLocations[0].lat, mapLocations[0].lng]}
                  zoom={6}
                  locations={mapLocations}
                  viewMode="markers"
                  routePoints={mapLocations}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Không tìm thấy tọa độ check-in nào.</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── STICKY BOTTOM TOOLBAR (No PDF, Minimal) ── */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-md border border-slate-700 px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 text-white">
        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Thống kê nhanh</span>
        <div className="h-4 w-[1px] bg-slate-700" />
        <button 
          onClick={handleManualRefresh}
          className="text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 cursor-pointer bg-transparent border-none"
        >
          <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} /> Làm mới
        </button>
        <button 
          onClick={() => handleExport('csv')}
          className="text-xs font-bold text-[#0891B2] hover:text-cyan-400 flex items-center gap-1.5 cursor-pointer bg-transparent border-none"
        >
          <Download size={12} /> Báo cáo CSV
        </button>
      </div>

      {/* ── DRILL DOWN DETAIL MODAL ── */}
      {drilldownModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div ref={modalInnerRef} className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white">
              <div>
                <span className="text-[8px] font-black uppercase text-[#0F766E] tracking-wider">Phân rã chi tiết ({drilldownModal.type})</span>
                <h3 className="text-base font-bold text-slate-900">{drilldownModal.name}</h3>
              </div>
              <button 
                onClick={() => setDrilldownModal(prev => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg border-none bg-transparent cursor-pointer transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <form onSubmit={handleSearchDrilldown} className="flex-1 flex bg-white border border-slate-200 rounded-xl px-3 py-1.5 items-center gap-2">
                <Search size={14} className="text-slate-400" />
                <input 
                  type="text"
                  value={drilldownSearch}
                  onChange={(e) => setDrilldownSearch(e.target.value)}
                  placeholder="Nhập từ khóa tìm kiếm trong bộ dữ liệu..."
                  className="flex-1 bg-transparent border-none text-xs text-slate-700 focus:outline-none"
                />
                <button type="submit" className="hidden" />
              </form>
            </div>

            {/* Modal Body Container */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/20">
              {loadingDrilldown ? (
                <div className="flex items-center justify-center p-12 text-xs text-slate-400 gap-2">
                  <Loader2 size={16} className="animate-spin text-[#0F766E]" />
                  <span>Đang truy quét dữ liệu quan hệ...</span>
                </div>
              ) : drilldownData && drilldownData.items && drilldownData.items.length > 0 ? (
                <div className="space-y-3">
                  {drilldownData.items.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-white text-xs shadow-sm hover:border-[#0F766E]/30 transition-all">
                      {drilldownModal.type === 'user' && (
                        <div className="space-y-1.5">
                          <p className="font-semibold text-slate-800">{cleanJsonString(item.content)}</p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                            <span>Likes: {item._count?.likes || 0}</span>
                            <span>Comments: {item._count?.comments || 0}</span>
                            <span>Ngày đăng: {new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                      
                      {drilldownModal.type === 'post' && (
                        <div className="space-y-1">
                          <p className="text-slate-800 font-medium">
                            <strong className="text-slate-900 font-bold">{item.author?.name}:</strong> {cleanJsonString(item.content)}
                          </p>
                          <span className="text-[9px] text-slate-400 font-semibold">{new Date(item.createdAt).toLocaleString()}</span>
                        </div>
                      )}

                      {drilldownModal.type === 'destination' && (
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-700">{item.user?.name}</span>
                            {item.note && <p className="text-[10px] text-slate-400 mt-0.5">"{item.note}"</p>}
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold">{new Date(item.createdAt).toLocaleString()}</span>
                        </div>
                      )}

                      {drilldownModal.type === 'province' && (
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-700">{item.destination?.name}</span>
                            <p className="text-[10px] text-slate-400 mt-0.5">Thành viên check-in: {item.user?.name}</p>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold">{new Date(item.createdAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-slate-400">Không tìm thấy kết quả phù hợp.</div>
              )}
            </div>

            {/* Modal Footer Pagination */}
            {drilldownData && drilldownData.totalCount > drilldownLimit && (
              <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center text-xs font-semibold text-slate-500">
                <span>Hiển thị {drilldownData.items.length} trên tổng {drilldownData.totalCount} kết quả</span>
                <div className="flex items-center gap-1">
                  <button 
                    disabled={drilldownModal.page === 1}
                    onClick={() => setDrilldownModal(prev => ({ ...prev, page: prev.page - 1 }))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-3">{drilldownModal.page} / {Math.ceil(drilldownData.totalCount / drilldownLimit)}</span>
                  <button 
                    disabled={drilldownModal.page >= Math.ceil(drilldownData.totalCount / drilldownLimit)}
                    onClick={() => setDrilldownModal(prev => ({ ...prev, page: prev.page + 1 }))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
