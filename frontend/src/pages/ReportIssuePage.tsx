import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertTriangle,
  Lightbulb,
  Trash,
  Droplets,
  Waves,
  Trees,
  Dog,
  TrafficCone,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Copy,
  MapPin,
  ShieldAlert,
  ArrowRight,
  ThumbsUp,
  Users
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Stepper, Step } from '../components/ui/Stepper';
import { Badge } from '../components/ui/Badge';
import { LocationPicker, LocationData } from '../components/location/LocationPicker';
import { MediaUpload, UploadedMediaItem } from '../components/media/MediaUpload';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface Category {
  id: number;
  name: string;
  code: string;
  description: string;
  default_priority: string;
  icon_name: string;
}

const FALLBACK_CATEGORIES: Category[] = [
  { id: 1, name: 'Pothole & Road Damage', code: 'POTHOLE', description: 'Crater, uneven surface, missing manhole', default_priority: 'HIGH', icon_name: 'AlertTriangle' },
  { id: 2, name: 'Streetlight & Electrical', code: 'STREETLIGHT', description: 'Non-functional lamp, exposed wire, flickering pole', default_priority: 'MEDIUM', icon_name: 'Lightbulb' },
  { id: 3, name: 'Garbage & Solid Waste', code: 'GARBAGE', description: 'Overflowing bin, roadside dumping, missed collection', default_priority: 'MEDIUM', icon_name: 'Trash' },
  { id: 4, name: 'Water Supply & Leakage', code: 'WATER_LEAK', description: 'Pipeline burst, contaminated water, low pressure', default_priority: 'HIGH', icon_name: 'Droplets' },
  { id: 5, name: 'Drainage & Waterlogging', code: 'DRAINAGE', description: 'Clogged storm drain, sewer overflow, street flooded', default_priority: 'HIGH', icon_name: 'Waves' },
  { id: 6, name: 'Fallen Trees & Parks', code: 'FALLEN_TREE', description: 'Dangerous branch, fallen tree blocking road', default_priority: 'MEDIUM', icon_name: 'Trees' },
  { id: 7, name: 'Stray Animals & Health', code: 'STRAY_ANIMALS', description: 'Injured animal, rabid stray dog pack, carcass removal', default_priority: 'MEDIUM', icon_name: 'Dog' },
  { id: 8, name: 'Traffic & Signage', code: 'TRAFFIC_SIGNAL', description: 'Broken signal, knocked-down sign, road divider damage', default_priority: 'HIGH', icon_name: 'TrafficCone' },
];

const categoryIconMap: Record<string, React.ReactNode> = {
  AlertTriangle: <AlertTriangle className="w-5 h-5 text-accent-500" />,
  Lightbulb: <Lightbulb className="w-5 h-5 text-accent-500" />,
  Trash: <Trash className="w-5 h-5 text-accent-500" />,
  Droplets: <Droplets className="w-5 h-5 text-accent-500" />,
  Waves: <Waves className="w-5 h-5 text-accent-500" />,
  Trees: <Trees className="w-5 h-5 text-accent-500" />,
  Dog: <Dog className="w-5 h-5 text-accent-500" />,
  TrafficCone: <TrafficCone className="w-5 h-5 text-accent-500" />,
};

const STEPS: Step[] = [
  { id: 'category', label: 'Category' },
  { id: 'media', label: 'Evidence' },
  { id: 'location', label: 'Location' },
  { id: 'details', label: 'Details' },
  { id: 'review', label: 'Review' },
];

export const ReportIssuePage: React.FC = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !token)) {
      navigate('/login?redirect=/report');
    }
  }, [isLoading, isAuthenticated, token, navigate]);

  const [currentStep, setCurrentStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [mediaItems, setMediaItems] = useState<UploadedMediaItem[]>([]);
  const [location, setLocation] = useState<LocationData>({
    latitude: 19.076,
    longitude: 72.8777,
    addressText: '',
    landmark: '',
    ward: '',
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [isHazard, setIsHazard] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdIssue, setCreatedIssue] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // Duplicate detection state
  const [nearbyDuplicates, setNearbyDuplicates] = useState<any[]>([]);
  const [upvoteSuccessMsg, setUpvoteSuccessMsg] = useState<string | null>(null);
  const [isUpvoting, setIsUpvoting] = useState(false);

  // Fetch live categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/issues/categories/');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data);
          }
        }
      } catch {
        // Use fallback categories if backend connection fails
      }
    };
    fetchCategories();
  }, []);

  // Update priority when hazard checkbox changes or category changes
  useEffect(() => {
    if (isHazard) {
      setPriority('CRITICAL');
    } else if (selectedCategory) {
      setPriority((selectedCategory.default_priority as any) || 'MEDIUM');
    }
  }, [isHazard, selectedCategory]);

  // Check for nearby duplicates when user lands on location step or coordinates change
  useEffect(() => {
    if (currentStep === 2 && location.latitude && location.longitude) {
      const checkNearby = async () => {
        try {
          const res = await api.checkDuplicates({
            latitude: location.latitude,
            longitude: location.longitude,
            category_id: selectedCategory?.id,
          });
          setNearbyDuplicates(res.duplicates || []);
        } catch {
          setNearbyDuplicates([]);
        }
      };
      const debounceTimer = setTimeout(checkNearby, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [currentStep, location.latitude, location.longitude, selectedCategory?.id]);

  const handleUpvoteDuplicate = async (issueId: string) => {
    setIsUpvoting(true);
    setUpvoteSuccessMsg(null);
    try {
      const res = await api.upvoteIssue(issueId);
      setUpvoteSuccessMsg(`Grievance support registered! ${res.affected_citizens_count} citizens have reported this problem.`);
      setTimeout(() => {
        navigate(`/track/${issueId}`);
      }, 1500);
    } catch (err: any) {
      setUpvoteSuccessMsg(err.detail || 'Unable to register support for this issue.');
    } finally {
      setIsUpvoting(false);
    }
  };

  const canProceedStep = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0:
        return selectedCategory !== null;
      case 1:
        return mediaItems.filter((i) => i.type === 'image').length >= 1;
      case 2:
        return Boolean(location.addressText.trim() && location.latitude && location.longitude);
      case 3:
        return Boolean(title.trim().length >= 5 && description.trim().length >= 10);
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceedStep(currentStep) && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!token) {
      navigate('/login?redirect=/report');
      return;
    }

    if (!selectedCategory) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category_id', selectedCategory.id.toString());
    formData.append('priority', priority);
    formData.append('latitude', location.latitude.toString());
    formData.append('longitude', location.longitude.toString());
    formData.append('address_text', location.addressText);
    if (location.landmark) formData.append('landmark', location.landmark);
    if (location.ward) formData.append('ward', location.ward);

    mediaItems.forEach((item) => {
      if (item.type === 'image') {
        formData.append('images', item.file);
        formData.append('capture_sources', item.captureSource);
        formData.append('captions', item.caption || '');
      } else {
        formData.append('videos', item.file);
      }
    });

    try {
      const response = await fetch('http://127.0.0.1:8000/api/issues/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMessage =
          errorData.detail ||
          errorData.title?.[0] ||
          errorData.description?.[0] ||
          'Failed to submit issue report. Please check required fields.';
        throw new Error(errMessage);
      }

      const createdData = await response.json();
      setCreatedIssue(createdData);
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (createdIssue?.issue_id) {
      navigator.clipboard.writeText(createdIssue.issue_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleReset = () => {
    setCreatedIssue(null);
    setCurrentStep(0);
    setSelectedCategory(null);
    setMediaItems([]);
    setLocation({
      latitude: 19.076,
      longitude: 72.8777,
      addressText: '',
      landmark: '',
      ward: '',
    });
    setTitle('');
    setDescription('');
    setIsHazard(false);
  };

  // SUCCESS SCREEN STATE
  if (createdIssue) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
        <Card className="border-line text-center p-6 sm:p-8">
          <div className="w-16 h-16 bg-green-50 text-status-verified rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200 shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h2 className="text-2xl font-bold text-ink-950 mb-1">
            Issue Submitted Successfully
          </h2>
          <p className="text-sm text-ink-500 mb-6">
            Your civic complaint has been registered and forwarded to the appropriate department.
          </p>

          {/* Reference ID Banner */}
          <div className="bg-surface border border-line rounded-lg p-4 mb-6 max-w-md mx-auto">
            <p className="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-1">
              Issue Reference Number
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-2xl font-bold text-primary-700">
                {createdIssue.issue_id}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-1.5 text-ink-500 hover:text-primary-700 hover:bg-white rounded transition border border-transparent hover:border-line"
                title="Copy Reference ID"
              >
                {copied ? <CheckCircle2 className="w-5 h-5 text-status-verified" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            {copied && <p className="text-[11px] text-status-verified mt-1">Copied to clipboard!</p>}
          </div>

          {/* Issue Summary Snapshot */}
          <div className="bg-white border border-line rounded-lg p-4 text-left space-y-3 mb-6 max-w-md mx-auto text-sm">
            <div className="flex justify-between items-center pb-2 border-b border-line">
              <span className="text-ink-500 text-xs">Status:</span>
              <Badge variant="SUBMITTED">{createdIssue.status || 'SUBMITTED'}</Badge>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-line">
              <span className="text-ink-500 text-xs">Department:</span>
              <span className="font-medium text-ink-950">{createdIssue.department?.name || selectedCategory?.name}</span>
            </div>
            <div className="flex justify-between items-start pb-2 border-b border-line">
              <span className="text-ink-500 text-xs">Location:</span>
              <span className="font-medium text-ink-950 text-right max-w-[200px] truncate">
                {createdIssue.location?.address_text || location.addressText}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink-500 text-xs">Priority SLA:</span>
              <span className="font-mono text-xs font-semibold text-primary-700 bg-primary-100 px-2 py-0.5 rounded">
                {createdIssue.priority || priority}
              </span>
            </div>
          </div>

          {/* Action Navigation Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to={`/track/${createdIssue.issue_id}`} className="w-full sm:w-auto">
              <Button variant="primary" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Track Issue Status
              </Button>
            </Link>
            <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto">
              Report Another Issue
            </Button>
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button variant="ghost" className="w-full">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 pb-28">
      {/* Top Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink-950">Report a Civic Issue</h1>
        <p className="text-sm text-ink-500 mt-1">
          Submit municipal infrastructure, sanitation, or safety concerns directly to authorities.
        </p>
      </div>

      {/* 5-Step Stepper Header */}
      <div className="mb-8">
        <Stepper steps={STEPS} currentStep={currentStep} onStepClick={(step: number) => {
          if (step < currentStep || canProceedStep(currentStep)) {
            setCurrentStep(step);
          }
        }} />
      </div>

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-status-rejected flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Submission Error</p>
            <p className="text-xs mt-0.5">{submitError}</p>
          </div>
        </div>
      )}

      {/* STEP 1: CATEGORY SELECTION */}
      {currentStep === 0 && (
        <Card className="border-line">
          <CardHeader>
            <CardTitle>Select Issue Category</CardTitle>
            <p className="text-xs text-ink-500 mt-1">
              Choose the category that best describes the issue for automated routing.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-left p-4 rounded-lg border transition flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-primary-600 bg-primary-100/30 ring-1 ring-primary-600'
                        : 'border-line hover:border-ink-300 bg-card hover:bg-surface'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-lg border flex-shrink-0 ${
                        isSelected
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-surface text-ink-700 border-line'
                      }`}
                    >
                      {categoryIconMap[cat.icon_name] || <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-950 leading-tight">
                        {cat.name}
                      </p>
                      <p className="text-xs text-ink-500 mt-1 line-clamp-2">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: MEDIA EVIDENCE */}
      {currentStep === 1 && (
        <Card className="border-line">
          <CardHeader>
            <CardTitle>Attach Photo / Video Evidence</CardTitle>
            <p className="text-xs text-ink-500 mt-1">
              Clear photos enable faster verification and work order allocation (At least 1 photo required).
            </p>
          </CardHeader>
          <CardContent>
            <MediaUpload
              items={mediaItems}
              onChange={setMediaItems}
              maxImages={3}
              maxVideos={1}
            />
          </CardContent>
        </Card>
      )}

      {/* STEP 3: LOCATION PICKER */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <Card className="border-line">
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
              <p className="text-xs text-ink-500 mt-1">
                Specify the exact spot so municipal maintenance crews can easily locate the issue.
              </p>
            </CardHeader>
            <CardContent>
              <LocationPicker
                value={location}
                onChange={setLocation}
              />
            </CardContent>
          </Card>

          {/* Phase 9: Nearby Duplicate Grievance Alert Box */}
          {nearbyDuplicates.length > 0 && (
            <Card className="border-accent-500/40 bg-accent-500/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-accent-600 shrink-0" />
                    <h4 className="font-heading font-semibold text-xs text-ink-950">
                      Nearby Existing Grievance Detected
                    </h4>
                  </div>
                  <span className="font-mono text-[10px] text-accent-700 font-bold bg-accent-500/20 px-2 py-0.5 rounded">
                    {nearbyDuplicates.length} Active in Area
                  </span>
                </div>

                <p className="text-xs text-ink-700">
                  A similar issue has already been reported nearby. You can support the existing report to help municipal officers prioritize field dispatch instead of creating a duplicate ticket.
                </p>

                {upvoteSuccessMsg && (
                  <div className="p-2.5 bg-semantic-success/15 border border-semantic-success/30 rounded text-xs text-semantic-success font-medium">
                    {upvoteSuccessMsg}
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  {nearbyDuplicates.map((dup) => (
                    <div
                      key={dup.id}
                      className="p-3 bg-card border border-line rounded-input flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-xs font-bold text-primary-700">{dup.issue_id}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface border border-line text-ink-700">
                            {dup.status_display}
                          </span>
                          <span className="font-mono text-[10px] text-ink-500">
                            ~{dup.distance_meters}m away
                          </span>
                        </div>
                        <p className="font-semibold text-xs text-ink-950 truncate">{dup.title}</p>
                        <p className="text-[11px] text-ink-500 flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3 text-primary-600" />
                          <span>{dup.affected_citizens_count} citizen{dup.affected_citizens_count === 1 ? '' : 's'} affected</span>
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        isLoading={isUpvoting}
                        onClick={() => handleUpvoteDuplicate(dup.issue_id)}
                        leftIcon={<ThumbsUp className="w-3.5 h-3.5" />}
                      >
                        I Have This Problem Too
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* STEP 4: ISSUE DESCRIPTION */}
      {currentStep === 3 && (
        <Card className="border-line">
          <CardHeader>
            <CardTitle>Issue Details</CardTitle>
            <p className="text-xs text-ink-500 mt-1">
              Provide a concise title and descriptive details regarding the issue.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-700 mb-1">
                Issue Summary / Title <span className="text-status-rejected">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep crater near library bus stop causing traffic slowdown"
                className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:ring-1 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                maxLength={200}
                required
              />
              <div className="flex justify-between text-[11px] text-ink-500 mt-1">
                <span>Minimum 5 characters</span>
                <span className="font-mono">{title.length}/200</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-700 mb-1">
                Detailed Description <span className="text-status-rejected">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the severity, extent, duration, and any public safety risks..."
                rows={4}
                className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:ring-1 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                required
              />
              <div className="flex justify-between text-[11px] text-ink-500 mt-1">
                <span>Minimum 10 characters</span>
                <span className="font-mono">{description.length} chars</span>
              </div>
            </div>

            {/* Public Safety Hazard Checkbox */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-3">
              <input
                type="checkbox"
                id="hazard-check"
                checked={isHazard}
                onChange={(e) => setIsHazard(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
              />
              <label htmlFor="hazard-check" className="text-xs text-ink-950 cursor-pointer">
                <span className="font-semibold block text-amber-900">
                  Immediate Public Safety / Hazard Risk
                </span>
                Check this if the issue poses imminent risk of electrocution, fatal road crash, structural collapse, or major flood. Flags issue for Critical SLA dispatch.
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: REVIEW & SUBMIT */}
      {currentStep === 4 && (
        <Card className="border-line">
          <CardHeader>
            <CardTitle>Review & Submit Report</CardTitle>
            <p className="text-xs text-ink-500 mt-1">
              Please double check your submission before generating the official tracking token.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category & Priority review */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-surface rounded-lg border border-line">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-ink-500 font-medium">Category</p>
                <p className="text-sm font-semibold text-ink-950 mt-0.5">{selectedCategory?.name}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-ink-500 font-medium">Priority Level</p>
                <div className="mt-0.5">
                  <Badge variant={priority === 'CRITICAL' ? 'CRITICAL' : priority === 'HIGH' ? 'HIGH' : 'MEDIUM'}>
                    {priority} Priority
                  </Badge>
                </div>
              </div>
            </div>

            {/* Location review */}
            <div className="p-4 bg-surface rounded-lg border border-line space-y-1.5">
              <div className="flex items-center gap-1.5 text-ink-700">
                <MapPin className="w-4 h-4 text-primary-600" />
                <span className="text-xs font-semibold">Location</span>
              </div>
              <p className="text-sm text-ink-950 font-medium">{location.addressText}</p>
              {location.landmark && <p className="text-xs text-ink-500">Landmark: {location.landmark}</p>}
              {location.ward && <p className="text-xs text-ink-500">Ward: {location.ward}</p>}
              <p className="text-[11px] font-mono text-ink-500">
                Coordinates: {location.latitude}, {location.longitude}
              </p>
            </div>

            {/* Media preview review */}
            <div className="p-4 bg-surface rounded-lg border border-line">
              <p className="text-xs font-semibold text-ink-700 mb-2">Attached Evidence ({mediaItems.length})</p>
              <div className="flex flex-wrap gap-2">
                {mediaItems.map((item, idx) => (
                  <div key={item.id} className="relative w-16 h-16 rounded border border-line overflow-hidden">
                    <img src={item.previewUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Description review */}
            <div className="p-4 bg-surface rounded-lg border border-line space-y-1">
              <p className="text-xs font-semibold text-ink-700">Issue Title</p>
              <p className="text-sm font-semibold text-ink-950">{title}</p>
              <p className="text-xs font-semibold text-ink-700 mt-2">Description</p>
              <p className="text-xs text-ink-700 leading-relaxed whitespace-pre-wrap">{description}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stepper Navigation Footer */}
      <div className="sticky bottom-4 z-20 mt-8 py-3.5 px-4 bg-card/95 backdrop-blur-md rounded-xl border border-line shadow-card flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0 || isSubmitting}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Back
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button
            type="button"
            variant="primary"
            onClick={handleNext}
            disabled={!canProceedStep(currentStep)}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Continue
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            rightIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Submit Official Report
          </Button>
        )}
      </div>
    </div>
  );
};
