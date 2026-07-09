import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useLang } from '../../contexts/LanguageContext';

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
}

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  locations?: MapLocation[];
  viewMode?: 'markers' | 'cluster' | 'heatmap';
  routePoints?: MapLocation[];
  onAddPointToRoute?: (loc: MapLocation) => void;
}

const getMarkerIcon = (isCheckin?: boolean) => {
  const color = isCheckin ? '#ef4444' : '#d4af37';
  const iconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="${color}">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;
  return L.divIcon({
    html: iconSvg,
    className: 'custom-map-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

const createPopupContent = (loc: MapLocation, vi: boolean) => {
  const isCheckin = !!loc.user;
  const timeStr = loc.time ? `<p class="text-[10px] text-slate-400 mt-0.5">${loc.time}</p>` : '';
  const noteStr = loc.note ? `<p class="text-xs text-slate-300 italic mt-1.5">"${loc.note}"</p>` : '';
  
  const headerHtml = isCheckin
    ? `
      <div class="flex items-center gap-2">
        <img src="${loc.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&q=40'}" class="w-8 h-8 rounded-full object-cover border border-slate-700" />
        <div>
          <h4 class="text-xs font-black text-white leading-none">${loc.user}</h4>
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

  return `
    <div class="space-y-2.5">
      ${headerHtml}
      ${noteStr}
      <div class="text-[10px] text-yellow-500 font-bold flex items-center gap-1 mt-1">📍 ${loc.name}</div>
      <button 
        onclick="window.addPointToRoute('${loc.id}')"
        class="mt-2.5 w-full bg-[#d4af37] text-black text-[10px] font-bold py-1.5 px-3 rounded-lg hover:bg-amber-400 transition-all cursor-pointer border-none"
      >
        ${vi ? '+ Thêm vào lộ trình' : '+ Add to Route'}
      </button>
    </div>
  `;
};

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center = [21.028511, 105.804817],
  zoom = 13,
  locations = [],
  viewMode = 'markers',
  routePoints = [],
  onAddPointToRoute,
}) => {
  const { lang } = useLang();
  const vi = lang === 'vi';
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  
  // Layer groups refs to easily clear/re-add layers
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const clusterLayerRef = useRef<any>(null);
  const heatLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

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

  // 1. Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    clusterLayerRef.current = (L as any).markerClusterGroup().addTo(map);
    heatLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Center / Zoom update
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, mapInstanceRef.current.getZoom());
    }
  }, [center]);

  // 3. Render Locations based on View Mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current || !clusterLayerRef.current || !heatLayerRef.current) return;

    // Clear previous layers
    markersLayerRef.current.clearLayers();
    clusterLayerRef.current.clearLayers();
    heatLayerRef.current.clearLayers();

    if (viewMode === 'markers') {
      locations.forEach(loc => {
        const marker = L.marker([loc.lat, loc.lng], {
          icon: getMarkerIcon(!!loc.user)
        }).bindPopup(createPopupContent(loc, vi));
        markersLayerRef.current?.addLayer(marker);
      });
    } else if (viewMode === 'cluster') {
      locations.forEach(loc => {
        const marker = L.marker([loc.lat, loc.lng], {
          icon: getMarkerIcon(!!loc.user)
        }).bindPopup(createPopupContent(loc, vi));
        clusterLayerRef.current.addLayer(marker);
      });
    } else if (viewMode === 'heatmap') {
      // Overlapping density heatmap circles simulation
      locations.forEach(loc => {
        const heatCircle = L.circle([loc.lat, loc.lng], {
          radius: 180,
          stroke: false,
          fillColor: '#ea580c', // Orange-red
          fillOpacity: 0.18
        });
        const innerCircle = L.circle([loc.lat, loc.lng], {
          radius: 90,
          stroke: false,
          fillColor: '#f59e0b', // Gold-yellow
          fillOpacity: 0.25
        });
        heatLayerRef.current?.addLayer(heatCircle);
        heatLayerRef.current?.addLayer(innerCircle);
      });
    }
  }, [locations, viewMode, vi]);

  // 4. Draw TSP Route line
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    if (routePoints.length >= 2) {
      const latlngs = routePoints.map(p => [p.lat, p.lng] as [number, number]);
      const polyline = L.polyline(latlngs, {
        color: '#d4af37',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8'
      }).addTo(map);
      routePolylineRef.current = polyline;

      // Fit map bounds to show route
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routePoints]);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-800">
      <div ref={mapContainerRef} className="w-full h-full min-h-[400px] z-0" />
      <div className="absolute top-3 right-3 z-10 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-[var(--gold)]">
        {viewMode.toUpperCase()} Mode Active
      </div>
    </div>
  );
};

export default LeafletMap;
