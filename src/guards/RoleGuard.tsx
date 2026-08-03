import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import type { UserRole } from '../types/auth.types';

interface RoleGuardProps {
  children: React.ReactNode;
  roles: UserRole[];
  fallback?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, roles, fallback = '/dashboard' }) => {
  const { user } = useAuthStore();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};
