export type UserRole = 'admin' | 'manager' | 'user' | 'viewer';

export type Permission =
  | 'contacts.view' | 'contacts.create' | 'contacts.edit' | 'contacts.delete'
  | 'leads.view' | 'leads.create' | 'leads.edit' | 'leads.delete'
  | 'deals.view' | 'deals.create' | 'deals.edit' | 'deals.delete'
  | 'tasks.view' | 'tasks.create' | 'tasks.edit' | 'tasks.delete'
  | 'analytics.view'
  | 'settings.view' | 'settings.edit'
  | 'users.view' | 'users.create' | 'users.edit' | 'users.delete';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  permissions: Permission[];
  phone?: string;
  company?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  company?: string;
  phone?: string;
  agreeToTerms: boolean;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface RolePermissions {
  [key: string]: Permission[];
}

export const ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    'contacts.view', 'contacts.create', 'contacts.edit', 'contacts.delete',
    'leads.view', 'leads.create', 'leads.edit', 'leads.delete',
    'deals.view', 'deals.create', 'deals.edit', 'deals.delete',
    'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete',
    'analytics.view',
    'settings.view', 'settings.edit',
    'users.view', 'users.create', 'users.edit', 'users.delete',
  ],
  manager: [
    'contacts.view', 'contacts.create', 'contacts.edit',
    'leads.view', 'leads.create', 'leads.edit', 'leads.delete',
    'deals.view', 'deals.create', 'deals.edit',
    'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete',
    'analytics.view',
    'settings.view',
    'users.view',
  ],
  user: [
    'contacts.view', 'contacts.create', 'contacts.edit',
    'leads.view', 'leads.create', 'leads.edit',
    'deals.view', 'deals.create',
    'tasks.view', 'tasks.create', 'tasks.edit',
    'analytics.view',
  ],
  viewer: [
    'contacts.view',
    'leads.view',
    'deals.view',
    'tasks.view',
    'analytics.view',
  ],
};
