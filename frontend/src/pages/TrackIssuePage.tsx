import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Building2,
  Calendar
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface TimelineEvent {
  from_status: string;
  to_status: string;
  remarks: string;
  created_at: string;
}

interface IssueTrackData {
  issue_id: string;
  title: string;
  description: string;
  status: string;
  status_display: string;
  priority: string;
  category_name: string;
  department_name: string | null;
  address_text: string;
  ward: string;
  created_at: string;
  sla_deadline: string | null;
  images: Array<{
    id: number;
    image: string;
    caption: string;
    is_primary: boolean;
  }>;
  timeline: TimelineEvent[];
  completion_evidence?: {
    after_image: string | null;
    description: string;
    materials_used: string;
    completed_at: string;
  } | null;
}

const LIFECYCLE_STAGES = [
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'DONE', label: 'Repaired' },
  { key: 'VERIFIED', label: 'Verified & Closed' },
];

const STAGE_ORDER: Record<string, number> = {
  SUBMITTED: 0,
  UNDER_REVIEW: 1,
  ACCEPTED: 1,
  ASSIGNED: 2,
  ON_THE_WAY: 2,
  WORK_STARTED: 3,
  IN_PROGRESS: 3,
  DONE: 4,
  VERIFIED: 5,
  CLOSED: 5,
};

export const TrackIssuePage: React.FC = () => {
  const { issueId: paramIssueId } = useParams<{ issueId?: string }>();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(paramIssueId || '');
  const [issueData, setIssueData] = useState<IssueTrackData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTrackData = async (id: string) => {
    if (!id.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const cleanId = id.trim().toUpperCase();
      const response = await fetch(`http://127.0.0.1:8000/api/issues/track/${cleanId}/`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Issue with reference ID '${cleanId}' was not found. Please verify the ID.`);
        }
        throw new Error('Failed to retrieve issue tracking information.');
      }
      const data = await response.json();
      setIssueData(data);
    } catch (err: any) {
      setIssueData(null);
      setErrorMessage(err.message || 'An error occurred while tracking the issue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (paramIssueId) {
      setSearchQuery(paramIssueId);
      fetchTrackData(paramIssueId);
    }
  }, [paramIssueId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/track/${searchQuery.trim().toUpperCase()}`);
      fetchTrackData(searchQuery.trim());
    }
  };

  const getActiveStageIndex = (status: string): number => {
    return STAGE_ORDER[status] ?? 0;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Search Header Banner */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink-950">Track Civic Issue Status</h1>
        <p className="text-sm text-ink-500 mt-1 max-w-md mx-auto">
          Enter your unique tracking token (e.g. <span className="font-mono text-ink-700 font-semibold">SC-2026-00001</span>) to check real-time resolution progress.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-6 max-w-lg mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-ink-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. SC-2026-00001"
              className="w-full pl-10 pr-4 py-2.5 text-sm font-mono border border-line rounded-lg focus:ring-1 focus:ring-primary-600 focus:border-primary-600 outline-none uppercase tracking-wide bg-card transition shadow-sm"
              required
            />
          </div>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Track
          </Button>
        </form>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-status-rejected flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tracking Results View */}
      {issueData && (
        <div className="space-y-6">
          {/* Main Status Header Card */}
          <Card className="border-line overflow-hidden">
            <div className="p-6 bg-surface border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-lg font-bold text-primary-700 bg-primary-100 px-3 py-0.5 rounded">
                    {issueData.issue_id}
                  </span>
                  <Badge variant={issueData.status as any}>
                    {issueData.status_display}
                  </Badge>
                  <Badge variant={issueData.priority as any}>
                    {issueData.priority} Priority
                  </Badge>
                </div>
                <h2 className="text-xl font-bold text-ink-950 mt-2">{issueData.title}</h2>
                <p className="text-xs text-ink-500 mt-1 flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Reported on {new Date(issueData.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {issueData.department_name && (
                    <span className="flex items-center gap-1 font-medium text-ink-700">
                      <Building2 className="w-3.5 h-3.5 text-primary-600" />
                      {issueData.department_name}
                    </span>
                  )}
                </p>
              </div>

              {issueData.sla_deadline && (
                <div className="bg-card p-3 rounded-lg border border-line flex items-center gap-3 self-start sm:self-auto shadow-sm">
                  <Clock className="w-5 h-5 text-accent-500 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-[10px] uppercase font-semibold text-ink-500 tracking-wider">Target Resolution SLA</p>
                    <p className="text-xs font-mono font-medium text-ink-950">
                      {new Date(issueData.sla_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Lifecycle Visual Progress Stepper */}
            <div className="p-6">
              <p className="text-xs font-semibold text-ink-700 uppercase tracking-wider mb-4">
                Resolution Workflow Progress
              </p>
              <div className="relative">
                <div className="overflow-x-auto pb-2">
                  <div className="flex items-center justify-between min-w-[500px]">
                    {LIFECYCLE_STAGES.map((stage, idx) => {
                      const activeIndex = getActiveStageIndex(issueData.status);
                      const isCompleted = idx <= activeIndex;
                      const isCurrent = idx === activeIndex;

                      return (
                        <div key={stage.key} className="flex-1 flex flex-col items-center relative">
                          {/* Connecting line */}
                          {idx !== 0 && (
                            <div
                              className={`absolute top-4 -left-1/2 right-1/2 h-0.5 z-0 ${
                                idx <= activeIndex ? 'bg-primary-600' : 'bg-line'
                              }`}
                            />
                          )}

                          {/* Node Circle */}
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold z-10 transition border-2 ${
                              isCompleted
                                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                : 'bg-surface text-ink-500 border-line'
                            } ${isCurrent ? 'ring-4 ring-primary-100' : ''}`}
                          >
                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>

                          {/* Label */}
                          <span
                            className={`text-xs mt-2 font-medium text-center ${
                              isCurrent ? 'text-primary-700 font-bold' : isCompleted ? 'text-ink-950' : 'text-ink-500'
                            }`}
                          >
                            {stage.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Details Grid: Left Description & Location, Right Media & Audit Log */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Description & Location */}
            <div className="md:col-span-2 space-y-6">
              <Card className="border-line">
                <CardHeader>
                  <CardTitle>Report Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <span className="text-xs font-semibold text-ink-500 block mb-1">Description</span>
                    <p className="text-ink-950 leading-relaxed whitespace-pre-wrap bg-surface p-3 rounded-lg border border-line">
                      {issueData.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="text-xs font-semibold text-ink-500 block mb-1">Issue Category</span>
                      <span className="font-medium text-ink-950">{issueData.category_name}</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-ink-500 block mb-1">Responsible Dept</span>
                      <span className="font-medium text-ink-950">{issueData.department_name || 'Pending assignment'}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-xs font-semibold text-ink-500 block mb-1">Reported Location</span>
                    <div className="p-3 bg-surface rounded-lg border border-line space-y-1">
                      <div className="flex items-center gap-1.5 text-ink-950 font-medium">
                        <MapPin className="w-4 h-4 text-primary-600 flex-shrink-0" />
                        <span>{issueData.address_text}</span>
                      </div>
                      {issueData.ward && (
                        <p className="text-xs text-ink-500 pl-5.5">Ward: {issueData.ward}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Photos Gallery */}
              {issueData.images && issueData.images.length > 0 && (
                <Card className="border-line">
                  <CardHeader>
                    <CardTitle>Photographic Evidence ({issueData.images.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {issueData.images.map((img) => (
                        <div key={img.id} className="border border-line rounded-lg overflow-hidden bg-card shadow-sm">
                          <img
                            src={img.image}
                            alt={img.caption || 'Issue Photo'}
                            className="w-full h-48 object-cover"
                          />
                          {img.caption && (
                            <p className="p-2 text-xs text-ink-700 bg-surface border-t border-line">
                              {img.caption}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Field Completion Proof (if completed) */}
              {issueData.completion_evidence && (
                <Card className="border-semantic-success/40 bg-semantic-success/5">
                  <CardHeader>
                    <CardTitle className="text-semantic-success flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Field Work & Repair Proof
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {issueData.completion_evidence.after_image && (
                      <div className="border border-line rounded-lg overflow-hidden bg-card shadow-sm max-w-md">
                        <img
                          src={issueData.completion_evidence.after_image}
                          alt="After Repair Proof"
                          className="w-full h-56 object-cover"
                        />
                      </div>
                    )}
                    {issueData.completion_evidence.description && (
                      <div>
                        <span className="text-xs font-semibold text-ink-500 block mb-1">Work Description</span>
                        <p className="text-xs text-ink-950 bg-surface p-2.5 rounded-lg border border-line">
                          {issueData.completion_evidence.description}
                        </p>
                      </div>
                    )}
                    {issueData.completion_evidence.materials_used && (
                      <div>
                        <span className="text-xs font-semibold text-ink-500 block mb-1">Materials / Equipment Used</span>
                        <p className="text-xs text-ink-700 font-mono">
                          {issueData.completion_evidence.materials_used}
                        </p>
                      </div>
                    )}
                    <p className="text-[11px] text-ink-500 font-mono">
                      Completed at: {new Date(issueData.completion_evidence.completed_at).toLocaleString('en-GB')}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right 1 Col: Chronological Timeline */}
            <div className="space-y-6">
              <Card className="border-line">
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-line">
                    {issueData.timeline.map((event, i) => (
                      <div key={i} className="relative pl-7 text-xs">
                        <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-primary-600 ring-4 ring-primary-100" />
                        <div className="bg-surface p-2.5 rounded-lg border border-line">
                          <p className="font-semibold text-ink-950">
                            {event.to_status.replace(/_/g, ' ')}
                          </p>
                          <p className="text-[11px] text-ink-500 font-mono mt-0.5">
                            {new Date(event.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {event.remarks && (
                            <p className="text-ink-700 mt-1.5 text-xs">{event.remarks}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Need to Report Another Issue */}
              <div className="p-4 bg-primary-100/40 border border-primary-600/30 rounded-lg text-center">
                <p className="text-xs font-semibold text-primary-700 mb-2">Have another municipal concern?</p>
                <Link to="/report">
                  <Button variant="primary" size="sm" className="w-full">
                    Report New Issue
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
