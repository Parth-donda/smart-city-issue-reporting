import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  UserCog,
  Shield,
  LogOut,
  ChevronDown,
  Building2,
  Phone,
  Mail,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserRole } from '../../types/auth';

// User role labels and descriptive capability scopes
const ROLE_DETAILS: Record<
  UserRole,
  { label: string; badgeColor: string; description: string }
> = {
  CITIZEN: {
    label: 'Registered Citizen',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Can submit geotagged issues, track real-time resolution, and inspect before/after proof for closure approval.',
  },
  DEPARTMENT_OFFICER: {
    label: 'Department Officer',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Triage command desk: review grievances, accept/reject, enforce SLA targets, and dispatch field technicians.',
  },
  WORKER: {
    label: 'Field Technician',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Mobile field tasks: update arrival states, execute repairs on-site, and upload verified after-repair photo proof.',
  },
  SUPERVISOR: {
    label: 'Field Supervisor',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Quality verification: inspect side-by-side photo proof, approve work orders or mandate technician rework.',
  },
  MUNICIPAL_ADMIN: {
    label: 'Municipal Administrator',
    badgeColor: 'bg-primary-100 text-primary-800 border-primary-200',
    description: 'City-wide governance: SLA matrix policies, category-to-department routing rules, and master audit ledger.',
  },
  SYSTEM_ADMIN: {
    label: 'System Administrator',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    description: 'Full administrative authority across all municipal wards, departments, and user configurations.',
  },
};

export const UserProfileDropdown: React.FC = () => {
  const { user, logout, updateProfile, getDashboardRoute } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Profile Edit Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync form inputs when user changes or modal opens
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user, isEditModalOpen]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const displayName =
    (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username) || 'User';
  const userInitials = (displayName || 'U').slice(0, 2).toUpperCase();
  const roleInfo = ROLE_DETAILS[user.role] || {
    label: user.role,
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    description: 'User access in SmartCivic platform.',
  };

  const handleSignOut = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  const handleOpenEditModal = () => {
    setIsOpen(false);
    setSaveSuccess(false);
    setSaveError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSaveSuccess(false);
      }, 1000);
    } catch (err: any) {
      const msg =
        err?.detail ||
        err?.error ||
        (Array.isArray(err) ? err[0] : typeof err === 'object' ? Object.values(err)[0] : null) ||
        'Failed to update profile.';
      setSaveError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ─────────────────────────────────────────────────────────────
          1. INTERACTIVE HEADER PROFILE TRIGGER PILL
      ───────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="User Profile Menu"
        className="flex items-center gap-2.5 py-1.5 px-3 rounded-xl bg-surface hover:bg-card border border-line hover:border-primary-600/40 shadow-xs hover:shadow-soft transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-600/30 select-none group"
      >
        {/* User Avatar Circle */}
        <div className="w-8 h-8 rounded-full bg-primary-700/10 group-hover:bg-primary-700/15 text-primary-700 flex items-center justify-center font-bold text-xs border border-primary-600/20 shrink-0 transition-colors">
          {userInitials}
        </div>

        {/* Name and Role Subtitle */}
        <div className="flex flex-col min-w-0 text-left">
          <span className="text-xs font-semibold text-ink-950 truncate max-w-[130px] leading-tight group-hover:text-primary-700 transition-colors">
            {displayName}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-ink-500 font-mono uppercase tracking-wider">
            <Shield className="w-3 h-3 text-primary-600 shrink-0" />
            <span className="truncate max-w-[100px]">{user.role}</span>
          </div>
        </div>

        {/* Dropdown Chevron Indicator */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-ink-400 group-hover:text-ink-700 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-primary-700' : ''
          }`}
        />
      </button>

      {/* ─────────────────────────────────────────────────────────────
          2. RICH PROFILE DROPDOWN MENU
      ───────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-card border border-line rounded-2xl shadow-modal z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-line">
          {/* Top User Overview Banner */}
          <div className="p-4 bg-surface/60 flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-700 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-bold text-sm text-ink-950 truncate">
                {displayName}
              </h3>
              <p className="text-xs text-ink-500 font-mono truncate">@{user.username}</p>
              {user.email && (
                <p className="text-xs text-ink-500 flex items-center gap-1.5 mt-1 truncate">
                  <Mail className="w-3 h-3 text-ink-400 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </p>
              )}
            </div>
          </div>

          {/* User Type & Scope Card */}
          <div className="p-3.5 space-y-2 bg-card">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-ink-500 uppercase tracking-wider font-semibold">
                User Type / Role
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${roleInfo.badgeColor}`}
              >
                {roleInfo.label}
              </span>
            </div>

            {user.department_name && (
              <div className="flex items-center gap-1.5 text-xs text-ink-700 bg-surface px-2.5 py-1.5 rounded-lg border border-line/60">
                <Building2 className="w-3.5 h-3.5 text-primary-700 shrink-0" />
                <span className="truncate font-medium">{user.department_name}</span>
                {user.department_code && (
                  <span className="text-[10px] font-mono text-ink-500 ml-auto">
                    [{user.department_code}]
                  </span>
                )}
              </div>
            )}

            <p className="text-[11px] text-ink-500 leading-relaxed bg-surface/40 p-2 rounded-lg border border-line/40">
              {roleInfo.description}
            </p>
          </div>

          {/* Action Menu Items */}
          <div className="p-2 space-y-1">
            {/* Edit Profile Option */}
            <button
              type="button"
              onClick={handleOpenEditModal}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-ink-700 hover:text-primary-700 hover:bg-surface rounded-xl transition-colors cursor-pointer text-left"
            >
              <UserCog className="w-4 h-4 text-primary-700 shrink-0" />
              <span>Edit Profile Information</span>
            </button>

            {/* Dashboard Workspace Shortcut */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate(getDashboardRoute());
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-ink-700 hover:text-primary-700 hover:bg-surface rounded-xl transition-colors cursor-pointer text-left"
            >
              <LayoutDashboard className="w-4 h-4 text-ink-500 shrink-0" />
              <span>Go to My Workspace</span>
            </button>
          </div>

          {/* Sign Out Option */}
          <div className="p-2 bg-surface/30">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. EDIT PROFILE MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile Information"
        description="Update your personal contact details and name across SmartCivic."
        maxWidth="md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 p-1">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {saveError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Username & Role (Read-Only) */}
          <div className="grid grid-cols-2 gap-3 bg-surface p-3 rounded-xl border border-line">
            <div>
              <span className="text-[10px] font-mono text-ink-500 uppercase tracking-wider block">
                Username
              </span>
              <span className="text-xs font-bold font-mono text-ink-950 mt-0.5 block truncate">
                @{user.username}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-ink-500 uppercase tracking-wider block">
                Assigned Role
              </span>
              <span className="text-xs font-bold text-primary-700 mt-0.5 block truncate">
                {roleInfo.label}
              </span>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1">Last Name</label>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              leftIcon={<Mail className="w-4 h-4 text-ink-400" />}
              required
            />
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Phone Number</label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              leftIcon={<Phone className="w-4 h-4 text-ink-400" />}
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              className="bg-primary-700 hover:bg-primary-800 text-white"
            >
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
