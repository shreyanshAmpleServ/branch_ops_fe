import React, { useState, useRef } from 'react';
import { Package, RefreshCw, Box } from 'lucide-react';
import { useItems, type ApiItem } from './api/useItems';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/table';
import { Badge } from '../../components/ui';

export const ItemManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const searchTimer = useRef<any>(null);

  const { data, isLoading, refetch } = useItems({
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
  const items = data?.items ?? [];
  const pagination = data?.pagination;

  // Define Columns
  const columns: ColumnDef<ApiItem, unknown>[] = [
    {
      accessorKey: 'code',
      header: 'CODE',
      cell: ({ row }) => (
        <span style={{ color: 'var(--color-text)' }} className="text-[13px] font-medium">
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
      accessorKey: 'categoryName',
      header: 'CATEGORY',
      cell: ({ row }) => (
        <span style={{ color: 'var(--color-text-secondary)' }} className="text-[13px]">
          {row.original.categoryName || '—'}
        </span>
      )
    },
    {
      accessorKey: 'onHand',
      header: 'ON HAND',
      cell: ({ row }) => {
        const val = Number(row.original.onHand);
        return (
          <span style={{ color: 'var(--color-text)' }} className="text-[13px]">
            {val ? val.toFixed(5) : ''}
          </span>
        );
      }
    },
    {
      accessorKey: 'isCommited',
      header: 'ISCOMMITED',
      cell: ({ row }) => {
        const val = Number(row.original.isCommited);
        return (
          <span style={{ color: 'var(--color-text)' }} className="text-[13px]">
            {val ? val.toFixed(5) : ''}
          </span>
        );
      }
    },
    {
      accessorKey: 'onOrder',
      header: 'ONORDER',
      cell: ({ row }) => {
        const val = Number(row.original.onOrder);
        return (
          <span style={{ color: 'var(--color-text)' }} className="text-[13px]">
            {val ? val.toFixed(5) : ''}
          </span>
        );
      }
    },
    {
      id: 'available',
      header: 'AVAILABLE',
      cell: ({ row }) => {
        const available = Number(row.original.onHand) - Number(row.original.isCommited);
        return (
          <span style={{ color: 'var(--color-text)' }} className="text-[13px]">
            {available ? available.toFixed(5) : ''}
          </span>
        );
      }
    },
    {
      accessorKey: 'warehouseName',
      header: 'WAREHOUSE',
      cell: ({ row }) => (
        <span style={{ color: 'var(--color-text-secondary)' }} className="text-[13px]">
          {row.original.warehouseName || '—'}
        </span>
      )
    },
  ];

  // Stat Cards
  const statCards = [
    { label: 'Total Items', value: stats.total, icon: Box, color: 'var(--color-primary)', bg: 'var(--color-primary)/10' },
  ];

  return (
    <div className="page-container p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Item Management
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Manage inventory items and monitor stock levels
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
        data={items}
        columns={columns}
        rowActions={[]}
        isLoading={isLoading}
        enableRowSelection
        enableExport
        exportFileName="items-list"
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
export default ItemManagement;
