import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  MapPin, Users, Search, Sparkles, Loader2, Flame, Sun, Moon,
  CloudSun, Camera, Navigation, Compass, Send, Check, Bell, Wind, Droplets,
  CloudRain, Car, AlertTriangle, Layers, Plus, ChevronRight, Image as ImageIcon,
  Star, MessageSquare, Heart, Bookmark, Map, Eye, Layers3, Filter, Zap
} from 'lucide-react';
import MapLibreMap, { MapLocation } from '../../components/Map/MapLibreMap';
import { mapService } from '../../services/smartTravel.service';
import type { RootState } from '../../store';
import { useLang } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { io } from 'socket.io-client';

const MapDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);
  const { t } = useLang();
  const { success, error, warning, info } = useToast();
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
  const [customDestName, setCustomDestName] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isExtractingGps, setIsExtractingGps] = useState(false);
  const [checkinImage, setCheckinImage] = useState('');
  const [checkinTag, setCheckinTag] = useState('');

  // Advanced search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRating, setFilterRating] = useState(0);
  const [tempCategory, setTempCategory] = useState('');
  const [tempRating, setTempRating] = useState(0);

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
  const [selectedRadius, setSelectedRadius] = useState<number>(0);

  const handleFindNearby = async () => {
    const lat = userLocation ? userLocation[0] : selectedCenter[0];
    const lng = userLocation ? userLocation[1] : selectedCenter[1];
    const radiusToUse = selectedRadius > 0 ? selectedRadius : 10;
    if (selectedRadius === 0) setSelectedRadius(10);

    try {
      const dests = await mapService.destinations({ lat, lng, radius: radiusToUse });
      if (Array.isArray(dests) && dests.length > 0) {
        setDestinations(dests);
        setSelectedCenter([dests[0].latitude, dests[0].longitude]);
        setSelectedLocation({
          id: dests[0].id,
          name: dests[0].name,
          lat: dests[0].latitude,
          lng: dests[0].longitude,
          category: dests[0].category
        });
        success(vi 
          ? `⚡ Đã tìm thấy ${dests.length} địa điểm lân cận trong bán kính ${radiusToUse}km!` 
          : `⚡ Found ${dests.length} destinations within ${radiusToUse}km!`
        );
        return;
      }
    } catch (err) {
      console.warn('API nearby search failed, fallback to local distance filter:', err);
    }

    // Local fallback filter
    const EARTH_RADIUS_KM = 6371;
    const nearbyDests = destinations.filter(d => {
      const dLat = (d.latitude - lat) * (Math.PI / 180);
      const dLng = (d.longitude - lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * (Math.PI / 180)) * Math.cos(d.latitude * (Math.PI / 180)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return EARTH_RADIUS_KM * c <= radiusToUse;
    });

    if (nearbyDests.length > 0) {
      setSelectedCenter([nearbyDests[0].latitude, nearbyDests[0].longitude]);
      setSelectedLocation({
        id: nearbyDests[0].id,
        name: nearbyDests[0].name,
        lat: nearbyDests[0].latitude,
        lng: nearbyDests[0].longitude,
        category: nearbyDests[0].category
      });
      success(vi ? `⚡ Tìm thấy ${nearbyDests.length} địa điểm lân cận bán kính ${radiusToUse}km!` : `⚡ Found ${nearbyDests.length} nearby places!`);
    } else {
      info(vi ? `Đang tìm kiếm các địa điểm lân cận trong bán kính ${radiusToUse}km...` : `Searching nearby places within ${radiusToUse}km...`);
    }
  };

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
    if (!isAuthenticated) {
      warning(vi ? 'Bạn cần đăng nhập để định vị vị trí của mình!' : 'You need to log in to acquire your location!');
      navigate('/auth', { state: { from: '/map' } });
      return;
    }
    if (!navigator.geolocation) {
      error(vi ? 'Trình duyệt của bạn không hỗ trợ định vị GPS.' : 'Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setSelectedCenter([latitude, longitude]);
        success(vi 
          ? `Đã nhận diện tọa độ của bạn: [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]` 
          : `Location acquired: [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`
        );
        console.log(`🎯 User requested location: [${latitude}, ${longitude}]`);
      },
      (error) => {
        console.warn('⚠️ Real User Location denied/failed:', error.message);
        warning(vi 
          ? 'Không nhận được hoặc không xác nhận được tọa độ của bạn. Vui lòng đồng ý chia sẻ vị trí (GPS) trong phần cài đặt trình duyệt hoặc Windows để sử dụng tính năng này!' 
          : 'Unable to acquire or verify your coordinates. Please grant location sharing permission (GPS) in your browser/OS settings!'
        );
      },
      { enableHighAccuracy: false, timeout: 6000 }
    );
  };

  useEffect(() => {
    if (!isAuthenticated) {
      warning(vi ? 'Bạn cần đăng nhập để truy cập trang Bản đồ!' : 'You need to log in to access the Map page!');
      navigate('/auth', { state: { from: '/map' } });
      return;
    }
    loadMapData();
  }, [isAuthenticated, navigate, vi]);

  // Request actual browser geolocation on mount & track moves if logged in
  useEffect(() => {
    if (!navigator.geolocation || !isAuthenticated) return;

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
  }, [isAuthenticated]);

  // Dynamically fetch destinations around the selected map center when it changes (drag end)
  useEffect(() => {
    const fetchLocalDestinations = async () => {
      const [lat, lng] = selectedCenter;
      if (!lat || !lng) return;
      try {
        const dests = await mapService.destinations({ lat, lng, radius: 50 });
        if (Array.isArray(dests)) {
          setDestinations(dests);
        }
      } catch (err) {
        console.error('Failed to fetch local destinations:', err);
      }
    };
    fetchLocalDestinations();
  }, [selectedCenter[0], selectedCenter[1]]);

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

    const mappedCheckins: MapLocation[] = [];
    const seenCheckins = new Set<string>();
    
    // Sort checkins by date descending so the most recent shows up as the primary marker
    const sortedCheckins = [...checkins].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    sortedCheckins.forEach(c => {
      const lat = c.destination?.latitude || c.latitude || 21.0285;
      const lng = c.destination?.longitude || c.longitude || 105.8048;
      
      const locKey = c.destinationId || `${lat.toFixed(5)},${lng.toFixed(5)}`;
      
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

      const checkinTime = new Date(c.createdAt).toLocaleTimeString(vi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(c.createdAt).toLocaleDateString(vi ? 'vi-VN' : 'en-US');

      if (seenCheckins.has(locKey)) {
        const existing = mappedCheckins.find(m => m.id === `checkin-${locKey}`);
        if (existing) {
          if (!existing.allCheckins) {
            existing.allCheckins = [{
              user: existing.user!,
              avatar: existing.avatar!,
              note: existing.note!,
              time: existing.time!
            }];
          }
          existing.allCheckins.push({
            user: c.user?.profile?.fullName || c.user?.email || 'Người dùng',
            avatar: c.user?.profile?.avatarUrl || '',
            note: parsedNote,
            time: checkinTime
          });
        }
        return;
      }

      seenCheckins.add(locKey);

      mappedCheckins.push({
        id: `checkin-${locKey}`,
        name: c.destination?.name || c.customName || 'Vị trí check-in',
        lat,
        lng,
        note: parsedNote,
        imageUrl: imageUrl,
        tag: tag,
        user: c.user?.profile?.fullName || c.user?.email || 'Người dùng',
        avatar: c.user?.profile?.avatarUrl || '',
        time: checkinTime,
        category: c.destination?.category || 'checkin'
      });
    });

    const mappedFriends: MapLocation[] = [];
    if (isAuthenticated && user) {
      const userLat = userLocation ? userLocation[0] : selectedCenter[0];
      const userLng = userLocation ? userLocation[1] : selectedCenter[1];

      Object.values(liveFriends)
        .map((f: any) => {
          // Haversine distance
          const R = 6371; // km
          const dLat = (f.lat - userLat) * Math.PI / 180;
          const dLon = (f.lng - userLng) * Math.PI / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(userLat * Math.PI / 180) * Math.cos(f.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const cDistance = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * cDistance;
          return { ...f, distance };
        })
        .filter(f => f.distance <= 100) // Within 100km radius limit
        .forEach(f => {
          mappedFriends.push({
            id: `live-${f.userId}`,
            name: `${f.fullName} (${f.distance.toFixed(1)} km)`,
            lat: f.lat,
            lng: f.lng,
            user: f.fullName,
            avatar: f.avatarUrl,
            category: 'LIVE_FRIEND',
            time: new Date(f.updatedAt).toLocaleTimeString(vi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })
          });
        });

      if (userLocation) {
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
    }

    setLocations([...mappedDests, ...mappedCheckins, ...mappedFriends]);
  }, [destinations, checkins, liveFriends, filterCategory, filterRating, searchQuery, userLocation, user, isAuthenticated, vi]);

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
          setCustomDestName(nearest.name);
          info(vi 
            ? `Đã tìm thấy GPS trong ảnh: [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}]. Tự chọn địa điểm gần nhất: ${nearest.name}`
            : `GPS found in photo: [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}]. Selected nearest place: ${nearest.name}`
          );
        }
      } else {
        info(vi 
          ? `Đã tìm thấy GPS trong ảnh: [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}].`
          : `GPS found in photo: [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}].`
        );
      }
    } else {
      warning(vi 
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
    if (!customDestName.trim()) {
      warning(vi ? 'Vui lòng nhập tên địa điểm!' : 'Please enter a place name!');
      return;
    }

    const lat = userLocation ? userLocation[0] : selectedCenter[0];
    const lng = userLocation ? userLocation[1] : selectedCenter[1];

    try {
      const finalPayload = JSON.stringify({
        text: newNote,
        imageUrl: checkinImage,
        tag: checkinTag
      });
      const response = await mapService.checkIn('', finalPayload, customDestName.trim(), lat, lng);
      setCheckins(prev => [response, ...prev]);
      setNewNote('');
      setCustomDestName('');
      setCheckinImage('');
      setCheckinTag('');

      setSelectedCenter([lat, lng]);
      setSelectedLocation({
        id: `checkin-${response.id}`,
        name: response.destination?.name || customDestName.trim(),
        lat,
        lng,
        note: newNote,
        imageUrl: checkinImage,
        tag: checkinTag,
        user: response.user?.profile?.fullName || response.user?.email || 'Người dùng',
        avatar: response.user?.profile?.avatarUrl || ''
      });

      success(vi ? 'Check-in thành công!' : 'Check-in successful!');
    } catch (err) {
      console.error('Checkin failed:', err);
      error(vi ? 'Check-in thất bại. Hãy thử lại.' : 'Check-in failed. Please try again.');
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
    let currentQueue = [...routeQueue];

    if (currentQueue.length < 2) {
      if (destinations.length >= 2) {
        const autoPoints: MapLocation[] = destinations.slice(0, 4).map(d => ({
          id: d.id,
          name: d.name,
          lat: d.latitude,
          lng: d.longitude,
          category: d.category
        }));
        currentQueue = autoPoints;
        setRouteQueue(autoPoints);
        info(
          vi
            ? `Tự động tạo lộ trình mẫu (${autoPoints.length} điểm) để tính toán tuyến đường tối ưu TSP!`
            : `Auto-created sample route (${autoPoints.length} points) for TSP optimization!`
        );
      } else {
        warning(
          vi
            ? 'Vui lòng thêm ít nhất 2 địa điểm vào lộ trình để tính toán TSP!'
            : 'Please add at least 2 destinations to optimize TSP route!'
        );
        return;
      }
    }

    const unvisited = [...currentQueue];
    const optimizedList: MapLocation[] = [unvisited.shift()!];
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
    setSelectedCenter([optimizedList[0].lat, optimizedList[0].lng]);
    success(
      vi
        ? `⚡ Tối ưu thuật toán TSP thành công cho ${optimizedList.length} địa điểm! Tuyến đường ngắn nhất đã hiển thị trên bản đồ.`
        : `⚡ TSP route optimized for ${optimizedList.length} destinations! Shortest path displayed.`
    );
  };

  const handleCacheTiles = () => {
    setCachingProgress(10);
    const interval = setInterval(() => {
      setCachingProgress(prev => {
        if (prev === null || prev >= 100) { clearInterval(interval); success(vi ? 'Tải bản đồ ngoại tuyến thành công!' : 'Offline map downloaded successfully!'); return null; }
        return prev + 20;
      });
    }, 200);
  };

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const dests = await mapService.destinations({ q: searchQuery });
      if (Array.isArray(dests)) {
        setDestinations(dests);
        if (dests.length > 0) {
          setSelectedCenter([dests[0].latitude, dests[0].longitude]);
        } else {
          warning(vi ? 'Không tìm thấy địa điểm nào khớp với từ khóa.' : 'No destinations found matching keyword.');
        }
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleApplyFilter = () => {
    setFilterCategory(tempCategory);
    setFilterRating(tempRating);
  };

  const handleGetAiRecommendations = async () => {
    if (!isAuthenticated) {
      warning(vi ? 'Bạn cần đăng nhập để sử dụng tính năng Đề xuất AI lân cận!' : 'You need to log in to use AI Recommendations!');
      navigate('/auth', { state: { from: '/map' } });
      return;
    }
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
    <div className="relative min-h-screen bg-slate-50/80 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans overflow-hidden animate-fade-in">
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
        {/* ── Top Header Bar ── */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-brand-500 to-sky-500 text-white shadow-lg shadow-brand-500/25">
              <Compass size={24} className="animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {vi ? 'Bản Đồ Tương Tác & GIS Thời Gian Thực' : 'Interactive Map & Real-time GIS'}
                </h1>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                {vi ? 'Khám phá thế giới theo cách của bạn' : 'Explore the world your own way'}
              </p>
            </div>
          </div>

          {/* Top-Right Action Controls */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            <div className="inline-flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('markers')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'markers'
                    ? 'bg-gradient-to-r from-brand-600 to-sky-500 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MapPin size={14} />
                <span>{vi ? 'GHIM' : 'PINS'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cluster')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'cluster'
                    ? 'bg-gradient-to-r from-brand-600 to-sky-500 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users size={14} />
                <span>{vi ? 'NHÓM' : 'GROUPS'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('heatmap')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'heatmap'
                    ? 'bg-gradient-to-r from-brand-600 to-sky-500 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Flame size={14} />
                <span>{vi ? 'NHIỆT' : 'HEAT'}</span>
              </button>
            </div>

            <button type="button" className="relative p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-md hover:shadow-lg transition-all cursor-pointer">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow">
                3
              </span>
            </button>

            {user && (
              <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-brand-500 shadow-md">
                <img src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} alt="user" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </header>

        {/* ── Main 3-Column Grid Layout (Non-Overlapping) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ── LEFT COLUMN (Search & Filters, AI Suggestions, AI Assistant, Hero Card) ── */}
          <div className="lg:col-span-3 space-y-5">
            
            {/* Combined Card 1: TÌM KIẾM & BỘ LỌC */}
            <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-2">
                <MapPin size={16} className="text-brand-500" />
                {vi ? 'TÌM ĐỊA ĐIỂM & BỘ LỌC' : 'SEARCH & FILTERS'}
              </h3>

              <form onSubmit={handleSearchSubmit} className="space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={vi ? 'Nhập tên địa điểm...' : 'Enter place name...'}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-10 pr-8 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={tempCategory}
                    onChange={e => setTempCategory(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-white font-semibold focus:outline-none focus:border-brand-500"
                  >
                    <option value="">{vi ? 'Tất cả' : 'All Categories'}</option>
                    <option value="attraction">{vi ? 'Tham quan' : 'Attraction'}</option>
                    <option value="restaurant">{vi ? 'Nhà hàng' : 'Restaurant'}</option>
                    <option value="hotel">{vi ? 'Khách sạn' : 'Hotel'}</option>
                    <option value="cafe">{vi ? 'Cà phê' : 'Cafe'}</option>
                    <option value="festival">{vi ? 'Lễ hội / Sự kiện' : 'Festival'}</option>
                  </select>

                  <select
                    value={tempRating}
                    onChange={e => setTempRating(Number(e.target.value))}
                    className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-white font-semibold focus:outline-none focus:border-brand-500"
                  >
                    <option value="0">{vi ? 'Đánh giá' : 'Rating'}</option>
                    <option value="4">★ 4.0+</option>
                    <option value="4.5">★ 4.5+</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    {vi ? 'Tìm' : 'Search'}
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilter}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1"
                  >
                    <Sparkles size={14} />
                    <span>{vi ? 'Lọc' : 'Filter'}</span>
                  </button>
                </div>
              </form>

              {searchQuery && destinations.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-h-40 overflow-y-auto shadow-lg p-1.5 space-y-1">
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
                        className="px-3 py-2 hover:bg-brand-50 dark:hover:bg-brand-950/30 text-xs text-slate-800 dark:text-white font-medium rounded-xl cursor-pointer truncate flex items-center gap-2"
                      >
                        <MapPin size={12} className="text-brand-500 shrink-0" />
                        <span className="truncate">{d.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">({d.category})</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Card 2: ĐỀ XUẤT AI LẦN CẬN */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xl space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-2">
                  <Sparkles size={16} className="text-brand-500" />
                  {vi ? 'ĐỀ XUẤT AI LẦN CẬN' : 'NEARBY AI SUGGESTIONS'}
                </h3>
                <button
                  type="button"
                  onClick={handleGetAiRecommendations}
                  disabled={loadingAiRecs}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-brand-600 to-sky-500 text-white rounded-xl text-[10px] font-extrabold uppercase shadow-md cursor-pointer border-none flex items-center gap-1 transition-all hover:scale-105"
                >
                  {loadingAiRecs ? <Loader2 size={10} className="animate-spin" /> : 'ASK'}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {vi ? 'Bấm nút Ask để nhận gợi ý AI cá nhân hóa.' : 'Click Ask button to get AI suggestions.'}
              </p>

              {/* Quick AI Pill Suggestion Tags */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { label: vi ? '📍 Ngắm hoàng hôn' : '📍 Sunset spot', q: 'ngắm hoàng hôn' },
                  { label: vi ? '☕ Cafe view đẹp' : '☕ View cafe', q: 'quán cafe' },
                  { label: vi ? '🔥 Điểm hot tuần' : '🔥 Trending spot', q: 'du lịch' },
                ].map(tag => (
                  <button
                    key={tag.q}
                    type="button"
                    onClick={() => {
                      setSearchQuery(tag.q);
                      handleSearchSubmit();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 dark:hover:text-brand-400 border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer text-left"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>

              {aiRecs.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 pt-2">
                  {aiRecs.map(rec => {
                    const dest = destinations.find(d => d.id === rec.id);
                    return (
                      <div
                        key={rec.id}
                        onClick={() => dest && setSelectedCenter([dest.latitude, dest.longitude])}
                        className="p-3 bg-brand-50/50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/30 rounded-2xl hover:bg-brand-100/50 dark:hover:bg-brand-950/40 transition-all cursor-pointer"
                      >
                        <h4 className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center justify-between">
                          {dest ? dest.name : 'Địa điểm'}
                          <span className="text-[9px] bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-md font-extrabold">{rec.tag || 'AI'}</span>
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 italic leading-snug">"{rec.reason}"</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Card 3: TRỢ LÝ AI (Hỏi AI về địa điểm được chọn) */}
            {selectedLocation && !selectedLocation.id.startsWith('live-') && !selectedLocation.id.startsWith('checkin-') && (
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-brand-500 dark:border-brand-400 p-5 rounded-3xl shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                    <Sparkles size={16} /> TRỢ LÝ AI
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedLocation(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{selectedLocation.name}</p>

                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    [vi ? '💬 Nổi bật?' : '💬 Highlights?'],
                    [vi ? '💬 Món ngon?' : '💬 Food?'],
                    [vi ? '💬 Mùa đẹp?' : '💬 Best time?'],
                    [vi ? '💬 Mẹo du lịch?' : '💬 Tips?']
                  ].map(([q]) => (
                    <button
                      key={q}
                      type="button"
                      disabled={loadingAiAssistant}
                      onClick={() => handleAskAiAssistant(q.replace('💬 ', ''))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-xl text-left cursor-pointer transition-all truncate"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {loadingAiAssistant && (
                  <div className="flex items-center gap-1.5 text-xs text-brand-500 animate-pulse font-medium">
                    <Loader2 size={12} className="animate-spin" />
                    <span>{vi ? 'AI đang trả lời...' : 'AI thinking...'}</span>
                  </div>
                )}

                {aiAssistantAnswer && (
                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl italic leading-relaxed border border-slate-200 dark:border-slate-700">
                    {aiAssistantAnswer}
                  </p>
                )}
              </div>
            )}

            {/* Card 4: PROMO HERO CARD */}
            <div className="relative overflow-hidden rounded-3xl shadow-xl aspect-[16/10] group cursor-pointer" onClick={() => navigate('/planner')}>
              <img
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
                alt="Promo Travel"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-6 flex flex-col justify-end text-white">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1">Khám phá</span>
                <h4 className="text-lg font-black leading-tight drop-shadow-sm mb-1">Những hành trình đáng nhớ</h4>
                <p className="text-xs text-slate-200 font-medium mb-4">Lên kế hoạch · Khám phá · Chia sẻ</p>

                <button type="button" className="self-start px-4 py-2 rounded-full bg-white text-slate-900 font-extrabold text-xs shadow-lg hover:bg-brand-50 transition-colors flex items-center gap-1.5">
                  <span>Bắt đầu ngay</span>
                  <ChevronRight size={14} className="stroke-[3px]" />
                </button>
              </div>
            </div>

          </div>

          {/* ── MIDDLE COLUMN (Map Canvas & Quick Route Actions) ── */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Functional Map Action Bar - Perfectly Centered & Balanced Grid */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-4 rounded-3xl shadow-xl space-y-3">
              {/* Row 1: Location & Nearby Search (3 Equal Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
                <button
                  type="button"
                  onClick={requestMyLocation}
                  className="w-full justify-center px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-black uppercase rounded-2xl transition-all border-none cursor-pointer flex items-center gap-2 shadow-md shadow-brand-500/20"
                >
                  <Navigation size={14} />
                  <span className="truncate">{vi ? 'ĐỊNH VỊ CỦA TÔI' : 'LOCATE ME'}</span>
                </button>

                <select
                  value={selectedRadius}
                  onChange={e => setSelectedRadius(Number(e.target.value))}
                  className="w-full text-center bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-xs text-slate-800 dark:text-white font-bold focus:outline-none focus:border-brand-500 cursor-pointer shadow-sm"
                >
                  <option value="0">-- {vi ? 'Bán kính' : 'Radius'} --</option>
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="15">15 km</option>
                  <option value="20">20 km</option>
                </select>

                <button
                  type="button"
                  onClick={handleFindNearby}
                  className="w-full justify-center px-4 py-2.5 bg-gradient-to-r from-brand-600 to-sky-500 text-white text-xs font-black uppercase rounded-2xl transition-all border-none cursor-pointer flex items-center gap-2 shadow-md shadow-sky-500/20"
                >
                  <Search size={14} />
                  <span className="truncate">{vi ? 'TÌM QUANH ĐÂY' : 'FIND NEARBY'}</span>
                </button>
              </div>

              {/* Row 2: Route Optimization & Offline Map (Balanced Grid) */}
              <div className={`grid grid-cols-1 ${routeQueue.length > 0 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-2.5 w-full pt-2.5 border-t border-slate-100 dark:border-slate-800/80`}>
                <button
                  type="button"
                  onClick={handleOptimizeTSP}
                  className="w-full justify-center px-4 py-2.5 bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:opacity-95 text-white text-xs font-black uppercase rounded-2xl transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-rose-500/20"
                >
                  <Zap size={14} />
                  <span className="truncate">{vi ? 'TỐI ƯU TUYẾN ĐƯỜNG (TSP)' : 'OPTIMIZE TSP ROUTE'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCacheTiles}
                  disabled={cachingProgress !== null}
                  className="w-full justify-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase rounded-2xl transition-all border-none cursor-pointer flex items-center gap-2 shadow-md shadow-purple-500/20"
                >
                  <Compass size={14} />
                  <span className="truncate">{vi ? 'BẢN ĐỒ NGOẠI TUYẾN' : 'OFFLINE MAP'}</span>
                </button>

                {routeQueue.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRouteQueue([])}
                    className="w-full justify-center px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-black uppercase rounded-2xl transition-all border border-rose-200 dark:border-rose-800/30 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>✕</span>
                    <span className="truncate">{vi ? 'XÓA LỘ TRÌNH' : 'CLEAR ROUTE'}</span>
                  </button>
                )}
              </div>
            </div>

            {cachingProgress !== null && (
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                <div className="bg-brand-500 h-full transition-all duration-200" style={{ width: `${cachingProgress}%` }} />
              </div>
            )}

            {/* MAIN MAP CONTAINER */}
            <div className="relative w-full h-[620px] rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
              {/* MapLibre Map Component Canvas */}
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
                onCenterChange={setSelectedCenter}
              />

              {/* Floating Bottom-Left Weather Widget */}
              <div className="absolute bottom-4 left-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xl flex items-center gap-3.5 max-w-xs">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                  <Sun size={24} className="animate-spin-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white">
                    <span>Hà Đông, Hà Nội</span>
                  </div>
                  <div className="text-sm font-extrabold text-brand-600 dark:text-brand-400">
                    32°C <span className="text-xs text-slate-500 font-normal">Nắng nhẹ</span>
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Độ ẩm 65%</span>
                    <span>·</span>
                    <span>Gió 12km/h</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN (Check-in Form & Community Feed) ── */}
          <div className="lg:col-span-3 space-y-5">
            
            {/* Card 1: CHECK-IN ĐỊA ĐIỂM */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xl space-y-3.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-2">
                <Camera size={16} className="text-brand-500" />
                {vi ? 'CHECK-IN ĐỊA ĐIỂM' : 'LOCATION CHECK-IN'}
              </h3>

              <form onSubmit={handleCheckin} className="space-y-3">
                <input
                  type="text"
                  value={customDestName}
                  onChange={e => setCustomDestName(e.target.value)}
                  placeholder={vi ? 'Nhập tên địa điểm...' : 'Enter place name...'}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-3.5 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:border-brand-500"
                  required
                />

                <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                  <span>📌</span> {vi ? 'Vị trí ghim: Tâm bản đồ hiện tại' : 'Pin position: Current map center'}
                </p>

                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  rows={3}
                  placeholder={vi ? 'Bạn đang nghĩ gì về nơi này?...' : 'What are your thoughts about this place?...'}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:border-brand-500 resize-none"
                />

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={checkinTag}
                    onChange={e => setCheckinTag(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-white font-semibold focus:outline-none"
                  >
                    <option value="">-- Tag check-in --</option>
                    <option value="CAFE">quán cafe</option>
                    <option value="STUDY">studybox</option>
                    <option value="FOOD">ẩm thực</option>
                    <option value="HOTEL">nghỉ dưỡng</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt(vi ? 'Nhập đường dẫn URL hình ảnh:' : 'Enter image URL:');
                      if (url) setCheckinImage(url);
                    }}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer truncate"
                  >
                    <ImageIcon size={14} />
                    <span>{checkinImage ? (vi ? 'Đã chọn ảnh' : 'Photo Added') : (vi ? 'Thêm ảnh' : 'Add photo')}</span>
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-brand-500/25 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Send size={14} />
                  <span>{vi ? 'ĐĂNG CHECK-IN' : 'POST CHECK-IN'}</span>
                </button>
              </form>
            </div>

            {/* Card 2: COMMUNITY CHECK-INS */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-2">
                  <Users size={16} className="text-brand-500" />
                  {vi ? 'COMMUNITY CHECK-INS' : 'COMMUNITY CHECK-INS'}
                </h3>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow">
                  {checkins.length || 3}
                </span>
              </div>

              {/* Check-in Posts Feed */}
              <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                {checkins.length > 0 ? (
                  checkins.slice(0, 5).map(chk => {
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
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl space-y-2 cursor-pointer hover:border-brand-500/50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={chk.user?.profile?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                              alt={chk.user?.profile?.fullName || 'User'}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                            <div>
                              <h5 className="text-xs font-extrabold text-slate-900 dark:text-white leading-none">
                                {chk.user?.profile?.fullName || chk.user?.email || 'Người dùng'}
                              </h5>
                              <span className="text-[10px] font-semibold text-slate-400">
                                {new Date(chk.createdAt).toLocaleTimeString(vi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <button type="button" className="text-slate-400 hover:text-slate-600 text-xs">•••</button>
                        </div>

                        {parsedNote && <p className="text-xs text-slate-700 dark:text-slate-300 italic font-medium">"{parsedNote}"</p>}

                        {imageUrl && (
                          <div className="h-24 w-full rounded-xl overflow-hidden shadow-sm">
                            <img src={imageUrl} alt="checkin" className="w-full h-full object-cover" />
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-brand-400">
                            <MapPin size={12} /> {chk.destination?.name || 'Vị trí'}
                          </span>
                          {tag && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                              {tag}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  [
                    {
                      id: 'c1',
                      user: 'mythanh thaithi',
                      time: '22:27',
                      comment: 'nước khá ngon',
                      place: 'quán cafe',
                      tag: 'CAFE',
                      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=300&q=80',
                      avatarBg: 'bg-orange-500'
                    },
                    {
                      id: 'c2',
                      user: 'Ẩn Nguyễn Bảo',
                      time: '22:18',
                      comment: 'studybox ace rộng rãi',
                      place: 'studybox',
                      tag: 'STUDY',
                      image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=300&q=80',
                      avatarBg: 'bg-emerald-600'
                    }
                  ].map(item => (
                    <div key={item.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full ${item.avatarBg} text-white font-extrabold text-xs flex items-center justify-center shadow`}>
                            {item.user.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h5 className="text-xs font-extrabold text-slate-900 dark:text-white leading-none">{item.user}</h5>
                            <span className="text-[10px] font-semibold text-slate-400">{item.time}</span>
                          </div>
                        </div>
                        <button type="button" className="text-slate-400 hover:text-slate-600 text-xs">•••</button>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 italic font-medium">"{item.comment}"</p>

                      {item.image && (
                        <div className="h-24 w-full rounded-xl overflow-hidden shadow-sm">
                          <img src={item.image} alt={item.place} className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-brand-400">
                          <MapPin size={12} /> {item.place}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                          {item.tag}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button type="button" className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-brand-600 dark:text-brand-400 text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer">
                <span>{vi ? 'Xem tất cả hoạt động' : 'View all activity'}</span>
                <ChevronRight size={14} className="stroke-[2.5px]" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default MapDashboard;
