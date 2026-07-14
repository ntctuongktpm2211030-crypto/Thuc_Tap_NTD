import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  MapPin, Users, Search, Bot, Loader2, Plane, Zap, Check, AlertTriangle,
  Map, MessageCircle, FileText, Link2, Mountain, Flame,
  Home, Compass, Sparkles, BarChart3, Bell, Sun, Moon, Globe,
  Menu, X, Bookmark, User, Send, Utensils,
  Calendar, DollarSign, Hash, ChevronDown, ChevronUp, Clock, ExternalLink,
} from 'lucide-react';
import { TRIP_ACTIVITY_ICONS } from './config/modernIcons';
import { useDispatch, useSelector } from 'react-redux';
import MapLibreMap, { MapLocation } from './components/Map/MapLibreMap';
import { logout } from './store/authSlice';
import { tripsService, socialService, mapService, Waypoint } from './services/smartTravel.service';
import type { RootState, AppDispatch } from './store';
import { useTheme } from './contexts/ThemeContext';
import { useLang } from './contexts/LanguageContext';
import AuthPage from './features/auth/AuthPage';
import logoImg from './assets/logo.png';
import { io } from 'socket.io-client';

// ─── Page imports ──────────────────────────────────────────
import SocialFeedPage from './features/feed/SocialFeedPage';
import BlogPage from './features/blog/BlogPage';
import ExploreArticlePage from './features/blog/ExploreArticlePage';
import ExploreHandbookPage from './features/blog/ExploreHandbookPage';
import EditPostPage from './features/posts/EditPostPage';
import CreateStoryPage from './features/stories/CreateStoryPage';
import CultureFoodGuidePage from './features/guide/CultureFoodGuidePage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UserMenuDropdown from './components/layout/UserMenuDropdown';
import ProfilePage from './features/profile/ProfilePage';
import FollowingPage from './features/profile/FollowingPage';
import SavedPage from './features/profile/SavedPage';
import SettingsPage from './features/profile/SettingsPage';
import NotificationsPage from './features/profile/NotificationsPage';
import ChatbotPage from './features/chatbot/ChatbotPage';


// MOCK DATA REMOVED (Replaced by Backend API service calls)

// ──────────────────────────────────────────────────────────
// 1. SOCIAL MAP DASHBOARD
// ──────────────────────────────────────────────────────────
const MapDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);
  const { t } = useLang();
  const vi = t('nav.feed') === 'Bảng tin';

  // Core map states
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [routeQueue, setRouteQueue] = useState<MapLocation[]>([]);
  const [viewMode, setViewMode] = useState<'markers' | 'cluster' | 'heatmap'>('markers');
  const [selectedCenter, setSelectedCenter] = useState<[number, number]>([21.028511, 105.804817]);
  const [cachingProgress, setCachingProgress] = useState<number | null>(null);

  // Checkin states
  const [selectedDestId, setSelectedDestId] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isExtractingGps, setIsExtractingGps] = useState(false);

  // Advanced search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRating, setFilterRating] = useState(0);

  // AI recommendations states
  const [aiRecs, setAiRecs] = useState<any[]>([]);
  const [loadingAiRecs, setLoadingAiRecs] = useState(false);

  // AI assistant states
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [aiAssistantAnswer, setAiAssistantAnswer] = useState<string>('');
  const [loadingAiAssistant, setLoadingAiAssistant] = useState(false);

  // WebSocket Live Friends locations
  const [liveFriends, setLiveFriends] = useState<Record<string, any>>({});

  // Browser real GPS location state
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const loadMapData = async () => {
    try {
      const [recent, dests] = await Promise.all([
        mapService.recentCheckins(30),
        mapService.destinations()
      ]);
      if (Array.isArray(recent)) setCheckins(recent);
      if (Array.isArray(dests)) setDestinations(dests);
    } catch (err) {
      console.error('Failed to load map data:', err);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  // Request actual browser geolocation on mount & track moves
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setSelectedCenter([latitude, longitude]);
        console.log(`🎯 Real User Location acquired: [${latitude}, ${longitude}]`);
      },
      (error) => {
        console.warn('⚠️ Real User Location denied/failed:', error.message);
      },
      { enableHighAccuracy: true }
    );

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
      },
      (error) => {
        console.warn('⚠️ Real User Location watch error:', error.message);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // WebSocket connection & location heartbeat
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socketUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api/v1', '') 
      : 'http://localhost:5000';
      
    const socket = io(socketUrl, {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to Map WebSocket server:', socket.id);
    });

    socket.on('friend_location_updated', (data: any) => {
      setLiveFriends(prev => ({
        ...prev,
        [data.userId]: {
          ...data,
          updatedAt: new Date()
        }
      }));
    });

    const sendLocation = () => {
      socket.emit('ping_location', {
        userId: user.id,
        fullName: user.fullName || user.email,
        avatarUrl: user.avatarUrl,
        lat: userLocation ? userLocation[0] : selectedCenter[0],
        lng: userLocation ? userLocation[1] : selectedCenter[1]
      });
    };
    sendLocation();

    const interval = setInterval(sendLocation, 10000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [isAuthenticated, user, selectedCenter[0], selectedCenter[1], userLocation]);

  // Filter and merge locations
  useEffect(() => {
    const filtered = destinations.filter(d => {
      const matchesCategory = !filterCategory || d.category === filterCategory;
      const matchesRating = !filterRating || d.averageRating >= filterRating;
      const matchesQuery = !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesRating && matchesQuery;
    });

    const mappedDests: MapLocation[] = filtered.map(d => ({
      id: d.id,
      name: d.name,
      lat: d.latitude,
      lng: d.longitude,
      category: d.category
    }));

    const mappedCheckins: MapLocation[] = checkins.map(c => ({
      id: `checkin-${c.id}`,
      name: c.destination?.name || 'Vị trí check-in',
      lat: c.destination?.latitude || 21.0285,
      lng: c.destination?.longitude || 105.8048,
      note: c.note || '',
      user: c.user?.profile?.fullName || c.user?.email || 'Người dùng',
      avatar: c.user?.profile?.avatarUrl || '',
      time: new Date(c.createdAt).toLocaleTimeString(vi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    }));

    const mappedFriends: MapLocation[] = Object.values(liveFriends).map(f => ({
      id: `live-${f.userId}`,
      name: `Vị trí trực tiếp của ${f.fullName}`,
      lat: f.lat,
      lng: f.lng,
      user: f.fullName,
      avatar: f.avatarUrl,
      category: 'LIVE_FRIEND',
      time: new Date(f.updatedAt).toLocaleTimeString(vi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    }));

    // If real geolocation is active, add current user pulsing dot
    if (userLocation && user) {
      mappedFriends.push({
        id: `live-current-user-${user.id}`,
        name: vi ? 'Vị trí của bạn (Thực tế)' : 'Your Location (Actual GPS)',
        lat: userLocation[0],
        lng: userLocation[1],
        user: user.fullName || user.email,
        avatar: user.avatarUrl,
        category: 'CURRENT_USER',
        time: vi ? 'Trực tiếp' : 'Live'
      });
    }

    setLocations([...mappedDests, ...mappedCheckins, ...mappedFriends]);
  }, [destinations, checkins, liveFriends, filterCategory, filterRating, searchQuery, userLocation, user]);

  const parseEXIFGPS = (file: File): Promise<[number, number] | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const view = new DataView(buffer);
          if (view.getUint16(0) !== 0xFFD8) return resolve(null);
          let offset = 2;
          const length = view.byteLength;
          while (offset < length) {
            if (view.getUint16(offset) === 0xFFE1) {
              const exifOffset = offset + 4;
              if (view.getUint32(exifOffset) === 0x45786966) {
                const tiffOffset = exifOffset + 6;
                const bigEndian = view.getUint16(tiffOffset) === 0x4D4D;
                const read16 = (off: number) => bigEndian ? view.getUint16(off) : view.getUint16(off, true);
                const read32 = (off: number) => bigEndian ? view.getUint32(off) : view.getUint32(off, true);
                
                let ifdOffset = tiffOffset + read32(tiffOffset + 4);
                const numEntries = read16(ifdOffset);
                let gpsIFDOffset = 0;
                for (let i = 0; i < numEntries; i++) {
                  const entryOffset = ifdOffset + 2 + i * 12;
                  const tag = read16(entryOffset);
                  if (tag === 0x8825) {
                    gpsIFDOffset = tiffOffset + read32(entryOffset + 8);
                    break;
                  }
                }
                if (gpsIFDOffset) {
                  const numGpsEntries = read16(gpsIFDOffset);
                  let latParts: number[] = [];
                  let lngParts: number[] = [];
                  let latRef = 'N';
                  let lngRef = 'E';
                  const readRational = (off: number) => {
                    const num = read32(off);
                    const den = read32(off + 4);
                    return den ? num / den : num;
                  };
                  for (let i = 0; i < numGpsEntries; i++) {
                    const entryOffset = gpsIFDOffset + 2 + i * 12;
                    const tag = read16(entryOffset);
                    const valOffset = tiffOffset + read32(entryOffset + 8);
                    if (tag === 1) {
                      latRef = String.fromCharCode(view.getUint8(entryOffset + 8));
                    } else if (tag === 2) {
                      for (let j = 0; j < 3; j++) latParts.push(readRational(valOffset + j * 8));
                    } else if (tag === 3) {
                      lngRef = String.fromCharCode(view.getUint8(entryOffset + 8));
                    } else if (tag === 4) {
                      for (let j = 0; j < 3; j++) lngParts.push(readRational(valOffset + j * 8));
                    }
                  }
                  if (latParts.length === 3 && lngParts.length === 3) {
                    let lat = latParts[0] + latParts[1] / 60 + latParts[2] / 3600;
                    let lng = lngParts[0] + lngParts[1] / 60 + lngParts[2] / 3600;
                    if (latRef === 'S') lat = -lat;
                    if (lngRef === 'W') lng = -lng;
                    return resolve([lat, lng]);
                  }
                }
              }
              break;
            }
            offset += 2 + view.getUint16(offset + 2);
          }
        } catch (err) {
          console.error('GPS EXIF Parse fail:', err);
        }
        resolve(null);
      };
      reader.readAsArrayBuffer(file.slice(0, 128 * 1024));
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingGps(true);
    const coords = await parseEXIFGPS(file);
    setIsExtractingGps(false);

    if (coords) {
      setSelectedCenter(coords);
      let nearest = destinations[0];
      let minDist = Infinity;
      destinations.forEach(d => {
        const dist = Math.hypot(d.latitude - coords[0], d.longitude - coords[1]);
        if (dist < minDist) {
          minDist = dist;
          nearest = d;
        }
      });
      if (nearest) {
        setSelectedDestId(nearest.id);
        alert(vi 
          ? `Đã tìm thấy GPS trong ảnh: [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}]. Tự chọn địa điểm gần nhất: ${nearest.name}`
          : `GPS found in photo: [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}]. Selected nearest place: ${nearest.name}`
        );
      }
    } else {
      alert(vi 
        ? 'Không tìm thấy tọa độ GPS EXIF trong bức ảnh này.' 
        : 'No GPS EXIF coordinates found in this image.'
      );
    }
  };

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: '/map' } });
      return;
    }
    if (!selectedDestId) {
      alert(vi ? 'Vui lòng chọn địa điểm!' : 'Please select a place!');
      return;
    }

    try {
      const response = await mapService.checkIn(selectedDestId, newNote);
      setCheckins(prev => [response, ...prev]);
      setNewNote('');
      setSelectedDestId('');
      alert(vi ? 'Check-in thành công!' : 'Check-in successful!');
    } catch (err) {
      console.error('Checkin failed:', err);
      alert(vi ? 'Check-in thất bại. Hãy thử lại.' : 'Check-in failed. Please try again.');
    }
  };

  const addPointToRoute = (loc: MapLocation) => {
    if (routeQueue.some(p => p.id === loc.id)) return;
    setRouteQueue([...routeQueue, loc]);
  };

  const removeRoutePoint = (id: string) => {
    setRouteQueue(routeQueue.filter(p => p.id !== id));
  };

  const handleOptimizeTSP = () => {
    if (routeQueue.length <= 2) return;
    const unvisited = [...routeQueue];
    const optimizedList = [unvisited.shift()!];
    while (unvisited.length > 0) {
      const current = optimizedList[optimizedList.length - 1];
      let nextIdx = 0;
      let minDist = Infinity;
      for (let i = 0; i < unvisited.length; i++) {
        const dist = Math.hypot(unvisited[i].lat - current.lat, unvisited[i].lng - current.lng);
        if (dist < minDist) {
          minDist = dist;
          nextIdx = i;
        }
        if (dist < minDist) { minDist = dist; nextIdx = i; }
      }
      optimizedList.push(unvisited.splice(nextIdx, 1)[0]);
    }
    setRouteQueue(optimizedList);
    alert(vi ? 'Đã tối ưu hóa lộ trình di chuyển du lịch!' : 'Travel route has been optimized!');
  };

  const handleCacheTiles = () => {
    setCachingProgress(10);
    const interval = setInterval(() => {
      setCachingProgress(prev => {
        if (prev === null || prev >= 100) { clearInterval(interval); alert(vi ? 'Tải bản đồ ngoại tuyến thành công!' : 'Offline map downloaded successfully!'); return null; }
        return prev + 20;
      });
    }, 200);
  };

  const handleGetAiRecommendations = async () => {
    setLoadingAiRecs(true); setAiRecs([]);
    try {
      const response = await mapService.aiRecommendations({ lat: selectedCenter[0], lng: selectedCenter[1], weather: 'Sunny', temp: 28 });
      if (response && Array.isArray(response.recommendations)) setAiRecs(response.recommendations);
    } catch (err) { console.error('Failed to get AI recommendations:', err); } finally { setLoadingAiRecs(false); }
  };

  const handleAskAiAssistant = async (question: string) => {
    if (!selectedLocation) return;
    setLoadingAiAssistant(true); setAiAssistantAnswer('');
    try {
      const destId = selectedLocation.id.replace('checkin-', '').replace('live-', '');
      const response = await mapService.aiAssistant(destId, question);
      if (response && response.answer) setAiAssistantAnswer(response.answer);
    } catch (err) { console.error('Failed to get AI Assistant answer:', err); setAiAssistantAnswer(vi ? 'Có lỗi xảy ra khi hỏi Trợ lý AI.' : 'Failed to ask AI Assistant.'); } finally { setLoadingAiAssistant(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start p-5 max-w-screen-2xl mx-auto">
      {/* COLUMN 1: Search, Filter, AI Recommendations (Left Column, span 3) */}
      <div className="lg:col-span-3 flex flex-col gap-5 h-[620px] overflow-y-auto pr-1">
        {/* 1. Search Box with Autocomplete */}
        <div className="surface-elevated p-4 space-y-2 relative rounded-xl border border-[var(--border-subtle)] bg-[#1e293b]/40 backdrop-blur-md">
          <h3 className="font-ui text-xs font-black uppercase tracking-widest text-[var(--gold)] flex items-center gap-1.5">
            <Search size={12} /> {vi ? 'Tìm địa điểm' : 'Search Place'}
          </h3>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={vi ? 'Nhập tên địa điểm...' : 'Search place...'}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 pl-8 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold)]"
            />
            <Search size={12} className="absolute left-2.5 top-3 text-[var(--text-muted)]" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-xs text-[var(--text-muted)] hover:text-white border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
          {searchQuery && destinations.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
            <div className="absolute left-0 right-0 top-full bg-slate-900 border border-slate-800 rounded-lg mt-1 max-h-40 overflow-y-auto z-30 shadow-2xl p-1">
              {destinations
                .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .slice(0, 5)
                .map(d => (
                  <div
                    key={d.id}
                    onClick={() => {
                      setSelectedCenter([d.latitude, d.longitude]);
                      setSelectedLocation({ id: d.id, name: d.name, lat: d.latitude, lng: d.longitude, category: d.category });
                      setSearchQuery('');
                    }}
                    className="px-3 py-1.5 hover:bg-slate-800 text-[10px] text-white rounded cursor-pointer truncate"
                  >
                    📍 {d.name} <span className="text-[8px] text-slate-400">({d.category})</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* 2. Filters */}
        <div className="surface-elevated p-4 space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[#1e293b]/40 backdrop-blur-md">
          <h3 className="font-ui text-xs font-black uppercase tracking-widest text-[var(--gold)] flex items-center gap-1.5">
            🧭 {vi ? 'Bộ lọc nâng cao' : 'Filters'}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
            >
              <option value="">{vi ? 'Tất cả' : 'All Categories'}</option>
              <option value="attraction">{vi ? 'Tham quan' : 'Attraction'}</option>
              <option value="restaurant">{vi ? 'Nhà hàng' : 'Restaurant'}</option>
              <option value="hotel">{vi ? 'Khách sạn' : 'Hotel'}</option>
              <option value="cafe">{vi ? 'Cà phê' : 'Cafe'}</option>
            </select>
            <select
              value={filterRating}
              onChange={e => setFilterRating(Number(e.target.value))}
              className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
            >
              <option value="0">{vi ? 'Đánh giá' : 'Rating'}</option>
              <option value="4">★ 4.0+</option>
              <option value="4.5">★ 4.5+</option>
            </select>
          </div>
        </div>

        {/* 3. AI Recommendations Layer */}
        <div className="surface-elevated p-4 space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[#1e293b]/40 backdrop-blur-md">
          <div className="flex justify-between items-center">
            <h3 className="font-ui text-xs font-black uppercase tracking-widest text-[var(--gold)] flex items-center gap-1.5">
              <Sparkles size={12} className="text-emerald-400" /> {vi ? 'Đề xuất AI lân cận' : 'Nearby AI Suggestions'}
            </h3>
            <button
              onClick={handleGetAiRecommendations}
              disabled={loadingAiRecs}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded text-[8px] font-black uppercase cursor-pointer border-none flex items-center gap-1"
            >
              {loadingAiRecs ? <Loader2 size={8} className="animate-spin" /> : 'Ask'}
            </button>
          </div>
          {aiRecs.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {aiRecs.map(rec => {
                const dest = destinations.find(d => d.id === rec.id);
                return (
                  <div
                    key={rec.id}
                    onClick={() => dest && setSelectedCenter([dest.latitude, dest.longitude])}
                    className="p-2 bg-emerald-950/10 border border-emerald-800/20 rounded-lg hover:bg-emerald-950/20 transition-all cursor-pointer"
                  >
                    <h4 className="text-[10px] font-black text-emerald-400 flex items-center justify-between">
                      {dest ? dest.name : 'Địa điểm'}
                      <span className="text-[8px] bg-emerald-950/50 text-emerald-300 px-1.5 py-0.5 rounded">{rec.tag || 'AI'}</span>
                    </h4>
                    <p className="text-[9px] text-slate-300 mt-1 italic leading-tight">"{rec.reason}"</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[9px] text-[var(--text-muted)] text-center py-2">
              {vi ? 'Bấm nút Ask để nhận các gợi ý AI cá nhân hóa.' : 'Click Ask button to get personalized suggestions.'}
            </p>
          )}
        </div>

        {/* 4. AI Travel Assistant Panel */}
        {selectedLocation && !selectedLocation.id.startsWith('live-') && !selectedLocation.id.startsWith('checkin-') && (
          <div className="surface-elevated p-4 space-y-3 rounded-xl border border-amber-600 bg-amber-950/10">
            <h3 className="font-ui text-xs font-black uppercase tracking-widest text-[var(--gold)] flex items-center justify-between">
              <span className="flex items-center gap-1">🤖 AI Assistant</span>
              <button
                onClick={() => setSelectedLocation(null)}
                className="text-xs text-[var(--text-muted)] hover:text-white border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </h3>
            <p className="text-[10px] font-bold text-white truncate">{selectedLocation.name}</p>
            
            <div className="grid grid-cols-2 gap-1.5">
              {[
                [vi ? 'Nổi bật?' : 'Highlights?'],
                [vi ? 'Món ăn ngon?' : 'Food?'],
                [vi ? 'Mùa nào đẹp?' : 'When?'],
                [vi ? 'Mẹo du lịch?' : 'Tips?']
              ].map(([q]) => (
                <button
                  key={q}
                  disabled={loadingAiAssistant}
                  onClick={() => handleAskAiAssistant(q)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-slate-300 rounded text-[9px] font-semibold text-left truncate border-none cursor-pointer"
                >
                  💬 {q}
                </button>
              ))}
            </div>

            {loadingAiAssistant && (
              <div className="flex items-center gap-1.5 text-[9px] text-slate-400 animate-pulse">
                <Loader2 size={10} className="animate-spin" />
                <span>{vi ? 'AI đang trả lời...' : 'AI thinking...'}</span>
              </div>
            )}

            {aiAssistantAnswer && (
              <p className="text-[9px] text-slate-300 bg-slate-950 border border-slate-900 p-2 rounded-lg italic leading-relaxed">
                {aiAssistantAnswer}
              </p>
            )}
          </div>
        )}
      </div>

      {/* COLUMN 2: Map View & Route Controls (Middle Column, span 6) */}
      <div className="lg:col-span-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-3">
            <h2 className="section-title text-[var(--gold)]">
              {vi ? 'Bản Đồ Tương Tác & GIS Thời Gian Thực' : 'Interactive Map & Real-time GIS'}
            </h2>
            {isAuthenticated && (
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="WebSocket Live Connected" />
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setViewMode('markers')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                viewMode === 'markers' ? 'bg-[var(--gold)] text-black' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              📍 {vi ? 'Ghim' : 'Pins'}
            </button>
            <button
              onClick={() => setViewMode('cluster')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                viewMode === 'cluster' ? 'bg-[var(--gold)] text-black' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              👥 {vi ? 'Nhóm' : 'Clusters'}
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                viewMode === 'heatmap' ? 'bg-[var(--gold)] text-black' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              🔥 {vi ? 'Nhiệt' : 'Heatmap'}
            </button>
          </div>
        </div>

        {/* Route Planner Action Bar */}
        <div className="flex flex-wrap gap-2 items-center bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-3 rounded-xl bg-[#1e293b]/40 backdrop-blur-md">
          <button
            onClick={handleOptimizeTSP}
            disabled={routeQueue.length < 3}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-[10px] font-black uppercase rounded-lg transition-all border-none cursor-pointer flex items-center gap-1"
          >
            ⚡ {vi ? 'Tối ưu tuyến đường (TSP)' : 'Optimize Route (TSP)'}
          </button>
          
          <button
            onClick={handleCacheTiles}
            disabled={cachingProgress !== null}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-850 text-white text-[10px] font-black uppercase rounded-lg transition-all border-none cursor-pointer flex items-center gap-1 ml-auto"
          >
            💾 {vi ? 'Tải bản đồ ngoại tuyến' : 'Cache Offline Map'}
          </button>

          {routeQueue.length > 0 && (
            <button
              onClick={() => setRouteQueue([])}
              className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/50 text-red-400 text-[10px] font-black uppercase rounded-lg transition-all border border-red-800/30 cursor-pointer"
            >
              {vi ? 'Xoá lộ trình' : 'Clear Route'}
            </button>
          )}
        </div>

        {cachingProgress !== null && (
          <div className="w-full bg-[var(--bg-elevated)] rounded-full h-1.5 overflow-hidden">
            <div className="bg-[var(--gold)] h-full transition-all duration-200" style={{ width: `${cachingProgress}%` }} />
          </div>
        )}

        <div className="h-[520px] rounded-2xl overflow-hidden shadow-2xl border border-[var(--border-subtle)]">
          <MapLibreMap
            center={selectedCenter}
            zoom={13}
            locations={locations}
            viewMode={viewMode}
            routePoints={routeQueue}
            onAddPointToRoute={addPointToRoute}
            aiRecommendedIds={aiRecs.map(r => r.id)}
            onSelectLocation={setSelectedLocation}
          />
        </div>
      </div>

      {/* COLUMN 3: Live Friends & Check-Ins (Right Column, span 3) */}
      <div className="lg:col-span-3 flex flex-col gap-5 h-[620px]">
        {/* check-in form */}
        <div className="surface-elevated p-4 space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[#1e293b]/40 backdrop-blur-md">
          <h3 className="font-ui text-xs font-black uppercase tracking-widest text-[var(--gold)] flex items-center gap-1.5">
            📸 {vi ? 'Check-in Địa điểm' : 'Check-In Location'}
          </h3>
          <form onSubmit={handleCheckin} className="space-y-2">
            <select
              value={selectedDestId}
              onChange={e => setSelectedDestId(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
            >
              <option value="">-- {vi ? 'Chọn địa điểm' : 'Select location'} --</option>
              {destinations.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder={vi ? 'Bạn đang nghĩ gì về nơi này?...' : 'What do you think about this place?...'}
              rows={2}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
            />

            <div className="flex gap-2 items-center justify-between">
              <label className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-bold cursor-pointer transition-all border border-slate-700">
                📷 {isExtractingGps ? 'GPS...' : (vi ? 'Trích GPS Ảnh' : 'Extract GPS')}
                <input
                  type="file"
                  accept="image/jpeg"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-[var(--gold)] text-black text-[9px] font-black uppercase rounded-lg hover:bg-amber-400 cursor-pointer border-none transition-all"
              >
                {vi ? 'Đăng Check-In' : 'Post Check-In'}
              </button>
            </div>
          </form>
        </div>

        {/* list of check-ins */}
        <div className="surface-elevated p-4 flex flex-col flex-1 rounded-xl border border-[var(--border-subtle)] bg-[#1e293b]/40 backdrop-blur-md overflow-hidden">
          <h3 className="sidebar-title mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Users size={12} className="text-[var(--gold)]" /> Community Check-Ins</span>
            <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-black">{checkins.length}</span>
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {checkins.length === 0 ? (
              <p className="text-center text-[10px] text-[var(--text-muted)] py-16">
                {vi ? 'Chưa có check-in nào.' : 'No check-ins yet.'}
              </p>
            ) : (
              checkins.map(chk => {
                const lat = chk.destination?.latitude || 21.0285;
                const lng = chk.destination?.longitude || 105.8048;
                return (
                  <div
                    key={chk.id}
                    onClick={() => setSelectedCenter([lat, lng])}
                    className="p-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-[var(--border-subtle)] rounded-xl transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center gap-1.5">
                      <img
                        src={chk.user?.profile?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                        alt={chk.user?.profile?.fullName || 'User'}
                        className="w-6 h-6 rounded-full object-cover border border-[var(--border-normal)]"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[10px] font-bold text-[var(--text-primary)] group-hover:text-gold transition-colors truncate">
                          {chk.user?.profile?.fullName || chk.user?.email || 'User'}
                        </h4>
                        <p className="text-[8px] text-[var(--text-muted)] leading-none mt-0.5">
                          {new Date(chk.createdAt).toLocaleTimeString(vi ? 'vi-VN' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    {chk.note && (
                      <p className="text-[10px] text-[var(--text-secondary)] italic line-clamp-2 leading-snug">"{chk.note}"</p>
                    )}
                    <div className="text-[9px] text-gold font-semibold flex items-center gap-0.5 truncate">
                      <MapPin size={8} /> {chk.destination?.name || 'Vị trí'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// 2. AI TRIP PLANNER
// ──────────────────────────────────────────────────────────
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
      setItinerary({
        destination, totalEstimatedCost: Number(budget) * 0.75, currency,
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
      });
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
      setItinerary({ ...itinerary, days: optimizedDays });
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
    <div className="p-6 max-w-screen-xl mx-auto space-y-8 animate-fade-in">
      {/* Title & Banner */}
      <div className="relative p-6 md:p-8 rounded-3xl overflow-hidden bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-[var(--border-normal)]/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_45%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.06),transparent_50%)] pointer-events-none" />
        
        <div className="space-y-2 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Sparkles size={11} className="animate-pulse" /> {lang === 'vi' ? 'Công nghệ AI Thế Hệ Mới' : 'Next-Gen AI Technology'}
          </div>
          <h1 className="headline-xl !text-4xl md:!text-5xl bg-clip-text text-transparent bg-gradient-to-r from-white via-cream to-slate-200">{t('planner.heading')}</h1>
          <p className="text-xs text-[var(--text-secondary)] max-w-xl">{t('planner.subtitle')}</p>
        </div>
        
        <div className="flex-shrink-0 flex items-center gap-4 relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot size={24} className="text-white animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-cream">{lang === 'vi' ? 'Trợ lý Lộ trình AI' : 'AI Itinerary Assistant'}</h4>
            <p className="text-[10px] text-[var(--text-muted)]">{lang === 'vi' ? 'Sẵn sàng tư vấn 24/7' : 'Ready to help 24/7'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Form: Itinerary Parameters */}
        <div className="surface-elevated p-6 rounded-2xl border border-[var(--border-normal)]/40 shadow-xl space-y-6 h-fit relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-teal-500 to-indigo-500" />
          
          <h3 className="font-ui text-sm font-bold text-cream flex items-center gap-2 border-b border-[var(--border-subtle)] pb-4">
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
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl pl-11 pr-4 py-3.5 text-xs text-cream placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Days & Budget Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Days Input */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('planner.days')}</label>
                <div className="relative group">
                  <Calendar size={16} className="absolute left-3.5 top-3.5 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="number" 
                    value={days === '' ? '' : days} 
                    onChange={e => { const val = e.target.value; setDays(val === '' ? '' : Number(val)); }} 
                    min={1} 
                    max={15}
                    placeholder="2"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl pl-11 pr-3 py-3.5 text-xs text-cream placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Budget Input */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('planner.budget')}</label>
                <div className="flex rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-primary)] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all shadow-inner relative group">
                  <DollarSign size={16} className="absolute left-3.5 top-3.5 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    value={budget === '' ? '' : budget.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} 
                    placeholder={lang === 'vi' ? 'Ngân sách' : 'Budget'}
                    onChange={e => {
                      const rawVal = e.target.value.replace(/\D/g, '');
                      setBudget(rawVal === '' ? '' : Number(rawVal));
                    }} 
                    className="w-full bg-transparent pl-11 pr-1 py-3.5 text-xs text-cream placeholder-[var(--text-muted)] focus:outline-none min-w-0" 
                  />
                  <select 
                    value={currency} 
                    onChange={e => setCurrency(e.target.value as 'USD' | 'VND')}
                    className="bg-[var(--bg-elevated)] border-l border-[var(--border-subtle)] text-[10px] text-blue-400 font-bold px-2 py-3.5 outline-none cursor-pointer hover:bg-[var(--bg-primary)] transition-all flex-shrink-0"
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
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl pl-11 pr-4 py-3.5 text-xs text-cream focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner appearance-none cursor-pointer"
                >
                  {styleOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <div className="absolute right-3.5 top-4 pointer-events-none text-[var(--text-muted)] border-none bg-transparent">▼</div>
              </div>
            </div>

            {/* Interests tags */}
            <div className="space-y-2.5">
              <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('planner.interests')}</label>
              <div className="flex flex-wrap gap-2">
                {['nature', 'culture', 'food', 'hiking', 'photography', 'history'].map(tag => {
                  const isActive = interests.includes(tag);
                  return (
                    <button 
                      key={tag} 
                      type="button" 
                      onClick={() => toggleInterest(tag)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 active:scale-95 cursor-pointer ${
                        isActive 
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-md shadow-blue-500/5' 
                          : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-normal)] hover:text-[var(--text-secondary)]'
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
              className="btn-gold w-full py-4 text-xs font-bold rounded-xl disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/25 active:scale-[0.98] transition-all cursor-pointer"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> {t('planner.generating')}</>
              ) : (
                <><Bot size={14} /> {t('planner.generate')}</>
              )}
            </button>

          </div>
        </div>

        {/* Right Panel: Results / Itinerary View */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Error Message */}
          {aiError && (
            <div className="surface-elevated px-4 py-3 rounded-xl border-l-4 border-amber-500 text-xs text-amber-400 flex items-center gap-2 shadow-md animate-shake">
              <AlertTriangle size={15} /> {aiError}
            </div>
          )}

          {/* Loading State Skeleton */}
          {loading && !itinerary ? (
            <div className="surface-elevated p-8 md:p-12 rounded-2xl border border-[var(--border-normal)]/40 shadow-2xl text-center space-y-8 relative overflow-hidden animate-fade-in">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_45%)] pointer-events-none" />
              
              <div className="relative">
                <div className="w-20 h-20 mx-auto rounded-full bg-blue-500/10 border-2 border-dashed border-blue-500 flex items-center justify-center animate-spin duration-8000">
                  <Bot size={36} className="text-blue-400 animate-pulse" />
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
              <div className="surface-elevated p-6 rounded-2xl border border-[var(--border-normal)]/40 shadow-xl flex flex-col sm:flex-row justify-between sm:items-center gap-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{t('planner.cost')}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-blue-400">{formatCost(itinerary.totalEstimatedCost || itinerary.totalCost || 0)}</span>
                    <span className="text-[11px] text-[var(--text-muted)]">({itinerary.currency || currency} ±10%)</span>
                  </div>
                  {/* Budget comparison check */}
                  {budget && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>
                        {lang === 'vi' ? 'Ngân sách đề xuất: ' : 'Target Budget: '} 
                        <strong className="text-cream">{formatCost(budget)}</strong>
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={runRouteOptimization}
                    disabled={loading}
                    className={`px-5 py-3 text-xs font-bold rounded-xl border active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 ${
                      optimized 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/5' 
                        : 'btn-gold border-transparent shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20'
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
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/15'
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
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 border-b border-[var(--border-subtle)]/60 scrollbar-thin">
                {itinerary.days.map((d: any) => {
                  const dayNum = d.dayIndex || d.day;
                  const isActive = selectedDay === dayNum;
                  return (
                    <button
                      key={dayNum}
                      onClick={() => setSelectedDay(dayNum)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 border cursor-pointer active:scale-95 ${
                        isActive
                          ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/20'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-normal)]'
                      }`}
                    >
                      {lang === 'vi' ? `Ngày ${dayNum}` : `Day ${dayNum}`}
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
                        <div className="flex justify-between items-center bg-[var(--bg-elevated)] p-4 rounded-2xl border border-[var(--border-subtle)] gap-4 flex-wrap">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-wider">{lang === 'vi' ? 'Ngày' : 'Day'} {currentDay.dayIndex || currentDay.day}</span>
                            <h3 className="text-xs font-bold text-cream truncate max-w-[200px]">{currentDay.dateIndex || currentDay.title}</h3>
                          </div>
                          
                          <div className="flex gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleRegeneratePart(currentDay.dayIndex || currentDay.day)}
                              disabled={loadingPart !== null || loading}
                              className="px-3 py-2 text-[10px] font-bold rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
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
                                className="px-3 py-2 text-[10px] font-bold rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1 shadow-inner"
                              >
                                🗺️ {t('planner.dayRouteGoogleMaps')}
                              </a>
                            )}
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
                                        
                                        <div className={`card-editorial p-5 space-y-3 hover:shadow-lg transition-all ${styles.accent} bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-primary)]/80 border border-[var(--border-normal)]/40 hover:border-blue-500/30`}>
                                          <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-2">
                                                <Clock size={11} className="text-[var(--text-muted)]" />
                                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">{act.timeSlot || act.time}</span>
                                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-extrabold uppercase tracking-wide border ${styles.bg}`}>
                                                  {act.category || 'spot'}
                                                </span>
                                              </div>
                                              <h5 className="text-xs font-bold text-cream flex items-center gap-1.5 mt-1">
                                                <ActIcon size={14} className={`${styles.iconColor} flex-shrink-0`} />
                                                {act.activityName || act.name}
                                              </h5>
                                              <span className="text-[10px] text-[var(--text-secondary)] block">📍 {act.locationName}</span>
                                            </div>
                                            <span className="text-xs font-bold text-blue-400 flex-shrink-0 bg-blue-500/5 px-2.5 py-1 rounded-lg border border-blue-500/10 shadow-sm">{formatCost(act.estimatedCost || act.cost)}</span>
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
                                              className="inline-flex items-center gap-1 text-[9px] font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/15 px-3 py-1.5 rounded-lg border border-sky-500/20 transition-all shadow-inner"
                                            >
                                              <Map size={10} /> {t('planner.openInGoogleMaps')} <ExternalLink size={8} />
                                            </a>
                                            <a
                                              href={directionsUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-all shadow-inner"
                                            >
                                              <Send size={10} /> {t('planner.directionsFromPrev')}
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
                        <div className="surface-elevated p-4 rounded-xl border border-[var(--border-subtle)] flex items-center justify-between text-xs font-bold text-cream bg-gradient-to-r from-[var(--bg-elevated)] to-[var(--bg-primary)] shadow-sm">
                          <span>📍 {lang === 'vi' ? `Bản đồ lộ trình Ngày ${selectedDay}` : `Itinerary Map Day ${selectedDay}`}</span>
                          <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 rounded-md">{mapLocations.length} {lang === 'vi' ? 'Điểm dừng' : 'Stops'}</span>
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

// ──────────────────────────────────────────────────────────
// 3. ANALYTICS DASHBOARD
// ──────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/v1/analytics/platform').then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const metrics = [
    { label: 'Platform Users', value: stats?.users ?? '—', icon: Users, color: 'text-emerald-400' },
    { label: 'Trips Created', value: stats?.trips ?? '—', icon: Map, color: 'text-gold' },
    { label: 'GIS Check-ins', value: stats?.checkins ?? '—', icon: MapPin, color: 'text-indigo-400' },
    { label: 'AI Requests', value: stats?.aiRequests ?? '—', icon: Bot, color: 'text-violet-400' },
    { label: 'Blog Posts', value: stats?.posts ?? '—', icon: FileText, color: 'text-amber-400' },
    { label: 'Social Links', value: stats?.socialConnections ?? '—', icon: Link2, color: 'text-pink-400' },
    { label: 'Destinations', value: stats?.destinations ?? '—', icon: Mountain, color: 'text-teal-400' },
    { label: 'Comments', value: stats?.comments ?? '—', icon: MessageCircle, color: 'text-orange-400' },
  ];

  return (
    <div className="p-5 max-w-screen-xl mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold mb-2">Live Database</p>
          <h1 className="headline-xl">Platform Analytics</h1>
          <p className="text-[var(--text-secondary)] mt-1">Real-time metrics from PostgreSQL · Prisma ORM · Socket.io</p>
        </div>
        {stats?.timestamp && <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />Live · {new Date(stats.timestamp).toLocaleTimeString()}</div>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
          const MIcon = m.icon;
          return (
          <div key={i} className="surface-elevated p-5 space-y-2 interactive-hover cursor-default">
            <div className="flex justify-between items-center"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{m.label}</span><MIcon size={22} className={m.color} strokeWidth={1.8} /></div>
            <div className={`text-2xl font-extrabold ${m.color}`}>{typeof m.value === 'number' ? m.value.toLocaleString() : m.value}</div>
          </div>
        );})}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="surface-elevated p-6 space-y-4">
          <h3 className="sidebar-title flex items-center gap-2"><Flame size={14} className="text-amber-400" /> Popular Destinations</h3>
          {[{ name: 'Sapa, Lao Cai', rate: 85 }, { name: 'Hanoi Old Quarter', rate: 72 }, { name: 'Ha Giang Loop', rate: 58 }, { name: 'Da Nang Beach', rate: 43 }, { name: 'Hoi An Ancient Town', rate: 37 }].map((item, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold"><span className="text-[var(--text-secondary)]">{item.name}</span><span className="text-[var(--text-muted)]">{item.rate}%</span></div>
              <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[var(--gold)] to-blue-700 rounded-full transition-all duration-1000" style={{ width: `${item.rate}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="surface-elevated p-6 space-y-4">
          <h3 className="sidebar-title flex items-center gap-2"><Bot size={14} className="text-violet-400" /> AI System Metrics</h3>
          {[['Collaborative Filter Hit-Rate', '92.4%', 'text-emerald-400'], ['Content-Based Cosine Precision', '88.7%', 'text-emerald-400'], ['TSP Route Divergence Penalty', '0.023', 'text-indigo-400'], ['WebSocket Sync Latency', '12ms', 'text-gold'], ['Haversine GIS Query Time', '< 5ms', 'text-teal-400']].map(([label, val, color], i) => (
            <div key={i} className="flex justify-between items-center text-xs border-b border-[var(--border-subtle)] pb-3 last:border-0 last:pb-0">
              <span className="text-[var(--text-secondary)]">{label}</span>
              <span className={`font-bold ${color}`}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// AuthPage is now in ./features/auth/AuthPage.tsx

function App() {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((s: RootState) => s.auth);
  const { toggleTheme, isDark } = useTheme();
  const { lang, setLang, t } = useLang();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = () => {
    if (isAuthenticated && user) {
      socialService.notifications()
        .then(data => {
          if (Array.isArray(data)) setNotifications(data);
        })
        .catch(err => console.error('Fetch notifications failed in App:', err));
    }
  };

  useEffect(() => {
    fetchNotifications();
    if (isAuthenticated && user) {
      const interval = setInterval(fetchNotifications, 20000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, user]);

  // ✅ Lắng nghe sự kiện 'auth:logout' từ axios 401 interceptor
  // → Đồng bộ Redux state khi token hết hạn và refresh thất bại
  useEffect(() => {
    const handleForcedLogout = () => {
      dispatch(logout());
    };
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, [dispatch]);

  // ✅ Khi app khởi động: nếu có user trong Redux (từ localStorage)
  // nhưng không có accessToken → tự động logout để đồng bộ state
  useEffect(() => {
    const hasToken = !!localStorage.getItem('accessToken');
    const hasUser = !!localStorage.getItem('user');
    if (isAuthenticated && !hasToken) {
      // Token bị xóa thủ công hoặc bị lỗi — logout để sạch state
      dispatch(logout());
    }
    if (!isAuthenticated && hasUser && hasToken) {
      // Có localStorage data nhưng Redux chưa load → rehydrate
      // (AuthSlice initialState tự xử lý việc này, fallback an toàn)
    }
  }, []); // chỉ chạy 1 lần khi mount

  const browseNavItems = [
    { to: '/',          label: t('nav.feed'),      Icon: Home },
    { to: '/explore',   label: t('nav.explore'),   Icon: Compass },
    { to: '/guide/culture-food', label: t('nav.cultureGuide'), Icon: Utensils },
    { to: '/map',       label: t('nav.map'),        Icon: Map },
    { to: '/trips',     label: t('nav.aiPlanner'), Icon: Sparkles },
    { to: '/chat',      label: lang === 'vi' ? 'AI Trợ lý' : 'AI Chat', Icon: Bot },
    { to: '/analytics', label: t('nav.analytics'), Icon: BarChart3 },
  ];

  const createNavItems = isAuthenticated
    ? [{ to: '/journeys/create', label: lang === 'vi' ? 'Đăng hành trình' : 'Share Journey', Icon: Send }]
    : [];

  const navItems = [...browseNavItems, ...createNavItems];

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  // Trang auth = fullscreen standalone, không cần navbar/footer
  const isAuthPage = location.pathname === '/auth';
  const isCreateJourneyPage = location.pathname === '/journeys/create';
  const isEditPostPage = /^\/posts\/[^/]+\/edit$/.test(location.pathname);
  const isExploreReader =
    location.pathname.startsWith('/explore/post/') ||
    location.pathname.startsWith('/explore/cam-nang/');
  const isFullscreenCreate = isCreateJourneyPage || isEditPostPage || isExploreReader;
  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">

      {/* ══════════════════════════════════════════════════
          PREMIUM NAVBAR
      ══════════════════════════════════════════════════ */}
      {!isFullscreenCreate && (
      <header className="nav-magazine">

        {/* ── TOP BAR ── */}
        <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-10 h-[64px] md:h-[80px] flex items-center justify-between gap-4">

          {/* Left side: Logo + Slogan */}
          <Link to="/" className="flex items-center gap-3.5 flex-shrink-0 group" onClick={() => setMobileOpen(false)}>
            <div className="w-[160px] h-[160px] md:w-[160px] md:h-[160px] flex items-center justify-center group-hover:scale-105 transition-all">
              <img src={logoImg} alt="Terraholic Logo" className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block border-l border-[var(--border-subtle)] pl-3.5 py-0.5 max-w-[160px] md:max-w-[200px]">
              <div className="text-[9px] md:text-[10px] text-[var(--gold)] font-bold tracking-widest uppercase leading-relaxed">
                Khám phá bằng đam mê, kết nối bằng hành trình.
              </div>
            </div>
          </Link>

          {/* Center: Search Bar */}
          <div className={`w-full max-w-xs lg:max-w-md hidden md:block transition-all duration-200 ${searchFocused ? 'max-w-md lg:max-w-lg' : ''}`}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder={t('nav.search')}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`w-full bg-[var(--bg-elevated)] border rounded-full pl-9 pr-4 py-2 text-xs text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-muted)] transition-all duration-200 ${
                  searchFocused
                    ? 'border-[var(--gold)] shadow-md shadow-[var(--gold-glow)]'
                    : 'border-[var(--border-subtle)] hover:border-[var(--border-normal)]'
                }`}
              />
              {searchFocused && (
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-[var(--text-muted)] bg-[var(--bg-overlay)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">⌘K</kbd>
              )}
            </div>
          </div>

          {/* Right side: Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">

            {/* Language Pill */}
            <div className="hidden sm:flex items-center rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden p-0.5 gap-0.5">
              {(['vi', 'en'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)} title={l === 'vi' ? 'Tiếng Việt' : 'English'}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                    lang === l
                      ? 'bg-[var(--gold)] text-black shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}>
                  <Globe size={10} />
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Theme toggle */}
            <button onClick={toggleTheme}
              title={isDark ? 'Light Mode' : 'Dark Mode'}
              className="icon-btn group relative">
              <div className={`transition-all duration-300 ${isDark ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0 absolute'}`}>
                <Sun size={17} className="text-amber-400 group-hover:text-amber-300" />
              </div>
              <div className={`transition-all duration-300 ${!isDark ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0 absolute'}`}>
                <Moon size={17} className="text-indigo-400 group-hover:text-indigo-300" />
              </div>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="icon-btn relative" aria-label="Notifications">
                <Bell size={17} className="text-[var(--text-secondary)]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-[var(--bg-primary)] animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-3.5 w-80 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-4.5 z-50 transition-all duration-200">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-[var(--border-subtle)]">
                      <h4 className="font-bold text-[10px] text-[var(--text-primary)] uppercase tracking-wider">
                        {lang === 'vi' ? 'Thông báo' : 'Notifications'}
                      </h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={async () => {
                            try {
                              await socialService.markAllRead();
                              setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                            } catch (err) {
                              console.error('Mark all read failed:', err);
                            }
                          }}
                          className="text-[10px] font-black text-[var(--gold)] hover:underline hover:text-[var(--gold-light)]"
                        >
                          {lang === 'vi' ? 'Đọc tất cả' : 'Mark all read'}
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-center text-xs text-[var(--text-muted)] py-6">
                          {lang === 'vi' ? 'Không có thông báo nào.' : 'No notifications.'}
                        </p>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif.id}
                            className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                              notif.isRead ? 'opacity-65' : 'bg-[var(--gold-glow)]/10 border-l-3 border-[var(--gold)]'
                            }`}
                          >
                            <div className="mt-0.5 p-1.5 rounded-lg bg-[var(--bg-elevated)] text-[var(--gold)]">
                              <Bell size={12} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-[var(--text-primary)] font-medium leading-relaxed">{notif.content}</p>
                              <p className="text-[9px] text-[var(--text-muted)] mt-1.5">
                                {new Date(notif.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="mt-3.5 pt-2 border-t border-[var(--border-subtle)] text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setNotifOpen(false)}
                        className="text-xs font-bold text-[var(--gold)] hover:underline hover:text-[var(--gold-light)] block w-full"
                      >
                        {lang === 'vi' ? 'Xem tất cả' : 'View all'}
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User auth area */}
            {isAuthenticated && user ? (
              <UserMenuDropdown onLogout={() => dispatch(logout())} />
            ) : (
              /* ── CHƯA ĐĂNG NHẬP: Đăng nhập + Đăng ký ── */
              <div className="flex items-center gap-2">
                <Link
                  to="/auth"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--border-normal)] text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all"
                >
                  <User size={13} />
                  {t('nav.signIn')}
                </Link>
                <Link
                  to="/auth"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--gold)] to-blue-700 text-xs font-bold text-white hover:shadow-lg hover:shadow-blue-600/25 transition-all hover:scale-105"
                >
                  {t('nav.joinFree')}
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="icon-btn md:hidden">
              {mobileOpen ? <X size={18} className="text-[var(--text-primary)]" /> : <Menu size={18} className="text-[var(--text-secondary)]" />}
            </button>
          </div>
        </div>

        {/* ── CATEGORY NAV BAR ── */}
        <div className="border-t border-[var(--border-subtle)]">
          <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-10 hidden md:flex items-center gap-1 h-[46px] overflow-x-auto">
            {navItems.map(({ to, label, Icon }) => {
              const active = isActive(to);
              return (
                <Link key={to} to={to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 group ${
                    active
                      ? 'bg-[var(--gold-glow)] text-[var(--gold)] border border-[var(--gold)]/30'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                  }`}>
                  <Icon size={15} className={`transition-colors ${active ? 'text-[var(--gold)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'}`} strokeWidth={active ? 2.5 : 1.8} />
                  {label}
                  {active && <span className="ml-0.5 w-1 h-1 rounded-full bg-[var(--gold)]" />}
                </Link>
              );
            })}

            {/* Divider + extras */}
            <div className="w-px h-5 bg-[var(--border-subtle)] mx-2" />
            <Link to="/profile/saved" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]`}>
              <Bookmark size={14} strokeWidth={1.8} /> {lang === 'vi' ? 'Đã lưu' : 'Saved'}
            </Link>
          </div>
        </div>

        {/* ── MOBILE MENU DROPDOWN ── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl">
            <div className="px-4 py-3 space-y-1">
              {navItems.map(({ to, label, Icon }) => {
                const active = isActive(to);
                return (
                  <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                      active
                        ? 'bg-[var(--gold-glow)] text-[var(--gold)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                    }`}>
                    <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                    <span>{label}</span>
                    {active && <span className="ml-auto w-2 h-2 rounded-full bg-[var(--gold)]" />}
                  </Link>
                );
              })}
              {/* Mobile search */}
              <div className="relative pt-2">
                <Search size={15} className="absolute left-3.5 top-[calc(0.5rem+8px)] text-[var(--text-muted)]" />
                <input type="text" placeholder={t('nav.search')}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold)] placeholder:text-[var(--text-muted)]" />
              </div>
              {/* Mobile lang + theme */}
              <div className="flex items-center gap-3 pt-2 pb-1">
                <div className="flex items-center rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden p-0.5 gap-0.5">
                  {(['vi', 'en'] as const).map(l => (
                    <button key={l} onClick={() => setLang(l)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${lang === l ? 'bg-[var(--gold)] text-black' : 'text-[var(--text-muted)]'}`}>
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
                <button onClick={toggleTheme} className="icon-btn">
                  {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-400" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
      )}

      {/* ── Main Content ── */}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<SocialFeedPage />} />
          <Route path="/explore" element={<BlogPage />} />
          <Route path="/explore/post/:id" element={<ExploreArticlePage />} />
          <Route path="/explore/cam-nang/:type" element={<ExploreHandbookPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/posts/:id/edit" element={<ProtectedRoute><EditPostPage /></ProtectedRoute>} />
          <Route path="/map" element={<MapDashboard />} />
          <Route path="/trips" element={<TripPlanner />} />
          <Route path="/chat" element={<ProtectedRoute><ChatbotPage /></ProtectedRoute>} />
          <Route path="/guide/culture-food" element={<CultureFoodGuidePage />} />
          <Route path="/journeys/create" element={<ProtectedRoute><CreateStoryPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/profile/following" element={<ProtectedRoute><FollowingPage /></ProtectedRoute>} />
          <Route path="/profile/saved" element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />
          <Route path="/profile/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<AdminDashboard />} />
          <Route path="/admin" element={<Navigate to="/analytics" replace />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </main>

      {/* ── Footer ── */}
      {!isFullscreenCreate && (
      <footer className="border-t border-[var(--border-subtle)] py-8 bg-[var(--bg-surface)]">
        <div className="max-w-screen-xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src={logoImg} alt="Terraholic Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-editorial text-sm text-[var(--text-secondary)]">{t('footer.thesis')}</span>
          </div>
          <div className="text-[10px] text-[var(--text-muted)] flex gap-4">
            <span>{t('footer.built')}</span>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}

export default App;
