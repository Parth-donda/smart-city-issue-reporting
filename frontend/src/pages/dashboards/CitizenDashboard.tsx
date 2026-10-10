import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { SlaTimer } from '../../components/ui/SlaTimer';
import { api } from '../../services/api';
import { Issue } from '../../types/issues';
import {
  Plus,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ExternalLink,
  Search,
  Inbox,
  Building2
} from 'lucide-react';

const STATUS_TABS = [
  { id: 'ALL', label: 'All Issues' },
  { id: 'SUBMITTED', label: 'Submitted' },
  { id: 'UNDER_REVIEW', label: 'Under Review' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'RESOLVED', label: 'Resolved' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'REOPENED', label: 'Reopened' },
];

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('ALL');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const fetchIssues = async () => {
    setIsLoading(true);
    try {
      let tabParam: string | undefined = undefined;
      let statusParam: string | undefined = undefined;

      if (activeTab === 'SUBMITTED') tabParam = 'submitted';
      else if (activeTab === 'UNDER_REVIEW') tabParam = 'under_review';
      else if (activeTab === 'IN_PROGRESS') tabParam = 'in_progress';
      else if (activeTab === 'RESOLVED') tabParam = 'resolved';
      else if (activeTab === 'REJECTED') tabParam = 'rejected';
      else if (activeTab === 'REOPENED') tabParam = 'reopened';

      const res = await api.getIssues({
        tab: tabParam,
        status: statusParam,
        search: searchQuery || undefined,
      });

      const issueList = Array.isArray(res) ? res : res.results || [];
      setIssues(issueList);
    } catch (err) {
      console.error('Failed to load citizen issues', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIssues();
  };

  const handleOpenDetail = async (issue: Issue) => {
    setFeedbackRating(5);
    setFeedbackComment('');
    setFeedbackError(null);
    try {
      const fullDetail = await api.getIssueDetail(issue.issue_id);
      setSelectedIssue(fullDetail);
    } catch {
      setSelectedIssue(issue);
    }
  };

  const handleCitizenFeedback = async (isSatisfied: boolean) => {
    if (!selectedIssue) return;
    setIsSubmittingFeedback(true);
    setFeedbackError(null);
    try {
      const updated = await api.submitCitizenFeedback(selectedIssue.issue_id, {
        is_satisfied: isSatisfied,
        rating: isSatisfied ? feedbackRating : 1,
        comment: feedbackComment.trim() || undefined,
      });
      setSelectedIssue(updated);
      await fetchIssues();
    } catch (err: any) {
      setFeedbackError(err.error || err.detail || 'Failed to submit feedback.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const inProgressCount = issues.filter(i => ['ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'WORK_STARTED', 'IN_PROGRESS'].includes(i.status)).length;
  const resolvedCount = issues.filter(i => ['DONE', 'VERIFIED', 'CLOSED'].includes(i.status)).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-0.5 bg-primary-100 text-primary-700 rounded-badge font-semibold">
              CITIZEN PORTAL
            </span>
            <span className="text-xs text-ink-500 font-mono">Citizen ID: #{user?.id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-ink-950 mt-1">
            Welcome, {user?.first_name || user?.username}!
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
            Monitor reported civic grievances, follow field worker dispatches, and verify resolution proof.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => navigate('/report')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Report New Issue
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary-700">
          <CardContent className="p-4">
            <span className="text-xs text-ink-500 font-mono uppercase tracking-wider">Total Submissions</span>
            <div className="text-2xl font-bold font-heading text-ink-950 mt-1">{issues.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent-500">
          <CardContent className="p-4">
            <span className="text-xs text-ink-500 font-mono uppercase tracking-wider">Active in Field</span>
            <div className="text-2xl font-bold font-heading text-ink-950 mt-1">{inProgressCount}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-semantic-success">
          <CardContent className="p-4">
            <span className="text-xs text-ink-500 font-mono uppercase tracking-wider">Resolved & Closed</span>
            <div className="text-2xl font-bold font-heading text-ink-950 mt-1">{resolvedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Search Filter */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-line pb-2">
          {/* Scrollable Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {STATUS_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-button text-xs font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-none ${
                    isActive
                      ? 'bg-primary-700 text-card font-semibold'
                      : 'text-ink-700 bg-card hover:bg-surface border border-line'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticket ID or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-card border border-line rounded-input focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>
        </div>

        {/* Issue Cards Grid / List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="p-4 space-y-3 animate-pulse">
                <div className="h-4 bg-line rounded w-1/3" />
                <div className="h-5 bg-line rounded w-3/4" />
                <div className="h-3 bg-line rounded w-1/2" />
                <div className="h-24 bg-line rounded" />
              </Card>
            ))}
          </div>
        ) : issues.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="max-w-md mx-auto space-y-3">
                <Inbox className="w-10 h-10 text-ink-300 mx-auto" />
                <h3 className="font-heading font-semibold text-base text-ink-950">No complaints found</h3>
                <p className="text-xs text-ink-500">
                  {activeTab === 'ALL'
                    ? 'You have not submitted any civic grievance reports yet.'
                    : `No reports currently under the '${activeTab.replace(/_/g, ' ')}' stage.`}
                </p>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/report')}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Report an Issue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {issues.map((issue) => {
              const primaryImg = issue.primary_image?.image || (issue.images && issue.images[0]?.image);

              return (
                <Card
                  key={issue.id}
                  className="flex flex-col hover:border-primary-600/40 transition-colors shadow-soft"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-badge">
                        {issue.issue_id}
                      </span>
                      <SlaTimer deadline={issue.sla_deadline} status={issue.status} compact />
                    </div>
                    <CardTitle className="text-base line-clamp-1 mt-1.5">{issue.title}</CardTitle>
                    <div className="flex items-center gap-1.5 text-xs text-ink-500">
                      <Building2 className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                      <span className="truncate">{issue.department_name || issue.category?.name || 'Municipal'}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 flex-1 flex flex-col justify-between space-y-3">
                    {primaryImg && (
                      <div className="relative aspect-video rounded-input overflow-hidden border border-line bg-surface">
                        <img
                          src={primaryImg}
                          alt={issue.title}
                          className="w-full h-full object-cover"
                        />
                        {issue.images_count && issue.images_count > 1 && (
                          <span className="absolute bottom-1.5 right-1.5 bg-ink-950/70 text-card font-mono text-[10px] px-1.5 py-0.5 rounded-badge">
                            +{issue.images_count - 1} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="space-y-1.5 text-xs text-ink-500">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-ink-500 mt-0.5 shrink-0" />
                        <span className="line-clamp-1">
                          {issue.location?.address_text || 'GPS Location Attached'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="font-mono">{new Date(issue.created_at).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1">
                          <StatusBadge status={issue.status as any} size="sm" />
                          <PriorityBadge priority={issue.priority as any} size="sm" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-line flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={() => handleOpenDetail(issue)}
                        leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                      >
                        Track & Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Citizen Issue Detail & Live Timeline Modal */}
      {selectedIssue && (
        <Modal
          isOpen={!!selectedIssue}
          onClose={() => setSelectedIssue(null)}
          title={`Grievance Track: ${selectedIssue.issue_id}`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            {/* Header Status Bar */}
            <div className="p-3.5 bg-surface border border-line rounded-input flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedIssue.status as any} />
                <PriorityBadge priority={selectedIssue.priority as any} />
                {selectedIssue.department && (
                  <span className="text-xs text-ink-700 font-medium">
                    Dept: {selectedIssue.department.name}
                  </span>
                )}
              </div>
              <SlaTimer deadline={selectedIssue.sla_deadline} status={selectedIssue.status} />
            </div>

            {/* Title & Description */}
            <div>
              <h3 className="font-heading font-bold text-lg text-ink-950">{selectedIssue.title}</h3>
              <p className="text-xs text-ink-500 mt-1 leading-relaxed whitespace-pre-wrap">
                {selectedIssue.description}
              </p>
            </div>

            {/* Photos Gallery */}
            {selectedIssue.images && selectedIssue.images.length > 0 && (
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-ink-500 font-semibold block mb-2">
                  Submitted Photo Evidence ({selectedIssue.images.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedIssue.images.map((img) => (
                    <a
                      key={img.id}
                      href={img.image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-video rounded-input overflow-hidden border border-line bg-surface block"
                    >
                      <img src={img.image} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <span className="absolute bottom-1 left-1 font-mono text-[9px] bg-ink-950/70 text-card px-1 rounded">
                        {img.capture_source}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Location Bar */}
            {selectedIssue.location && (
              <div className="p-3 bg-surface border border-line rounded-input flex items-start gap-2.5 text-xs">
                <MapPin className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink-950">{selectedIssue.location.address_text}</p>
                  <p className="font-mono text-[11px] text-ink-500 mt-0.5">
                    Coordinates: {selectedIssue.location.latitude}, {selectedIssue.location.longitude} {selectedIssue.location.ward ? `| Ward: ${selectedIssue.location.ward}` : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Rejection / Special alert */}
            {selectedIssue.status === 'REJECTED' && (
              <div className="p-3.5 bg-semantic-danger/10 border border-semantic-danger/30 rounded-input space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-semantic-danger">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Report Rejected: {selectedIssue.rejection_reason_display || selectedIssue.rejection_reason}</span>
                </div>
                {selectedIssue.rejection_notes && (
                  <p className="text-xs text-ink-700 pl-5">{selectedIssue.rejection_notes}</p>
                )}
              </div>
            )}

            {/* Completion Evidence (if available) */}
            {selectedIssue.completion_evidence && (
              <div className="p-4 bg-semantic-success/10 border border-semantic-success/30 rounded-input space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-semantic-success uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Field Repair Proof & Evidence</span>
                </div>
                {selectedIssue.completion_evidence.after_image && (
                  <div className="aspect-video rounded-input overflow-hidden border border-line bg-surface max-w-sm">
                    <img
                      src={selectedIssue.completion_evidence.after_image}
                      alt="Repair Proof"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {selectedIssue.completion_evidence.description && (
                  <p className="text-xs text-ink-950 font-medium">
                    <span className="text-ink-500 font-normal">Repair Notes: </span>
                    {selectedIssue.completion_evidence.description}
                  </p>
                )}
                {selectedIssue.completion_evidence.materials_used && (
                  <p className="text-xs text-ink-700">
                    <span className="text-ink-500 font-normal">Materials / Work: </span>
                    {selectedIssue.completion_evidence.materials_used}
                  </p>
                )}
              </div>
            )}

            {/* Citizen Resolution Feedback / Reopen Action Box */}
            {['DONE', 'VERIFIED'].includes(selectedIssue.status) && (
              <div className="p-4 bg-primary-100/60 border border-primary-600/30 rounded-input space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-sm text-primary-700">
                    Citizen Resolution Feedback
                  </h4>
                  <span className="font-mono text-[11px] text-ink-500">Action Required</span>
                </div>
                <p className="text-xs text-ink-700">
                  Municipal workers have marked this work completed. Please verify the repair on-site.
                </p>

                {/* Star rating picker */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink-700 block">Rate Service Quality:</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className={`w-8 h-8 rounded border flex items-center justify-center font-bold text-sm transition ${
                          feedbackRating >= star
                            ? 'bg-accent-500 text-white border-accent-600'
                            : 'bg-card text-ink-500 border-line hover:border-ink-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-xs font-mono text-ink-500 ml-2">
                      {feedbackRating} / 5 Stars
                    </span>
                  </div>
                </div>

                {/* Feedback comment input */}
                <div>
                  <textarea
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Add comments or specific reasons if requesting a rework..."
                    rows={2}
                    className="w-full text-xs p-2 bg-card border border-line rounded-input focus:ring-1 focus:ring-primary-600 outline-none"
                  />
                </div>

                {feedbackError && (
                  <p className="text-xs text-semantic-danger font-medium">{feedbackError}</p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isSubmittingFeedback}
                    onClick={() => handleCitizenFeedback(true)}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Confirm Resolution & Close
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={isSubmittingFeedback}
                    onClick={() => handleCitizenFeedback(false)}
                    leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
                  >
                    Issue Not Resolved (Reopen)
                  </Button>
                </div>
              </div>
            )}

            {/* Vertical Stepper Timeline */}
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-ink-500 font-semibold block mb-3">
                Resolution Timeline & Official Remarks
              </span>
              {selectedIssue.status_history && selectedIssue.status_history.length > 0 ? (
                <div className="relative pl-6 border-l-2 border-primary-600/30 space-y-4">
                  {selectedIssue.status_history.map((step, idx) => (
                    <div key={step.id || idx} className="relative">
                      <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-primary-600 border-2 border-card ring-2 ring-primary-100" />
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-heading font-semibold text-xs text-ink-950">
                            {step.to_status.replace(/_/g, ' ')}
                          </span>
                          <span className="font-mono text-[10px] text-ink-500">
                            {new Date(step.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-ink-700 mt-0.5">{step.remarks || 'Status recorded.'}</p>
                        {step.changed_by_name && (
                          <span className="text-[10px] text-ink-500 font-mono">
                            By {step.changed_by_name} ({step.changed_by_role || 'Staff'})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-500">No status logs recorded.</p>
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-line flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/track/${selectedIssue.issue_id}`)}
                leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Public Tracking Page
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedIssue(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
