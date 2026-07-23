import { useState, useEffect, useRef } from 'react';
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

  const socketRef = useRef<any>(null);
  const userLocationRef = useRef<[number, number] | null>(null);
  const selectedCenterRef = useRef<[number, number]>([21.028511, 105.804817]);
  const lastLocationSentRef = useRef<{ lat: number; lng: number; time: number }>({ lat: 0, lng: 0, time: 0 });
  const toast = useToast();

  const fetchIpLocation = async (): Promise<[number, number] | null> => {
    // Layer 1: ip-api.com (Free, no key needed, returns lat/lon)
    try {
      const res = await fetch('https://ip-api.com/json/');
      const data = await res.json();
      if (data && data.status === 'success' && data.lat && data.lon) {
        const coords: [number, number] = [data.lat, data.lon];
        setUserLocation(coords);
        userLocationRef.current = coords;
        setSelectedCenter(coords);
        console.log(`🎯 IP location acquired (ip-api.com):`, coords);
        return coords;
      }
    } catch (err) {
      console.warn('ip-api.com failed, trying ipwho.is...');
    }

    // Layer 2: ipwho.is (Free 10,000 req/month, returns latitude/longitude)
    try {
      const res = await fetch('https://ipwho.is/');
      const data = await res.json();
      if (data && data.success && data.latitude && data.longitude) {
        const coords: [number, number] = [data.latitude, data.longitude];
        setUserLocation(coords);
        userLocationRef.current = coords;
        setSelectedCenter(coords);
        console.log(`🎯 IP location acquired (ipwho.is):`, coords);
        return coords;
      }
    } catch (err) {
      console.warn('ipwho.is failed, trying ipapi.co...');
    }

    // Layer 3: ipapi.co
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        const coords: [number, number] = [data.latitude, data.longitude];
        setUserLocation(coords);
        userLocationRef.current = coords;
        setSelectedCenter(coords);
        console.log(`🎯 IP location acquired (ipapi.co):`, coords);
        return coords;
      }
    } catch (err) {
      console.warn('ipapi.co failed');
    }

    // Layer 4: Default fallback location (Cần Thơ)
    const defaultCoords: [number, number] = [10.03711, 105.78825];
    setUserLocation(defaultCoords);
    userLocationRef.current = defaultCoords;
    setSelectedCenter(defaultCoords);
    return defaultCoords;
  };

  const requestMyLocation = () => {
    if (!isAuthenticated) {
      toast.warning(vi ? 'Bạn cần đăng nhập để định vị vị trí của mình!' : 'You need to log in to acquire your location!');
      navigate('/auth', { state: { from: '/map' } });
      return;
    }

    if (!navigator.geolocation) {
      void fetchIpLocation().then(coords => {
        if (coords) {
          toast.location(
            vi ? `Đã xác định vị trí qua IP mạng!` : `Location acquired via IP!`,
            `[${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}]`,
            { title: vi ? 'Vị trí mạng IP' : 'Network IP Location' }
          );
        }
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords: [number, number] = [latitude, longitude];
        setUserLocation(coords);
        userLocationRef.current = coords;
        setSelectedCenter(coords);
        toast.location(
          vi ? `Đã định vị thành công vị trí GPS của bạn!` : `GPS Location acquired successfully!`,
          `[${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`,
          { title: vi ? 'Vị trí hiện tại' : 'Current Location' }
        );
        console.log(`🎯 User requested GPS location: [${latitude}, ${longitude}]`);
      },
      async (error) => {
        console.warn('⚠️ GPS Location denied/failed, switching to IP fallback:', error.message);
        const coords = await fetchIpLocation();
        if (coords) {
          toast.location(
            vi ? `Đã định vị vị trí của bạn qua IP mạng!` : `Location acquired via IP network!`,
            `[${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}]`,
            { title: vi ? 'Vị trí mạng IP' : 'Network IP Location' }
          );
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Core map states
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [routeQueue, setRouteQueue] = useState<MapLocation[]>([]);
  const [viewMode, setViewMode] = useState<'markers' | 'cluster' | 'heatmap'>('markers');
  const [selectedCenter, setSelectedCenter] = useState<[number, number]>([21.028511, 105.804817]);
  const [cachingProgress, setCachingProgress] = useState<number | null>(null);

  const [customDestName, setCustomDestName] = useState('');
  const [newNote, setNewNote] = useState('');
  const [checkinImage, setCheckinImage] = useState('');


  const [checkinTag, setCheckinTag] = useState('');

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
      : 'http://localhost:5000';
      
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
      // Don't display ourselves as a friend
      if (data.userId === user.id) return;

      setLiveFriends(prev => ({
        ...prev,
        [data.userId]: {
          ...data,
          updatedAt: new Date()
        }
      }));
    });

    socket.on('friend_offline', (data: { userId: string }) => {
      setLiveFriends(prev => {
        const copy = { ...prev };
        delete copy[data.userId];
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
                    className={`w-3.5 h-3.5 rounded-full border-2 cursor-pointer transition-all ${colorBg} ${
                      selectedPinColor === color ? 'border-white scale-125 shadow-md' : 'border-transparent hover:scale-115'
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

          <div className="flex items-center gap-1">
            <select
              value={selectedRadius}
              onChange={e => setSelectedRadius(Number(e.target.value))}
              className="bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-lg px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
            >
              <option value="0">-- {vi ? 'Bán kính' : 'Radius'} --</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="15">15 km</option>
              <option value="20">20 km</option>
            </select>
            <button
              onClick={handleFindNearby}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase rounded-lg transition-all border-none cursor-pointer flex items-center gap-1"
            >
              🔍 {vi ? 'Tìm quanh đây' : 'Find Nearby'}
            </button>
          </div>

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
            onCenterChange={setSelectedCenter}
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
            <input
              type="text"
              value={customDestName}
              onChange={e => setCustomDestName(e.target.value)}
              placeholder={vi ? 'Nhập tên địa điểm...' : 'Enter location name...'}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-normal)] rounded-lg px-2.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
            <p className="text-[9px] text-[var(--text-muted)] italic mt-1 pl-1">
              📌 {vi 
                ? `Vị trí ghim: ${userLocation ? 'GPS hiện tại của bạn' : 'Tâm bản đồ hiện tại'}`
                : `Pinned at: ${userLocation ? 'Your current GPS' : 'Current map center'}`}
            </p>

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

            <div className="flex gap-2 items-center justify-end">
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
