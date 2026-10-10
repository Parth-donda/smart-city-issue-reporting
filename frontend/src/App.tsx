import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home, FilePlus2, Search, LayoutDashboard } from 'lucide-react';
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
    if (path === '/') return 'home';
    if (path.startsWith('/report')) return 'report';
    if (path.startsWith('/track')) return 'track';
    if (path.includes('citizen')) return 'citizen-dashboard';
    if (path.includes('officer')) return 'officer-dashboard';
    if (path.includes('worker')) return 'worker-dashboard';
    if (path.includes('supervisor')) return 'supervisor-dashboard';
    if (path.includes('admin')) return 'admin-dashboard';
    return 'home';
  };

  const handleNav = (id: string) => {
    if (id === 'home') navigate('/');
    else if (id === 'report') navigate(user ? '/report' : '/login?redirect=/report');
    else if (id === 'track') navigate('/track');
    else if (id === 'citizen-dashboard') navigate('/citizen');
    else if (id === 'officer-dashboard') navigate('/officer');
    else if (id === 'worker-dashboard') navigate('/worker');
    else if (id === 'supervisor-dashboard') navigate('/supervisor');
    else if (id === 'admin-dashboard') navigate('/admin');
    else if (id === 'dashboard') {
      if (user) {
        const role = user.role;
        if (role === 'CITIZEN') navigate('/citizen');
        else if (role === 'DEPARTMENT_OFFICER') navigate('/officer');
        else if (role === 'WORKER') navigate('/worker');
        else if (role === 'SUPERVISOR') navigate('/supervisor');
        else navigate('/admin');
      } else {
        navigate('/login');
      }
    }
  };

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'report', label: 'Report Issue', icon: FilePlus2 },
    { id: 'track', label: 'Track Status', icon: Search },
    { id: 'dashboard', label: user ? 'My Workspace' : 'Sign In / Portal', icon: LayoutDashboard },
  ];

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
      <MobileBottomNav activeId={getActiveId()} onChange={handleNav} />
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
