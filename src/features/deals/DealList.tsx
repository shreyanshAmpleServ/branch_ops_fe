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
  Handshake,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  useSalesOrders,
  useDeleteSalesOrder,
  type SalesOrder,
} from './api/useSalesOrders';
import { DataTable, type ColumnDef } from '../../components/table/DataTable';
import { Button, Spinner, DateRangePicker, Tooltip, Badge } from '../../components/ui';

export const DealList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: rawOrders, isLoading, refetch, isRefetching } = useSalesOrders({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const deleteMutation = useDeleteSalesOrder();
  const ordersList: SalesOrder[] = rawOrders || [];

  const handleExportCSV = () => {
    if (!ordersList || ordersList.length === 0) return;
    const headers = ['ID', 'ORDER CODE', 'SAP DOC #', 'CUSTOMER CODE', 'CUSTOMER NAME', 'POST DATE', 'DUE DATE', 'STATUS', 'DOC TOTAL'];
    const csvRows = [
      headers.join(','),
      ...ordersList.map(r => [
        r.ID,
        `"${r.OrderCode || `SO/${r.ID}`}"`,
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
    link.setAttribute('download', 'SalesOrdersExport.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this sales order?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns: ColumnDef<SalesOrder, unknown>[] = [
    {
      accessorKey: 'OrderCode',
      header: 'Order #',
      cell: ({ row }) => (
        <span className="font-semibold text-teal-600 dark:text-teal-400">
          {row.original.OrderCode || `SO/${row.original.ID}`}
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
      accessorKey: 'QuotationCode',
      header: 'Base Quote',
      cell: ({ row }) => {
        const qCode = row.original.QuotationCode;
        const qId = row.original.QuotationId;
        if (!qCode && !qId) return <span className="text-slate-400">—</span>;
        return (
          <Link
            to={`/quotations/view/${qId}`}
            className="text-teal-600 hover:underline font-medium text-xs"
          >
            {qCode || `QT/${qId}`}
          </Link>
        );
      },
    },
    {
      accessorKey: 'PostDate',
      header: 'Order Date',
      cell: ({ row }) => {
        const val = row.original.PostDate;
        return <span className="text-xs text-slate-500">{val ? new Date(val).toLocaleDateString() : '—'}</span>;
      },
    },
    {
      accessorKey: 'DueDate',
      header: 'Delivery Due',
      cell: ({ row }) => {
        const val = row.original.DueDate;
        return <span className="text-xs text-slate-500">{val ? new Date(val).toLocaleDateString() : '—'}</span>;
      },
    },
    {
      accessorKey: 'DocTotal',
      header: 'Total Amount',
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900 dark:text-white">
          ${Number(row.original.DocTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'Status',
      header: 'Status',
      cell: ({ row }) => {
        const status = (row.original.Status || 'O').toUpperCase();
        let variant: 'success' | 'warning' | 'default' | 'primary' = 'default';
        let label = 'Open';

        if (status === 'C' || status === 'CLOSED') {
          variant = 'success';
          label = 'Invoiced / Closed';
        } else if (status === 'O' || status === 'OPEN') {
          variant = 'warning';
          label = 'Open';
        } else if (status === 'P' || status === 'PENDING') {
          variant = 'primary';
          label = 'Pending';
        }

        return <Badge variant={variant} dot>{label}</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Tooltip content="View Order" position="top">
            <button
              onClick={() => navigate(`/deals/view/${row.original.ID}`)}
              className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Edit" position="top">
            <button
              onClick={() => navigate(`/deals/edit/${row.original.ID}`)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Copy to AR Invoice" position="top">
            <button
              onClick={() => navigate(`/invoice/new?copyFromOrder=${row.original.ID}`)}
              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
            >
              <Receipt className="w-4 h-4" />
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
            <Handshake className="w-7 h-7 text-teal-600" /> Sales Orders
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage customer sales orders and generate AR invoices
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
          <Link to="/deals/new">
            <Button
              variant="primary"
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-md transition-all hover:shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Sales Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Spinner className="w-8 h-8 text-teal-600" />
            <p className="text-xs text-slate-500">Loading sales orders from database...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={ordersList}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search customer, order code..."
            extraFilters={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="closed">Invoiced / Closed</option>
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

export default DealList;
