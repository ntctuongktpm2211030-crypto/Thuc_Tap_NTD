import { useState, useEffect } from 'react';
import { RippleButton } from '@/components/ui/ripple-button';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  MapPin, BrainCircuit, Loader2, Plane, Zap, Check, AlertTriangle,
  Compass, Sparkles, Bookmark, Calendar, DollarSign, Hash, ChevronDown, ChevronUp, Clock, ExternalLink, Navigation,
  Search, X
} from 'lucide-react';
import { TRIP_ACTIVITY_ICONS } from '../../config/modernIcons';
import { tripsService, Waypoint } from '../../services/smartTravel.service';
import type { RootState } from '../../store';
import { useLang } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import MapLibreMap, { MapLocation } from '../../components/Map/MapLibreMap';
import { KineticText } from '../../components/ui/kinetic-text';
import ParallaxHero from '../../components/ui/parallax-hero';

function calculateHaversineDistance(
  p1: { latitude: number; longitude: number },
  p2: { latitude: number; longitude: number }
): number {
  const EARTH_RADIUS_KM = 6371.0088;
  const dLat = (p2.latitude - p1.latitude) * (Math.PI / 180);
  const dLng = (p2.longitude - p1.longitude) * (Math.PI / 180);
  const lat1Rad = p1.latitude * (Math.PI / 180);
  const lat2Rad = p2.latitude * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function calculateItineraryCosts(
  itinerary: any,
  travelStyle: string,
  currency: string = 'VND'
): any {
  if (!itinerary || !Array.isArray(itinerary.days)) return itinerary;

  const isVnd = currency === 'VND';
  const style = travelStyle || 'Adventure';

  // 1. Determine transport rate per km
  let transportRate = 8000;
  if (isVnd) {
    if (style.includes('Backpacker') || style.includes('Budget')) transportRate = 2000;
    else if (style.includes('Adventure')) transportRate = 5000;
    else if (style.includes('Leisure') || style.includes('Cultural')) transportRate = 12000;
    else if (style.includes('Luxury')) transportRate = 22000;
  } else {
    transportRate = 0.40;
    if (style.includes('Backpacker') || style.includes('Budget')) transportRate = 0.10;
    else if (style.includes('Adventure')) transportRate = 0.25;
    else if (style.includes('Leisure') || style.includes('Cultural')) transportRate = 0.60;
    else if (style.includes('Luxury')) transportRate = 1.10;
  }

  // 2. Determine daily buffer cost
  let dailyBuffer = 100000;
  if (isVnd) {
    if (style.includes('Backpacker') || style.includes('Budget')) dailyBuffer = 40000;
    else if (style.includes('Adventure')) dailyBuffer = 75000;
    else if (style.includes('Leisure') || style.includes('Cultural')) dailyBuffer = 150000;
    else if (style.includes('Luxury')) dailyBuffer = 400000;
  } else {
    dailyBuffer = 5.0;
    if (style.includes('Backpacker') || style.includes('Budget')) dailyBuffer = 2.0;
    else if (style.includes('Adventure')) dailyBuffer = 3.5;
    else if (style.includes('Leisure') || style.includes('Cultural')) dailyBuffer = 7.0;
    else if (style.includes('Luxury')) dailyBuffer = 20.0;
  }

  let totalTripDistance = 0;
  let totalTripActivityCost = 0;
  let totalTripTransportCost = 0;
  let totalTripBufferCost = 0;

  const updatedDays = itinerary.days.map((day: any) => {
    let dayActivityCost = 0;
    let dayDistance = 0;

    if (day.activities && day.activities.length > 0) {
      day.activities.forEach((act: any) => {
        const cost = Number(act.estimatedCost) || 0;
        const category = (act.category || '').toLowerCase();
        let correctedCost = cost;

        if (category === 'hotel') {
          if (cost < (isVnd ? 5000 : 1)) {
            correctedCost = isVnd
              ? (style.includes('Backpacker') || style.includes('Budget') ? 200000 : style.includes('Adventure') ? 400000 : style.includes('Leisure') || style.includes('Cultural') ? 900000 : style.includes('Luxury') ? 2500000 : 600000)
              : (style.includes('Backpacker') || style.includes('Budget') ? 10 : style.includes('Adventure') ? 18 : style.includes('Leisure') || style.includes('Cultural') ? 40 : style.includes('Luxury') ? 110 : 25);
          }
        } else if (category === 'restaurant') {
          if (cost < (isVnd ? 5000 : 1)) {
            correctedCost = isVnd
              ? (style.includes('Backpacker') || style.includes('Budget') ? 40000 : style.includes('Adventure') ? 70000 : style.includes('Leisure') || style.includes('Cultural') ? 180000 : style.includes('Luxury') ? 500000 : 100000)
              : (style.includes('Backpacker') || style.includes('Budget') ? 2 : style.includes('Adventure') ? 3.5 : style.includes('Leisure') || style.includes('Cultural') ? 8 : style.includes('Luxury') ? 22 : 4.5);
          }
        } else if (cost > 0 && cost < (isVnd ? 5000 : 0.5)) {
          correctedCost = isVnd
            ? (style.includes('Backpacker') || style.includes('Budget') || style.includes('Adventure') ? 20000 : style.includes('Leisure') || style.includes('Cultural') ? 50000 : style.includes('Luxury') ? 150000 : 30000)
            : (style.includes('Backpacker') || style.includes('Budget') || style.includes('Adventure') ? 1 : style.includes('Leisure') || style.includes('Cultural') ? 2.5 : style.includes('Luxury') ? 7 : 1.5);
        }

        act.estimatedCost = correctedCost;
        dayActivityCost += correctedCost;
      });

      // Calculate transportation distance between sequential activities
      for (let j = 0; j < day.activities.length - 1; j++) {
        const a1 = day.activities[j];
        const a2 = day.activities[j + 1];
        if (a1.latitude && a1.longitude && a2.latitude && a2.longitude) {
          dayDistance += calculateHaversineDistance(
            { latitude: a1.latitude, longitude: a1.longitude },
            { latitude: a2.latitude, longitude: a2.longitude }
          );
        }
      }

      // Add distance from the last activity back to the first activity (hotel/base loop)
      if (day.activities.length > 1) {
        const first = day.activities[0];
        const last = day.activities[day.activities.length - 1];
        if (first.latitude && first.longitude && last.latitude && last.longitude) {
          dayDistance += calculateHaversineDistance(
            { latitude: last.latitude, longitude: last.longitude },
            { latitude: first.latitude, longitude: first.longitude }
          );
        }
      }
    }

    const dayTransportCost = dayDistance * transportRate;
    const dayBufferCost = dailyBuffer;
    const dayTotalCost = dayActivityCost + dayTransportCost + dayBufferCost;

    totalTripDistance += dayDistance;
    totalTripActivityCost += dayActivityCost;
    totalTripTransportCost += dayTransportCost;
    totalTripBufferCost += dayBufferCost;

    return {
      ...day,
      dailyEstimatedCost: Math.round(dayTotalCost),
      activityCost: Math.round(dayActivityCost),
      transportCost: Math.round(dayTransportCost),
      bufferCost: Math.round(dayBufferCost),
      totalDistanceKm: Number(dayDistance.toFixed(2)),
    };
  });

  const totalTripCost = totalTripActivityCost + totalTripTransportCost + totalTripBufferCost;

  return {
    ...itinerary,
    totalEstimatedCost: Math.round(totalTripCost),
    totalActivityCost: Math.round(totalTripActivityCost),
    totalTransportCost: Math.round(totalTripTransportCost),
    totalBufferCost: Math.round(totalTripBufferCost),
    totalDistanceKm: Number(totalTripDistance.toFixed(2)),
    days: updatedDays,
  };
}

const TripPlanner = () => {
  const { lang, t } = useLang();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);

  const [destination, setDestination] = useState('');
  const [days, setDays] = useState<number | ''>('');
  const [budget, setBudget] = useState<number | ''>('');
  const [currency, setCurrency] = useState<'USD' | 'VND'>('VND');
  const [style, setStyle] = useState('Adventure');
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPart, setLoadingPart] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [itinerary, setItinerary] = useState<any>(null);
  const [optimized, setOptimized] = useState(false);
  const [savedTripId, setSavedTripId] = useState<string | null>(null);
  const [savingTrip, setSavingTrip] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');
  const [aiError, setAiError] = useState<string | null>(null);
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({});

  const [loadingHistory, setLoadingHistory] = useState(false);
  const [aiHistory, setAiHistory] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [showAllHistory, setShowAllHistory] = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    let loadedFromApi = false;
    if (isAuthenticated) {
      try {
        const historyData = await tripsService.LayLichSuTaoChuyenDiAI();
        if (Array.isArray(historyData) && historyData.length > 0) {
          setAiHistory(historyData);
          loadedFromApi = true;
        }
      } catch (err) {
        console.error('Failed to fetch AI history:', err);
      }
    }

    if (!loadedFromApi) {
      try {
        const localData = localStorage.getItem('smarttravel_ai_history');
        if (localData) {
          const parsed = JSON.parse(localData);
          setAiHistory(Array.isArray(parsed) ? parsed : []);
        } else {
          setAiHistory([]);
        }
      } catch (e) {
        setAiHistory([]);
      }
    }
    setLoadingHistory(false);
  };

  useEffect(() => {
    loadHistory();
  }, [isAuthenticated]);

  const handleLoadHistoryItem = (item: any) => {
    if (!item || !item.itinerary) return;
    setDestination(item.destination || item.itinerary.destination?.name || (typeof item.itinerary.destination === 'string' ? item.itinerary.destination : '') || '');
    setDays(item.durationDays || item.itinerary.days?.length || '');
    setBudget(item.totalBudget || item.itinerary.totalEstimatedCost || '');
    setStyle(item.travelStyle || 'Adventure');
    setInterests(item.interests || []);
    setItinerary(item.itinerary);
    setSelectedDay(1);
    if (item.id && !String(item.id).startsWith('hist-')) {
      setSavedTripId(item.id);
    } else {
      setSavedTripId(null);
    }
  };

  const getHistoryItemTitle = (item: any) => {
    if (item.itinerary?.title) return item.itinerary.title;
    const dest = item.destination || (typeof item.itinerary?.destination === 'string' ? item.itinerary.destination : item.itinerary?.destination?.name) || item.promptText?.match(/destination=(.+?)\s+days=/)?.[1];
    if (dest) {
      const dayCount = item.durationDays || item.itinerary?.days?.length || Number(item.promptText?.match(/days=(\d+)/)?.[1]) || 0;
      const capitalizedDest = dest.replace(/\b\w/g, (c: string) => c.toUpperCase());
      return lang === 'vi' ? `Khám phá ${capitalizedDest} (${dayCount} ngày)` : `Explore ${capitalizedDest} (${dayCount} days)`;
    }
    return lang === 'vi' ? 'Hành trình không tên' : 'Unnamed Itinerary';
  };

  const renderHistoryList = () => {
    const filtered = aiHistory.filter((item: any) => {
      const title = getHistoryItemTitle(item).toLowerCase();
      return title.includes(historySearch.toLowerCase());
    });

    const displayItems = showAllHistory ? filtered : filtered.slice(0, 5);

    return (
      <div className="flex flex-col bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-5 rounded-2xl shadow-xl space-y-4 h-full">
        <div className="flex justify-between items-center border-b border-[var(--border-normal)] pb-3">
          <h3 className="font-ui text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BrainCircuit size={15} className="text-blue-500" /> 
            {lang === 'vi' ? 'Lịch sử AI' : 'AI History'}
          </h3>
          {filtered.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllHistory(!showAllHistory)}
              className="text-[9px] font-bold text-blue-500 hover:text-blue-600 hover:underline bg-transparent border-none cursor-pointer"
            >
              {showAllHistory ? (lang === 'vi' ? 'Thu gọn' : 'Show less') : (lang === 'vi' ? 'Xem tất cả' : 'View all')}
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-3 top-2.5 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            placeholder={lang === 'vi' ? 'Tìm kiếm hành trình...' : 'Search logs...'}
            value={historySearch}
            onChange={e => setHistorySearch(e.target.value)}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-xl pl-9 pr-3 py-2 text-[10px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* List */}
        <div className="space-y-2 overflow-y-auto max-h-[350px] pr-1 custom-scrollbar">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-6 text-slate-400 gap-1.5 text-xs">
              <Loader2 size={12} className="animate-spin" />
              <span>{lang === 'vi' ? 'Đang tải lịch sử...' : 'Loading history...'}</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-[10px] text-[var(--text-muted)] text-center py-6">
              {lang === 'vi' ? 'Chưa có lịch sử tạo.' : 'No creation history yet.'}
            </p>
          ) : (
            displayItems.map((item: any) => {
              const title = getHistoryItemTitle(item);
              const daysCount = item.durationDays || item.itinerary?.days?.length || 0;
              const isCurrentLoaded = itinerary && (itinerary.title === title || (itinerary.destination?.name === item.itinerary?.destination?.name && itinerary.days?.length === item.itinerary?.days?.length));
              
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleLoadHistoryItem(item)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 group cursor-pointer ${
                    isCurrentLoaded 
                      ? 'bg-blue-500/10 border-blue-500 shadow-sm ring-1 ring-blue-500/10' 
                      : 'bg-[var(--bg-primary)] border-[var(--border-normal)] hover:border-blue-500/30'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    isCurrentLoaded ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-blue-500'
                  }`}>
                    <BrainCircuit size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[10px] font-bold text-[var(--text-primary)] truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</h4>
                    <div className="flex items-center gap-1.5 text-[8px] text-[var(--text-muted)] mt-0.5">
                      <span>📅 {daysCount} {lang === 'vi' ? 'Ngày' : 'Days'}</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const toggleExpandActivity = (key: string) => {
    setExpandedActivities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveTrip = async () => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: '/planner' } });
      return;
    }
    if (!itinerary) return;
    setSavingTrip(true);
    try {
      const trip = await tripsService.TaoChuyenDi({
        title: itinerary.title || (lang === 'vi' ? `Hành trình khám phá ${destination}` : `Explore ${destination}`),
        description: lang === 'vi' 
          ? `Lịch trình du lịch AI tự động cho ${days} ngày tại ${destination}.` 
          : `AI-generated itinerary for ${days} days in ${destination}.`,
        destinationName: destination,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000).toISOString(),
        totalBudget: itinerary.totalEstimatedCost || Number(budget) || 0,
        travelStyle: style,
        isPublic: false,
        days: itinerary.days
      });
      if (trip && trip.id) {
        setSavedTripId(trip.id);
        success(lang === 'vi' ? 'Đã lưu hành trình thành công!' : 'Itinerary saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save trip:', err);
      error(lang === 'vi' ? 'Lưu hành trình thất bại.' : 'Failed to save itinerary.');
    } finally {
      setSavingTrip(false);
    }
  };

  const toggleInterest = (val: string) =>
    setInterests(p => p.includes(val) ? p.filter(i => i !== val) : [...p, val]);

  const handleGenerate = async () => {
    if (!destination || !destination.trim()) {
      error(lang === 'vi' ? 'Vui lòng nhập điểm đến (Ví dụ: Hà Giang, Đà Lạt, Đà Nẵng...)' : 'Please enter a destination!');
      return;
    }
    if (days === '' || Number(days) <= 0) {
      error(lang === 'vi' ? 'Vui lòng nhập số ngày du lịch (Ví dụ: 2, 3...)' : 'Please enter number of days!');
      return;
    }
    if (budget === '' || Number(budget) <= 0) {
      error(lang === 'vi' ? 'Vui lòng nhập tổng ngân sách dự kiến!' : 'Please enter total budget!');
      return;
    }

    setLoading(true); setOptimized(false); setAiError(null); setSelectedDay(1); setSavedTripId(null);
    let finalResult: any = null;

    try {
      const result = await tripsService.TaoChuyenDiBangAI({
        destination,
        durationDays: Number(days),
        totalBudget: Number(budget),
        currency,
        interests,
        travelStyle: style
      });
      finalResult = result;
      setItinerary(result);
    } catch {
      const isVi = lang === 'vi';
      setAiError(isVi ? 'Không kết nối được dịch vụ AI — đang hiển thị lịch trình mẫu.' : 'AI endpoint unavailable — showing sample itinerary.');
      
      const targetDays = Math.max(1, Number(days));
      const generatedDays = [];

      const SAMPLE_ATTRACTIONS = [
        { name: 'Cột cờ Lũng Cú', category: 'attraction', notes: 'Cột cờ thiêng liêng nơi địa đầu Tổ quốc.' },
        { name: 'Dốc Thẩm Mã', category: 'attraction', notes: 'Cung đường đèo uốn lượn đẹp mắt.' },
        { name: 'Dinh thự họ Vương', category: 'attraction', notes: 'Kiến trúc cổ Vua Mèo độc đáo.' },
        { name: 'Phố cổ Đồng Văn', category: 'attraction', notes: 'Quần thể nhà cổ trăm năm ngói âm dương.' },
        { name: 'Hẻm Tu Sản', category: 'nature', notes: 'Hẻm vực sâu nhất Đông Nam Á tráng lệ.' },
        { name: 'Sông Nho Quế', category: 'nature', notes: 'Dòng sông xanh ngọc bích êm đềm.' },
        { name: 'Cổng trời Quản Bạ', category: 'attraction', notes: 'Cửa ngõ vào Cao nguyên đá Đồng Văn.' },
        { name: 'Núi Đôi Cô Tiên', category: 'nature', notes: 'Tuyệt tác thiên nhiên Núi Đôi kỳ thú.' },
        { name: 'Rừng thông Yên Minh', category: 'nature', notes: 'Rừng thông xanh tươi mát dịu êm.' },
        { name: 'Danh thắng Hoàng Su Phì', category: 'nature', notes: 'Ruộng bậc thang vàng óng kỳ vĩ.' },
        { name: 'Chợ phiên Mèo Vạc', category: 'festival', notes: 'Chợ phiên sắc màu truyền thống.' },
        { name: 'Thung lũng Sủng Là', category: 'nature', notes: 'Đóa hoa nở trên đá và Nhà của Pao.' },
        { name: 'Làng văn hóa Lũng Cẩm', category: 'attraction', notes: 'Làng cổ H\'Mông trình tường rêu phong.' },
        { name: 'Cây cô đơn Can Tỷ', category: 'attraction', notes: 'Cây nghiến sừng sững giữa vách núi.' },
        { name: 'Làng Pả Vi Mèo Vạc', category: 'attraction', notes: 'Làng du lịch cộng đồng dân tộc.' },
        { name: 'Hang Lùng Khúy', category: 'nature', notes: 'Đệ nhất hang động cao nguyên đá.' },
        { name: 'Đèo Mã Pí Lèng', category: 'nature', notes: 'Một trong tứ đại đỉnh đèo Việt Nam.' },
        { name: 'Thác Du Già', category: 'nature', notes: 'Dòng thác mát rượi giữa thung lũng.' },
        { name: 'Dốc Pai Lủng', category: 'attraction', notes: 'Cung đường ngắm hoàng hôn tuyệt đẹp.' },
        { name: 'Mốc 428 Biên Giới', category: 'attraction', notes: 'Cột mốc biên giới cực Bắc thiêng liêng.' }
      ];

      const SAMPLE_RESTAURANTS = [
        { name: 'Phở tráng tay Đồng Văn', notes: 'Phở tráng tay thủ công nóng hổi.' },
        { name: 'Bánh cuốn trứng Phố Cổ', notes: 'Bánh cuốn chấm nước ninh xương béo ngậy.' },
        { name: 'Bún chả Yên Minh', notes: 'Bún chả nướng than hoa thơm lừng.' },
        { name: 'Nhà hàng Oanh Hiệu', notes: 'Lẩu gà đen nấm rừng trứ danh.' },
        { name: 'Cơm lam Mèo Vạc', notes: 'Cơm lam nướng ống nứa ăn kèm thịt quay.' },
        { name: 'Lẩu thắng cố Đồng Văn', notes: 'Thắng cố men lá truyền thống đậm đà.' },
        { name: 'Lẩu gà đen H\'Mông', notes: 'Lẩu gà đen ninh thuốc bắc rau sạch.' },
        { name: 'Quán ăn Lũng Cú', notes: 'Ẩm thực địa phương chân Cột cờ.' },
        { name: 'Nhà hàng Tiến Nhị', notes: 'Nhà hàng đặc sản nổi tiếng.' },
        { name: 'Quán ăn Quản Bạ', notes: 'Thịt bò khô và rau rừng tươi ngon.' },
        { name: 'Nhà hàng Khải Hoàn', notes: 'Nhà hàng ấm cúng thực đơn đa dạng.' },
        { name: 'Quán cơm Hoàng Su Phì', notes: 'Cơm bình dân dẻo thơm kèm cá suối.' },
        { name: 'Cà phê Cực Bắc Lũng Cú', notes: 'Cà phê H\'Mông không gian yên bình.' }
      ];

      const usedNamesSample = new Set<string>();

      const getItem = (pool: any[], prefix: string, idx: number) => {
        const unused = pool.filter(p => !usedNamesSample.has(p.name.toLowerCase()));
        if (unused.length > 0) {
          const item = unused[0];
          usedNamesSample.add(item.name.toLowerCase());
          return item;
        }
        const base = pool[idx % pool.length];
        const dynamicName = `${prefix} ${base.name} ${destination}`;
        usedNamesSample.add(dynamicName.toLowerCase());
        return { ...base, name: dynamicName };
      };

      for (let i = 1; i <= targetDays; i++) {
        const act1 = getItem(SAMPLE_ATTRACTIONS, 'Tham quan', i * 2 - 2);
        const act2 = getItem(SAMPLE_ATTRACTIONS, 'Khám phá', i * 2 - 1);
        const rest1 = getItem(SAMPLE_RESTAURANTS, 'Ăn sáng', i * 3 - 3);
        const rest2 = getItem(SAMPLE_RESTAURANTS, 'Ăn trưa', i * 3 - 2);
        const rest3 = getItem(SAMPLE_RESTAURANTS, 'Ăn tối', i * 3 - 1);

        generatedDays.push({
          dayIndex: i,
          dateIndex: isVi ? `Ngày ${i}: Khám phá ${act1.name} & đặc sản ${destination}` : `Day ${i}: Discover ${act1.name} & ${destination} Specialties`,
          activities: [
            {
              session: 'Sáng',
              timeSlot: '07:30 - 08:30',
              activityName: isVi ? `Bữa sáng: ${rest1.name}` : `Breakfast: ${rest1.name}`,
              locationName: `${rest1.name}, ${destination}`,
              estimatedCost: Number(budget) * 0.05,
              category: 'restaurant',
              notes: isVi ? `${rest1.notes}` : 'Enjoy delicious breakfast.',
              latitude: 21.0285 + i * 0.005,
              longitude: 105.8048 + i * 0.005
            },
            {
              session: 'Sáng',
              timeSlot: '08:30 - 11:30',
              activityName: isVi ? `Tham quan ${act1.name}` : `Sightseeing ${act1.name}`,
              locationName: `${act1.name}, ${destination}`,
              estimatedCost: Number(budget) * 0.1,
              category: act1.category || 'attraction',
              notes: isVi ? `${act1.notes} Check-in chụp ảnh lưu niệm.` : 'Sightseeing and photography.',
              latitude: 21.0305 + i * 0.005,
              longitude: 105.8068 + i * 0.005
            },
            {
              session: 'Trưa',
              timeSlot: '11:30 - 14:00',
              activityName: isVi ? `Ăn trưa & Cà phê tại ${rest2.name}` : `Lunch & Coffee at ${rest2.name}`,
              locationName: `${rest2.name}, ${destination}`,
              estimatedCost: Number(budget) * 0.15,
              category: 'restaurant',
              notes: isVi ? `${rest2.notes} Thưởng thức món ngon trứ danh.` : 'Enjoy lunch and relax.',
              latitude: 21.0325 + i * 0.005,
              longitude: 105.8088 + i * 0.005
            },
            {
              session: 'Chiều',
              timeSlot: '14:00 - 17:30',
              activityName: isVi ? `Khám phá ${act2.name}` : `Explore ${act2.name}`,
              locationName: `${act2.name}, ${destination}`,
              estimatedCost: Number(budget) * 0.1,
              category: act2.category || 'nature',
              notes: isVi ? `${act2.notes} Trải nghiệm thiên nhiên và cảnh quan.` : 'Immerse in local nature.',
              latitude: 21.0345 + i * 0.005,
              longitude: 105.8108 + i * 0.005
            },
            {
              session: 'Tối',
              timeSlot: '18:30 - 20:00',
              activityName: isVi ? `Thưởng thức bữa tối tại ${rest3.name}` : `Dinner at ${rest3.name}`,
              locationName: `${rest3.name}, ${destination}`,
              estimatedCost: Number(budget) * 0.15,
              category: 'restaurant',
              notes: isVi ? `${rest3.notes} Bữa tối ấm cúng vùng cao.` : 'Enjoy delicious dinner.',
              latitude: 21.0355 + i * 0.005,
              longitude: 105.8118 + i * 0.005
            },
            {
              session: 'Tối',
              timeSlot: '20:00 - 22:00',
              activityName: isVi ? `Dạo chợ đêm & Nghỉ đêm tại Khách sạn trung tâm` : `Night Market Walk & Hotel Stay`,
              locationName: isVi ? `Khách sạn trung tâm ${destination}` : `Center Hotel ${destination}`,
              estimatedCost: Number(budget) * 0.2,
              category: 'hotel',
              notes: isVi ? 'Dạo chợ đêm, đi bộ phố đêm và nghỉ ngơi.' : 'Night market walk and relax at hotel.',
              latitude: 21.0365 + i * 0.005,
              longitude: 105.8128 + i * 0.005
            }
          ]
        });
      }

      const mockResult = {
        destination,
        currency,
        totalEstimatedCost: Number(budget),
        days: generatedDays
      };
      finalResult = calculateItineraryCosts(mockResult, style, currency);
      setItinerary(finalResult);
    } finally {
      setLoading(false);
      if (finalResult) {
        const newHistoryEntry = {
          id: 'hist-' + Date.now(),
          promptText: `destination=${destination} days=${days} budget=${budget} style=${style}`,
          type: 'itinerary',
          createdAt: new Date().toISOString(),
          destination,
          durationDays: Number(days),
          totalBudget: Number(budget),
          travelStyle: style,
          interests,
          itinerary: finalResult,
        };

        try {
          const existingLocal = localStorage.getItem('smarttravel_ai_history');
          const parsedLocal = existingLocal ? JSON.parse(existingLocal) : [];
          const updatedLocal = [newHistoryEntry, ...parsedLocal.filter((h: any) => h.id !== newHistoryEntry.id)].slice(0, 20);
          localStorage.setItem('smarttravel_ai_history', JSON.stringify(updatedLocal));
        } catch (e) {
          console.warn('Failed to save to localStorage:', e);
        }

        loadHistory();
      }
    }
  };

  const handleRegeneratePart = async (dayIdx: number, sessionName?: 'Sáng' | 'Trưa' | 'Chiều' | 'Tối') => {
    if (!itinerary) return;
    const targetKey = sessionName ? `session-${dayIdx}-${sessionName}` : `day-${dayIdx}`;
    setLoadingPart(targetKey);
    
    // Gather exclude places (current names)
    const excludePlaces: string[] = [];
    itinerary.days.forEach((d: any) => {
      d.activities.forEach((a: any) => {
        if (a.activityName) excludePlaces.push(a.activityName);
      });
    });

    try {
      const response = await tripsService.TaoLaiMotPhanChuyenDiBangAI({
        destination,
        durationDays: Number(days),
        totalBudget: Number(budget),
        currency,
        interests,
        travelStyle: style,
        targetDayIndex: dayIdx,
        targetSession: sessionName,
        currentItinerary: itinerary,
        excludePlaces
      });
      if (response) {
        setItinerary(response);
        setOptimized(false);
      }
    } catch (err) {
      console.error('Failed to regenerate part:', err);
      error(lang === 'vi' ? 'Không thể đổi lịch trình. Vui lòng thử lại.' : 'Failed to regenerate part. Please try again.');
    } finally {
      setLoadingPart(null);
    }
  };

  const runRouteOptimization = async () => {
    if (!itinerary) return;
    setLoading(true);
    try {
      const optimizedDays = await Promise.all(
        itinerary.days.map(async (d: any) => {
          if (!d.activities || d.activities.length <= 1) return d;
          
          const waypoints: Waypoint[] = d.activities.map((act: any, idx: number) => ({
            id: String(idx),
            name: act.activityName || act.name,
            latitude: act.latitude || 21.0285,
            longitude: act.longitude || 105.8048,
          }));

          try {
            const res = await tripsService.ToiUuDuongDi(waypoints);
            const reordered = res.orderedWaypoints.map((wp: any) => {
              const originalIdx = Number(wp.id);
              return d.activities[originalIdx];
            });
            return { ...d, activities: reordered };
          } catch (err) {
            console.error('Failed to call optimize-route on backend:', err);
            return { ...d, activities: [...d.activities].reverse() };
          }
        })
      );
      setItinerary(calculateItineraryCosts({ ...itinerary, days: optimizedDays }, style, currency));
      setOptimized(true);
    } catch (err) {
      console.error('Failed to run route optimization:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => TRIP_ACTIVITY_ICONS[category] ?? MapPin;

  const formatCost = (amount: any) => {
    if (amount === undefined || amount === null) {
      return lang === 'vi' ? 'Miễn phí' : 'Free';
    }
    const strVal = String(amount).trim().toLowerCase();
    if (strVal === 'free' || strVal === 'mien phi' || strVal === 'miễn phí' || strVal === '0' || strVal === '') {
      return lang === 'vi' ? 'Miễn phí' : 'Free';
    }
    const num = Number(amount);
    if (isNaN(num)) {
      return lang === 'vi' ? 'Miễn phí' : 'Free';
    }
    const curr = itinerary?.currency || currency;
    if (curr === 'VND') {
      return `${Math.round(num).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')} đ`;
    }
    return `$${Math.round(num)}`;
  };

  const getGoogleMapsDirectionsUrl = (activities: any[]) => {
    if (!activities || activities.length === 0) return '';
    const validActs = activities.filter(act => act.latitude && act.longitude);
    if (validActs.length === 0) return '';
    if (validActs.length === 1) {
      const act = validActs[0];
      const title = act.activityName || act.name || '';
      const address = act.address || act.locationName || '';
      const query = address ? `${title} ${address}` : `${title} ${act.latitude},${act.longitude}`;
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    }
    const origin = `${validActs[0].latitude},${validActs[0].longitude}`;
    const destination = `${validActs[validActs.length - 1].latitude},${validActs[validActs.length - 1].longitude}`;
    let waypoints = '';
    if (validActs.length > 2) {
      const intermediate = validActs.slice(1, validActs.length - 1);
      waypoints = intermediate.map(act => `${act.latitude},${act.longitude}`).join('%7C');
    }
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`;
  };

  const styleOptions = [
    { value: 'Adventure', label: lang === 'vi' ? 'Phiêu lưu' : 'Adventure' },
    { value: 'Cultural Exploration', label: lang === 'vi' ? 'Khám phá văn hoá' : 'Cultural Exploration' },
    { value: 'Leisure & Food', label: lang === 'vi' ? 'Nghỉ dưỡng & Ẩm thực' : 'Leisure & Food' },
    { value: 'Luxury Wellness', label: lang === 'vi' ? 'Sang trọng' : 'Luxury Wellness' },
    { value: 'Budget Backpacker', label: lang === 'vi' ? 'Tiết kiệm' : 'Budget Backpacker' },
  ];

  const getCategoryStyles = (category: string) => {
    const cleanCat = (category || '').toLowerCase();
    switch (cleanCat) {
      case 'hotel':
        return {
          bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
          dot: 'bg-blue-500 ring-4 ring-blue-500/20',
          iconColor: 'text-blue-400',
          accent: 'border-l-4 border-l-blue-500'
        };
      case 'restaurant':
        return {
          bg: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
          dot: 'bg-orange-500 ring-4 ring-orange-500/20',
          iconColor: 'text-orange-400',
          accent: 'border-l-4 border-l-orange-500'
        };
      case 'attraction':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          dot: 'bg-emerald-500 ring-4 ring-emerald-500/20',
          iconColor: 'text-emerald-400',
          accent: 'border-l-4 border-l-emerald-500'
        };
      case 'nature':
        return {
          bg: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
          dot: 'bg-teal-500 ring-4 ring-teal-500/20',
          iconColor: 'text-teal-400',
          accent: 'border-l-4 border-l-teal-500'
        };
      default:
        return {
          bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
          dot: 'bg-indigo-500 ring-4 ring-indigo-500/20',
          iconColor: 'text-indigo-400',
          accent: 'border-l-4 border-l-indigo-500'
        };
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50/80 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans overflow-x-clip animate-fade-in">
      {/* ── Travel Geo-Grid & Pattern Vector Overlay ── */}
      <svg className="absolute inset-0 w-full h-full opacity-25 dark:opacity-10 pointer-events-none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="travel-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <circle cx="40" cy="40" r="1.5" className="fill-brand-500/50" />
            <path d="M0 40H80M40 0V80" strokeWidth="0.5" strokeDasharray="6 6" className="stroke-slate-300 dark:stroke-slate-800" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#travel-grid)" />
      </svg>

      {/* ── Background Compass & Flight Arc Vector Artwork ── */}
      <svg className="absolute top-12 right-12 w-96 h-96 opacity-15 dark:opacity-10 text-brand-500 pointer-events-none" viewBox="0 0 200 200" fill="none" stroke="currentColor">
        <circle cx="100" cy="100" r="80" strokeWidth="1" strokeDasharray="6 6" />
        <circle cx="100" cy="100" r="60" strokeWidth="0.5" />
        <path d="M100 10 L100 190 M10 100 L190 100" strokeWidth="1" />
        <polygon points="100,20 108,92 180,100 108,108 100,180 92,108 20,100 92,92" fill="currentColor" opacity="0.2" />
      </svg>

      {/* ── Multi-Layer Vibrant Ambient Glow Mesh ── */}
      <div className="absolute top-10 left-10 w-[700px] h-[700px] bg-gradient-to-tr from-brand-500/20 via-sky-500/15 to-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[500px] right-10 w-[600px] h-[600px] bg-gradient-to-bl from-purple-600/18 via-pink-500/15 to-amber-500/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[550px] h-[550px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 space-y-6 max-w-[1750px] mx-auto">
      {/* Title & Banner */}
      <div className="relative p-6 md:p-8 rounded-3xl overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border-normal)] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_45%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.06),transparent_50%)] pointer-events-none" />
        
        <div className="space-y-2 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/20 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Sparkles size={11} className="animate-pulse" /> {lang === 'vi' ? 'Công nghệ AI Thế Hệ Mới' : 'Next-Gen AI Technology'}
          </div>
          <KineticText
            text={t('planner.heading')}
            as="h1"
            className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-white dark:via-cream dark:to-slate-200"
          />
          <p className="text-xs text-[var(--text-secondary)] max-w-xl">{t('planner.subtitle')}</p>
        </div>
        
        <div className="flex-shrink-0 flex items-center gap-4 relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <BrainCircuit size={24} className="text-white animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--text-primary)]">{lang === 'vi' ? 'Trợ lý Lộ trình AI' : 'AI Itinerary Assistant'}</h4>
            <p className="text-[10px] text-[var(--text-muted)]">{lang === 'vi' ? 'Sẵn sàng tư vấn 24/7' : 'Ready to help 24/7'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Form: Itinerary Parameters */}
        <div className="lg:col-span-3 bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-5 rounded-2xl shadow-xl space-y-6 h-fit relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-teal-500 to-indigo-500" />
          
          <h3 className="font-ui text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-normal)] pb-4">
            <Compass size={16} className="text-blue-500" /> {lang === 'vi' ? 'Thông số hành trình' : 'Itinerary Parameters'}
          </h3>
          
          <div className="space-y-5">
            {/* Destination Input */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('planner.destination')}</label>
              <div className="relative group">
                <MapPin size={16} className="absolute left-3.5 top-3.5 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  value={destination} 
                  onChange={e => setDestination(e.target.value)}
                  placeholder={lang === 'vi' ? 'Nhập điểm đến (ví dụ: Hà Giang)' : 'Enter destination (e.g., Ha Giang)'}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-xl pl-11 pr-4 py-3.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Days & Budget Grid */}
            <div className="grid grid-cols-[100px_1fr] gap-4">
              {/* Days Input */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider h-8 flex items-end">{t('planner.days')}</label>
                <div className="relative group">
                  <Calendar size={16} className="absolute left-3 top-3.5 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="number" 
                    value={days === '' ? '' : days} 
                    onChange={e => { const val = e.target.value; setDays(val === '' ? '' : Number(val)); }} 
                    min={1} 
                    max={15}
                    placeholder="2"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-xl pl-9 pr-2 py-3.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Budget Input */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider h-8 flex items-end">{t('planner.budget')}</label>
                <div className="flex rounded-xl overflow-hidden border border-[var(--border-normal)] bg-[var(--bg-primary)] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all shadow-inner relative group">
                  <DollarSign size={16} className="absolute left-3.5 top-3.5 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    value={budget === '' ? '' : budget.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} 
                    placeholder=""
                    onChange={e => {
                      const rawVal = e.target.value.replace(/\D/g, '');
                      setBudget(rawVal === '' ? '' : Number(rawVal));
                    }} 
                    className="w-full bg-transparent pl-11 pr-1 py-3.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none min-w-0" 
                  />
                  <select 
                    value={currency} 
                    onChange={e => setCurrency(e.target.value as 'USD' | 'VND')}
                    className="bg-[var(--bg-elevated)] border-l border-[var(--border-normal)] text-[10px] text-blue-500 font-bold px-2 py-3.5 outline-none cursor-pointer hover:bg-[var(--bg-primary)] transition-all flex-shrink-0"
                  >
                    <option value="VND">VND</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Travel Style */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('planner.style')}</label>
              <div className="relative group">
                <Sparkles size={16} className="absolute left-3.5 top-3.5 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                <select 
                  value={style} 
                  onChange={e => setStyle(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-xl pl-11 pr-4 py-3.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner appearance-none cursor-pointer"
                >
                  {styleOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <div className="absolute right-3.5 top-4 pointer-events-none text-[var(--text-muted)] border-none bg-transparent">▼</div>
              </div>
            </div>

            {/* Interests tags */}
            <div className="space-y-2.5">
              <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{t('planner.interests')}</label>
              <div className="flex flex-wrap gap-2">
                {['nature', 'culture', 'food', 'hiking', 'photography', 'history'].map(tag => {
                  const isActive = interests.includes(tag);
                  return (
                    <button 
                      key={tag} 
                      type="button" 
                      onClick={() => toggleInterest(tag)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 active:scale-95 cursor-pointer ${
                        isActive 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                          : 'bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-blue-950/40 hover:border-blue-500 shadow-sm'
                      }`}
                    >
                      <Hash size={10} /> {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <RippleButton 
              onClick={handleGenerate} 
              disabled={loading} 
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all border border-transparent disabled:cursor-not-allowed cursor-pointer"
              rippleColor="rgba(255,255,255,0.4)"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> {t('planner.generating')}</>
              ) : (
                <><Sparkles size={14} /> {t('planner.generate')}</>
              )}
            </RippleButton>

          </div>
        </div>

        {/* Right Panel: Results / Itinerary View */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Error Message */}
          {aiError && (
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-normal)] px-4 py-3 rounded-xl border-l-4 border-amber-500 text-xs text-amber-500 flex items-center gap-2 shadow-md animate-shake">
              <AlertTriangle size={15} /> {aiError}
            </div>
          )}

          {/* Loading State Skeleton */}
          {loading && !itinerary ? (
            <div className="bg-[var(--bg-elevated)] p-8 md:p-12 rounded-2xl border border-[var(--border-normal)] shadow-2xl text-center space-y-8 relative overflow-hidden animate-fade-in">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_45%)] pointer-events-none" />
              
              <div className="relative">
                <div className="w-20 h-20 mx-auto rounded-full bg-blue-500/10 border-2 border-dashed border-blue-500 flex items-center justify-center animate-spin duration-8000">
                  <BrainCircuit size={36} className="text-blue-400 animate-pulse" />
                </div>
                <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full bg-blue-500/5 animate-ping" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold font-ui text-cream">{lang === 'vi' ? 'AI Đang Thiết Kế Hành Trình...' : 'AI Designing Your Itinerary...'}</h3>
                <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                  {lang === 'vi' 
                    ? `Đang tổng hợp các điểm tham quan, cơ sở lưu trú và tối ưu hóa tuyến đường cho chuyến đi tại ${destination}.`
                    : `Compiling locations, attractions, hotels and optimizing routes for your trip in ${destination}.`}
                </p>
              </div>

              {/* Progress Steps Simulation */}
              <div className="max-w-xs mx-auto text-left space-y-3 bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)] text-[11px]">
                <div className="flex items-center gap-2 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>{lang === 'vi' ? '1. Đọc dữ liệu địa danh du lịch...' : '1. Scanning local destination database...'}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>{lang === 'vi' ? '2. Tìm kiếm khách sạn & ẩm thực phù hợp...' : '2. Matching hotels & food spots...'}</span>
                </div>
                <div className="flex items-center gap-2 text-amber-400/80">
                  <span className="w-2 h-2 rounded-full bg-amber-500/40" />
                  <span>{lang === 'vi' ? '3. Tối ưu tuyến đường di chuyển...' : '3. Running route planning engine...'}</span>
                </div>
              </div>

              <div className="text-[10px] text-[var(--text-muted)] animate-pulse">
                {lang === 'vi' ? 'Quá trình này thường mất từ 3-5 giây...' : 'This process usually takes 3-5 seconds...'}
              </div>
            </div>
          ) : itinerary ? (
            <div className="space-y-6 animate-slide-up">
              
              {/* Cost & Optimization dashboard header */}
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between sm:items-center gap-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="space-y-2 w-full sm:w-auto">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{t('planner.cost')}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{formatCost(itinerary.totalEstimatedCost || itinerary.totalCost || 0)}</span>
                    <span className="text-[11px] text-[var(--text-muted)]">({itinerary.currency || currency} ±10%)</span>
                  </div>
                  {/* Budget comparison check */}
                  {budget && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>
                        {lang === 'vi' ? 'Ngân sách đề xuất: ' : 'Target Budget: '} 
                        <strong className="text-[var(--text-primary)]">{formatCost(budget)}</strong>
                      </span>
                    </div>
                  )}
                  {/* Dynamic Cost Breakdown Row */}
                  <div className="grid grid-cols-3 gap-4 pt-3 mt-3 border-t border-[var(--border-normal)] text-[10px]">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] block">{t('planner.activitiesCost')}</span>
                      <span className="font-bold text-[var(--text-primary)]">{formatCost(itinerary.totalActivityCost || 0)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] block">{t('planner.transportCost')}</span>
                      <span className="font-bold text-[var(--text-primary)]">
                        {formatCost(itinerary.totalTransportCost || 0)}
                        {itinerary.totalDistanceKm !== undefined && (
                          <span className="text-[9px] font-normal text-[var(--text-muted)] block">({itinerary.totalDistanceKm} km)</span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] block">{t('planner.bufferCost')}</span>
                      <span className="font-bold text-[var(--text-primary)]">{formatCost(itinerary.totalBufferCost || 0)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={runRouteOptimization}
                    disabled={loading}
                    className={`px-5 py-3 text-xs font-bold rounded-xl border active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 ${
                      optimized 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/5' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white font-bold border-transparent shadow-md hover:shadow-blue-500/10'
                    }`}
                  >
                    {optimized ? (
                      <><Check size={13} strokeWidth={2.5} /> {t('planner.optimized')}</>
                    ) : (
                      <><Zap size={13} className="animate-pulse" /> {t('planner.optimize')}</>
                    )}
                  </button>
                  
                  <RippleButton 
                    onClick={handleSaveTrip}
                    disabled={savingTrip || savedTripId !== null}
                    className={`px-5 py-3 text-xs font-bold rounded-xl border active:scale-95 transition-all flex items-center gap-1.5 ${
                      savedTripId 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white font-bold border-transparent shadow-md'
                    }`}
                    rippleColor={savedTripId ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.4)"}
                  >
                    {savingTrip ? (
                      <><Loader2 size={13} className="animate-spin" /> {lang === 'vi' ? 'Đang lưu...' : 'Saving...'}</>
                    ) : savedTripId ? (
                      <><Check size={13} strokeWidth={2.5} /> {lang === 'vi' ? 'Đã lưu' : 'Saved'}</>
                    ) : (
                      <><Bookmark size={13} /> {lang === 'vi' ? 'Lưu hành trình' : 'Save Trip'}</>
                    )}
                  </RippleButton>
                </div>
              </div>

              {/* Day Selection Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 border-b border-[var(--border-normal)] scrollbar-thin">
                {itinerary.days.map((d: any) => {
                  const dayNum = d.dayIndex || d.day;
                  const isActive = selectedDay === dayNum;
                  return (
                    <button
                      key={dayNum}
                      onClick={() => setSelectedDay(dayNum)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 border cursor-pointer active:scale-95 flex flex-col items-center gap-0.5 ${
                        isActive
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-[var(--bg-elevated)] border border-blue-200 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-500'
                      }`}
                    >
                      <span>{lang === 'vi' ? `Ngày ${dayNum}` : `Day ${dayNum}`}</span>
                      <span className={`text-[9px] font-normal ${isActive ? 'text-blue-200' : 'text-[var(--text-muted)]'}`}>
                        {formatCost(d.dailyEstimatedCost || 0)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile View Screen Tab Toggle */}
              <div className="flex lg:hidden items-center justify-center rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-1">
                <button 
                  type="button"
                  onClick={() => setActiveTab('list')} 
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all border-none cursor-pointer ${activeTab === 'list' ? 'bg-blue-500 text-white' : 'text-slate-400 bg-transparent'}`}
                >
                  {t('planner.tabList')}
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveTab('map')} 
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all border-none cursor-pointer ${activeTab === 'map' ? 'bg-blue-500 text-white' : 'text-slate-400 bg-transparent'}`}
                >
                  {t('planner.tabMap')}
                </button>
              </div>

              {/* Main Split Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left side: Timeline list of activities */}
                <div className={`lg:col-span-6 space-y-5 ${activeTab === 'list' ? 'block' : 'hidden lg:block'}`}>
                  {(() => {
                    const currentDay = itinerary.days.find((d: any) => (d.dayIndex || d.day) === selectedDay);
                    if (!currentDay) return null;
                    const sessions = ['Sáng', 'Trưa', 'Chiều', 'Tối'] as const;

                    return (
                      <div className="space-y-6">
                        {/* Day Title and Quick Actions */}
                        <div className="flex justify-between items-center bg-[var(--bg-elevated)] p-4 rounded-2xl border border-[var(--border-normal)] gap-4 flex-wrap">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-500 uppercase tracking-wider">{lang === 'vi' ? 'Ngày' : 'Day'} {currentDay.dayIndex || currentDay.day}</span>
                            <h3 className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[200px]">{currentDay.dateIndex || currentDay.title}</h3>
                          </div>
                          
                          <div className="flex gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleRegeneratePart(currentDay.dayIndex || currentDay.day)}
                              disabled={loadingPart !== null || loading}
                              className="px-3 py-2 text-[10px] font-bold rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              {loadingPart === `day-${currentDay.dayIndex || currentDay.day}` ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : (
                                '🔄 ' + t('planner.regenerateDay')
                              )}
                            </button>
                            
                            {getGoogleMapsDirectionsUrl(currentDay.activities) && (
                              <a
                                href={getGoogleMapsDirectionsUrl(currentDay.activities)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 text-[10px] font-bold rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all flex items-center gap-1 shadow-sm"
                              >
                                <Compass size={11} className="text-blue-500" />
                                <span>{t('planner.dayRouteGoogleMaps')}</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Daily Cost Breakdown Card */}
                        <div className="bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[var(--text-primary)]">{t('planner.dailyCost')}:</span>
                            <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">{formatCost(currentDay.dailyEstimatedCost || 0)}</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-[10px] text-[var(--text-muted)]">
                            <div>
                              <span className="font-semibold text-[var(--text-secondary)]">{lang === 'vi' ? 'Hoạt động: ' : 'Activities: '}</span>
                              <span className="font-bold text-[var(--text-primary)]">{formatCost(currentDay.activityCost || 0)}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-[var(--text-secondary)]">{lang === 'vi' ? 'Di chuyển: ' : 'Transport: '}</span>
                              <span className="font-bold text-[var(--text-primary)]">
                                {formatCost(currentDay.transportCost || 0)}
                                {currentDay.totalDistanceKm !== undefined && ` (${currentDay.totalDistanceKm} km)`}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-[var(--text-secondary)]">{lang === 'vi' ? 'Dự phòng: ' : 'Buffer: '}</span>
                              <span className="font-bold text-[var(--text-primary)]">{formatCost(currentDay.bufferCost || 0)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Timeline Tree - Render tất cả hoạt động theo thứ tự tuần tự */}
                        <div className="relative border-l-2 border-dashed border-[var(--border-subtle)] ml-4 pl-6 space-y-6">
                          {currentDay.activities.map((act: any, idx: number) => {
                            const ActIcon = getCategoryIcon(act.category);
                            const styles = getCategoryStyles(act.category);
                            
                            const prevAct = idx > 0 ? currentDay.activities[idx - 1] : null;
                            const directionsUrl = prevAct && prevAct.latitude && prevAct.longitude
                              ? `https://www.google.com/maps/dir/?api=1&origin=${prevAct.latitude},${prevAct.longitude}&destination=${act.latitude},${act.longitude}&travelmode=driving`
                              : `https://www.google.com/maps/dir/?api=1&destination=${act.latitude},${act.longitude}&travelmode=driving`;

                            const itemKey = `${currentDay.dayIndex || currentDay.day}-${act.activityName || act.name}-${idx}`;
                            const isExpanded = expandedActivities[itemKey];

                            return (
                              <div key={idx} className="relative group animate-fade-in space-y-2">
                                {/* Card connecting node */}
                                <div className={`absolute -left-[31px] top-4 w-3 h-3 rounded-full ${styles.dot} transition-transform duration-300 group-hover:scale-125`} />
                                
                                <div className={`bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-5 rounded-2xl hover:shadow-md transition-all ${styles.accent} hover:border-blue-500/30 shadow-sm space-y-3`}>
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold text-blue-500 bg-blue-500/10 border border-blue-500/20 uppercase tracking-wide">
                                          {act.session || 'Hoạt động'}
                                        </span>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-muted)]">
                                          <Clock size={11} className="text-[var(--text-muted)]" />
                                          <span>{act.timeSlot || act.time || 'Thời gian'}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-extrabold uppercase tracking-wide border ${styles.bg}`}>
                                          {act.category || 'spot'}
                                        </span>
                                      </div>
                                      <h5 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 mt-1.5">
                                        <ActIcon size={14} className={`${styles.iconColor} flex-shrink-0`} />
                                        {act.activityName || act.name}
                                      </h5>
                                      <span className="text-[10px] text-[var(--text-secondary)] block">📍 {act.locationName}</span>
                                    </div>
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex-shrink-0 bg-blue-500/5 px-2.5 py-1 rounded-lg border border-blue-500/10 dark:border-blue-500/20 shadow-sm">
                                      {formatCost(act.estimatedCost || act.cost)}
                                    </span>
                                  </div>
                                  
                                  {/* Description Notes with expand action */}
                                  {(() => {
                                    const noteText = act.notes || act.note || '';
                                    if (!noteText) return null;
                                    return (
                                      <div className="space-y-1.5 pt-1.5 border-t border-[var(--border-subtle)]/40">
                                        <p className={`text-[11px] text-[var(--text-secondary)] leading-relaxed transition-all ${isExpanded ? '' : 'line-clamp-2'}`}>
                                          {noteText}
                                        </p>
                                        {noteText.length > 80 && (
                                          <button 
                                            type="button" 
                                            onClick={() => toggleExpandActivity(itemKey)}
                                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 hover:underline bg-transparent border-none p-0 cursor-pointer flex items-center gap-0.5 transition-colors"
                                          >
                                            {isExpanded ? (
                                              <>{lang === 'vi' ? 'Thu gọn' : 'Show less'} <ChevronUp size={10} /></>
                                            ) : (
                                              <>{lang === 'vi' ? 'Xem thêm' : 'Read more'} <ChevronDown size={10} /></>
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })()}
                                  
                                  {/* Action Links */}
                                  <div className="flex gap-2 flex-wrap pt-2 border-t border-[var(--border-subtle)]/40 mt-1">
                                    <a
                                      href={(() => {
                                        const title = act.activityName || act.name || '';
                                        const address = act.address || act.locationName || '';
                                        const lat = act.latitude;
                                        const lng = act.longitude;
                                        if (address) {
                                          return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title + ' ' + address)}`;
                                        }
                                        if (lat && lng) {
                                          return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title + ' ' + lat + ',' + lng)}`;
                                        }
                                        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title)}`;
                                      })()}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 transition-all shadow-sm"
                                    >
                                      <Compass size={10} /> {t('planner.openInGoogleMaps')} <ExternalLink size={8} />
                                    </a>
                                    <a
                                      href={directionsUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 transition-all shadow-sm"
                                    >
                                      <Navigation size={10} /> {t('planner.directionsFromPrev')}
                                    </a>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Right side: Map View + AI History sticky */}
                <div className={`lg:col-span-6 ${activeTab === 'map' ? 'block' : 'hidden lg:block'} lg:sticky lg:top-24 space-y-4`}>
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                    {/* Map container */}
                    <div className="xl:col-span-7 space-y-4">
                      {(() => {
                        const currentDay = itinerary.days.find((d: any) => (d.dayIndex || d.day) === selectedDay);
                        if (!currentDay) return null;

                        const mapLocations: MapLocation[] = currentDay.activities
                          .filter((act: any) => act.latitude && act.longitude)
                          .map((act: any, idx: number) => ({
                            id: `act-${idx}`,
                            name: act.activityName || act.name,
                            lat: act.latitude,
                            lng: act.longitude,
                            category: act.category,
                            note: act.notes || act.note,
                          }));

                        const mapCenter: [number, number] = mapLocations.length > 0 
                          ? [mapLocations[0].lat, mapLocations[0].lng] 
                          : [21.028511, 105.804817];

                        return (
                          <>
                            <div className="bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-4 rounded-xl flex items-center justify-between text-xs font-bold text-[var(--text-primary)] shadow-sm">
                              <span>📍 {lang === 'vi' ? `Bản đồ lộ trình Ngày ${selectedDay}` : `Itinerary Map Day ${selectedDay}`}</span>
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-500/5 border border-blue-500/15 dark:border-blue-500/30 px-2 py-0.5 rounded-md">{mapLocations.length} {lang === 'vi' ? 'Điểm dừng' : 'Stops'}</span>
                            </div>
                            <div className="h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-2xl border border-[var(--border-normal)]/40 relative">
                              <MapLibreMap
                                center={mapCenter}
                                zoom={12}
                                locations={mapLocations}
                                viewMode="markers"
                                routePoints={mapLocations}
                              />
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* AI History container */}
                    <div className="xl:col-span-5">
                      {renderHistoryList()}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left side: Parallax Hero 3D */}
              <div className="lg:col-span-8 overflow-hidden rounded-2xl relative h-[500px] w-full shadow-xl border border-[var(--border-normal)]/40">
                <ParallaxHero title="TERRAHOLIC" className="h-full w-full rounded-2xl" />
              </div>

              {/* Right side: AI History container */}
              <div className="lg:col-span-4 h-full">
                {renderHistoryList()}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default TripPlanner;
