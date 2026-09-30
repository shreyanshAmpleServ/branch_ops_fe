import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  RefreshCw,
  Edit2,
  Eye,
  FileText,
  TrendingUp,
  Upload,
  Download,
  BarChart3,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  usePurchaseRequests,
  useDeletePurchaseRequest,
  type PurchaseRequest
} from './api/usePurchaseRequests';
import { DataTable, type ColumnDef } from '../../../components/table/DataTable';
import { Spinner, DateRangePicker, Tooltip } from '../../../components/ui';
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

  // DYNAMIC STATS: 100% Calculated dynamically from API data
  const stats = useMemo(() => {
    const totalCount = requestsList.length;
    let openCount = 0;
    let approvedCount = 0;
    let totalValue = 0;

    requestsList.forEach(r => {
      const s = (r.Status || '').toUpperCase();
      const apr = (r.AprStatus || '').toUpperCase();
      totalValue += Number(r.DocTotal || 0);

      if (apr === 'Y' || s === 'C' || s === 'CLOSED') {
        approvedCount++;
      } else {
        openCount++;
      }
    });

    return {
      totalCount,
      openCount,
      approvedCount,
      totalValue,
    };
  }, [requestsList]);

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
      header: 'PR NO',
      cell: ({ row }) => (
        <span 
          className="text-xs font-semibold cursor-pointer hover:underline"
          style={{ color: 'var(--color-primary)' }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/procurement/request/view/${row.original.ID}`);
          }}
        >
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
      header: 'TYPE',
      cell: ({ row }) => {
        const typeReq = row.original.TypeRequest || (row.original as any).RequestType || 'Item';
        const isItem = typeReq.toLowerCase() === 'item';
        return (
          <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
            isItem 
              ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' 
              : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300'
          }`}>
            {typeReq}
          </span>
        );
      },
    },
    {
      accessorKey: 'CreatedDate',
      header: 'CREATED DATE',
      cell: ({ row }) => {
        const val = row.original.CreatedDate;
        return <span className="text-xs text-slate-500">{val ? new Date(val).toLocaleDateString() : 'N/A'}</span>;
      },
    },
    {
      accessorKey: 'DocTotal',
      header: 'DOC TOTAL',
      cell: ({ row }) => (
        <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
          ${Number(row.original.DocTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'AprStatus',
      header: 'APPROVAL',
      cell: ({ row }) => {
        const apr = row.original.AprStatus;
        if (apr === 'Y') {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Approved
            </span>
          );
        } else if (apr === 'N') {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
              Rejected
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
            Pending
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Tooltip content="View Request" position="top">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/procurement/request/view/${row.original.ID}`);
              }}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
          <Tooltip content="Edit" position="top">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/procurement/request/edit/${row.original.ID}`);
              }}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 space-y-4 w-full max-w-full animate-fade-in">
      {/* Top Header Card Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
            style={{ background: 'var(--color-primary-50, rgba(99,102,241,0.08))', border: '1px solid var(--color-primary-200, rgba(99,102,241,0.2))' }}
          >
            <FileText className="w-4.5 h-4.5" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Purchase Requests
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Create, manage and review internal purchase requisitions
            </p>
          </div>
        </div>

        {/* Right side: Import, Export, + New Purchase Request */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            Import
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Export <span className="text-[10px] opacity-70">▼</span>
          </button>

          <Link to="/procurement/request/new">
            <button
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg text-white shadow-xs transition-all hover:opacity-95 active:scale-98 cursor-pointer"
              style={{ background: 'var(--color-primary)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              New Purchase Request
            </button>
          </Link>
        </div>
      </div>

      {/* Dynamic KPI Stats Cards Row (Real counts from API) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total PRs */}
        <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileText className="w-3 h-3" />
              </div>
              Total PRs
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.totalCount}</div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              Active in database
            </div>
          </div>
          <div className="text-blue-400 opacity-60">
            <BarChart3 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 2: Open PRs */}
        <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-3 h-3" />
              </div>
              Open PRs
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.openCount}</div>
            <div className="text-[10px] text-slate-400">
              Pending review / PO
            </div>
          </div>
          <div className="text-amber-400 opacity-60">
            <Clock className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 3: Approved PRs */}
        <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              Approved PRs
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.approvedCount}</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Ready for procurement
            </div>
          </div>
          <div className="text-emerald-400 opacity-60">
            <CheckCircle2 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 4: Total Request Amount */}
        <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <FileText className="w-3 h-3" />
              </div>
              Total Amount
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400">
              Requested requisition sum
            </div>
          </div>
          <div className="text-purple-400 opacity-60">
            <BarChart3 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="w-full">
        <DataTable
          columns={columns}
          data={requestsList}
          isLoading={isLoading}
            enableRowSelection={true}
            enableExport={true}
            exportFileName="purchase-requests"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search user, request code..."
            extraFilters={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
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
                    className="p-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
                  </button>
                </Tooltip>
              </div>
            }
            onRowClick={(row) => navigate(`/procurement/request/view/${row.ID}`)}
          />
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
