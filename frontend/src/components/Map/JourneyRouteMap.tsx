import { useEffect, useRef, useCallback, useState } from 'react';
import L from 'leaflet';
import type { RoutePoint } from '../../types/route';
import { newRoutePoint, routePointRole } from '../../types/route';
import { reverseGeocodeFull } from '../../utils/geocodeUtils';
import { fetchRoadRoute } from '../../utils/routeUtils';

const ROUTE_COLOR = '#e8a838';
const MAX_POINTS = 12;

function pointIcon(
  index: number,
  total: number,
  active: boolean,
): L.DivIcon {
  const role = routePointRole(index, total);
  const cls =
    role === 'start'
      ? 'route-marker-icon route-marker-icon--start'
      : role === 'end'
        ? 'route-marker-icon route-marker-icon--end'
        : `route-marker-icon ${active ? 'route-marker-icon--active' : ''}`;
  const label = role === 'start' ? '▶' : role === 'end' ? '◆' : String(index + 1);
  return L.divIcon({
    className: 'route-marker-icon-wrap',
    html: `<div class="${cls}">${label}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });
}

const STREET_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const SAT_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const streetLayerRef = useRef<L.TileLayer | null>(null);
  const satLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);
  const onChangeRef = useRef(onPointsChange);
  const pointsRef = useRef(points);
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street');
  const [routing, setRouting] = useState(false);

  useEffect(() => {
    onChangeRef.current = onPointsChange;
  }, [onPointsChange]);

  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  const drawRoute = useCallback(async (map: L.Map, pts: RoutePoint[], canEdit: boolean) => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    pts.forEach((pt, idx) => {
      const marker = L.marker([pt.lat, pt.lng], {
        icon: pointIcon(idx, pts.length, pt.id === highlightId),
        draggable: canEdit,
      }).addTo(map);

      marker.bindPopup(
        `<strong>${idx === 0 ? 'Vị trí bắt đầu' : idx === pts.length - 1 && pts.length > 1 ? 'Điểm kết thúc' : `Điểm ${idx + 1}`}</strong><br/>${pt.address || pt.name}`,
        { maxWidth: 280 },
      );

      if (canEdit) {
        marker.on('dragend', async () => {
          const pos = marker.getLatLng();
          const geo = await reverseGeocodeFull(pos.lat, pos.lng);
          const next = pointsRef.current.map(p =>
            p.id === pt.id
              ? {
                  ...p,
                  lat: pos.lat,
                  lng: pos.lng,
                  name: geo.name || p.name,
                  address: geo.address || p.address,
                }
              : p,
          );
          onChangeRef.current?.(next);
        });
      }

      markersRef.current.push(marker);
    });

    if (pts.length >= 2) {
      setRouting(true);
      const roadCoords = await fetchRoadRoute(pts);
      setRouting(false);
      const lineCoords = roadCoords ?? pts.map(p => [p.lat, p.lng] as [number, number]);
      polylineRef.current = L.polyline(lineCoords, {
        color: ROUTE_COLOR,
        weight: 5,
        opacity: 0.9,
        lineJoin: 'round',
      }).addTo(map);
    }

    if (pts.length === 1) {
      map.setView([pts[0].lat, pts[0].lng], 15);
    } else if (pts.length >= 2) {
      const bounds = L.latLngBounds(pts.map(p => [p.lat, p.lng] as L.LatLngExpression));
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
    }
  }, [highlightId]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: true }).setView([16.0544, 108.2022], 6);
    mapRef.current = map;

    streetLayerRef.current = L.tileLayer(STREET_TILES, {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 20,
    }).addTo(map);

    satLayerRef.current = L.tileLayer(SAT_TILES, {
      attribution: '&copy; Esri',
      maxZoom: 19,
    });

    if (interactive) {
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const current = pointsRef.current;
        if (current.length >= MAX_POINTS) return;
        const geo = await reverseGeocodeFull(e.latlng.lat, e.latlng.lng);
        const pt = newRoutePoint(
          geo.name || `Điểm ${current.length + 1}`,
          e.latlng.lat,
          e.latlng.lng,
          geo.address,
        );
        onChangeRef.current?.([...current, pt]);
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      streetLayerRef.current = null;
      satLayerRef.current = null;
      markersRef.current = [];
      polylineRef.current = null;
    };
  }, [interactive]);

  useEffect(() => {
    const map = mapRef.current;
    const street = streetLayerRef.current;
    const sat = satLayerRef.current;
    if (!map || !street || !sat) return;
    if (mapStyle === 'satellite') {
      map.removeLayer(street);
      if (!map.hasLayer(sat)) sat.addTo(map);
    } else {
      map.removeLayer(sat);
      if (!map.hasLayer(street)) street.addTo(map);
    }
  }, [mapStyle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    void drawRoute(map, points, interactive);
  }, [points, interactive, drawRoute, highlightId]);

  return (
    <div
      className={`journey-route-map relative rounded-2xl overflow-hidden border border-[var(--border-subtle)] ${className}`}
      style={{ height }}
    >
      <div ref={containerRef} className="w-full h-full z-0" />
      <div className="absolute top-3 right-3 z-[400] flex gap-1">
        <button
          type="button"
          onClick={() => setMapStyle('street')}
          className={`journey-map-style-btn ${mapStyle === 'street' ? 'journey-map-style-btn--active' : ''}`}
        >
          Bản đồ
        </button>
        <button
          type="button"
          onClick={() => setMapStyle('satellite')}
          className={`journey-map-style-btn ${mapStyle === 'satellite' ? 'journey-map-style-btn--active' : ''}`}
        >
          Vệ tinh
        </button>
      </div>
      {routing && (
        <div className="absolute top-3 left-3 z-[400] bg-black/65 text-white text-[11px] px-3 py-1.5 rounded-full">
          Đang tính tuyến đường…
        </div>
      )}
      {interactive && (
        <div className="absolute bottom-3 left-3 right-3 z-[400] flex flex-wrap gap-2 pointer-events-none">
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
        <div className="absolute bottom-3 left-3 z-[400] bg-black/65 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1.5 rounded-full pointer-events-none">
          {points.length >= 2 ? `Hành trình · ${points.length} điểm · tuyến thực tế` : 'Vị trí bắt đầu'}
        </div>
      )}
    </div>
  );
}
