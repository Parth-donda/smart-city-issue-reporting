import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, getDashboardRouteForRole } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { Skeleton } from '../ui/Skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="rectangular" height={160} />
          <Skeleton variant="text" width="40%" height={16} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the user's appropriate role dashboard
    const userHome = getDashboardRouteForRole(user.role);
    return <Navigate to={userHome} replace />;
  }

  return <>{children}</>;
};
