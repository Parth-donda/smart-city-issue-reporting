import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../services/api';
import { UserRole } from '../types/auth';
import {
  AlertCircle,
  CheckCircle2,
  User,
  Shield,
  Wrench,
  UserCheck,
  Building2,
  ChevronDown,
} from 'lucide-react';

interface RoleOption {
  value: UserRole;
  label: string;
  badge: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  requiresDepartment: boolean;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'CITIZEN',
    label: 'Citizen / Resident',
    badge: 'RESIDENT',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: User,
    description: 'Report civic issues, track real-time resolution, and verify proof before issue closure.',
    requiresDepartment: false,
  },
  {
    value: 'DEPARTMENT_OFFICER',
    label: 'Department Officer',
    badge: 'OFFICER',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Shield,
    description: 'Review grievances, enforce SLA targets, triage reports, and dispatch field crew.',
    requiresDepartment: true,
  },
  {
    value: 'WORKER',
    label: 'Field Technician',
    badge: 'FIELD CREW',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Wrench,
    description: 'Execute repairs on-site, log arrival states, and upload verified photo evidence.',
    requiresDepartment: true,
  },
  {
    value: 'SUPERVISOR',
    label: 'Field Supervisor',
    badge: 'SUPERVISOR',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: UserCheck,
    description: 'Inspect completed work, audit side-by-side photo proof, and verify quality standards.',
    requiresDepartment: true,
  },
  {
    value: 'MUNICIPAL_ADMIN',
    label: 'Municipal Administrator',
    badge: 'ADMIN',
    badgeColor: 'bg-primary-100 text-primary-800 border-primary-200',
    icon: Building2,
    description: 'City-wide governance, SLA matrix policies, routing rules, and master audit ledger.',
    requiresDepartment: false,
  },
];

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<{
    role: UserRole;
    department: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    password: string;
    password_confirm: string;
  }>({
    role: 'CITIZEN',
    department: '',
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    password_confirm: '',
  });

  const [departments, setDepartments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, getDashboardRoute } = useAuth();
  const navigate = useNavigate();

  // Fetch departments when component mounts
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const depts = await api.getDepartments();
        setDepartments(depts);
      } catch (err) {
        console.warn('Could not fetch departments for registration:', err);
      }
    };
    fetchDepartments();
  }, []);

  const selectedRoleOption = ROLE_OPTIONS.find((r) => r.value === formData.role) || ROLE_OPTIONS[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleRoleSelect = (role: UserRole) => {
    const roleOpt = ROLE_OPTIONS.find((r) => r.value === role);
    setFormData((prev) => ({
      ...prev,
      role,
      department: roleOpt?.requiresDepartment ? prev.department : '',
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match.');
      return;
    }

    if (selectedRoleOption.requiresDepartment && !formData.department) {
      setError('Please select an assigned municipal department for this role.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        password_confirm: formData.password_confirm,
        role: formData.role,
      };

      if (formData.department) {
        payload.department = Number(formData.department);
      }

      const registeredUser = await register(payload);
      const destination = getDashboardRoute(registeredUser.role);
      navigate(destination, { replace: true });
    } catch (err: any) {
      if (err.password) {
        setError(Array.isArray(err.password) ? err.password[0] : err.password);
      } else if (err.username) {
        setError(Array.isArray(err.username) ? err.username[0] : err.username);
      } else if (err.email) {
        setError(Array.isArray(err.email) ? err.email[0] : err.email);
      } else if (err.role) {
        setError(Array.isArray(err.role) ? err.role[0] : err.role);
      } else if (err.department) {
        setError(Array.isArray(err.department) ? err.department[0] : err.department);
      } else if (err.detail) {
        setError(err.detail);
      } else {
        setError('Registration failed. Please review your input.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-surface">
      {/* Left Hero Gradient Panel */}
      <div className="lg:w-5/12 bg-hero-gradient text-card p-8 lg:p-14 flex flex-col justify-between shadow-soft">
        <div>
          <div className="flex items-center">
            <div>
              <span className="font-heading font-bold text-2xl text-card tracking-tight">SmartCivic</span>
              <span className="block text-[11px] font-mono text-primary-100 uppercase tracking-widest">
                Municipal Operations & Services
              </span>
            </div>
          </div>

          <div className="mt-8 lg:mt-10 space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-md">
              <img
                src="/images/hero_civic_city.jpg"
                alt="SmartCivic Municipal Operations"
                className="w-full h-40 object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-950/80 via-transparent to-transparent flex items-end p-3">
                <span className="text-[11px] font-medium text-white/90">
                  Municipal governance & field operations
                </span>
              </div>
            </div>

            <h1 className="text-2xl lg:text-3xl font-heading font-bold text-card leading-tight">
              Evidence-Based Civic Resolution.
            </h1>
            <p className="text-sm text-primary-100/90 leading-relaxed max-w-md">
              A comprehensive system connecting residents, municipal department officers, field maintenance crews, and supervisors into an auditable lifecycle loop.
            </p>

            <ul className="space-y-3 pt-4 text-xs text-primary-100/90">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary-100 shrink-0 mt-0.5" />
                <span>
                  <strong>Citizens:</strong> Geotagged issue reporting with before/after resolution verification.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary-100 shrink-0 mt-0.5" />
                <span>
                  <strong>Officers & Supervisors:</strong> SLA monitoring, automated escalations, and worker task allocation.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary-100 shrink-0 mt-0.5" />
                <span>
                  <strong>Field Crews:</strong> Mobile task checklist, real-time arrival logging, and photographic repair proof.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-primary-700/60 text-xs text-primary-100/70 flex justify-between items-center">
          <span>Municipal Urban Local Bodies</span>
          <Link to="/" className="text-primary-100 hover:text-white font-medium underline-offset-2 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>

      {/* Right Registration Form */}
      <div className="lg:w-7/12 p-6 sm:p-10 lg:p-14 flex items-center justify-center">
        <div className="w-full max-w-xl space-y-6">
          <div>
            <h2 className="text-2xl font-heading font-bold text-ink-950">Create an Account</h2>
            <p className="text-sm text-ink-500 mt-1">
              Select your role and provide your credentials to access your designated municipal workspace.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-semantic-danger/10 border border-semantic-danger/20 rounded-input text-xs text-semantic-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. ROLE SELECTION TILES */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-ink-950">
                1. Select Account Role <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {ROLE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = formData.role === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleRoleSelect(opt.value)}
                      className={`flex flex-col text-left p-3 rounded-xl border transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50/60 ring-2 ring-primary-600 shadow-2xs'
                          : 'border-line hover:border-ink-300 bg-card hover:bg-surface'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-primary-600 text-white' : 'bg-surface text-ink-700'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        
                      </div>
                      <span
                        className={`text-xs font-bold leading-tight ${
                          isSelected ? 'text-primary-950' : 'text-ink-950'
                        }`}
                      >
                        {opt.label}
                      </span>
                      <p className="text-[10px] text-ink-500 mt-1 line-clamp-2 leading-relaxed">
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. OPTIONAL DEPARTMENT DROPDOWN FOR STAFF ROLES */}
            {selectedRoleOption.requiresDepartment && (
              <div className="space-y-1.5 p-3.5 bg-surface rounded-xl border border-line animate-in fade-in duration-150">
                <label htmlFor="department" className="block text-xs font-semibold text-ink-950">
                  Assigned Municipal Department <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className="w-full appearance-none bg-card text-ink-950 text-xs sm:text-sm border rounded-input px-3.5 py-2.5 pr-10 border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 transition-colors"
                  >
                    <option value="" disabled>
                      -- Select Your Designated Department --
                    </option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} {dept.code ? `[${dept.code}]` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 pointer-events-none text-ink-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-ink-500">
                  Select the municipal department you are authorized to operate within.
                </p>
              </div>
            )}

            {/* 3. USER PROFILE FIELDS */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="first_name"
                  placeholder="Ramesh"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Last Name"
                  name="last_name"
                  placeholder="Patel"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <Input
                label="Username"
                name="username"
                placeholder="ramesh_patel"
                value={formData.username}
                onChange={handleChange}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="ramesh@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Mobile Phone"
                  name="phone"
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Confirm Password"
                  name="password_confirm"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isSubmitting}>
                Register as {selectedRoleOption.label}
              </Button>
            </div>
          </form>

          <div className="text-center text-xs text-ink-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-700 font-semibold hover:underline">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
