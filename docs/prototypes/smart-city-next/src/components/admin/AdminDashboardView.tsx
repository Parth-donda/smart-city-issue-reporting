'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { CityIssue, IssueStatus, IssueSeverity } from '@/types/city-issue';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  Search,
  MapPin,
  ChevronRight,
  Building2,
  ThumbsUp,
  Wrench,
} from 'lucide-react';

interface AdminDashboardViewProps {
  issues: CityIssue[];
  onUpdateIssueStatus: (issueId: string, nextStatus: IssueStatus, note?: string) => void;
  selectedIssue: CityIssue | null;
  onSelectIssue: (issue: CityIssue | null) => void;
}

type SortField = 'dateSubmitted' | 'severity' | 'upvotes';
type SortOrder = 'asc' | 'desc';

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  issues,
  onUpdateIssueStatus,
  selectedIssue,
  onSelectIssue,
}) => {
  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('dateSubmitted');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Status transition remarks
  const [customNote, setCustomNote] = useState('');

  // 1. CALCULATE KEY ANALYTICS SUMMARY METRICS
  const totalIssues = issues.length;
  const activeIssues = issues.filter((i) => i.status !== 'Resolved').length;
  const resolvedIssues = issues.filter((i) => i.status === 'Resolved').length;
  const criticalIssues = issues.filter((i) => i.severity === 'High' && i.status !== 'Resolved').length;
  const resolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 100;

  // Sorting helper
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const severityWeight: Record<IssueSeverity, number> = {
    High: 3,
    Medium: 2,
    Low: 1,
  };

  // Filtered & Sorted Issue List
  const processedIssues = [...issues]
    .filter((issue) => {
      const matchSearch =
        issue.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.reporterName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || issue.status === statusFilter;
      const matchCategory = categoryFilter === 'ALL' || issue.category === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'dateSubmitted') {
        comparison = new Date(a.dateSubmitted).getTime() - new Date(b.dateSubmitted).getTime();
      } else if (sortField === 'severity') {
        comparison = severityWeight[a.severity] - severityWeight[b.severity];
      } else if (sortField === 'upvotes') {
        comparison = a.upvotes - b.upvotes;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleStatusChange = (nextStatus: IssueStatus) => {
    if (selectedIssue) {
      const note = customNote.trim() || `Status moved to ${nextStatus} by Municipal Officer.`;
      onUpdateIssueStatus(selectedIssue.id, nextStatus, note);
      setCustomNote('');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. ANALYTICS SUMMARY METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Active Issues */}
        <Card className="border-l-4 border-l-teal-700 bg-white shadow-xs">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase font-mono">Active Incidents</span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-3xl font-extrabold text-slate-900 font-mono">{activeIssues}</div>
            <p className="text-xs text-slate-500 mt-1">Pending inspection & work orders</p>
          </CardContent>
        </Card>

        {/* Metric 2: Resolution Rate */}
        <Card className="border-l-4 border-l-emerald-600 bg-white shadow-xs">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase font-mono">Resolution Rate</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-3xl font-extrabold text-emerald-700 font-mono">{resolutionRate}%</div>
            <p className="text-xs text-slate-500 mt-1">{resolvedIssues} of {totalIssues} tickets resolved</p>
          </CardContent>
        </Card>

        {/* Metric 3: Average Response Time */}
        <Card className="border-l-4 border-l-sky-600 bg-white shadow-xs">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase font-mono">Avg Response Time</span>
            <div className="p-2 bg-sky-50 text-sky-700 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-3xl font-extrabold text-slate-900 font-mono">3.8h</div>
            <p className="text-xs text-slate-500 mt-1">Triage to field worker dispatch</p>
          </CardContent>
        </Card>

        {/* Metric 4: Critical Emergencies */}
        <Card className="border-l-4 border-l-rose-600 bg-white shadow-xs">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase font-mono">Critical High Risk</span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-3xl font-extrabold text-rose-700 font-mono">{criticalIssues}</div>
            <p className="text-xs text-slate-500 mt-1">Requiring immediate emergency crew</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. ADVANCED TICKET QUEUE TABLE */}
      <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-700" /> Master Municipal Ticket Queue
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Operational intake table with real-time field status and citizen upvote counts
            </CardDescription>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                placeholder="Search ticket ID or text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 text-xs w-32"
            >
              <option value="ALL">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </Select>

            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 text-xs w-36"
            >
              <option value="ALL">All Categories</option>
              <option value="Pothole">Pothole</option>
              <option value="Broken Streetlight">Streetlight</option>
              <option value="Water Leak">Water Leak</option>
              <option value="Trash Accumulation">Trash</option>
              <option value="Traffic Signal">Traffic Signal</option>
              <option value="Tree Hazard">Tree Hazard</option>
            </Select>
          </div>
        </CardHeader>

        {/* Master Data Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[11px] uppercase">
              <TableRow>
                <TableHead className="w-[120px]">Ticket ID</TableHead>
                <TableHead className="min-w-[220px]">Issue & Category</TableHead>
                <TableHead
                  onClick={() => handleSort('severity')}
                  className="cursor-pointer hover:text-teal-800 transition select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Severity</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="min-w-[200px]">Location / Address</TableHead>
                <TableHead
                  onClick={() => handleSort('upvotes')}
                  className="cursor-pointer hover:text-teal-800 transition select-none text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Upvotes</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('dateSubmitted')}
                  className="cursor-pointer hover:text-teal-800 transition select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Date Filed</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {processedIssues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                    No tickets found matching your filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                processedIssues.map((issue) => (
                  <TableRow
                    key={issue.id}
                    onClick={() => onSelectIssue(issue)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Ticket ID */}
                    <TableCell className="font-mono font-bold text-teal-800">
                      {issue.id}
                    </TableCell>

                    {/* Issue Title & Category */}
                    <TableCell>
                      <div className="font-semibold text-slate-900 group-hover:text-teal-800 transition">
                        {issue.title}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {issue.category}
                      </span>
                    </TableCell>

                    {/* Severity Badge */}
                    <TableCell>
                      <Badge
                        variant={
                          issue.severity === 'High'
                            ? 'destructive'
                            : issue.severity === 'Medium'
                            ? 'warning'
                            : 'secondary'
                        }
                        className="text-[10px]"
                      >
                        {issue.severity}
                      </Badge>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <Badge
                        variant={
                          issue.status === 'Resolved'
                            ? 'success'
                            : issue.status === 'In Progress'
                            ? 'info'
                            : 'warning'
                        }
                        className="text-[10px]"
                      >
                        {issue.status}
                      </Badge>
                    </TableCell>

                    {/* Address / Location */}
                    <TableCell className="max-w-[200px]">
                      <span className="truncate block text-slate-700">{issue.address}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {issue.coordinates.lat}, {issue.coordinates.lng}
                      </span>
                    </TableCell>

                    {/* Upvotes */}
                    <TableCell className="text-center font-mono font-bold text-slate-700">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                        <ThumbsUp className="w-3 h-3 text-teal-700" /> {issue.upvotes}
                      </span>
                    </TableCell>

                    {/* Date Submitted */}
                    <TableCell className="font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(issue.dateSubmitted).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>

                    {/* Action button */}
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-800" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* 3. INTERACTIVE TICKET DETAIL SHEET (Side Drawer) */}
      <Sheet open={!!selectedIssue} onOpenChange={(open) => !open && onSelectIssue(null)}>
        {selectedIssue && (
          <SheetContent onClose={() => onSelectIssue(null)}>
            <SheetHeader>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                  {selectedIssue.id}
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={
                      selectedIssue.status === 'Resolved'
                        ? 'success'
                        : selectedIssue.status === 'In Progress'
                        ? 'info'
                        : 'warning'
                    }
                  >
                    {selectedIssue.status}
                  </Badge>
                  <Badge
                    variant={
                      selectedIssue.severity === 'High'
                        ? 'destructive'
                        : selectedIssue.severity === 'Medium'
                        ? 'warning'
                        : 'secondary'
                    }
                  >
                    {selectedIssue.severity} Priority
                  </Badge>
                </div>
              </div>

              <SheetTitle className="text-lg font-bold text-slate-900 mt-2">
                {selectedIssue.title}
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-500">
                Filed by {selectedIssue.reporterName} on{' '}
                {new Date(selectedIssue.dateSubmitted).toLocaleString()}
              </SheetDescription>
            </SheetHeader>

            {/* Actionable Status Transition Bar */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Operational Dispatch Status:</span>
                {/* Actionable Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="default" size="sm" className="bg-teal-700 hover:bg-teal-800 text-xs gap-1">
                      <Wrench className="w-3.5 h-3.5" /> Change Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onSelect={() => handleStatusChange('Open')}
                      disabled={selectedIssue.status === 'Open'}
                    >
                      🟡 Mark as Open (Triage Queue)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handleStatusChange('In Progress')}
                      disabled={selectedIssue.status === 'In Progress'}
                    >
                      🔵 Dispatch Crew (In Progress)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handleStatusChange('Resolved')}
                      disabled={selectedIssue.status === 'Resolved'}
                    >
                      🟢 Mark as Resolved & Verified
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Input
                placeholder="Optional dispatch notes (e.g., Crew #4 assigned)..."
                className="h-8 text-xs bg-white"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
              />
            </div>

            {/* Photo Evidence Card */}
            {selectedIssue.imageUrl && (
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase font-mono block mb-1.5">
                  Attached Photographic Evidence
                </span>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video shadow-xs">
                  <img
                    src={selectedIssue.imageUrl}
                    alt={selectedIssue.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Description Card */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-700 uppercase font-mono block">
                Issue Description
              </span>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {selectedIssue.description}
              </p>
            </div>

            {/* Location & Map Coordinates Card */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 uppercase font-mono block">
                GPS Location & Address
              </span>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">{selectedIssue.address}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Coordinates: {selectedIssue.coordinates.lat}, {selectedIssue.coordinates.lng}
                    </p>
                  </div>
                </div>

                {/* Mini Visual Map Preview Placeholder */}
                <div className="h-28 rounded-lg border border-slate-200 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px] opacity-60" />
                  <div className="relative z-10 flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-full border border-teal-500/40 text-teal-300 font-mono text-[10px]">
                    <MapPin className="w-3.5 h-3.5 text-teal-400" />
                    <span>Lat: {selectedIssue.coordinates.lat} | Lng: {selectedIssue.coordinates.lng}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Lifecycle Timeline Component */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase font-mono block">
                Ticket Audit & Lifecycle Timeline
              </span>

              <div className="relative pl-6 border-l-2 border-teal-600/30 space-y-4 text-xs">
                {selectedIssue.updatesTimeline.map((item) => (
                  <div key={item.id} className="relative">
                    <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-teal-700 border-2 border-white ring-2 ring-teal-100" />
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">
                          {item.status}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{item.note}</p>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        By {item.author}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
};
