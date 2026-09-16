import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, RefreshCw, Edit2, FileSpreadsheet, Eye } from 'lucide-react';
import {
  usePurchaseOrders,
  useDeletePurchaseOrder,
  type PurchaseOrder
} from './api/usePurchaseOrders';
import { DataTable, type ColumnDef } from '../../../components/table/DataTable';
import { Button, Spinner, DateRangePicker } from '../../../components/ui';

export const PurchaseOrderList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: rawOrders, isLoading, refetch, isRefetching } = usePurchaseOrders({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const ordersList: PurchaseOrder[] = (Array.isArray(rawOrders) ? rawOrders : (rawOrders as any)?.data) || [];

  const handleExportCSV = () => {
    if (!ordersList || ordersList.length === 0) return;
    const headers = ['ID', 'DOCNUM', 'DOC STATUS', 'RELATION FROM', 'PURCHASE ORDER NO', 'VENDOR', 'BASE REQ.', 'BASE QUOT.', 'REQUEST TYPE', 'CREATED DATE', 'DOC TOTAL', 'APRDATE', 'APPROVAL STATUS'];
    const csvRows = [
      headers.join(','),
      ...ordersList.map(o => [
        o.ID,
        `"${o.SAPDocNum || o.ID}"`,
        `"${o.Status || 'Open'}"`,
        `"${(o as any).relation_from || o.Remarks || ''}"`,
        `"${o.OrderCode || `PO26/${o.ID}`}"`,
        `"${(o.CustName || o.CustCode || '').replace(/"/g, '""')}"`,
        `"${(o as any).Pr_ID ? `PR26/${(o as any).Pr_ID}` : 'N/A'}"`,
        `"${(o as any).QuotCode ? `PQ26/${(o as any).QuotCode}` : 'N/A'}"`,
        `"${o.RequestType || 'Item'}"`,
        `"${o.CreatedDate ? new Date(o.CreatedDate).toISOString().split('T')[0] : ''}"`,
        o.DocTotal || 0,
        `"${o.AprDate ? new Date(o.AprDate).toISOString().split('T')[0] : ''}"`,
        `"${o.AprStatus === 'Y' ? 'APPROVED' : o.AprStatus === 'N' ? 'REJECTED' : 'PENDING'}"`,
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'PurchaseOrdersExport.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<PurchaseOrder, unknown>[] = [
    {
      accessorKey: 'ID',
      header: 'ID',
      cell: ({ row }) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
          {row.original.ID}
        </span>
      ),
    },
    {
      accessorKey: 'SAPDocNum',
      header: 'DOCNUM',
      cell: ({ row }) => (
        <span className="text-xs text-slate-700 dark:text-slate-300">
          {row.original.SAPDocNum || row.original.ID}
        </span>
      ),
    },
    {
      accessorKey: 'Status',
      header: 'DOC STATUS',
      cell: ({ row }) => {
        const raw = (row.original.Status || '').toUpperCase();
        const s = raw === 'C' || raw === 'CLOSED' || raw === 'L' ? 'Closed' : raw === 'P' || raw === 'PENDING' ? 'Pending' : 'Open';
        
        let badgeStyle = 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400';
        if (s === 'Closed') {
          badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400';
        } else if (s === 'Pending') {
          badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400';
        }

        return (
          <span className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${badgeStyle}`}>
            {s}
          </span>
        );
      },
    },
    {
      accessorKey: 'relation_from',
      header: 'RELATION FROM',
      cell: ({ row }) => {
        const rel = (row.original as any).relation_from || '';
        return (
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            {rel || ''}
          </span>
        );
      },
    },
    {
      accessorKey: 'OrderCode',
      header: 'PURCHASE ORDER NO',
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {row.original.OrderCode || `PO26/${row.original.ID}`}
        </span>
      ),
    },
    {
      accessorKey: 'CustName',
      header: 'VENDOR',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
            {row.original.CustName || 'Tunduma Cash Supplier'}
          </span>
          <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700">
            {row.original.CustCode && row.original.CustCode !== 'C_000001' ? row.original.CustCode : 'N/A'}
          </span>
        </div>
      ),
    },
    {
      id: 'base_req',
      header: 'BASE REQ.',
      cell: ({ row }) => {
        const prId = (row.original as any).Pr_ID || (row.original as any).RequestedNo;
        if (!prId) {
          return (
            <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 rounded border border-slate-200 dark:border-slate-700">
              N/A
            </span>
          );
        }
        const prList = Array.isArray(prId) ? prId : String(prId).split(',');
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {prList.map((pr: string, idx: number) => {
              const clean = pr.trim();
              const label = clean.startsWith('PR') ? clean : `PR26/${clean}`;
              return (
                <span key={idx} className="px-1.5 py-0.5 text-[10px] font-semibold bg-sky-50 text-sky-600 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800 rounded">
                  {label}
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      id: 'base_quot',
      header: 'BASE QUOT.',
      cell: ({ row }) => {
        const quotCode = (row.original as any).QuotCode || (row.original as any).quotation_id;
        if (!quotCode) {
          return (
            <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 rounded border border-slate-200 dark:border-slate-700">
              N/A
            </span>
          );
        }
        const label = String(quotCode).startsWith('PQ') ? String(quotCode) : `PQ26/${quotCode}`;
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800 rounded">
            {label}
          </span>
        );
      },
    },
    {
      accessorKey: 'RequestType',
      header: 'REQUEST TYPE',
      cell: ({ row }) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {row.original.RequestType || 'Item'}
        </span>
      ),
    },
    {
      accessorKey: 'CreatedDate',
      header: 'CREATED DATE',
      cell: ({ row }) => {
        const val = row.original.CreatedDate || row.original.PostDate;
        return (
          <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
            {val ? new Date(val).toISOString().split('T')[0] : '2026-00-00'}
          </span>
        );
      },
    },
    {
      accessorKey: 'DocTotal',
      header: 'DOC TOTAL',
      cell: ({ row }) => {
        const amt = Number(row.original.DocTotal || 0);
        return (
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
            {amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      accessorKey: 'AprDate',
      header: 'APRDATE',
      cell: ({ row }) => {
        const val = row.original.AprDate;
        return (
          <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
            {val ? new Date(val).toISOString().split('T')[0] : ''}
          </span>
        );
      },
    },
    {
      accessorKey: 'AprStatus',
      header: 'APPROVAL STATUS',
      cell: ({ row }) => {
        const st = (row.original.AprStatus || 'Y').toUpperCase();
        let badgeStyle = 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-400';
        let label = 'APPROVED';
        if (st === 'N' || st === 'REJECTED') {
          badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400';
          label = 'REJECTED';
        } else if (st === 'P' || st === 'PENDING') {
          badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400';
          label = 'PENDING';
        }
        return (
          <span className={`inline-block px-3 py-1 text-[10px] font-bold rounded-full border tracking-wider uppercase ${badgeStyle}`}>
            {label}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'ACTION',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/procurement/order/view/${row.original.ID}`)}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95"
            title="View Details"
          >
            <Eye className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
          <button
            onClick={() => navigate(`/procurement/order/edit/${row.original.ID}`)}
            className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow transition-all hover:scale-105 active:scale-95"
            title="Edit Order"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Purchase Orders
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, manage and review supplier purchase orders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={handleExportCSV}
            className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-xs font-medium py-2 rounded-xl"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
            Export CSV
          </Button>
          <Link to="/procurement/order/new">
            <Button
              variant="primary"
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-md transition-all hover:shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Purchase Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Spinner className="w-8 h-8 text-teal-600" />
            <p className="text-xs text-slate-500">Loading purchase orders...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={ordersList}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search vendor, order code..."
            extraFilters={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="pending">Pending</option>
                </select>
                <DateRangePicker
                  value={{ startDate, endDate }}
                  onChange={(range) => {
                    setStartDate(range.startDate);
                    setEndDate(range.endDate);
                  }}
                />
                <button
                  onClick={() => refetch()}
                  disabled={isRefetching}
                  className="p-2 text-xs text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                </button>
              </div>
            }
            onRowClick={(row) => navigate(`/procurement/order/view/${row.ID}`)}
          />
        )}
      </div>
    </div>
  );
};
