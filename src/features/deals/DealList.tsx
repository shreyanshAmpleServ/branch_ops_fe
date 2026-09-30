import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  RefreshCw,
  Edit2,
  Eye,
  Handshake,
  CheckCircle2,
  Clock,
  TrendingUp,
  Upload,
  Download,
  MoreVertical,
  BarChart3,
  Receipt
} from 'lucide-react';
import {
  useSalesOrders,
  useDeleteSalesOrder,
  type SalesOrder,
} from './api/useSalesOrders';
import { DataTable, type ColumnDef } from '../../components/table/DataTable';
import { Spinner, DateRangePicker, Tooltip } from '../../components/ui';

export const DealList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: rawOrders, isLoading, refetch, isRefetching } = useSalesOrders({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const deleteMutation = useDeleteSalesOrder();
  const ordersList: SalesOrder[] = useMemo(() => rawOrders || [], [rawOrders]);

  // Dynamic KPI stats calculated directly from API data
  const stats = useMemo(() => {
    const totalCount = ordersList.length;
    let openCount = 0;
    let closedCount = 0;
    let approvedCount = 0;
    let totalValue = 0;

    ordersList.forEach(o => {
      const raw = (o.Status || 'O').trim();
      const s = raw.toUpperCase();
      totalValue += Number(o.DocTotal || 0);

      if (s === 'OPEN' || s === 'O') {
        openCount++;
      } else if (s === 'CLOSED' || s === 'C' || s === 'L') {
        closedCount++;
      } else if (s === 'APPROVED' || s === 'A') {
        approvedCount++;
      }
    });

    return {
      totalCount,
      openCount,
      closedCount,
      approvedCount,
      totalValue,
    };
  }, [ordersList]);

  // Extract any other unique status names present in the data
  const uniqueOtherStatuses = useMemo(() => {
    const set = new Set<string>();
    ordersList.forEach(o => {
      if (!o.Status) return;
      const s = o.Status.trim();
      const upper = s.toUpperCase();
      if (!['O', 'OPEN', 'L', 'C', 'CLOSED', 'A', 'APPROVED'].includes(upper)) {
        set.add(s.charAt(0).toUpperCase() + s.slice(1));
      }
    });
    return Array.from(set);
  }, [ordersList]);

  // Dynamic Customers from API
  const customerOptions = useMemo(() => {
    const map = new Map<string, string>();
    ordersList.forEach(o => {
      if (o.CustCode) {
        map.set(o.CustCode, o.CustName || o.CustCode);
      }
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [ordersList]);

  // Filtered list
  const filteredList = useMemo(() => {
    return ordersList.filter(o => {
      const raw = (o.Status || 'O').trim();
      const s = raw.toUpperCase();

      if (statusFilter !== 'all') {
        if (statusFilter === 'open' && s !== 'OPEN' && s !== 'O') return false;
        if (statusFilter === 'closed' && s !== 'CLOSED' && s !== 'C' && s !== 'L') return false;
        if (statusFilter === 'approved' && s !== 'APPROVED' && s !== 'A') return false;
        if (
          statusFilter !== 'open' &&
          statusFilter !== 'closed' &&
          statusFilter !== 'approved' &&
          s !== statusFilter.toUpperCase()
        ) {
          return false;
        }
      }

      if (customerFilter !== 'all' && o.CustCode !== customerFilter) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const codeMatch = (o.OrderCode || '').toLowerCase().includes(term);
        const nameMatch = (o.CustName || '').toLowerCase().includes(term);
        const sapMatch = (o.SAPDocNum || '').toLowerCase().includes(term);
        const custCodeMatch = (o.CustCode || '').toLowerCase().includes(term);
        if (!codeMatch && !nameMatch && !sapMatch && !custCodeMatch) return false;
      }

      return true;
    });
  }, [ordersList, statusFilter, customerFilter, searchTerm]);

  const handleExportCSV = () => {
    if (!filteredList || filteredList.length === 0) return;
    const headers = ['ID', 'ORDER CODE', 'SAP DOC #', 'CUSTOMER CODE', 'CUSTOMER NAME', 'POST DATE', 'DUE DATE', 'STATUS', 'DOC TOTAL'];
    const csvRows = [
      headers.join(','),
      ...filteredList.map(r => [
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

  const columns: ColumnDef<SalesOrder, unknown>[] = [
    {
      accessorKey: 'OrderCode',
      header: 'ORDER #',
      cell: ({ row }) => (
        <span 
          className="font-semibold text-xs cursor-pointer hover:underline"
          style={{ color: 'var(--color-primary)' }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/orders/view/${row.original.ID}`);
          }}
        >
          {row.original.OrderCode || `SO/${row.original.ID}`}
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
        <div className="py-0.5">
          <div className="font-semibold text-slate-800 dark:text-slate-100 text-xs">{row.original.CustName || '—'}</div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{row.original.CustCode}</div>
        </div>
      ),
    },
    {
      accessorKey: 'QuotationCode',
      header: 'BASE QUOTE',
      cell: ({ row }) => {
        const qCode = row.original.QuotationCode;
        const qId = row.original.QuotationId;
        if (!qCode && !qId) return <span className="text-xs text-slate-400">—</span>;
        return (
          <Link
            to={`/quotations/view/${qId}`}
            className="hover:underline font-medium text-xs"
            style={{ color: 'var(--color-primary)' }}
          >
            {qCode || `QT/${qId}`}
          </Link>
        );
      },
    },
    {
      accessorKey: 'PostDate',
      header: 'ORDER DATE',
      cell: ({ row }) => {
        const val = row.original.PostDate;
        return <span className="text-xs text-slate-600 dark:text-slate-300">{val ? new Date(val).toLocaleDateString() : '—'}</span>;
      },
    },
    {
      accessorKey: 'DueDate',
      header: 'DELIVERY DUE',
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
        const raw = (row.original.Status || 'O').trim();
        const s = raw.toUpperCase();

        if (s === 'O' || s === 'OPEN') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50/80 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Open
            </span>
          );
        }
        if (s === 'L' || s === 'C' || s === 'CLOSED') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Closed
            </span>
          );
        }
        if (s === 'A' || s === 'APPROVED') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Approved
            </span>
          );
        }
        if (s === 'P' || s === 'PENDING') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Pending
            </span>
          );
        }
        if (s === 'CAN' || s === 'CANCELLED' || s === 'CANCELED' || s === 'X') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Cancelled
            </span>
          );
        }

        // For any other status value: show that name directly!
        const displayName = raw ? (raw.charAt(0).toUpperCase() + raw.slice(1)) : 'Unknown';
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {displayName}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Tooltip content="View Order" position="top">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/orders/view/${row.original.ID}`);
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
                navigate(`/orders/edit/${row.original.ID}`);
              }}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
          <Tooltip content="Copy to AR Invoice" position="top">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/invoice/new?copyFromOrder=${row.original.ID}`);
              }}
              className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
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
            <Handshake className="w-4.5 h-4.5" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Sales Orders
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Manage customer sales orders, track delivery commitments and generate invoices
            </p>
          </div>
        </div>

        {/* Right side: Actions */}
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

          <Link to="/orders/new">
            <button
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg text-white shadow-xs transition-all hover:opacity-95 active:scale-98 cursor-pointer"
              style={{ background: 'var(--color-primary)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              New Sales Order
            </button>
          </Link>
        </div>
      </div>

      {/* Dynamic KPI Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Card 1: Total Orders */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <div className="w-5.5 h-5.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Handshake className="w-3 h-3" />
              </div>
              Total Sales Orders
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.totalCount}</div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              Active in database
            </div>
          </div>
          <div className="text-blue-500/60 dark:text-blue-400/50">
            <BarChart3 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 2: Open Orders */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <div className="w-5.5 h-5.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Clock className="w-3 h-3" />
              </div>
              Open Orders
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.openCount}</div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
              Awaiting fulfillment
            </div>
          </div>
          <div className="text-amber-500/60 dark:text-amber-400/50">
            <BarChart3 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 3: Invoiced / Closed */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <div className="w-5.5 h-5.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              Invoiced / Closed
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.closedCount}</div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              Fulfilled orders
            </div>
          </div>
          <div className="text-emerald-500/60 dark:text-emerald-400/50">
            <BarChart3 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 4: Total Order Value */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <div className="w-5.5 h-5.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <span className="font-bold text-xs">$</span>
              </div>
              Total Order Value
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              Cumulative total
            </div>
          </div>
          <div className="text-purple-500/60 dark:text-purple-400/50">
            <BarChart3 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

      </div>

      {/* Main Table Container - Full Width */}
      <div className="w-full">
        <DataTable
          columns={columns}
          data={filteredList}
          isLoading={isLoading}
            enableRowSelection={true}
            enableExport={true}
            exportFileName="sales-orders"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search customer, order code, SAP doc..."
            onRowClick={(row) => navigate(`/orders/view/${row.ID}`)}
            extraFilters={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  <option value="all">All Customers</option>
                  {customerOptions.map(c => (
                    <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open (O)</option>
                  <option value="closed">Closed (L / C)</option>
                  <option value="approved">Approved (A)</option>
                  {uniqueOtherStatuses.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
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

export default DealList;
