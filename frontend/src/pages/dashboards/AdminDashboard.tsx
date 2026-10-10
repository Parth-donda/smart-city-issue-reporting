import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { PriorityBadge } from '../../components/ui/Badge';
import { api } from '../../services/api';
import { IssueCategory } from '../../types/issues';
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
  BarChart3
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

type AdminTab = 'ANALYTICS' | 'ROUTING' | 'SLA_CONFIG' | 'AUDIT_LOGS';

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

  const [activeTab, setActiveTab] = useState<AdminTab>('ANALYTICS');
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [categories, setCategories] = useState<IssueCategory[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [slaConfigs, setSlaConfigs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Category Edit State
  const [editingCategory, setEditingCategory] = useState<IssueCategory | null>(null);
  const [editDeptId, setEditDeptId] = useState<number | ''>('');
  const [editPriority, setEditPriority] = useState<string>('MEDIUM');
  const [isSavingCategory, setIsSavingCategory] = useState<boolean>(false);
  const [categorySaveMsg, setCategorySaveMsg] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [overviewData, catData, deptData, slaData, auditData] = await Promise.all([
        api.getAdminOverview(),
        api.getCategories(),
        api.getDepartments(),
        api.getSlaConfigs(),
        api.getAuditLogs(),
      ]);

      setOverview(overviewData);
      setCategories(catData);
      setDepartments(deptData);
      setSlaConfigs(slaData);
      setAuditLogs(auditData);
    } catch (err) {
      console.error('Failed to load admin overview data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

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
                <div className="h-64 w-full">
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
                <div className="h-64 w-full">
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
    </div>
  );
};
