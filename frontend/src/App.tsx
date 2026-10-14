import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Home,
  FilePlus2,
  Search,
  Inbox,
  FolderKanban,
  MapPin,
  Wrench,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Layers,
  Clock,
  LogIn,
  Flame,
  BarChart3,
  Users
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppShell, NavItem } from './components/layout/AppShell';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ReportIssuePage } from './pages/ReportIssuePage';
import { TrackIssuePage } from './pages/TrackIssuePage';
import { CitizenDashboard } from './pages/dashboards/CitizenDashboard';
import { OfficerDashboard } from './pages/dashboards/OfficerDashboard';
import { WorkerDashboard } from './pages/dashboards/WorkerDashboard';
import { SupervisorDashboard } from './pages/dashboards/SupervisorDashboard';
import { AdminDashboard } from './pages/dashboards/AdminDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ShellWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const getActiveId = () => {
    const path = location.pathname;
    const search = location.search;

    if (path === '/') return 'home';
    if (path.startsWith('/report')) return 'report';
    if (path.startsWith('/track')) return 'track';

    if (path.includes('citizen')) {
      if (search.includes('tab=resolved')) return 'citizen-resolved';
      if (search.includes('tab=in_progress') || search.includes('tab=under_review')) return 'citizen-active';
      return 'citizen-dashboard';
    }

    if (path.includes('officer')) {
      if (search.includes('view=map')) return 'officer-map';
      if (search.includes('tab=new_intake') || search.includes('tab=new')) return 'officer-new';
      if (search.includes('tab=sla_breached') || search.includes('tab=sla')) return 'officer-sla';
      if (search.includes('tab=assigned') || search.includes('tab=in_field')) return 'officer-assigned';
      return 'officer-dashboard';
    }

    if (path.includes('worker')) {
      if (search.includes('tab=completed')) return 'worker-completed';
      return 'worker-active';
    }

    if (path.includes('supervisor')) return 'supervisor-dashboard';

    if (path.includes('admin')) {
      if (search.includes('tab=map') || search.includes('tab=gis')) return 'admin-map';
      if (search.includes('tab=analytics')) return 'admin-analytics';
      if (search.includes('tab=routing') || search.includes('tab=categories')) return 'admin-routing';
      if (search.includes('tab=sla')) return 'admin-sla';
      if (search.includes('tab=audit')) return 'admin-audit';
      return 'admin-issues';
    }

    return 'home';
  };

  const handleNav = (id: string) => {
    switch (id) {
      case 'home':
        navigate('/');
        break;
      case 'report':
        navigate(user ? '/report' : '/login?redirect=/report');
        break;
      case 'track':
        navigate('/track');
        break;
      case 'login':
        navigate('/login');
        break;

      // Citizen
      case 'citizen-dashboard':
        navigate('/citizen');
        break;
      case 'citizen-active':
        navigate('/citizen?tab=in_progress');
        break;
      case 'citizen-resolved':
        navigate('/citizen?tab=resolved');
        break;

      // Officer
      case 'officer-dashboard':
        navigate('/officer?view=queue&tab=all');
        break;
      case 'officer-new':
        navigate('/officer?view=queue&tab=new_intake');
        break;
      case 'officer-sla':
        navigate('/officer?view=queue&tab=sla_breached');
        break;
      case 'officer-assigned':
        navigate('/officer?view=queue&tab=assigned');
        break;
      case 'officer-map':
        navigate('/officer?view=map');
        break;

      // Worker
      case 'worker-active':
        navigate('/worker?tab=active');
        break;
      case 'worker-completed':
        navigate('/worker?tab=completed');
        break;

      // Supervisor
      case 'supervisor-dashboard':
        navigate('/supervisor');
        break;

      // Admin
      case 'admin-issues':
        navigate('/admin?tab=issues');
        break;
      case 'admin-map':
        navigate('/admin?tab=map');
        break;
      case 'admin-analytics':
        navigate('/admin?tab=analytics');
        break;
      case 'admin-routing':
        navigate('/admin?tab=routing');
        break;
      case 'admin-sla':
        navigate('/admin?tab=sla');
        break;
      case 'admin-audit':
        navigate('/admin?tab=audit');
        break;

      default:
        navigate('/');
    }
  };

  const getNavItems = (): NavItem[] => {
    switch (user?.role) {
      case 'CITIZEN':
        return [
          { id: 'citizen-dashboard', label: 'All My Grievances', icon: FolderKanban },
          { id: 'citizen-active', label: 'In Progress / Active', icon: Clock },
          { id: 'citizen-resolved', label: 'Resolved Tickets', icon: CheckCircle2 },
          { id: 'report', label: 'File New Grievance', icon: FilePlus2 },
          { id: 'track', label: 'Track Reference ID', icon: Search },
          { id: 'home', label: 'Public Portal', icon: Home },
        ];

      case 'DEPARTMENT_OFFICER':
        return [
          { id: 'officer-dashboard', label: 'Command Triage Desk', icon: Inbox },
          { id: 'officer-new', label: 'New Intake (Pending)', icon: FileText },
          { id: 'officer-sla', label: 'SLA Breaches & Alerts', icon: Clock },
          { id: 'officer-assigned', label: 'Field Crew Dispatches', icon: Users },
          { id: 'officer-map', label: 'Ward GIS & Heatmap', icon: MapPin },
          { id: 'track', label: 'Track Reference ID', icon: Search },
          { id: 'home', label: 'Public Portal', icon: Home },
        ];

      case 'WORKER':
        return [
          { id: 'worker-active', label: 'Active Work Orders', icon: Wrench },
          { id: 'worker-completed', label: 'Completed Repairs', icon: CheckCircle2 },
          { id: 'track', label: 'Track Reference ID', icon: Search },
          { id: 'home', label: 'Public Portal', icon: Home },
        ];

      case 'SUPERVISOR':
        return [
          { id: 'supervisor-dashboard', label: 'Quality Verification Desk', icon: ShieldCheck },
          { id: 'track', label: 'Track Reference ID', icon: Search },
          { id: 'home', label: 'Public Portal', icon: Home },
        ];

      case 'MUNICIPAL_ADMIN':
      case 'SYSTEM_ADMIN':
        return [
          { id: 'admin-issues', label: 'City Grievance Master', icon: FileText },
          { id: 'admin-map', label: 'GIS Hotspot Analysis', icon: Flame },
          { id: 'admin-analytics', label: 'Citywide Analytics', icon: BarChart3 },
          { id: 'admin-routing', label: 'Automated Routing Engine', icon: Layers },
          { id: 'admin-sla', label: 'Department SLA Matrix', icon: Clock },
          { id: 'admin-audit', label: 'Security & Audit Ledger', icon: ShieldCheck },
          { id: 'track', label: 'Track Reference ID', icon: Search },
          { id: 'home', label: 'Public Portal', icon: Home },
        ];

      default:
        return [
          { id: 'home', label: 'Civic Home', icon: Home },
          { id: 'report', label: 'Report Civic Issue', icon: FilePlus2 },
          { id: 'track', label: 'Track Grievance Status', icon: Search },
          { id: 'login', label: 'Officer / Staff Portal', icon: LogIn },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      <AppShell
        activeNavId={getActiveId()}
        onNavigate={handleNav}
        navItems={navItems}
        userName={user ? `${user.first_name || user.username}` : 'Citizen Guest'}
        userRole={user?.role as any || 'Public Citizen'}
      >
        {children}
      </AppShell>
      <MobileBottomNav activeId={getActiveId()} onChange={handleNav} items={navItems} />
    </>
  );
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Standalone Homepage Landing View */}
            <Route path="/" element={<HomePage />} />
            
            {/* Public Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Citizen Issue Reporting: Requires Authentication */}
            <Route
              path="/report"
              element={
                <ProtectedRoute>
                  <ShellWrapper>
                    <ReportIssuePage />
                  </ShellWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/track"
              element={
                <ShellWrapper>
                  <TrackIssuePage />
                </ShellWrapper>
              }
            />
            <Route
              path="/track/:issueId"
              element={
                <ShellWrapper>
                  <TrackIssuePage />
                </ShellWrapper>
              }
            />
            
            {/* Protected Role Dashboards */}
            <Route
              path="/citizen"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                  <ShellWrapper>
                    <CitizenDashboard />
                  </ShellWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/officer"
              element={
                <ProtectedRoute allowedRoles={['DEPARTMENT_OFFICER']}>
                  <ShellWrapper>
                    <OfficerDashboard />
                  </ShellWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/worker"
              element={
                <ProtectedRoute allowedRoles={['WORKER']}>
                  <ShellWrapper>
                    <WorkerDashboard />
                  </ShellWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/supervisor"
              element={
                <ProtectedRoute allowedRoles={['SUPERVISOR']}>
                  <ShellWrapper>
                    <SupervisorDashboard />
                  </ShellWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['MUNICIPAL_ADMIN', 'SYSTEM_ADMIN']}>
                  <ShellWrapper>
                    <AdminDashboard />
                  </ShellWrapper>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
