import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Eye,
  Edit3,
  Trash2,
  Building2,
  CheckCircle2,
  Clock,
  TrendingUp,
  Upload,
  Download,
  BarChart3,
  CreditCard,
  Plus,
} from 'lucide-react';
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

  // DYNAMIC STATS: 100% Calculated dynamically from API data
  const stats = useMemo(() => {
    const totalCount = suppliers.length;
    let approvedCount = 0;
    let pendingCount = 0;
    let totalCredit = 0;

    suppliers.forEach(s => {
      if (s.AprStatus === 'Y') {
        approvedCount++;
      } else {
        pendingCount++;
      }
      totalCredit += Number(s.CrLimit || 0);
    });

    return {
      totalCount,
      approvedCount,
      pendingCount,
      totalCredit,
    };
  }, [suppliers]);

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete supplier "${name}"?`)) {
      await deleteRetailer.mutateAsync(id);
    }
  };

  const handleExportCSV = () => {
    if (!suppliers || suppliers.length === 0) return;
    const headers = ['ID', 'CODE', 'NAME', 'EMAIL', 'BALANCE', 'CR. LIMIT', 'ADDRESS', 'MOBILE', 'APPROVAL STATUS'];
    const csvRows = [
      headers.join(','),
      ...suppliers.map(r => [
        r.ID,
        `"${r.Code || ''}"`,
        `"${(r.Name || '').replace(/"/g, '""')}"`,
        `"${r.Email || r.OwnerEmail || ''}"`,
        r.Balance || 0,
        r.CrLimit || 0,
        `"${(r.Address || '').replace(/"/g, '""')}"`,
        `"${r.OwnerMobileNo || r.AlternateOwnerMobileNo || ''}"`,
        `"${r.AprStatus === 'Y' ? 'APPROVED' : 'PENDING'}"`,
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'SuppliersExport.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<Retailer, unknown>[] = [
    {
      accessorKey: 'Code',
      header: 'CODE',
      cell: ({ row }) => (
        <span 
          className="font-mono text-xs font-bold cursor-pointer hover:underline"
          style={{ color: 'var(--color-primary)' }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSupplierId(row.original.ID);
          }}
        >
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
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              {row.original.Name}
            </p>
            <p className="text-[11px] text-slate-400">
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
        <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
          ${row.original.Balance !== null && row.original.Balance !== undefined
            ? Number(row.original.Balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '0.00'}
        </span>
      ),
    },
    {
      accessorKey: 'CrLimit',
      header: 'CR. LIMIT',
      cell: ({ row }) => (
        <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
          ${row.original.CrLimit !== null && row.original.CrLimit !== undefined
            ? Number(row.original.CrLimit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '0.00'}
        </span>
      ),
    },
    {
      accessorKey: 'Address',
      header: 'ADDRESS',
      cell: ({ row }) => (
        <span className="text-xs max-w-[180px] truncate block text-slate-500 dark:text-slate-400">
          {row.original.Address || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'OwnerMobileNo',
      header: 'MOBILE',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
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
            className="p-1 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
            onClick={() => setSelectedSupplierId(row.original.ID)}
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            title="Edit Details"
            className="p-1 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
            onClick={() => setSelectedSupplierId(row.original.ID)}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            title="Delete Record"
            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
            onClick={() => handleDelete(row.original.ID, row.original.Name)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
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
            <Building2 className="w-4.5 h-4.5" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Supplier Directory
            </h1>
            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5">
              Manage verified vendors, suppliers, and procurement accounts
            </p>
          </div>
        </div>

        {/* Right side: Import, Export, + New Supplier */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200/90 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700/70 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Import
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200/90 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700/70 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Export <span className="text-[10px] opacity-70">▼</span>
          </button>

          <button
            onClick={() => setSelectedSupplierId(0)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg text-white shadow-xs transition-all hover:opacity-95 active:scale-98 cursor-pointer"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            New Supplier
          </button>
        </div>
      </div>

      {/* Dynamic KPI Stats Cards Row (Real counts from API) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Suppliers */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <div className="w-5.5 h-5.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Building2 className="w-3 h-3" />
              </div>
              Total Suppliers
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.totalCount}</div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              Active directory
            </div>
          </div>
          <div className="text-blue-500/60 dark:text-blue-400/50">
            <BarChart3 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 2: Pending Approval */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <div className="w-5.5 h-5.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Clock className="w-3 h-3" />
              </div>
              Pending Approval
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.pendingCount}</div>
            <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
              Awaiting verification
            </div>
          </div>
          <div className="text-amber-500/60 dark:text-amber-400/50">
            <Clock className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 3: Approved Vendors */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <div className="w-5.5 h-5.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              Approved Vendors
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.approvedCount}</div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              Ready for purchase orders
            </div>
          </div>
          <div className="text-emerald-500/60 dark:text-emerald-400/50">
            <CheckCircle2 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 4: Total Credit Limit */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <div className="w-5.5 h-5.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <CreditCard className="w-3 h-3" />
              </div>
              Total Credit Limit
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              ${stats.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] font-semibold text-purple-700 dark:text-purple-400">
              Allocated vendor credit
            </div>
          </div>
          <div className="text-purple-500/60 dark:text-purple-400/50">
            <BarChart3 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-hidden">
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
            <div className="flex flex-wrap items-center gap-2">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder="Date Range Filter"
              />
              <select
                className="px-3 py-1.5 rounded-xl text-xs font-semibold outline-none border transition-all focus:ring-2 focus:ring-primary/20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 cursor-pointer shadow-2xs"
                value={aprStatus}
                onChange={e => setAprStatus(e.target.value)}
              >
                <option value="all">All Approvals</option>
                <option value="Y">Approved</option>
                <option value="N">Awaiting Approval</option>
              </select>
            </div>
          }
          onRowClick={(row) => setSelectedSupplierId(row.ID)}
        />
      </div>

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

export default SupplierList;
