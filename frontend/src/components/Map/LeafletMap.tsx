import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center = [21.028511, 105.804817], // Hanoi default
  zoom = 13,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    // Load OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Clean up map instance on component unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom]);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-800">
      <div ref={mapContainerRef} className="w-full h-full min-h-[400px] z-0" />
      <div className="absolute top-3 right-3 z-10 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold">
        OSM EPSG:3857 Layer Active
      </div>
    </div>
  );
};

export default LeafletMap;
