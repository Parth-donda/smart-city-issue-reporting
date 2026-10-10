import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  X,
  ArrowRight,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export interface AuthRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface RoleAuthOption {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  username: string;
  password: string;
  roleType: string;
  dashboardRoute: string;
  description: string;
}

export const AUTH_ROLES: RoleAuthOption[] = [
  {
    id: 'admin',
    name: 'Municipal Admin',
    badge: 'ADMIN',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    username: 'admin',
    password: 'pass123',
    roleType: 'MUNICIPAL_ADMIN',
    dashboardRoute: '/admin',
    description: 'City-wide oversight, department SLAs, system parameters & analytics.',
  },
  {
    id: 'officer',
    name: 'Department Officer / Manager',
    badge: 'MANAGER / OFFICER',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    username: 'officer',
    password: 'pass123',
    roleType: 'DEPARTMENT_OFFICER',
    dashboardRoute: '/officer',
    description: 'Triage grievances, verify evidence & allocate tasks to field teams.',
  },
  {
    id: 'supervisor',
    name: 'Field Supervisor',
    badge: 'SUPERVISOR',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    username: 'supervisor',
    password: 'pass123',
    roleType: 'SUPERVISOR',
    dashboardRoute: '/supervisor',
    description: 'SLA monitoring, escalation approval, and quality verification audits.',
  },
  {
    id: 'worker',
    name: 'Field Maintenance Worker',
    badge: 'FIELD CREW',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    username: 'worker',
    password: 'pass123',
    roleType: 'WORKER',
    dashboardRoute: '/worker',
    description: 'On-site execution, work order checklists & before/after resolution photos.',
  },
  {
    id: 'citizen',
    name: 'Citizen / Public User',
    badge: 'CITIZEN',
    badgeColor: 'bg-teal-100 text-primary-800 border-teal-200',
    username: 'citizen',
    password: 'pass123',
    roleType: 'CITIZEN',
    dashboardRoute: '/citizen',
    description: 'Report civic issues, attach geotagged evidence & confirm ticket closures.',
  },
];

export const AuthRoleModal: React.FC<AuthRoleModalProps> = ({ isOpen, onClose }) => {
  const { login, getDashboardRoute } = useAuth();
  const navigate = useNavigate();
  const [loadingRoleId, setLoadingRoleId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickLogin = async (role: RoleAuthOption) => {
    setLoadingRoleId(role.id);
    setErrorMsg(null);
    try {
      const user = await login(role.username, role.password);
      onClose();
      const targetRoute = getDashboardRoute(user.role) || role.dashboardRoute;
      navigate(targetRoute, { replace: true });
    } catch (err: any) {
      setErrorMsg(
        err.detail || err.non_field_errors?.[0] || `Unable to log in as ${role.name}. Please try again.`
      );
      setLoadingRoleId(null);
    }
  };

  const handleNavigateToLoginWithRole = (roleId: string) => {
    onClose();
    navigate(`/login?role=${roleId}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary-600/60 border border-primary-500/40 text-primary-100 font-semibold">
                SmartCivic Portal Access
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-heading font-bold text-white tracking-tight">
              Select Your Authentication Role
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Sign in as an administrator, municipal officer, field worker, or citizen.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Roles List */}
        <div className="p-5 sm:p-6 max-h-[62vh] overflow-y-auto space-y-2.5">
          {AUTH_ROLES.map((role) => {
            const isLoading = loadingRoleId === role.id;
            return (
              <div
                key={role.id}
                className="group p-3.5 sm:p-4 rounded-xl border border-slate-200 hover:border-primary-600/70 bg-slate-50/50 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:shadow-sm"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900 group-hover:text-primary-700 transition-colors">
                      {role.name}
                    </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${role.badgeColor}`}
                      >
                        {role.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">
                      {role.description}
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="font-mono text-[11px] text-slate-500">
                        Login: <strong className="text-slate-700">{role.username}</strong>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        Pass: <strong className="text-slate-700">{role.password}</strong>
                      </span>
                    </div>
                  </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => handleNavigateToLoginWithRole(role.id)}
                    className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Customize credentials on login page"
                  >
                    Edit Info
                  </button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={!!loadingRoleId}
                    isLoading={isLoading}
                    onClick={() => handleQuickLogin(role)}
                    className="bg-primary-700 hover:bg-primary-800 text-white font-semibold text-xs shadow-xs"
                    rightIcon={!isLoading ? <ArrowRight className="w-3.5 h-3.5" /> : undefined}
                  >
                    Quick Sign In
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-400" />
            <span>Have custom credentials?</span>
            <Link
              to="/login"
              onClick={onClose}
              className="text-primary-700 font-semibold hover:underline inline-flex items-center gap-1"
            >
              Go to Standard Sign In <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div>
            Need a citizen account?{' '}
            <Link
              to="/register"
              onClick={onClose}
              className="text-primary-700 font-semibold hover:underline"
            >
              Sign Up Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
