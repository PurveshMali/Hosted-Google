import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../store/authStore';

interface Props {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const ROLE_HOME: Record<UserRole, string> = {
  ngo_admin: '/ngo/dashboard',
  field_reporter: '/reporter/report',
  volunteer: '/volunteer',
  community_member: '/community',
  super_admin: '/ngo/dashboard',
};

export const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // 1. Not Authenticated? Redirect to Login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Mandatory Password Reset for Reporters
  if (user.must_reset_password && location.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" replace />;
  }

  // 3. Unauthorized Role? Redirect to their own home
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }

  // 4. All good
  return <>{children}</>;
};
