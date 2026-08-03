import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Eye, Edit3, Trash2 } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/table';
import { Badge, DateRangePicker, type DateRange } from '../../components/ui';
import { useRetailers, type Retailer, useDeleteRetailer } from '../customers/api/useRetailers';
import { RetailerDetailCanvas } from '../customers/components/RetailerDetailCanvas';

export const SupplierList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [aprStatus, setAprStatus] = useState<string>('Y');
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);

  // React Query hooks for Approved Suppliers (CardType = 'S', AprStatus = 'Y')
  const { data: suppliers = [], isLoading } = useRetailers({
    cardType: 'S',
    search,
    aprStatus,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const deleteRetailer = useDeleteRetailer();

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete supplier "${name}"?`)) {
      await deleteRetailer.mutateAsync(id);
    }
  };

  const columns: ColumnDef<Retailer, unknown>[] = [
    {
      accessorKey: 'Code',
      header: 'CODE',
      cell: ({ row }) => (
        <span className="font-mono text-[13px] font-bold text-primary">
          {row.original.Code}
        </span>
      ),
    },
    {
      accessorKey: 'Name',
      header: 'SUPPLIER',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">

          <div>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--color-text)' }}>
              {row.original.Name}
            </p>
            <p className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
              {row.original.Email || row.original.OwnerEmail || 'No Email'}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'Balance',
      header: 'BALANCE',
      cell: ({ row }) => (
        <span className="text-[13px] font-mono font-semibold" style={{ color: 'var(--color-text)' }}>
          {row.original.Balance !== null && row.original.Balance !== undefined
            ? Number(row.original.Balance).toLocaleString(undefined, { minimumFractionDigits: 2 })
            : '0.00'}
        </span>
      ),
    },
    {
      accessorKey: 'CrLimit',
      header: 'CR. LIMIT',
      cell: ({ row }) => (
        <span className="text-[13px] font-mono font-semibold" style={{ color: 'var(--color-text)' }}>
          {row.original.CrLimit !== null && row.original.CrLimit !== undefined
            ? Number(row.original.CrLimit).toLocaleString(undefined, { minimumFractionDigits: 2 })
            : '0.00'}
        </span>
      ),
    },
    {
      accessorKey: 'Address',
      header: 'ADDRESS',
      cell: ({ row }) => (
        <span className="text-[13px] max-w-[180px] truncate block" style={{ color: 'var(--color-text-secondary)' }}>
          {row.original.Address || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'OwnerMobileNo',
      header: 'MOBILE',
      cell: ({ row }) => (
        <span className="text-[13px] font-mono" style={{ color: 'var(--color-text-secondary)' }}>
          {row.original.OwnerMobileNo || row.original.AlternateOwnerMobileNo || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'AprStatus',
      header: 'APPR STATUS',
      cell: () => (
        <Badge variant="success">
          Approved
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            title="View Details"
            className="p-1.5 rounded-lg hover:bg-black/10 text-primary transition-colors"
            onClick={() => setSelectedSupplierId(row.original.ID)}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            title="Edit Details"
            className="p-1.5 rounded-lg hover:bg-black/10 text-yellow-500 transition-colors"
            onClick={() => setSelectedSupplierId(row.original.ID)}
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            title="Delete Record"
            className="p-1.5 rounded-lg hover:bg-black/10 text-error transition-colors"
            onClick={() => handleDelete(row.original.ID, row.original.Name)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            Supplier Directory
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {suppliers.length} active suppliers
          </p>
        </div>
      </div>

      <DataTable
        data={suppliers}
        columns={columns}
        isLoading={isLoading}
        enableRowSelection
        enableExport
        exportFileName="suppliers"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search suppliers by Code, Name, Representative..."
        extraFilters={
          <>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Date Range Filter"
            />
            <select
              className="px-3.5 py-2 rounded-xl text-xs font-semibold outline-none border transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              value={aprStatus}
              onChange={e => setAprStatus(e.target.value)}
            >
              <option value="all">All Approvals</option>
              <option value="Y">Approved</option>
              <option value="N">Awaiting Approval</option>
            </select>
          </>
        }
        onRowClick={(row) => setSelectedSupplierId(row.ID)}
      />

      {/* Retailer Detail Canvas */}
      <AnimatePresence>
        {selectedSupplierId !== null && (
          <RetailerDetailCanvas
            retailerId={selectedSupplierId}
            onClose={() => setSelectedSupplierId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
