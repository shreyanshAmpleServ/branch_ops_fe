import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserCheck, UserX, Shield, Edit2, Phone, Mail,
  RefreshCw, TrendingUp, BarChart3
} from 'lucide-react';
import { useUsers, useUpdateUser, getUserAvatarUrl, type ApiUser, type UpdateUserPayload } from './api/useUsers';
import { useAuthStore } from '../../store/useAuthStore';
import { UserEditCanvas } from './UserEditCanvas';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/table';
import { Badge } from '../../components/ui';
import type { RowAction } from '../../components/table/DataTable';

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const isCurrentUserAdmin = currentUser?.role === 'admin';

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'Y' | 'N' | 'all'>('all');
  const [page, setPage] = useState(1);
  const [editUser, setEditUser] = useState<ApiUser | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const searchTimer = useRef<any>(null);

  const { data, isLoading, refetch } = useUsers({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    active: activeFilter === 'all' ? undefined : activeFilter,
  });

  const updateUser = useUpdateUser();

  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 350);
  };

  const handleSave = async (id: number, payload: UpdateUserPayload) => {
    await updateUser.mutateAsync({ id, payload });
    setEditUser(null);
    setSuccessMsg('User updated successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const stats = data?.stats ?? { total: 0, active: 0, inactive: 0, admins: 0 };
  const users = data?.users ?? [];
  const pagination = data?.pagination;

  // Define Columns
  const columns: ColumnDef<ApiUser, unknown>[] = [
    {
      accessorKey: 'fullName',
      header: 'USER',
      cell: ({ row }) => {
        const u = row.original;
        const avatarUrl = getUserAvatarUrl(u.profileImg);
        return (
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={u.fullName}
                className="h-9 w-9 rounded-lg object-cover ring-1 ring-border"
              />
            ) : (
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: 'var(--color-primary)' }}
              >
                {(u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')}
              </div>
            )}
            <div>
              <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--color-text)' }}>
                {u.fullName}
              </p>
              {u.code && (
                <p className="text-xs mt-0.5 opacity-90" style={{ color: 'var(--color-text-secondary)' }}>
                  {u.code}
                </p>
              )}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'email',
      header: 'CONTACT INFO',
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className=" text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
            {u.email && (
              <p className="flex items-center gap-1.5">
                <Mail className="h-3 w-3 shrink-0" /> {u.email}
              </p>
            )}
            {u.mobileNo && (
              <p className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 shrink-0" /> {u.mobileNo}
              </p>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'department',
      header: 'DEPARTMENT',
      cell: ({ row }) => <span style={{ color: 'var(--color-text-secondary)' }}>{row.original.department || '—'}</span>
    },
    {
      accessorKey: 'isAdmin',
      header: 'ROLE',
      cell: ({ row }) => (
        <Badge variant={row.original.isAdmin ? 'error' : 'primary'} dot>
          {row.original.isAdmin ? 'Admin' : 'User'}
        </Badge>
      )
    },
    {
      accessorKey: 'active',
      header: 'STATUS',
      cell: ({ row }) => (
        <Badge variant={row.original.active ? 'success' : 'default'} dot>
          {row.original.active ? 'Active' : 'Inactive'}
        </Badge>
      )
    }
  ];

  // Define Row Actions
  const rowActions: RowAction<ApiUser>[] = [
    {
      label: 'Edit Profile',
      icon: <Edit2 className="h-3.5 w-3.5" />,
      onClick: (row) => setEditUser(row)
    }
  ];

  // Stats Card data
  const statCards = [
    { label: 'Total Users', value: stats.total, icon: Users, color: 'var(--color-primary)', bg: 'var(--color-primary)/10' },
    { label: 'Active', value: stats.active, icon: UserCheck, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Inactive', value: stats.inactive, icon: UserX, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    { label: 'Admins', value: stats.admins, icon: Shield, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  ];


  return (
    <div className="p-4 space-y-4 w-full max-w-full animate-fade-in">
      {/* Top Header Card Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl p-4 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
            style={{ background: 'var(--color-primary-50, rgba(99,102,241,0.08))', border: '1px solid var(--color-primary-200, rgba(99,102,241,0.2))' }}
          >
            <Users className="w-4.5 h-4.5" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              User Management
            </h1>
            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5">
              Manage system users, access credentials, roles, and permissions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200/90 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700/70 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-xl text-xs font-medium text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2"
          >
            <UserCheck className="h-4 w-4" /> {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic KPI Stats Cards Row (Real counts from API) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Users */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <div className="w-5.5 h-5.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Users className="w-3 h-3" />
              </div>
              Total Users
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{isLoading ? '—' : stats.total}</div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              Registered staff
            </div>
          </div>
          <div className="text-blue-500/60 dark:text-blue-400/50">
            <BarChart3 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 2: Active Users */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <div className="w-5.5 h-5.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <UserCheck className="w-3 h-3" />
              </div>
              Active Users
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{isLoading ? '—' : stats.active}</div>
            <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              Enabled logins
            </div>
          </div>
          <div className="text-emerald-500/60 dark:text-emerald-400/50">
            <UserCheck className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 3: Inactive Users */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <div className="w-5.5 h-5.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center">
                <UserX className="w-3 h-3" />
              </div>
              Inactive Users
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{isLoading ? '—' : stats.inactive}</div>
            <div className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
              Disabled accounts
            </div>
          </div>
          <div className="text-rose-500/60 dark:text-rose-400/50">
            <UserX className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 4: Administrators */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <div className="w-5.5 h-5.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Shield className="w-3 h-3" />
              </div>
              Administrators
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{isLoading ? '—' : stats.admins}</div>
            <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
              Full system privileges
            </div>
          </div>
          <div className="text-amber-500/60 dark:text-amber-400/50">
            <Shield className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>
      </div>

      {/* Unified DataTable Component */}
      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        <DataTable
          data={users}
          columns={columns}
          rowActions={rowActions}
        isLoading={isLoading}
        enableRowSelection
        enableExport
        exportFileName="users-list"
        enableViewToggle
        defaultViewMode="table"
        enableSearch={true}
        searchValue={search}
        onSearchChange={handleSearchChange}
        extraFilters={
          <div className="flex items-center gap-1.5 mr-2">
            <span className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>Status:</span>
            <select
              value={activeFilter}
              onChange={(e) => { setActiveFilter(e.target.value as any); setPage(1); }}
              className="input-base py-1.5 px-3 text-xs rounded-xl cursor-pointer"
              style={{ background: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              <option value="all">All</option>
              <option value="Y">Active</option>
              <option value="N">Inactive</option>
            </select>
          </div>
        }
        serverPagination={pagination ? {
          total: pagination.total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: pagination.totalPages,
          onPageChange: setPage,
        } : undefined}
        />
      </div>

      {/* Edit Canvas overlay */}
      <AnimatePresence>
        {editUser && (
          <UserEditCanvas
            user={editUser}
            onClose={() => setEditUser(null)}
            onSave={handleSave}
            isSaving={updateUser.isPending}
            isCurrentUserAdmin={isCurrentUserAdmin}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
export default UserManagement;
