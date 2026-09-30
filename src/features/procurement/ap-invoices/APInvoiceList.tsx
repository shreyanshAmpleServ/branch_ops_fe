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
  TrendingUp,
  Upload,
  Download,
  BarChart3,
  Trash2,
} from 'lucide-react';
import {
  useApInvoices,
  useDeleteApInvoice,
  type ApInvoice
} from './api/useApInvoices';
import { DataTable, type ColumnDef } from '../../../components/table/DataTable';
import { Spinner, DateRangePicker, Tooltip } from '../../../components/ui';

export const APInvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeRequestFilter, setTypeRequestFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<ApInvoice | null>(null);

  const { data: rawInvoices, isLoading, refetch, isRefetching } = useApInvoices({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    typeRequest: typeRequestFilter !== 'all' ? typeRequestFilter : undefined,
  });

  const deleteMutation = useDeleteApInvoice();

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      await deleteMutation.mutateAsync(invoiceToDelete.ID);
      setIsDeleteModalOpen(false);
      setInvoiceToDelete(null);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete AP invoice');
    }
  };

  const invoicesList: ApInvoice[] = (Array.isArray(rawInvoices) ? rawInvoices : (rawInvoices as any)?.data) || [];

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

      if (statusUpper === 'PAID' || statusUpper === 'CLOSED' || statusUpper === 'C' || statusUpper === 'L') {
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
    const headers = ['ID', 'INVOICE CODE', 'SAP DOC #', 'DOC STATUS', 'VENDOR', 'BASE PO', 'BASE REQ.', 'REQUEST TYPE', 'PAYMENT TYPE', 'POST DATE', 'DUE DATE', 'DOC TOTAL'];
    const csvRows = [
      headers.join(','),
      ...invoicesList.map(r => [
        r.ID,
        `"${r.OrderCode || `INV26/${r.ID}`}"`,
        `"${r.SAPDocNum || ''}"`,
        `"${r.Status || 'Open'}"`,
        `"${(r.CustName || r.CustCode || '').replace(/"/g, '""')}"`,
        `"${r.purchaseOrder || 'N/A'}"`,
        `"${r.RequestedNo || 'N/A'}"`,
        `"${r.TypeRequest || 'Item'}"`,
        `"${r.TypePayment || 'Cash'}"`,
        `"${r.PostDate ? new Date(r.PostDate).toISOString().split('T')[0] : ''}"`,
        `"${r.DueDate ? new Date(r.DueDate).toISOString().split('T')[0] : ''}"`,
        r.DocTotal || 0,
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'APInvoicesExport.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<ApInvoice, unknown>[] = [
    {
      accessorKey: 'ID',
      header: 'ID',
      cell: ({ row }) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
          {row.original.ID}
        </span>
      ),
    },
    {
      accessorKey: 'OrderCode',
      header: 'INVOICE NO',
      cell: ({ row }) => (
        <span 
          className="text-xs font-bold cursor-pointer hover:underline whitespace-nowrap"
          style={{ color: 'var(--color-primary)' }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/procurement/ap-invoice/view/${row.original.ID}`);
          }}
        >
          {row.original.OrderCode || `INV26/${row.original.ID}`}
        </span>
      ),
    },
    {
      accessorKey: 'SAPDocNum',
      header: 'SAP DOC #',
      cell: ({ row }) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
          {row.original.SAPDocNum || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'Status',
      header: 'STATUS',
      cell: ({ row }) => {
        const raw = (row.original.Status || '').toUpperCase();
        const s = raw === 'C' || raw === 'CLOSED' || raw === 'L' || raw === 'PAID' ? 'Paid' : raw === 'P' || raw === 'PENDING' ? 'Pending' : 'Open';
        
        let badgeStyle = 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400';
        if (s === 'Open') {
          badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400';
        } else if (s === 'Pending') {
          badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400';
        }

        return (
          <span className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full border whitespace-nowrap ${badgeStyle}`}>
            {s}
          </span>
        );
      },
    },
    {
      accessorKey: 'CustName',
      header: 'VENDOR',
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate text-xs font-medium text-slate-900 dark:text-white" title={row.original.CustName || row.original.CustCode || ''}>
          {row.original.CustName || row.original.CustCode || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'TypeRequest',
      header: 'TYPE',
      cell: ({ row }) => {
        const reqType = row.original.TypeRequest || row.original.RequestType || 'Item';
        const isService = reqType.toLowerCase() === 'service';
        return (
          <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md uppercase whitespace-nowrap ${
            isService
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300'
          }`}>
            {reqType}
          </span>
        );
      },
    },
    {
      accessorKey: 'purchaseOrder',
      header: 'BASE PO / GRPO',
      cell: ({ row }) => {
        const po = row.original.purchaseOrder;
        const rel = row.original.relation_from;
        return (
          <span className="text-xs text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">
            {po || rel || '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'PostDate',
      header: 'POST DATE',
      cell: ({ row }) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
          {row.original.PostDate ? new Date(row.original.PostDate).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'DueDate',
      header: 'DUE DATE',
      cell: ({ row }) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
          {row.original.DueDate ? new Date(row.original.DueDate).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'DocTotal',
      header: 'DOC TOTAL',
      cell: ({ row }) => (
        <span className="text-xs font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap">
          ${Number(row.original.DocTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Tooltip content="View AP Invoice" position="top">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/procurement/ap-invoice/view/${row.original.ID}`);
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
                navigate(`/procurement/ap-invoice/edit/${row.original.ID}`);
              }}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
          <Tooltip content="Delete AP Invoice" position="top">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setInvoiceToDelete(row.original);
                setIsDeleteModalOpen(true);
              }}
              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
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
            <Receipt className="w-4.5 h-4.5" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Accounts Payable Invoices
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Manage accounts payable, supplier bills, and payment settlements
            </p>
          </div>
        </div>

        {/* Right side: Import, Export, + New AP Invoice */}
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

          <Link to="/procurement/ap-invoice/new">
            <button
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg text-white shadow-xs transition-all hover:opacity-95 active:scale-98 cursor-pointer"
              style={{ background: 'var(--color-primary)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              New AP Invoice
            </button>
          </Link>
        </div>
      </div>

      {/* Dynamic KPI Stats Cards Row (Real counts from API) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Invoices */}
        <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Receipt className="w-3 h-3" />
              </div>
              Total AP Invoices
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

        {/* Card 2: Open / Unpaid */}
        <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-3 h-3" />
              </div>
              Open / Unpaid
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.openCount}</div>
            <div className="text-[10px] text-slate-400">
              ${stats.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to pay
            </div>
          </div>
          <div className="text-amber-400 opacity-60">
            <AlertCircle className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 3: Paid Invoices */}
        <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CreditCard className="w-3 h-3" />
              </div>
              Paid Invoices
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.paidCount}</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              ${stats.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} settled
            </div>
          </div>
          <div className="text-emerald-400 opacity-60">
            <CreditCard className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 4: Total Value */}
        <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <FileText className="w-3 h-3" />
              </div>
              Total Value
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              ${stats.totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400">
              Total AP volume
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
          data={invoicesList}
          isLoading={isLoading}
            enableRowSelection={true}
            enableExport={true}
            exportFileName="ap-invoices"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search vendor, AP invoice code..."
            extraFilters={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={typeRequestFilter}
                  onChange={(e) => setTypeRequestFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="Item">Item</option>
                  <option value="Service">Service</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed / Paid</option>
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
            onRowClick={(row) => navigate(`/procurement/ap-invoice/view/${row.ID}`)}
          />
      </div>

      {/* Glass Delete Confirmation Modal */}
      {isDeleteModalOpen && invoiceToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card bg-white/90 dark:bg-slate-800/90 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 dark:border-white/10 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete AP Invoice</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to delete invoice <span className="font-semibold text-slate-700 dark:text-slate-300">{invoiceToDelete.OrderCode || `#${invoiceToDelete.ID}`}</span>?
                </p>
              </div>
            </div>
            <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 p-2.5 rounded-xl border border-rose-200/50 dark:border-rose-900/30">
              This action will permanently delete this accounts payable record from the system.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setInvoiceToDelete(null);
                }}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default APInvoiceList;
