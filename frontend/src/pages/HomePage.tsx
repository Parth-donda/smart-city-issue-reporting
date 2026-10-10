import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FilePlus2,
  Search,
  Clock,
  CheckCircle2,
  Wrench,
  Camera,
  Compass,
  FileCheck,
  ShieldCheck,
  UserPlus,
  LogIn,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  X,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AuthRoleModal } from '../components/auth/AuthRoleModal';

export const HomePage: React.FC = () => {
  const [trackId, setTrackId] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authRoleModalOpen, setAuthRoleModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, getDashboardRoute } = useAuth();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackId.trim()) {
      navigate(`/track/${encodeURIComponent(trackId.trim().toUpperCase())}`);
    } else {
      navigate('/track');
    }
  };

  const departments = [
    {
      name: 'Roads & Pavements',
      desc: 'Potholes, broken footpaths, damaged dividers, sunken roads, and missing manhole covers.',
      sla: 'Within 24–48 hours',
      image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      division: 'Road Maintenance',
    },
    {
      name: 'Garbage & Sanitation',
      desc: 'Overflowing dumpsters, missed door-to-door trash collection, and unauthorized waste dumping.',
      sla: 'Within 12–24 hours',
      image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
      division: 'Waste Management',
    },
    {
      name: 'Water Supply & Drains',
      desc: 'Pipeline leaks, contaminated water, clogged storm drains, and open sewage overflow.',
      sla: 'Within 12–36 hours',
      image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
      division: 'Water & Sewage',
    },
    {
      name: 'Streetlights & Electricity',
      desc: 'Dark streetlights, exposed electrical wires, damaged feeder pillars, and power fluctuations.',
      sla: 'Within 12–24 hours',
      image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
      division: 'Electrical Wing',
    },
    {
      name: 'Traffic & Signage',
      desc: 'Broken traffic signals, damaged road signs, missing safety mirrors, and fallen barriers.',
      sla: 'Within 6–12 hours',
      image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
      division: 'Traffic Safety',
    },
    {
      name: 'Parks & Trees',
      desc: 'Fallen tree branches blocking roads, overgrown vegetation, and maintenance of public parks.',
      sla: 'Within 24–48 hours',
      image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
      division: 'Parks & Greenery',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Snap a Photo & Pin Location',
      desc: 'Spot a problem in your neighborhood. Take a picture, allow the app to capture the location, and hit submit.',
      icon: Camera,
      image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=600&q=80',
    },
    {
      step: '02',
      title: 'Routed to Local Ward Team',
      desc: 'Your report is instantly routed to the responsible ward engineer. Similar nearby reports are grouped together.',
      icon: Compass,
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    },
    {
      step: '03',
      title: 'Repair Crew Dispatched',
      desc: 'Field workers are assigned to the site with full details and an expected completion deadline.',
      icon: Wrench,
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    },
    {
      step: '04',
      title: 'Photo Proof on Resolution',
      desc: 'Once the work is done, crews upload a photo of the completed fix. You get notified immediately.',
      icon: FileCheck,
      image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* ─────────────────────────────────────────────────────────────
          1. NAVIGATION BAR
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[76px] py-3.5 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center group">
            <div className="flex flex-col justify-center">
              <span className="font-heading font-bold text-2xl text-slate-900 tracking-tight leading-tight group-hover:text-primary-700 transition-colors">
                SmartCivic
              </span>
              <span className="text-[11px] text-slate-500 font-medium leading-tight">
                City Issue & Redressal Portal
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-slate-100/80 border border-slate-200/80 rounded-full">
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-primary-700 hover:bg-white transition-all cursor-pointer"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-primary-700 hover:bg-white transition-all cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('departments')}
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-primary-700 hover:bg-white transition-all cursor-pointer"
            >
              Departments & Turnaround
            </button>
          </nav>

          {/* Right User Authentication CTAs */}
          <div className="hidden sm:flex items-center gap-2.5">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link to={getDashboardRoute(user.role)}>
                  <Button variant="primary" size="sm" className="font-semibold shadow-xs flex items-center gap-1.5 py-2 px-3.5 text-xs bg-primary-700 hover:bg-primary-800 text-white">
                    <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard ({user.username})
                  </Button>
                </Link>
                <button
                  onClick={() => logout()}
                  title="Sign Out"
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAuthRoleModalOpen(true)}
                  className="font-semibold text-slate-700 hover:text-primary-700 hover:border-primary-600 bg-white hover:bg-slate-50 shadow-xs py-2 px-3.5 text-xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Sign In
                </Button>
                <Link to="/register">
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-primary-700 hover:bg-primary-800 text-white font-semibold shadow-xs py-2 px-4 text-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-3 shadow-lg">
            <nav className="flex flex-col space-y-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  scrollToSection('about');
                }}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-800 text-left font-semibold cursor-pointer"
              >
                About
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  scrollToSection('how-it-works');
                }}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-800 text-left font-semibold cursor-pointer"
              >
                How It Works
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  scrollToSection('departments');
                }}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-800 text-left font-semibold cursor-pointer"
              >
                Departments & Turnaround
              </button>
              <Link
                to="/track"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-primary-700" /> Track a Report
              </Link>
              <Link
                to="/report"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg bg-teal-50 text-primary-700 font-semibold flex items-center gap-2"
              >
                <FilePlus2 className="w-4 h-4" /> Report an Issue
              </Link>
            </nav>

            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
              {isAuthenticated && user ? (
                <Link to={getDashboardRoute(user.role)} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" className="w-full bg-primary-700 text-white">
                    <LayoutDashboard className="w-4 h-4 mr-2" /> Open Dashboard
                  </Button>
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    className="w-full cursor-pointer"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setAuthRoleModalOpen(true);
                    }}
                  >
                    <LogIn className="w-4 h-4 mr-1.5" /> Sign In
                  </Button>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="md" className="w-full bg-primary-700 text-white">
                      <UserPlus className="w-4 h-4 mr-1.5" /> Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/80 border-b border-slate-200/80 min-h-[calc(100vh-76px)] flex items-center py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center relative z-10">
          
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-heading font-bold text-slate-900 leading-[1.18] tracking-tight">
                Report Civic Issues. <br />
                <span className="text-primary-700">Track Real-Time City Repairs.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
                SmartCivic connects residents directly with city maintenance teams. Spot a pothole, broken streetlight, or water leak? Submit a photo with GPS location, and track the fix from start to finish.
              </p>
            </div>

            {/* Quick Ticket Tracker */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3 max-w-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-primary-700" />
                  Track an Existing Report
                </span>
                <span className="text-xs text-slate-500 font-normal">No login required</span>
              </div>

              <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Enter Reference ID (e.g. SC-2026-00001)"
                    value={trackId}
                    onChange={(e) => setTrackId(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:bg-white transition-all"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="bg-primary-700 hover:bg-primary-800 text-white font-medium px-5 py-2.5 text-sm whitespace-nowrap shadow-xs transition-colors"
                >
                  Track Status
                </Button>
              </form>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link to="/report">
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<FilePlus2 className="w-5 h-5 text-white" />}
                  className="bg-primary-700 hover:bg-primary-800 text-white font-semibold shadow-sm px-6 py-3.5 text-sm sm:text-base transition-colors"
                >
                  Report an Issue
                </Button>
              </Link>

              <Link to="/register">
                <Button
                  variant="secondary"
                  size="lg"
                  leftIcon={<UserPlus className="w-5 h-5 text-slate-700" />}
                  className="bg-white hover:bg-slate-50 text-slate-800 font-semibold px-6 py-3.5 text-sm sm:text-base border border-slate-300 shadow-sm transition-colors"
                >
                  Create Citizen Account
                </Button>
              </Link>
            </div>

            {/* Trust Highlights */}
            <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-6 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Geotagged Photo Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Clear 24h–48h Turnaround</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary-700" />
                <span>Direct Citizen Feedback</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Municipal Operations Card */}
          <div className="lg:col-span-5 relative">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-lg p-6 space-y-4">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="text-sm font-heading font-bold text-slate-900">
                    Live Operations Overview
                  </h3>
                </div>
                <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-medium">
                  Ward 04 • Central Zone
                </span>
              </div>

              {/* KPI Summary */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 text-center">
                  <div className="text-base font-bold font-mono text-slate-900">18.4h</div>
                  <div className="text-[11px] text-slate-500 font-medium">Avg Fix Time</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 text-center">
                  <div className="text-base font-bold font-mono text-emerald-700">98.2%</div>
                  <div className="text-[11px] text-slate-500 font-medium">Resolved</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 text-center">
                  <div className="text-base font-bold font-mono text-slate-900">24 Crews</div>
                  <div className="text-[11px] text-slate-500 font-medium">Active Today</div>
                </div>
              </div>

              {/* Active Ticket Preview */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary-700">
                    TICKET #SC-2026-00104
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                    In Progress
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">Road Pothole Resurfacing</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-primary-700 shrink-0" /> 5th Avenue & Elm St, Ward 4
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Field Repair Status</span>
                    <span className="text-primary-700 font-semibold">75% Complete</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                  <span>Assigned: Roads Unit #07</span>
                  <span className="font-medium text-amber-700">Target: 6h remaining</span>
                </div>
              </div>

              {/* Recent Verified Activity */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Recent Verified Fixes
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/60">
                    <span className="text-slate-800 truncate mr-2">Water Main Leak Repaired (Ward 2)</span>
                    <span className="text-[11px] text-emerald-700 font-semibold shrink-0">Fixed in 4h</span>
                  </div>
                  <div className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/60">
                    <span className="text-slate-800 truncate mr-2">Streetlight Replaced (Park Lane)</span>
                    <span className="text-[11px] text-emerald-700 font-semibold shrink-0">Fixed in 12h</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. ABOUT THE PLATFORM
      ───────────────────────────────────────────────────────────── */}
      <section id="about" className="scroll-mt-[76px] bg-white border-b border-slate-200 py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-2xl sm:text-4xl font-heading font-bold text-slate-900 tracking-tight">
              Faster, More Transparent City Repairs
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              SmartCivic replaces slow manual complaint channels with direct communication between residents, ward engineers, and field crews. Every report is tracked publicly with time limits and photo verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:border-primary-600 hover:shadow-sm transition-all flex flex-col justify-between space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-primary-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="font-heading font-bold text-base text-slate-900">GPS & Photo Proof</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every issue includes precise location data and photos so maintenance teams can find and fix problems quickly without guesswork.
                </p>
              </div>
              <span className="text-xs text-emerald-700 font-medium pt-3 border-t border-slate-200/80 block">
                ✓ Accurate field locations
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:border-primary-600 hover:shadow-sm transition-all flex flex-col justify-between space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-primary-700 flex items-center justify-center font-bold">
                <Compass className="w-6 h-6" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="font-heading font-bold text-base text-slate-900">Duplicate Grouping</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  If multiple neighbors report the same issue within 50 meters, the system groups them together to increase priority.
                </p>
              </div>
              <span className="text-xs text-emerald-700 font-medium pt-3 border-t border-slate-200/80 block">
                ✓ Prevents duplicate work orders
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:border-primary-600 hover:shadow-sm transition-all flex flex-col justify-between space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-primary-700 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="font-heading font-bold text-base text-slate-900">Clear Turnaround Deadlines</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every category has a target resolution window. If a repair is delayed, it automatically escalates to senior supervisors.
                </p>
              </div>
              <span className="text-xs text-emerald-700 font-medium pt-3 border-t border-slate-200/80 block">
                ✓ 12h to 48h targets
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:border-primary-600 hover:shadow-sm transition-all flex flex-col justify-between space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-primary-700 flex items-center justify-center font-bold">
                <FileCheck className="w-6 h-6" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="font-heading font-bold text-base text-slate-900">Completed Fix Verification</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Field workers upload an after-repair photo before marking any ticket complete, allowing residents to verify the resolution.
                </p>
              </div>
              <span className="text-xs text-emerald-700 font-medium pt-3 border-t border-slate-200/80 block">
                ✓ Verified before closure
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. HOW IT WORKS
      ───────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-[76px] bg-slate-50 border-b border-slate-200 py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
              How City Issues Get Resolved
            </h2>
            <p className="text-base text-slate-600">
              From your phone straight to the repair crew on site in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors group"
                >
                  <div className="h-36 overflow-hidden bg-slate-100 relative">
                    <img
                      src={s.image}
                      alt={s.title}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/95 font-mono font-bold text-xs text-slate-900 flex items-center justify-center shadow-xs">
                      {s.step}
                    </div>
                  </div>
                  <div className="p-5 space-y-2 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-primary-700 flex items-center justify-center font-bold mb-2">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-heading font-bold text-slate-900">{s.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. COVERED DEPARTMENTS DIRECTORY
      ───────────────────────────────────────────────────────────── */}
      <section id="departments" className="scroll-mt-[76px] bg-white border-b border-slate-200 py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                Departments & Expected Resolution Times
              </h2>
              <p className="text-base text-slate-600 max-w-xl">
                Issues are automatically routed to the right engineering team based on category and location.
              </p>
            </div>

            <Link to="/report">
              <Button variant="outline" size="sm" className="font-medium whitespace-nowrap text-slate-700 border-slate-300">
                <FilePlus2 className="w-4 h-4 mr-1.5" /> Submit a New Issue
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept, idx) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between group"
              >
                <div className="h-44 overflow-hidden bg-slate-100 relative">
                  <img
                    src={dept.image}
                    alt={dept.name}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-4">
                    <span className="text-xs font-medium text-white bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md">
                      {dept.division}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-heading font-bold text-slate-900">{dept.name}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">{dept.desc}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Expected Resolution</span>
                    <span className="font-semibold text-primary-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {dept.sla}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. CALL TO ACTION BANNER
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-800">
            <div className="text-center max-w-2xl mx-auto space-y-6">
              <h2 className="text-2xl sm:text-4xl font-heading font-bold text-white tracking-tight">
                Help Us Keep Our City Clean and Safe
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                Whether you want to report a broken streetlight or track ongoing road repairs in your neighborhood, SmartCivic makes municipal maintenance open and accessible.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center items-center gap-3.5 pt-2">
                <Link to="/report">
                  <Button
                    variant="primary"
                    size="lg"
                    leftIcon={<FilePlus2 className="w-5 h-5 text-white" />}
                    className="bg-primary-700 hover:bg-primary-600 text-white font-semibold px-6 py-3.5 text-sm sm:text-base shadow-sm transition-all"
                  >
                    Report an Issue Now
                  </Button>
                </Link>

                <Link to="/register">
                  <Button
                    variant="secondary"
                    size="lg"
                    leftIcon={<UserPlus className="w-5 h-5 text-slate-900" />}
                    className="bg-white hover:bg-slate-100 text-slate-900 font-semibold px-6 py-3.5 text-sm sm:text-base border border-slate-200 transition-all shadow-sm"
                  >
                    Create Citizen Account
                  </Button>
                </Link>

                <Link
                  to="/track"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Search className="w-4 h-4 text-teal-400" />
                  <span>Track Existing Ticket</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center">
              <span className="font-heading font-bold text-xl text-white">SmartCivic</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Civic issue reporting and public infrastructure maintenance tracking for citizens and municipal staff.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase text-slate-300 tracking-wider">Quick Navigation</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li><Link to="/report" className="hover:text-white transition-colors">Report an Issue</Link></li>
              <li><Link to="/track" className="hover:text-white transition-colors">Track Status</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Create Citizen Account</Link></li>
              <li><button type="button" onClick={() => setAuthRoleModalOpen(true)} className="hover:text-white transition-colors cursor-pointer text-left">Staff & Citizen Login</button></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase text-slate-300 tracking-wider">Information</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li><button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors cursor-pointer text-left">About the Platform</button></li>
              <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors cursor-pointer text-left">How It Works</button></li>
              <li><button onClick={() => scrollToSection('departments')} className="hover:text-white transition-colors cursor-pointer text-left">Department Turnaround</button></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} SmartCivic. City Issue Reporting Platform.</p>
          <p className="text-slate-500">Transparent & Accountable Municipal Service</p>
        </div>
      </footer>

      {/* Role-Based Authentication Modal */}
      <AuthRoleModal
        isOpen={authRoleModalOpen}
        onClose={() => setAuthRoleModalOpen(false)}
      />
    </div>
  );
};
