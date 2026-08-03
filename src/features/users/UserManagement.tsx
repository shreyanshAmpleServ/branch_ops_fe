import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserCheck, UserX, Shield, Edit2, Phone, Mail,
  RefreshCw
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
    <div className="page-container p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            User Management
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Manage system users, roles, and permissions
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-surface-hover"
          style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl text-sm font-medium text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2"
          >
            <UserCheck className="h-4 w-4" /> {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div
            key={s.label}
            className="rounded-2xl px-4 py-4 flex items-center gap-4"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
              <s.icon className="h-5 w-5" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                {s.label}
              </p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: s.color }}>
                {isLoading ? '—' : s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Unified DataTable Component */}
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
