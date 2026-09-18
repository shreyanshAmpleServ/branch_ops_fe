import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, RefreshCw, Edit2, FileSpreadsheet, Eye, Receipt, Trash2 } from 'lucide-react';
import {
  useApInvoices,
  useDeleteApInvoice,
  type ApInvoice
} from './api/useApInvoices';
import { DataTable, type ColumnDef } from '../../../components/table/DataTable';
import { Button, Spinner, DateRangePicker, Tooltip } from '../../../components/ui';

export const APInvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeRequestFilter, setTypeRequestFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: rawInvoices, isLoading, refetch, isRefetching } = useApInvoices({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    typeRequest: typeRequestFilter !== 'all' ? typeRequestFilter : undefined,
  });

  const deleteMutation = useDeleteApInvoice();

  const invoicesList: ApInvoice[] = (Array.isArray(rawInvoices) ? rawInvoices : (rawInvoices as any)?.data) || [];

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

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this AP Invoice?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        alert('Failed to delete AP Invoice');
      }
    }
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
        <Link
          to={`/procurement/ap-invoice/view/${row.original.ID}`}
          className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline whitespace-nowrap"
        >
          {row.original.OrderCode || `INV26/${row.original.ID}`}
        </Link>
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
        const s = raw === 'C' || raw === 'CLOSED' || raw === 'L' ? 'Closed' : raw === 'P' || raw === 'PENDING' ? 'Pending' : 'Open';
        
        let badgeStyle = 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400';
        if (s === 'Closed') {
          badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400';
        } else if (s === 'Pending') {
          badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400';
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
      header: 'TOTAL AMOUNT',
      cell: ({ row }) => (
        <span className="text-xs font-bold text-teal-600 dark:text-teal-400 font-mono whitespace-nowrap">
          {Number(row.original.DocTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {row.original.Currency || 'TZS'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Tooltip content="View Invoice">
            <button
              onClick={() => navigate(`/procurement/ap-invoice/view/${row.original.ID}`)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Edit Invoice">
            <button
              onClick={() => navigate(`/procurement/ap-invoice/edit/${row.original.ID}`)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </Tooltip>
          {/* <Tooltip content="Delete">
            <button
              onClick={(e) => handleDelete(row.original.ID, e)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Tooltip> */}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-teal-600" />
            AP Invoices
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage and track Accounts Payable vendor invoices, copied from PO and Goods Receipts (GRPO)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/40"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/procurement/ap-invoice/new')}
            className="flex items-center gap-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New AP Invoice
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search invoice no, vendor, ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
          />
        </div>

        <div className="w-36">
          <select
            value={typeRequestFilter}
            onChange={(e) => setTypeRequestFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Types</option>
            <option value="Item">Item</option>
            <option value="Service">Service</option>
          </select>
        </div>

        <div className="w-36">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(s, e) => {
              setStartDate(s || '');
              setEndDate(e || '');
            }}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Spinner className="w-6 h-6 text-teal-600" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={invoicesList}
            pageSize={10}
          />
        )}
      </div>
    </div>
  );
};
