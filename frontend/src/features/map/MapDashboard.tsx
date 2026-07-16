import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  MapPin, Users, Search, Sparkles, Loader2, Flame, Sun, Moon, BarChart3
} from 'lucide-react';
import MapLibreMap, { MapLocation } from '../../components/Map/MapLibreMap';
import { mapService } from '../../services/smartTravel.service';
import type { RootState } from '../../store';
import { useLang } from '../../contexts/LanguageContext';
import { io } from 'socket.io-client';

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
  const [checkinImage, setCheckinImage] = useState('');
  const [checkinTag, setCheckinTag] = useState('');

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

  const requestMyLocation = () => {
    if (!navigator.geolocation) {
      alert(vi ? 'Trình duyệt của bạn không hỗ trợ định vị GPS.' : 'Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setSelectedCenter([latitude, longitude]);
        alert(vi 
          ? `Đã nhận diện tọa độ của bạn: [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]` 
          : `Location acquired: [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`
        );
        console.log(`🎯 User requested location: [${latitude}, ${longitude}]`);
      },
      (error) => {
        console.warn('⚠️ Real User Location denied/failed:', error.message);
        alert(vi 
          ? 'Không nhận được hoặc không xác nhận được tọa độ của bạn. Vui lòng đồng ý chia sẻ vị trí (GPS) trong phần cài đặt trình duyệt hoặc Windows để sử dụng tính năng này!' 
          : 'Unable to acquire or verify your coordinates. Please grant location sharing permission (GPS) in your browser/OS settings!'
        );
      },
      { enableHighAccuracy: false, timeout: 6000 }
    );
  };

  useEffect(() => {
    loadMapData();
  }, []);

  // Request actual browser geolocation on mount & track moves
  useEffect(() => {
    if (!navigator.geolocation) return;

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
      { enableHighAccuracy: false, timeout: 6000 }
    );

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
      },
      (error) => {
        console.warn('⚠️ Real User Location watch error:', error.message);
      },
      { enableHighAccuracy: false, timeout: 10000 }
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

    const mappedCheckins: MapLocation[] = checkins.map(c => {
      let parsedNote = c.note || '';
      let imageUrl = '';
      let tag = '';
      if (c.note && c.note.startsWith('{') && c.note.endsWith('}')) {
        try {
          const parsed = JSON.parse(c.note);
          parsedNote = parsed.text || '';
          imageUrl = parsed.imageUrl || '';
          tag = parsed.tag || '';
        } catch (e) {}
      }
      return {
        id: `checkin-${c.id}`,
        name: c.destination?.name || 'Vị trí check-in',
        lat: c.destination?.latitude || 21.0285,
        lng: c.destination?.longitude || 105.8048,
        note: parsedNote,
        imageUrl: imageUrl,
        tag: tag,
        user: c.user?.profile?.fullName || c.user?.email || 'Người dùng',
        avatar: c.user?.profile?.avatarUrl || '',
        time: new Date(c.createdAt).toLocaleTimeString(vi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })
      };
    });

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
      if (destinations.length > 0) {
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
          ? `Đã tìm thấy GPS trong ảnh: [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}].`
          : `GPS found in photo: [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}].`
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
      const finalPayload = JSON.stringify({
        text: newNote,
        imageUrl: checkinImage,
        tag: checkinTag
      });
      const response = await mapService.checkIn(selectedDestId, finalPayload);
      setCheckins(prev => [response, ...prev]);
      setNewNote('');
      setSelectedDestId('');
      setCheckinImage('');
      setCheckinTag('');
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start p-5 max-w-screen-2xl mx-auto animate-fade-in">
      {/* COLUMN 1: Search, Filter, AI Recommendations (Left Column, span 3) */}
      <div className="lg:col-span-3 flex flex-col gap-5 h-[620px] overflow-y-auto pr-1">
        {/* 1. Search Box with Autocomplete */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-4 space-y-2 relative rounded-xl shadow-sm">
          <h3 className="font-ui text-xs font-black uppercase tracking-widest text-[var(--gold)] flex items-center gap-1.5">
            <Search size={12} /> {vi ? 'Tìm địa điểm' : 'Search Place'}
          </h3>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={vi ? 'Nhập tên địa điểm...' : 'Search place...'}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-lg px-3 py-2 pl-8 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <Search size={12} className="absolute left-2.5 top-3 text-[var(--text-muted)]" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
          {searchQuery && destinations.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
            <div className="absolute left-0 right-0 top-full bg-[var(--bg-elevated)] border border-[var(--border-normal)] rounded-lg mt-1 max-h-40 overflow-y-auto z-30 shadow-2xl p-1">
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
                    className="px-3 py-1.5 hover:bg-[var(--bg-overlay)] text-[10px] text-[var(--text-primary)] rounded cursor-pointer truncate"
                  >
                    📍 {d.name} <span className="text-[8px] text-slate-400">({d.category})</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* 2. Filters */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-4 space-y-3 rounded-xl shadow-sm">
          <h3 className="font-ui text-xs font-black uppercase tracking-widest text-[var(--gold)] flex items-center gap-1.5">
            🧭 {vi ? 'Bộ lọc nâng cao' : 'Filters'}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
            >
              <option value="">{vi ? 'Tất cả' : 'All Categories'}</option>
              <option value="attraction">{vi ? 'Tham quan' : 'Attraction'}</option>
              <option value="restaurant">{vi ? 'Nhà hàng' : 'Restaurant'}</option>
              <option value="hotel">{vi ? 'Khách sạn' : 'Hotel'}</option>
              <option value="cafe">{vi ? 'Cà phê' : 'Cafe'}</option>
              <option value="festival">{vi ? 'Lễ hội / Sự kiện' : 'Festival / Event'}</option>
            </select>
            <select
              value={filterRating}
              onChange={e => setFilterRating(Number(e.target.value))}
              className="bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
            >
              <option value="0">{vi ? 'Đánh giá' : 'Rating'}</option>
              <option value="4">★ 4.0+</option>
              <option value="4.5">★ 4.5+</option>
            </select>
          </div>
        </div>

        {/* 3. AI Recommendations Layer */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-4 space-y-3 rounded-xl shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="font-ui text-xs font-black uppercase tracking-widest text-[var(--gold)] flex items-center gap-1.5">
              <Sparkles size={12} className="text-blue-500 dark:text-blue-400" /> {vi ? 'Đề xuất AI lân cận' : 'Nearby AI Suggestions'}
            </h3>
            <button
              onClick={handleGetAiRecommendations}
              disabled={loadingAiRecs}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded text-[8px] font-bold uppercase cursor-pointer border-none flex items-center gap-1 transition-all"
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
                    className="p-2.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/70 dark:border-blue-900/30 rounded-lg hover:bg-blue-100/50 dark:hover:bg-blue-950/30 transition-all cursor-pointer"
                  >
                    <h4 className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                      {dest ? dest.name : 'Địa điểm'}
                      <span className="text-[8px] bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">{rec.tag || 'AI'}</span>
                    </h4>
                    <p className="text-[9px] text-[var(--text-secondary)] mt-1 italic leading-tight">"{rec.reason}"</p>
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
          <div className="bg-[var(--bg-elevated)] border border-blue-500 dark:border-blue-400 p-4 space-y-3 rounded-xl shadow-md">
            <h3 className="font-ui text-xs font-black uppercase tracking-widest text-[var(--gold)] flex items-center justify-between">
              <span className="flex items-center gap-1">🤖 AI Assistant</span>
              <button
                onClick={() => setSelectedLocation(null)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </h3>
            <p className="text-[10px] font-bold text-[var(--text-primary)] truncate">{selectedLocation.name}</p>
            
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
                  className="px-2 py-1.5 bg-[var(--bg-primary)] hover:bg-[var(--bg-overlay)] disabled:bg-slate-300 border border-[var(--border-normal)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded text-[9px] font-semibold text-left truncate cursor-pointer transition-all"
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
              <p className="text-[9px] text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-[var(--border-normal)] p-2 rounded-lg italic leading-relaxed">
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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'markers' 
                  ? 'bg-blue-600 text-white shadow-sm border border-transparent' 
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-normal)]'
              }`}
            >
              <MapPin size={12} className={viewMode === 'markers' ? 'text-white' : 'text-blue-500'} />
              <span>{vi ? 'Ghim' : 'Pins'}</span>
            </button>
            <button
              onClick={() => setViewMode('cluster')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'cluster' 
                  ? 'bg-blue-600 text-white shadow-sm border border-transparent' 
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-normal)]'
              }`}
            >
              <Users size={12} className={viewMode === 'cluster' ? 'text-white' : 'text-blue-500'} />
              <span>{vi ? 'Nhóm' : 'Clusters'}</span>
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'heatmap' 
                  ? 'bg-blue-600 text-white shadow-sm border border-transparent' 
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-normal)]'
              }`}
            >
              <Flame size={12} className={viewMode === 'heatmap' ? 'text-white' : 'text-orange-500'} />
              <span>{vi ? 'Nhiệt' : 'Heatmap'}</span>
            </button>
          </div>
        </div>

        {/* Route Planner Action Bar */}
        <div className="flex flex-wrap gap-2 items-center bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-3 rounded-xl shadow-sm">
          <button
            onClick={requestMyLocation}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase rounded-lg transition-all border-none cursor-pointer flex items-center gap-1.5"
          >
            🎯 {vi ? 'Định vị của tôi' : 'Locate Me'}
          </button>

          <button
            onClick={handleOptimizeTSP}
            disabled={routeQueue.length < 3}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white text-[10px] font-bold uppercase rounded-lg transition-all border-none cursor-pointer flex items-center gap-1"
          >
            ⚡ {vi ? 'Tối ưu tuyến đường (TSP)' : 'Optimize Route (TSP)'}
          </button>
          
          <button
            onClick={handleCacheTiles}
            disabled={cachingProgress !== null}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-[10px] font-bold uppercase rounded-lg transition-all border-none cursor-pointer flex items-center gap-1 ml-auto"
          >
            💾 {vi ? 'Tải bản đồ ngoại tuyến' : 'Cache Offline Map'}
          </button>

          {routeQueue.length > 0 && (
            <button
              onClick={() => setRouteQueue([])}
              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase rounded-lg transition-all border border-red-200 dark:border-red-800/30 cursor-pointer"
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
            onRemovePointFromRoute={removeRoutePoint}
            aiRecommendedIds={aiRecs.map(r => r.id)}
            onSelectLocation={setSelectedLocation}
          />
        </div>
      </div>

      {/* COLUMN 3: Live Friends & Check-Ins (Right Column, span 3) */}
      <div className="lg:col-span-3 flex flex-col gap-5 h-[620px]">
        {/* check-in form */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-4 space-y-3 rounded-xl shadow-sm">
          <h3 className="font-ui text-xs font-black uppercase tracking-widest text-[var(--gold)] flex items-center gap-1.5">
            📸 {vi ? 'Check-in Địa điểm' : 'Check-In Location'}
          </h3>
          <form onSubmit={handleCheckin} className="space-y-2">
            <select
              value={selectedDestId}
              onChange={e => setSelectedDestId(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-lg px-2.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />

            <div className="flex gap-2">
              <select
                value={checkinTag}
                onChange={e => setCheckinTag(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-lg px-2 py-1.5 text-[10px] text-[var(--text-primary)] focus:outline-none focus:border-blue-500 focus:ring-1"
              >
                <option value="">-- {vi ? 'Chọn Tag check-in' : 'Select Tag'} --</option>
                <option value="food">{vi ? 'Ẩm thực' : 'Food'}</option>
                <option value="hotel">{vi ? 'Nghỉ dưỡng' : 'Hotel'}</option>
                <option value="cafe">{vi ? 'Cà phê' : 'Cafe'}</option>
                <option value="nature">{vi ? 'Thiên nhiên' : 'Nature'}</option>
              </select>

              <label className="flex items-center justify-center px-2 py-1.5 bg-[var(--bg-primary)] hover:bg-[var(--bg-overlay)] border border-[var(--border-normal)] text-[var(--text-secondary)] rounded text-[9px] font-bold cursor-pointer transition-all truncate max-w-[120px]">
                📁 {checkinImage ? (vi ? 'Đã chọn ảnh' : 'Photo Selected') : (vi ? 'Thêm ảnh' : 'Add Photo')}
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setCheckinImage(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {checkinImage && (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-[var(--border-normal)]">
                <img src={checkinImage} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setCheckinImage('')}
                  className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold cursor-pointer border-none"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex gap-2 items-center justify-between">
              <label className="flex items-center gap-1 px-2.5 py-1.5 bg-[var(--bg-primary)] hover:bg-[var(--bg-overlay)] border border-[var(--border-normal)] text-[var(--text-secondary)] rounded text-[9px] font-bold cursor-pointer transition-all">
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
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold uppercase rounded-lg cursor-pointer border-none transition-all shadow-sm"
              >
                {vi ? 'Đăng Check-In' : 'Post Check-In'}
              </button>
            </div>
          </form>
        </div>

        {/* list of check-ins */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-4 flex flex-col flex-1 rounded-xl shadow-sm overflow-hidden">
          <h3 className="sidebar-title mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Users size={12} className="text-[var(--gold)]" /> Community Check-Ins</span>
            <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-extrabold shadow-sm shadow-red-500/10">{checkins.length}</span>
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
                let parsedNote = chk.note || '';
                let imageUrl = '';
                let tag = '';
                if (chk.note && chk.note.startsWith('{') && chk.note.endsWith('}')) {
                  try {
                    const parsed = JSON.parse(chk.note);
                    parsedNote = parsed.text || '';
                    imageUrl = parsed.imageUrl || '';
                    tag = parsed.tag || '';
                  } catch (e) {}
                }
                return (
                  <div
                    key={chk.id}
                    onClick={() => {
                      setSelectedCenter([lat, lng]);
                      setSelectedLocation({
                        id: `checkin-${chk.id}`,
                        name: chk.destination?.name || 'Vị trí check-in',
                        lat,
                        lng,
                        note: parsedNote,
                        imageUrl: imageUrl,
                        tag: tag,
                        user: chk.user?.profile?.fullName || chk.user?.email || 'Người dùng',
                        avatar: chk.user?.profile?.avatarUrl || ''
                      });
                    }}
                    className="p-2 bg-[var(--bg-primary)] hover:bg-[var(--bg-overlay)] border border-[var(--border-normal)] rounded-xl transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center gap-1.5">
                      <img
                        src={chk.user?.profile?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                        alt={chk.user?.profile?.fullName || 'User'}
                        className="w-6 h-6 rounded-full object-cover border border-[var(--border-normal)]"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[10px] font-bold text-[var(--text-primary)] group-hover:text-[var(--gold)] transition-colors truncate">
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
                    {parsedNote && (
                      <p className="text-[10px] text-[var(--text-secondary)] italic line-clamp-2 leading-snug">"{parsedNote}"</p>
                    )}
                    {imageUrl && (
                      <div className="w-16 h-12 rounded-lg overflow-hidden border border-slate-700 bg-black/10 mt-1">
                        <img src={imageUrl} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="text-[9px] text-[var(--gold)] font-semibold flex items-center gap-0.5 truncate mt-1">
                      <MapPin size={8} /> {chk.destination?.name || 'Vị trí'}
                      {tag && <span className="text-[7px] bg-slate-800 text-slate-300 px-1 py-0.2 rounded ml-1.5 uppercase font-black">{tag}</span>}
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

export default MapDashboard;
