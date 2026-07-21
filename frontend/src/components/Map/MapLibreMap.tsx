import React, { useEffect, useRef, useState } from 'react';
import Map, { Source, Layer, Popup, Marker, NavigationControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import { useLang } from '../../contexts/LanguageContext';
import { mapService } from '../../services/smartTravel.service';
import { CloudRain, Car, AlertTriangle, Calendar, Compass, ListTodo, MapPin } from 'lucide-react';

export interface MapLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  note?: string;
  user?: string;
  avatar?: string;
  category?: string;
  time?: string;
  address?: string;
  imageUrl?: string;
  tag?: string;
  allCheckins?: { user: string; avatar: string; note: string; time: string }[];
}

interface MapLibreMapProps {
  center?: [number, number];
  zoom?: number;
  locations?: MapLocation[];
  viewMode?: 'markers' | 'cluster' | 'heatmap';
  routePoints?: MapLocation[];
  onAddPointToRoute?: (loc: MapLocation) => void;
  onRemovePointFromRoute?: (id: string) => void;
  aiRecommendedIds?: string[];
  weatherInfo?: { condition: string; temp: string };
  onSelectLocation?: (loc: MapLocation | null) => void;
  destination?: string;
  onCenterChange?: (center: [number, number]) => void;
}

// Math helpers for client-side distance and bounding box calculations
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

function createGeoJSONCircle(center: [number, number], radiusKm: number, points = 32) {
  const [lat, lng] = center;
  const coords: [number, number][] = [];
  const distanceX = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  const distanceY = radiusKm / 110.57;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([lng + x, lat + y]);
  }
  coords.push(coords[0]); // close the polygon

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  } as any;
}

const STREET_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const SATELLITE_STYLE: any = {
  version: 8,
  sources: {
    'satellite-tiles': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    },
  },
  layers: [
    {
      id: 'satellite-layer',
      type: 'raster',
      source: 'satellite-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const svgRedString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="#ef4444">
  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
</svg>
`;

const svgGoldString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="#d4af37">
  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
</svg>
`;

const svgBlueString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="#3b82f6">
  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
</svg>
`;

const svgGreenString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="#10b981">
  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
</svg>
`;

const svgEventString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="#a855f7">
  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z"/>
</svg>
`;

const svgUserString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30">
  <circle cx="12" cy="12" r="10" fill="#3b82f6" fill-opacity="0.3">
    <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" />
  </circle>
  <circle cx="12" cy="12" r="6" fill="#3b82f6" stroke="#ffffff" stroke-width="2" />
</svg>
`;

const svgFoodString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="#f97316">
  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm2.5 6c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-6.5.5V11H6.5v-2.5h-1c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h2.5c.28 0 .5.22.5.5v3.5c0 .28-.22.5-.5.5zm11 1.5v3c0 .55-.45 1-1 1h-1.5v3.5c0 .28-.22.5-.5.5s-.5-.22-.5-.5V12h-1c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1H18c.28 0 .5.22.5.5v3.5c0 .28-.22.5-.5.5z"/>
</svg>
`;

const svgHotelString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="#a855f7">
  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm5 11c0 .55-.45 1-1 1h-2v1.5c0 .28-.22.5-.5.5s-.5-.22-.5-.5V14H9v3.5c0 .28-.22.5-.5.5s-.5-.22-.5-.5V12c0-.55.45-1 1-1h7c.55 0 1 .45 1 1z"/>
</svg>
`;

const svgCafeString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="#ec4899">
  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm4 10h-2V9.5c0-.28-.22-.5-.5-.5s-.5.22-.5.5V12H9v-2.5c0-.28-.22-.5-.5-.5s-.5.22-.5.5V12c0 .55.45 1 1 1h7c.55 0 1-.45 1-1z"/>
</svg>
`;

const svgNatureString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="#10b981">
  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm1.75 8l-1.3-1.74c-.2-.27-.6-.27-.8 0L10.25 10H8.5c-.41 0-.75.34-.75.75s.34.75.75.75h1.15l1.05 1.4c.2.27.6.27.8 0l1.05-1.4h1.7c.41 0 .75-.34.75-.75s-.34-.75-.75-.75h-.5z"/>
</svg>
`;

const createPopupContent = (loc: MapLocation, vi: boolean, hasRouteCallback: boolean, allLocations: MapLocation[] = []) => {
  const isCheckin = !!loc.user;
  const isLive = loc.id.startsWith('live-');
  const timeStr = loc.time ? `<p class="text-[10px] text-slate-400 mt-0.5">${loc.time}</p>` : '';
  const noteStr = loc.note ? `<p class="text-xs text-slate-300 italic mt-1.5">"${loc.note}"</p>` : '';
  
  const badge = isLive ? `<span class="text-[8px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded ml-1.5">Live</span>` : '';

  // Tìm check-in mới nhất của người dùng này nếu đây là Marker Live Tracking
  let finalImageUrl = loc.imageUrl || '';
  if (isLive && !finalImageUrl && loc.user) {
    const userCheckin = allLocations.find(l => l.id.startsWith('checkin-') && l.user === loc.user && l.imageUrl);
    if (userCheckin) {
      finalImageUrl = userCheckin.imageUrl || '';
    }
  }

  const imageHtml = finalImageUrl 
    ? `<div class="mt-2 rounded-lg overflow-hidden border border-slate-700 max-h-32 flex items-center justify-center bg-black/10">
        <img src="${finalImageUrl}" class="w-full h-full object-cover" />
       </div>`
    : '';

  const headerHtml = isCheckin
    ? `
      <div class="flex items-center gap-2">
        <img src="${loc.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}" class="w-8 h-8 rounded-full object-cover border border-slate-700" />
        <div>
          <h4 class="text-xs font-black text-white leading-none flex items-center">${loc.user}${badge}</h4>
          ${timeStr}
        </div>
      </div>
    `
    : `
      <div>
        <h4 class="text-xs font-black text-amber-400 leading-none">${loc.name}</h4>
        <span class="text-[9px] uppercase tracking-wider font-bold text-slate-400 mt-1 block">${loc.category || 'Destination'}</span>
      </div>
    `;

  let allCheckinsHtml = '';
  if (loc.allCheckins && loc.allCheckins.length > 1) {
    const listHtml = loc.allCheckins.slice(1).map(c => `
      <div class="flex items-start gap-1.5 border-t border-slate-800/80 pt-1.5 mt-1.5">
        <img src="${c.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}" class="w-5 h-5 rounded-full object-cover border border-slate-800 mt-0.5" />
        <div class="flex-1 min-w-0">
          <p class="text-[9px] font-bold text-white leading-none">${c.user}</p>
          <p class="text-[7.5px] text-slate-400">${c.time}</p>
          ${c.note ? `<p class="text-[9px] text-slate-300 italic mt-0.5 leading-tight">"${c.note}"</p>` : ''}
        </div>
      </div>
    `).join('');
    
    allCheckinsHtml = `
      <div class="mt-2.5 pt-2 border-t border-slate-850">
        <div class="text-[8px] font-black text-amber-500/90 uppercase tracking-widest mb-1.5">
          ${vi ? `Và ${loc.allCheckins.length - 1} lượt check-in khác:` : `And ${loc.allCheckins.length - 1} other check-ins:`}
        </div>
        <div class="max-h-28 overflow-y-auto space-y-1.5 pr-1">
          ${listHtml}
        </div>
      </div>
    `;
  }

  return `
    <div class="space-y-2.5 text-slate-100 max-w-[260px]">
      ${headerHtml}
      ${noteStr}
      ${imageHtml}
      <div class="text-[10px] text-yellow-500 font-bold flex items-center gap-1 mt-1">📍 ${loc.name || (isLive ? 'Live Tracking' : '')}</div>
      ${allCheckinsHtml}
      ${hasRouteCallback ? `
      <button 
        onclick="window.addPointToRoute('${loc.id}')"
        class="mt-2.5 w-full bg-[#d4af37] text-black text-[10px] font-bold py-1.5 px-3 rounded-lg hover:bg-amber-400 transition-all cursor-pointer border-none"
      >
        ${vi ? '+ Thêm vào lộ trình' : '+ Add to Route'}
      </button>` : ''}
    </div>
  `;
};

function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

const DEFAULT_WEATHER = { condition: 'Sunny', temp: '28' };

export const MapLibreMap: React.FC<MapLibreMapProps> = ({
  center = [21.028511, 105.804817],
  zoom = 13,
  locations = [],
  viewMode = 'markers',
  routePoints = [],
  onAddPointToRoute,
  onRemovePointFromRoute,
  aiRecommendedIds = [],
  weatherInfo = DEFAULT_WEATHER,
  onSelectLocation,
  destination,
  onCenterChange,
}) => {
  const { lang } = useLang();
  const vi = lang === 'vi';
  const mapRef = useRef<any>(null);
  
  // Local Map style & view switches
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite' | 'dark' | 'light' | '3d'>('street');
  const [viewType, setViewType] = useState<'map' | 'timeline'>(() => {
    return isWebGLSupported() ? 'map' : 'timeline';
  });

  // GIS layers active state
  const [showWeather, setShowWeather] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [showSafety, setShowSafety] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

  // Dynamic GIS fetched data
  const [warnings, setWarnings] = useState<any[]>([]);
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [weatherDataState, setWeatherDataState] = useState(weatherInfo);

  const lastWeatherRef = useRef(weatherInfo);
  useEffect(() => {
    if (weatherInfo && (weatherInfo.condition !== lastWeatherRef.current?.condition || weatherInfo.temp !== lastWeatherRef.current?.temp)) {
      lastWeatherRef.current = weatherInfo;
      setWeatherDataState(weatherInfo);
    }
  }, [weatherInfo?.condition, weatherInfo?.temp]);

  useEffect(() => {
    if (!destination) return;
    const fetchWeather = async () => {
      try {
        const res = await mapService.weather({ location: destination });
        if (res && res.temperature) {
          setWeatherDataState({
            condition: res.condition,
            temp: res.temperature.replace('°C', '')
          });
        }
      } catch (err) {
        console.error('[MapLibreMap] Failed to fetch weather:', err);
      }
    };
    fetchWeather();
  }, [destination]);

  const [activePopup, setActivePopup] = useState<MapLocation | null>(null);

  const [viewState, setViewState] = useState({
    latitude: Number(center[0]) || 21.028511,
    longitude: Number(center[1]) || 105.804817,
    zoom: zoom,
    pitch: 0,
    bearing: 0,
  });

  // Sync center and flyTo smoothly when prop changes
  const lastSyncedCenter = useRef<[number, number]>([0, 0]);
  useEffect(() => {
    const lat = Number(center[0]);
    const lng = Number(center[1]);
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

    const latDiff = Math.abs(lat - lastSyncedCenter.current[0]);
    const lngDiff = Math.abs(lng - lastSyncedCenter.current[1]);

    if (latDiff > 0.0001 || lngDiff > 0.0001) {
      lastSyncedCenter.current = [lat, lng];
      setViewState(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));

      const map = mapRef.current?.getMap();
      if (map) {
        map.flyTo({
          center: [lng, lat],
          zoom: 14,
          essential: true,
          duration: 1200
        });
      }
    }
  }, [center[0], center[1]]);

  // Fetch Safety Warnings and Events for the map area
  useEffect(() => {
    const fetchGISData = async () => {
      const lat = Number(center[0]);
      const lng = Number(center[1]);
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;
      try {
        const [warns, evts] = await Promise.all([
          mapService.safetyWarnings({ lat, lng, radius: 50 }),
          mapService.events({ lat, lng, radius: 50 })
        ]);
        if (Array.isArray(warns)) setWarnings(warns);
        if (Array.isArray(evts)) setEventsData(evts);
      } catch (err) {
        console.error('[MapLibreMap] Failed to fetch GIS layers:', err);
      }
    };
    fetchGISData();
  }, [center[0], center[1]]);

  // Setup global callback for popups
  useEffect(() => {
    (window as any).addPointToRoute = (id: string) => {
      const found = locations.find(loc => loc.id === id);
      if (found && onAddPointToRoute) {
        onAddPointToRoute(found);
      }
    };
    return () => {
      delete (window as any).addPointToRoute;
    };
  }, [locations, onAddPointToRoute]);

  // Load custom SVG images into map style on load
  const handleMapLoad = (e: any) => {
    const map = e.target;
    
    // Add marker images for MapLibre Layer support
    const imgRed = new Image(30, 30);
    imgRed.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgRedString);
    imgRed.onload = () => {
      if (!map.hasImage('marker-red')) map.addImage('marker-red', imgRed);
    };

    const imgGold = new Image(30, 30);
    imgGold.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgGoldString);
    imgGold.onload = () => {
      if (!map.hasImage('marker-gold')) map.addImage('marker-gold', imgGold);
    };

    const imgBlue = new Image(30, 30);
    imgBlue.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgBlueString);
    imgBlue.onload = () => {
      if (!map.hasImage('marker-blue')) map.addImage('marker-blue', imgBlue);
    };

    const imgGreen = new Image(30, 30);
    imgGreen.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgGreenString);
    imgGreen.onload = () => {
      if (!map.hasImage('marker-green')) map.addImage('marker-green', imgGreen);
    };

    const imgUser = new Image(30, 30);
    imgUser.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgUserString);
    imgUser.onload = () => {
      if (!map.hasImage('marker-user')) map.addImage('marker-user', imgUser);
    };
  };

  // Viewport-based fetching for warnings and events (synced with static center prop)
  const lastFetchCenterRef = useRef<[number, number]>([0, 0]);
  useEffect(() => {
    const lat = Number(center[0]);
    const lng = Number(center[1]);
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

    const latDiff = Math.abs(lat - lastFetchCenterRef.current[0]);
    const lngDiff = Math.abs(lng - lastFetchCenterRef.current[1]);

    if (latDiff > 0.03 || lngDiff > 0.03) {
      lastFetchCenterRef.current = [lat, lng];
      
      const fetchLayers = async () => {
        try {
          const [warns, evts] = await Promise.all([
            mapService.safetyWarnings({ lat, lng, radius: 30 }),
            mapService.events({ lat, lng, radius: 30 })
          ]);
          if (Array.isArray(warns)) setWarnings(warns);
          if (Array.isArray(evts)) setEventsData(evts);
        } catch (err) {
          console.error('[MapLibreMap] Bounding Box GIS fetch failed:', err);
        }
      };
      fetchLayers();
    }
  }, [center[0], center[1]]);

  // Geofencing Proximity Checker
  useEffect(() => {
    if (locations.length === 0) return;

    const checkGeofencing = () => {
      const userCoords = { latitude: center[0], longitude: center[1] };
      for (const loc of locations) {
        if (loc.id.startsWith('checkin-') || loc.id.startsWith('live-')) continue;

        const dist = calculateHaversineDistance(userCoords, { latitude: loc.lat, longitude: loc.lng });
        if (dist <= 0.3) {
          const alertKey = `geofence-alert-${loc.id}`;
          const lastAlert = sessionStorage.getItem(alertKey);
          if (!lastAlert) {
            sessionStorage.setItem(alertKey, Date.now().toString());
            alert(vi
              ? `🔔 Bạn đang đến gần địa danh: ${loc.name}! Chỉ cách ${(dist * 1000).toFixed(0)}m.`
              : `🔔 You are approaching: ${loc.name}! Just ${(dist * 1000).toFixed(0)}m away.`
            );
          }
          break;
        }
      }
    };
    checkGeofencing();
  }, [center[0], center[1], locations]);

  // Fit map bounds to show route
  const routePointsKey = JSON.stringify(routePoints.map(p => p.id));
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || routePoints.length < 2 || viewType !== 'map') return;

    let minLng = routePoints[0].lng;
    let maxLng = routePoints[0].lng;
    let minLat = routePoints[0].lat;
    let maxLat = routePoints[0].lat;

    routePoints.forEach(p => {
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
    });

    map.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      { padding: 50, duration: 800 }
    );
  }, [routePointsKey, viewType]);

  const handleMapClick = (event: any) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const features = map.queryRenderedFeatures(event.point, {
      layers: ['clusters']
    });
    if (features.length) {
      const clusterId = features[0].properties.cluster_id;
      const source: any = map.getSource('locations-source');
      source.getClusterExpansionZoom(clusterId, (err: any, zoomLevel: number) => {
        if (err) return;
        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoomLevel + 1
        });
      });
      return;
    }

    if (viewState.zoom >= 1) {
      const unclustered = map.queryRenderedFeatures(event.point, {
        layers: ['unclustered-point']
      });
      if (unclustered.length) {
        const props = unclustered[0].properties;
        const loc = locations.find(l => l.id === props.id);
        if (loc) {
          setActivePopup(loc);
          if (onSelectLocation) onSelectLocation(loc);
        }
      }
    }
  };

  // Build GeoJSON data for clustering and heatmap
  const geojsonFeatures = React.useMemo(() => locations.map(loc => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [loc.lng, loc.lat]
    },
    properties: {
      id: loc.id,
      name: loc.name,
      user: loc.user,
      avatar: loc.avatar,
      category: loc.category,
      time: loc.time,
      note: loc.note,
      isCheckin: !!loc.user && !loc.id.startsWith('live-'),
      isCurrentUser: loc.id.startsWith('live-current-user-'),
      isLive: loc.id.startsWith('live-') && !loc.id.startsWith('live-current-user-'),
      isRecommended: aiRecommendedIds.includes(loc.id),
    }
  })), [locations, aiRecommendedIds]);

  const geojsonData: any = React.useMemo(() => ({
    type: 'FeatureCollection',
    features: geojsonFeatures
  }), [geojsonFeatures]);

  const routeGeoJSON: any = React.useMemo(() => ({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: routePoints.map(p => [p.lng, p.lat])
    }
  }), [routePoints]);

  // Memoized Main Markers to prevent lag on map movement (drag/zoom)
  const renderedMarkers = React.useMemo(() => {
    const baseLat = Number(center[0]) || 21.028511;
    const baseLng = Number(center[1]) || 105.804817;
    // Bounding box filter based on PROP center and zoom (which are static during drag)
    const latDelta = 180 / Math.pow(2, zoom);
    const lngDelta = 360 / Math.pow(2, zoom);

    const visibleLocations = locations.filter(loc => {
      if (loc.category === 'festival' && !showEvents) return false;
      const latDiff = Math.abs(loc.lat - baseLat);
      const lngDiff = Math.abs(loc.lng - baseLng);
      return latDiff <= latDelta * 1.8 && lngDiff <= lngDelta * 1.8;
    });

    const coordCounts: Record<string, number> = {};
    const adjustedLocations = visibleLocations.map(loc => {
      const key = `${loc.lat.toFixed(6)},${loc.lng.toFixed(6)}`;
      if (coordCounts[key] !== undefined) {
        coordCounts[key]++;
        const count = coordCounts[key];
        const angle = count * (2 * Math.PI / 8); // Spread in 8 directions
        const radius = 0.00012 * Math.ceil(count / 8); // Spread outwards slightly (~12m increments)
        return {
          ...loc,
          lat: loc.lat + radius * Math.cos(angle),
          lng: loc.lng + radius * Math.sin(angle)
        };
      } else {
        coordCounts[key] = 0;
        return loc;
      }
    });

    return adjustedLocations.map(loc => {
      const isCurrentUser = loc.id.startsWith('live-current-user-');
      const isLive = loc.id.startsWith('live-') && !isCurrentUser;
      const isCheckin = !!loc.user && !isLive && !isCurrentUser;
      const isRecommended = aiRecommendedIds.includes(loc.id);

      let svg = svgGoldString;
      if (isCheckin) {
        svg = svgRedString;
        if (loc.tag === 'food' || loc.category === 'restaurant') svg = svgFoodString;
        else if (loc.tag === 'hotel' || loc.category === 'hotel') svg = svgHotelString;
        else if (loc.tag === 'cafe' || loc.category === 'cafe') svg = svgCafeString;
        else if (loc.tag === 'nature' || loc.category === 'nature') svg = svgNatureString;
      }
      else if (isLive) svg = svgBlueString;
      else if (isCurrentUser) svg = svgUserString;
      else if (isRecommended) svg = svgGreenString;
      else if (loc.category === 'festival') svg = svgEventString;

      return (
        <Marker
          key={loc.id}
          longitude={loc.lng}
          latitude={loc.lat}
          onClick={(e: any) => {
            e.originalEvent.stopPropagation();
            setActivePopup(loc);
            if (onSelectLocation) onSelectLocation(loc);
            const map = mapRef.current?.getMap();
            if (map) {
              map.easeTo({
                center: [loc.lng, loc.lat],
                duration: 600
              });
            }
          }}
          anchor="bottom"
        >
          <div 
            className={`custom-map-marker cursor-pointer hover:scale-110 transition-transform ${isRecommended ? 'animate-bounce' : ''}`}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </Marker>
      );
    });
  }, [locations, showEvents, aiRecommendedIds, onSelectLocation, center, zoom]);

  // Memoized Safety Warning Polygons & Lines
  const renderedSafetyPolygons = React.useMemo(() => {
    if (!showSafety) return null;
    return warnings.map((warn) => (
      <Source key={warn.id} id={`safety-src-${warn.id}`} type="geojson" data={createGeoJSONCircle([warn.latitude, warn.longitude], warn.radiusKm)}>
        <Layer
          id={`safety-fill-${warn.id}`}
          type="fill"
          paint={{
            'fill-color': warn.type === 'FLOOD' ? '#3b82f6' : '#ef4444',
            'fill-opacity': 0.2
          }}
        />
        <Layer
          id={`safety-line-${warn.id}`}
          type="line"
          paint={{
            'line-color': warn.type === 'FLOOD' ? '#1d4ed8' : '#b91c1c',
            'line-width': 1.5
          }}
        />
      </Source>
    ));
  }, [showSafety, warnings]);

  // Memoized Safety Warnings Markers
  const renderedSafetyMarkers = React.useMemo(() => {
    if (!showSafety) return null;
    return warnings.map(warn => (
      <Marker
        key={`warn-marker-${warn.id}`}
        longitude={warn.longitude}
        latitude={warn.latitude}
        onClick={(e: any) => {
          e.originalEvent.stopPropagation();
          setActivePopup({
            id: warn.id,
            name: `CẢNH BÁO: ${warn.type}`,
            lat: warn.latitude,
            lng: warn.longitude,
            note: warn.description,
            category: 'SAFETY_WARNING'
          });
          const map = mapRef.current?.getMap();
          if (map) {
            map.easeTo({
              center: [warn.longitude, warn.latitude],
              duration: 600
            });
          }
        }}
        anchor="center"
      >
        <div className="text-xl filter drop-shadow cursor-pointer select-none">⚠️</div>
      </Marker>
    ));
  }, [showSafety, warnings]);

  // Memoized Route Itinerary Line
  const renderedRouteLine = React.useMemo(() => {
    if (routePoints.length < 2) return null;
    return (
      <Source id="route-line-source" type="geojson" data={routeGeoJSON}>
        <Layer
          id="route-line-layer"
          type="line"
          paint={{
            'line-color': '#d4af37',
            'line-width': 4,
            'line-opacity': 0.8,
            'line-dasharray': [2, 2]
          }}
        />
      </Source>
    );
  }, [routePoints, routeGeoJSON]);

  // Memoized Local Events Markers
  const renderedLocalEventsMarkers = React.useMemo(() => {
    if (!showEvents) return null;
    return eventsData.map(evt => (
      <Marker
        key={`event-marker-${evt.id}`}
        longitude={evt.longitude}
        latitude={evt.latitude}
        onClick={(e: any) => {
          e.originalEvent.stopPropagation();
          setActivePopup({
            id: evt.id,
            name: evt.title,
            lat: evt.latitude,
            lng: evt.longitude,
            note: evt.description || '',
            category: `LỄ HỘI: ${evt.category.toUpperCase()}`,
            time: new Date(evt.startDate).toLocaleDateString(vi ? 'vi-VN' : 'en-US')
          });
          const map = mapRef.current?.getMap();
          if (map) {
            map.easeTo({
              center: [evt.longitude, evt.latitude],
              duration: 600
            });
          }
        }}
        anchor="bottom"
      >
        <div 
          className="custom-event-marker cursor-pointer hover:scale-110 transition-transform"
          dangerouslySetInnerHTML={{ __html: svgEventString }}
        />
      </Marker>
    ));
  }, [showEvents, eventsData, vi]);

  // Memoized Weather Stations Layer
  const renderedWeatherStations = React.useMemo(() => {
    if (!showWeather) return null;
    const baseLat = Number(center[0]) || 21.028511;
    const baseLng = Number(center[1]) || 105.804817;
    const stations = [
      { id: 'w1', name: 'Trạm trung tâm', temp: weatherDataState.temp || '28', condition: (weatherDataState.condition || '').toLowerCase().includes('rain') || (weatherDataState.condition || '').toLowerCase().includes('mưa') ? '🌧️' : '☀️', lat: baseLat + 0.015, lng: baseLng - 0.015 },
      { id: 'w2', name: 'Trạm lân cận', temp: String(Number(weatherDataState.temp || '28') - 1), condition: '☁️', lat: baseLat - 0.015, lng: baseLng + 0.015 }
    ];
    return stations.map(station => (
      <Marker key={station.id} longitude={station.lng} latitude={station.lat} anchor="center">
        <div className="bg-slate-900/90 border border-slate-700 text-white rounded-full px-2 py-1 flex items-center gap-1.5 shadow-lg text-[9px] font-bold">
          <span>{station.condition}</span>
          <span>{station.temp}°C</span>
        </div>
      </Marker>
    ));
  }, [showWeather, center, weatherDataState]);

  // Memoized Traffic Congestion Layer
  const renderedTrafficIncidents = React.useMemo(() => {
    if (!showTraffic) return null;
    const baseLat = Number(center[0]) || 21.028511;
    const baseLng = Number(center[1]) || 105.804817;
    const incidents = [
      { id: 't1', message: vi ? `Kẹt xe nặng - ${destination || 'Khu vực trung tâm'}` : `Heavy Traffic - ${destination || 'Center'}`, lat: baseLat + 0.01, lng: baseLng + 0.01 },
      { id: 't2', message: vi ? 'Ùn tắc di chuyển chậm' : 'Congestion - Slow Speed', lat: baseLat - 0.01, lng: baseLng - 0.01 }
    ];
    return incidents.map(inc => (
      <Marker key={inc.id} longitude={inc.lng} latitude={inc.lat} anchor="center">
        <div className="bg-red-950/95 border border-red-500 text-white rounded-xl px-2 py-1 flex items-center gap-1.5 shadow-lg text-[9px] font-bold max-w-[150px]">
          <span>🚨</span>
          <span>{inc.message}</span>
        </div>
      </Marker>
    ));
  }, [showTraffic, center, vi, destination]);

  const timelinePoints = routePoints.length > 0 ? routePoints : locations;

  const getGoogleMapsDirUrl = () => {
    if (timelinePoints.length === 0) return '#';
    const origin = timelinePoints[0];
    const destination = timelinePoints[timelinePoints.length - 1];
    
    if (timelinePoints.length === 1) {
      return `https://www.google.com/maps/search/?api=1&query=${origin.lat},${origin.lng}`;
    }
    
    const waypoints = timelinePoints.slice(1, -1).map(p => `${p.lat},${p.lng}`).join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&waypoints=${waypoints}&travelmode=driving`;
  };

  const getSinglePlaceUrl = (loc: MapLocation) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.name)}+${loc.lat},${loc.lng}`;
  };

  // Mock Weather Stations Layer Data
  const weatherStations = [
    { id: 'w1', name: 'Trạm trung tâm', temp: weatherDataState.temp || '28', condition: (weatherDataState.condition || '').toLowerCase().includes('rain') || (weatherDataState.condition || '').toLowerCase().includes('mưa') ? '🌧️' : '☀️', lat: viewState.latitude + 0.015, lng: viewState.longitude - 0.015 },
    { id: 'w2', name: 'Trạm lân cận', temp: String(Number(weatherDataState.temp || '28') - 1), condition: '☁️', lat: viewState.latitude - 0.015, lng: viewState.longitude + 0.015 }
  ];

  // Mock Traffic Congestion Indicators
  const trafficIncidents = [
    { id: 't1', message: vi ? `Kẹt xe nặng - ${destination || 'Khu vực trung tâm'}` : `Heavy Traffic - ${destination || 'Center'}`, lat: viewState.latitude + 0.01, lng: viewState.longitude + 0.01 },
    { id: 't2', message: vi ? 'Ùn tắc di chuyển chậm' : 'Congestion - Slow Speed', lat: viewState.latitude - 0.01, lng: viewState.longitude - 0.01 }
  ];

  const getStyleUrl = () => {
    switch (mapStyle) {
      case 'dark': return DARK_STYLE;
      case 'light': return LIGHT_STYLE;
      case 'satellite': return STREET_STYLE; // Layer handles satellite raster
      default: return STREET_STYLE;
    }
  };

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-[var(--border-normal)] bg-[var(--bg-elevated)]">
      {/* 1. Toggle Tabs Switcher */}
      <div className="absolute top-3 left-3 z-20 flex gap-1 bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-1 rounded-xl shadow-lg">
        <button
          type="button"
          onClick={() => setViewType('map')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
            viewType === 'map'
              ? 'bg-blue-600 text-white shadow-sm border border-transparent'
              : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-normal)]'
          }`}
          disabled={!isWebGLSupported()}
        >
          <Compass size={11} className={viewType === 'map' ? 'text-white' : 'text-blue-500'} />
          <span>{vi ? 'Bản đồ' : 'Map'}</span>
        </button>
        <button
          type="button"
          onClick={() => setViewType('timeline')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
            viewType === 'timeline'
              ? 'bg-blue-600 text-white shadow-sm border border-transparent'
              : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-normal)]'
          }`}
        >
          <ListTodo size={11} className={viewType === 'timeline' ? 'text-white' : 'text-blue-500'} />
          <span>{vi ? 'Lộ trình' : 'Timeline'}</span>
        </button>
      </div>

      {/* 2. Map View Mode */}
      {viewType === 'map' ? (
        <Map
          ref={mapRef}
          mapLib={maplibregl}
          {...viewState}
          onMove={(evt: any) => setViewState(evt.viewState)}
          onMoveEnd={(evt: any) => {
            if (onCenterChange) {
              onCenterChange([evt.viewState.latitude, evt.viewState.longitude]);
            }
          }}
          onClick={handleMapClick}
          onLoad={handleMapLoad}
          mapStyle={getStyleUrl()}
          style={{ width: '100%', height: '100%', minHeight: '400px' }}
        >
          <NavigationControl position="top-right" showCompass={true} />

          {/* Satellite Layer Switch */}
          {mapStyle === 'satellite' && (
            <Source id="satellite-source" type="raster" tiles={SATELLITE_STYLE.sources['satellite-tiles'].tiles} tileSize={256}>
              <Layer id="satellite-raster-layer" type="raster" />
            </Source>
          )}

          {/* Draw Safety Warning Polygons */}
          {renderedSafetyPolygons}
 
          {/* Draw Dash Route Itinerary Line */}
          {renderedRouteLine}
 
          {/* 2. Markers View Mode */}
          {viewMode === 'markers' && renderedMarkers}
 
          {/* Safety Warnings Markers */}
          {renderedSafetyMarkers}
 
          {/* Local Events Markers */}
          {renderedLocalEventsMarkers}
 
          {/* Weather Stations Layer */}
          {renderedWeatherStations}
 
          {/* Traffic Congestion Layer */}
          {renderedTrafficIncidents}

          {/* Cluster View Mode */}
          {viewMode === 'cluster' && (
            <Source
              id="locations-source"
              type="geojson"
              data={geojsonData}
              cluster={true}
              clusterMaxZoom={14}
              clusterRadius={50}
            >
              <Layer
                id="clusters"
                type="circle"
                filter={['has', 'point_count']}
                paint={{
                  'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    'rgba(212, 175, 55, 0.6)',
                    10,
                    'rgba(245, 158, 11, 0.7)',
                    30,
                    'rgba(239, 68, 68, 0.8)'
                  ],
                  'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    20,
                    10,
                    25,
                    30,
                    30
                  ],
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#fff'
                }}
              />
              <Layer
                id="cluster-count"
                type="symbol"
                filter={['has', 'point_count']}
                layout={{
                  'text-field': '{point_count}',
                  'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                  'text-size': 12
                }}
                paint={{
                  'text-color': '#ffffff'
                }}
              />
              <Layer
                id="unclustered-point"
                type="symbol"
                filter={['!', ['has', 'point_count']]}
                layout={{
                  'icon-image': [
                    'case',
                    ['get', 'isCurrentUser'],
                    'marker-user',
                    ['get', 'isLive'],
                    'marker-blue',
                    ['get', 'isCheckin'],
                    'marker-red',
                    ['get', 'isRecommended'],
                    'marker-green',
                    'marker-gold'
                  ],
                  'icon-size': 1.0,
                  'icon-allow-overlap': true
                }}
              />
            </Source>
          )}

          {/* Heatmap View Mode */}
          {viewMode === 'heatmap' && (
            <Source id="heatmap-source" type="geojson" data={geojsonData}>
              <Layer
                id="heatmap-layer"
                type="heatmap"
                paint={{
                  'heatmap-weight': 1,
                  'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
                  'heatmap-color': [
                    'interpolate',
                    ['linear'],
                    ['heatmap-density'],
                    0,
                    'rgba(212, 175, 55, 0)',
                    0.2,
                    'rgba(212, 175, 55, 0.4)',
                    0.5,
                    'rgba(245, 158, 11, 0.7)',
                    0.8,
                    'rgba(239, 68, 68, 0.8)',
                    1,
                    'rgb(220, 38, 38)'
                  ],
                  'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 3, 9, 25],
                  'heatmap-opacity': 0.85
                }}
              />
            </Source>
          )}

          {/* Popup layer */}
          {activePopup && (
            <Popup
              longitude={activePopup.lng}
              latitude={activePopup.lat}
              anchor="bottom"
              onClose={() => setActivePopup(null)}
              closeButton={true}
              closeOnClick={false}
              maxWidth="280px"
            >
              <div 
                className="space-y-2.5 text-white" 
                dangerouslySetInnerHTML={{ __html: createPopupContent(activePopup, vi, !!onAddPointToRoute, locations) }} 
              />
            </Popup>
          )}
        </Map>
      ) : (
        /* Alternate View Mode */
        <div className="w-full h-full flex flex-col p-6 pt-16 bg-[var(--bg-primary)] overflow-y-auto text-[var(--text-primary)]">
          {timelinePoints.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <p className="text-xs text-[var(--text-muted)]">
                {vi ? 'Chưa có địa điểm nào trong danh sách.' : 'No locations available in the list.'}
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-normal)] pb-3">
                <div>
                  <h4 className="text-xs font-black text-[var(--gold)] uppercase tracking-wider">
                    Lộ trình di chuyển chi tiết
                  </h4>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    {vi ? `Tổng số: ${timelinePoints.length} địa điểm` : `Total: ${timelinePoints.length} stops`}
                  </p>
                </div>
                <a
                  href={getGoogleMapsDirUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-all no-underline shadow-sm cursor-pointer"
                >
                  <Compass size={11} className="text-white" />
                  <span>{vi ? 'Mở Google Maps chỉ đường' : 'Open Google Maps'}</span>
                </a>
              </div>

              <div className="relative border-l border-dashed border-[var(--border-normal)] ml-3 pl-6 space-y-6 flex-1 py-2">
                {timelinePoints.map((point, index) => {
                  const isCheckin = !!point.user;
                  return (
                    <div key={point.id} className="relative group">
                      {isCheckin ? (
                        <div className="absolute -left-[35px] top-0.5 w-6 h-6 rounded-full overflow-hidden border border-red-500 shadow-lg">
                          <img 
                            src={point.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} 
                            className="w-full h-full object-cover"
                            alt="Avatar"
                          />
                        </div>
                      ) : (
                        <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--bg-elevated)] border-2 border-[var(--gold)] text-[8px] font-bold text-[var(--gold)] shadow-sm">
                          {index + 1}
                        </span>
                      )}

                      <div className="bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-3 rounded-xl hover:bg-[var(--bg-overlay)] hover:border-blue-500/30 shadow-sm transition-all space-y-1.5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h5 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--gold)] transition-colors">
                              {isCheckin ? `${point.user} (Check-in)` : point.name}
                            </h5>
                            {point.category && (
                              <span className="inline-block text-[8px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900/30 mt-1">
                                {point.category}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex gap-1.5">
                            {onAddPointToRoute && !routePoints.some(rp => rp.id === point.id) && (
                              <button
                                onClick={() => onAddPointToRoute(point)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] font-bold cursor-pointer transition-all shadow-sm border border-transparent"
                              >
                                + {vi ? 'Thêm' : 'Add'}
                              </button>
                            )}
                            {onRemovePointFromRoute && routePoints.some(rp => rp.id === point.id) && (
                              <button
                                onClick={() => onRemovePointFromRoute(point.id)}
                                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded text-[9px] font-bold cursor-pointer transition-all shadow-sm"
                              >
                                ✕ {vi ? 'Xoá' : 'Remove'}
                              </button>
                            )}
                            <a
                              href={getSinglePlaceUrl(point)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center p-1.5 bg-[var(--bg-primary)] hover:bg-[var(--bg-overlay)] border border-[var(--border-normal)] text-[var(--gold)] hover:text-blue-700 rounded transition-all cursor-pointer"
                              title={vi ? 'Xem trên Google Bản đồ' : 'View on Google Maps'}
                            >
                              <MapPin size={10} />
                            </a>
                          </div>
                        </div>

                        {point.note && (
                          <p className="text-[10px] text-[var(--text-secondary)] italic bg-[var(--bg-primary)] p-2 rounded-lg border-l-2 border-[var(--border-normal)]">
                            "{point.note}"
                          </p>
                        )}

                        {point.time && (
                          <div className="text-[9px] text-[var(--text-muted)] flex items-center gap-1">
                            ⏰ {point.time}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Style switcher */}
      {viewType === 'map' && (
        <>
          <div className="absolute bottom-3 left-3 z-10 flex gap-1 bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-1 rounded-xl shadow-lg">
            <button
              type="button"
              onClick={() => {
                setMapStyle('street');
                setViewState(prev => ({ ...prev, pitch: 0, bearing: 0 }));
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                mapStyle === 'street' 
                  ? 'bg-blue-600 text-white shadow-sm border border-transparent' 
                  : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-normal)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]'
              }`}
            >
              {vi ? 'Đường' : 'Street'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMapStyle('satellite');
                setViewState(prev => ({ ...prev, pitch: 0, bearing: 0 }));
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                mapStyle === 'satellite' 
                  ? 'bg-blue-600 text-white shadow-sm border border-transparent' 
                  : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-normal)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]'
              }`}
            >
              {vi ? 'Vệ tinh' : 'Satellite'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMapStyle('dark');
                setViewState(prev => ({ ...prev, pitch: 0, bearing: 0 }));
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                mapStyle === 'dark' 
                  ? 'bg-blue-600 text-white shadow-sm border border-transparent' 
                  : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-normal)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]'
              }`}
            >
              {vi ? 'Tối' : 'Dark'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMapStyle('light');
                setViewState(prev => ({ ...prev, pitch: 0, bearing: 0 }));
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                mapStyle === 'light' 
                  ? 'bg-blue-600 text-white shadow-sm border border-transparent' 
                  : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-normal)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]'
              }`}
            >
              {vi ? 'Sáng' : 'Light'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMapStyle('3d');
                setViewState(prev => ({ ...prev, pitch: 60, bearing: -20 }));
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                mapStyle === '3d' 
                  ? 'bg-blue-600 text-white shadow-sm border border-transparent' 
                  : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-normal)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]'
              }`}
            >
              3D
            </button>
          </div>

          {/* GIS Layers Switcher */}
          <div className="absolute bottom-20 right-3 z-10 flex flex-col gap-1 bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-1.5 rounded-xl shadow-lg w-[105px]">
            <span className="text-[7.5px] font-black text-[var(--text-muted)] uppercase tracking-widest block text-center mb-1">GIS Layers</span>
            <button
              type="button"
              onClick={() => setShowWeather(prev => !prev)}
              className={`px-2 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer text-left flex items-center gap-1.5 ${
                showWeather 
                  ? 'bg-blue-600 text-white shadow-sm border border-transparent' 
                  : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-normal)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]'
              }`}
            >
              <CloudRain size={10} className={showWeather ? 'text-white' : 'text-blue-500'} />
              <span>{vi ? 'Khí tượng' : 'Weather'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowTraffic(prev => !prev)}
              className={`px-2 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer text-left flex items-center gap-1.5 ${
                showTraffic 
                  ? 'bg-amber-600 text-white shadow-sm border border-transparent' 
                  : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-normal)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]'
              }`}
            >
              <Car size={10} className={showTraffic ? 'text-white' : 'text-amber-500'} />
              <span>{vi ? 'Giao thông' : 'Traffic'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSafety(prev => !prev)}
              className={`px-2 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer text-left flex items-center gap-1.5 ${
                showSafety 
                  ? 'bg-red-600 text-white shadow-sm border border-transparent' 
                  : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-normal)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]'
              }`}
            >
              <AlertTriangle size={10} className={showSafety ? 'text-white' : 'text-red-500'} />
              <span>{vi ? 'Cảnh báo' : 'Safety'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowEvents(prev => !prev)}
              className={`px-2 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer text-left flex items-center gap-1.5 ${
                showEvents 
                  ? 'bg-purple-600 text-white shadow-sm border border-transparent' 
                  : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-normal)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]'
              }`}
            >
              <Calendar size={10} className={showEvents ? 'text-white' : 'text-purple-500'} />
              <span>{vi ? 'Lễ hội' : 'Events'}</span>
            </button>
          </div>

          <div className="absolute top-28 right-3 z-10 bg-[var(--bg-elevated)] border border-[var(--border-normal)] px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider text-[var(--gold)] shadow-md">
            {viewMode.toUpperCase()}
          </div>
        </>
      )}
    </div>
  );
};

export default MapLibreMap;

