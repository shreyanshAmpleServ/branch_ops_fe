import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  RefreshCw,
  Edit2,
  Eye,
  Receipt,
  CreditCard,
  AlertCircle,
  FileText,
  Upload,
  Download,
  BarChart3,
  TrendingUp,
  MoreVertical,
} from 'lucide-react';
import {
  useARInvoices,
  useDeleteARInvoice,
  type ARInvoice as ARInvoiceType,
} from './api/useARInvoices';
import { DataTable, type ColumnDef } from '../../components/table/DataTable';
import { Spinner, DateRangePicker, Tooltip, Badge } from '../../components/ui';

export const ARInvoice: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: rawData, isLoading, refetch, isRefetching } = useARInvoices({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const deleteMutation = useDeleteARInvoice();
  const invoicesList: ARInvoiceType[] = rawData?.invoices || [];

  // DYNAMIC STATS: 100% Calculated dynamically from API data
  const stats = useMemo(() => {
    const totalCount = invoicesList.length;
    let openCount = 0;
    let paidCount = 0;
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    invoicesList.forEach(inv => {
      const statusUpper = (inv.Status || 'OPEN').toUpperCase();
      const docTotal = Number(inv.DocTotal || 0);
      totalInvoiced += docTotal;

      if (statusUpper === 'PAID' || statusUpper === 'CLOSED' || statusUpper === 'C') {
        paidCount++;
        totalPaid += docTotal;
      } else {
        openCount++;
        totalBalance += docTotal;
      }
    });

    return {
      totalCount,
      openCount,
      paidCount,
      totalInvoiced,
      totalPaid,
      totalBalance,
    };
  }, [invoicesList]);

  const handleExportCSV = () => {
    if (!invoicesList || invoicesList.length === 0) return;
    const headers = ['ID', 'INVOICE CODE', 'SAP DOC #', 'CUSTOMER CODE', 'CUSTOMER NAME', 'POST DATE', 'DUE DATE', 'STATUS', 'DOC TOTAL'];
    const csvRows = [
      headers.join(','),
      ...invoicesList.map(r => [
        r.ID,
        `"${r.InvoiceCode || `INV/${r.ID}`}"`,
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
    link.setAttribute('download', 'ARInvoicesExport.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<ARInvoiceType, unknown>[] = [
    {
      accessorKey: 'InvoiceCode',
      header: 'INVOICE #',
      cell: ({ row }) => (
        <span 
          className="font-semibold text-xs cursor-pointer hover:underline"
          style={{ color: 'var(--color-primary)' }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/invoice/view/${row.original.ID}`);
          }}
        >
          {row.original.InvoiceCode || `INV/${row.original.ID}`}
        </span>
      ),
    },
    {
      accessorKey: 'SAPDocNum',
      header: 'SAP DOC #',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          {row.original.SAPDocNum || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'CustName',
      header: 'CUSTOMER',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-slate-800 dark:text-slate-100 text-xs">{row.original.CustName || '—'}</div>
          <div className="text-[11px] text-slate-400">{row.original.CustCode}</div>
        </div>
      ),
    },
    {
      accessorKey: 'OrderCode',
      header: 'BASE ORDER',
      cell: ({ row }) => {
        const oCode = row.original.OrderCode;
        const oId = row.original.OrderId;
        if (!oCode && !oId) return <span className="text-slate-400 text-xs">—</span>;
        return (
          <Link
            to={`/orders/view/${oId}`}
            className="text-xs hover:underline font-medium"
            style={{ color: 'var(--color-primary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {oCode || `Order #${oId}`}
          </Link>
        );
      },
    },
    {
      accessorKey: 'PostDate',
      header: 'INVOICE DATE',
      cell: ({ row }) => {
        const val = row.original.PostDate;
        return <span className="text-xs text-slate-500 dark:text-slate-400">{val ? new Date(val).toLocaleDateString() : '—'}</span>;
      },
    },
    {
      accessorKey: 'DueDate',
      header: 'DUE DATE',
      cell: ({ row }) => {
        const val = row.original.DueDate;
        return <span className="text-xs text-slate-500 dark:text-slate-400">{val ? new Date(val).toLocaleDateString() : '—'}</span>;
      },
    },
    {
      accessorKey: 'DocTotal',
      header: 'TOTAL AMOUNT',
      cell: ({ row }) => (
        <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">
          ${Number(row.original.DocTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'Status',
      header: 'STATUS',
      cell: ({ row }) => {
        const status = (row.original.Status || 'O').toUpperCase();
        let badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400';
        let label = 'Open / Unpaid';

        if (status === 'C' || status === 'CLOSED' || status === 'PAID') {
          badgeStyle = 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400';
          label = 'Paid';
        }

        return (
          <span className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full border whitespace-nowrap ${badgeStyle}`}>
            {label}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Tooltip content="View Invoice" position="top">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/invoice/view/${row.original.ID}`);
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
                navigate(`/invoice/edit/${row.original.ID}`);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
            style={{ background: 'var(--color-primary-50, rgba(99,102,241,0.08))', border: '1px solid var(--color-primary-200, rgba(99,102,241,0.2))' }}
          >
            <Receipt className="w-4.5 h-4.5" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Accounts Receivable Invoices
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Track customer receivables, sales invoices and collected payments
            </p>
          </div>
        </div>

        {/* Right side: Import, Export, + New AR Invoice */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            Import
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Export <span className="text-[10px] opacity-70">▼</span>
          </button>

          <Link to="/invoice/new">
            <button
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg text-white shadow-xs transition-all hover:opacity-95 active:scale-98 cursor-pointer"
              style={{ background: 'var(--color-primary)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              New AR Invoice
            </button>
          </Link>
        </div>
      </div>

      {/* Dynamic KPI Stats Cards Row (Real counts from API) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Invoices */}
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Receipt className="w-3 h-3" />
              </div>
              Total Invoices
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.totalCount}</div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              Active in database
            </div>
          </div>
          <div className="text-blue-500/40 dark:text-blue-400/40">
            <BarChart3 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 2: Open / Unpaid */}
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <AlertCircle className="w-3 h-3" />
              </div>
              Open / Unpaid
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.openCount}</div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              ${stats.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pending
            </div>
          </div>
          <div className="text-amber-500/40 dark:text-amber-400/40">
            <AlertCircle className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 3: Paid Invoices */}
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <CreditCard className="w-3 h-3" />
              </div>
              Paid Invoices
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.paidCount}</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              ${stats.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} settled
            </div>
          </div>
          <div className="text-emerald-500/40 dark:text-emerald-400/40">
            <CreditCard className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 4: Total Invoiced Value */}
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <FileText className="w-3 h-3" />
              </div>
              Total Invoiced
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              ${stats.totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
              Gross billed volume
            </div>
          </div>
          <div className="text-purple-500/40 dark:text-purple-400/40">
            <BarChart3 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        <DataTable
          columns={columns}
          data={invoicesList}
          isLoading={isLoading}
            enableRowSelection={true}
            enableExport={true}
            exportFileName="ar-invoices"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search customer, invoice code..."
            onRowClick={(row) => navigate(`/invoice/view/${row.ID}`)}
            extraFilters={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open / Unpaid</option>
                  <option value="closed">Paid / Closed</option>
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
          />
      </div>
    </div>
  );
};

export default ARInvoice;
