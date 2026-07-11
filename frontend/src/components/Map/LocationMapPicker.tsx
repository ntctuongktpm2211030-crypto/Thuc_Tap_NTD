import { useState, useEffect } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';

export interface MapLocation {
  lat: number;
  lng: number;
}

interface LocationMapPickerProps {
  center?: MapLocation;
  zoom?: number;
  marker?: MapLocation | null;
  onLocationChange?: (loc: MapLocation) => void;
  className?: string;
  height?: string;
}

const STREET_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
const SATELLITE_STYLE: any = {
  version: 8,
  sources: {
    'satellite-tiles': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }
  },
  layers: [
    {
      id: 'satellite-layer',
      type: 'raster',
      source: 'satellite-tiles',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

export default function LocationMapPicker({
  center = { lat: 21.028511, lng: 105.804817 },
  zoom = 6,
  marker,
  onLocationChange,
  className = '',
  height = '320px',
}: LocationMapPickerProps) {
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite' | '3d'>('street');
  const [viewState, setViewState] = useState({
    latitude: center.lat,
    longitude: center.lng,
    zoom: zoom,
    pitch: 0,
    bearing: 0,
  });

  // Sync center prop when it changes
  useEffect(() => {
    setViewState(prev => ({
      ...prev,
      latitude: center.lat,
      longitude: center.lng,
    }));
  }, [center.lat, center.lng]);

  // Sync marker when it changes to center viewport if zoom is low
  useEffect(() => {
    if (marker) {
      setViewState(prev => ({
        ...prev,
        latitude: marker.lat,
        longitude: marker.lng,
        zoom: Math.max(prev.zoom, 12),
      }));
    }
  }, [marker?.lat, marker?.lng]);

  const handleMapClick = (e: any) => {
    const { lng, lat } = e.lngLat;
    onLocationChange?.({ lat, lng });
  };

  const handleMarkerDragEnd = (e: any) => {
    const { lng, lat } = e.lngLat;
    onLocationChange?.({ lat, lng });
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-[var(--border-subtle)] ${className}`}
      style={{ height }}
    >
      <Map
        mapLib={maplibregl}
        {...viewState}
        onMove={(evt: any) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle={mapStyle === 'satellite' ? SATELLITE_STYLE : STREET_STYLE}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-left" showCompass={false} />
        
        {marker && (
          <Marker
            longitude={marker.lng}
            latitude={marker.lat}
            draggable
            onDragEnd={handleMarkerDragEnd}
            color="#ef4444"
          />
        )}
      </Map>

      {/* Style switcher */}
      <div className="absolute top-3 right-3 z-10 flex gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 p-1 rounded-xl shadow-lg">
        <button
          type="button"
          onClick={() => {
            setMapStyle('street');
            setViewState(prev => ({ ...prev, pitch: 0, bearing: 0 }));
          }}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
            mapStyle === 'street'
              ? 'bg-[var(--gold)] text-black'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          Bản đồ
        </button>
        <button
          type="button"
          onClick={() => {
            setMapStyle('satellite');
            setViewState(prev => ({ ...prev, pitch: 0, bearing: 0 }));
          }}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
            mapStyle === 'satellite'
              ? 'bg-[var(--gold)] text-black'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          Vệ tinh
        </button>
        <button
          type="button"
          onClick={() => {
            setMapStyle('3d');
            setViewState(prev => ({ ...prev, pitch: 60, bearing: -20 }));
          }}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
            mapStyle === '3d'
              ? 'bg-[var(--gold)] text-black'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          3D
        </button>
      </div>

      <div className="absolute bottom-3 left-3 z-10 bg-black/60 backdrop-blur-sm text-white text-[11px] px-3 py-1.5 rounded-full pointer-events-none">
        Nhấn bản đồ để ghim vị trí · Kéo ghim để điều chỉnh
      </div>
    </div>
  );
}
