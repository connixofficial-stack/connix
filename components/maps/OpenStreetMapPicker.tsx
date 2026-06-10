'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Search } from 'lucide-react';
import { useMapEvents } from 'react-leaflet';
import type { LeafletMouseEvent } from 'leaflet';

// Dynamically import map components (Leaflet doesn't support SSR)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

type Location = {
  lat: number;
  lng: number;
  address: string;
};

type OpenStreetMapPickerProps = {
  initialLocation?: Location;
  onLocationChange?: (location: Location) => void;
  height?: string;
  showSearch?: boolean;
};

// Nominatim API functions (free geocoding service)
async function searchAddress(query: string): Promise<Location | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          'User-Agent': 'VietAdmin-Contact-Map/1.0',
        },
      }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        address: data[0].display_name,
      };
    }
    return null;
  } catch (error) {
    console.error('Search error:', error);
    return null;
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'User-Agent': 'VietAdmin-Contact-Map/1.0',
        },
      }
    );
    const data = await response.json();
    return data.display_name || '';
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return '';
  }
}

function MapClickHandler({
  onLocationChange,
}: {
  onLocationChange: (location: Location) => void;
}) {
  useMapEvents({
    click: async (e: LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const address = await reverseGeocode(lat, lng);
      onLocationChange({ lat, lng, address });
    },
  });
  return null;
}

function SearchBox({
  onSearch,
}: {
  onSearch: (location: Location) => void;
}) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'VietAdmin-Contact-Map/1.0',
            },
          }
        );
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Autocomplete error:', error);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectSuggestion = (suggestion: { display_name: string; lat: string; lon: string }) => {
    const location = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      address: suggestion.display_name,
    };
    onSearch(location);
    setQuery(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setShowSuggestions(false);
    const result = await searchAddress(query);
    setIsSearching(false);

    if (result) {
      onSearch(result);
    } else {
      alert('Không tìm thấy địa chỉ. Vui lòng thử lại.');
    }
  };

  return (
    <form onSubmit={handleSearch} className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md px-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
        <input
          type="text"
          placeholder="Tìm kiếm địa chỉ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          disabled={isSearching}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-white border border-slate-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 text-sm"
              >
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{suggestion.display_name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}

export default function OpenStreetMapPicker({
  initialLocation = { lat: 10.762622, lng: 106.660172, address: 'TP. Hồ Chí Minh' },
  onLocationChange,
  height = '400px',
  showSearch = true,
}: OpenStreetMapPickerProps) {
  const [markerPosition, setMarkerPosition] = useState(initialLocation);
  const [map, setMap] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      void import('leaflet').then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
      });
    }
  }, []);

  const handleLocationChange = (location: Location) => {
    setMarkerPosition(location);
    onLocationChange?.(location);

    // Pan map to new location
    if (map) {
      map.setView([location.lat, location.lng], 15);
    }
  };

  if (!isClient) {
    return (
      <div className="bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border" style={{ height }}>
        <div className="text-center">
          <MapPin size={32} className="mx-auto mb-2" />
          <span className="text-sm">Đang tải bản đồ...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }} className="relative rounded-xl overflow-hidden border">
      {showSearch && <SearchBox onSearch={handleLocationChange} />}

      <MapContainer
        center={[markerPosition.lat, markerPosition.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        ref={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[markerPosition.lat, markerPosition.lng]} />
        <MapClickHandler onLocationChange={handleLocationChange} />
      </MapContainer>
    </div>
  );
}
