import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    password_confirm: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await register(formData);
      navigate('/citizen', { replace: true });
    } catch (err: any) {
      if (err.password) {
        setError(Array.isArray(err.password) ? err.password[0] : err.password);
      } else if (err.username) {
        setError(Array.isArray(err.username) ? err.username[0] : err.username);
      } else if (err.email) {
        setError(Array.isArray(err.email) ? err.email[0] : err.email);
      } else {
        setError('Registration failed. Please review your input.');
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
          <div className="flex items-center">
            <div>
              <span className="font-heading font-bold text-2xl text-card tracking-tight">SmartCivic</span>
              <span className="block text-[11px] font-mono text-primary-100 uppercase tracking-widest">
                Citizen Registration
              </span>
            </div>
          </div>

          <div className="mt-12 lg:mt-24 space-y-4">
            <h1 className="text-3xl lg:text-4xl font-heading font-bold text-card leading-tight">
              Direct Access to Municipal Services.
            </h1>
            <p className="text-sm text-primary-100/90 leading-relaxed max-w-md">
              Create an official citizen account to report potholes, water leakages, streetlight outages, and waste management grievances with GPS and photo evidence.
            </p>

            <ul className="space-y-2.5 pt-4 text-xs text-primary-100/90">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary-100" />
                <span>Track issue lifecycle progression in real time</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary-100" />
                <span>Direct notification upon worker assignment & completion</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary-100" />
                <span>Confirm or reopen issues based on before/after proof</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-primary-700/60 text-xs text-primary-100/70">
          <span>Municipal Urban Local Bodies Citizen Services</span>
        </div>
      </div>

      {/* Right Registration Form */}
      <div className="lg:w-7/12 p-6 sm:p-12 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-lg space-y-8">
          <div>
            <h2 className="text-2xl font-heading font-bold text-ink-950">Citizen Registration</h2>
            <p className="text-sm text-ink-500 mt-1">
              Provide your details to register as an authenticated resident.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-semantic-danger/10 border border-semantic-danger/20 rounded-input text-xs text-semantic-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="pt-2">
              <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isSubmitting}>
                Create Citizen Account
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
