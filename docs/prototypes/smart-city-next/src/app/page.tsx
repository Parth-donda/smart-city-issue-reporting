'use client';

import React, { useState } from 'react';
import { INITIAL_CITY_ISSUES } from '@/lib/mock-data';
import { CityIssue, IssueStatus } from '@/types/city-issue';
import { CitizenReportingView } from '@/components/citizen/CitizenReportingView';
import { AdminDashboardView } from '@/components/admin/AdminDashboardView';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  LayoutDashboard,
  Building2,
} from 'lucide-react';

export default function SmartCityPlatformPage() {
  const [issues, setIssues] = useState<CityIssue[]>(INITIAL_CITY_ISSUES);
  const [selectedIssue, setSelectedIssue] = useState<CityIssue | null>(null);
  const [activeLayer, setActiveLayer] = useState<'citizen' | 'admin'>('citizen');

  // Handle adding new issue from Layer 1
  const handleAddNewIssue = (newIssue: CityIssue) => {
    setIssues((prev) => [newIssue, ...prev]);
  };

  // Handle upvoting from Layer 1
  const handleUpvoteIssue = (issueId: string) => {
    setIssues((prev) =>
      prev.map((item) =>
        item.id === issueId ? { ...item, upvotes: item.upvotes + 1 } : item
      )
    );
  };

  // Handle status transition from Layer 2
  const handleUpdateIssueStatus = (issueId: string, nextStatus: IssueStatus, note?: string) => {
    const nowIso = new Date().toISOString();
    setIssues((prev) =>
      prev.map((item) => {
        if (item.id === issueId) {
          const updatedTimeline = [
            ...item.updatesTimeline,
            {
              id: `t-${Date.now()}`,
              status: nextStatus,
              timestamp: nowIso,
              note: note || `Status transitioned to ${nextStatus}`,
              author: 'Municipal Admin Officer',
            },
          ];
          const updated = {
            ...item,
            status: nextStatus,
            updatesTimeline: updatedTimeline,
          };
          if (selectedIssue?.id === issueId) {
            setSelectedIssue(updated);
          }
          return updated;
        }
        return item;
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Platform Header with Mode / Layer Switcher */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-md shadow-teal-900/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  SmartCivic 360
                </span>
                <Badge variant="default" className="bg-teal-100 text-teal-800 border-teal-200 text-[10px] font-mono">
                  v2.0 NEXT.JS
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 font-mono hidden sm:block">
                Unified Municipal Citizen Grievance & Dispatch Network
              </p>
            </div>
          </div>

          {/* Layer Viewport Toggle Tabs */}
          <div className="flex items-center gap-2">
            <Tabs value={activeLayer} onValueChange={(val) => setActiveLayer(val as 'citizen' | 'admin')}>
              <TabsList className="bg-slate-100/90 border border-slate-200 p-1">
                <TabsTrigger value="citizen" className="flex items-center gap-1.5 py-1.5 px-3">
                  <Smartphone className="w-3.5 h-3.5 text-teal-700" />
                  <span className="hidden sm:inline">Layer 1: Citizen Mobile</span>
                  <span className="sm:hidden">Citizen</span>
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center gap-1.5 py-1.5 px-3">
                  <LayoutDashboard className="w-3.5 h-3.5 text-teal-700" />
                  <span className="hidden sm:inline">Layer 2: Municipal Command</span>
                  <span className="sm:hidden">Admin</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Layer 1: Citizen Reporting Interface */}
        {activeLayer === 'citizen' && (
          <div className="animate-in fade-in-50 duration-200">
            {/* Viewport helper info header */}
            <div className="max-w-md mx-auto mb-3 flex items-center justify-between text-xs text-slate-500 font-mono px-1">
              <span className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-teal-700" /> Mobile-First Viewport (390px)
              </span>
              <span className="text-teal-700 font-semibold">{issues.length} Live Reports</span>
            </div>

            <CitizenReportingView
              issues={issues}
              onUpvoteIssue={handleUpvoteIssue}
              onAddNewIssue={handleAddNewIssue}
              onSelectIssueForDetail={(issue) => {
                setSelectedIssue(issue);
                setActiveLayer('admin');
              }}
            />
          </div>
        )}

        {/* Layer 2: Municipal Admin Dashboard */}
        {activeLayer === 'admin' && (
          <div className="animate-in fade-in-50 duration-200">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-teal-700" />
                  Municipal Dispatch & Operations Command
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full administrative oversight, priority sorting, and real-time field status transitions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-500">
                  Total Synced: <span className="font-bold text-teal-800">{issues.length}</span> tickets
                </span>
              </div>
            </div>

            <AdminDashboardView
              issues={issues}
              onUpdateIssueStatus={handleUpdateIssueStatus}
              selectedIssue={selectedIssue}
              onSelectIssue={setSelectedIssue}
            />
          </div>
        )}
      </main>

      {/* Footer Bar */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 font-mono">
        Smart City Issue Reporting Platform • Built with Next.js (App Router), TypeScript, Tailwind CSS, & shadcn/ui
      </footer>
    </div>
  );
}
