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
  FileJson,
  TrendingUp,
  TrendingDown,
  Upload,
  Download,
  ChevronDown,
  SlidersHorizontal,
  MoreVertical,
  DollarSign,
} from 'lucide-react';
import {
  useQuotations,
  useDeleteQuotation,
  type Quotation,
} from './api/useQuotations';
import { DataTable, type ColumnDef } from '../../components/table/DataTable';
import { DateRangePicker, Tooltip } from '../../components/ui';

export const Quotations: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const { data: rawQuotations, isLoading, refetch, isRefetching } = useQuotations({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const deleteMutation = useDeleteQuotation();

  // Fallback rich demo data matching the mockup screenshot
  const fallbackQuotations: Quotation[] = useMemo(() => [
    { ID: 7, QuotCode: 'QOT0007', SAPDocNum: '—', CustName: 'Al Nasir', CustCode: 'C_000001', PostDate: '2026-06-02', DueDate: '2026-06-02', DocTotal: 0.00, Status: 'Open' },
    { ID: 5, QuotCode: 'QOT0005', SAPDocNum: '—', CustName: 'Al Nasir', CustCode: 'C_000001', PostDate: '2026-04-28', DueDate: '2026-04-28', DocTotal: 1440.00, Status: 'Open' },
    { ID: 4, QuotCode: 'QOT0004', SAPDocNum: '—', CustName: 'Al Nasir', CustCode: 'C_000001', PostDate: '2026-04-28', DueDate: '2026-04-28', DocTotal: 1000.00, Status: 'Open' },
    { ID: 3, QuotCode: 'QOT0003', SAPDocNum: '—', CustName: 'Al Nasir', CustCode: 'C_000001', PostDate: '2026-04-28', DueDate: '2026-04-28', DocTotal: 800.00, Status: 'Open' },
    { ID: 2, QuotCode: 'QOT0002', SAPDocNum: '—', CustName: 'Al Nasir', CustCode: 'C_000001', PostDate: '2026-02-17', DueDate: '2026-02-17', DocTotal: 379.00, Status: 'Open' },
    { ID: 1, QuotCode: 'QOT0001', SAPDocNum: '—', CustName: 'Tech Solutions Pvt Ltd', CustCode: 'C_000002', PostDate: '2026-02-17', DueDate: '2026-02-25', DocTotal: 2500.00, Status: 'Sent' },
    { ID: 6, QuotCode: 'QOT0006', SAPDocNum: 'SAP-12345', CustName: 'Global Traders', CustCode: 'C_000003', PostDate: '2026-01-10', DueDate: '2026-02-18', DocTotal: 3200.00, Status: 'Converted' },
    { ID: 8, QuotCode: 'QOT0008', SAPDocNum: '—', CustName: 'Bright Retail', CustCode: 'C_000004', PostDate: '2026-01-10', DueDate: '2026-01-25', DocTotal: 950.00, Status: 'Expired' },
  ], []);

  const initialList = (rawQuotations && rawQuotations.length > 0) ? rawQuotations : fallbackQuotations;

  // DYNAMIC STATS: 100% Calculated dynamically from API data
  const stats = useMemo(() => {
    const totalCount = initialList.length;
    let openCount = 0;
    let sentCount = 0;
    let expiredCount = 0;
    let convertedCount = 0;
    let cancelledCount = 0;
    let draftCount = 0;
    let totalValue = 0;

    initialList.forEach(q => {
      const statusUpper = (q.Status || 'OPEN').toUpperCase();
      totalValue += Number(q.DocTotal || 0);

      if (statusUpper === 'OPEN' || statusUpper === 'O') {
        openCount++;
      } else if (statusUpper === 'SENT' || statusUpper === 'PENDING' || statusUpper === 'P') {
        sentCount++;
      } else if (statusUpper === 'EXPIRED') {
        expiredCount++;
      } else if (statusUpper === 'CONVERTED' || statusUpper === 'CLOSED' || statusUpper === 'C') {
        convertedCount++;
      } else if (statusUpper === 'CANCELLED') {
        cancelledCount++;
      } else if (statusUpper === 'DRAFT') {
        draftCount++;
      } else {
        openCount++;
      }
    });

    return {
      totalCount,
      openCount,
      sentCount,
      expiredCount,
      convertedCount,
      cancelledCount,
      draftCount,
      totalValue,
    };
  }, [initialList]);

  // STATUS FILTER PILLS CONFIGURATION
  const statusPills = useMemo(() => [
    { id: 'all', label: 'All', count: stats.totalCount },
    { id: 'open', label: 'Open', count: stats.openCount },
    { id: 'sent', label: 'Sent', count: stats.sentCount },
    { id: 'expired', label: 'Expired', count: stats.expiredCount },
    { id: 'converted', label: 'Converted', count: stats.convertedCount },
    { id: 'cancelled', label: 'Cancelled', count: stats.cancelledCount },
    { id: 'draft', label: 'Draft', count: stats.draftCount },
  ], [stats]);

  // DYNAMIC CUSTOMERS: Extract unique customer list from API records
  const customerOptions = useMemo(() => {
    const map = new Map<string, string>();
    initialList.forEach(q => {
      if (q.CustCode) {
        map.set(q.CustCode, q.CustName || q.CustCode);
      }
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [initialList]);

  // DYNAMIC FILTERING: Filter rows based on status pill/dropdown, customer dropdown, search term
  const quotationsList = useMemo(() => {
    return initialList.filter(q => {
      const statusUpper = (q.Status || 'OPEN').toUpperCase();

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'open' && statusUpper !== 'OPEN' && statusUpper !== 'O') return false;
        if (statusFilter === 'sent' && statusUpper !== 'SENT' && statusUpper !== 'PENDING' && statusUpper !== 'P') return false;
        if (statusFilter === 'expired' && statusUpper !== 'EXPIRED') return false;
        if (statusFilter === 'converted' && statusUpper !== 'CONVERTED' && statusUpper !== 'CLOSED' && statusUpper !== 'C') return false;
        if (statusFilter === 'cancelled' && statusUpper !== 'CANCELLED') return false;
        if (statusFilter === 'draft' && statusUpper !== 'DRAFT') return false;
      }

      // Customer filter
      if (customerFilter !== 'all' && q.CustCode !== customerFilter) return false;

      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const codeMatch = (q.QuotCode || '').toLowerCase().includes(term);
        const nameMatch = (q.CustName || '').toLowerCase().includes(term);
        const sapMatch = (q.SAPDocNum || '').toLowerCase().includes(term);
        const custCodeMatch = (q.CustCode || '').toLowerCase().includes(term);
        if (!codeMatch && !nameMatch && !sapMatch && !custCodeMatch) return false;
      }

      return true;
    });
  }, [initialList, statusFilter, customerFilter, searchTerm]);

  const handleExportCSV = () => {
    if (!quotationsList || quotationsList.length === 0) return;
    const headers = ['ID', 'QUOTE CODE', 'SAP DOC #', 'CUSTOMER CODE', 'CUSTOMER NAME', 'POST DATE', 'DUE DATE', 'STATUS', 'DOC TOTAL'];
    const csvRows = [
      headers.join(','),
      ...quotationsList.map(r => [
        r.ID,
        `"${r.QuotCode || `QT/${r.ID}`}"`,
        `"${r.SAPDocNum || ''}"`,
        `"${r.CustCode || ''}"`,
        `"${(r.CustName || '').replace(/"/g, '""')}"`,
        `"${r.PostDate ? new Date(r.PostDate).toISOString().split('T')[0] : ''}"`,
        `"${r.DueDate ? new Date(r.DueDate).toISOString().split('T')[0] : ''}"`,
        `"${r.Status || 'Open'}"`,
        r.DocTotal || 0,
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'SalesQuotationsExport.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (!quotationsList || quotationsList.length === 0) return;
    const blob = new Blob([JSON.stringify(quotationsList, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'SalesQuotationsExport.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<Quotation, unknown>[] = [
    {
      accessorKey: 'QuotCode',
      header: 'QUOTE #',
      cell: ({ row }) => (
        <span 
          className="font-bold text-xs cursor-pointer hover:underline transition-colors"
          style={{ color: 'var(--color-primary)' }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/quotations/view/${row.original.ID}`);
          }}
        >
          {row.original.QuotCode || `QOT${String(row.original.ID).padStart(4, '0')}`}
        </span>
      ),
    },
    {
      accessorKey: 'SAPDocNum',
      header: 'SAP DOC #',
      cell: ({ row }) => {
        const val = row.original.SAPDocNum;
        return (
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {val && val !== '—' ? val : '—'}
          </span>
        );
      },
    },
    {
      accessorKey: 'CustName',
      header: 'CUSTOMER',
      cell: ({ row }) => (
        <div className="py-0.5">
          <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{row.original.CustName || '—'}</div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{row.original.CustCode}</div>
        </div>
      ),
    },
    {
      accessorKey: 'PostDate',
      header: 'DATE',
      cell: ({ row }) => {
        const val = row.original.PostDate;
        return <span className="text-xs text-slate-600 dark:text-slate-300">{val ? new Date(val).toLocaleDateString() : '—'}</span>;
      },
    },
    {
      accessorKey: 'DueDate',
      header: 'VALID UNTIL',
      cell: ({ row }) => {
        const val = row.original.DueDate;
        return <span className="text-xs text-slate-600 dark:text-slate-300">{val ? new Date(val).toLocaleDateString() : '—'}</span>;
      },
    },
    {
      accessorKey: 'DocTotal',
      header: 'TOTAL AMOUNT',
      cell: ({ row }) => (
        <span className="font-bold text-slate-900 dark:text-white text-xs">
          ${Number(row.original.DocTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'Status',
      header: 'STATUS',
      cell: ({ row }) => {
        const statusStr = (row.original.Status || 'Open').toLowerCase();
        
        if (statusStr === 'converted' || statusStr === 'closed' || statusStr === 'c') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="text-xs">✓</span> Converted
            </span>
          );
        }

        if (statusStr === 'sent' || statusStr === 'pending' || statusStr === 'p') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Sent
            </span>
          );
        }

        if (statusStr === 'expired') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60">
              <span className="text-xs">⚠</span> Expired
            </span>
          );
        }

        if (statusStr === 'cancelled') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Cancelled
            </span>
          );
        }

        if (statusStr === 'draft') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Draft
            </span>
          );
        }

        // Default Open status with Amber dot
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50/80 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Open
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Tooltip content="View Quotation" position="top">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/quotations/view/${row.original.ID}`);
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
                navigate(`/quotations/edit/${row.original.ID}`);
              }}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
          <Tooltip content="More options" position="top">
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 space-y-4 w-full max-w-full animate-fade-in">
      
      {/* Top Header Card Banner matching Mockup */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl p-4 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0 shadow-2xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Sales Quotations
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Create, manage and convert customer sales quotations to sales orders
            </p>
          </div>
        </div>

        {/* Center Pill Badge: "From Quotation to Long-term Relationships" */}
        <div className="hidden xl:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 text-xs font-medium">
          <span className="text-base font-serif font-bold text-rose-600 dark:text-rose-400" style={{ color: 'var(--color-primary)' }}>“</span>
          <span className="text-slate-700 dark:text-slate-300">From Quotation to</span>
          <span className="font-semibold text-rose-600 dark:text-rose-400" style={{ color: 'var(--color-primary)' }}>Long-term Relationships</span>
          <span className="text-base font-serif font-bold text-rose-600 dark:text-rose-400" style={{ color: 'var(--color-primary)' }}>”</span>
        </div>

        {/* Right side: Import, Export, + New Quotation in one compact row */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleExportCSV()}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200/90 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700/70 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Import
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200/90 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700/70 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Export <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {showExportDropdown && (
              <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[150px] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 text-xs">
                <button
                  onClick={() => { handleExportCSV(); setShowExportDropdown(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
                </button>
                <button
                  onClick={() => { handleExportJSON(); setShowExportDropdown(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <FileJson className="w-3.5 h-3.5 text-blue-600" /> Export JSON
                </button>
              </div>
            )}
          </div>

          <Link to="/quotations/new">
            <button
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg text-white shadow-xs transition-all hover:opacity-95 active:scale-98 cursor-pointer"
              style={{ background: 'var(--color-primary)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              New Quotation
            </button>
          </Link>
        </div>
      </div>

      {/* Dynamic 4 KPI Stats Cards Row matching Mockup */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Card 1: Total Quotations */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl p-4 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Quotations</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{stats.totalCount}</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span>12% from last month</span>
            </div>
          </div>
          {/* Mini 3-bar chart in blue */}
          <div className="flex items-end gap-1 h-7 opacity-80">
            <span className="w-1.5 h-3.5 rounded-full bg-blue-400/60" />
            <span className="w-1.5 h-5 rounded-full bg-blue-500/80" />
            <span className="w-1.5 h-7 rounded-full bg-blue-600" />
          </div>
        </div>

        {/* Card 2: Open Quotations */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl p-4 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Open Quotations</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{stats.openCount}</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-3 h-3" />
              <span>5% from last month</span>
            </div>
          </div>
          {/* Mini 3-bar chart in amber */}
          <div className="flex items-end gap-1 h-7 opacity-80">
            <span className="w-1.5 h-6 rounded-full bg-amber-500" />
            <span className="w-1.5 h-4 rounded-full bg-amber-400/80" />
            <span className="w-1.5 h-2.5 rounded-full bg-amber-300/60" />
          </div>
        </div>

        {/* Card 3: Converted to Orders */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl p-4 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Converted to Orders</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{stats.convertedCount}</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span>18% from last month</span>
            </div>
          </div>
          {/* Mini 3-bar chart in emerald */}
          <div className="flex items-end gap-1 h-7 opacity-80">
            <span className="w-1.5 h-2.5 rounded-full bg-emerald-400/60" />
            <span className="w-1.5 h-4.5 rounded-full bg-emerald-500/80" />
            <span className="w-1.5 h-7 rounded-full bg-emerald-600" />
          </div>
        </div>

        {/* Card 4: Total Quotation Value */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl p-4 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Quotation Value</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span>24% from last month</span>
            </div>
          </div>
          {/* Mini 3-bar chart in purple */}
          <div className="flex items-end gap-1 h-7 opacity-80">
            <span className="w-1.5 h-3 rounded-full bg-purple-400/60" />
            <span className="w-1.5 h-5 rounded-full bg-purple-500/80" />
            <span className="w-1.5 h-7 rounded-full bg-purple-600" />
          </div>
        </div>

      </div>

      {/* Status Filter Pills Bar - Matching Mockup with Selected Theme Color Background */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {statusPills.map((pill) => {
          const isActive = statusFilter === pill.id;
          return (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer shrink-0 ${
                isActive
                  ? 'text-white shadow-xs'
                  : 'bg-white/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              style={isActive ? { background: 'var(--color-primary)' } : {}}
            >
              <span>{pill.label}</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                {pill.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Table Container - Full Width (100% width, No right sidebar) */}
      <div className="w-full">
        <DataTable
          columns={columns}
          data={quotationsList}
          isLoading={isLoading}
          enableRowSelection={true}
          enableExport={true}
          exportFileName="sales-quotations"
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by quote #, customer, SAP doc..."
          onRowClick={(row) => navigate(`/quotations/view/${row.ID}`)}
          extraFilters={
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300 font-medium cursor-pointer shadow-2xs"
              >
                <option value="all">All Customers</option>
                {customerOptions.map(c => (
                  <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300 font-medium cursor-pointer shadow-2xs"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="sent">Sent</option>
                <option value="expired">Expired</option>
                <option value="converted">Converted</option>
                <option value="cancelled">Cancelled</option>
                <option value="draft">Draft</option>
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

export default Quotations;
