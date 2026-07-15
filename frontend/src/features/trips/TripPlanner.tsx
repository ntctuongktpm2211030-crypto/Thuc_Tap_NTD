import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  MapPin, BrainCircuit, Loader2, Plane, Zap, Check, AlertTriangle,
  Compass, Sparkles, Bookmark, Calendar, DollarSign, Hash, ChevronDown, ChevronUp, Clock, ExternalLink, Navigation
} from 'lucide-react';
import { TRIP_ACTIVITY_ICONS } from '../../config/modernIcons';
import { tripsService, Waypoint } from '../../services/smartTravel.service';
import type { RootState } from '../../store';
import { useLang } from '../../contexts/LanguageContext';
import MapLibreMap, { MapLocation } from '../../components/Map/MapLibreMap';

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
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState<number | ''>('');
  const [budget, setBudget] = useState<number | ''>('');
  const [currency, setCurrency] = useState<'USD' | 'VND'>('VND');
  const [style, setStyle] = useState('Adventure');
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<any>(null);
  const [optimized, setOptimized] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // New state variables
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');
  const [loadingPart, setLoadingPart] = useState<string | null>(null);

  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);
  const [savingTrip, setSavingTrip] = useState(false);
  const [savedTripId, setSavedTripId] = useState<string | null>(null);
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({});

  const toggleExpandActivity = (key: string) => {
    setExpandedActivities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveTrip = async () => {
    if (!itinerary) return;
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    setSavingTrip(true);
    try {
      const trip = await tripsService.create({
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
        alert(lang === 'vi' ? 'Đã lưu hành trình thành công!' : 'Itinerary saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save trip:', err);
      alert(lang === 'vi' ? 'Lưu hành trình thất bại.' : 'Failed to save itinerary.');
    } finally {
      setSavingTrip(false);
    }
  };

  const toggleInterest = (val: string) =>
    setInterests(p => p.includes(val) ? p.filter(i => i !== val) : [...p, val]);

  const handleGenerate = async () => {
    if (!destination || days === '' || budget === '') return;
    setLoading(true); setOptimized(false); setAiError(null); setSelectedDay(1); setSavedTripId(null);
    try {
      const result = await tripsService.aiGenerate({
        destination,
        durationDays: Number(days),
        totalBudget: Number(budget),
        currency,
        interests,
        travelStyle: style
      });
      setItinerary(result);
    } catch {
      const isVi = lang === 'vi';
      setAiError(isVi ? 'Không kết nối được dịch vụ AI — đang hiển thị lịch trình mẫu.' : 'AI endpoint unavailable — showing sample itinerary.');
      const mockResult = {
        destination, currency,
        days: [
          { dayIndex: 1, dateIndex: isVi ? 'Ngày 1: Nhận phòng & Tham quan trung tâm thành phố Thái Nguyên' : 'Day 1: Arrival & Explore Thai Nguyen Center', activities: [
            { session: 'Sáng', timeSlot: '09:00 - 11:00', activityName: isVi ? 'Nhận phòng tại khách sạn trung tâm' : 'Check-in at center hotel', estimatedCost: Number(budget) * 0.15, category: 'hotel', notes: isVi ? 'Ổn định chỗ ở, chuẩn bị hành lý.' : 'Settle in, prepare luggage.', latitude: 21.5939, longitude: 105.8442 },
            { session: 'Sáng', timeSlot: '11:00 - 12:00', activityName: isVi ? 'Tham quan Bảo tàng Văn hóa các Dân tộc Việt Nam' : 'Museum of Cultures of Vietnam Ethnic Groups', estimatedCost: isVi ? 30000 : 2, category: 'attraction', notes: isVi ? 'Tìm hiểu văn hóa của 54 dân tộc Việt Nam. Đây là điểm tham quan nổi bật nhất của thành phố.' : 'Learn about the cultures of 54 ethnic groups.', latitude: 21.5959, longitude: 105.8431 },
            { session: 'Trưa', timeSlot: '12:00 - 13:30', activityName: isVi ? 'Thưởng thức ẩm thực đặc sản Thái Nguyên' : 'Thai Nguyen Specialty Lunch', estimatedCost: Number(budget) * 0.20, category: 'restaurant', notes: isVi ? 'Thưởng thức bánh chưng Bờ Đậu, gà đồi, cá sông nướng.' : 'Enjoy Bo Dau banh chung, hill chicken, grilled river fish.', latitude: 21.5925, longitude: 105.8420 },
            { session: 'Chiều', timeSlot: '15:00 - 17:00', activityName: isVi ? 'Tham quan Chùa Hang Thái Nguyên' : 'Hang Pagoda Visit', estimatedCost: 0, category: 'attraction', notes: isVi ? 'Ghé thăm ngôi chùa cổ độc đáo trong hang đá.' : 'Visit the historic cave pagoda.', latitude: 21.6186, longitude: 105.8569 },
            { session: 'Chiều', timeSlot: '17:00 - 18:00', activityName: isVi ? 'Thưởng thức trà Tân Cương' : 'Taste Tan Cuong Tea', estimatedCost: isVi ? 50000 : 3, category: 'restaurant', notes: isVi ? 'Thưởng thức những tách trà Tân Cương trứ danh tại quán trà địa phương.' : 'Enjoy famous Tan Cuong tea.', latitude: 21.5794, longitude: 105.7483 },
            { session: 'Tối', timeSlot: '19:00 - 21:30', activityName: isVi ? 'Dạo quảng trường trung tâm và uống chè' : 'Walk Center Square & Drink Tea', estimatedCost: Number(budget) * 0.1, category: 'restaurant', notes: isVi ? 'Đi dạo quảng trường lớn và thưởng thức chè và ăn vặt.' : 'Walk the square, enjoy tea and snacks.', latitude: 21.5975, longitude: 105.8445 },
          ]},
          { dayIndex: 2, dateIndex: isVi ? 'Ngày 2: Hồ Núi Cốc – Đồi chè Tân Cương' : 'Day 2: Nui Coc Lake & Tan Cuong Tea Hill', activities: [
            { session: 'Sáng', timeSlot: '08:00 - 11:30', activityName: isVi ? 'Khám phá Hồ Núi Cốc' : 'Explore Nui Coc Lake', estimatedCost: isVi ? 150000 : 7, category: 'nature', notes: isVi ? 'Đi thuyền trên hồ, tham quan đảo, cầu tình yêu, công viên giải trí và đền chùa.' : 'Take a boat, visit islands, love bridge and temples.', latitude: 21.5714, longitude: 105.7083 },
            { session: 'Trưa', timeSlot: '12:00 - 13:30', activityName: isVi ? 'Ăn trưa đặc sản hồ' : 'Lake Specialties Lunch', estimatedCost: Number(budget) * 0.2, category: 'restaurant', notes: isVi ? 'Ăn cá hồ, gà nướng và rau rừng.' : 'Eat lake fish, grilled chicken, forest vegetables.', latitude: 21.5735, longitude: 105.7065 },
            { session: 'Chiều', timeSlot: '15:00 - 18:00', activityName: isVi ? 'Trải nghiệm vùng chè Tân Cương' : 'Tan Cuong Tea Hill Experience', estimatedCost: isVi ? 100000 : 5, category: 'attraction', notes: isVi ? 'Tham quan đồi chè, hái chè cùng người dân và tìm hiểu quy trình chế biến, uống trà mới pha.' : 'Visit tea hills, pick tea leaves, learn process and buy tea.', latitude: 21.5794, longitude: 105.7483 },
            { session: 'Tối', timeSlot: '19:00 - 21:00', activityName: isVi ? 'Ăn lẩu nướng địa phương' : 'Local BBQ/Hotpot Dinner', estimatedCost: Number(budget) * 0.25, category: 'restaurant', notes: isVi ? 'Thưởng thức bữa tối nướng lẩu thịnh soạn.' : 'Enjoy local hotpot dinner.', latitude: 21.5940, longitude: 105.8450 },
          ]},
        ]
      };
      setItinerary(calculateItineraryCosts(mockResult, style, currency));
    } finally { setLoading(false); }
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
      const response = await tripsService.aiRegeneratePart({
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
      alert(lang === 'vi' ? 'Không thể đổi lịch trình. Vui lòng thử lại.' : 'Failed to regenerate part. Please try again.');
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
            const res = await tripsService.optimizeRoute(waypoints);
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
    <div className="container-wide py-4 sm:py-6 space-y-8 animate-fade-in">
      {/* Title & Banner */}
      <div className="relative p-6 md:p-8 rounded-3xl overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border-normal)] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_45%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.06),transparent_50%)] pointer-events-none" />
        
        <div className="space-y-2 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/20 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Sparkles size={11} className="animate-pulse" /> {lang === 'vi' ? 'Công nghệ AI Thế Hệ Mới' : 'Next-Gen AI Technology'}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-white dark:via-cream dark:to-slate-200">{t('planner.heading')}</h1>
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
            <button 
              onClick={handleGenerate} 
              disabled={loading || !destination || days === '' || budget === ''} 
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer border border-transparent disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> {t('planner.generating')}</>
              ) : (
                <><Sparkles size={14} /> {t('planner.generate')}</>
              )}
            </button>

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
                  
                  <button 
                    onClick={handleSaveTrip}
                    disabled={savingTrip || savedTripId !== null}
                    className={`px-5 py-3 text-xs font-bold rounded-xl border active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 ${
                      savedTripId 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white font-bold border-transparent shadow-md'
                    }`}
                  >
                    {savingTrip ? (
                      <><Loader2 size={13} className="animate-spin" /> {lang === 'vi' ? 'Đang lưu...' : 'Saving...'}</>
                    ) : savedTripId ? (
                      <><Check size={13} strokeWidth={2.5} /> {lang === 'vi' ? 'Đã lưu' : 'Saved'}</>
                    ) : (
                      <><Bookmark size={13} /> {lang === 'vi' ? 'Lưu hành trình' : 'Save Trip'}</>
                    )}
                  </button>
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
              <div className="flex md:hidden items-center justify-center rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-1">
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
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Left side: Timeline list of activities */}
                <div className={`md:col-span-7 space-y-5 ${activeTab === 'list' ? 'block' : 'hidden md:block'}`}>
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

                        {/* Timeline Tree */}
                        <div className="relative border-l-2 border-dashed border-[var(--border-subtle)] ml-4 pl-6 space-y-6">
                          {sessions.map(session => {
                            const sessionActs = currentDay.activities.filter((act: any) => act.session === session || (!act.session && session === 'Sáng'));
                            if (sessionActs.length === 0) return null;

                            return (
                              <div key={session} className="space-y-4 relative">
                                {/* Session Floating Timeline Dot Indicator */}
                                <div className="absolute -left-[32px] top-1 w-4 h-4 rounded-full bg-[var(--bg-primary)] border-2 border-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                </div>

                                {/* Session Header */}
                                <div className="flex justify-between items-center">
                                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                                    {session}
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={() => handleRegeneratePart(currentDay.dayIndex || currentDay.day, session)}
                                    disabled={loadingPart !== null || loading}
                                    className="text-[9px] font-bold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer disabled:opacity-50 transition-colors"
                                  >
                                    {loadingPart === `session-${currentDay.dayIndex || currentDay.day}-${session}` ? (
                                      <Loader2 size={10} className="animate-spin" />
                                    ) : (
                                      '🔄 ' + t('planner.regenerateSession')
                                    )}
                                  </button>
                                </div>

                                {/* Activity Cards list */}
                                <div className="space-y-4">
                                  {sessionActs.map((act: any, idx: number) => {
                                    const ActIcon = getCategoryIcon(act.category);
                                    const styles = getCategoryStyles(act.category);
                                    
                                    const currentIdx = currentDay.activities.findIndex((a: any) => a === act);
                                    const prevAct = currentIdx > 0 ? currentDay.activities[currentIdx - 1] : null;
                                    const directionsUrl = prevAct && prevAct.latitude && prevAct.longitude
                                      ? `https://www.google.com/maps/dir/?api=1&origin=${prevAct.latitude},${prevAct.longitude}&destination=${act.latitude},${act.longitude}&travelmode=driving`
                                      : `https://www.google.com/maps/dir/?api=1&destination=${act.latitude},${act.longitude}&travelmode=driving`;

                                    const itemKey = `${currentDay.dayIndex || currentDay.day}-${act.activityName || act.name}-${idx}`;
                                    const isExpanded = expandedActivities[itemKey];

                                    return (
                                      <div key={idx} className="relative group animate-fade-in">
                                        {/* Card connecting node */}
                                        <div className={`absolute -left-[30px] top-5 w-2.5 h-2.5 rounded-full ${styles.dot} transition-transform duration-300 group-hover:scale-125`} />
                                        
                                        <div className={`bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-5 rounded-2xl hover:shadow-md transition-all ${styles.accent} hover:border-blue-500/30 shadow-sm space-y-3`}>
                                          <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-2">
                                                <Clock size={11} className="text-[var(--text-muted)]" />
                                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">{act.timeSlot || act.time}</span>
                                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-extrabold uppercase tracking-wide border ${styles.bg}`}>
                                                  {act.category || 'spot'}
                                                </span>
                                              </div>
                                              <h5 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 mt-1">
                                                <ActIcon size={14} className={`${styles.iconColor} flex-shrink-0`} />
                                                {act.activityName || act.name}
                                              </h5>
                                              <span className="text-[10px] text-[var(--text-secondary)] block">📍 {act.locationName}</span>
                                            </div>
                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex-shrink-0 bg-blue-500/5 px-2.5 py-1 rounded-lg border border-blue-500/10 dark:border-blue-500/20 shadow-sm">{formatCost(act.estimatedCost || act.cost)}</span>
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
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Right side: Map View sticky */}
                <div className={`md:col-span-5 ${activeTab === 'map' ? 'block' : 'hidden md:block'} sticky top-[142px]`}>
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
                      <div className="space-y-4">
                        <div className="bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-4 rounded-xl flex items-center justify-between text-xs font-bold text-[var(--text-primary)] shadow-sm">
                          <span>📍 {lang === 'vi' ? `Bản đồ lộ trình Ngày ${selectedDay}` : `Itinerary Map Day ${selectedDay}`}</span>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-500/5 border border-blue-500/15 dark:border-blue-500/30 px-2 py-0.5 rounded-md">{mapLocations.length} {lang === 'vi' ? 'Điểm dừng' : 'Stops'}</span>
                        </div>
                        <div className="h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-[var(--border-normal)]/40 relative">
                          <MapLibreMap
                            center={mapCenter}
                            zoom={12}
                            locations={mapLocations}
                            viewMode="markers"
                            routePoints={mapLocations}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>

              </div>

            </div>
          ) : (
            <div className="surface-elevated p-16 text-center space-y-6 rounded-2xl border border-[var(--border-normal)]/40 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
              <Plane size={54} className="mx-auto text-blue-500/60 animate-bounce" strokeWidth={1.5} />
              <div className="space-y-2">
                <h3 className="headline-md !text-xl text-cream">{t('planner.noItinerary')}</h3>
                <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">{t('planner.noItinerarySub')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripPlanner;
