import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { SlaTimer } from '../../components/ui/SlaTimer';
import { api } from '../../services/api';
import { Issue } from '../../types/issues';
import {
  Wrench,
  Navigation,
  MapPin,
  CheckCircle2,
  Camera,
  Play,
  Check,
  AlertCircle,
  RefreshCw,
  Inbox
} from 'lucide-react';

export const WorkerDashboard: React.FC = () => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Issue[]>([]);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED'>(() => {
    return searchParams.get('tab') === 'completed' ? 'COMPLETED' : 'ACTIVE';
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'completed') setActiveTab('COMPLETED');
    else if (tab === 'active') setActiveTab('ACTIVE');
  }, [searchParams]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Issue | null>(null);

  // Completion Form Modal state
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [workDescription, setWorkDescription] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await api.getIssues();
      const list = Array.isArray(res) ? res : res.results || [];
      setTasks(list);
    } catch (err) {
      console.error('Failed to load worker tasks', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const activeTasks = tasks.filter(t => ['ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'WORK_STARTED', 'IN_PROGRESS'].includes(t.status));
  const completedTasks = tasks.filter(t => ['DONE', 'VERIFIED', 'CLOSED'].includes(t.status));

  const displayTasks = activeTab === 'ACTIVE' ? activeTasks : completedTasks;

  // Worker progress transition handler
  const handleTransition = async (issueId: string, nextStatus: string) => {
    setIsSubmitting(true);
    try {
      let lat: number | undefined;
      let lng: number | undefined;

      // Geotag if marking arrived
      if (nextStatus === 'ARRIVED' && navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { timeout: 5000 }
          );
        });
      }

      const updated = await api.workerTransition(issueId, {
        to_status: nextStatus,
        latitude: lat,
        longitude: lng,
      });

      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      if (selectedTask?.id === updated.id) {
        setSelectedTask(updated);
      }
    } catch (err) {
      console.error('Failed to transition status', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAfterImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAfterImage(file);
      setAfterPreview(URL.createObjectURL(file));
    }
  };

  const handleBeforeImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBeforeImage(file);
      setBeforePreview(URL.createObjectURL(file));
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !afterImage) {
      setCompleteError('After-repair photo evidence is mandatory.');
      return;
    }
    if (!workDescription.trim()) {
      setCompleteError('Work description is mandatory.');
      return;
    }

    setIsSubmitting(true);
    setCompleteError(null);

    const formData = new FormData();
    formData.append('after_image', afterImage);
    if (beforeImage) {
      formData.append('before_image', beforeImage);
    }
    formData.append('description', workDescription);
    formData.append('materials_used', materialsUsed);

    try {
      const updated = await api.completeWork(selectedTask.issue_id, formData);
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      setIsCompleteModalOpen(false);
      setSelectedTask(null);
      setAfterImage(null);
      setAfterPreview(null);
      setBeforeImage(null);
      setBeforePreview(null);
      setWorkDescription('');
      setMaterialsUsed('');
    } catch (err: any) {
      setCompleteError(err.detail || err.error || 'Failed to submit completion evidence.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Worker Profile Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-primary-700 shadow-xs shrink-0">
              <Wrench className="w-6 h-6 text-primary-700" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 bg-teal-100/80 text-teal-800 rounded-md font-semibold border border-teal-200/60">
                  FIELD TECHNICIAN
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Dept: {user?.worker_profile?.department_name || user?.department_name || 'Roads & Infrastructure'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 mt-1">
                {user?.first_name || user?.username} {user?.last_name || ''}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Skills: {user?.worker_profile?.skills || 'General civic field operations & repairs'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchTasks}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-xs font-medium"
              leftIcon={<RefreshCw className="w-3.5 h-3.5 text-slate-500" />}
            >
              Refresh Tasks
            </Button>
          </div>
        </div>
      </div>

      {/* Task Tabs & Counts */}
      <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 rounded-button text-xs font-semibold transition-colors ${
              activeTab === 'ACTIVE'
                ? 'bg-primary-700 text-card shadow-xs'
                : 'bg-card text-ink-700 hover:bg-surface border border-line'
            }`}
          >
            Active Work Orders ({activeTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-4 py-2 rounded-button text-xs font-semibold transition-colors ${
              activeTab === 'COMPLETED'
                ? 'bg-primary-700 text-card shadow-xs'
                : 'bg-card text-ink-700 hover:bg-surface border border-line'
            }`}
          >
            Completed Proofs ({completedTasks.length})
          </button>
        </div>
      </div>

      {/* Task Cards List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(n => (
            <Card key={n} className="p-4 animate-pulse space-y-3">
              <div className="h-4 bg-line rounded w-1/4" />
              <div className="h-5 bg-line rounded w-3/4" />
              <div className="h-20 bg-line rounded" />
            </Card>
          ))}
        </div>
      ) : displayTasks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="max-w-sm mx-auto space-y-2">
              <Inbox className="w-10 h-10 text-ink-300 mx-auto" />
              <h3 className="font-heading font-semibold text-base text-ink-950">
                {activeTab === 'ACTIVE' ? 'No active tasks assigned' : 'No completed tasks yet'}
              </h3>
              <p className="text-xs text-ink-500">
                {activeTab === 'ACTIVE'
                  ? 'When department officers assign work orders to you, they will appear here.'
                  : 'Completed jobs awaiting supervisor sign-off or closed will appear here.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayTasks.map((task) => {
            const primaryImg = task.primary_image?.image || (task.images && task.images[0]?.image);
            const navUrl = task.location
              ? `https://www.google.com/maps/dir/?api=1&destination=${task.location.latitude},${task.location.longitude}`
              : null;

            return (
              <Card key={task.id} className="border border-line hover:border-primary-600/40 transition-colors shadow-soft">
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-primary-700 bg-primary-100 px-2.5 py-0.5 rounded-badge">
                      {task.issue_id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={task.priority as any} size="sm" />
                      <SlaTimer deadline={task.sla_deadline} status={task.status} compact />
                    </div>
                  </div>
                  <CardTitle className="text-base sm:text-lg mt-1">{task.title}</CardTitle>
                  <CardDescription className="text-xs">{task.category?.name || 'Municipal Grievance'}</CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-0 space-y-4">
                  {/* Photo & Address info */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {primaryImg && (
                      <div className="sm:w-36 h-28 shrink-0 rounded-input overflow-hidden border border-line bg-surface">
                        <img src={primaryImg} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-2 text-xs">
                      <p className="text-ink-700 leading-relaxed line-clamp-2 bg-surface p-2.5 rounded-input border border-line">
                        {task.description}
                      </p>
                      {task.location && (
                        <div className="flex items-start gap-1.5 text-ink-700">
                          <MapPin className="w-3.5 h-3.5 text-primary-600 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-medium">{task.location.address_text}</span>
                            <span className="font-mono text-[11px] text-ink-500 block">
                              Ward: {task.location.ward || 'Central'} | GPS: ({task.location.latitude}, {task.location.longitude})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Banner */}
                  <div className="flex items-center justify-between p-3 bg-surface border border-line rounded-input text-xs">
                    <span className="font-medium text-ink-500">Current Task State:</span>
                    <StatusBadge status={task.status as any} />
                  </div>

                  {/* Operational Action Controls (Sequential) */}
                  <div className="pt-2 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3">
                    {navUrl && (
                      <a
                        href={navUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary-700 bg-primary-100 hover:bg-primary-100/80 rounded-button transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Navigate with GPS
                      </a>
                    )}

                    <div className="w-full sm:w-auto flex items-center gap-2">
                      {task.status === 'ASSIGNED' && (
                        <Button
                          variant="primary"
                          className="w-full sm:w-auto"
                          disabled={isSubmitting}
                          onClick={() => handleTransition(task.issue_id, 'ON_THE_WAY')}
                          leftIcon={<Navigation className="w-4 h-4" />}
                        >
                          Depart for Site (On the Way)
                        </Button>
                      )}

                      {task.status === 'ON_THE_WAY' && (
                        <Button
                          variant="primary"
                          className="w-full sm:w-auto"
                          disabled={isSubmitting}
                          onClick={() => handleTransition(task.issue_id, 'ARRIVED')}
                          leftIcon={<MapPin className="w-4 h-4" />}
                        >
                          Mark Arrived on Site
                        </Button>
                      )}

                      {task.status === 'ARRIVED' && (
                        <Button
                          variant="primary"
                          className="w-full sm:w-auto"
                          disabled={isSubmitting}
                          onClick={() => handleTransition(task.issue_id, 'WORK_STARTED')}
                          leftIcon={<Play className="w-4 h-4" />}
                        >
                          Start Ground Repairs
                        </Button>
                      )}

                      {(task.status === 'WORK_STARTED' || task.status === 'IN_PROGRESS') && (
                        <Button
                          variant="primary"
                          className="w-full sm:w-auto"
                          onClick={() => {
                            setSelectedTask(task);
                            setIsCompleteModalOpen(true);
                          }}
                          leftIcon={<Check className="w-4 h-4" />}
                        >
                          Submit Completion Proof
                        </Button>
                      )}

                      {['DONE', 'VERIFIED', 'CLOSED'].includes(task.status) && (
                        <span className="font-mono text-xs font-semibold text-semantic-success flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Work Submitted
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Completion Evidence Submission Modal */}
      {selectedTask && (
        <Modal
          isOpen={isCompleteModalOpen}
          onClose={() => {
            setIsCompleteModalOpen(false);
            setCompleteError(null);
          }}
          title={`Submit Completion Evidence: ${selectedTask.issue_id}`}
          maxWidth="lg"
        >
          <form onSubmit={handleCompleteSubmit} className="space-y-4">
            <p className="text-xs text-ink-500">
              Provide photographic proof and notes documenting the resolution of this grievance. Supervisor verification will review your submission before final closure.
            </p>

            {completeError && (
              <div className="p-3 bg-semantic-danger/10 border border-semantic-danger/30 rounded-input text-xs text-semantic-danger font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{completeError}</span>
              </div>
            )}

            {/* Mandatory After-Repair Photo */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-950">
                After-Repair Photo Evidence <span className="text-semantic-danger">*</span>
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer px-3.5 py-2 bg-primary-100 text-primary-700 hover:bg-primary-100/80 rounded-button text-xs font-semibold inline-flex items-center gap-1.5 transition-colors">
                  <Camera className="w-4 h-4" />
                  Capture / Upload After Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAfterImageSelect}
                    className="hidden"
                    required
                  />
                </label>
                {afterImage && (
                  <span className="text-xs font-mono text-semantic-success font-medium">
                    {afterImage.name}
                  </span>
                )}
              </div>
              {afterPreview && (
                <div className="mt-2 h-28 sm:h-32 rounded-input overflow-hidden border border-line bg-surface flex items-center justify-center">
                  <img src={afterPreview} alt="After Preview" className="w-full h-full object-contain bg-black/5" />
                </div>
              )}
            </div>

            {/* Optional Before Photo */}
            <div className="space-y-1.5 pt-2 border-t border-line">
              <label className="block text-xs font-semibold text-ink-700">
                Optional On-Site Before Photo (if different from citizen report)
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer px-3 py-1.5 bg-surface text-ink-700 hover:bg-surface/80 border border-line rounded-button text-xs font-medium inline-flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  Upload Before Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBeforeImageSelect}
                    className="hidden"
                  />
                </label>
                {beforeImage && (
                  <span className="text-xs font-mono text-ink-500">
                    {beforeImage.name}
                  </span>
                )}
              </div>
              {beforePreview && (
                <div className="mt-2 h-24 sm:h-28 rounded-input overflow-hidden border border-line bg-surface flex items-center justify-center">
                  <img src={beforePreview} alt="Before Preview" className="w-full h-full object-contain bg-black/5" />
                </div>
              )}
            </div>

            {/* Work Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-950">
                Detailed Work Notes <span className="text-semantic-danger">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                placeholder="Explain the repair operations performed, testing done, and resolution verified..."
                className="w-full p-2.5 text-xs bg-card border border-line rounded-input text-ink-950 focus:ring-2 focus:ring-primary-600"
              />
            </div>

            {/* Materials Used */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-950">
                Materials & Equipment Deployed
              </label>
              <input
                type="text"
                value={materialsUsed}
                onChange={(e) => setMaterialsUsed(e.target.value)}
                placeholder="e.g. 150kg Asphalt mix, roller, warning barricades, 2x PVC conduits"
                className="w-full px-3 py-2 text-xs bg-card border border-line rounded-input text-ink-950 focus:ring-2 focus:ring-primary-600"
              />
            </div>

            {/* Submit Actions - Sticky to ensure it is always accessible and never hidden behind taskbar */}
            <div className="pt-3 pb-1 border-t border-line flex items-center justify-end gap-2 sticky bottom-0 bg-card/95 backdrop-blur-xs mt-2 z-10">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setIsCompleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isSubmitting}
                leftIcon={<Check className="w-4 h-4" />}
              >
                {isSubmitting ? 'Uploading Proof...' : 'Submit Resolution Proof'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
