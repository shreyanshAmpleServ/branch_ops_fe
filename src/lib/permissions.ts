import type { Permission, UserRole } from '../types/auth.types';

export const PERMISSION_LABELS: Record<Permission, string> = {
  'contacts.view': 'View Contacts',
  'contacts.create': 'Create Contacts',
  'contacts.edit': 'Edit Contacts',
  'contacts.delete': 'Delete Contacts',
  'leads.view': 'View Leads',
  'leads.create': 'Create Leads',
  'leads.edit': 'Edit Leads',
  'leads.delete': 'Delete Leads',
  'deals.view': 'View Deals',
  'deals.create': 'Create Deals',
  'deals.edit': 'Edit Deals',
  'deals.delete': 'Delete Deals',
  'tasks.view': 'View Tasks',
  'tasks.create': 'Create Tasks',
  'tasks.edit': 'Edit Tasks',
  'tasks.delete': 'Delete Tasks',
  'analytics.view': 'View Analytics',
  'settings.view': 'View Settings',
  'settings.edit': 'Edit Settings',
  'users.view': 'View Users',
  'users.create': 'Create Users',
  'users.edit': 'Edit Users',
  'users.delete': 'Delete Users',
};

export const PERMISSION_GROUPS: Record<string, Permission[]> = {
  Contacts: ['contacts.view', 'contacts.create', 'contacts.edit', 'contacts.delete'],
  Leads: ['leads.view', 'leads.create', 'leads.edit', 'leads.delete'],
  Deals: ['deals.view', 'deals.create', 'deals.edit', 'deals.delete'],
  Tasks: ['tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete'],
  Analytics: ['analytics.view'],
  Settings: ['settings.view', 'settings.edit'],
  Users: ['users.view', 'users.create', 'users.edit', 'users.delete'],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  user: 'User',
  viewer: 'Viewer',
};

export const checkPermission = (userPermissions: Permission[], required: Permission): boolean => {
  return userPermissions.includes(required);
};

export const checkAnyPermission = (userPermissions: Permission[], required: Permission[]): boolean => {
  return required.some((p) => userPermissions.includes(p));
};

export const checkAllPermissions = (userPermissions: Permission[], required: Permission[]): boolean => {
  return required.every((p) => userPermissions.includes(p));
};
