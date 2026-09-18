import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  RefreshCw,
  Edit2,
  FileSpreadsheet,
  Eye,
  Trash2,
  Receipt,
  CreditCard,
  DollarSign,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  useARInvoices,
  useDeleteARInvoice,
  type ARInvoice,
} from './api/useARInvoices';
import { DataTable, type ColumnDef } from '../../components/table/DataTable';
import { Button, Spinner, DateRangePicker, Tooltip, Badge, Card } from '../../components/ui';

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
  const invoicesList: ARInvoice[] = rawData?.invoices || [];
  const metrics = rawData?.metrics || {
    totalInvoiced: 0,
    totalPaid: 0,
    totalBalance: 0,
    count: 0,
  };

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

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this AR invoice?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns: ColumnDef<ARInvoice, unknown>[] = [
    {
      accessorKey: 'InvoiceCode',
      header: 'Invoice #',
      cell: ({ row }) => (
        <span className="font-semibold text-teal-600 dark:text-teal-400">
          {row.original.InvoiceCode || `INV/${row.original.ID}`}
        </span>
      ),
    },
    {
      accessorKey: 'SAPDocNum',
      header: 'SAP Doc #',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
          {row.original.SAPDocNum || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'CustName',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-slate-800 dark:text-slate-100">{row.original.CustName || '—'}</div>
          <div className="text-[11px] text-slate-400">{row.original.CustCode}</div>
        </div>
      ),
    },
    {
      accessorKey: 'OrderCode',
      header: 'Base Order',
      cell: ({ row }) => {
        const oCode = row.original.OrderCode;
        const oId = row.original.OrderId;
        if (!oCode && !oId) return <span className="text-slate-400">—</span>;
        return (
          <Link
            to={`/deals/view/${oId}`}
            className="text-teal-600 hover:underline font-medium text-xs"
          >
            {oCode || `Order #${oId}`}
          </Link>
        );
      },
    },
    {
      accessorKey: 'PostDate',
      header: 'Invoice Date',
      cell: ({ row }) => {
        const val = row.original.PostDate;
        return <span className="text-xs text-slate-500">{val ? new Date(val).toLocaleDateString() : '—'}</span>;
      },
    },
    {
      accessorKey: 'DueDate',
      header: 'Payment Due',
      cell: ({ row }) => {
        const val = row.original.DueDate;
        return <span className="text-xs text-slate-500">{val ? new Date(val).toLocaleDateString() : '—'}</span>;
      },
    },
    {
      accessorKey: 'DocTotal',
      header: 'Total Amount',
      cell: ({ row }) => (
        <span className="font-bold text-slate-900 dark:text-white">
          ${Number(row.original.DocTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'Status',
      header: 'Status',
      cell: ({ row }) => {
        const status = (row.original.Status || 'O').toUpperCase();
        let variant: 'success' | 'warning' | 'default' | 'error' = 'warning';
        let label = 'Unpaid';

        if (status === 'C' || status === 'CLOSED' || status === 'PAID') {
          variant = 'success';
          label = 'Paid';
        } else if (status === 'O' || status === 'OPEN') {
          variant = 'warning';
          label = 'Open / Unpaid';
        }

        return <Badge variant={variant} dot>{label}</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Tooltip content="View Invoice" position="top">
            <button
              onClick={() => navigate(`/invoice/view/${row.original.ID}`)}
              className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Edit" position="top">
            <button
              onClick={() => navigate(`/invoice/edit/${row.original.ID}`)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </Tooltip>
          {/* <Tooltip content="Delete" position="top">
            <button
              onClick={(e) => handleDelete(row.original.ID, e)}
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Tooltip> */}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-teal-600" /> Accounts Receivable Invoices
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track customer receivables, sales invoices and collected payments
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
          <Link to="/invoice/new">
            <Button
              variant="primary"
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-md transition-all hover:shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              New AR Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Invoiced</p>
            <div className="p-2 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black mt-2 text-slate-900 dark:text-white">
            ${metrics.totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">{metrics.count} total invoices</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Total Received</p>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black mt-2 text-emerald-600">
            ${metrics.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">Settled invoices</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Outstanding Balance</p>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black mt-2 text-amber-600">
            ${metrics.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">Pending collection</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Spinner className="w-8 h-8 text-teal-600" />
            <p className="text-xs text-slate-500">Loading AR invoices from database...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={invoicesList}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search customer, invoice code..."
            extraFilters={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
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
                    className="p-2 text-xs text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                  </button>
                </Tooltip>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
};

export default ARInvoice;
