import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Building2, Plus, Edit2, Trash2, 
  X, Check, MapPin, CheckCircle2, 
  XCircle
} from 'lucide-react';
import { 
  useBranchesList, useCreateBranch, useUpdateBranch, useDeleteBranch
} from './api/useBranches';
import type { Branch } from './api/useBranches';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/table';
import type { RowAction } from '../../components/table/DataTable';
import { useDesignStore } from '../../store/useDesignStore';

export const BranchSetup: React.FC = () => {
  const { activeDesign } = useDesignStore();
  const isGlass = activeDesign === 'design1';
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // API hooks
  const { data: branchesResponse, isLoading } = useBranchesList({
    activeOnly: statusFilter === 'active' ? true : undefined
  });
  
  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();
  const deleteMutation = useDeleteBranch();

  // Drawer / Side Panel State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState({ code: '', name: '', address: '', active: true });

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const branches = branchesResponse?.data || [];
  
  // Client side filtering for inactive (as backend only does activeOnly)
  const filteredBranches = branches.filter(b => {
    if (statusFilter === 'inactive') return !b.active;
    return true;
  });

  const openDrawer = (branch: Branch | null = null) => {
    if (branch) {
      setEditingBranch(branch);
      setForm({
        code: branch.code,
        name: branch.name,
        address: branch.address || '',
        active: branch.active
      });
    } else {
      setEditingBranch(null);
      setForm({ code: '', name: '', address: '', active: true });
    }
    setIsDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) return;

    try {
      if (editingBranch) {
        await updateMutation.mutateAsync({
          id: editingBranch.id,
          payload: form
        });
      } else {
        await createMutation.mutateAsync(form);
      }
      setIsDrawerOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleBranchStatus = async (branch: Branch) => {
    try {
      await updateMutation.mutateAsync({
        id: branch.id,
        payload: { active: !branch.active }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const cardStyle = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
  };

  const inputCls = isGlass
    ? 'glass-input w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-200'
    : `w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 border focus:ring-2 focus:ring-primary/20 focus:border-primary`;

  const inputStyle = isGlass ? undefined : {
    background: 'var(--color-surface)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text)',
  };

  // Define Columns
  const columns: ColumnDef<Branch, unknown>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-xs uppercase font-bold">
          {row.original.code}
        </span>
      )
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-bold" style={{ color: 'var(--color-text)' }}>{row.original.name}</span>
    },
    {
      accessorKey: 'address',
      header: 'Physical Address',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 truncate max-w-xs">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
          <span className="truncate" style={{ color: 'var(--color-text-secondary)' }}>{row.original.address || '—'}</span>
        </div>
      )
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ row }) => (
        <button
          onClick={() => toggleBranchStatus(row.original)}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
            row.original.active 
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
          }`}
        >
          {row.original.active ? 'Active' : 'Inactive'}
        </button>
      )
    }
  ];

  // Define Row Actions
  const rowActions: RowAction<Branch>[] = [
    {
      label: 'Edit',
      icon: <Edit2 className="w-3.5 h-3.5 text-primary" />,
      onClick: (row) => openDrawer(row)
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (row) => setDeleteConfirmId(row.id),
      variant: 'danger'
    }
  ];

  return (
    <div className="page-container p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <Building2 className="h-7 w-7 text-primary" /> Branch Setup
          </h1>
          <p className="text-sm opacity-70 mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Configure company Business Places, assigned addresses, status and routing credentials.
          </p>
        </div>
        
        <button
          onClick={() => openDrawer()}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-lg bg-primary hover:bg-primary-hover hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus className="h-4.5 w-4.5" />
          Create New Branch
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div style={cardStyle} className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Total Business Places</span>
            <h3 className="text-3xl font-black mt-1" style={{ color: 'var(--color-text)' }}>{filteredBranches.length}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-primary/10 text-primary">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div style={cardStyle} className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Active Branches</span>
            <h3 className="text-3xl font-black mt-1 text-emerald-500">{filteredBranches.filter(b => b.active).length}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div style={cardStyle} className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Inactive / Disabled</span>
            <h3 className="text-3xl font-black mt-1 text-rose-500">{filteredBranches.filter(b => !b.active).length}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-500">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Unified DataTable Component */}
      <DataTable
        data={filteredBranches}
        columns={columns}
        rowActions={rowActions}
        isLoading={isLoading}
        enableRowSelection
        enableExport
        exportFileName="branches-list"
        enableViewToggle
        defaultViewMode="table"
        extraFilters={
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="input-base py-1.5 px-3 text-xs rounded-xl cursor-pointer"
              style={{ background: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        }
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div style={cardStyle} className="p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Confirm Deletion</h3>
            <p className="text-sm opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
              Are you sure you want to permanently remove this branch? This action is irreversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold border hover:bg-black/5 transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side Slide-out Drawer Panel (Bootstrap Offcanvas style) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
            />

            <motion.div
              className={`relative w-full max-w-5xl h-full shadow-2xl flex flex-col z-10 ${isGlass ? 'glass-card border-l backdrop-blur-2xl' : ''}`}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              style={!isGlass ? { background: 'var(--color-background)', borderLeft: '1px solid var(--color-border)' } : { borderLeftColor: 'var(--color-border)' }}
            >
              <div className="p-6 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                  <Building2 className="w-5 h-5 text-primary" /> {editingBranch ? 'Modify Branch Setup' : 'Create New Branch'}
                </h2>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-xl hover:bg-black/5 border transition-colors"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-70">Branch Code *</label>
                  <input
                    className={inputCls}
                    style={inputStyle}
                    type="text"
                    required
                    placeholder="e.g. BR001"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-70">Branch Name *</label>
                  <input
                    className={inputCls}
                    style={inputStyle}
                    type="text"
                    required
                    placeholder="e.g. Main HQ"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-70">Physical Address</label>
                  <textarea
                    className={inputCls}
                    style={inputStyle}
                    rows={4}
                    placeholder="Physical address, city, state..."
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                  <div>
                    <h4 className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>Active Status</h4>
                    <p className="text-[10px] opacity-60 mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Whether this place is open for transactions</p>
                  </div>
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded accent-primary cursor-pointer"
                    checked={form.active}
                    onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  />
                </div>

                <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-lg bg-primary hover:bg-primary-hover disabled:opacity-60 transition-all duration-200"
                  >
                    <Check className="w-4 h-4" />
                    {editingBranch ? 'Update Business Place' : 'Create Business Place'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default BranchSetup;
