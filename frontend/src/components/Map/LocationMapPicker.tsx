import { useEffect, useRef } from 'react';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

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

export default function LocationMapPicker({
  center = { lat: 21.028511, lng: 105.804817 },
  zoom = 6,
  marker,
  onLocationChange,
  className = '',
  height = '320px',
}: LocationMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onLocationChange);

  useEffect(() => {
    onChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([center.lat, center.lng], zoom);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      const loc = { lat: e.latlng.lat, lng: e.latlng.lng };
      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng);
      } else {
        markerRef.current = L.marker(e.latlng, { draggable: true }).addTo(map);
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current!.getLatLng();
          onChangeRef.current?.({ lat: pos.lat, lng: pos.lng });
        });
      }
      onChangeRef.current?.(loc);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center.lat, center.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (marker) {
      const latlng = L.latLng(marker.lat, marker.lng);
      if (markerRef.current) {
        markerRef.current.setLatLng(latlng);
      } else {
        markerRef.current = L.marker(latlng, { draggable: true }).addTo(map);
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current!.getLatLng();
          onChangeRef.current?.({ lat: pos.lat, lng: pos.lng });
        });
      }
      map.setView(latlng, Math.max(map.getZoom(), 12));
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [marker?.lat, marker?.lng]);

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-[var(--border-subtle)] ${className}`}
      style={{ height }}
    >
      <div ref={containerRef} className="w-full h-full z-0" />
      <div className="absolute bottom-3 left-3 z-10 bg-black/60 backdrop-blur-sm text-white text-[11px] px-3 py-1.5 rounded-full pointer-events-none">
        Nhấn bản đồ để ghim vị trí · Kéo ghim để điều chỉnh
      </div>
    </div>
  );
}
