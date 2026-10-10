import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, getDashboardRoute } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login(username, password);
      const redirectUrl = location.state?.from?.pathname || getDashboardRoute(user.role);
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
              A unified government operations portal connecting citizens, department inspection officers, field maintenance crews, and supervisors into an auditable lifecycle loop.
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
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-2xl font-heading font-bold text-ink-950">Sign In to Your Workspace</h2>
            <p className="text-sm text-ink-500 mt-1">
              Enter your credentials to access your designated municipal portal.
            </p>
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
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isSubmitting}>
                Sign In
              </Button>
            </div>
          </form>

          <div className="text-center text-xs text-ink-500">
            Are you a citizen?{' '}
            <Link to="/register" className="text-primary-700 font-semibold hover:underline">
              Register for an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
