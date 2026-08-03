import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Eye, Edit3, Trash2, CheckCircle2 } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/table';
import { Badge, DateRangePicker, type DateRange } from '../../components/ui';
import { useRetailers, type Retailer, useDeleteRetailer } from './api/useRetailers';
import { RetailerDetailCanvas } from './components/RetailerDetailCanvas';

export const CustomerList: React.FC = () => {
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [aprStatus, setAprStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [selectedRetailerId, setSelectedRetailerId] = useState<number | null>(null);

  // React Query hooks for Customers (CardType = 'C')
  const { data: customers = [], isLoading } = useRetailers({
    cardType: 'C',
    search,
    aprStatus,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const deleteRetailer = useDeleteRetailer();

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete customer "${name}"?`)) {
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
      header: 'CUSTOMER',
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
      header: 'APPROVAL STATUS',
      cell: ({ row }) => {
        const status = row.original.AprStatus;
        return (
          <Badge variant={status === 'Y' ? 'success' : 'warning'}>
            {status === 'Y' ? 'Approved' : 'Pending'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            title="View Details"
            className="p-1.5 rounded-lg hover:bg-black/10 text-primary transition-colors"
            onClick={() => setSelectedRetailerId(row.original.ID)}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            title="Edit Details"
            className="p-1.5 rounded-lg hover:bg-black/10 text-yellow-500 transition-colors"
            onClick={() => setSelectedRetailerId(row.original.ID)}
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
          {row.original.AprStatus === 'N' && (
            <button
              title="Approve / Reject"
              className="p-1.5 rounded-lg hover:bg-black/10 text-success transition-colors"
              onClick={() => setSelectedRetailerId(row.original.ID)}
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            Customer Management
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {customers.length} registered customers
          </p>
        </div>
      </div>

      {/* Filters are now integrated inside DataTable */}

      <DataTable
        data={customers}
        columns={columns}
        isLoading={isLoading}
        enableRowSelection
        enableExport
        exportFileName="customers"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by Code, Name, Representative..."
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
        onRowClick={(row) => setSelectedRetailerId(row.ID)}
      />

      {/* Retailer Detail Canvas */}
      <AnimatePresence>
        {selectedRetailerId !== null && (
          <RetailerDetailCanvas
            retailerId={selectedRetailerId}
            onClose={() => setSelectedRetailerId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
