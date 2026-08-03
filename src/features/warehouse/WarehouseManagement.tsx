import React, { useState, useRef } from 'react';
import { Warehouse, RefreshCw, MapPin } from 'lucide-react';
import { useWarehouses, type ApiWarehouse } from './api/useWarehouse';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/table';

export const WarehouseManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const searchTimer = useRef<any>(null);

  const { data, isLoading, refetch } = useWarehouses({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
  });

  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 350);
  };

  const stats = data?.stats ?? { total: 0 };
  const warehouses = data?.warehouses ?? [];
  const pagination = data?.pagination;

  // Define Columns
  const columns: ColumnDef<ApiWarehouse, unknown>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <span style={{ color: 'var(--color-text)' }} className="text-[13px] font-medium">
          {row.original.id} - Items
        </span>
      )
    },
    {
      accessorKey: 'code',
      header: 'CODE',
      cell: ({ row }) => (
        <span style={{ color: 'var(--color-text)' }} className="text-[13px]">
          {row.original.code || '—'}
        </span>
      )
    },
    {
      accessorKey: 'name',
      header: 'NAME',
      cell: ({ row }) => (
        <span style={{ color: 'var(--color-text)' }} className="text-[13px]">
          {row.original.name || '—'}
        </span>
      )
    },
    {
      accessorKey: 'street',
      header: 'STREET',
      cell: ({ row }) => (
        <span style={{ color: 'var(--color-text)' }} className="text-[13px]">
          {row.original.street || '—'}
        </span>
      )
    },
    {
      accessorKey: 'block',
      header: 'BLOCK',
      cell: ({ row }) => (
        <span style={{ color: 'var(--color-text)' }} className="text-[13px]">
          {row.original.block || '—'}
        </span>
      )
    },
    {
      accessorKey: 'zipCode',
      header: 'ZIP',
      cell: ({ row }) => (
        <span style={{ color: 'var(--color-text)' }} className="text-[13px]">
          {row.original.zipCode || '—'}
        </span>
      )
    },
    {
      accessorKey: 'location',
      header: 'LOCATION',
      cell: ({ row }) => (
        <span style={{ color: 'var(--color-text)' }} className="text-[13px]">
          {row.original.location || '—'}
        </span>
      )
    }
  ];

  // Stat Cards
  const statCards = [
    { label: 'Total Warehouses', value: stats.total, icon: Warehouse, color: 'var(--color-primary)', bg: 'var(--color-primary)/10' },
  ];

  return (
    <div className="page-container p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Warehouse Management
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Manage your warehouses and locations
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
        data={warehouses}
        columns={columns}
        rowActions={[]}
        isLoading={isLoading}
        enableRowSelection
        enableExport
        exportFileName="warehouses-list"
        enableViewToggle
        defaultViewMode="table"
        enableSearch={true}
        searchValue={search}
        onSearchChange={handleSearchChange}
        serverPagination={pagination ? {
          total: pagination.total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: pagination.totalPages,
          onPageChange: setPage,
        } : undefined}
      />
    </div>
  );
};
export default WarehouseManagement;
