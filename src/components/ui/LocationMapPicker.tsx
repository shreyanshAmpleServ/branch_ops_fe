import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, MapPin, Search } from 'lucide-react';

declare const L: any;

interface LocationMapPickerProps {
  lat: number | string | null;
  lng: number | string | null;
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
}

export const LocationMapPicker: React.FC<LocationMapPickerProps> = ({
  lat,
  lng,
  onLocationSelect,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const fullMapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const fullMapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const fullMarkerRef = useRef<any>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const defaultLat = lat ? Number(lat) : -6.7924;
  const defaultLng = lng ? Number(lng) : 39.2083;

  // Custom marker icon to prevent missing Leaflet asset issue
  const getMarkerIcon = () => {
    if (typeof L === 'undefined') return null;
    return L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  };

  const handlePositionChange = async (newLat: number, newLng: number) => {
    let address = '';
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          address = data.display_name;
        }
      }
    } catch {
      // Ignore geocoding failure
    }
    onLocationSelect(newLat, newLng, address);
  };

  // Initialize standard inline map
  useEffect(() => {
    if (typeof L === 'undefined' || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const icon = getMarkerIcon();
      const marker = L.marker([defaultLat, defaultLng], {
        draggable: true,
        icon: icon || undefined,
      }).addTo(map);

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        handlePositionChange(position.lat, position.lng);
      });

      map.on('click', (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        handlePositionChange(clickLat, clickLng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      mapInstanceRef.current.setView([defaultLat, defaultLng], mapInstanceRef.current.getZoom());
      if (markerRef.current) {
        markerRef.current.setLatLng([defaultLat, defaultLng]);
      }
    }
  }, [defaultLat, defaultLng]);

  // Initialize fullscreen map when opened
  useEffect(() => {
    if (!isFullscreen || typeof L === 'undefined' || !fullMapContainerRef.current) return;

    const timer = setTimeout(() => {
      if (!fullMapInstanceRef.current && fullMapContainerRef.current) {
        const fullMap = L.map(fullMapContainerRef.current).setView([defaultLat, defaultLng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(fullMap);

        const icon = getMarkerIcon();
        const fullMarker = L.marker([defaultLat, defaultLng], {
          draggable: true,
          icon: icon || undefined,
        }).addTo(fullMap);

        fullMarker.on('dragend', () => {
          const position = fullMarker.getLatLng();
          handlePositionChange(position.lat, position.lng);
        });

        fullMap.on('click', (e: any) => {
          const { lat: clickLat, lng: clickLng } = e.latlng;
          fullMarker.setLatLng([clickLat, clickLng]);
          handlePositionChange(clickLat, clickLng);
        });

        fullMapInstanceRef.current = fullMap;
        fullMarkerRef.current = fullMarker;
      } else if (fullMapInstanceRef.current) {
        fullMapInstanceRef.current.invalidateSize();
        fullMapInstanceRef.current.setView([defaultLat, defaultLng], 15);
        if (fullMarkerRef.current) {
          fullMarkerRef.current.setLatLng([defaultLat, defaultLng]);
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isFullscreen, defaultLat, defaultLng]);

  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const first = data[0];
          const newLat = Number(first.lat);
          const newLng = Number(first.lon);
          onLocationSelect(newLat, newLng, first.display_name);
        }
      }
    } catch {
      // Ignore search errors
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search Address Bar */}
      <form onSubmit={handleSearchLocation} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
          <input
            type="text"
            placeholder="Search address or landmark to center map..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none border focus:ring-2 focus:ring-primary/20"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-dark transition-colors shrink-0"
        >
          {isSearching ? 'Searching...' : 'Find Place'}
        </button>
      </form>

      {/* Inline Map Box */}
      <div className="relative rounded-2xl overflow-hidden border shadow-sm h-72" style={{ borderColor: 'var(--color-border)' }}>
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Controls */}
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur text-white text-xs font-bold flex items-center gap-1.5 hover:bg-slate-900 shadow-lg transition-colors"
          >
            <Maximize2 className="h-3.5 w-3.5" /> Fullscreen Map
          </button>
        </div>

        <div className="absolute bottom-2 left-2 z-10 bg-slate-900/75 backdrop-blur text-white px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1">
          <MapPin className="h-3 w-3 text-emerald-400" /> Click or drag pin anywhere to select location
        </div>
      </div>

      {/* Fullscreen Map Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex flex-col p-4 md:p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-white shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Interactive Location Selector</h3>
                <p className="text-xs text-gray-400">Click anywhere on the map or drag the pin to set exact coordinates and address.</p>
              </div>
            </div>

            <button
              onClick={() => setIsFullscreen(false)}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <Minimize2 className="h-4 w-4" /> Done / Close Map
            </button>
          </div>

          {/* Search bar inside fullscreen */}
          <form onSubmit={handleSearchLocation} className="flex gap-2 mb-3 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search city, street or landmark..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs outline-none bg-slate-900 border border-slate-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary/40"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-dark transition-colors"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Fullscreen Map Canvas */}
          <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800 relative shadow-2xl">
            <div ref={fullMapContainerRef} className="w-full h-full" />
            <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/90 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 shadow-xl">
              <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Current Pin: <strong className="font-mono text-primary">{defaultLat.toFixed(6)}, {defaultLng.toFixed(6)}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
