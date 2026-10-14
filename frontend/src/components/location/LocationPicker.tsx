import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Compass, AlertCircle, Search, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';

// Fix for default Leaflet icon paths in React bundle
const customMarkerIcon = new L.DivIcon({
  className: 'custom-map-marker',
  html: `
    <div style="
      background-color: #0B5F63;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid #FFFFFF;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background-color: #FFFFFF;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export interface LocationData {
  latitude: number;
  longitude: number;
  addressText: string;
  landmark: string;
  ward: string;
}

interface LocationPickerProps {
  value: LocationData;
  onChange: (data: LocationData) => void;
  defaultCenter?: [number, number];
}

// Sub-component to handle map clicks and viewport recentering
function MapEventsHandler({
  position,
  onPositionChange,
}: {
  position: [number, number];
  onPositionChange: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    map.flyTo(position, map.getZoom(), { duration: 0.8 });
  }, [position, map]);

  return null;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  defaultCenter = [19.076, 72.8777], // Default city coordinates
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const currentCoords: [number, number] = useMemo(() => {
    if (value.latitude && value.longitude) {
      return [value.latitude, value.longitude];
    }
    return defaultCenter;
  }, [value.latitude, value.longitude, defaultCenter]);

  // Fast LRU/Map Cache and AbortController to prevent slow or stuck geocoding
  const geocodeCache = useRef<Map<string, { addressText: string; ward: string }>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Reverse geocode lat/lng to readable address with fast multi-tier resolution & caching
  const reverseGeocode = async (lat: number, lng: number) => {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

    // 1. Instant 0ms cache check
    if (geocodeCache.current.has(cacheKey)) {
      const cached = geocodeCache.current.get(cacheKey)!;
      onChange({
        ...value,
        latitude: lat,
        longitude: lng,
        addressText: value.addressText || cached.addressText,
        ward: value.ward || cached.ward,
      });
      setIsGeocoding(false);
      return;
    }

    // Cancel any previous pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsGeocoding(true);

    // Timeout safety: guarantee isGeocoding resolves and never hangs
    const timeoutId = setTimeout(() => {
      controller.abort();
      setIsGeocoding(false);
    }, 2500);

    try {
      // 2. High-speed client reverse geocode API (<250ms)
      const fastUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
      const res = await fetch(fastUrl, { signal: controller.signal });

      if (res.ok) {
        clearTimeout(timeoutId);
        const data = await res.json();
        const locality = data.locality || data.city || '';
        const fullAddress = [data.locality, data.city, data.principalSubdivision, data.countryName]
          .filter(Boolean)
          .join(', ');
        const wardName = locality ? `Ward - ${locality}` : '';

        const resolved = {
          addressText: fullAddress || `Location near ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          ward: wardName || value.ward,
        };

        geocodeCache.current.set(cacheKey, resolved);

        onChange({
          ...value,
          latitude: lat,
          longitude: lng,
          addressText: value.addressText || resolved.addressText,
          ward: value.ward || resolved.ward,
        });
        setIsGeocoding(false);
        return;
      }
    } catch {
      // Fast API aborted or network error, attempt fallback
    }

    // 3. Fallback to Nominatim if not aborted
    try {
      if (!controller.signal.aborted) {
        const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
        const nomRes = await fetch(nomUrl, {
          headers: { 'Accept-Language': 'en' },
          signal: controller.signal,
        });

        if (nomRes.ok) {
          clearTimeout(timeoutId);
          const data = await nomRes.json();
          const address = data.display_name || '';
          const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || '';

          const resolved = {
            addressText: address,
            ward: suburb ? `Ward - ${suburb}` : value.ward,
          };

          geocodeCache.current.set(cacheKey, resolved);

          onChange({
            ...value,
            latitude: lat,
            longitude: lng,
            addressText: value.addressText || resolved.addressText,
            ward: value.ward || resolved.ward,
          });
        }
      }
    } catch {
      // Fallback silently
    } finally {
      clearTimeout(timeoutId);
      setIsGeocoding(false);
    }
  };

  const handleCoordsChange = (lat: number, lng: number) => {
    const cleanLat = Number(lat.toFixed(6));
    const cleanLng = Number(lng.toFixed(6));

    // Instantly propagate coordinates so pin and state are updated immediately
    onChange({
      ...value,
      latitude: cleanLat,
      longitude: cleanLng,
    });

    // Debounce reverse geocoding to prevent excessive network spam on drag/clicks
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      reverseGeocode(cleanLat, cleanLng);
    }, 150);
  };

  // Fallback: estimate location via Network IP if device GPS is blocked
  const fetchLocationByIp = async (): Promise<boolean> => {
    try {
      const response = await fetch('https://ipwho.is/');
      if (response.ok) {
        const data = await response.json();
        if (data && data.success && data.latitude && data.longitude) {
          const lat = Number(data.latitude);
          const lng = Number(data.longitude);
          handleCoordsChange(lat, lng);
          const place = [data.city, data.region].filter(Boolean).join(', ');
          setGeoNotice(
            `Located near ${place} via network connection. You can drag the pin on the map to pinpoint the exact street.`
          );
          setGeoError(null);
          return true;
        }
      }
    } catch (err) {
      console.warn('IP fallback failed', err);
    }
    return false;
  };

  // Auto-detect on mount if no coordinates exist yet
  useEffect(() => {
    if (!value.latitude || value.latitude === 0) {
      fetchLocationByIp();
    }
  }, []);

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    setGeoError(null);
    setGeoNotice(null);

    if (!navigator.geolocation) {
      const fallbackSuccess = await fetchLocationByIp();
      setIsDetecting(false);
      if (!fallbackSuccess) {
        setGeoError('Geolocation is not supported by your browser. Please search or select your location on the map.');
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetecting(false);
        setPermissionBlocked(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        handleCoordsChange(lat, lng);
        setGeoNotice('High-accuracy GPS location detected.');
      },
      async (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionBlocked(true);
        }

        // Auto fallback to IP geolocation so the user is never stuck
        const fallbackSuccess = await fetchLocationByIp();
        setIsDetecting(false);

        if (!fallbackSuccess) {
          let msg = 'Failed to retrieve location.';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Location permission was denied in your browser settings. Please enable location or select manually on the map.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = 'Location information is unavailable. Please select your location manually.';
          } else if (error.code === error.TIMEOUT) {
            msg = 'Location request timed out. Please try again or select manually.';
          }
          setGeoError(msg);
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setGeoError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const results = await res.json();
        setSearchResults(results);
        if (results.length === 0) {
          setGeoError(`No results found for "${searchQuery}". Try adding city or landmark name.`);
        } else if (results.length === 1) {
          handleSelectSearchResult(results[0]);
        }
      }
    } catch {
      setGeoError('Search service temporarily unavailable. You can click directly on the map.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    handleCoordsChange(lat, lng);
    setSearchResults([]);
    setSearchQuery('');
    setGeoNotice(`Map centered on: ${item.display_name.split(',')[0]}`);
  };

  const markerRef = useRef<L.Marker | null>(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const pos = marker.getLatLng();
          handleCoordsChange(pos.lat, pos.lng);
        }
      },
    }),
    [value]
  );

  return (
    <div className="space-y-4">
      {/* Map Header & GPS Detector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <label className="block text-sm font-semibold text-ink-950">
            Pinpoint Issue Location <span className="text-status-rejected">*</span>
          </label>
          <p className="text-xs text-ink-500">
            Click map or drag pin to exact issue location.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDetectLocation}
          isLoading={isDetecting}
          leftIcon={<Navigation className="w-4 h-4 text-primary-600" />}
          className="self-start sm:self-auto"
        >
          Detect My Location
        </Button>
      </div>

      {/* Area & Landmark Search Bar */}
      <div className="relative">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area, neighborhood, or landmark (e.g. Navrangpura, MG Road)..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-line rounded-input bg-surface focus:ring-1 focus:ring-primary-600 focus:outline-none"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            isLoading={isSearching}
          >
            Search Area
          </Button>
        </form>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-line rounded-lg shadow-lg z-[500] max-h-52 overflow-y-auto">
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSearchResult(result)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-primary-50 border-b border-line last:border-0 flex items-start gap-2 text-ink-950 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0 mt-0.5" />
                <span className="truncate">{result.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Geolocation Notice Banner */}
      {geoNotice && (
        <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg text-xs text-primary-900 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
            <span>{geoNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setGeoNotice(null)}
            className="text-primary-700 hover:text-primary-950 text-xs font-semibold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Browser Permission Blocked Helper Banner */}
      {permissionBlocked && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-amber-950">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Browser GPS Permission Denied</span>
          </div>
          <p className="text-[11px] text-amber-800">
            Your browser blocked device GPS, so we placed the pin using your approximate network location. To enable high-accuracy satellite GPS:
          </p>
          <div className="text-[11px] text-amber-950 bg-amber-100/70 p-2 rounded border border-amber-200">
            Click the lock/tune icon <strong>🔒</strong> in your browser address bar next to <strong>localhost</strong> ➔ Set <strong>Location</strong> to <strong>Allow</strong> ➔ Click "Detect My Location" again.
          </div>
        </div>
      )}

      {geoError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-status-rejected flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Leaflet Interactive Map Container */}
      <div className="relative rounded-lg border border-line overflow-hidden shadow-inner h-[280px] sm:h-[320px] bg-slate-100 z-0">
        <MapContainer
          center={currentCoords}
          zoom={15}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={currentCoords}
            ref={markerRef}
            icon={customMarkerIcon}
          />
          <MapEventsHandler position={currentCoords} onPositionChange={handleCoordsChange} />
        </MapContainer>

        {/* Floating Monospace Coordinates Overlay */}
        <div className="absolute bottom-2 left-2 z-[400] bg-ink-950/90 text-white backdrop-blur-sm px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 shadow">
          <Compass className="w-3.5 h-3.5 text-primary-100" />
          <span>
            {value.latitude ? `${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}` : 'No point chosen'}
          </span>
          {isGeocoding && <span className="animate-pulse text-accent-500">Resolving...</span>}
        </div>
      </div>

      {/* Address and Ward text inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-ink-700 mb-1">
            Street Address / Specific Location <span className="text-status-rejected">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-ink-500" />
            <input
              type="text"
              value={value.addressText}
              onChange={(e) => onChange({ ...value, addressText: e.target.value })}
              placeholder="e.g. Near Bus Stop 14, Ring Road, Sector 3"
              className="w-full pl-9 pr-3 py-2 text-sm border border-line rounded-lg focus:ring-1 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-700 mb-1">
            Nearby Landmark
          </label>
          <input
            type="text"
            value={value.landmark}
            onChange={(e) => onChange({ ...value, landmark: e.target.value })}
            placeholder="e.g. Opposite Government High School"
            className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:ring-1 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-700 mb-1">
            Ward / Zone
          </label>
          <input
            type="text"
            value={value.ward}
            onChange={(e) => onChange({ ...value, ward: e.target.value })}
            placeholder="e.g. Ward 4 / Central Zone"
            className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:ring-1 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
          />
        </div>
      </div>
    </div>
  );
};
