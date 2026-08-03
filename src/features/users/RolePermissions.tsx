import React, { useState } from 'react';
import { Card, Switch } from '../../components/ui';
import { useAuthStore } from '../../store/useAuthStore';
import type { Permission } from '../../types/auth.types';

const ROLES = [
  { id: 'admin', label: 'Admin', desc: 'Full access to all modules and settings' },
  { id: 'manager', label: 'Manager', desc: 'Can manage most modules but restricted settings' },
  { id: 'user', label: 'User', desc: 'Standard access to daily operational modules' },
  { id: 'viewer', label: 'Viewer', desc: 'Read-only access across the platform' },
];

const MODULES = [
  { id: 'contacts', label: 'Contacts', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'leads', label: 'Leads', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'deals', label: 'Deals', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'tasks', label: 'Tasks', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'users', label: 'User Management', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'settings', label: 'Settings', actions: ['view', 'edit'] },
  { id: 'analytics', label: 'Analytics', actions: ['view'] },
];

export const RolePermissions: React.FC = () => {
  const [activeRole, setActiveRole] = useState<string>('manager');
  const { rolePermissions, toggleRolePermission } = useAuthStore();

  const currentPerms = rolePermissions[activeRole] || [];

  const handleToggle = (module: string, action: string, checked: boolean) => {
    const permString = `${module}.${action}` as Permission;
    toggleRolePermission(activeRole, permString, checked);
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Roles & Permissions</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Roles List */}
      <div className="w-full md:w-64 shrink-0 space-y-2">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-secondary)' }}>Roles</h3>
        {ROLES.map(role => (
          <button
            key={role.id}
            onClick={() => setActiveRole(role.id)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              activeRole === role.id 
                ? 'bg-primary/5 border-primary shadow-sm' 
                : 'bg-surface border-border hover:border-primary/50'
            }`}
          >
            <p className="font-semibold" style={{ color: activeRole === role.id ? 'var(--color-primary)' : 'var(--color-text)' }}>
              {role.label}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {role.desc}
            </p>
          </button>
        ))}
      </div>

      {/* Permissions Matrix */}
      <Card className="flex-1 overflow-hidden p-0">
        <div className="p-4 border-b border-border bg-surface-hover">
          <h3 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
            Permissions for {ROLES.find(r => r.id === activeRole)?.label}
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Configure what this role can see and do across the application.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Module</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--color-text-secondary)' }}>View</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--color-text-secondary)' }}>Create</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--color-text-secondary)' }}>Update</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--color-text-secondary)' }}>Delete</th>
              </tr>
            </thead>
            <tbody>
              {MODULES.map(mod => (
                <tr key={mod.id} className="border-b border-border hover:bg-surface-hover/30 transition-colors">
                  <td className="py-4 px-6 font-medium" style={{ color: 'var(--color-text)' }}>{mod.label}</td>
                  {['view', 'create', 'edit', 'delete'].map(action => {
                    const isValidAction = mod.actions.includes(action);
                    const permString = `${mod.id}.${action}`;
                    const hasPerm = currentPerms.includes(permString as Permission);
                    
                    return (
                      <td key={action} className="py-4 px-6 text-center">
                        {isValidAction ? (
                          <div className="flex justify-center">
                            <Switch
                              checked={hasPerm}
                              onChange={(e) => handleToggle(mod.id, action, e.target.checked)}
                              disabled={activeRole === 'admin'} // Admin permissions are usually locked
                            />
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      </div>
    </div>
  );
};
