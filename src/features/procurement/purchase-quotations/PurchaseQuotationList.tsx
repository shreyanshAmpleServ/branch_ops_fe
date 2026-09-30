import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  RefreshCw,
  Edit2,
  Eye,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
  Upload,
  Download,
  SlidersHorizontal,
  BarChart3
} from 'lucide-react';
import {
  usePurchaseQuotations,
  type PurchaseQuotation
} from './api/usePurchaseQuotations';
import { DataTable, type ColumnDef } from '../../../components/table/DataTable';
import { Spinner, DateRangePicker, Tooltip } from '../../../components/ui';

export const PurchaseQuotationList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: rawQuotations, isLoading, refetch, isRefetching } = usePurchaseQuotations({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const quotationsList: PurchaseQuotation[] = useMemo(() => {
    return (Array.isArray(rawQuotations) ? rawQuotations : (rawQuotations as any)?.data) || [];
  }, [rawQuotations]);

  // Dynamic KPI Stats calculated purely from API response
  const stats = useMemo(() => {
    const totalCount = quotationsList.length;
    let openCount = 0;
    let approvedCount = 0;
    let totalValue = 0;

    quotationsList.forEach(q => {
      const s = (q.Status || 'Open').toUpperCase();
      totalValue += Number(q.DocTotal || 0);

      if (s === 'OPEN' || s === 'O') {
        openCount++;
      } else if (s === 'CLOSED' || s === 'C' || q.AprStatus === 'Y') {
        approvedCount++;
      }
    });

    return {
      totalCount,
      openCount,
      approvedCount,
      totalValue,
    };
  }, [quotationsList]);

  // Dynamic Vendor Options from API data
  const vendorOptions = useMemo(() => {
    const map = new Map<string, string>();
    quotationsList.forEach(q => {
      const vCode = q.CustCode || q.CustName;
      if (vCode) {
        map.set(vCode, q.CustName || vCode);
      }
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [quotationsList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return quotationsList.filter(q => {
      const s = (q.Status || 'Open').toUpperCase();

      if (statusFilter !== 'all') {
        if (statusFilter === 'open' && s !== 'OPEN' && s !== 'O') return false;
        if (statusFilter === 'closed' && s !== 'CLOSED' && s !== 'C') return false;
        if (statusFilter === 'pending' && s !== 'PENDING' && s !== 'P') return false;
      }

      if (vendorFilter !== 'all' && (q.CustCode !== vendorFilter && q.CustName !== vendorFilter)) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const codeMatch = (q.QuotCode || '').toLowerCase().includes(term);
        const vendorMatch = (q.CustName || '').toLowerCase().includes(term);
        const sapMatch = (q.SAPDocNum ? String(q.SAPDocNum) : '').toLowerCase().includes(term);
        if (!codeMatch && !vendorMatch && !sapMatch) return false;
      }

      return true;
    });
  }, [quotationsList, statusFilter, vendorFilter, searchTerm]);

  const handleExportCSV = () => {
    if (!filteredList || filteredList.length === 0) return;
    const headers = ['ID', 'DOCNUM', 'DOC STATUS', 'PURCHASE QUOTATION NO', 'VENDOR', 'REQUEST TYPE', 'CREATED DATE', 'DOC TOTAL', 'APPROVAL STATUS'];
    const csvRows = [
      headers.join(','),
      ...filteredList.map(q => [
        q.ID,
        `"${q.SAPDocNum || q.ID}"`,
        `"${q.Status || 'Open'}"`,
        `"${q.QuotCode || `PQ26/${q.ID}`}"`,
        `"${(q.CustName || q.CustCode || '').replace(/"/g, '""')}"`,
        `"${q.RequestType || 'Item'}"`,
        `"${q.CreatedDate ? new Date(q.CreatedDate).toISOString().split('T')[0] : ''}"`,
        q.DocTotal || 0,
        `"${q.AprStatus === 'Y' ? 'APPROVED' : q.AprStatus === 'N' ? 'REJECTED' : 'PENDING'}"`,
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'PurchaseQuotationsExport.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<PurchaseQuotation, unknown>[] = [
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
        <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
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
      accessorKey: 'QuotCode',
      header: 'PURCHASE QUOTATION NO',
      cell: ({ row }) => (
        <span 
          className="text-xs font-semibold cursor-pointer hover:underline"
          style={{ color: 'var(--color-primary)' }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/procurement/quotation/view/${row.original.ID}`);
          }}
        >
          {row.original.QuotCode || `PQ26/${row.original.ID}`}
        </span>
      ),
    },
    {
      accessorKey: 'CustName',
      header: 'VENDOR',
      cell: ({ row }) => (
        <div className="py-0.5">
          <div className="font-semibold text-slate-800 dark:text-slate-100 text-xs">{row.original.CustName || '—'}</div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{row.original.CustCode}</div>
        </div>
      ),
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
        const val = row.original.CreatedDate;
        return <span className="text-xs text-slate-600 dark:text-slate-400">{val ? new Date(val).toLocaleDateString() : '—'}</span>;
      },
    },
    {
      accessorKey: 'DocTotal',
      header: 'DOC TOTAL',
      cell: ({ row }) => (
        <span className="font-bold text-slate-900 dark:text-white text-xs">
          ${Number(row.original.DocTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'AprStatus',
      header: 'APPROVAL STATUS',
      cell: ({ row }) => {
        const status = row.original.AprStatus;
        if (status === 'Y') {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
              Approved
            </span>
          );
        }
        if (status === 'N') {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
              Rejected
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
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
          <Tooltip content="View Purchase Quotation" position="top">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/procurement/quotation/view/${row.original.ID}`);
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
                navigate(`/procurement/quotation/edit/${row.original.ID}`);
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
              Purchase Quotations
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Manage vendor purchase quotations, compare pricing and convert to purchase orders
            </p>
          </div>
        </div>

        {/* Right side: Action Buttons */}
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

          <Link to="/procurement/quotation/new">
            <button
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg text-white shadow-xs transition-all hover:opacity-95 active:scale-98 cursor-pointer"
              style={{ background: 'var(--color-primary)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              New Purchase Quotation
            </button>
          </Link>
        </div>
      </div>

      {/* Dynamic KPI Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Card 1: Total Purchase Quotations */}
        <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileText className="w-3 h-3" />
              </div>
              Total Quotations
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

        {/* Card 2: Open Quotations */}
        <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-3 h-3" />
              </div>
              Open Quotations
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.openCount}</div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              Pending review
            </div>
          </div>
          <div className="text-amber-400 opacity-60">
            <BarChart3 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 3: Approved Quotations */}
        <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              Approved / Closed
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.approvedCount}</div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Ready for PO
            </div>
          </div>
          <div className="text-emerald-400 opacity-60">
            <BarChart3 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 4: Total Quotation Value */}
        <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <span className="font-bold text-xs">$</span>
              </div>
              Total Quotation Value
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Cumulative value
            </div>
          </div>
          <div className="text-purple-400 opacity-60">
            <BarChart3 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

      </div>

      {/* Main Table Container - Full Width */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs overflow-hidden w-full">
        <DataTable
          columns={columns}
          data={filteredList}
          isLoading={isLoading}
            enableRowSelection={true}
            enableExport={true}
            exportFileName="purchase-quotations"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search vendor, quotation code..."
            onRowClick={(row) => navigate(`/procurement/quotation/view/${row.ID}`)}
            extraFilters={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={vendorFilter}
                  onChange={(e) => setVendorFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  <option value="all">All Vendors</option>
                  {vendorOptions.map(v => (
                    <option key={v.code} value={v.code}>{v.name}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
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
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>More Filters</span>
                </button>

                <Tooltip content="Refresh" position="bottom">
                  <button
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className="p-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
                  </button>
                </Tooltip>
              </div>
            }
          />
      </div>

    </div>
  );
};

export default PurchaseQuotationList;
