'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CityIssue, IssueCategory, IssueSeverity } from '@/types/city-issue';
import {
  MapPin,
  Upload,
  CheckCircle2,
  Camera,
  Layers,
  ArrowRight,
  ArrowLeft,
  X,
} from 'lucide-react';

interface ReportIssueWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitIssue: (issue: CityIssue) => void;
}

const CATEGORIES: { label: string; value: IssueCategory; icon: string }[] = [
  { label: 'Pothole & Road Defect', value: 'Pothole', icon: '🚧' },
  { label: 'Broken Streetlight / Power', value: 'Broken Streetlight', icon: '💡' },
  { label: 'Water Leak & Pipe Burst', value: 'Water Leak', icon: '💧' },
  { label: 'Trash & Waste Dump', value: 'Trash Accumulation', icon: '🗑️' },
  { label: 'Traffic Signal Failure', value: 'Traffic Signal', icon: '🚦' },
  { label: 'Damaged Sidewalk & Curb', value: 'Damaged Sidewalk', icon: '🚶' },
  { label: 'Illegal Parking / Blocking', value: 'Illegal Parking', icon: '🚗' },
  { label: 'Tree / Branch Hazard', value: 'Tree Hazard', icon: '🌳' },
];

export const ReportIssueWizard: React.FC<ReportIssueWizardProps> = ({
  open,
  onOpenChange,
  onSubmitIssue,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('Pothole');
  const [severity, setSeverity] = useState<IssueSeverity>('Medium');
  const [reporterName, setReporterName] = useState('');

  // Location State
  const [address, setAddress] = useState('742 Evergreen Terrace, Metro Center, Ward 3');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 40.7580,
    lng: -73.9855,
  });

  // Media State
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'
  );
  const [photoName, setPhotoName] = useState('pothole_evidence_01.jpg');

  const handleSimulatePinDrop = (latOffset: number, lngOffset: number, newAddress: string) => {
    setCoords({
      lat: Number((40.7580 + latOffset).toFixed(5)),
      lng: Number((-73.9855 + lngOffset).toFixed(5)),
    });
    setAddress(newAddress);
    setIsPinMoved(true);
  };

  const handlePhotoUploadSimulation = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoName(file.name);
      setSelectedPhoto(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newTicketId = `MC-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const nowIso = new Date().toISOString();

    const newIssue: CityIssue = {
      id: newTicketId,
      title: title.trim() || `${category} reported on ${address.split(',')[0]}`,
      description: description.trim() || 'Citizen reported municipal grievance via mobile portal.',
      category,
      status: 'Open',
      severity,
      coordinates: coords,
      address,
      upvotes: 1,
      reporterName: reporterName.trim() || 'Anonymous Resident',
      dateSubmitted: nowIso,
      imageUrl: selectedPhoto || undefined,
      updatesTimeline: [
        {
          id: `t-${Date.now()}`,
          status: 'Open',
          timestamp: nowIso,
          note: 'Issue successfully filed via Citizen Mobile Wizard and routed to municipal dispatch.',
          author: reporterName.trim() || 'Citizen Mobile App',
        },
      ],
    };

    onSubmitIssue(newIssue);
    onOpenChange(false);

    // Reset wizard
    setStep(1);
    setTitle('');
    setDescription('');
    setCategory('Pothole');
    setSeverity('Medium');
    setReporterName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <Badge variant="default" className="bg-teal-700 text-white font-mono text-[10px]">
              STEP {step} OF 3
            </Badge>
            <span className="text-xs font-medium text-slate-500 font-mono">
              {step === 1 ? 'Details' : step === 2 ? 'Location' : 'Evidence'}
            </span>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 mt-1">
            {step === 1 && 'Report a Municipal Grievance'}
            {step === 2 && 'Pin Incident Location'}
            {step === 3 && 'Upload Photographic Evidence'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && 'Provide primary details to direct your ticket to the responsible department.'}
            {step === 2 && 'Verify GPS coordinates and street address for on-site crew navigation.'}
            {step === 3 && 'Attach photo proof to accelerate inspection and work order assignment.'}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-teal-700 h-full transition-all duration-300"
            style={{ width: step === 1 ? '33.33%' : step === 2 ? '66.66%' : '100%' }}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* STEP 1: ISSUE DETAILS */}
          {step === 1 && (
            <div className="space-y-3.5 animate-in fade-in-50 duration-200">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Issue Category <span className="text-rose-600">*</span>
                </label>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IssueCategory)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Issue Title <span className="text-rose-600">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Deep pothole causing tire damage near crosswalk"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Severity Level
                  </label>
                  <Select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as IssueSeverity)}
                  >
                    <option value="Low">🟢 Low (Routine maintenance)</option>
                    <option value="Medium">🟡 Medium (Urgent attention)</option>
                    <option value="High">🔴 High (Emergency safety risk)</option>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Your Name / Contact
                  </label>
                  <Input
                    placeholder="e.g. Maya Lin"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Description & Context
                </label>
                <Textarea
                  rows={3}
                  placeholder="Describe the exact location landmarks, duration of issue, or immediate hazards..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 2: LOCATION SELECTOR */}
          {step === 2 && (
            <div className="space-y-3.5 animate-in fade-in-50 duration-200">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Street Address / Landmark
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-teal-700 absolute left-3 top-2.5" />
                  <Input
                    className="pl-9"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter landmark or street address..."
                  />
                </div>
              </div>

              {/* Styled Mock Map Widget */}
              <div className="relative h-56 rounded-xl border border-slate-200 overflow-hidden bg-slate-900 shadow-inner group">
                {/* Simulated Map Background Grid */}
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-70" />

                {/* Simulated Street Network Graphics */}
                <svg className="absolute inset-0 w-full h-full stroke-slate-700/60 stroke-[2] fill-none">
                  <path d="M 0 50 Q 150 90 300 40 T 600 70" />
                  <path d="M 50 0 L 120 220" />
                  <path d="M 280 0 L 260 220" />
                  <path d="M 0 140 Q 200 130 500 160" />
                  <circle cx="280" cy="110" r="28" className="stroke-teal-500/40 fill-teal-950/30" />
                </svg>

                {/* Center Target Marker Pin */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10">
                  <div className="bg-teal-600 text-white p-2 rounded-full shadow-lg ring-4 ring-teal-400/30 animate-bounce">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] font-bold bg-slate-950 text-teal-300 px-2 py-0.5 rounded-full mt-1 border border-teal-600/40 shadow-sm">
                    {coords.lat}, {coords.lng}
                  </span>
                </div>

                {/* Map Control Bar Overlay */}
                <div className="absolute top-2 left-2 z-10 flex gap-1.5">
                  <span className="text-[10px] font-mono bg-slate-950/80 backdrop-blur-xs text-slate-300 px-2 py-1 rounded border border-slate-700 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-teal-400" /> Mapbox Vector Layer
                  </span>
                </div>

                {/* Simulated Preset Quick Pins */}
                <div className="absolute bottom-2 inset-x-2 z-10 flex items-center justify-between bg-slate-950/85 backdrop-blur-xs p-2 rounded-lg border border-slate-800 text-[11px] text-slate-300">
                  <span>Quick Pin Preset:</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSimulatePinDrop(0.0021, -0.0015, '450 Lexington Ave, Metro Center, Ward 3')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-teal-900 text-slate-200 text-[10px] font-mono transition border border-slate-700 cursor-pointer"
                    >
                      Ward 3 Plaza
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulatePinDrop(-0.0035, 0.0042, '180 Waterfront Blvd, Riverside, Ward 6')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-teal-900 text-slate-200 text-[10px] font-mono transition border border-slate-700 cursor-pointer"
                    >
                      Ward 6 Waterfront
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600 font-mono">
                <span>Coordinates: {coords.lat}, {coords.lng}</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> High Accuracy (GPS)
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: PHOTO EVIDENCE DROP-ZONE */}
          {step === 3 && (
            <div className="space-y-3.5 animate-in fade-in-50 duration-200">
              <div className="border-2 border-dashed border-slate-200 hover:border-teal-600 rounded-xl p-6 text-center bg-slate-50/50 transition-colors">
                <input
                  type="file"
                  id="wizard-photo-upload"
                  accept="image/*"
                  onChange={handlePhotoUploadSimulation}
                  className="hidden"
                />
                <label htmlFor="wizard-photo-upload" className="cursor-pointer flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    Tap to upload or take photo
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports JPG, PNG, WEBP (Max 10MB)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 pointer-events-none"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" /> Browse Gallery
                  </Button>
                </label>
              </div>

              {/* Photo Preview Card */}
              {selectedPhoto && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3 shadow-xs">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                    <img src={selectedPhoto} alt="Evidence" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{photoName}</p>
                    <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Evidence Attached
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">EXIF metadata verified</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPhoto(null);
                      setPhotoName('');
                    }}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Summary recap before submission */}
              <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Category:</span>
                  <span className="font-bold text-slate-900">{category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-medium text-slate-900 max-w-[220px] truncate">{address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Priority Level:</span>
                  <Badge variant={severity === 'High' ? 'destructive' : severity === 'Medium' ? 'warning' : 'secondary'}>
                    {severity} Severity
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Dialog Navigation Actions */}
          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-between sm:justify-between">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep((prev) => (prev === 3 ? 2 : 1))}
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => {
                  if (step === 1 && !title.trim()) {
                    setTitle(`${category} on ${address.split(',')[0]}`);
                  }
                  setStep((prev) => (prev === 1 ? 2 : 3));
                }}
              >
                Next Step <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            ) : (
              <Button type="submit" variant="default" size="sm" className="bg-teal-700 hover:bg-teal-800">
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Submit City Grievance
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
