import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Compass, AlertCircle } from 'lucide-react';
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
  const [isGeocoding, setIsGeocoding] = useState(false);

  const currentCoords: [number, number] = useMemo(() => {
    if (value.latitude && value.longitude) {
      return [value.latitude, value.longitude];
    }
    return defaultCenter;
  }, [value.latitude, value.longitude, defaultCenter]);

  // Reverse geocode lat/lng to readable address
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (response.ok) {
        const data = await response.json();
        const address = data.display_name || '';
        const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || '';
        
        onChange({
          ...value,
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          addressText: value.addressText || address,
          ward: value.ward || (suburb ? `Ward - ${suburb}` : value.ward),
        });
      }
    } catch {
      // Fallback silently if offline or geocoder blocked
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleCoordsChange = (lat: number, lng: number) => {
    const cleanLat = Number(lat.toFixed(6));
    const cleanLng = Number(lng.toFixed(6));
    onChange({
      ...value,
      latitude: cleanLat,
      longitude: cleanLng,
    });
    reverseGeocode(cleanLat, cleanLng);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetecting(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetecting(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        handleCoordsChange(lat, lng);
      },
      (error) => {
        setIsDetecting(false);
        let msg = 'Failed to retrieve location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please select location manually on the map.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out.';
        }
        setGeoError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
