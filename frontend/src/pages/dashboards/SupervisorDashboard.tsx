import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { SlaTimer } from '../../components/ui/SlaTimer';
import { api } from '../../services/api';
import { Issue, QueueSummary } from '../../types/issues';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  RefreshCw,
  Inbox,
  AlertTriangle,
  ArrowRight,
  Check,
  X,
  Wrench
} from 'lucide-react';

export const SupervisorDashboard: React.FC = () => {
  const { user } = useAuth();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [summary, setSummary] = useState<QueueSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Verification action states
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sumData, issueRes] = await Promise.all([
        api.getDepartmentSummary(),
        api.getIssues({ status: 'DONE' }), // Awaiting verification
      ]);
      setSummary(sumData);
      const list = Array.isArray(issueRes) ? issueRes : issueRes.results || [];
      setIssues(list);
    } catch (err) {
      console.error('Failed to load supervisor data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenReview = async (issue: Issue) => {
    setActionError(null);
    setIsRejectMode(false);
    setApprovalRemarks('Verified after on-site evidence review.');
    setRejectRemarks('');
    setIsDrawerOpen(true);

    try {
      const fullDetail = await api.getIssueDetail(issue.issue_id);
      setSelectedIssue(fullDetail);
    } catch {
      setSelectedIssue(issue);
    }
  };

  const handleApprove = async () => {
    if (!selectedIssue) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await api.supervisorVerify(selectedIssue.issue_id, {
        action: 'APPROVE',
        remarks: approvalRemarks || 'Repairs inspected and verified by department supervisor.',
      });
      setIsDrawerOpen(false);
      setSelectedIssue(null);
      loadData();
    } catch (err: any) {
      setActionError(err.detail || err.error || 'Failed to verify issue.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedIssue) return;
    if (!rejectRemarks.trim()) {
      setActionError('Please provide rework instructions for the field technician.');
      return;
    }
    setIsProcessing(true);
    setActionError(null);
    try {
      await api.supervisorVerify(selectedIssue.issue_id, {
        action: 'REJECT',
        remarks: rejectRemarks,
      });
      setIsDrawerOpen(false);
      setSelectedIssue(null);
      loadData();
    } catch (err: any) {
      setActionError(err.detail || err.error || 'Failed to reject verification.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-0.5 bg-primary-100 text-primary-700 rounded-badge font-semibold">
              SUPERVISOR VERIFICATION DESK
            </span>
            <span className="text-xs text-ink-500 font-mono">
              Dept: {summary?.department_name || user?.department_name || 'Roads & Infrastructure'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-ink-950 mt-1">
            Supervisor {user?.first_name || user?.username}
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
            Audit completion evidence, perform side-by-side Before/After quality control, and sign off on municipal repair orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Desk
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-ink-500 font-mono uppercase tracking-wider font-semibold">
                Awaiting Verification
              </span>
              <div className="text-2xl font-bold font-heading text-ink-950 mt-1">
                {issues.length}
              </div>
            </div>
            <Clock className="w-8 h-8 text-primary-600" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-status-in-progress">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-ink-500 font-mono uppercase tracking-wider font-semibold">
                Active in Field
              </span>
              <div className="text-2xl font-bold font-heading text-ink-950 mt-1">
                {summary?.in_progress || summary?.assigned || 0}
              </div>
            </div>
            <Wrench className="w-8 h-8 text-status-in-progress" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-semantic-success">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-ink-500 font-mono uppercase tracking-wider font-semibold">
                Verified & Closed
              </span>
              <div className="text-2xl font-bold font-heading text-semantic-success mt-1">
                {(summary?.verified || 0) + (summary?.closed || 0)}
              </div>
            </div>
            <CheckCircle2 className="w-8 h-8 text-semantic-success" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-status-reopened">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-ink-500 font-mono uppercase tracking-wider font-semibold">
                Reopened Tickets
              </span>
              <div className="text-2xl font-bold font-heading text-status-reopened mt-1">
                {summary?.reopened || 0}
              </div>
            </div>
            <AlertTriangle className="w-8 h-8 text-status-reopened" />
          </CardContent>
        </Card>
      </div>

      {/* Verification Queue Card */}
      <Card>
        <CardHeader className="p-4 border-b border-line flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Field Completion Verification Queue</CardTitle>
            <CardDescription className="text-xs">
              Work orders marked as 'DONE' by field technicians requiring supervisor inspection
            </CardDescription>
          </div>
          <span className="font-mono text-xs text-primary-700 bg-primary-100 px-2.5 py-0.5 rounded-badge font-semibold">
            {issues.length} pending approval
          </span>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface/80 border-b border-line text-ink-500 font-mono uppercase text-[11px]">
                <th className="py-3 px-4 font-semibold">Issue Ref</th>
                <th className="py-3 px-4 font-semibold">Title</th>
                <th className="py-3 px-4 font-semibold">Technician</th>
                <th className="py-3 px-4 font-semibold">Priority</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">SLA Deadline</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink-500 font-mono">
                    Loading completed work order submissions...
                  </td>
                </tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Inbox className="w-8 h-8 text-ink-300 mx-auto" />
                      <p className="font-heading font-semibold text-sm text-ink-950">No pending verifications</p>
                      <p className="text-xs text-ink-500">All submitted work orders have been audited and signed off.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr
                    key={issue.id}
                    className="hover:bg-surface/60 transition-colors cursor-pointer"
                    onClick={() => handleOpenReview(issue)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-primary-700">{issue.issue_id}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-ink-950 truncate max-w-xs">{issue.title}</p>
                      <span className="text-[11px] text-ink-500">{issue.category?.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{issue.assigned_worker_name || 'Technician'}</td>
                    <td className="py-3 px-4">
                      <PriorityBadge priority={issue.priority as any} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={issue.status as any} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <SlaTimer deadline={issue.sla_deadline} status={issue.status} />
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenReview(issue)}
                        rightIcon={<ArrowRight className="w-3 h-3" />}
                      >
                        Inspect Proof
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Side-by-Side Before/After Verification Drawer */}
      {selectedIssue && (
        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={`Audit Proof: ${selectedIssue.issue_id}`}
          description={`Reported: ${selectedIssue.title}`}
          width="xl"
        >
          <div className="space-y-6">
            {/* Status & SLA summary */}
            <div className="p-3.5 bg-surface border border-line rounded-input flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedIssue.status as any} />
                <PriorityBadge priority={selectedIssue.priority as any} />
                <span className="text-xs text-ink-700 font-mono">
                  Technician: {selectedIssue.assigned_worker_name || 'Field Worker'}
                </span>
              </div>
              <SlaTimer deadline={selectedIssue.sla_deadline} status={selectedIssue.status} />
            </div>

            {/* Error message */}
            {actionError && (
              <div className="p-3 bg-semantic-danger/10 border border-semantic-danger/30 rounded-input text-xs text-semantic-danger font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Side-by-Side Before / After Comparison */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-ink-500 font-semibold">
                  Side-by-Side Resolution Comparison
                </span>
                <span className="text-xs font-medium text-semantic-success flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" /> Quality Audit View
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* BEFORE Image (from citizen report or worker) */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-ink-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-semantic-danger" /> BEFORE (Reported Problem)
                  </span>
                  <div className="aspect-video rounded-input overflow-hidden border border-line bg-surface">
                    {selectedIssue.completion_evidence?.before_image ? (
                      <img
                        src={selectedIssue.completion_evidence.before_image}
                        alt="Before"
                        className="w-full h-full object-cover"
                      />
                    ) : selectedIssue.images && selectedIssue.images.length > 0 ? (
                      <img
                        src={selectedIssue.images[0].image}
                        alt="Initial Evidence"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-ink-400">
                        No before photo
                      </div>
                    )}
                  </div>
                </div>

                {/* AFTER Image (from worker completion) */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-ink-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-semantic-success" /> AFTER (Completed Repair)
                  </span>
                  <div className="aspect-video rounded-input overflow-hidden border-2 border-semantic-success/40 bg-surface">
                    {selectedIssue.completion_evidence?.after_image ? (
                      <img
                        src={selectedIssue.completion_evidence.after_image}
                        alt="After Evidence"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-ink-400">
                        No after photo uploaded
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Worker Notes & Materials Description */}
            <div className="space-y-3 p-4 bg-surface rounded-card border border-line">
              <div>
                <span className="text-xs font-mono uppercase text-ink-500 font-semibold">Worker Repair Notes</span>
                <p className="text-xs text-ink-950 font-medium mt-1 leading-relaxed">
                  {selectedIssue.completion_evidence?.description || 'No work description provided.'}
                </p>
              </div>

              {selectedIssue.completion_evidence?.materials_used && (
                <div className="pt-2 border-t border-line text-xs">
                  <span className="font-mono text-[11px] text-ink-500 uppercase">Materials Deployed: </span>
                  <span className="text-ink-700 font-medium">{selectedIssue.completion_evidence.materials_used}</span>
                </div>
              )}

              {selectedIssue.location && (
                <div className="pt-2 border-t border-line text-xs flex items-center gap-1.5 text-ink-500">
                  <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                  <span>{selectedIssue.location.address_text} ({selectedIssue.location.latitude}, {selectedIssue.location.longitude})</span>
                </div>
              )}
            </div>

            {/* Verification Actions */}
            <div className="border-t border-line pt-4 space-y-4">
              {!isRejectMode ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-ink-950">Supervisor Approval Remarks</label>
                    <textarea
                      rows={2}
                      value={approvalRemarks}
                      onChange={(e) => setApprovalRemarks(e.target.value)}
                      placeholder="e.g. Inspected and verified compliant with municipal standards."
                      className="w-full p-2.5 text-xs bg-card border border-line rounded-input text-ink-950 focus:ring-2 focus:ring-primary-600"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      className="flex-1"
                      disabled={isProcessing}
                      onClick={handleApprove}
                      leftIcon={<Check className="w-4 h-4" />}
                    >
                      {isProcessing ? 'Verifying...' : 'Verify & Approve Resolution'}
                    </Button>
                    <Button
                      variant="danger"
                      disabled={isProcessing}
                      onClick={() => setIsRejectMode(true)}
                      leftIcon={<X className="w-4 h-4" />}
                    >
                      Reject Proof
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-4 bg-semantic-danger/5 border border-semantic-danger/20 rounded-card">
                  <h4 className="font-heading font-semibold text-sm text-semantic-danger flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" /> Reject Completion Evidence
                  </h4>
                  <p className="text-xs text-ink-500">
                    Provide detailed rework instructions. The ticket will return to 'IN_PROGRESS' for the technician to address.
                  </p>
                  <textarea
                    rows={3}
                    required
                    value={rejectRemarks}
                    onChange={(e) => setRejectRemarks(e.target.value)}
                    placeholder="e.g. Asphalt patch uneven, loose gravel left on roadside. Re-level and sweep."
                    className="w-full p-2.5 text-xs bg-card border border-line rounded-input text-ink-950 focus:ring-2 focus:ring-primary-600"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsRejectMode(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={isProcessing}
                      onClick={handleReject}
                    >
                      {isProcessing ? 'Sending Back...' : 'Confirm Reject to In-Progress'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};
