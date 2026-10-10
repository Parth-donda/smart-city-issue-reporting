'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CityIssue } from '@/types/city-issue';
import { ReportIssueWizard } from './ReportIssueWizard';
import {
  Plus,
  Search,
  ThumbsUp,
  MapPin,
  Clock,
  Building2,
  AlertCircle,
} from 'lucide-react';

interface CitizenReportingViewProps {
  issues: CityIssue[];
  onUpvoteIssue: (issueId: string) => void;
  onAddNewIssue: (issue: CityIssue) => void;
  onSelectIssueForDetail: (issue: CityIssue) => void;
}

const CATEGORY_FILTERS: { label: string; value: string }[] = [
  { label: 'All Categories', value: 'ALL' },
  { label: '🚧 Potholes', value: 'Pothole' },
  { label: '💡 Streetlights', value: 'Broken Streetlight' },
  { label: '💧 Water Leaks', value: 'Water Leak' },
  { label: '🗑️ Trash Dumps', value: 'Trash Accumulation' },
  { label: '🚦 Traffic Signals', value: 'Traffic Signal' },
  { label: '🌳 Tree Hazards', value: 'Tree Hazard' },
];

export const CitizenReportingView: React.FC<CitizenReportingViewProps> = ({
  issues,
  onUpvoteIssue,
  onAddNewIssue,
  onSelectIssueForDetail,
}) => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());

  const handleUpvote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!upvotedIds.has(id)) {
      setUpvotedIds((prev) => new Set(prev).add(id));
      onUpvoteIssue(id);
    }
  };

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategoryFilter === 'ALL' || issue.category === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-md mx-auto space-y-5 pb-16">
      {/* 1. HERO HEADER: Greeting Card Identifying City */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-teal-950 to-teal-900 p-6 text-white shadow-xl border border-teal-800/40">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Metro City Connect
            </span>
            <span className="text-[11px] text-teal-300/80 font-mono">Public Portal</span>
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Civic Issue Dispatch
            </h1>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Help keep our neighborhoods clean and safe. Report street defects, lighting hazards, and pipeline leaks with instant GPS tracking.
            </p>
          </div>

          <Button
            variant="default"
            size="lg"
            onClick={() => setIsWizardOpen(true)}
            className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-lg shadow-teal-950/40 transition-transform active:scale-98 cursor-pointer"
          >
            <Plus className="w-5 h-5 mr-1.5" /> Report an Issue Now
          </Button>
        </div>
      </div>

      {/* 2. SEARCH & CATEGORY FILTER BAR */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <Input
            placeholder="Search by ticket ID, street, or defect..."
            className="pl-9 pr-4 py-2 bg-white text-xs border-slate-200 shadow-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Scrollable Category Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategoryFilter(cat.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer border ${
                selectedCategoryFilter === cat.value
                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. ACTIVE ISSUE FEED */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span>Active Neighborhood Feed ({filteredIssues.length})</span>
          <span className="font-mono text-[11px]">Live Updates</span>
        </div>

        {filteredIssues.length === 0 ? (
          <Card className="text-center py-10 p-6 border-dashed border-slate-300">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No issues found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or category filter.</p>
          </Card>
        ) : (
          filteredIssues.map((issue) => {
            const hasUpvoted = upvotedIds.has(issue.id);

            return (
              <Card
                key={issue.id}
                onClick={() => onSelectIssueForDetail(issue)}
                className="hover:border-teal-600/60 transition-all shadow-xs hover:shadow-md cursor-pointer overflow-hidden border-slate-200 bg-white group"
              >
                {/* Photo thumbnail banner if available */}
                {issue.imageUrl && (
                  <div className="h-32 w-full overflow-hidden bg-slate-100 relative">
                    <img
                      src={issue.imageUrl}
                      alt={issue.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                      <Badge variant="default" className="bg-slate-950/80 backdrop-blur-xs text-white font-mono text-[10px]">
                        {issue.category}
                      </Badge>
                    </div>
                  </div>
                )}

                <CardHeader className="p-4 pb-2 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-teal-800">
                      {issue.id}
                    </span>
                    <div className="flex items-center gap-1.5">
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
                    </div>
                  </div>

                  <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition-colors line-clamp-1">
                    {issue.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="px-4 py-1 text-xs text-slate-600 space-y-2">
                  <p className="line-clamp-2 leading-relaxed text-slate-600">
                    {issue.description}
                  </p>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span className="truncate">{issue.address}</span>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-mono text-[10px]">
                    <Clock className="w-3 h-3" />
                    {new Date(issue.dateSubmitted).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>

                  {/* Upvote Button with Reactive Counter */}
                  <Button
                    type="button"
                    variant={hasUpvoted ? 'default' : 'outline'}
                    size="sm"
                    onClick={(e) => handleUpvote(e, issue.id)}
                    className={`h-7 px-2.5 text-xs font-semibold gap-1.5 ${
                      hasUpvoted ? 'bg-teal-700 text-white' : 'hover:bg-teal-50 hover:text-teal-800'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{issue.upvotes}</span>
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      {/* Multi-step reporting dialog wizard */}
      <ReportIssueWizard
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onSubmitIssue={onAddNewIssue}
      />
    </div>
  );
};
