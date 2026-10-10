import React, { useState } from 'react';
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Inbox,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import {
  StatusBadge,
  PriorityBadge,
  ConfidenceBadge,
  STATUS_MAP,
  PRIORITY_MAP,
} from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';
import { Toast, ToastType } from '../components/ui/Toast';
import { Tabs } from '../components/ui/Tabs';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { HorizontalStepper, VerticalTimeline } from '../components/ui/Stepper';
import { MapPickerPlaceholder } from '../components/ui/MapPickerPlaceholder';
import { IssueStatus, IssuePriority } from '../types/design-system';

export const DesignSystemPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [stepperStep, setStepperStep] = useState(1);
  const [toasts, setToasts] = useState<Array<{ id: string; type: ToastType; title: string; message: string }>>([
    { id: '1', type: 'success', title: 'Work Verified', message: 'Supervisor approved completion evidence for SC-2026-00042.' },
    { id: '2', type: 'warning', title: 'SLA Approaching', message: 'Issue SC-2026-00089 reaches high priority deadline in 2 hours.' },
  ]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const allStatuses: IssueStatus[] = Object.keys(STATUS_MAP) as IssueStatus[];
  const allPriorities: IssuePriority[] = Object.keys(PRIORITY_MAP) as IssuePriority[];

  const timelineItems = [
    { id: 1, title: 'Issue Submitted', timestamp: '2026-10-05 09:15', description: 'Citizen uploaded 2 photos with GPS coordinates.' },
    { id: 2, title: 'Under Review', timestamp: '2026-10-05 09:30', description: 'Roads & Infrastructure officer opened report.' },
    { id: 3, title: 'Accepted & Assigned', timestamp: '2026-10-05 10:00', description: 'Assigned to field worker Rajesh Kumar.' },
    { id: 4, title: 'Work Started', timestamp: '2026-10-05 11:20', description: 'Worker arrived on site.' },
  ];

  return (
    <div className="space-y-12">
      {/* Page Title & Spec Header */}
      <div className="border-b border-line pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs px-2.5 py-1 bg-primary-100 text-primary-700 rounded-badge font-semibold">
            PHASE 0 SYSTEM AUDIT
          </span>
          <span className="text-xs text-ink-500">WCAG AA Compliant • Government-Grade Civic Design System</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-ink-950 mt-2">
          Design System & Component Catalog
        </h1>
        <p className="text-sm text-ink-500 mt-2 max-w-3xl">
          Comprehensive inventory of strict tokens, typography hierarchy, states, and components for SmartCivic.
          No forbidden fonts, colors, gradients, emojis, or neon styling.
        </p>
      </div>

      {/* Allowed Gradients & Hero Showcase */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-semibold text-ink-950 flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary-700" />
          Only Two Allowed Gradients
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-card bg-hero-gradient text-card shadow-soft">
            <span className="text-xs font-mono uppercase tracking-wider text-primary-100">Gradient 1 / 2</span>
            <h3 className="text-lg font-heading font-semibold text-card mt-1">hero-gradient</h3>
            <p className="text-xs text-primary-100/90 mt-1">
              linear-gradient(135deg, #0A1A2A 0%, #0B3B45 55%, #0B5F63 100%)
            </p>
            <p className="text-xs text-white/80 mt-3 border-t border-white/20 pt-3">
              Used strictly on the landing hero and login/register side panels.
            </p>
          </div>

          <div className="p-6 rounded-card bg-card border border-line shadow-soft">
            <span className="text-xs font-mono uppercase tracking-wider text-ink-500">Gradient 2 / 2</span>
            <h3 className="text-lg font-heading font-semibold text-ink-950 mt-1">data-fade</h3>
            <p className="text-xs text-ink-500 mt-1">
              linear-gradient(180deg, rgba(14,115,120,0.18) 0%, rgba(14,115,120,0) 100%)
            </p>
            <div className="w-full h-14 mt-3 rounded-input bg-data-fade border border-line/50 flex items-center justify-center text-xs font-mono text-primary-700 font-medium">
              Area Chart Fill Canvas Preview
            </div>
          </div>
        </div>
      </section>

      {/* Typography Hierarchy */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-semibold text-ink-950">Typography Scale & Strict Font Hierarchy</h2>
        <Card>
          <CardContent className="space-y-6">
            <div className="border-b border-line pb-4">
              <span className="text-xs font-mono text-ink-500">Display / Headings: &quot;Bricolage Grotesque&quot; (600, 700)</span>
              <div className="space-y-2 mt-2">
                <p className="text-3xl font-heading font-bold text-ink-950">40px / 30px: Pothole & Road Hazard Management</p>
                <p className="text-2xl font-heading font-semibold text-ink-950">24px: Ward 14 Sanitation Inspection Protocol</p>
                <p className="text-xl font-heading font-semibold text-ink-950">20px: Supervisor Verification Queue</p>
              </div>
            </div>

            <div className="border-b border-line pb-4">
              <span className="text-xs font-mono text-ink-500">Body & UI: &quot;IBM Plex Sans&quot; (400, 500, 600)</span>
              <div className="space-y-2 mt-2">
                <p className="text-base text-ink-950">
                  Base 16px (1.5 line height): Physical evidence must be submitted with valid GPS coordinates. Officers inspect imagery before assigning municipal work orders.
                </p>
                <p className="text-sm text-ink-700">
                  Small 14px: Secondary descriptions, field hints, and table cell records across department screens.
                </p>
                <p className="text-xs text-ink-500">
                  Caption 12px: Supporting audit metadata, field labels, and secondary timestamps.
                </p>
              </div>
            </div>

            <div>
              <span className="text-xs font-mono text-ink-500">Mono: &quot;IBM Plex Mono&quot; (500)</span>
              <div className="flex flex-wrap gap-4 mt-2">
                <span className="font-mono text-sm px-2.5 py-1 bg-surface border border-line rounded-input text-ink-950">
                  SC-2026-00125
                </span>
                <span className="font-mono text-sm px-2.5 py-1 bg-surface border border-line rounded-input text-ink-950">
                  18.52043° N, 73.85674° E
                </span>
                <span className="font-mono text-sm px-2.5 py-1 bg-surface border border-line rounded-input text-ink-950">
                  sha256: 7f83b1657ff1...
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <span className="text-xs text-ink-500">Government Typography Scale Preview</span>
            <span className="font-mono text-xs text-primary-700 font-medium">Bricolage / Plex Sans / Plex Mono</span>
          </CardFooter>
        </Card>
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-semibold text-ink-950">Buttons & Action States</h2>
        <Card>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-xs font-mono text-ink-500 mb-3">Variants</h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                  Primary Button
                </Button>
                <Button variant="secondary" leftIcon={<Search className="w-4 h-4" />}>
                  Secondary Button
                </Button>
                <Button variant="ghost">
                  Ghost Button
                </Button>
                <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />}>
                  Danger Button
                </Button>
              </div>
            </div>

            <div className="border-t border-line pt-4">
              <h4 className="text-xs font-mono text-ink-500 mb-3">Sizes (sm, md, lg)</h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="primary">Small (32px)</Button>
                <Button size="md" variant="primary">Medium (40px)</Button>
                <Button size="lg" variant="primary">Large (48px)</Button>
              </div>
            </div>

            <div className="border-t border-line pt-4">
              <h4 className="text-xs font-mono text-ink-500 mb-3">States (Loading & Disabled)</h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" isLoading>Submitting...</Button>
                <Button variant="secondary" disabled>Disabled Action</Button>
                <Button variant="danger" disabled>Disabled Danger</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Status Badges Matrix */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-heading font-semibold text-ink-950">
            Lifecycle Status Badges (13 States — Icon + Color + Text)
          </h2>
          <span className="text-xs text-ink-500">Single Source of Truth</span>
        </div>
        <Card>
          <CardContent>
            <div className="flex flex-wrap gap-2.5">
              {allStatuses.map((st) => (
                <StatusBadge key={st} status={st} />
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Priority & Confidence Badges */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-semibold text-ink-950">
          Priority & Evidence Confidence Badges
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Priority Levels</CardTitle>
              <CardDescription>Configurable SLAs attached to each priority level.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {allPriorities.map((p) => (
                  <PriorityBadge key={p} priority={p} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evidence Confidence Bands</CardTitle>
              <CardDescription>
                AI & sensor verification indicators (never labeled &apos;real&apos; or &apos;fake&apos;).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2.5">
                <ConfidenceBadge score={94} />
                <ConfidenceBadge score={76} />
                <ConfidenceBadge score={54} />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Form Controls */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-semibold text-ink-950">Form Inputs & Controls</h2>
        <Card>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Citizen Full Name"
              placeholder="e.g. Ramesh Patel"
              required
              helperText="Government issued name for verification"
            />
            <Input
              label="Tracking Number Search"
              placeholder="SC-2026-..."
              leftIcon={<Search className="w-4 h-4" />}
            />
            <Input
              label="Field with Validation Error"
              defaultValue="invalid-format"
              error="Valid email or phone number is required"
            />
            <Select
              label="Municipal Department"
              options={[
                { value: 'roads', label: 'Roads & Infrastructure' },
                { value: 'electrical', label: 'Electrical & Street Lighting' },
                { value: 'water', label: 'Water Supply & Sewerage' },
                { value: 'sanitation', label: 'Solid Waste & Sanitation' },
              ]}
            />
            <div className="md:col-span-2">
              <Textarea
                label="Physical Issue Description"
                placeholder="Describe the issue, landmarks, and severity..."
                rows={3}
                helperText="Provide specific details to help workers locate the problem."
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Table Component */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-semibold text-ink-950">Table & Issue Records</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue ID</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-mono font-medium text-ink-950">SC-2026-00012</TableCell>
              <TableCell>Deep Pothole on Junction</TableCell>
              <TableCell>Roads & Infrastructure</TableCell>
              <TableCell><PriorityBadge priority="HIGH" size="sm" /></TableCell>
              <TableCell><StatusBadge status="IN_PROGRESS" size="sm" /></TableCell>
              <TableCell>
                <Button size="sm" variant="secondary" onClick={() => setIsDrawerOpen(true)}>
                  Inspect
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono font-medium text-ink-950">SC-2026-00018</TableCell>
              <TableCell>Flickering High-Mast Light</TableCell>
              <TableCell>Electrical & Street Lighting</TableCell>
              <TableCell><PriorityBadge priority="MEDIUM" size="sm" /></TableCell>
              <TableCell><StatusBadge status="ACCEPTED" size="sm" /></TableCell>
              <TableCell>
                <Button size="sm" variant="secondary" onClick={() => setIsDrawerOpen(true)}>
                  Inspect
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono font-medium text-ink-950">SC-2026-00025</TableCell>
              <TableCell>Main Pipe Burst</TableCell>
              <TableCell>Water Supply</TableCell>
              <TableCell><PriorityBadge priority="CRITICAL" size="sm" /></TableCell>
              <TableCell><StatusBadge status="ON_THE_WAY" size="sm" /></TableCell>
              <TableCell>
                <Button size="sm" variant="secondary" onClick={() => setIsDrawerOpen(true)}>
                  Inspect
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      {/* Steppers & Timeline */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-semibold text-ink-950">
          Steppers & Issue Audit Timeline
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Citizen Reporting Multi-Step Flow</CardTitle>
              <CardDescription>Clickable horizontal stepper</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <HorizontalStepper
                currentStep={stepperStep}
                onStepClick={(step) => setStepperStep(step)}
                steps={[
                  { id: 'cat', title: 'Category' },
                  { id: 'media', title: 'Photos' },
                  { id: 'loc', title: 'Location' },
                  { id: 'desc', title: 'Details' },
                  { id: 'submit', title: 'Review' },
                ]}
              />
              <div className="p-4 bg-surface rounded-input border border-line text-xs text-ink-700 flex justify-between items-center">
                <span>Active Step: <strong>Step {stepperStep + 1}</strong></span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={stepperStep === 0}
                    onClick={() => setStepperStep(Math.max(0, stepperStep - 1))}
                  >
                    Back
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={stepperStep === 4}
                    onClick={() => setStepperStep(Math.min(4, stepperStep + 1))}
                  >
                    Next Step
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Issue Lifecycle Timeline</CardTitle>
              <CardDescription>Immutable record of status transitions and timestamps</CardDescription>
            </CardHeader>
            <CardContent>
              <VerticalTimeline items={timelineItems} />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Map Picker Placeholder */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-semibold text-ink-950">Location Picker (OpenStreetMap)</h2>
        <MapPickerPlaceholder />
      </section>

      {/* Tabs & Toasts & EmptyState */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-semibold text-ink-950">
          Tabs, Toasts & Empty State
        </h2>
        <Card>
          <CardContent className="space-y-6">
            <Tabs
              activeTab={activeTab}
              onChange={setActiveTab}
              tabs={[
                { id: 'all', label: 'All Issues', count: 48 },
                { id: 'under-review', label: 'Under Review', count: 12 },
                { id: 'in-progress', label: 'In Progress', count: 19 },
                { id: 'resolved', label: 'Resolved', count: 17 },
              ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-ink-500">Live Toasts</h4>
                {toasts.map((t) => (
                  <Toast key={t.id} {...t} onDismiss={dismissToast} />
                ))}
              </div>

              <div>
                <h4 className="text-xs font-mono text-ink-500 mb-3">Empty State</h4>
                <EmptyState
                  icon={<Inbox className="w-6 h-6" />}
                  title="No Pending Work Orders"
                  description="All submitted issues for this zone have been assigned or resolved."
                  actionLabel="Refresh Queue"
                  onAction={() => alert('Queue refreshed')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Skeletons */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-semibold text-ink-950">Skeleton Loading States</h2>
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="space-y-2 flex-1">
                <Skeleton variant="text" width="40%" height={16} />
                <Skeleton variant="text" width="20%" height={12} />
              </div>
            </div>
            <Skeleton variant="rectangular" height={80} className="w-full" />
          </CardContent>
        </Card>
      </section>

      {/* Dialog Triggers for Modal and Drawer */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-semibold text-ink-950">Modals & Drawers</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
            Open Confirmation Modal
          </Button>
          <Button variant="primary" onClick={() => setIsDrawerOpen(true)}>
            Open Issue Detail Drawer
          </Button>
        </div>
      </section>

      {/* Modal Instance */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Work Order Rejection"
        description="Rejecting an issue requires selecting an auditable reason."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => setIsModalOpen(false)}>
              Reject Issue
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-ink-700">
          <p>Please select the reason for rejecting report <strong>SC-2026-00012</strong>:</p>
          <Select
            label="Rejection Reason"
            options={[
              { value: 'duplicate', label: 'Duplicate report already logged' },
              { value: 'outside_scope', label: 'Outside municipal jurisdiction' },
              { value: 'insufficient_evidence', label: 'Insufficient photographic evidence' },
              { value: 'inspection_negative', label: 'Issue not found after physical inspection' },
            ]}
          />
        </div>
      </Modal>

      {/* Drawer Instance */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Issue SC-2026-00012"
        description="Roads & Infrastructure • Reported 3 hours ago"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              leftIcon={<CheckCircle className="w-4 h-4" />}
              onClick={() => setIsDrawerOpen(false)}
            >
              Accept & Route
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <StatusBadge status="UNDER_REVIEW" />
            <PriorityBadge priority="HIGH" />
            <ConfidenceBadge score={92} />
          </div>

          <div className="p-3 bg-surface border border-line rounded-input space-y-1">
            <span className="text-xs font-mono text-ink-500">Location</span>
            <p className="text-xs font-semibold text-ink-950">Shivaji Nagar, Near Simla Office Bus Stop</p>
            <p className="text-[11px] font-mono text-ink-500">18.52043° N, 73.85674° E</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-ink-500">Physical Evidence</h4>
            <div className="h-44 bg-surface border border-line rounded-input flex items-center justify-center text-ink-500 text-xs">
              <FileText className="w-5 h-5 mr-2 text-ink-300" />
              Evidence photo preview with EXIF metadata
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-ink-500">Description</h4>
            <p className="text-xs text-ink-700 leading-relaxed bg-surface p-3 rounded-input border border-line">
              Deep pothole approximately 1.5 meters wide in the center lane of the road. Multiple two-wheelers slipping during morning transit. Urgent repair required.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-ink-500">Audit Progression</h4>
            <VerticalTimeline items={timelineItems.slice(0, 2)} />
          </div>
        </div>
      </Drawer>
    </div>
  );
};

