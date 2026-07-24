import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  MapPin, Users, Search, Sparkles, Loader2, Flame, Image, Navigation, Compass,
  CloudRain, AlertTriangle, Calendar
} from 'lucide-react';
import MapLibreMap, { MapLocation } from '../../components/Map/MapLibreMap';
import { mapService } from '../../services/smartTravel.service';
import type { RootState } from '../../store';
import { useLang } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { io } from 'socket.io-client';
import PostDetailModal from '../../components/feed/PostDetailModal';
import { journeyCategoryToFeedLabel, type FeedPost } from '../../utils/feedUtils';

const CAN_THO_COORDS: [number, number] = [10.03711, 105.78825];

const MapDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);
  const { t } = useLang();
  const vi = t('nav.feed') === 'Bảng tin';

  const socketRef = useRef<any>(null);
  const userLocationRef = useRef<[number, number] | null>(null);
  const selectedCenterRef = useRef<[number, number]>(CAN_THO_COORDS);
  const lastLocationSentRef = useRef<{ lat: number; lng: number; time: number }>({ lat: 0, lng: 0, time: 0 });
  const toast = useToast();

  const fetchIpLocation = async (): Promise<[number, number] | null> => {
    try {
      const res = await fetch('https://ip-api.com/json/');
      const data = await res.json();
      if (data && data.status === 'success' && data.lat && data.lon) {
        const coords: [number, number] = [data.lat, data.lon];
        setUserLocation(coords);
        userLocationRef.current = coords;
        setSelectedCenter(coords);
        console.log(`🎯 IP-based automatic location acquired:`, coords);
        return coords;
      }
    } catch (err) {
      console.warn('IP location fetch failed:', err);
    }
    return null;
  };

  const requestMyLocation = () => {
    if (!isAuthenticated) {
      toast.warning(vi ? 'Bạn cần đăng nhập để định vị vị trí của mình!' : 'You need to log in to acquire your location!');
      navigate('/auth', { state: { from: '/map' } });
      return;
    }

    if (!navigator.geolocation) {
      void fetchIpLocation().then((coords) => {
        if (coords) {
          toast.location(
            vi ? `Đã định vị tự động vị trí mạng (IP)!` : `Location acquired via IP!`,
            `[${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}]`,
            { title: vi ? 'Vị trí tự động' : 'Automatic Location' }
          );
        }
      });
      return;
    }

    toast.info(vi ? 'Đang tự động xác định vị trí GPS thực tế...' : 'Acquiring real GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords: [number, number] = [latitude, longitude];
        setUserLocation(coords);
        userLocationRef.current = coords;
        setSelectedCenter(coords);

        toast.location(
          vi ? `Đã định vị tự động vị trí của bạn!` : `Automatic Location Acquired!`,
          `[${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`,
          { title: vi ? 'Định vị tự động' : 'Auto Location' }
        );
        console.log(`🎯 Pure automatic geolocation: [${latitude}, ${longitude}]`);
      },
      async (error) => {
        console.warn('⚠️ GPS Location failed, fetching IP location:', error.message);
        const coords = await fetchIpLocation();
        if (coords) {
          toast.location(
            vi ? `Đã tự động xác định vị trí qua mạng IP!` : `Location acquired via IP!`,
            `[${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}]`,
            { title: vi ? 'Vị trí tự động' : 'Auto Location' }
          );
        } else {
          toast.error(
            vi ? `Không thể định vị tự động. Vui lòng bật quyền truy cập vị trí trên trình duyệt!` : `Unable to acquire location automatically. Enable browser GPS.`
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Core map states
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [routeQueue, setRouteQueue] = useState<MapLocation[]>([]);
  const [viewMode, setViewMode] = useState<'markers' | 'cluster' | 'heatmap'>('markers');
  const [selectedCenter, setSelectedCenter] = useState<[number, number]>(CAN_THO_COORDS);
  const [cachingProgress, setCachingProgress] = useState<number | null>(null);

  const [customDestName, setCustomDestName] = useState('');
  const [newNote, setNewNote] = useState('');
  const [checkinImages, setCheckinImages] = useState<string[]>([]);
  const [checkinTags, setCheckinTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState(['cafe', 'viewdep', 'food', 'nature', 'dulich', 'checkin']);
  const [showAddTagInput, setShowAddTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // GIS layers active state (lifted up to control from dashboard)
  const [showWeather, setShowWeather] = useState(false);
  const [showSafety, setShowSafety] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

  // Advanced search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRating, setFilterRating] = useState(0);
  const [tempCategory, setTempCategory] = useState('');
  const [tempRating, setTempRating] = useState(0);
  const [selectedPinColor, setSelectedPinColor] = useState<'red' | 'blue' | 'gold' | 'green' | 'purple'>('red');

  // AI recommendations states
  const [aiRecs, setAiRecs] = useState<any[]>([]);
  const [loadingAiRecs, setLoadingAiRecs] = useState(false);

  // AI assistant states
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [aiAssistantAnswer, setAiAssistantAnswer] = useState<string>('');
  const [loadingAiAssistant, setLoadingAiAssistant] = useState(false);
  const [detailPost, setDetailPost] = useState<FeedPost | null>(null);
  const closePost = () => setDetailPost(null);

  // WebSocket Live Friends locations
  const [liveFriends, setLiveFriends] = useState<Record<string, any>>({});

  // Browser real GPS location state
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number>(0);

  // Sync refs with latest state to prevent Socket.io recreation loop
  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  useEffect(() => {
    selectedCenterRef.current = selectedCenter;
  }, [selectedCenter]);

  useEffect(() => {
    if (selectedLocation && selectedLocation.id.startsWith('checkin-')) {
      const feedPost: FeedPost = {
        id: selectedLocation.id,
        displayType: 'social',
        destination: `📍 ${selectedLocation.name}`,
        destinationKey: selectedLocation.name.toLowerCase().replace(/\s+/g, '-'),
        postedAt: new Date(selectedLocation.time || Date.now()),
        date: selectedLocation.time || 'Trực tiếp',
        author: {
          name: selectedLocation.user || 'Người dùng',
          avatar: selectedLocation.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
          verified: false,
        },
        content: selectedLocation.note || '',
        likes: 0,
        comments: 0,
        bookmarks: 0,
        images: selectedLocation.imageUrl ? [selectedLocation.imageUrl] : [],
        category: selectedLocation.tag ? journeyCategoryToFeedLabel(selectedLocation.tag) : 'Check-in',
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
      };
      setDetailPost(feedPost);
      setSelectedLocation(null);
    }
  }, [selectedLocation]);

  const handleFindNearby = async () => {
    const lat = userLocation ? userLocation[0] : selectedCenter[0];
    const lng = userLocation ? userLocation[1] : selectedCenter[1];

    if (!lat || !lng) {
      alert(vi ? 'Vui lòng xác định vị trí hiện tại hoặc di chuyển tâm bản đồ!' : 'Please locate yourself or center the map first!');
      return;
    }

    if (selectedRadius === 0) {
      try {
        const dests = await mapService.destinations();
        if (Array.isArray(dests)) {
          setDestinations(dests);
          alert(vi ? 'Đã hiển thị lại toàn bộ địa điểm.' : 'Showing all destinations.');
        }
      } catch (err) {
        console.error('Failed to load destinations:', err);
      }
      return;
    }

    try {
      const dests = await mapService.destinations({ lat, lng, radius: selectedRadius });
      if (Array.isArray(dests)) {
        setDestinations(dests);
        alert(vi
          ? `Đã tìm thấy ${dests.length} địa điểm trong bán kính ${selectedRadius}km.`
          : `Found ${dests.length} destinations within ${selectedRadius}km.`
        );
      }
    } catch (err) {
      console.error('Failed to find nearby places:', err);
      alert(vi ? 'Không thể tìm địa điểm xung quanh. Hãy thử lại.' : 'Failed to search nearby places. Please try again.');
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

  useEffect(() => {
    loadMapData();
  }, []);

  // Request actual browser geolocation on mount with IP fallback chain
  useEffect(() => {
    if (!navigator.geolocation) {
      void fetchIpLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        userLocationRef.current = [latitude, longitude];
        setSelectedCenter([latitude, longitude]);
        console.log(`🎯 Auto-location on mount acquired: [${latitude}, ${longitude}]`);
      },
      (error) => {
        console.warn('⚠️ Auto-location on mount denied/failed:', error.message);
        void fetchIpLocation();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Request high-accuracy watch position for everyone to keep updating userLocation and center map
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        userLocationRef.current = [latitude, longitude];
      },
      (error) => {
        console.warn('⚠️ Real User Location watch error:', error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

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

  // WebSocket connection stable setup
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socketUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api/v1', '') 
      : window.location.origin;
      
    const socket = io(socketUrl, {
      transports: ['websocket']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Connected to Map WebSocket server:', socket.id);
      socket.emit('register_user', user.id);
      sendLocation();
    });

    socket.on('friend_location_updated', (data: any) => {
      // Don't display our exact same socket connection
      if (data.socketId === socket.id) return;

      setLiveFriends(prev => ({
        ...prev,
        [data.socketId || data.userId]: {
          ...data,
          updatedAt: new Date()
        }
      }));
    });

    socket.on('friend_offline', (data: { userId: string }) => {
      setLiveFriends(prev => {
        const copy = { ...prev };
        Object.keys(copy).forEach(key => {
          if (copy[key].userId === data.userId) {
            delete copy[key];
          }
        });
        return copy;
      });
    });

    const sendLocation = () => {
      const lat = userLocationRef.current ? userLocationRef.current[0] : selectedCenterRef.current[0];
      const lng = userLocationRef.current ? userLocationRef.current[1] : selectedCenterRef.current[1];
      if (lat && lng) {
        socket.emit('ping_location', {
          userId: user.id,
          fullName: user.fullName || user.email,
          avatarUrl: user.avatarUrl,
          lat,
          lng
        });
        lastLocationSentRef.current = { lat, lng, time: Date.now() };
      }
    };

    const interval = setInterval(sendLocation, 10000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
      socketRef.current = null;
    };
  }, [isAuthenticated, user]);

  // Separate effect to immediately push location changes, but throttled
  useEffect(() => {
    if (!isAuthenticated || !user || !socketRef.current) return;

    const lat = userLocation ? userLocation[0] : selectedCenter[0];
    const lng = userLocation ? userLocation[1] : selectedCenter[1];
    if (!lat || !lng) return;

    const now = Date.now();
    const dist = Math.hypot(lat - lastLocationSentRef.current.lat, lng - lastLocationSentRef.current.lng);

    // Send update if moved significantly (> ~10 meters) or if last sent was over 5s ago
    if (dist > 0.0001 || now - lastLocationSentRef.current.time > 5000) {
      if (socketRef.current.connected) {
        socketRef.current.emit('ping_location', {
          userId: user.id,
          fullName: user.fullName || user.email,
          avatarUrl: user.avatarUrl,
          lat,
          lng
        });
        lastLocationSentRef.current = { lat, lng, time: now };
      }
    }
  }, [userLocation, selectedCenter, isAuthenticated, user]);

  // Debounced Nominatim autocomplete suggestions for OSM mode
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) return;

    const delayDebounceFn = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&accept-language=vi`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'SmartTravelApp/1.0'
          }
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          const tempDests = data.map((item: any, idx: number) => ({
            id: `osm-place-${item.place_id || idx}-${Date.now()}`,
            name: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            category: item.type || 'place',
            averageRating: 5
          }));
          setDestinations(tempDests);
        }
      } catch (err) {
        console.error('Nominatim autocomplete failed:', err);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

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
      category: d.category,
      color: (selectedLocation && selectedLocation.id === d.id) ? selectedPinColor : (d.color || undefined)
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
      let imageUrls: string[] = [];
      let tag = '';
      let tags: string[] = [];
      if (c.note && c.note.startsWith('{') && c.note.endsWith('}')) {
        try {
          const parsed = JSON.parse(c.note);
          parsedNote = parsed.text || '';
          imageUrl = parsed.imageUrl || '';
          imageUrls = parsed.imageUrls || (parsed.imageUrl ? [parsed.imageUrl] : []);
          tag = parsed.tag || '';
          tags = parsed.tags || (parsed.tag ? [parsed.tag] : []);
        } catch (e) { }
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
        imageUrls: imageUrls,
        tag: tag,
        tags: tags,
        user: c.user?.profile?.fullName || c.user?.email || 'Người dùng',
        avatar: c.user?.profile?.avatarUrl || '',
        time: checkinTime,
        category: c.destination?.category || 'checkin'
      });
    });

    const mappedFriends: MapLocation[] = [];

    // Add current user (whether logged in or guest) to live markers
    if (userLocation) {
      mappedFriends.push({
        id: `live-current-user-${user?.id || 'guest'}`,
        name: vi ? 'Vị trí của bạn (Thực tế)' : 'Your Location (Actual GPS)',
        lat: userLocation[0],
        lng: userLocation[1],
        user: user?.fullName || user?.email || (vi ? 'Khách vãng lai' : 'Guest'),
        avatar: user?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
        category: 'CURRENT_USER',
        time: vi ? 'Trực tiếp' : 'Live'
      });
    }

    if (isAuthenticated && user) {
      const userLat = userLocation ? userLocation[0] : selectedCenter[0];
      const userLng = userLocation ? userLocation[1] : selectedCenter[1];

      const now = Date.now();
      Object.values(liveFriends)
        .filter((f: any) => {
          // Keep only updates from last 30 seconds to prevent ghost pins
          const lastUpdated = new Date(f.updatedAt).getTime();
          return now - lastUpdated < 30000;
        })
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
        // Show all online users during testing (no distance limit)
        // .filter(f => f.distance <= 100)
        .forEach(f => {
          mappedFriends.push({
            id: `live-${f.socketId || f.userId}`,
            name: `${f.fullName} (${f.distance.toFixed(1)} km)`,
            lat: f.lat,
            lng: f.lng,
            user: f.fullName,
            avatar: f.avatarUrl,
            category: 'LIVE_FRIEND',
            time: new Date(f.updatedAt).toLocaleTimeString(vi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })
          });
        });
    }

    const finalLocations = [...mappedDests, ...mappedCheckins, ...mappedFriends];

    if (selectedLocation &&
      (selectedLocation.id.startsWith('osm-place-') || selectedLocation.id.startsWith('google-place-')) &&
      !finalLocations.some(l => l.id === selectedLocation.id)) {
      finalLocations.push({ ...selectedLocation, color: selectedPinColor });
    }

    setLocations(finalLocations);
  }, [destinations, checkins, liveFriends, filterCategory, filterRating, searchQuery, userLocation, user, isAuthenticated, vi, selectedLocation, selectedPinColor]);

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: '/map' } });
      return;
    }
    if (!customDestName.trim()) {
      alert(vi ? 'Vui lòng nhập tên địa điểm!' : 'Please enter a place name!');
      return;
    }

    const lat = userLocation ? userLocation[0] : selectedCenter[0];
    const lng = userLocation ? userLocation[1] : selectedCenter[1];

    try {
      const finalPayload = JSON.stringify({
        text: newNote,
        imageUrl: checkinImages[0] || '',
        imageUrls: checkinImages,
        tag: checkinTags[0] || '',
        tags: checkinTags
      });
      const response = await mapService.checkIn('', finalPayload, customDestName.trim(), lat, lng);
      setCheckins(prev => [response, ...prev]);
      setNewNote('');
      setCustomDestName('');
      setCheckinImages([]);
      setCheckinTags([]);

      setSelectedCenter([lat, lng]);
      setSelectedLocation({
        id: `checkin-${response.id}`,
        name: response.destination?.name || customDestName.trim(),
        lat,
        lng,
        note: newNote,
        imageUrl: checkinImages[0] || '',
        imageUrls: checkinImages,
        tag: checkinTags[0] || '',
        tags: checkinTags,
        user: response.user?.profile?.fullName || response.user?.email || 'Người dùng',
        avatar: response.user?.profile?.avatarUrl || ''
      });

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

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    // Use OpenStreetMap's free Nominatim geocoding API to search globally
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&accept-language=vi`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'SmartTravelApp/1.0'
        }
      });
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const osmLocations: MapLocation[] = data.map((item: any, idx: number) => ({
          id: `osm-place-${item.place_id || idx}-${Date.now()}`,
          name: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          category: item.type || 'place',
          color: selectedPinColor
        }));

        setLocations(prev => {
          const filtered = prev.filter(l => !l.id.startsWith('osm-place-') && !l.id.startsWith('google-place-'));
          return [...filtered, ...osmLocations];
        });

        const first = osmLocations[0];
        setSelectedCenter([first.lat, first.lng]);
        setSelectedLocation(first);

        const tempDests = osmLocations.map(loc => ({
          id: loc.id,
          name: loc.name,
          latitude: loc.lat,
          longitude: loc.lng,
          category: loc.category,
          color: loc.color,
          averageRating: 5
        }));
        setDestinations(tempDests as any);
        return;
      }
    } catch (err) {
      console.error('Nominatim search failed, falling back to local database:', err);
    }

    // Default local database fallback
    try {
      const dests = await mapService.destinations({ q: searchQuery });
      if (Array.isArray(dests)) {
        setDestinations(dests);
        if (dests.length > 0) {
          setSelectedCenter([dests[0].latitude, dests[0].longitude]);
        } else {
          alert(vi ? 'Không tìm thấy địa điểm nào khớp với từ khóa.' : 'No destinations found matching keyword.');
        }
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleSelectDestination = (d: any) => {
    setSelectedCenter([d.latitude, d.longitude]);
    const newLoc: MapLocation = {
      id: d.id,
      name: d.name,
      lat: d.latitude,
      lng: d.longitude,
      category: d.category,
      color: selectedPinColor
    };

    if (d.id.startsWith('osm-place-') || d.id.startsWith('google-place-')) {
      setLocations(prev => {
        const filtered = prev.filter(l => !l.id.startsWith('osm-place-') && !l.id.startsWith('google-place-'));
        return [...filtered, newLoc];
      });
    }

    setSelectedLocation(newLoc);
    setSearchQuery(d.name);
  };

  const handleApplyFilter = () => {
    setFilterCategory(tempCategory);
    setFilterRating(tempRating);
  };

  const handleGetAiRecommendations = async () => {
    if (!isAuthenticated) {
      alert(vi ? 'Bạn cần đăng nhập để sử dụng tính năng Đề xuất AI lân cận!' : 'You need to log in to use AI Recommendations!');
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
    } catch (err) {
      console.error('Failed to get AI Assistant answer:', err);
      setAiAssistantAnswer(vi ? 'Có lỗi xảy ra khi hỏi Trợ lý AI.' : 'Failed to ask AI Assistant.');
    } finally {
      setLoadingAiAssistant(false);
    }
  };
  const suggestionsToDisplay = destinations.filter(d => {
    if (d.id.startsWith('osm-place-') || d.id.startsWith('google-place-')) return true;
    return d.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start p-5 max-w-screen-2xl mx-auto animate-fade-in">
      {/* COLUMN 1: Search, Filter, AI Recommendations (Left Column, span 3) */}
      <div className="lg:col-span-3 flex flex-col gap-5 h-[620px] overflow-y-auto pr-1">
        {/* 1. Search Box with Autocomplete */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-4 space-y-2 relative rounded-xl shadow-sm">
          <h3 className="font-ui text-xs font-black uppercase tracking-widest text-[var(--gold)] flex items-center gap-1.5">
            <Search size={12} /> {vi ? 'Tìm địa điểm' : 'Search Place'}
          </h3>
          <form onSubmit={handleSearchSubmit} className="flex gap-2 relative">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={vi ? 'Nhập tên địa điểm...' : 'Search place...'}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-lg px-3 py-2 pl-8 pr-7 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <Search size={12} className="absolute left-2.5 top-3 text-[var(--text-muted)]" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] border-none bg-transparent cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg border-none cursor-pointer transition-all shrink-0"
            >
              {vi ? 'Tìm' : 'Search'}
            </button>
          </form>

          {/* Color Picker for searched pin */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-normal)] mt-2">
            <span className="text-[10px] text-[var(--text-secondary)] font-semibold">
              {vi ? 'Màu sắc ghim:' : 'Pin color:'}
            </span>
            <div className="flex gap-1.5">
              {(['red', 'blue', 'gold', 'green', 'purple'] as const).map(color => {
                const colorBg = {
                  red: 'bg-red-500',
                  blue: 'bg-blue-500',
                  gold: 'bg-yellow-500',
                  green: 'bg-emerald-500',
                  purple: 'bg-purple-500',
                }[color];
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedPinColor(color)}
                    className={`w-3.5 h-3.5 rounded-full border-2 cursor-pointer transition-all ${colorBg} ${selectedPinColor === color ? 'border-white scale-125 shadow-md' : 'border-transparent hover:scale-115'
                      }`}
                    title={color.toUpperCase()}
                  />
                );
              })}
            </div>
          </div>
          {searchQuery && suggestionsToDisplay.length > 0 && (
            <div className="absolute left-0 right-0 top-full bg-[var(--bg-elevated)] border border-[var(--border-normal)] rounded-lg mt-1 max-h-40 overflow-y-auto z-30 shadow-2xl p-1">
              {suggestionsToDisplay
                .slice(0, 5)
                .map(d => (
                  <div
                    key={d.id}
                    onClick={() => handleSelectDestination(d)}
                    className="px-3 py-1.5 hover:bg-[var(--bg-overlay)] text-[10px] text-[var(--text-primary)] rounded cursor-pointer truncate"
                  >
                    {d.id.startsWith('osm-place-') ? '🌐' : '📍'} {d.name} <span className="text-[8px] text-slate-400">({d.category})</span>
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
              value={tempCategory}
              onChange={e => setTempCategory(e.target.value)}
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
              value={tempRating}
              onChange={e => setTempRating(Number(e.target.value))}
              className="bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
            >
              <option value="0">{vi ? 'Đánh giá' : 'Rating'}</option>
              <option value="4">★ 4.0+</option>
              <option value="4.5">★ 4.5+</option>
            </select>
          </div>
          <button
            onClick={handleApplyFilter}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg border-none cursor-pointer transition-all flex items-center justify-center gap-1"
          >
            🧭 {vi ? 'Áp dụng bộ lọc' : 'Apply Filter'}
          </button>
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
        {selectedLocation && !selectedLocation.id.startsWith('live-') && (
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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${viewMode === 'markers'
                  ? 'bg-blue-600 text-white shadow-sm border border-transparent'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-normal)]'
                }`}
            >
              <MapPin size={12} className={viewMode === 'markers' ? 'text-white' : 'text-blue-500'} />
              <span>{vi ? 'Ghim' : 'Pins'}</span>
            </button>
            <button
              onClick={() => setViewMode('cluster')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${viewMode === 'cluster'
                  ? 'bg-blue-600 text-white shadow-sm border border-transparent'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-normal)]'
                }`}
            >
              <Users size={12} className={viewMode === 'cluster' ? 'text-white' : 'text-blue-500'} />
              <span>{vi ? 'Nhóm' : 'Clusters'}</span>
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${viewMode === 'heatmap'
                  ? 'bg-blue-600 text-white shadow-sm border border-transparent'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-normal)]'
                }`}
            >
              <Flame size={12} className={viewMode === 'heatmap' ? 'text-white' : 'text-orange-500'} />
              <span>{vi ? 'Nhiệt' : 'Heatmap'}</span>
            </button>
          </div>
        </div>

        {/* Unified Map & GIS Control Panel */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-3 rounded-2xl shadow-sm space-y-3">
          {/* Row 1: GIS switcher */}
          <div className="flex items-center gap-2 pb-2.5 border-b border-[var(--border-normal)]/40">
            <span className="text-xs font-bold text-[var(--text-secondary)] pl-2 pr-1 select-none">GIS:</span>
            
            {/* Weather Station */}
            <button
              type="button"
              onClick={() => setShowWeather(prev => !prev)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                showWeather 
                  ? 'bg-[var(--gold-glow)] text-[var(--gold)] border-[var(--gold)]/30 shadow-sm' 
                  : 'bg-transparent text-[var(--gold)]/80 border-[var(--border-subtle)] hover:bg-[var(--bg-overlay)]'
              }`}
            >
              <CloudRain size={13} className={showWeather ? 'text-[var(--gold)]' : 'text-[var(--gold)]/80'} />
              <span>{vi ? 'Khí tượng' : 'Weather'}</span>
            </button>

            {/* Safety Warning */}
            <button
              type="button"
              onClick={() => setShowSafety(prev => !prev)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                showSafety 
                  ? 'bg-red-500/15 text-red-500 border-red-500/30 shadow-sm' 
                  : 'bg-transparent text-red-500/75 border-[var(--border-subtle)] hover:bg-[var(--bg-overlay)]'
              }`}
            >
              <AlertTriangle size={13} className={showSafety ? 'text-red-500' : 'text-red-500/75'} />
              <span>{vi ? 'Cảnh báo' : 'Safety'}</span>
            </button>

            {/* Events */}
            <button
              type="button"
              onClick={() => setShowEvents(prev => !prev)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                showEvents 
                  ? 'bg-purple-500/15 text-purple-500 border-purple-500/30 shadow-sm' 
                  : 'bg-transparent text-purple-500/75 border-[var(--border-subtle)] hover:bg-[var(--bg-overlay)]'
              }`}
            >
              <Calendar size={13} className={showEvents ? 'text-purple-500' : 'text-purple-500/75'} />
              <span>{vi ? 'Lễ hội' : 'Events'}</span>
            </button>
          </div>

          {/* Row 2: Route Planner Actions */}
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={requestMyLocation}
              className="h-[34px] px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-[10.5px] font-bold uppercase rounded-xl transition-all hover:shadow-md hover:shadow-blue-600/20 active:scale-95 cursor-pointer border-none flex items-center justify-center gap-1.5 shrink-0"
            >
              🎯 {vi ? 'Định vị của tôi' : 'Locate Me'}
            </button>

            <select
              value={selectedRadius}
              onChange={e => setSelectedRadius(Number(e.target.value))}
              className="bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-xl px-3 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer h-[34px] font-medium"
            >
              <option value="0">-- {vi ? 'Bán kính' : 'Radius'} --</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="15">15 km</option>
              <option value="20">20 km</option>
            </select>

            <button
              onClick={handleFindNearby}
              className="h-[34px] px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-[10.5px] font-bold uppercase rounded-xl transition-all hover:shadow-md hover:shadow-blue-600/20 active:scale-95 cursor-pointer border-none flex items-center justify-center gap-1.5 shrink-0"
            >
              🔍 {vi ? 'Tìm quanh đây' : 'Find Nearby'}
            </button>

            <button
              onClick={handleOptimizeTSP}
              disabled={routeQueue.length < 3}
              className={`h-[34px] px-3.5 text-[10.5px] font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 border-none cursor-pointer active:scale-95 ${
                routeQueue.length < 3
                  ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-[var(--border-subtle)] cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md hover:shadow-blue-600/20'
              }`}
            >
              ⚡ {vi ? 'Tối ưu tuyến đường (TSP)' : 'Optimize Route (TSP)'}
            </button>

            <button
              onClick={handleCacheTiles}
              disabled={cachingProgress !== null}
              className={`h-[34px] px-3.5 text-[10.5px] font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 border-none cursor-pointer active:scale-95 ${
                cachingProgress !== null
                  ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-[var(--border-subtle)] cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md hover:shadow-blue-600/20'
              }`}
            >
              💾 {vi ? 'Tải bản đồ ngoại tuyến' : 'Cache Offline Map'}
            </button>

            {routeQueue.length > 0 && (
              <button
                onClick={() => setRouteQueue([])}
                className="h-[34px] px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 text-[10.5px] font-bold uppercase rounded-xl transition-all border border-red-200 dark:border-red-800/30 cursor-pointer flex items-center justify-center"
              >
                {vi ? 'Xoá lộ trình' : 'Clear Route'}
              </button>
            )}
          </div>
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
            onCenterChange={setSelectedCenter}
            showWeather={showWeather}
            showSafety={showSafety}
            showEvents={showEvents}
          />
        </div>
      </div>

      {/* COLUMN 3: Live Friends & Check-Ins (Right Column, span 3) */}
      <div className="lg:col-span-3 flex flex-col gap-5 h-[620px]">
        {/* check-in form */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-3.5 space-y-2.5 rounded-xl shadow-sm">
          <h3 className="font-ui text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
            <MapPin size={14} className="text-blue-600" /> {vi ? 'CHECK-IN ĐỊA ĐIỂM' : 'CHECK-IN LOCATION'}
          </h3>
          <form onSubmit={handleCheckin} className="space-y-2.5">
            <div>
              <input
                type="text"
                value={customDestName}
                onChange={e => setCustomDestName(e.target.value)}
                placeholder={vi ? 'Nhập tên địa điểm...' : 'Enter location name...'}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-[var(--text-muted)]"
                required
              />
              <p className="text-[9px] text-[var(--text-muted)] mt-1 pl-1 flex items-center gap-1 font-medium">
                <span className="text-rose-500">📍</span> {vi
                  ? `Vị trí ghim: ${userLocation ? 'GPS hiện tại của bạn' : 'Tâm bản đồ hiện tại'}`
                  : `Pinned at: ${userLocation ? 'Your current GPS' : 'Current map center'}`}
              </p>
            </div>

            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder={vi ? 'Bạn đang nghĩ gì về nơi này?...' : 'What do you think about this place?...'}
              rows={2}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-[var(--text-muted)]"
            />

            {/* Hashtag Buttons */}
            <div className="flex flex-wrap gap-1 pt-0.5 items-center">
              {availableTags.map(tag => {
                const active = checkinTags.includes(tag);
                return (
                  <div key={tag} className="relative inline-block mr-1 my-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCheckinTags(prev => 
                          prev.includes(tag)
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        );
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-semibold transition-all cursor-pointer border ${
                        active
                          ? 'bg-[var(--gold-glow)] text-[var(--gold)] border-[var(--gold)]/40 shadow-sm'
                          : 'bg-[var(--gold-glow)]/20 text-[var(--gold)]/80 border-[var(--gold)]/5 hover:bg-[var(--gold-glow)]/40'
                      }`}
                    >
                      #{tag}
                    </button>
                    {/* Delete Tag Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Remove from active selection
                        setCheckinTags(prev => prev.filter(t => t !== tag));
                        // Remove from available tags list
                        setAvailableTags(prev => prev.filter(t => t !== tag));
                      }}
                      className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[7px] font-extrabold cursor-pointer border-none shadow-sm transition-colors z-10"
                      title={vi ? 'Xóa tag' : 'Delete tag'}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}

              {showAddTagInput ? (
                <input
                  type="text"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  placeholder={vi ? 'Nhập tag...' : 'Tag...'}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const cleanTag = newTagName.trim().toLowerCase().replace(/^#/, '');
                      if (cleanTag) {
                        if (!availableTags.includes(cleanTag)) {
                          setAvailableTags(prev => [...prev, cleanTag]);
                        }
                        if (!checkinTags.includes(cleanTag)) {
                          setCheckinTags(prev => [...prev, cleanTag]);
                        }
                      }
                      setNewTagName('');
                      setShowAddTagInput(false);
                    } else if (e.key === 'Escape') {
                      setNewTagName('');
                      setShowAddTagInput(false);
                    }
                  }}
                  onBlur={() => {
                    const cleanTag = newTagName.trim().toLowerCase().replace(/^#/, '');
                    if (cleanTag) {
                      if (!availableTags.includes(cleanTag)) {
                        setAvailableTags(prev => [...prev, cleanTag]);
                      }
                      if (!checkinTags.includes(cleanTag)) {
                        setCheckinTags(prev => [...prev, cleanTag]);
                      }
                    }
                    setNewTagName('');
                    setShowAddTagInput(false);
                  }}
                  className="bg-[var(--bg-primary)] border border-blue-500 rounded-full px-2 py-0.5 text-[9.5px] text-[var(--text-primary)] focus:outline-none w-[75px] transition-all"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddTagInput(true)}
                  className="px-2.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-transparent text-[var(--text-muted)] border border-dashed border-[var(--border-normal)] hover:text-[var(--text-primary)] hover:border-blue-500/50 hover:bg-[var(--bg-overlay)] transition-all cursor-pointer"
                >
                  + {vi ? 'Thêm tag' : 'Tag'}
                </button>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 bg-transparent hover:bg-[var(--bg-overlay)] border border-dashed border-[var(--border-normal)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-blue-500/50 rounded-full text-xs font-semibold cursor-pointer transition-all">
                <Image size={13} className="text-[var(--text-muted)]" />
                <span>
                  {checkinImages.length > 0 
                    ? (vi ? `Đã chọn ${checkinImages.length}/3 ảnh` : `${checkinImages.length}/3 Photos Selected`)
                    : (vi ? 'Thêm ảnh (Tối đa 3)' : 'Add Photos (Max 3)')}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={checkinImages.length >= 3}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    const remaining = 3 - checkinImages.length;
                    const toProcess = files.slice(0, remaining);
                    for (const file of toProcess) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setCheckinImages(prev => {
                          if (prev.length >= 3) return prev;
                          return [...prev, reader.result as string];
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>

              {checkinImages.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {checkinImages.map((img, idx) => (
                    <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-[var(--border-normal)] shadow-sm font-sans">
                      <img src={img} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCheckinImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-0.5 right-0.5 bg-red-600/80 hover:bg-red-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold cursor-pointer border-none transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white text-xs font-bold uppercase rounded-lg transition-all shadow-md hover:shadow-blue-600/20 active:scale-[0.98] cursor-pointer border-none"
            >
              <Navigation size={12} className="fill-white" />
              <span>{vi ? 'Đăng Check-In' : 'Post Check-In'}</span>
            </button>
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
                let imageUrls: string[] = [];
                let tag = '';
                let tags: string[] = [];
                if (chk.note && chk.note.startsWith('{') && chk.note.endsWith('}')) {
                  try {
                    const parsed = JSON.parse(chk.note);
                    parsedNote = parsed.text || '';
                    imageUrl = parsed.imageUrl || '';
                    imageUrls = parsed.imageUrls || (parsed.imageUrl ? [parsed.imageUrl] : []);
                    tag = parsed.tag || '';
                    tags = parsed.tags || (parsed.tag ? [parsed.tag] : []);
                  } catch (e) { }
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
                        imageUrls: imageUrls,
                        tag: tag,
                        tags: tags,
                        user: chk.user?.profile?.fullName || chk.user?.email || 'Người dùng',
                        avatar: chk.user?.profile?.avatarUrl || ''
                      });
                    }}
                    className="p-2 bg-[var(--bg-primary)] hover:bg-[var(--bg-overlay)] border border-[var(--border-normal)] rounded-xl transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={chk.user?.id ? `/profile/${chk.user.id}` : '#'}
                        onClick={(e) => e.stopPropagation()}
                        className="block hover:scale-105 transition-transform cursor-pointer flex-shrink-0"
                      >
                        <img
                          src={chk.user?.profile?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                          alt={chk.user?.profile?.fullName || 'User'}
                          className="w-6 h-6 rounded-full object-cover border border-[var(--border-normal)]"
                        />
                      </Link>
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
      <PostDetailModal
        post={detailPost}
        onClose={closePost}
        labels={{
          close: vi ? 'Đóng' : 'Close',
          readTime: '',
          likes: vi ? 'lượt thích' : 'likes',
          comments: vi ? 'bình luận' : 'comments',
        }}
      />
    </div>
  );
};

export default MapDashboard;
