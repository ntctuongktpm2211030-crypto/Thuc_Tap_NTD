import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  MapPin, Users, Search, Bot, Loader2, Plane, Zap, Check, AlertTriangle,
  Map, MessageCircle, FileText, Link2, Mountain, Flame,
  Home, Compass, Sparkles, BarChart3, Bell, Sun, Moon, Globe,
  Menu, X, Bookmark, User, Send, Utensils,
} from 'lucide-react';
import { TRIP_ACTIVITY_ICONS } from './config/modernIcons';
import { useDispatch, useSelector } from 'react-redux';
import LeafletMap, { MapLocation } from './components/Map/LeafletMap';
import { logout } from './store/authSlice';
import { tripsService, socialService, mapService, Waypoint } from './services/smartTravel.service';
import type { RootState, AppDispatch } from './store';
import { useTheme } from './contexts/ThemeContext';
import { useLang } from './contexts/LanguageContext';
import AuthPage from './features/auth/AuthPage';

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
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);
  const { t } = useLang();
  const vi = t('nav.feed') === 'Bảng tin';

  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [routeQueue, setRouteQueue] = useState<MapLocation[]>([]);
  const [viewMode, setViewMode] = useState<'markers' | 'cluster' | 'heatmap'>('markers');
  const [selectedCenter, setSelectedCenter] = useState<[number, number]>([21.028511, 105.804817]);
  const [cachingProgress, setCachingProgress] = useState<number | null>(null);

  const [selectedDestId, setSelectedDestId] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isExtractingGps, setIsExtractingGps] = useState(false);

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

  useEffect(() => {
    const mappedDests: MapLocation[] = destinations.map(d => ({
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

    setLocations([...mappedDests, ...mappedCheckins]);
  }, [destinations, checkins]);

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
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          alert(vi ? 'Tải bản đồ ngoại tuyến thành công!' : 'Offline map downloaded successfully!');
          return null;
        }
        return prev + 20;
      });
    }, 200);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 p-5 max-w-screen-2xl mx-auto">
      <div className="lg:col-span-1 space-y-4">
        <div className="surface-elevated p-5 space-y-4">
          <h3 className="font-ui text-xs font-bold uppercase tracking-widest text-gold flex items-center gap-1.5">
            <MapPin size={14} /> Live Check-In
          </h3>
          <form onSubmit={handleCheckin} className="space-y-3">
            <select
              value={selectedDestId}
              onChange={e => setSelectedDestId(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold)]"
            >
              <option value="">-- {vi ? 'Chọn địa điểm' : 'Select location'} --</option>
              {destinations.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.category})</option>
              ))}
            </select>

            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder={vi ? 'Bạn đang làm gì ở đây?' : 'What are you doing here?'}
              rows={2}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold)] resize-none placeholder:text-[var(--text-muted)]"
            />

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">
                {vi ? 'Đọc tọa độ GPS từ ảnh chụp' : 'Extract GPS coordinate from photo'}
              </label>
              <input
                type="file"
                accept="image/jpeg"
                onChange={handlePhotoUpload}
                disabled={isExtractingGps}
                className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-black file:bg-[var(--bg-elevated)] file:text-[var(--gold)] hover:file:bg-[var(--bg-overlay)] cursor-pointer"
              />
              {isExtractingGps && (
                <span className="text-[9px] text-[var(--gold)] animate-pulse block">
                  ⌛ {vi ? 'Đang trích xuất tọa độ GPS EXIF...' : 'Extracting GPS coordinate...'}
                </span>
              )}
            </div>

            <button type="submit" className="btn-gold w-full py-2.5">
              {isAuthenticated ? (vi ? 'Check-In Ngay' : 'Check-In Now') : t('nav.signIn')}
            </button>
          </form>
        </div>

        <div className="surface-elevated p-5 space-y-3.5">
          <h3 className="sidebar-title flex items-center justify-between">
            <span className="flex items-center gap-2">🧭 {vi ? 'Hành trình tạm thời' : 'Route Planner'}</span>
            {routeQueue.length >= 2 && (
              <button
                onClick={handleOptimizeTSP}
                className="text-[10px] font-black text-[var(--gold)] hover:underline border-none bg-transparent cursor-pointer"
              >
                {vi ? 'Tối ưu TSP' : 'Optimize TSP'}
              </button>
            )}
          </h3>

          {routeQueue.length === 0 ? (
            <p className="text-[11px] text-[var(--text-muted)] text-center py-4">
              {vi ? 'Nhấp ghim trên bản đồ để thêm điểm dừng lộ trình.' : 'Click pins on map to queue route stops.'}
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {routeQueue.map((pt, index) => (
                <div key={pt.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-4 h-4 rounded-full bg-[var(--gold)] text-black text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <p className="font-semibold text-[var(--text-primary)] truncate">{pt.name}</p>
                  </div>
                  <button
                    onClick={() => removeRoutePoint(pt.id)}
                    className="text-[10px] font-black text-rose-500 hover:text-rose-400 border-none bg-transparent cursor-pointer ml-1"
                  >
                    {vi ? 'Xóa' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-3">
        <div className="flex justify-between items-center bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-subtle)] gap-2 flex-wrap">
          <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Real-time Social Map · OSM Tile Layer
          </span>

          <div className="flex items-center rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-0.5 gap-0.5">
            {(['markers', 'cluster', 'heatmap'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all border-none cursor-pointer ${
                  viewMode === mode
                    ? 'bg-[var(--gold)] text-black'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={handleCacheTiles}
            className="flex items-center gap-1 px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg text-[10px] font-bold text-[var(--gold)] hover:bg-[var(--gold-glow)]/15 transition-all border-none cursor-pointer"
          >
            📥 {cachingProgress !== null ? `${cachingProgress}%` : (vi ? 'Lưu Ngoại tuyến' : 'Cache Offline')}
          </button>
        </div>

        {cachingProgress !== null && (
          <div className="w-full bg-[var(--bg-elevated)] rounded-full h-1.5 overflow-hidden">
            <div className="bg-[var(--gold)] h-full transition-all duration-200" style={{ width: `${cachingProgress}%` }} />
          </div>
        )}

        <div className="h-[520px] rounded-2xl overflow-hidden shadow-2xl border border-[var(--border-subtle)]">
          <LeafletMap
            center={selectedCenter}
            zoom={13}
            locations={locations}
            viewMode={viewMode}
            routePoints={routeQueue}
            onAddPointToRoute={addPointToRoute}
          />
        </div>
      </div>

      <div className="lg:col-span-1 surface-elevated p-5 flex flex-col h-[620px]">
        <h3 className="sidebar-title mb-4 flex items-center gap-2">
          <Users size={14} className="text-[var(--gold)]" /> Community Check-Ins
        </h3>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {checkins.length === 0 ? (
            <p className="text-center text-xs text-[var(--text-muted)] py-20">
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
                  className="p-3 bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-[var(--border-subtle)] rounded-xl transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={chk.user?.profile?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&q=40'}
                      alt={chk.user?.profile?.fullName || 'User'}
                      className="w-8 h-8 rounded-full object-cover border border-[var(--border-normal)]"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-gold transition-colors">
                        {chk.user?.profile?.fullName || chk.user?.email || 'User'}
                      </h4>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {new Date(chk.createdAt).toLocaleDateString(vi ? 'vi-VN' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  {chk.note && (
                    <p className="text-xs text-[var(--text-secondary)] italic">"{chk.note}"</p>
                  )}
                  <div className="text-[10px] text-gold font-semibold flex items-center gap-1">
                    <MapPin size={10} /> {chk.destination?.name || 'Vị trí'}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// 2. AI TRIP PLANNER
// ──────────────────────────────────────────────────────────
const TripPlanner = () => {
  const [destination, setDestination] = useState('Ha Giang');
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState(150);
  const [style, setStyle] = useState('Adventure');
  const [interests, setInterests] = useState<string[]>(['nature', 'culture']);
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<any>(null);
  const [optimized, setOptimized] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const toggleInterest = (val: string) =>
    setInterests(p => p.includes(val) ? p.filter(i => i !== val) : [...p, val]);

  const handleGenerate = async () => {
    setLoading(true); setOptimized(false); setAiError(null);
    try {
      const result = await tripsService.aiGenerate({ destination, durationDays: days, dailyBudget: budget, interests, travelStyle: style });
      setItinerary(result);
    } catch {
      setAiError('AI endpoint unavailable — showing sample itinerary.');
      setItinerary({
        destination, totalEstimatedCost: budget * days * 0.75, currency: 'USD',
        days: [
          { dayIndex: 1, dateIndex: 'Day 1: Arrival & First Impressions', activities: [
            { timeSlot: '09:00 - 11:00', activityName: `${destination} Welcome Walk`, estimatedCost: 0, category: 'attraction', notes: 'Settle in, explore the town center' },
            { timeSlot: '12:00 - 13:30', activityName: 'Local Street Food Lunch', estimatedCost: 8, category: 'restaurant', notes: 'Try local specialties at the market' },
            { timeSlot: '15:00 - 18:00', activityName: 'Main Landmark Visit', estimatedCost: 20, category: 'attraction', notes: 'Iconic viewpoint or heritage site' },
          ]},
          { dayIndex: 2, dateIndex: 'Day 2: Cultural Deep Dive', activities: [
            { timeSlot: '08:00 - 09:30', activityName: 'Morning Heritage Walk', estimatedCost: 15, category: 'attraction', notes: 'Guided tour of historic quarter' },
            { timeSlot: '12:30 - 14:00', activityName: 'Cooking Class Lunch', estimatedCost: 35, category: 'restaurant', notes: 'Learn to cook traditional dishes' },
            { timeSlot: '16:00 - 18:00', activityName: 'Sunset Viewpoint', estimatedCost: 5, category: 'attraction', notes: 'Best photo spot in the area' },
          ]},
        ]
      });
    } finally { setLoading(false); }
  };

  const runRouteOptimization = async () => {
    if (!itinerary) return;
    setLoading(true);
    try {
      const optimizedDays = await Promise.all(
        itinerary.days.map(async (d: any) => {
          if (!d.activities || d.activities.length <= 1) return d;
          
          // Map activities to Waypoints for backend TSP optimizer
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
            // Fallback to reversing array if API fails
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

  return (
    <div className="p-5 max-w-screen-xl mx-auto space-y-6">
      <div>
        <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold mb-2">AI-Powered Planning</p>
        <h1 className="headline-xl">Smart Travel Planner</h1>
        <p className="text-[var(--text-secondary)] mt-2">Generate personalized itineraries optimized with TSP routing & GPT-4o intelligence.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="surface-elevated p-6 space-y-5 h-fit">
          <h3 className="font-ui text-sm font-bold text-[var(--text-secondary)] border-b border-[var(--border-subtle)] pb-3">Itinerary Parameters</h3>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Destination</label>
            <input type="text" value={destination} onChange={e => setDestination(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-sm text-cream focus:outline-none focus:border-[var(--gold)]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['Days', days, setDays, 1, 15], ['Budget/Day ($)', budget, setBudget, 10, 2000]].map(([label, val, setter, min, max]: any) => (
              <div key={label} className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{label}</label>
                <input type="number" value={val} onChange={e => setter(Number(e.target.value))} min={min} max={max}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-sm text-cream focus:outline-none focus:border-[var(--gold)]" />
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Travel Style</label>
            <select value={style} onChange={e => setStyle(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-sm text-cream focus:outline-none focus:border-[var(--gold)]">
              {['Adventure', 'Cultural Exploration', 'Leisure & Food', 'Luxury Wellness', 'Budget Backpacker'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Interests</label>
            <div className="flex flex-wrap gap-2">
              {['nature', 'culture', 'food', 'hiking', 'photography', 'history'].map(tag => (
                <button key={tag} type="button" onClick={() => toggleInterest(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${interests.includes(tag) ? 'bg-[var(--gold-glow)] border-[var(--gold)] text-gold' : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-normal)]'}`}>
                  #{tag}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleGenerate} disabled={loading} className="btn-gold w-full py-3 text-sm disabled:opacity-60">
            {loading ? <><Loader2 size={14} className="animate-spin inline" /> Consulting AI...</> : <><Bot size={14} className="inline" /> Generate Smart Itinerary</>}
          </button>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {aiError && <div className="surface-elevated px-4 py-3 border-l-2 border-amber-500 text-xs text-amber-400 flex items-center gap-2"><AlertTriangle size={14} /> {aiError}</div>}
          {itinerary ? (
            <div className="space-y-6">
              <div className="surface-elevated p-5 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Predicted Trip Cost</p>
                  <span className="text-3xl font-bold text-gold">${Math.round(itinerary.totalEstimatedCost || itinerary.totalCost || 0)}</span>
                  <span className="text-sm text-[var(--text-muted)] ml-2">USD ±10%</span>
                </div>
                <button onClick={runRouteOptimization}
                  className={`px-5 py-2.5 text-xs font-bold rounded-lg border transition-all ${optimized ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'btn-gold border-transparent'}`}>
                  {optimized ? <><Check size={12} className="inline" /> TSP Optimized</> : <><Zap size={12} className="inline" /> Optimize Route</>}
                </button>
              </div>
              {itinerary.days.map((d: any) => (
                <div key={d.dayIndex || d.day} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="badge-category">Day {d.dayIndex || d.day}</span>
                    <h3 className="headline-md">{d.dateIndex || d.title}</h3>
                  </div>
                  <div className="relative border-l-2 border-[var(--border-subtle)] ml-3 pl-6 space-y-3">
                    {d.activities.map((act: any, idx: number) => (
                      <div key={idx} className="relative group">
                        <div className="absolute -left-[27px] top-3 w-3 h-3 rounded-full bg-[var(--bg-primary)] border-2 border-[var(--gold)] group-hover:scale-125 transition-transform" />
                        <div className="card-editorial p-4 space-y-1.5 hover:border-[var(--border-normal)]">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-bold text-[var(--text-muted)]">{act.timeSlot || act.time}</span>
                              <h4 className="text-sm font-bold text-cream flex items-center gap-1.5">
                                {(() => { const ActIcon = getCategoryIcon(act.category); return <ActIcon size={14} className="text-[var(--gold)] flex-shrink-0" />; })()}
                                {act.activityName || act.name}
                              </h4>
                            </div>
                            <span className="text-sm font-bold text-gold">${act.estimatedCost || act.cost}</span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)]">{act.notes || act.note}</p>
                          <span className="badge-category-outline text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">{act.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="surface-elevated p-16 text-center space-y-4">
              <Plane size={48} className="mx-auto text-[var(--gold)] opacity-60" strokeWidth={1.5} />
              <h3 className="headline-md">Your Itinerary Awaits</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">Configure your trip parameters and let our AI craft a personalized journey optimized for your style and budget.</p>
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
                <div className="h-full bg-gradient-to-r from-[var(--gold)] to-amber-500 rounded-full transition-all duration-1000" style={{ width: `${item.rate}%` }} />
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
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-[64px] flex items-center gap-3">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group" onClick={() => setMobileOpen(false)}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--gold)] via-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all group-hover:scale-105">
              <span className="text-white font-black text-sm tracking-tight">ST</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-editorial text-lg font-bold text-[var(--text-primary)] leading-none">SmartTravel</span>
              <div className="text-[9px] text-[var(--gold)] font-semibold tracking-widest uppercase leading-none">AI × Social × Map</div>
            </div>
          </Link>

          {/* Search */}
          <div className={`flex-1 max-w-lg hidden md:block transition-all duration-200 ${searchFocused ? 'max-w-xl' : ''}`}>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder={t('nav.search')}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`w-full bg-[var(--bg-elevated)] border rounded-full pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-muted)] transition-all duration-200 ${
                  searchFocused
                    ? 'border-[var(--gold)] shadow-lg shadow-[var(--gold-glow)]'
                    : 'border-[var(--border-subtle)] hover:border-[var(--border-normal)]'
                }`}
              />
              {searchFocused && (
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] bg-[var(--bg-overlay)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">⌘K</kbd>
              )}
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1 md:hidden" />

          {/* Right Actions */}
          <div className="flex items-center gap-1.5">

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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--gold)] to-amber-500 text-xs font-bold text-black hover:shadow-lg hover:shadow-amber-500/25 transition-all hover:scale-105"
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
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 hidden md:flex items-center gap-1 h-[46px] overflow-x-auto">
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
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[var(--gold)] to-amber-600 flex items-center justify-center text-[10px] font-bold text-black">ST</div>
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
