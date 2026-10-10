import React, { useState } from 'react';
import { MapPin, Navigation, Search } from 'lucide-react';
import { Button } from './Button';

export interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  className?: string;
}

export const MapPickerPlaceholder: React.FC<MapPickerProps> = ({
  initialLat = 18.5204,
  initialLng = 73.8567,
  initialAddress = 'Shivaji Nagar, Pune, Maharashtra',
  onLocationSelect,
  className = '',
}) => {
  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [address, setAddress] = useState<string>(initialAddress);

  const handleUseCurrentLocation = () => {
    // Simulated geolocation retrieval
    const simulatedLat = 18.5314;
    const simulatedLng = 73.8446;
    const simulatedAddress = 'FC Road, Deccan Gymkhana, Pune';
    setLat(simulatedLat);
    setLng(simulatedLng);
    setAddress(simulatedAddress);
    onLocationSelect?.(simulatedLat, simulatedLng, simulatedAddress);
  };

  return (
    <div className={`w-full bg-card border border-line rounded-card overflow-hidden shadow-soft ${className}`}>
      {/* Header Controls */}
      <div className="p-3 bg-surface border-b border-line flex flex-col sm:flex-row gap-2 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-500" />
          <input
            type="text"
            placeholder="Search address or landmark..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 bg-card border border-line rounded-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<Navigation className="w-3.5 h-3.5 text-primary-700" />}
          onClick={handleUseCurrentLocation}
        >
          Use My Current Location
        </Button>
      </div>

      {/* Map Surface Representation with OpenStreetMap Tiles Background */}
      <div className="relative w-full h-64 bg-slate-100 flex items-center justify-center overflow-hidden">
        {/* Stylized Grid for Map Canvas */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(#0A1A2A 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        <div className="z-10 flex flex-col items-center p-4 bg-card/95 border border-line rounded-card shadow-soft text-center max-w-xs">
          <MapPin className="w-8 h-8 text-semantic-danger mb-1 animate-bounce" />
          <p className="text-xs font-semibold text-ink-950 truncate w-full">{address}</p>
          <div className="flex gap-2 text-[11px] font-mono text-ink-500 mt-1">
            <span>Lat: {lat.toFixed(5)}</span>
            <span>Lng: {lng.toFixed(5)}</span>
          </div>
        </div>

        <div className="absolute bottom-2 right-2 text-[10px] text-ink-500 bg-card/80 px-2 py-0.5 rounded border border-line">
          © OpenStreetMap contributors
        </div>
      </div>
    </div>
  );
};

