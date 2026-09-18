import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, RefreshCw, Edit2, FileSpreadsheet, Eye, FileText } from 'lucide-react';
import {
  usePurchaseRequests,
  useDeletePurchaseRequest,
  type PurchaseRequest
} from './api/usePurchaseRequests';
import { DataTable, type ColumnDef } from '../../../components/table/DataTable';
import { Button, Spinner, DateRangePicker, Tooltip } from '../../../components/ui';
import { MemoModal } from './components/MemoModal';

export const PurchaseRequestList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedMemo, setSelectedMemo] = useState<{ id: number; text: string } | null>(null);

  const { data: rawRequests, isLoading, refetch, isRefetching } = usePurchaseRequests({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const requestsList: PurchaseRequest[] = (Array.isArray(rawRequests) ? rawRequests : (rawRequests as any)?.data) || [];

  const handleExportCSV = () => {
    if (!requestsList || requestsList.length === 0) return;
    const headers = ['ID', 'DOCNUM', 'DOC STATUS', 'RELATION FROM', 'PURCHASE REQUEST NO', 'VENDOR', 'BASE REQ.', 'BASE QUOT.', 'REQUEST TYPE', 'CREATED DATE', 'DOC TOTAL', 'APRDATE', 'APPROVAL STATUS'];
    const csvRows = [
      headers.join(','),
      ...requestsList.map(r => [
        r.ID,
        `"${r.RequestedNo || r.ID}"`,
        `"${r.Status || 'Open'}"`,
        `"${(r as any).relation_from || r.Remarks || ''}"`,
        `"${r.RequestedNo || `PR26/${r.ID}`}"`,
        `"${(r.CustName || r.CustCode || '').replace(/"/g, '""')}"`,
        `"${r.RequestedNo || `PR26/${r.ID}`}"`,
        `"${(r as any).QuotCode ? `PQ26/${(r as any).QuotCode}` : 'N/A'}"`,
        `"${r.TypeRequest || 'Item'}"`,
        `"${r.CreatedDate ? new Date(r.CreatedDate).toISOString().split('T')[0] : ''}"`,
        r.DocTotal || 0,
        `"${r.AprDate ? new Date(r.AprDate).toISOString().split('T')[0] : ''}"`,
        `"${r.AprStatus === 'Y' ? 'APPROVED' : r.AprStatus === 'N' ? 'REJECTED' : 'PENDING'}"`,
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'PurchaseRequestsExport.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<PurchaseRequest, unknown>[] = [
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
      accessorKey: 'RequestedNo',
      header: 'DOCNUM',
      cell: ({ row }) => (
        <span className="text-xs text-slate-700 dark:text-slate-300">
          {row.original.RequestedNo || row.original.ID}
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
      accessorKey: 'RequestedNo',
      header: 'PURCHASE REQUEST NO',
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {row.original.RequestedNo || `PR26/${row.original.ID}`}
        </span>
      ),
    },
    {
      accessorKey: 'CustName',
      header: 'VENDOR',
      cell: ({ row }) => (
        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
          {row.original.CustName || 'N/A'}
        </span>
      ),
    },
    {
      id: 'base_req',
      header: 'BASE REQ.',
      cell: ({ row }) => {
        const reqNo = row.original.RequestedNo || `PR26/${row.original.ID}`;
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-sky-50 text-sky-600 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800 rounded">
            {reqNo}
          </span>
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
      accessorKey: 'TypeRequest',
      header: 'REQUEST TYPE',
      cell: ({ row }) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {row.original.TypeRequest || 'Item'}
        </span>
      ),
    },
    {
      accessorKey: 'CreatedDate',
      header: 'CREATED DATE',
      cell: ({ row }) => {
        const val = row.original.CreatedDate || row.original.PostDate;
        return (
          <span className="text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
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
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono whitespace-nowrap">
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
          <span className="text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
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
            onClick={() => navigate(`/procurement/request/view/${row.original.ID}`)}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95"
            title="View Details"
          >
            <Eye className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
          <button
            onClick={() => navigate(`/procurement/request/edit/${row.original.ID}`)}
            className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow transition-all hover:scale-105 active:scale-95"
            title="Edit Request"
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
            Purchase Requests
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, manage and review internal purchase requisitions
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
          <Link to="/procurement/request/new">
            <Button
              variant="primary"
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-md transition-all hover:shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Purchase Request
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Spinner className="w-8 h-8 text-teal-600" />
            <p className="text-xs text-slate-500">Loading purchase requests...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={requestsList}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search user, request code..."
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
                <Tooltip content="Refresh" position="bottom">
                  <button
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className="p-2 text-xs text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                  </button>
                </Tooltip>
              </div>
            }
            onRowClick={(row) => navigate(`/procurement/request/view/${row.ID}`)}
          />
        )}
      </div>

      {/* Memo Modal */}
      {selectedMemo && (
        <MemoModal
          isOpen={true}
          onClose={() => setSelectedMemo(null)}
          memoText={selectedMemo.text}
          requestId={selectedMemo.id}
        />
      )}
    </div>
  );
};

export default PurchaseRequestList;
