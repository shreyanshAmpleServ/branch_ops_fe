import { useAuthStore } from '../store/useAuthStore';
import type { Permission } from '../types/auth.types';

export const usePermission = () => {
  const { user, hasPermission, hasRole } = useAuthStore();

  const can = (permission: Permission): boolean => hasPermission(permission);
  const canAny = (permissions: Permission[]): boolean => permissions.some((p) => hasPermission(p));
  const canAll = (permissions: Permission[]): boolean => permissions.every((p) => hasPermission(p));
  const isRole = (role: string): boolean => hasRole(role);
  const isAdmin = (): boolean => hasRole('admin');
  const isManager = (): boolean => hasRole('manager') || hasRole('admin');

  return { can, canAny, canAll, isRole, isAdmin, isManager, user };
};
