import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
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
    const roleParam = searchParams.get('role');
    const usernameParam = searchParams.get('username');

    if (roleParam) {
      const match = AUTH_ROLES.find((r) => r.id === roleParam.toLowerCase());
      if (match) {
        setSelectedRole(match);
        if (usernameParam) {
          const personMatch = match.persons.find((p) => p.username.toLowerCase() === usernameParam.toLowerCase());
          if (personMatch) {
            setUsername(personMatch.username);
            setPassword(personMatch.password);
            return;
          }
        }
        const defaultPerson = match.persons[0] || { username: match.username, password: match.password };
        setUsername(defaultPerson.username);
        setPassword(defaultPerson.password);
      }
    } else if (usernameParam) {
      for (const role of AUTH_ROLES) {
        const personMatch = role.persons.find((p) => p.username.toLowerCase() === usernameParam.toLowerCase());
        if (personMatch) {
          setSelectedRole(role);
          setUsername(personMatch.username);
          setPassword(personMatch.password);
          break;
        }
      }
    }
  }, [searchParams]);

  const handleSelectRole = (role: RoleAuthOption) => {
    setSelectedRole(role);
    const defaultPerson = role.persons[0] || { username: role.username, password: role.password };
    setUsername(defaultPerson.username);
    setPassword(defaultPerson.password);
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
            <Link to="/" className="flex items-center">
              <div>
                <span className="font-heading font-bold text-2xl text-card tracking-tight">SmartCivic</span>
                <span className="block text-[11px] font-mono text-primary-100 uppercase tracking-widest">
                  Civic Redressal Portal
                </span>
              </div>
            </Link>
          </div>

          <div className="mt-12 lg:mt-24 space-y-4">
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
                const isSelected = selectedRole?.id === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleSelectRole(role)}
                    className={`py-2 px-1.5 rounded-lg text-xs border flex items-center justify-center transition cursor-pointer text-center ${
                      isSelected
                        ? 'border-primary-600 bg-primary-100/40 text-primary-900 font-semibold shadow-xs ring-1 ring-primary-600'
                        : 'border-line bg-surface hover:bg-white text-ink-700 hover:border-ink-300'
                    }`}
                  >
                    <span className="text-[10px] leading-tight font-mono uppercase">{role.badge}</span>
                  </button>
                );
              })}
            </div>

            {selectedRole && (
              <div className="mt-2.5 p-3 rounded-xl bg-surface border border-line text-xs space-y-2.5 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-950 truncate flex items-center gap-2">
                      <span>{selectedRole.name}</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${selectedRole.badgeColor}`}>
                        {selectedRole.badge}
                      </span>
                    </p>
                    <p className="text-[11px] text-ink-500 truncate mt-0.5">{selectedRole.description}</p>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    isLoading={isSubmitting}
                    onClick={() => executeLogin(username, password, selectedRole.dashboardRoute)}
                    className="bg-primary-700 text-white shrink-0 text-xs py-1.5 px-3 self-end sm:self-auto cursor-pointer"
                    rightIcon={<ArrowRight className="w-3 h-3" />}
                  >
                    Quick Sign In
                  </Button>
                </div>

                {selectedRole.persons && selectedRole.persons.length > 1 && (
                  <div className="pt-2 border-t border-line/60 flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-[11px] font-medium text-ink-600 shrink-0">
                      Select Person / Department:
                    </span>
                    <select
                      value={username}
                      onChange={(e) => {
                        const person = selectedRole.persons.find((p) => p.username === e.target.value);
                        if (person) {
                          setUsername(person.username);
                          setPassword(person.password);
                        }
                      }}
                      className="text-xs bg-white border border-line rounded-lg px-2.5 py-1 text-ink-900 font-medium focus:border-primary-600 focus:ring-1 focus:ring-primary-600 focus:outline-hidden cursor-pointer w-full sm:w-auto"
                    >
                      {selectedRole.persons.map((person) => (
                        <option key={person.username} value={person.username}>
                          {person.name} — {person.department} ({person.username})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-ink-500 pt-0.5">
                  <span>Autofilled Login: <strong className="text-ink-800">{username}</strong></span>
                  <span className="text-ink-300">•</span>
                  <span>Pass: <strong className="text-ink-800">{password}</strong></span>
                </div>
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
