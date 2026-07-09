import React, { useEffect, useRef, useState } from 'react';
import Map, { Source, Layer, Popup, Marker, NavigationControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
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

interface MapLibreMapProps {
  center?: [number, number];
  zoom?: number;
  locations?: MapLocation[];
  viewMode?: 'markers' | 'cluster' | 'heatmap';
  routePoints?: MapLocation[];
  onAddPointToRoute?: (loc: MapLocation) => void;
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
    <div class="space-y-2.5 text-slate-100">
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

export const MapLibreMap: React.FC<MapLibreMapProps> = ({
  center = [21.028511, 105.804817],
  zoom = 13,
  locations = [],
  viewMode = 'markers',
  routePoints = [],
  onAddPointToRoute,
}) => {
  const { lang } = useLang();
  const vi = lang === 'vi';
  const mapRef = useRef<any>(null);
  const [activePopup, setActivePopup] = useState<MapLocation | null>(null);

  const [mapStyle, setMapStyle] = useState<'street' | 'satellite' | '3d'>('street');
  const [viewState, setViewState] = useState({
    latitude: center[0],
    longitude: center[1],
    zoom: zoom,
    pitch: 0,
    bearing: 0,
  });

  // Sync center when prop changes
  useEffect(() => {
    setViewState(prev => ({
      ...prev,
      latitude: center[0],
      longitude: center[1],
    }));
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
    
    // Add red marker image
    const imgRed = new Image(30, 30);
    imgRed.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgRedString);
    imgRed.onload = () => {
      if (!map.hasImage('marker-red')) map.addImage('marker-red', imgRed);
    };

    // Add gold marker image
    const imgGold = new Image(30, 30);
    imgGold.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgGoldString);
    imgGold.onload = () => {
      if (!map.hasImage('marker-gold')) map.addImage('marker-gold', imgGold);
    };
  };

  // Fit map bounds to show route
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || routePoints.length < 2) return;

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
  }, [routePoints]);

  const handleMapClick = (event: any) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Check click on clusters
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

    // Check click on unclustered points (if in cluster mode)
    if (viewState.zoom >= 1) {
      const unclustered = map.queryRenderedFeatures(event.point, {
        layers: ['unclustered-point']
      });
      if (unclustered.length) {
        const props = unclustered[0].properties;
        const loc = locations.find(l => l.id === props.id);
        if (loc) {
          setActivePopup(loc);
        }
      }
    }
  };

  // Build GeoJSON data for clustering and heatmap
  const geojsonFeatures = locations.map(loc => ({
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
      isCheckin: !!loc.user
    }
  }));

  const geojsonData: any = {
    type: 'FeatureCollection',
    features: geojsonFeatures
  };

  const routeGeoJSON: any = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: routePoints.map(p => [p.lng, p.lat])
    }
  };

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-800">
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        {...viewState}
        onMove={(evt: any) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        onLoad={handleMapLoad}
        mapStyle={mapStyle === 'satellite' ? SATELLITE_STYLE : STREET_STYLE}
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
      >
        <NavigationControl position="top-left" showCompass={false} />

        {/* 1. Draw Dash Route Line */}
        {routePoints.length >= 2 && (
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
        )}

        {/* 2. Markers View Mode */}
        {viewMode === 'markers' && 
          locations.map(loc => {
            const isCheckin = !!loc.user;
            return (
              <Marker
                key={loc.id}
                longitude={loc.lng}
                latitude={loc.lat}
                onClick={(e: any) => {
                  e.originalEvent.stopPropagation();
                  setActivePopup(loc);
                }}
                anchor="bottom"
              >
                <div 
                  className="custom-map-marker cursor-pointer hover:scale-110 transition-transform"
                  dangerouslySetInnerHTML={{ __html: isCheckin ? svgRedString : svgGoldString }}
                />
              </Marker>
            );
          })
        }

        {/* 3. Cluster View Mode */}
        {viewMode === 'cluster' && (
          <Source
            id="locations-source"
            type="geojson"
            data={geojsonData}
            cluster={true}
            clusterMaxZoom={14}
            clusterRadius={50}
          >
            {/* Cluster circles */}
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
            {/* Cluster count text */}
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
            {/* Unclustered points Layer */}
            <Layer
              id="unclustered-point"
              type="symbol"
              filter={['!', ['has', 'point_count']]}
              layout={{
                'icon-image': [
                  'case',
                  ['get', 'isCheckin'],
                  'marker-red',
                  'marker-gold'
                ],
                'icon-size': 1.0,
                'icon-allow-overlap': true
              }}
            />
          </Source>
        )}

        {/* 4. Heatmap View Mode */}
        {viewMode === 'heatmap' && (
          <Source id="heatmap-source" type="geojson" data={geojsonData}>
            <Layer
              id="heatmap-layer"
              type="heatmap"
              paint={{
                'heatmap-weight': 1,
                'heatmap-intensity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0,
                  1,
                  9,
                  3
                ],
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
                'heatmap-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0,
                  3,
                  9,
                  25
                ],
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
              dangerouslySetInnerHTML={{ __html: createPopupContent(activePopup, vi) }} 
            />
          </Popup>
        )}
      </Map>

      {/* Style switcher */}
      <div className="absolute top-3 right-3 z-10 flex gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-1 rounded-xl shadow-lg">
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

      <div className="absolute top-14 right-3 z-10 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-[var(--gold)]">
        {viewMode.toUpperCase()} Mode Active
      </div>
    </div>
  );
};

export default MapLibreMap;
