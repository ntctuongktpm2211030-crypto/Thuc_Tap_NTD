import React, { useEffect, useRef, useState } from 'react';
import { useLang } from '../../contexts/LanguageContext';
import { mapService } from '../../services/smartTravel.service';
import { CloudRain, Car, AlertTriangle, Calendar, Compass, ListTodo, MapPin } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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
  color?: string;
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

declare global {
  interface Window {
    addPointToRoute: (id: string) => void;
  }
}

// Helper to calculate circle coordinates for MapLibre
function getCirclePolygon(center: [number, number], radiusKm: number) {
  const points = 64;
  const coords = [];
  const distanceX = radiusKm / (111.32 * Math.cos(center[1] * Math.PI / 180));
  const distanceY = radiusKm / 110.57;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([center[0] + x, center[1] + y]);
  }
  coords.push(coords[0]);
  return coords;
}

// Custom SVGs matching previous map aesthetics
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

const svgGlobeString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="#3b82f6">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.53c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z"/>
</svg>
`;

const svgEventString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="#a855f7">
  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z"/>
</svg>
`;

const svgUserString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30">
  <circle cx="12" cy="12" r="10" fill="#3b82f6" fill-opacity="0.3" />
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
  const timeStr = loc.time ? `<p class="text-[10px] text-slate-500 mt-0.5">${loc.time}</p>` : '';
  const noteStr = loc.note ? `<p class="text-xs text-slate-600 italic mt-1.5" style="border-left: 2px solid #ccc; padding-left: 6px;">"${loc.note}"</p>` : '';
  
  const badge = isLive ? `<span class="text-[8px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded ml-1.5" style="display:inline-block;">Live</span>` : '';

  let finalImageUrl = loc.imageUrl || '';
  if (isLive && !finalImageUrl && loc.user) {
    const userCheckin = allLocations.find(l => l.id.startsWith('checkin-') && l.user === loc.user && l.imageUrl);
    if (userCheckin) {
      finalImageUrl = userCheckin.imageUrl || '';
    }
  }

  const imageHtml = finalImageUrl 
    ? `<div class="mt-2 rounded-lg overflow-hidden border border-slate-200 max-h-32 flex items-center justify-center bg-black/5" style="width:200px;">
        <img src="${finalImageUrl}" class="w-full h-full object-cover" style="width:100%; max-height: 120px;" />
       </div>`
    : '';

  const headerHtml = isCheckin
    ? `
      <div class="flex items-center gap-2" style="display: flex; align-items: center; gap: 8px;">
        <img src="${loc.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}" class="w-8 h-8 rounded-full object-cover border border-slate-300" style="width:32px; height:32px; border-radius:50%; object-fit:cover;" />
        <div>
          <h4 class="text-xs font-bold text-slate-800 leading-none" style="margin: 0; font-size:12px; font-weight:bold;">${loc.user}${badge}</h4>
          ${timeStr}
        </div>
      </div>
    `
    : `
      <div>
        <h4 class="text-xs font-bold text-blue-600 leading-none" style="margin: 0; font-size:12px; font-weight:bold;">${loc.name}</h4>
        <span class="text-[9px] uppercase tracking-wider font-bold text-slate-500 mt-1" style="display:block; font-size:9px;">${loc.category || 'Destination'}</span>
      </div>
    `;

  let allCheckinsHtml = '';
  if (loc.allCheckins && loc.allCheckins.length > 1) {
    const listHtml = loc.allCheckins.slice(1).map(c => `
      <div class="flex items-start gap-1.5 border-t border-slate-100 pt-1.5 mt-1.5" style="display: flex; gap: 6px; border-top:1px solid #eee; padding-top:6px; margin-top:6px;">
        <img src="${c.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}" class="w-5 h-5 rounded-full object-cover border border-slate-200 mt-0.5" style="width:20px; height:20px; border-radius:50%; object-fit:cover;" />
        <div class="flex-1 min-w-0">
          <p class="text-[9px] font-bold text-slate-800 leading-none" style="margin:0; font-size:9px; font-weight:bold;">${c.user}</p>
          <p class="text-[7.5px] text-slate-500" style="margin:0; font-size:7.5px;">${c.time}</p>
          ${c.note ? `<p class="text-[9px] text-slate-600 italic mt-0.5 leading-tight" style="margin:0; font-size:9px;">"${c.note}"</p>` : ''}
        </div>
      </div>
    `).join('');
    
    allCheckinsHtml = `
      <div class="mt-2.5 pt-2 border-t border-slate-200" style="border-top:1px solid #ccc; margin-top:10px; padding-top:8px;">
        <div class="text-[8px] font-bold text-amber-600 uppercase tracking-widest mb-1.5" style="font-size:8px; font-weight:bold;">
          ${vi ? `Và ${loc.allCheckins.length - 1} lượt check-in khác:` : `And ${loc.allCheckins.length - 1} other check-ins:`}
        </div>
        <div class="max-h-24 overflow-y-auto space-y-1.5 pr-1" style="max-height: 96px; overflow-y: auto;">
          ${listHtml}
        </div>
      </div>
    `;
  }

  return `
    <div class="space-y-2 text-slate-800" style="font-family: sans-serif; font-size: 11px; max-width: 220px; line-height: 1.4;">
      ${headerHtml}
      ${noteStr}
      ${imageHtml}
      <div class="text-[10px] text-yellow-600 font-bold flex items-center gap-1 mt-1" style="margin-top:4px; font-size:10px; font-weight:bold;">📍 ${loc.name || (isLive ? 'Live Tracking' : '')}</div>
      ${allCheckinsHtml}
      ${hasRouteCallback ? `
      <button 
        onclick="window.addPointToRoute('${loc.id}')"
        style="margin-top: 10px; width: 100%; background-color: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 10px; cursor: pointer; display: block;"
      >
        ${vi ? '+ Thêm vào lộ trình' : '+ Add to Route'}
      </button>` : ''}
    </div>
  `;
};

// MapLibre OS Tile Styles
const getMapLibreStyle = (style: string) => {
  switch (style) {
    case 'satellite':
      return {
        version: 8,
        sources: {
          'satellite-tiles': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: 'Tiles &copy; Esri'
          }
        },
        layers: [
          {
            id: 'satellite-tiles-layer',
            type: 'raster',
            source: 'satellite-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      };
    case 'dark':
      return {
        version: 8,
        sources: {
          'dark-tiles': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
          }
        },
        layers: [
          {
            id: 'dark-tiles-layer',
            type: 'raster',
            source: 'dark-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      };
    case 'light':
      return {
        version: 8,
        sources: {
          'light-tiles': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
          }
        },
        layers: [
          {
            id: 'light-tiles-layer',
            type: 'raster',
            source: 'light-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      };
    default:
      return {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      };
  }
};

export const MapLibreMap: React.FC<MapLibreMapProps> = ({
  center = [21.028511, 105.804817],
  zoom = 13,
  locations = [],
  viewMode = 'markers',
  routePoints = [],
  onAddPointToRoute,
  onRemovePointFromRoute,
  aiRecommendedIds = [],
  weatherInfo = { condition: 'Sunny', temp: '28' },
  onSelectLocation,
  destination,
  onCenterChange,
}) => {
  const { lang } = useLang();
  const vi = lang === 'vi';

  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [viewType, setViewType] = useState<'map' | 'timeline'>('map');
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite' | 'dark' | 'light' | '3d'>('street');

  // GIS layers active state
  const [showWeather, setShowWeather] = useState(false);
  const [showSafety, setShowSafety] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

  // Dynamic GIS fetched data
  const [warnings, setWarnings] = useState<any[]>([]);
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [weatherDataState, setWeatherDataState] = useState(weatherInfo);

  // Refs for MapLibre mode
  const mlMapRef = useRef<maplibregl.Map | null>(null);
  const mlMarkersRef = useRef<maplibregl.Marker[]>([]);
  const mlWarningMarkersRef = useRef<maplibregl.Marker[]>([]);
  const mlWeatherMarkersRef = useRef<maplibregl.Marker[]>([]);
  const mlEventMarkersRef = useRef<maplibregl.Marker[]>([]);

  // 1. Fetch Safety Warnings and Events for the map area
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

  // Sync weatherInfo prop changes
  const lastWeatherRef = useRef(weatherInfo);
  useEffect(() => {
    if (weatherInfo && (weatherInfo.condition !== lastWeatherRef.current?.condition || weatherInfo.temp !== lastWeatherRef.current?.temp)) {
      lastWeatherRef.current = weatherInfo;
      setWeatherDataState(weatherInfo);
    }
  }, [weatherInfo?.condition, weatherInfo?.temp]);

  // Fetch weather when destination changes
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

  // Setup global callback for infowindow button actions
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

  // 2. Initialize MapLibre
  useEffect(() => {
    if (!containerRef.current || mlMapRef.current) return;
    const initialCenter: [number, number] = [Number(center[1]) || 105.804817, Number(center[0]) || 21.028511];
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getMapLibreStyle(mapStyle),
      center: initialCenter,
      zoom: zoom,
      pitchWithRotate: true,
      dragRotate: true
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('dragend', () => {
      const currentCenter = map.getCenter();
      if (currentCenter && onCenterChange) {
        onCenterChange([currentCenter.lat, currentCenter.lng]);
      }
    });

    mlMapRef.current = map;
    setLoaded(true);

    return () => {
      if (mlMapRef.current) {
        mlMapRef.current.remove();
        mlMapRef.current = null;
      }
    };
  }, []);

  // Handle center updates reactively
  const lastSyncedCenter = useRef<[number, number]>([0, 0]);
  useEffect(() => {
    const lat = Number(center[0]);
    const lng = Number(center[1]);
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

    const latDiff = Math.abs(lat - lastSyncedCenter.current[0]);
    const lngDiff = Math.abs(lng - lastSyncedCenter.current[1]);

    if (latDiff > 0.0001 || lngDiff > 0.0001) {
      lastSyncedCenter.current = [lat, lng];
      if (mlMapRef.current) {
        mlMapRef.current.panTo([lng, lat]);
      }
    }
  }, [center[0], center[1]]);

  // Switch styles reactively
  useEffect(() => {
    if (mlMapRef.current) {
      mlMapRef.current.setStyle(getMapLibreStyle(mapStyle));
    }
  }, [mapStyle]);

  // 3. Render markers & layers
  useEffect(() => {
    if (!loaded || !mlMapRef.current) return;

    const map = mlMapRef.current;
    mlMarkersRef.current.forEach(m => m.remove());
    mlMarkersRef.current = [];

    // Filter current user and event markers if toggled off
    const nonUserLocations = locations.filter(loc => {
      if (loc.id.startsWith('live-current-user-')) return false;
      if (loc.category === 'festival' && !showEvents) return false;
      return true;
    });

    // Circular spreading logic for overlapping coordinates
    const coordCounts: Record<string, number> = {};
    const adjustedLocations = nonUserLocations.map(loc => {
      const key = `${loc.lat.toFixed(6)},${loc.lng.toFixed(6)}`;
      if (coordCounts[key] !== undefined) {
        coordCounts[key]++;
        const count = coordCounts[key];
        const angle = count * ((2 * Math.PI) / 8);
        const radius = 0.00012 * Math.ceil(count / 8);
        return {
          ...loc,
          lat: loc.lat + radius * Math.cos(angle),
          lng: loc.lng + radius * Math.sin(angle),
        };
      } else {
        coordCounts[key] = 0;
        return loc;
      }
    });

    // Draw normal markers
    adjustedLocations.forEach(loc => {
      const isLiveFriend = loc.id.startsWith('live-');
      const el = document.createElement('div');
      el.style.cursor = 'pointer';

      if (isLiveFriend) {
        el.style.width = '36px';
        el.style.height = '36px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid #ef4444';
        el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        el.style.backgroundColor = '#ffffff';
        el.style.overflow = 'hidden';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';

        const img = document.createElement('img');
        img.src = loc.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        el.appendChild(img);
      } else {
        const svg = getSvgIcon(loc, aiRecommendedIds.includes(loc.id));
        el.innerHTML = svg;
        el.style.width = '30px';
        el.style.height = '30px';
      }

      const content = createPopupContent(loc, vi, !!onAddPointToRoute, locations);
      const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`<div style="color:black; padding:4px;">${content}</div>`);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([loc.lng, loc.lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onSelectLocation) onSelectLocation(loc);
        if (popup.isOpen()) {
          popup.remove();
        } else {
          popup.addTo(map);
        }
      });

      mlMarkersRef.current.push(marker);
    });

    // Draw current user marker
    const currentUserLoc = locations.find(loc => loc.id.startsWith('live-current-user-'));
    if (currentUserLoc) {
      const el = document.createElement('div');
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid #3b82f6';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.backgroundColor = '#ffffff';
      el.style.overflow = 'hidden';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';

      const img = document.createElement('img');
      img.src = currentUserLoc.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      el.appendChild(img);

      const content = createPopupContent(currentUserLoc, vi, !!onAddPointToRoute, locations);
      const popup = new maplibregl.Popup({ offset: 15 })
        .setHTML(`<div style="color:black; padding:4px;">${content}</div>`);

      const userMarker = new maplibregl.Marker({ element: el })
        .setLngLat([currentUserLoc.lng, currentUserLoc.lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onSelectLocation) onSelectLocation(currentUserLoc);
        if (popup.isOpen()) {
          popup.remove();
        } else {
          popup.addTo(map);
        }
      });

      mlMarkersRef.current.push(userMarker);
    }
  }, [locations, viewMode, aiRecommendedIds, showEvents, loaded]);

  // 4. Route points Polyline path connector
  useEffect(() => {
    if (!loaded || !mlMapRef.current) return;
    const map = mlMapRef.current;
    
    const updateLine = () => {
      if (!map.isStyleLoaded()) return;

      if (map.getSource('route-line')) {
        (map.getSource('route-line') as any).setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routePoints.map(p => [p.lng, p.lat])
          }
        });
      } else {
        map.addSource('route-line', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: routePoints.map(p => [p.lng, p.lat])
            }
          }
        });
        map.addLayer({
          id: 'route-line-layer',
          type: 'line',
          source: 'route-line',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#d4af37',
            'line-width': 4,
            'line-opacity': 0.8
          }
        });
      }

      if (routePoints.length >= 2) {
        const bounds = new maplibregl.LngLatBounds();
        routePoints.forEach(p => bounds.extend([p.lng, p.lat]));
        map.fitBounds(bounds, { padding: 50 });
      }
    };

    if (map.isStyleLoaded()) {
      updateLine();
    } else {
      map.once('style.load', updateLine);
    }
  }, [routePoints, loaded]);

  // 5. Warning Circle layers
  useEffect(() => {
    if (!loaded || !mlMapRef.current) return;
    const map = mlMapRef.current;
    mlWarningMarkersRef.current.forEach(m => m.remove());
    mlWarningMarkersRef.current = [];

    const updateWarnings = () => {
      if (!map.isStyleLoaded()) return;

      warnings.forEach(warn => {
        if (map.getLayer(`warn-circle-layer-${warn.id}`)) map.removeLayer(`warn-circle-layer-${warn.id}`);
        if (map.getLayer(`warn-circle-stroke-${warn.id}`)) map.removeLayer(`warn-circle-stroke-${warn.id}`);
        if (map.getSource(`warn-circle-${warn.id}`)) map.removeSource(`warn-circle-${warn.id}`);
      });

      if (!showSafety) return;

      warnings.forEach(warn => {
        map.addSource(`warn-circle-${warn.id}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [getCirclePolygon([warn.longitude, warn.latitude], warn.radiusKm)]
            }
          }
        });
        map.addLayer({
          id: `warn-circle-layer-${warn.id}`,
          type: 'fill',
          source: `warn-circle-${warn.id}`,
          paint: {
            'fill-color': warn.type === 'FLOOD' ? '#3b82f6' : '#ef4444',
            'fill-opacity': 0.2
          }
        });
        map.addLayer({
          id: `warn-circle-stroke-${warn.id}`,
          type: 'line',
          source: `warn-circle-${warn.id}`,
          paint: {
            'line-color': warn.type === 'FLOOD' ? '#1d4ed8' : '#b91c1c',
            'line-width': 1.5,
            'line-opacity': 0.8
          }
        });

        const el = document.createElement('div');
        el.innerHTML = '<span style="font-size: 20px;">⚠️</span>';
        el.style.cursor = 'pointer';

        const warnLoc = {
          id: warn.id,
          name: `CẢNH BÁO: ${warn.type}`,
          lat: warn.latitude,
          lng: warn.longitude,
          note: warn.description,
          category: 'SAFETY_WARNING'
        };
        const content = createPopupContent(warnLoc, vi, false);
        const popup = new maplibregl.Popup({ offset: 15 })
          .setHTML(`<div style="color:black; padding:4px;">${content}</div>`);

        const m = new maplibregl.Marker({ element: el })
          .setLngLat([warn.longitude, warn.latitude])
          .setPopup(popup)
          .addTo(map);

        mlWarningMarkersRef.current.push(m);
      });
    };

    if (map.isStyleLoaded()) {
      updateWarnings();
    } else {
      map.once('style.load', updateWarnings);
    }
  }, [warnings, showSafety, loaded]);

  // 6. Weather Station indicators
  useEffect(() => {
    if (!loaded || !mlMapRef.current) return;
    const map = mlMapRef.current;
    mlWeatherMarkersRef.current.forEach(m => m.remove());
    mlWeatherMarkersRef.current = [];

    if (showWeather) {
      const baseLat = Number(center[0]) || 21.028511;
      const baseLng = Number(center[1]) || 105.804817;
      const stations = [
        { id: 'w1', name: 'Trạm trung tâm', temp: weatherDataState.temp || '28', condition: (weatherDataState.condition || '').toLowerCase().includes('rain') || (weatherDataState.condition || '').toLowerCase().includes('mưa') ? '🌧️' : '☀️', lat: baseLat + 0.015, lng: baseLng - 0.015 },
        { id: 'w2', name: 'Trạm lân cận', temp: String(Number(weatherDataState.temp || '28') - 1), condition: '☁️', lat: baseLat - 0.015, lng: baseLng + 0.015 }
      ];

      stations.forEach(st => {
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 2px 8px; color: white; font-size: 10px; font-weight: bold; font-family: sans-serif; white-space: nowrap;">
            ${st.condition} ${st.temp}°C
          </div>
        `;
        el.style.cursor = 'pointer';

        const m = new maplibregl.Marker({ element: el })
          .setLngLat([st.lng, st.lat])
          .addTo(map);

        mlWeatherMarkersRef.current.push(m);
      });
    }
  }, [showWeather, center, weatherDataState, loaded]);

  // 7. Cultural Event Markers
  useEffect(() => {
    if (!loaded || !mlMapRef.current) return;
    const map = mlMapRef.current;
    mlEventMarkersRef.current.forEach(m => m.remove());
    mlEventMarkersRef.current = [];

    if (showEvents && eventsData.length > 0) {
      eventsData.forEach(evt => {
        const el = document.createElement('div');
        el.innerHTML = svgEventString;
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.cursor = 'pointer';

        const evtLoc = {
          id: evt.id,
          name: evt.title,
          lat: evt.latitude,
          lng: evt.longitude,
          note: evt.description || '',
          category: `LỄ HỘI: ${evt.category.toUpperCase()}`,
          time: new Date(evt.startDate).toLocaleDateString(vi ? 'vi-VN' : 'en-US')
        };
        const content = createPopupContent(evtLoc, vi, false);
        const popup = new maplibregl.Popup({ offset: 25 })
          .setHTML(`<div style="color:black; padding:4px;">${content}</div>`);

        const m = new maplibregl.Marker({ element: el })
          .setLngLat([evt.longitude, evt.latitude])
          .setPopup(popup)
          .addTo(map);

        mlEventMarkersRef.current.push(m);
      });
    }
  }, [showEvents, eventsData, loaded]);

  const getSvgIcon = (loc: MapLocation, isRecommended: boolean) => {
    if (loc.color) {
      if (loc.color === 'red') return svgRedString;
      if (loc.color === 'blue') return svgBlueString;
      if (loc.color === 'gold') return svgGoldString;
      if (loc.color === 'green') return svgGreenString;
      if (loc.color === 'purple') return svgEventString;
    }

    const isLive = loc.id.startsWith('live-');
    const isCheckin = !!loc.user && !isLive;

    if (loc.id.startsWith('osm-place-')) return svgRedString;
    if (isLive) return svgBlueString;
    if (isRecommended) return svgGreenString;
    if (isCheckin) {
      const tag = (loc.tag || '').toLowerCase();
      const cat = (loc.category || '').toLowerCase();
      if (tag === 'food' || cat === 'restaurant') return svgFoodString;
      if (tag === 'hotel' || cat === 'hotel') return svgHotelString;
      if (tag === 'cafe' || cat === 'cafe') return svgCafeString;
      if (tag === 'nature' || cat === 'nature') return svgNatureString;
      return svgRedString;
    }
    if (loc.category === 'festival') return svgEventString;
    return svgGoldString;
  };

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
        <div className="w-full h-full min-h-[400px] relative" style={{ width: '100%', height: '100%' }}>
          <div ref={containerRef} className="w-full h-full" style={{ width: '100%', height: '100%' }} />
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-xs bg-slate-950/20 z-10">
              <Compass size={24} className="animate-spin text-blue-500 mb-2" />
              <span>{vi ? 'Đang khởi tạo bản đồ...' : 'Initializing map...'}</span>
            </div>
          )}
        </div>
      ) : (
        /* Alternate Timeline View Mode */
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
      {viewType === 'map' && loaded && (
        <>
          <div className="absolute bottom-3 left-3 z-10 flex gap-1 bg-[var(--bg-elevated)] border border-[var(--border-normal)] p-1 rounded-xl shadow-lg">
            <button
              type="button"
              onClick={() => setMapStyle('street')}
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
              onClick={() => setMapStyle('satellite')}
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
              onClick={() => setMapStyle('dark')}
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
              onClick={() => setMapStyle('light')}
              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                mapStyle === 'light' 
                  ? 'bg-blue-600 text-white shadow-sm border border-transparent' 
                  : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-normal)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]'
              }`}
            >
              {vi ? 'Sáng' : 'Light'}
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
            OPENSTREETMAP
          </div>
        </>
      )}
    </div>
  );
};

export default MapLibreMap;
