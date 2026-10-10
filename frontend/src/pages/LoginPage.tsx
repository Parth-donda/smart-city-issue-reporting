import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AlertCircle, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { AUTH_ROLES, RoleAuthOption } from '../components/auth/AuthRoleModal';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleAuthOption | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, getDashboardRoute } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (roleParam) {
      const match = AUTH_ROLES.find((r) => r.id === roleParam.toLowerCase());
      if (match) {
        setSelectedRole(match);
        setUsername(match.username);
        setPassword(match.password);
      }
    }
  }, [roleParam]);

  const handleSelectRole = (role: RoleAuthOption) => {
    setSelectedRole(role);
    setUsername(role.username);
    setPassword(role.password);
    setError(null);
  };

  const handleClearRole = () => {
    setSelectedRole(null);
    setUsername('');
    setPassword('');
  };

  const executeLogin = async (uname: string, pwd: string, fallbackRoute?: string) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login(uname, pwd);
      const redirectUrl = location.state?.from?.pathname || getDashboardRoute(user.role) || fallbackRoute || '/';
      navigate(redirectUrl, { replace: true });
    } catch (err: any) {
      if (err.detail) {
        setError(err.detail);
      } else if (err.non_field_errors) {
        setError(err.non_field_errors[0]);
      } else {
        setError('Invalid username or password. Please verify your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(username, password, selectedRole?.dashboardRoute);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-surface">
      {/* Left / Top Hero Gradient Side Panel */}
      <div className="lg:w-5/12 bg-hero-gradient text-card p-8 lg:p-14 flex flex-col justify-between shadow-soft">
        <div>
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-input bg-primary-600 flex items-center justify-center text-card font-bold text-lg shadow-soft">
                SC
              </div>
              <div>
                <span className="font-heading font-bold text-xl text-card tracking-tight">SmartCivic</span>
                <span className="block text-[11px] font-mono text-primary-100 uppercase tracking-widest">
                  Civic Redressal Portal
                </span>
              </div>
            </Link>
          </div>

          <div className="mt-12 lg:mt-24 space-y-4">
            <span className="font-mono text-xs px-2.5 py-1 bg-primary-700/80 text-primary-100 rounded-badge inline-block border border-primary-600">
              MUNICIPAL GOVERNANCE SYSTEM
            </span>
            <h1 className="text-3xl lg:text-4xl font-heading font-bold text-card leading-tight">
              Evidence-Based Civic Resolution.
            </h1>
            <p className="text-sm text-primary-100/90 leading-relaxed max-w-md">
              A unified government operations portal connecting citizens, department inspection officers, field maintenance crews, supervisors, and municipal administrators into an auditable lifecycle loop.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-primary-700/60 text-xs text-primary-100/70 flex justify-between items-center">
          <span>Municipal Urban Local Bodies</span>
          <Link to="/" className="inline-flex items-center gap-1 text-primary-100 hover:text-white font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="lg:w-7/12 p-6 sm:p-12 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-lg space-y-6">
          <div>
            <h2 className="text-2xl font-heading font-bold text-ink-950">Sign In to Your Workspace</h2>
            <p className="text-sm text-ink-500 mt-1">
              Select an authenticated role for instant access or enter your custom credentials.
            </p>
          </div>

          {/* Quick Role Selection Bar */}
          <div className="space-y-2 p-3 bg-card border border-line rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-semibold text-ink-700">Choose Role Option:</span>
              {selectedRole ? (
                <button
                  type="button"
                  onClick={handleClearRole}
                  className="text-[11px] text-primary-700 hover:underline font-medium cursor-pointer"
                >
                  Custom credentials
                </button>
              ) : (
                <span className="text-[11px] text-ink-400 font-mono">1-click autofill</span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {AUTH_ROLES.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole?.id === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleSelectRole(role)}
                    className={`p-2 rounded-lg text-xs border flex flex-col items-center gap-1 transition cursor-pointer text-center ${
                      isSelected
                        ? 'border-primary-600 bg-primary-100/40 text-primary-900 font-semibold shadow-xs ring-1 ring-primary-600'
                        : 'border-line bg-surface hover:bg-white text-ink-700 hover:border-ink-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${role.iconColor}`} />
                    <span className="text-[10px] leading-tight font-mono uppercase">{role.badge}</span>
                  </button>
                );
              })}
            </div>

            {selectedRole && (
              <div className="mt-2 p-2.5 rounded-lg bg-surface border border-line text-xs flex items-center justify-between gap-2 animate-in fade-in">
                <div className="min-w-0">
                  <p className="font-semibold text-ink-950 truncate flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary-600" />
                    <span>{selectedRole.name}</span>
                    <span className="text-ink-400 font-mono text-[10px]">({selectedRole.username})</span>
                  </p>
                  <p className="text-[11px] text-ink-500 truncate mt-0.5">{selectedRole.description}</p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  onClick={() => executeLogin(selectedRole.username, selectedRole.password, selectedRole.dashboardRoute)}
                  className="bg-primary-700 text-white shrink-0 text-xs py-1.5"
                  rightIcon={<ArrowRight className="w-3 h-3" />}
                >
                  Quick Sign In
                </Button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-semantic-danger/10 border border-semantic-danger/20 rounded-input text-xs text-semantic-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username or Email"
              placeholder="Enter your username or email"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (selectedRole && e.target.value !== selectedRole.username) {
                  setSelectedRole(null);
                }
              }}
              required
              autoFocus={!roleParam}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (selectedRole && e.target.value !== selectedRole.password) {
                  setSelectedRole(null);
                }
              }}
              required
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isSubmitting}>
                {selectedRole ? `Sign In as ${selectedRole.name}` : 'Sign In'}
              </Button>
            </div>
          </form>

          <div className="text-center text-xs text-ink-500">
            Are you a citizen without an account?{' '}
            <Link to="/register" className="text-primary-700 font-semibold hover:underline">
              Register for an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
