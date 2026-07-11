import { useEffect, useRef, useState } from 'react';
import Map, { Source, Layer, Marker, NavigationControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import type { RoutePoint } from '../../types/route';
import { newRoutePoint, routePointRole } from '../../types/route';
import { reverseGeocodeFull } from '../../utils/geocodeUtils';
import { fetchRoadRoute } from '../../utils/routeUtils';

const ROUTE_COLOR = '#e8a838';
const MAX_POINTS = 12;

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

interface Props {
  points: RoutePoint[];
  interactive?: boolean;
  onPointsChange?: (points: RoutePoint[]) => void;
  highlightId?: string | null;
  className?: string;
  height?: string;
}

export default function JourneyRouteMap({
  points,
  interactive = false,
  onPointsChange,
  highlightId = null,
  className = '',
  height = '320px',
}: Props) {
  const mapRef = useRef<any>(null);
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite' | '3d'>('street');
  const [routing, setRouting] = useState(false);
  const [roadCoords, setRoadCoords] = useState<[number, number][] | null>(null);

  const [viewState, setViewState] = useState({
    latitude: 16.0544,
    longitude: 108.2022,
    zoom: 6,
    pitch: 0,
    bearing: 0,
  });

  // Fetch road route from OSRM when points change
  useEffect(() => {
    let active = true;
    const loadRoute = async () => {
      if (points.length < 2) {
        setRoadCoords(null);
        return;
      }
      setRouting(true);
      const coords = await fetchRoadRoute(points);
      if (active) {
        setRoadCoords(coords);
        setRouting(false);
      }
    };
    void loadRoute();
    return () => {
      active = false;
    };
  }, [points]);

  // Fit map bounds when points change
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || points.length === 0) return;

    if (points.length === 1) {
      map.easeTo({
        center: [points[0].lng, points[0].lat],
        zoom: 14,
        duration: 800,
      });
    } else if (points.length >= 2) {
      let minLng = points[0].lng;
      let maxLng = points[0].lng;
      let minLat = points[0].lat;
      let maxLat = points[0].lat;

      points.forEach(p => {
        if (p.lng < minLng) minLng = p.lng;
        if (p.lng > maxLng) maxLng = p.lng;
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
      });

      map.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]],
        { padding: 48, maxZoom: 14, duration: 800 }
      );
    }
  }, [points]);

  const handleMapClick = async (e: any) => {
    if (!interactive) return;
    if (points.length >= MAX_POINTS) return;
    
    // Prevent adding points if user clicks on a marker
    const target = e.originalEvent?.target as HTMLElement;
    if (target && target.closest('.route-marker-icon-wrap')) {
      return;
    }

    const { lng, lat } = e.lngLat;
    setRouting(true);
    try {
      const geo = await reverseGeocodeFull(lat, lng);
      const pt = newRoutePoint(
        geo.name || `Điểm ${points.length + 1}`,
        lat,
        lng,
        geo.address
      );
      onPointsChange?.([...points, pt]);
    } catch (err) {
      console.error(err);
    } finally {
      setRouting(false);
    }
  };

  const handleMarkerDragEnd = async (ptId: string, e: any) => {
    if (!interactive) return;
    const { lng, lat } = e.lngLat;
    setRouting(true);
    try {
      const geo = await reverseGeocodeFull(lat, lng);
      const next = points.map(p =>
        p.id === ptId
          ? {
              ...p,
              lat,
              lng,
              name: geo.name || p.name,
              address: geo.address || p.address,
            }
          : p
      );
      onPointsChange?.(next);
    } catch (err) {
      console.error(err);
    } finally {
      setRouting(false);
    }
  };

  // Convert coordinate format for MapLibre LineString GeoJSON
  const lineCoords = roadCoords
    ? roadCoords.map(([lat, lng]) => [lng, lat])
    : points.map(p => [p.lng, p.lat]);

  const routeGeoJSON: any = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: lineCoords,
    },
  };

  return (
    <div
      className={`journey-route-map relative rounded-2xl overflow-hidden border border-[var(--border-subtle)] ${className}`}
      style={{ height }}
    >
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        {...viewState}
        onMove={(evt: any) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle={mapStyle === 'satellite' ? SATELLITE_STYLE : STREET_STYLE}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-left" showCompass={false} />

        {/* Draw Route Line */}
        {points.length >= 2 && (
          <Source id="route-source" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-line"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round',
              }}
              paint={{
                'line-color': ROUTE_COLOR,
                'line-width': 5,
                'line-opacity': 0.9,
              }}
            />
          </Source>
        )}

        {/* Draw Markers */}
        {points.map((pt, idx) => {
          const role = routePointRole(idx, points.length);
          const label = role === 'start' ? '▶' : role === 'end' ? '◆' : String(idx + 1);
          const active = pt.id === highlightId;
          const cls = role === 'start'
            ? 'route-marker-icon route-marker-icon--start'
            : role === 'end'
              ? 'route-marker-icon route-marker-icon--end'
              : `route-marker-icon ${active ? 'route-marker-icon--active' : ''}`;

          return (
            <Marker
              key={pt.id}
              longitude={pt.lng}
              latitude={pt.lat}
              draggable={interactive}
              onDragEnd={(e: any) => handleMarkerDragEnd(pt.id, e)}
              anchor="bottom"
            >
              <div className="route-marker-icon-wrap" style={{ cursor: interactive ? 'grab' : 'pointer' }}>
                <div className={cls}>{label}</div>
              </div>
            </Marker>
          );
        })}
      </Map>

      {/* Layer selector */}
      <div className="absolute top-3 right-3 z-10 flex gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 p-1 rounded-xl shadow-lg">
        <button
          type="button"
          onClick={() => {
            setMapStyle('street');
            setViewState(prev => ({ ...prev, pitch: 0, bearing: 0 }));
          }}
          className={`journey-map-style-btn ${mapStyle === 'street' ? 'journey-map-style-btn--active' : ''}`}
        >
          Bản đồ
        </button>
        <button
          type="button"
          onClick={() => {
            setMapStyle('satellite');
            setViewState(prev => ({ ...prev, pitch: 0, bearing: 0 }));
          }}
          className={`journey-map-style-btn ${mapStyle === 'satellite' ? 'journey-map-style-btn--active' : ''}`}
        >
          Vệ tinh
        </button>
        <button
          type="button"
          onClick={() => {
            setMapStyle('3d');
            setViewState(prev => ({ ...prev, pitch: 60, bearing: -20 }));
          }}
          className={`journey-map-style-btn ${mapStyle === '3d' ? 'journey-map-style-btn--active' : ''}`}
        >
          3D
        </button>
      </div>

      {routing && (
        <div className="absolute top-3 left-3 z-10 bg-black/65 text-white text-[11px] px-3 py-1.5 rounded-full">
          Đang tính tuyến đường…
        </div>
      )}

      {interactive && (
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap gap-2 pointer-events-none">
          <span className="bg-black/65 backdrop-blur-sm text-white text-[11px] px-3 py-1.5 rounded-full">
            ▶ Xanh = bắt đầu · Nhấn map thêm điểm · Tuyến theo đường thực
          </span>
          {points.length >= 2 && (
            <span className="bg-[var(--gold)]/90 text-black text-[11px] font-bold px-3 py-1.5 rounded-full">
              {points.length} điểm · OSRM
            </span>
          )}
        </div>
      )}

      {!interactive && points.length >= 1 && (
        <div className="absolute bottom-3 left-3 z-10 bg-black/65 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1.5 rounded-full pointer-events-none">
          {points.length >= 2 ? `Hành trình · ${points.length} điểm · tuyến thực tế` : 'Vị trí bắt đầu'}
        </div>
      )}
    </div>
  );
}
