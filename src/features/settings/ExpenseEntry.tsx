import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/table';
import { Button, Badge, Modal, Input, Select } from '../../components/ui';
import { 
  useExpenseEntries, useCreateExpenseEntry, useUpdateExpenseEntry, useDeleteExpenseEntry 
} from './api/useExpenseEntry';
import type { ExpenseEntry as EntryItem } from './api/useExpenseEntry';
import { useExpenses } from '../users/api/useMasterData';
import type { RowAction } from '../../components/table/DataTable';

export const ExpenseEntryPage: React.FC = () => {
  const [search] = useState('');
  const { data: entriesResponse, isLoading } = useExpenseEntries(search || undefined);
  const { data: expenseTypesResponse } = useExpenses();
  
  const createMutation = useCreateExpenseEntry();
  const updateMutation = useUpdateExpenseEntry();
  const deleteMutation = useDeleteExpenseEntry();

  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EntryItem | null>(null);
  const [form, setForm] = useState({ expenseTypeId: '', amount: '', remarks: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EntryItem | null>(null);

  const entries = entriesResponse?.data || [];
  const expenseTypes = expenseTypesResponse?.data || [];

  const expenseTypeOptions = expenseTypes.map(et => ({
    value: String(et.id),
    label: `${et.type} - ${et.description}`,
  }));

  const openForm = (entry: EntryItem | null = null) => {
    if (entry) {
      setEditingEntry(entry);
      setForm({
        expenseTypeId: String(entry.expenseTypeId),
        amount: String(entry.amount),
        remarks: entry.remarks || ''
      });
    } else {
      setEditingEntry(null);
      setForm({ expenseTypeId: '', amount: '', remarks: '' });
    }
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.expenseTypeId || !form.amount) return;

    try {
      const payload = {
        expenseTypeId: parseInt(form.expenseTypeId),
        amount: parseFloat(form.amount),
        remarks: form.remarks
      };

      if (editingEntry) {
        await updateMutation.mutateAsync({ id: editingEntry.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setShowForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = (entry: EntryItem) => {
    setDeleteTarget(entry);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Column definitions matching the Deals pattern
  const columns: ColumnDef<EntryItem, unknown>[] = [
    {
      accessorKey: 'expenseDate',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs font-medium">{row.original.expenseDate}</span>
      ),
    },
    {
      accessorKey: 'expenseType',
      header: 'Expense Type',
      cell: ({ row }) => (
        <Badge variant="primary" dot>{row.original.expenseType}</Badge>
      ),
    },
    {
      accessorKey: 'remarks',
      header: 'Remarks / Description',
      cell: ({ row }) => (
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {row.original.remarks || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-semibold">
          {row.original.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  const rowActions: RowAction<EntryItem>[] = [
    {
      label: 'Edit',
      icon: <Edit2 className="h-3.5 w-3.5" />,
      onClick: (row) => openForm(row),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: (row) => confirmDelete(row),
      variant: 'danger',
    },
  ];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-0.5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Expense Entries</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{entries.length} entries</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => openForm()}>Add Expense</Button>
      </div>

      <DataTable
        data={entries}
        columns={columns}
        enableRowSelection
        enableExport
        exportFileName="expense-entries"
        isLoading={isLoading}
        rowActions={rowActions}
      />

      {/* Add / Edit Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingEntry ? 'Modify Expense Entry' : 'Add Expense Entry'} size="lg">
        <form className="space-y-4" onSubmit={handleSave}>
          <Select
            label="Expense Category"
            options={expenseTypeOptions}
            value={form.expenseTypeId}
            onChange={(e) => setForm(f => ({ ...f, expenseTypeId: e.target.value }))}
          />
          <Input
            label="Amount"
            type="number"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
          />
          <Input
            label="Remarks / Purpose"
            placeholder="Optional notes..."
            value={form.remarks}
            onChange={(e) => setForm(f => ({ ...f, remarks: e.target.value }))}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">{editingEntry ? 'Update' : 'Save'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Confirm Delete" size="sm">
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Are you sure you want to delete this expense entry? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button onClick={handleDelete} className="bg-rose-500 hover:bg-rose-600 text-white border-0">Delete</Button>
        </div>
      </Modal>
    </div>
  );
};
export default ExpenseEntryPage;
