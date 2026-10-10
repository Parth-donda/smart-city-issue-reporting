import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { SlaTimer } from '../../components/ui/SlaTimer';
import { api } from '../../services/api';
import {
  Issue,
  IssuePriority,
  IssueRejectionReason,
  QueueSummary,
  DepartmentWorker,
  IssueCategory
} from '../../types/issues';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Users,
  Search,
  ArrowRight,
  Check,
  X,
  UserCheck,
  RefreshCw,
  MapPin,
  ShieldCheck,
  Building2,
  Inbox
} from 'lucide-react';

const REJECTION_REASONS = [
  { value: 'INVALID_EVIDENCE', label: 'Invalid / Unclear Photo Evidence' },
  { value: 'DUPLICATE', label: 'Duplicate Issue Already Reported' },
  { value: 'OUTSIDE_RESPONSIBILITY', label: 'Outside Department / Municipal Responsibility' },
  { value: 'INSUFFICIENT_INFORMATION', label: 'Insufficient Information / Address Not Found' },
  { value: 'NOT_FOUND_AFTER_INSPECTION', label: 'Issue Not Found After Site Inspection' },
  { value: 'OTHER', label: 'Other Reason (Explain in notes)' },
];

export const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();

  // Queue state
  const [issues, setIssues] = useState<Issue[]>([]);
  const [summary, setSummary] = useState<QueueSummary | null>(null);
  const [categories, setCategories] = useState<IssueCategory[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [workers, setWorkers] = useState<DepartmentWorker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search state
  const [activeTab, setActiveTab] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('created_desc');

  // Triage Drawer state
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [actionTab, setActionTab] = useState<'ACCEPT' | 'ASSIGN' | 'REJECT'>('ACCEPT');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form input states for actions
  const [selectedPriority, setSelectedPriority] = useState<IssuePriority>('MEDIUM');
  const [acceptRemarks, setAcceptRemarks] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [assignNotes, setAssignNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState<IssueRejectionReason>('INVALID_EVIDENCE');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [rerouteDepartmentId, setRerouteDepartmentId] = useState<string>('');

  // Initial Data Fetch
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sumData, catData, deptData, workerData] = await Promise.all([
        api.getDepartmentSummary(),
        api.getCategories(),
        api.getDepartments(),
        api.getDepartmentWorkers(),
      ]);
      setSummary(sumData);
      setCategories(catData);
      setDepartments(deptData);
      setWorkers(workerData);
      if (workerData.length > 0) {
        setSelectedWorkerId(String(workerData[0].id));
      }
      if (deptData.length > 0) {
        setRerouteDepartmentId(String(deptData[0].id));
      }
    } catch (err) {
      console.error('Failed to load summary / metadata', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQueueIssues = async () => {
    setIsLoading(true);
    try {
      let tabParam: string | undefined = undefined;
      let statusParam: string | undefined = undefined;

      if (activeTab === 'SUBMITTED') tabParam = 'submitted';
      else if (activeTab === 'UNDER_REVIEW') tabParam = 'under_review';
      else if (activeTab === 'ACCEPTED') tabParam = 'accepted';
      else if (activeTab === 'ASSIGNED') tabParam = 'assigned';
      else if (activeTab === 'IN_PROGRESS') tabParam = 'in_progress';
      else if (activeTab === 'RESOLVED') tabParam = 'resolved';
      else if (activeTab === 'REJECTED') tabParam = 'rejected';
      else if (activeTab === 'REOPENED') tabParam = 'reopened';
      else if (activeTab === 'SLA_BREACHED') tabParam = 'sla_breached';

      let ordering = '-created_at';
      if (sortOrder === 'sla_asc') ordering = 'sla_deadline';
      else if (sortOrder === 'created_asc') ordering = 'created_at';

      const res = await api.getIssues({
        tab: tabParam,
        status: statusParam,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        search: searchQuery || undefined,
        ordering,
      });

      const list = Array.isArray(res) ? res : res.results || [];
      setIssues(list);
    } catch (err) {
      console.error('Failed to fetch department issues', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    fetchQueueIssues();
    api.getDepartmentSummary().then(setSummary);
  }, [activeTab, priorityFilter, categoryFilter, sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQueueIssues();
  };

  // Open Issue Triage Drawer
  const handleOpenTriage = async (issue: Issue) => {
    setActionError(null);
    setIsDrawerOpen(true);
    setSelectedPriority(issue.priority);
    setAcceptRemarks('');
    setAssignNotes('');
    setRejectionNotes('');

    if (workers.length > 0 && !selectedWorkerId) {
      setSelectedWorkerId(String(workers[0].id));
    }

    // Fetch full issue details
    try {
      const fullDetail = await api.getIssueDetail(issue.issue_id);
      setActiveIssue(fullDetail);

      // Fetch workers for ticket department if cross-department
      if (fullDetail.department?.id) {
        try {
          const deptWorkers = await api.getDepartmentWorkers(fullDetail.department.id);
          if (deptWorkers && deptWorkers.length > 0) {
            setWorkers(deptWorkers);
            setSelectedWorkerId(String(deptWorkers[0].id));
          }
        } catch {}
      }

      // If status is SUBMITTED, automatically transition to UNDER_REVIEW
      if (fullDetail.status === 'SUBMITTED') {
        const updated = await api.startReview(fullDetail.issue_id);
        setActiveIssue(updated);
        // Refresh summary
        api.getDepartmentSummary().then(setSummary);
      }
    } catch {
      setActiveIssue(issue);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setActiveIssue(null);
    setActionError(null);
    fetchQueueIssues();
    api.getDepartmentSummary().then(setSummary);
  };

  // Action Handlers
  const handleAcceptSubmit = async () => {
    if (!activeIssue) return;
    setIsActionLoading(true);
    setActionError(null);
    try {
      const updated = await api.acceptIssue(activeIssue.issue_id, {
        priority: selectedPriority,
        remarks: acceptRemarks || 'Grievance verified and accepted into active repair schedule.',
      });
      setActiveIssue(updated);
      setActionTab('ASSIGN'); // Guide officer directly to next step (assigning worker)
      api.getDepartmentSummary().then(setSummary);
    } catch (err: any) {
      const errMsg = err?.detail || err?.error || (Array.isArray(err) ? err[0] : typeof err === 'object' ? Object.values(err)[0] : null) || 'Failed to accept issue.';
      setActionError(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAssignWorkerSubmit = async () => {
    const workerToAssign = selectedWorkerId || (workers.length > 0 ? String(workers[0].id) : '');
    if (!activeIssue || !workerToAssign) {
      setActionError('Please select a valid field technician.');
      return;
    }
    setIsActionLoading(true);
    setActionError(null);
    try {
      await api.assignWorker(activeIssue.issue_id, {
        worker_id: Number(workerToAssign),
        notes: assignNotes || 'Assigned to field technician for repair dispatch.',
      });
      handleCloseDrawer();
    } catch (err: any) {
      const errMsg = err?.detail || err?.error || (Array.isArray(err) ? err[0] : typeof err === 'object' ? Object.values(err)[0] : null) || 'Failed to assign worker.';
      setActionError(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!activeIssue) return;
    if (!rejectionReason) {
      setActionError('Rejection reason is mandatory.');
      return;
    }
    setIsActionLoading(true);
    setActionError(null);
    try {
      const targetDept = rejectionReason === 'OUTSIDE_RESPONSIBILITY' && rerouteDepartmentId ? Number(rerouteDepartmentId) : undefined;
      await api.rejectIssue(activeIssue.issue_id, {
        rejection_reason: rejectionReason,
        rejection_notes: rejectionNotes,
        target_department_id: targetDept,
      });
      handleCloseDrawer();
    } catch (err: any) {
      const errMsg = err?.detail || err?.error || (Array.isArray(err) ? err[0] : typeof err === 'object' ? Object.values(err)[0] : null) || 'Failed to reject issue.';
      setActionError(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-0.5 bg-primary-100 text-primary-700 rounded-badge font-semibold">
              DEPARTMENT COMMAND DESK
            </span>
            <span className="text-xs text-ink-500 font-mono">
              Dept: {summary?.department_name || user?.department_name || 'Roads & Infrastructure'} [{summary?.department_code || user?.department_code || 'ROADS'}]
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-ink-950 mt-1">
            Officer {user?.first_name || user?.username}
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
            Review incoming grievances, verify evidence signals, accept/reject, enforce SLAs, and assign work orders to field technicians.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              fetchQueueIssues();
              api.getDepartmentSummary().then(setSummary);
            }}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card
          onClick={() => setActiveTab('SUBMITTED')}
          className={`cursor-pointer transition-all border-l-4 border-l-status-submitted ${
            activeTab === 'SUBMITTED' ? 'ring-2 ring-primary-600 bg-primary-100/10' : 'hover:border-line'
          }`}
        >
          <CardContent className="p-3.5">
            <span className="text-[10px] text-ink-500 font-mono uppercase tracking-wider font-semibold">New Intake</span>
            <div className="text-xl font-bold font-heading text-ink-950 mt-0.5">{summary?.submitted || 0}</div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('UNDER_REVIEW')}
          className={`cursor-pointer transition-all border-l-4 border-l-status-under-review ${
            activeTab === 'UNDER_REVIEW' ? 'ring-2 ring-primary-600 bg-primary-100/10' : 'hover:border-line'
          }`}
        >
          <CardContent className="p-3.5">
            <span className="text-[10px] text-ink-500 font-mono uppercase tracking-wider font-semibold">Under Review</span>
            <div className="text-xl font-bold font-heading text-ink-950 mt-0.5">{summary?.under_review || 0}</div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('ACCEPTED')}
          className={`cursor-pointer transition-all border-l-4 border-l-primary-600 ${
            activeTab === 'ACCEPTED' ? 'ring-2 ring-primary-600 bg-primary-100/10' : 'hover:border-line'
          }`}
        >
          <CardContent className="p-3.5">
            <span className="text-[10px] text-ink-500 font-mono uppercase tracking-wider font-semibold">Accepted Queue</span>
            <div className="text-xl font-bold font-heading text-ink-950 mt-0.5">{summary?.accepted || 0}</div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('ASSIGNED')}
          className={`cursor-pointer transition-all border-l-4 border-l-status-assigned ${
            activeTab === 'ASSIGNED' ? 'ring-2 ring-primary-600 bg-primary-100/10' : 'hover:border-line'
          }`}
        >
          <CardContent className="p-3.5">
            <span className="text-[10px] text-ink-500 font-mono uppercase tracking-wider font-semibold">Assigned Orders</span>
            <div className="text-xl font-bold font-heading text-ink-950 mt-0.5">{summary?.assigned || 0}</div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('IN_PROGRESS')}
          className={`cursor-pointer transition-all border-l-4 border-l-status-in-progress ${
            activeTab === 'IN_PROGRESS' ? 'ring-2 ring-primary-600 bg-primary-100/10' : 'hover:border-line'
          }`}
        >
          <CardContent className="p-3.5">
            <span className="text-[10px] text-ink-500 font-mono uppercase tracking-wider font-semibold">In Field</span>
            <div className="text-xl font-bold font-heading text-ink-950 mt-0.5">
              {(summary?.on_the_way || 0) + (summary?.arrived || 0) + (summary?.work_started || 0) + (summary?.in_progress || 0)}
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('SLA_BREACHED')}
          className={`cursor-pointer transition-all border-l-4 border-l-semantic-danger ${
            activeTab === 'SLA_BREACHED' ? 'ring-2 ring-semantic-danger bg-semantic-danger/5' : 'hover:border-line'
          }`}
        >
          <CardContent className="p-3.5">
            <span className="text-[10px] text-semantic-danger font-mono uppercase tracking-wider font-bold">SLA Breached</span>
            <div className="text-xl font-bold font-heading text-semantic-danger mt-0.5">{summary?.sla_breached || 0}</div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('RESOLVED')}
          className={`cursor-pointer transition-all border-l-4 border-l-semantic-success ${
            activeTab === 'RESOLVED' ? 'ring-2 ring-primary-600 bg-primary-100/10' : 'hover:border-line'
          }`}
        >
          <CardContent className="p-3.5">
            <span className="text-[10px] text-semantic-success font-mono uppercase tracking-wider font-semibold">Resolved</span>
            <div className="text-xl font-bold font-heading text-semantic-success mt-0.5">
              {(summary?.done || 0) + (summary?.verified || 0) + (summary?.closed || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Top Row: Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-line">
            {[
              { id: 'ALL', label: `All (${summary?.total || 0})` },
              { id: 'SUBMITTED', label: `New Intake (${summary?.submitted || 0})` },
              { id: 'UNDER_REVIEW', label: `Under Review (${summary?.under_review || 0})` },
              { id: 'ACCEPTED', label: `Accepted (${summary?.accepted || 0})` },
              { id: 'ASSIGNED', label: `Assigned (${summary?.assigned || 0})` },
              { id: 'IN_PROGRESS', label: `In Field (${(summary?.on_the_way || 0) + (summary?.arrived || 0) + (summary?.work_started || 0) + (summary?.in_progress || 0)})` },
              { id: 'SLA_BREACHED', label: `SLA Breached (${summary?.sla_breached || 0})` },
              { id: 'REJECTED', label: `Rejected (${summary?.rejected || 0})` },
              { id: 'REOPENED', label: `Reopened (${summary?.reopened || 0})` },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-button text-xs font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-none ${
                    isActive
                      ? 'bg-primary-700 text-card font-semibold'
                      : 'text-ink-700 hover:bg-surface'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Bottom Row: Search, Priority, Category, Sorting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            <form onSubmit={handleSearch} className="relative">
              <Search className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticket ID, citizen, ward..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-line rounded-input focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </form>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-surface border border-line rounded-input text-ink-950 focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-surface border border-line rounded-input text-ink-950 focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-1.5 text-xs bg-surface border border-line rounded-input text-ink-950 focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="created_desc">Newest Submissions</option>
              <option value="sla_asc">SLA Urgency (Earliest Deadline)</option>
              <option value="created_asc">Oldest First</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Issue Intake Queue Table */}
      <Card>
        <CardHeader className="p-4 border-b border-line flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Grievance Intake & Dispatch Table</CardTitle>
            <CardDescription className="text-xs">
              Showing {issues.length} tickets matching active filters
            </CardDescription>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface/80 border-b border-line text-ink-500 font-mono uppercase text-[11px]">
                <th className="py-3 px-4 font-semibold">Issue Ref</th>
                <th className="py-3 px-4 font-semibold">Title & Category</th>
                <th className="py-3 px-4 font-semibold">Citizen / Location</th>
                <th className="py-3 px-4 font-semibold">Priority</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">SLA Countdown</th>
                <th className="py-3 px-4 font-semibold">Worker</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-ink-500 font-mono">
                    Loading department grievance records...
                  </td>
                </tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Inbox className="w-8 h-8 text-ink-300 mx-auto" />
                      <p className="font-heading font-semibold text-sm text-ink-950">Queue is clear</p>
                      <p className="text-xs text-ink-500">No issues currently match your search and filter parameters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                issues.map((issue) => {
                  const primaryImg = issue.primary_image?.image || (issue.images && issue.images[0]?.image);

                  return (
                    <tr
                      key={issue.id}
                      className="hover:bg-surface/60 transition-colors group cursor-pointer"
                      onClick={() => handleOpenTriage(issue)}
                    >
                      {/* Ref ID */}
                      <td className="py-3 px-4 font-mono font-bold text-primary-700 whitespace-nowrap">
                        {issue.issue_id}
                      </td>

                      {/* Title & Preview */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 max-w-xs">
                          {primaryImg ? (
                            <img
                              src={primaryImg}
                              alt=""
                              className="w-10 h-10 rounded-input object-cover border border-line shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-input bg-surface border border-line flex items-center justify-center shrink-0 text-ink-300">
                              <Building2 className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-ink-950 truncate">{issue.title}</p>
                            <span className="text-[11px] text-ink-500 truncate block">
                              {issue.category?.name || 'General'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Citizen & Location */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <p className="text-ink-950 font-medium truncate">{issue.citizen_name || 'Citizen'}</p>
                        <p className="text-ink-500 text-[11px] truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-ink-400 shrink-0" />
                          <span>{issue.location?.ward || issue.location?.address_text || 'Ward 1'}</span>
                        </p>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <PriorityBadge priority={issue.priority as any} size="sm" />
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={issue.status as any} size="sm" />
                      </td>

                      {/* SLA Timer */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <SlaTimer deadline={issue.sla_deadline} status={issue.status} />
                      </td>

                      {/* Assigned Worker */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {issue.assigned_worker_name ? (
                          <span className="font-mono text-xs text-ink-950 font-medium flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-primary-600" />
                            {issue.assigned_worker_name}
                          </span>
                        ) : (
                          <span className="text-ink-300 font-mono text-xs">Unassigned</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenTriage(issue)}
                          rightIcon={<ArrowRight className="w-3 h-3" />}
                        >
                          Review & Triage
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Comprehensive Triage & Work Order Assignment Drawer */}
      {activeIssue && (
        <Drawer
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          title={`Triage Desk: ${activeIssue.issue_id}`}
          description={`Reported on ${new Date(activeIssue.created_at).toLocaleString()}`}
          width="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="ghost" size="sm" onClick={handleCloseDrawer}>
                Close
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setActionTab('REJECT')}
                  leftIcon={<X className="w-3.5 h-3.5" />}
                >
                  Reject / Reroute
                </Button>
                {activeIssue.status !== 'ASSIGNED' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActionTab('ACCEPT')}
                    leftIcon={<Check className="w-3.5 h-3.5" />}
                  >
                    Accept Ticket
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (actionTab === 'ASSIGN') {
                      handleAssignWorkerSubmit();
                    } else {
                      setActionTab('ASSIGN');
                    }
                  }}
                  disabled={isActionLoading}
                  leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                >
                  {actionTab === 'ASSIGN' ? (isActionLoading ? 'Dispatching...' : 'Dispatch Work Order') : 'Assign Field Worker'}
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Status & SLA summary header */}
            <div className="p-3.5 bg-surface border border-line rounded-input flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={activeIssue.status as any} />
                <PriorityBadge priority={activeIssue.priority as any} />
                <span className="font-mono text-xs text-ink-500">
                  {activeIssue.category?.name}
                </span>
              </div>
              <SlaTimer deadline={activeIssue.sla_deadline} status={activeIssue.status} />
            </div>

            {/* Error banner if any action failed */}
            {actionError && (
              <div className="p-3 bg-semantic-danger/10 border border-semantic-danger/30 rounded-input flex items-center gap-2 text-xs text-semantic-danger font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Evidence & Forensic Quality Assessment Panel */}
            <div className="p-3.5 bg-primary-100/60 border border-primary-600/30 rounded-input space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary-700" />
                  <span className="font-heading font-semibold text-xs text-primary-700">
                    Evidence Verification & Forensic Quality
                  </span>
                </div>
                {activeIssue.evidence_verification ? (
                  <span
                    className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-badge border ${
                      activeIssue.evidence_verification.overall_confidence_score >= 85
                        ? 'bg-semantic-success/15 text-semantic-success border-semantic-success/30'
                        : activeIssue.evidence_verification.overall_confidence_score >= 65
                        ? 'bg-primary-100 text-primary-700 border-primary-600/30'
                        : 'bg-accent-500/15 text-accent-600 border-accent-500/30'
                    }`}
                  >
                    Confidence: {activeIssue.evidence_verification.overall_confidence_score}% (
                    {activeIssue.evidence_verification.confidence_band_display || activeIssue.evidence_verification.confidence_band})
                  </span>
                ) : (
                  <span className="font-mono text-[11px] text-ink-500">Analysis Pending</span>
                )}
              </div>

              {activeIssue.evidence_verification && (
                <div className="space-y-1.5 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-ink-700">
                    <div className="p-2 bg-card rounded border border-line flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-semantic-success shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-ink-950 block">Location Consistency</span>
                        <span className="text-[10px] text-ink-500">
                          {activeIssue.evidence_verification.manipulation_indicators?.location_analysis?.remarks || 'Matches reported location'}
                        </span>
                      </div>
                    </div>
                    <div className="p-2 bg-card rounded border border-line flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-semantic-success shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-ink-950 block">Duplicate Detection</span>
                        <span className="text-[10px] text-ink-500">
                          {activeIssue.evidence_verification.manipulation_indicators?.duplicate_analysis?.remarks || 'Unique perceptual hash'}
                        </span>
                      </div>
                    </div>
                    <div className="p-2 bg-card rounded border border-line flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-semantic-success shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-ink-950 block">Timestamp Integrity</span>
                        <span className="text-[10px] text-ink-500">
                          {activeIssue.evidence_verification.manipulation_indicators?.timestamp_analysis?.remarks || 'Captured recently'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {activeIssue.evidence_verification.exif_metadata && Object.keys(activeIssue.evidence_verification.exif_metadata).length > 0 && (
                    <div className="p-2 bg-surface rounded border border-line font-mono text-[10px] text-ink-500 flex flex-wrap gap-3">
                      {activeIssue.evidence_verification.exif_metadata.device_model && (
                        <span>Device: {activeIssue.evidence_verification.exif_metadata.device_make || ''} {activeIssue.evidence_verification.exif_metadata.device_model}</span>
                      )}
                      {activeIssue.evidence_verification.exif_metadata.capture_datetime && (
                        <span>EXIF Date: {activeIssue.evidence_verification.exif_metadata.capture_datetime}</span>
                      )}
                      {activeIssue.evidence_verification.file_hash_sha256 && (
                        <span>SHA256: {activeIssue.evidence_verification.file_hash_sha256.substring(0, 12)}...</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <p className="text-[10px] text-ink-500 font-mono italic">
                * Note: Verification signals are operational indicators to assist triage. Authorized municipal officer decision is authoritative.
              </p>
            </div>

            {/* Photos & Media Viewer */}
            {activeIssue.images && activeIssue.images.length > 0 && (
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-ink-500 font-semibold block mb-2">
                  Attached Photo Evidence ({activeIssue.images.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeIssue.images.map((img) => (
                    <a
                      key={img.id}
                      href={img.image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-video rounded-input overflow-hidden border border-line bg-surface block"
                    >
                      <img
                        src={img.image}
                        alt="Evidence"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute bottom-1 left-1 font-mono text-[9px] bg-ink-950/70 text-card px-1.5 py-0.5 rounded">
                        {img.capture_source}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Issue Description */}
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-ink-500 font-semibold">
                Citizen Grievance Description
              </span>
              <h4 className="font-heading font-bold text-base text-ink-950">{activeIssue.title}</h4>
              <p className="text-xs text-ink-700 leading-relaxed whitespace-pre-wrap bg-surface p-3 rounded-input border border-line">
                {activeIssue.description}
              </p>
            </div>

            {/* Location & Coordinates */}
            {activeIssue.location && (
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-wider text-ink-500 font-semibold">
                  Incident Location & Geotag
                </span>
                <div className="p-3 bg-surface border border-line rounded-input space-y-1.5 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-ink-950">{activeIssue.location.address_text}</p>
                      {activeIssue.location.landmark && (
                        <p className="text-ink-500 text-[11px]">Landmark: {activeIssue.location.landmark}</p>
                      )}
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-ink-500 pt-1 border-t border-line flex items-center justify-between">
                    <span>Latitude: {activeIssue.location.latitude}</span>
                    <span>Longitude: {activeIssue.location.longitude}</span>
                    <span>Ward: {activeIssue.location.ward || 'Central'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Panels Tabs */}
            <div className="border-t border-line pt-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-line pb-2">
                <button
                  onClick={() => setActionTab('ACCEPT')}
                  className={`px-3 py-1.5 rounded-button text-xs font-semibold transition-colors ${
                    actionTab === 'ACCEPT'
                      ? 'bg-primary-700 text-card'
                      : 'text-ink-700 hover:bg-surface border border-line'
                  }`}
                >
                  1. Accept Grievance
                </button>
                <button
                  onClick={() => setActionTab('ASSIGN')}
                  className={`px-3 py-1.5 rounded-button text-xs font-semibold transition-colors ${
                    actionTab === 'ASSIGN'
                      ? 'bg-primary-700 text-card'
                      : 'text-ink-700 hover:bg-surface border border-line'
                  }`}
                >
                  2. Dispatch Worker
                </button>
                <button
                  onClick={() => setActionTab('REJECT')}
                  className={`px-3 py-1.5 rounded-button text-xs font-semibold transition-colors ${
                    actionTab === 'REJECT'
                      ? 'bg-semantic-danger text-card'
                      : 'text-ink-700 hover:bg-surface border border-line'
                  }`}
                >
                  3. Reject / Reroute
                </button>
              </div>

              {/* Action 1: Accept */}
              {actionTab === 'ACCEPT' && (
                <div className="space-y-3 p-4 bg-surface/50 border border-line rounded-card">
                  <h4 className="font-heading font-semibold text-sm text-ink-950 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-primary-600" />
                    Accept Issue & Confirm SLA Priority
                  </h4>
                  <p className="text-xs text-ink-500">
                    Accepting transitions this issue into active department scheduling and activates the SLA countdown.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-ink-950">Confirm / Adjust Priority Level</label>
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value as IssuePriority)}
                      className="w-full px-3 py-2 text-xs bg-card border border-line rounded-input focus:ring-2 focus:ring-primary-600 text-ink-950"
                    >
                      <option value="CRITICAL">CRITICAL (4h Response / 12h Resolution)</option>
                      <option value="HIGH">HIGH (12h Response / 24h Resolution)</option>
                      <option value="MEDIUM">MEDIUM (24h Response / 72h Resolution)</option>
                      <option value="LOW">LOW (48h Response / 168h Resolution)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-ink-950">Officer Acceptance Remarks</label>
                    <textarea
                      rows={2}
                      value={acceptRemarks}
                      onChange={(e) => setAcceptRemarks(e.target.value)}
                      placeholder="e.g. Site verified. Work scheduled for immediate patch."
                      className="w-full p-2.5 text-xs bg-card border border-line rounded-input focus:ring-2 focus:ring-primary-600 text-ink-950"
                    />
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    disabled={isActionLoading}
                    onClick={handleAcceptSubmit}
                    leftIcon={<Check className="w-4 h-4" />}
                  >
                    {isActionLoading ? 'Saving...' : 'Confirm Acceptance'}
                  </Button>
                </div>
              )}

              {/* Action 2: Assign Worker */}
              {actionTab === 'ASSIGN' && (
                <div className="space-y-3 p-4 bg-surface/50 border border-line rounded-card">
                  <h4 className="font-heading font-semibold text-sm text-ink-950 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-primary-600" />
                    Assign Field Technician / Worker
                  </h4>
                  <p className="text-xs text-ink-500">
                    Select a technician from your department. They will receive an in-app task assignment notification.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-ink-950">
                      Select Department Worker ({workers.length} available)
                    </label>
                    <select
                      value={selectedWorkerId || (workers.length > 0 ? String(workers[0].id) : '')}
                      onChange={(e) => setSelectedWorkerId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-card border border-line rounded-input focus:ring-2 focus:ring-primary-600 text-ink-950"
                    >
                      {workers.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} — {w.skills} [{w.active_task_count} active tasks]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-ink-950">Work Order Instructions / Material Notes</label>
                    <textarea
                      rows={2}
                      value={assignNotes}
                      onChange={(e) => setAssignNotes(e.target.value)}
                      placeholder="e.g. Bring asphalt compactor and warning cones. Complete before 5 PM."
                      className="w-full p-2.5 text-xs bg-card border border-line rounded-input focus:ring-2 focus:ring-primary-600 text-ink-950"
                    />
                  </div>

                  {actionError && (
                    <div className="p-2.5 bg-semantic-danger/10 border border-semantic-danger/30 rounded-input text-xs text-semantic-danger font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{actionError}</span>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    disabled={isActionLoading || workers.length === 0}
                    onClick={handleAssignWorkerSubmit}
                    leftIcon={<UserCheck className="w-4 h-4" />}
                  >
                    {isActionLoading ? 'Dispatching...' : 'Dispatch Work Order'}
                  </Button>
                </div>
              )}

              {/* Action 3: Reject / Re-route */}
              {actionTab === 'REJECT' && (
                <div className="space-y-3 p-4 bg-semantic-danger/5 border border-semantic-danger/20 rounded-card">
                  <h4 className="font-heading font-semibold text-sm text-semantic-danger flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Reject Grievance or Re-route Department
                  </h4>
                  <p className="text-xs text-ink-500">
                    A rejection reason is strictly required. If outside this department's jurisdiction, select the target department to transfer the ticket.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-ink-950">
                      Rejection Reason <span className="text-semantic-danger">*</span>
                    </label>
                    <select
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value as IssueRejectionReason)}
                      className="w-full px-3 py-2 text-xs bg-card border border-line rounded-input focus:ring-2 focus:ring-primary-600 text-ink-950"
                    >
                      {REJECTION_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {rejectionReason === 'OUTSIDE_RESPONSIBILITY' && (
                    <div className="space-y-1.5 p-3 bg-card border border-line rounded-input">
                      <label className="text-xs font-medium text-primary-700">
                        Recommend / Re-route to Target Department
                      </label>
                      <select
                        value={rerouteDepartmentId}
                        onChange={(e) => setRerouteDepartmentId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-surface border border-line rounded-input text-ink-950"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-ink-950">
                      Officer Explanation Notes <span className="text-semantic-danger">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      placeholder="Explain reason for rejection or details of transfer..."
                      className="w-full p-2.5 text-xs bg-card border border-line rounded-input focus:ring-2 focus:ring-primary-600 text-ink-950"
                    />
                  </div>

                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full"
                    disabled={isActionLoading}
                    onClick={handleRejectSubmit}
                    leftIcon={<X className="w-4 h-4" />}
                  >
                    {isActionLoading ? 'Processing...' : 'Confirm Rejection / Re-route'}
                  </Button>
                </div>
              )}
            </div>

            {/* Status History Stepper in Drawer */}
            <div className="border-t border-line pt-4">
              <span className="text-xs font-mono uppercase tracking-wider text-ink-500 font-semibold block mb-3">
                Audit Trail & History
              </span>
              {activeIssue.status_history && activeIssue.status_history.length > 0 ? (
                <div className="relative pl-5 border-l-2 border-primary-600/30 space-y-3">
                  {activeIssue.status_history.map((step, idx) => (
                    <div key={step.id || idx} className="relative text-xs">
                      <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-primary-600 border-2 border-card" />
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-ink-950">{step.to_status}</span>
                        <span className="font-mono text-[10px] text-ink-500">
                          {new Date(step.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-ink-600 mt-0.5">{step.remarks}</p>
                      {step.changed_by_name && (
                        <span className="text-[10px] text-ink-400 font-mono">By {step.changed_by_name}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-500">No logs yet.</p>
              )}
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};
