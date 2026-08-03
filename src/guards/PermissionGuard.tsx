import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import type { Permission } from '../types/auth.types';

interface PermissionGuardProps {
  children: React.ReactNode;
  permissions: Permission[];
  requireAll?: boolean;
  fallback?: string;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permissions,
  requireAll = false,
  fallback = '/dashboard',
}) => {
  const { hasPermission } = useAuthStore();

  const hasAccess = requireAll
    ? permissions.every((p) => hasPermission(p))
    : permissions.some((p) => hasPermission(p));

  if (!hasAccess) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};
