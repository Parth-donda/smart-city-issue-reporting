import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { Issue } from '../../types/issues';
import { StatusBadge, PriorityBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Flame,
  MapPin,
  Eye,
  Compass,
} from 'lucide-react';

interface IssueGISMapProps {
  issues: Issue[];
  onSelectIssue?: (issue: Issue) => void;
  height?: string;
  defaultViewMode?: 'markers' | 'heatmap';
}

// Safely extract coordinates from Issue object
export const getIssueCoordinates = (issue: Issue): [number, number] | null => {
  if (!issue.location) return null;
  const lat = typeof issue.location.latitude === 'string' ? parseFloat(issue.location.latitude) : issue.location.latitude;
  const lng = typeof issue.location.longitude === 'string' ? parseFloat(issue.location.longitude) : issue.location.longitude;
  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
    return [lat, lng];
  }
  return null;
};

// Custom DivIcon generator for markers based on priority
const createPriorityIcon = (priority: string, status: string) => {
  let bgColor = '#2F6FDE'; // Default Medium
  if (priority === 'CRITICAL') bgColor = '#B91C1C';
  else if (priority === 'HIGH') bgColor = '#D97706';
  else if (priority === 'LOW') bgColor = '#64748B';

  const isResolved = status === 'RESOLVED' || status === 'VERIFIED' || status === 'CLOSED';
  if (isResolved) bgColor = '#15803D';

  return new L.DivIcon({
    className: 'custom-gis-pin',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid #FFFFFF;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <div style="
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #FFFFFF;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

// Internal component to render the leaflet.heat layer
const HeatmapLayer: React.FC<{ points: [number, number, number][] }> = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    // L.heatLayer is injected by leaflet.heat onto L
    const heat = (L as any).heatLayer(points, {
      radius: 28,
      blur: 20,
      maxZoom: 16,
      max: 1.0,
      minOpacity: 0.35,
      gradient: {
        0.2: '#0B5F63',
        0.4: '#06D6A0',
        0.6: '#FFD166',
        0.8: '#F77F00',
        1.0: '#EF233C',
      },
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
};

// Auto-adjust bounds when issues list changes
const MapBoundsAdjuster: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [map, points]);

  return null;
};

export const IssueGISMap: React.FC<IssueGISMapProps> = ({
  issues,
  onSelectIssue,
  height = '560px',
  defaultViewMode = 'markers',
}) => {
  const [viewMode, setViewMode] = useState<'markers' | 'heatmap'>(defaultViewMode);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HIGH_CRITICAL'>('ALL');

  // Filter issues with valid coordinates
  const validItems = useMemo(() => {
    const list: Array<{ issue: Issue; coords: [number, number] }> = [];

    issues.forEach((issue) => {
      const coords = getIssueCoordinates(issue);
      if (!coords) return;

      // Status filter
      if (statusFilter === 'ACTIVE') {
        const isClosed = ['RESOLVED', 'VERIFIED', 'CLOSED', 'REJECTED'].includes(issue.status);
        if (isClosed) return;
      } else if (statusFilter === 'RESOLVED') {
        const isClosed = ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(issue.status);
        if (!isClosed) return;
      }

      // Priority filter
      if (priorityFilter === 'HIGH_CRITICAL') {
        if (issue.priority !== 'CRITICAL' && issue.priority !== 'HIGH') return;
      }

      list.push({ issue, coords });
    });

    return list;
  }, [issues, statusFilter, priorityFilter]);

  // Compute heatmap points [lat, lng, intensity]
  const heatmapPoints = useMemo(() => {
    return validItems.map(({ issue, coords }) => {
      let weight = 0.5;
      if (issue.priority === 'CRITICAL') weight = 1.0;
      else if (issue.priority === 'HIGH') weight = 0.8;
      else if (issue.priority === 'MEDIUM') weight = 0.5;
      else if (issue.priority === 'LOW') weight = 0.3;

      // Reduced intensity for resolved items in density map
      if (['RESOLVED', 'VERIFIED', 'CLOSED'].includes(issue.status)) {
        weight *= 0.4;
      }

      return [coords[0], coords[1], weight] as [number, number, number];
    });
  }, [validItems]);

  const rawCoords = useMemo(() => validItems.map((item) => item.coords), [validItems]);

  // Default center (average of issues or fallback coordinates)
  const centerCoordinates: [number, number] = useMemo(() => {
    if (validItems.length > 0) {
      const sumLat = validItems.reduce((acc, i) => acc + i.coords[0], 0);
      const sumLng = validItems.reduce((acc, i) => acc + i.coords[1], 0);
      return [sumLat / validItems.length, sumLng / validItems.length];
    }
    return [19.076, 72.8777]; // Fallback
  }, [validItems]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {/* ─────────────────────────────────────────────────────────────
          1. MAP TOOLBAR & CONTROLS
      ───────────────────────────────────────────────────────────── */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        {/* Left: View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('markers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'markers'
                  ? 'bg-primary-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Marker View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('heatmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'heatmap'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Heatmap Density</span>
            </button>
          </div>

          <span className="text-xs text-slate-500 font-medium pl-1">
            <strong>{validItems.length}</strong> points plotted
          </span>
        </div>

        {/* Right: Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:text-slate-900'
              }`}
            >
              All Status
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'ACTIVE' ? 'bg-amber-100 text-amber-900 font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Active Only
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('RESOLVED')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'RESOLVED' ? 'bg-emerald-100 text-emerald-900 font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Resolved
            </button>
          </div>

          {/* Priority Filter */}
          <button
            type="button"
            onClick={() => setPriorityFilter(priorityFilter === 'ALL' ? 'HIGH_CRITICAL' : 'ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              priorityFilter === 'HIGH_CRITICAL'
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            {priorityFilter === 'HIGH_CRITICAL' ? '🔥 High/Critical Only' : 'All Priorities'}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. LEAFLET MAP CANVAS
      ───────────────────────────────────────────────────────────── */}
      <div className="relative w-full" style={{ height }}>
        <MapContainer
          center={centerCoordinates}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapBoundsAdjuster points={rawCoords} />

          {/* Mode 1: Individual Markers */}
          {viewMode === 'markers' &&
            validItems.map(({ issue, coords }) => (
              <Marker
                key={issue.issue_id}
                position={coords}
                icon={createPriorityIcon(issue.priority, issue.status)}
              >
                <Popup className="custom-issue-popup">
                  <div className="p-1 space-y-2 max-w-xs font-sans">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                      <span className="font-mono text-xs font-bold text-primary-700">
                        {issue.issue_id}
                      </span>
                      <PriorityBadge priority={issue.priority} size="sm" />
                    </div>

                    <div>
                      <h4 className="font-heading font-bold text-sm text-slate-900 line-clamp-1">
                        {issue.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                        {issue.description}
                      </p>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{issue.location?.address_text || 'Address Geotagged'}</span>
                      </div>
                      {issue.location?.ward && (
                        <div className="text-slate-500 font-mono">
                          Ward: <strong>{issue.location.ward}</strong>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <StatusBadge status={issue.status} size="sm" />
                      {onSelectIssue && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onSelectIssue(issue)}
                          className="text-xs px-2.5 py-1 h-7 bg-primary-700 hover:bg-primary-800 text-white"
                        >
                          <Eye className="w-3 h-3 mr-1" /> Triage
                        </Button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Mode 2: Heatmap Density */}
          {viewMode === 'heatmap' && <HeatmapLayer points={heatmapPoints} />}
        </MapContainer>

        {/* ─────────────────────────────────────────────────────────────
            3. IN-MAP LEGEND OVERLAY
        ───────────────────────────────────────────────────────────── */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-3 shadow-lg text-xs space-y-2 pointer-events-auto">
          {viewMode === 'markers' ? (
            <div>
              <div className="font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-primary-700" />
                <span>Priority Markers</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                  <span className="text-slate-600">Critical</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                  <span className="text-slate-600">High</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span className="text-slate-600">Medium</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span className="text-slate-600">Resolved</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                <span>Defect Density Gradient</span>
              </div>
              <div className="w-36 h-2.5 rounded-full bg-gradient-to-r from-[#0B5F63] via-[#FFD166] to-[#EF233C] mb-1" />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Low Density</span>
                <span>Critical Hotspot</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
