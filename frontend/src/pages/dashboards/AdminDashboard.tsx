import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { api } from '../../services/api';
import { Issue, IssueCategory } from '../../types/issues';
import {
  LogOut,
  Building2,
  Layers,
  Clock,
  ShieldCheck,
  Search,
  RefreshCw,
  Edit,
  Activity,
  BarChart3,
  FileText,
  MapPin,
  User,
  ExternalLink,
  Calendar,
  Mail,
  Inbox,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

type AdminTab = 'ISSUES' | 'ANALYTICS' | 'ROUTING' | 'SLA_CONFIG' | 'AUDIT_LOGS';

interface AdminOverviewData {
  total_issues: number;
  active_issues: number;
  critical_issues: number;
  resolved_issues: number;
  rejected_issues: number;
  reopened_issues: number;
  sla_breached_issues: number;
  by_department: Array<{
    id: number;
    name: string;
    code: string;
    total_issues: number;
    resolved_issues: number;
  }>;
  by_category: Array<{
    id: number;
    name: string;
    code: string;
    count: number;
  }>;
  by_status: Array<{
    status: string;
    label: string;
    count: number;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: '#52667A',
  UNDER_REVIEW: '#0E7378',
  ACCEPTED: '#0B5F63',
  ASSIGNED: '#243B53',
  ON_THE_WAY: '#7C3AED',
  ARRIVED: '#6366F1',
  WORK_STARTED: '#D97706',
  IN_PROGRESS: '#F59E0B',
  DONE: '#10B981',
  VERIFIED: '#059669',
  CLOSED: '#047857',
  REJECTED: '#EF4444',
  REOPENED: '#DC2626',
};

export const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('ISSUES');
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [categories, setCategories] = useState<IssueCategory[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [slaConfigs, setSlaConfigs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Issues Tab State
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issueSearch, setIssueSearch] = useState<string>('');
  const [issueDeptFilter, setIssueDeptFilter] = useState<string>('ALL');
  const [issueStatusFilter, setIssueStatusFilter] = useState<string>('ALL');
  const [issuePriorityFilter, setIssuePriorityFilter] = useState<string>('ALL');
  const [isIssuesLoading, setIsIssuesLoading] = useState<boolean>(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Category Edit State
  const [editingCategory, setEditingCategory] = useState<IssueCategory | null>(null);
  const [editDeptId, setEditDeptId] = useState<number | ''>('');
  const [editPriority, setEditPriority] = useState<string>('MEDIUM');
  const [isSavingCategory, setIsSavingCategory] = useState<boolean>(false);
  const [categorySaveMsg, setCategorySaveMsg] = useState<string | null>(null);

  const fetchAdminIssues = async () => {
    setIsIssuesLoading(true);
    try {
      const res = await api.getIssues({
        department: issueDeptFilter !== 'ALL' ? issueDeptFilter : undefined,
        status: issueStatusFilter !== 'ALL' ? issueStatusFilter : undefined,
        priority: issuePriorityFilter !== 'ALL' ? issuePriorityFilter : undefined,
        search: issueSearch.trim() || undefined,
      });
      const list = Array.isArray(res) ? res : res.results || [];
      setIssues(list);
    } catch (err) {
      console.error('Failed to load issues for admin:', err);
    } finally {
      setIsIssuesLoading(false);
    }
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [overviewRes, catRes, deptRes, slaRes, auditRes] = await Promise.allSettled([
        api.getAdminOverview(),
        api.getCategories(),
        api.getDepartments(),
        api.getSlaConfigs(),
        api.getAuditLogs(),
      ]);

      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value);
      if (catRes.status === 'fulfilled') setCategories(catRes.value);
      if (deptRes.status === 'fulfilled') setDepartments(deptRes.value);
      if (slaRes.status === 'fulfilled') setSlaConfigs(slaRes.value);
      if (auditRes.status === 'fulfilled') setAuditLogs(auditRes.value);
    } catch (err) {
      console.error('Failed to load admin overview data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    fetchAdminIssues();
  }, []);

  useEffect(() => {
    if (activeTab === 'ISSUES') {
      fetchAdminIssues();
    } else if (activeTab === 'ANALYTICS' && !overview) {
      loadDashboardData();
    }
  }, [activeTab, issueDeptFilter, issueStatusFilter, issuePriorityFilter]);

  const handleAuditSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const filtered = await api.getAuditLogs(auditSearch.trim() || undefined);
      setAuditLogs(filtered);
    } catch (err) {
      console.error('Failed to filter audit logs:', err);
    }
  };

  const openCategoryEditModal = (cat: IssueCategory) => {
    setEditingCategory(cat);
    setEditDeptId(cat.default_department?.id || '');
    setEditPriority(cat.default_priority || 'MEDIUM');
    setCategorySaveMsg(null);
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    setIsSavingCategory(true);
    setCategorySaveMsg(null);
    try {
      const updated = await api.updateCategory(editingCategory.id, {
        default_department_id: editDeptId || null,
        default_priority: editPriority,
      });

      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setCategorySaveMsg('Category routing updated successfully!');
      setTimeout(() => {
        setEditingCategory(null);
        setCategorySaveMsg(null);
      }, 1200);
    } catch (err: any) {
      setCategorySaveMsg(err.error || 'Failed to update category routing.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    const issueMatch = log.issue_ticket_id?.toLowerCase().includes(q);
    const actorMatch = log.actor_name?.toLowerCase().includes(q);
    const actionMatch = log.action?.toLowerCase().includes(q);
    const roleMatch = log.role?.toLowerCase().includes(q);
    return issueMatch || actorMatch || actionMatch || roleMatch;
  });

  const departmentChartData = overview?.by_department?.map((d) => ({
    name: d.code,
    fullName: d.name,
    Total: d.total_issues,
    Resolved: d.resolved_issues,
  })) || [];

  const statusPieData = overview?.by_status?.filter((s) => s.count > 0).map((s) => ({
    name: s.label,
    value: s.count,
    statusKey: s.status,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-0.5 bg-primary-700 text-card rounded-badge font-semibold">
              MUNICIPAL GOVERNANCE & AUDIT
            </span>
            <span className="text-xs text-ink-500 font-mono">System Administrator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-ink-950 mt-1">
            Executive Command Console
          </h1>
          <p className="text-xs text-ink-500 mt-0.5">
            City-wide SLA oversight, departmental routing engine, and immutable forensic audit ledger.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadDashboardData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={logout} leftIcon={<LogOut className="w-4 h-4" />}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-l-4 border-l-primary-700 bg-card">
          <CardContent className="p-3.5">
            <span className="text-[10px] text-ink-500 font-mono uppercase tracking-wider block">Total Incidents</span>
            <div className="text-2xl font-bold font-heading text-ink-950 mt-0.5 font-mono">
              {overview?.total_issues ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-status-under-review bg-card">
          <CardContent className="p-3.5">
            <span className="text-[10px] text-ink-500 font-mono uppercase tracking-wider block">Active Pipelines</span>
            <div className="text-2xl font-bold font-heading text-status-under-review mt-0.5 font-mono">
              {overview?.active_issues ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-semantic-danger bg-card">
          <CardContent className="p-3.5">
            <span className="text-[10px] text-ink-500 font-mono uppercase tracking-wider block">Critical Severity</span>
            <div className="text-2xl font-bold font-heading text-semantic-danger mt-0.5 font-mono">
              {overview?.critical_issues ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-semantic-success bg-card">
          <CardContent className="p-3.5">
            <span className="text-[10px] text-ink-500 font-mono uppercase tracking-wider block">Resolved & Verified</span>
            <div className="text-2xl font-bold font-heading text-semantic-success mt-0.5 font-mono">
              {overview?.resolved_issues ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent-500 bg-card">
          <CardContent className="p-3.5">
            <span className="text-[10px] text-ink-500 font-mono uppercase tracking-wider block">SLA Breached</span>
            <div className="text-2xl font-bold font-heading text-accent-600 mt-0.5 font-mono">
              {overview?.sla_breached_issues ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-status-rejected bg-card">
          <CardContent className="p-3.5">
            <span className="text-[10px] text-ink-500 font-mono uppercase tracking-wider block">Reopened</span>
            <div className="text-2xl font-bold font-heading text-status-rejected mt-0.5 font-mono">
              {overview?.reopened_issues ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-line gap-2 text-xs font-semibold overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('ISSUES')}
          className={`px-4 py-2 rounded-t-lg transition flex items-center gap-2 ${
            activeTab === 'ISSUES'
              ? 'bg-card text-primary-700 border-t-2 border-primary-700 border-x border-line -mb-px font-bold'
              : 'text-ink-500 hover:text-ink-950 hover:bg-surface'
          }`}
        >
          <FileText className="w-4 h-4" />
          Civic Issues Registry ({overview?.total_issues ?? issues.length})
        </button>
        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`px-4 py-2 rounded-t-lg transition flex items-center gap-2 ${
            activeTab === 'ANALYTICS'
              ? 'bg-card text-primary-700 border-t-2 border-primary-700 border-x border-line -mb-px font-bold'
              : 'text-ink-500 hover:text-ink-950 hover:bg-surface'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Executive Analytics
        </button>
        <button
          onClick={() => setActiveTab('ROUTING')}
          className={`px-4 py-2 rounded-t-lg transition flex items-center gap-2 ${
            activeTab === 'ROUTING'
              ? 'bg-card text-primary-700 border-t-2 border-primary-700 border-x border-line -mb-px font-bold'
              : 'text-ink-500 hover:text-ink-950 hover:bg-surface'
          }`}
        >
          <Layers className="w-4 h-4" />
          Category Routing Engine
        </button>
        <button
          onClick={() => setActiveTab('SLA_CONFIG')}
          className={`px-4 py-2 rounded-t-lg transition flex items-center gap-2 ${
            activeTab === 'SLA_CONFIG'
              ? 'bg-card text-primary-700 border-t-2 border-primary-700 border-x border-line -mb-px font-bold'
              : 'text-ink-500 hover:text-ink-950 hover:bg-surface'
          }`}
        >
          <Clock className="w-4 h-4" />
          SLA Matrix Policy
        </button>
        <button
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`px-4 py-2 rounded-t-lg transition flex items-center gap-2 ${
            activeTab === 'AUDIT_LOGS'
              ? 'bg-card text-primary-700 border-t-2 border-primary-700 border-x border-line -mb-px font-bold'
              : 'text-ink-500 hover:text-ink-950 hover:bg-surface'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Master Audit Ledger ({filteredAuditLogs.length})
        </button>
      </div>

      {/* TAB 0: ALL CIVIC ISSUES */}
      {activeTab === 'ISSUES' && (
        <div className="space-y-4">
          <Card className="border-line bg-card">
            <CardHeader className="pb-3 border-b border-line">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-700" />
                    City-Wide Civic Grievances Registry
                  </CardTitle>
                  <CardDescription className="text-xs text-ink-500">
                    Live city-wide view of grievances reported by citizens across all municipal departments.
                  </CardDescription>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchAdminIssues}
                  isLoading={isIssuesLoading}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Reload Issues
                </Button>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search ticket ID, title, citizen, ward..."
                    value={issueSearch}
                    onChange={(e) => setIssueSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') fetchAdminIssues();
                    }}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-line rounded-input focus:outline-none focus:ring-2 focus:ring-primary-600 text-ink-950"
                  />
                </div>

                <select
                  value={issueDeptFilter}
                  onChange={(e) => setIssueDeptFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-surface border border-line rounded-input text-ink-950 focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  <option value="ALL">All Municipal Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>

                <select
                  value={issueStatusFilter}
                  onChange={(e) => setIssueStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-surface border border-line rounded-input text-ink-950 focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUBMITTED">Submitted (New Intake)</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done / Resolved</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="CLOSED">Closed</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="REOPENED">Reopened</option>
                </select>

                <select
                  value={issuePriorityFilter}
                  onChange={(e) => setIssuePriorityFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-surface border border-line rounded-input text-ink-950 focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="CRITICAL">Critical Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              {isIssuesLoading ? (
                <div className="py-16 text-center text-xs text-ink-500 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-primary-700" />
                  <span>Loading municipal grievances...</span>
                </div>
              ) : issues.length === 0 ? (
                <div className="py-14 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-surface mx-auto flex items-center justify-center text-ink-400">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-ink-950">No civic issues found</p>
                  <p className="text-xs text-ink-500 max-w-sm mx-auto">
                    No grievances currently match your filter criteria. Citizen submissions will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-4 rounded-xl border border-line bg-card hover:border-primary-600/60 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary-100 text-primary-800 border border-primary-200">
                            {issue.issue_id}
                          </span>
                          <StatusBadge status={issue.status as any} size="sm" />
                          <PriorityBadge priority={issue.priority as any} size="sm" />
                          {issue.department && (
                            <span className="text-[11px] font-semibold text-ink-700 px-2 py-0.5 rounded bg-surface border border-line">
                              {issue.department.name}
                            </span>
                          )}
                          {issue.category && (
                            <span className="text-[11px] text-ink-500 font-mono">
                              • {issue.category.name}
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm text-ink-950 leading-snug">
                            {issue.title}
                          </h4>
                          <p className="text-xs text-ink-600 mt-1 line-clamp-2 leading-relaxed">
                            {issue.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500 pt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-primary-700" />
                            <strong>Reported by:</strong> {issue.citizen ? `${issue.citizen.first_name || ''} ${issue.citizen.last_name || ''} (${issue.citizen.username})`.trim() : 'Public Citizen'}
                          </span>
                          {issue.location?.address_text && (
                            <span className="flex items-center gap-1 truncate max-w-xs">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span className="truncate">{issue.location.address_text}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Calendar className="w-3 h-3 text-ink-400" />
                            {new Date(issue.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                        <Link to={`/track/${issue.issue_id}`} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm" className="text-xs" rightIcon={<ExternalLink className="w-3 h-3" />}>
                            Public Tracker
                          </Button>
                        </Link>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedIssue(issue)}
                          className="bg-primary-700 hover:bg-primary-800 text-white text-xs"
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          View Details & Timeline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 1: EXECUTIVE ANALYTICS */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Breakdown Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary-600" />
                  Departmental Caseload & Resolution
                </CardTitle>
                <CardDescription>Total reported vs. successfully resolved tickets by municipal department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full min-h-[256px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentChartData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8EF" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
                      <YAxis tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0A1A2A',
                          color: '#FFFFFF',
                          borderRadius: '6px',
                          fontSize: '12px',
                          border: 'none',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="Total" fill="#0B5F63" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Resolved" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Status Breakdown Donut Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary-600" />
                  Lifecycle State Distribution
                </CardTitle>
                <CardDescription>Current proportion of civic tickets across lifecycle stages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full min-h-[256px]">
                  {statusPieData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-ink-400 gap-2">
                      <Inbox className="w-8 h-8 text-ink-300" />
                      <span>No active lifecycle state records logged yet</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {statusPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.statusKey] || '#52667A'} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0A1A2A',
                            color: '#FFFFFF',
                            borderRadius: '6px',
                            fontSize: '12px',
                            border: 'none',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Department Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Departmental Operational Performance</CardTitle>
              <CardDescription>Active bodies maintaining city infrastructure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto border border-line rounded-input">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface font-mono text-[11px] text-ink-500 uppercase border-b border-line">
                    <tr>
                      <th className="p-3">Department Name</th>
                      <th className="p-3">Code</th>
                      <th className="p-3 text-right">Total Assigned</th>
                      <th className="p-3 text-right">Resolved</th>
                      <th className="p-3 text-right">Resolution Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line font-sans">
                    {overview?.by_department?.map((dept) => {
                      const rate = dept.total_issues > 0
                        ? Math.round((dept.resolved_issues / dept.total_issues) * 100)
                        : 100;
                      return (
                        <tr key={dept.id} className="hover:bg-surface/60 transition">
                          <td className="p-3 font-semibold text-ink-950">{dept.name}</td>
                          <td className="p-3 font-mono text-primary-700 font-bold">{dept.code}</td>
                          <td className="p-3 text-right font-mono font-medium">{dept.total_issues}</td>
                          <td className="p-3 text-right font-mono font-medium text-semantic-success">{dept.resolved_issues}</td>
                          <td className="p-3 text-right">
                            <span className={`font-mono font-bold ${rate >= 75 ? 'text-semantic-success' : rate >= 50 ? 'text-accent-600' : 'text-semantic-danger'}`}>
                              {rate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: CATEGORY ROUTING ENGINE */}
      {activeTab === 'ROUTING' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category-to-Department Routing Configuration</CardTitle>
            <CardDescription>
              Rules directing citizen reports to specialized municipal departments and default SLA priorities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border border-line rounded-input">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-surface font-mono text-[11px] text-ink-500 uppercase border-b border-line">
                  <tr>
                    <th className="p-3">Category</th>
                    <th className="p-3">Code</th>
                    <th className="p-3">Default Department</th>
                    <th className="p-3">Default Priority</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-surface/60 transition">
                      <td className="p-3">
                        <div className="font-semibold text-ink-950">{cat.name}</div>
                        <div className="text-[11px] text-ink-500">{cat.description}</div>
                      </td>
                      <td className="p-3 font-mono text-ink-700 font-bold">{cat.code}</td>
                      <td className="p-3">
                        {cat.default_department ? (
                          <span className="font-medium text-primary-700 bg-primary-100 px-2 py-0.5 rounded text-xs">
                            {cat.default_department.name} ({cat.default_department.code})
                          </span>
                        ) : (
                          <span className="text-ink-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3">
                        <PriorityBadge priority={cat.default_priority as any} />
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openCategoryEditModal(cat)}
                          leftIcon={<Edit className="w-3.5 h-3.5" />}
                        >
                          Configure
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: SLA POLICY MATRIX */}
      {activeTab === 'SLA_CONFIG' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Municipal Citizen Charter & SLA Policy</CardTitle>
            <CardDescription>
              Statutory response and turnaround deadlines for civic grievance redressal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border border-line rounded-input">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-surface font-mono text-[11px] text-ink-500 uppercase border-b border-line">
                  <tr>
                    <th className="p-3">Priority Class</th>
                    <th className="p-3">Target Response Time</th>
                    <th className="p-3">Statutory Resolution Deadline</th>
                    <th className="p-3">Warning Escalation Threshold</th>
                    <th className="p-3">Compliance Standard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {slaConfigs.map((sla) => (
                    <tr key={sla.id || sla.priority} className="hover:bg-surface/60 transition">
                      <td className="p-3">
                        <PriorityBadge priority={sla.priority} />
                      </td>
                      <td className="p-3 font-mono font-medium text-ink-950">
                        {sla.response_time_hours} Hours
                      </td>
                      <td className="p-3 font-mono font-bold text-primary-700">
                        {sla.resolution_time_hours} Hours ({Math.round(sla.resolution_time_hours / 24)} Days)
                      </td>
                      <td className="p-3 font-mono text-accent-600 font-medium">
                        {sla.warning_threshold_hours} Hours Remaining
                      </td>
                      <td className="p-3 text-ink-700">
                        {sla.priority === 'CRITICAL' && 'Immediate on-site emergency dispatch within 4h'}
                        {sla.priority === 'HIGH' && 'Inspection & assignment within 12h'}
                        {sla.priority === 'MEDIUM' && 'Standard scheduled repair workflow'}
                        {sla.priority === 'LOW' && 'Batch municipal maintenance routine'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: IMMUTABLE AUDIT LEDGER */}
      {activeTab === 'AUDIT_LOGS' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary-600" />
                  Forensic System Audit Trail
                </CardTitle>
                <CardDescription>Append-only immutable record of all lifecycle events and state mutations</CardDescription>
              </div>
              <form onSubmit={handleAuditSearch} className="flex gap-2 max-w-sm">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-ink-500" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Search by SC ticket ID or Actor..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs font-mono border border-line rounded-input bg-card focus:ring-1 focus:ring-primary-600 outline-none"
                  />
                </div>
                <Button type="submit" variant="secondary" size="sm">
                  Filter
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border border-line rounded-input max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-surface font-mono text-[11px] text-ink-500 uppercase border-b border-line sticky top-0 z-10">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Issue Ticket</th>
                    <th className="p-3">Actor & Role</th>
                    <th className="p-3">Action Event</th>
                    <th className="p-3">Event Details & Remarks</th>
                    <th className="p-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-ink-500">
                        No audit records matched your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface/60 transition">
                        <td className="p-3 font-mono text-[11px] text-ink-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3 font-mono font-bold text-primary-700 whitespace-nowrap">
                          {log.issue_ticket_id || 'System'}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-ink-950">{log.actor_name || 'Automated System'}</div>
                          <div className="font-mono text-[10px] text-ink-500 uppercase">{log.role}</div>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-surface border border-line text-ink-950">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-ink-700 max-w-md break-words">
                          {log.remarks || (log.details ? JSON.stringify(log.details) : '—')}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-ink-500 whitespace-nowrap">
                          {log.ip_address || '127.0.0.1'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Edit Modal */}
      {editingCategory && (
        <Modal
          isOpen={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          title={`Configure Routing: ${editingCategory.name}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-surface border border-line rounded-input">
              <span className="font-mono text-xs text-ink-500 uppercase block">Category Code</span>
              <p className="font-bold text-ink-950">{editingCategory.code}</p>
              <p className="text-xs text-ink-500 mt-1">{editingCategory.description}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-700 block mb-1">
                Default Municipal Department:
              </label>
              <select
                value={editDeptId}
                onChange={(e) => setEditDeptId(e.target.value ? Number(e.target.value) : '')}
                className="w-full text-xs p-2.5 bg-card border border-line rounded-input focus:ring-1 focus:ring-primary-600 outline-none"
              >
                <option value="">-- Unassigned --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-700 block mb-1">
                Default Grievance Priority:
              </label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="w-full text-xs p-2.5 bg-card border border-line rounded-input focus:ring-1 focus:ring-primary-600 outline-none"
              >
                <option value="CRITICAL">Critical (4h Response / 12h Resolution)</option>
                <option value="HIGH">High (12h Response / 24h Resolution)</option>
                <option value="MEDIUM">Medium (24h Response / 72h Resolution)</option>
                <option value="LOW">Low (48h Response / 168h Resolution)</option>
              </select>
            </div>

            {categorySaveMsg && (
              <p className={`text-xs font-medium ${categorySaveMsg.includes('success') ? 'text-semantic-success' : 'text-semantic-danger'}`}>
                {categorySaveMsg}
              </p>
            )}

            <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditingCategory(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isSavingCategory}
                onClick={handleSaveCategory}
              >
                Save Routing
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Selected Issue Inspection Modal */}
      {selectedIssue && (
        <Modal
          isOpen={!!selectedIssue}
          onClose={() => setSelectedIssue(null)}
          title={`Grievance Dossier: ${selectedIssue.issue_id}`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-ink-950">
            {/* Status & Priority Ribbon */}
            <div className="p-3.5 bg-surface border border-line rounded-xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={selectedIssue.status as any} />
                <PriorityBadge priority={selectedIssue.priority as any} />
                {selectedIssue.department && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-card border border-line text-ink-800">
                    Dept: {selectedIssue.department.name}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-ink-500">
                Created: {new Date(selectedIssue.created_at).toLocaleString()}
              </span>
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5">
              <h3 className="font-heading font-bold text-base text-ink-950">
                {selectedIssue.title}
              </h3>
              <p className="text-xs text-ink-700 leading-relaxed whitespace-pre-wrap bg-surface/50 p-3 rounded-lg border border-line">
                {selectedIssue.description}
              </p>
            </div>

            {/* Reporter Citizen Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-surface rounded-xl border border-line text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-ink-400 font-bold block">
                  Reporting Citizen
                </span>
                <p className="font-semibold text-ink-950 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary-700" />
                  {selectedIssue.citizen
                    ? `${selectedIssue.citizen.first_name || ''} ${selectedIssue.citizen.last_name || ''}`.trim() || selectedIssue.citizen.username
                    : 'Registered Citizen'}
                </p>
                {selectedIssue.citizen?.email && (
                  <p className="text-ink-500 flex items-center gap-1 font-mono text-[11px]">
                    <Mail className="w-3 h-3" /> {selectedIssue.citizen.email}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-ink-400 font-bold block">
                  Field Location
                </span>
                <p className="font-medium text-ink-950 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{selectedIssue.location?.address_text || 'GPS Coordinates Attached'}</span>
                </p>
                {selectedIssue.location?.ward && (
                  <p className="text-ink-500 text-[11px] font-mono">
                    Ward: {selectedIssue.location.ward}
                  </p>
                )}
              </div>
            </div>

            {/* Attached Photos / Evidence */}
            {selectedIssue.images && selectedIssue.images.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-ink-700 block">
                  Photographic Evidence ({selectedIssue.images.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedIssue.images.map((img: any, idx: number) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-line aspect-video bg-ink-950">
                      <img
                        src={img.image}
                        alt={`Evidence ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions footer */}
            <div className="pt-3 border-t border-line flex items-center justify-between">
              <Link
                to={`/track/${selectedIssue.issue_id}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary-700 hover:underline font-semibold inline-flex items-center gap-1"
              >
                Open in Full Live Tracker <ExternalLink className="w-3 h-3" />
              </Link>
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
