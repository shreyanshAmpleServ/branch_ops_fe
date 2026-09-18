import React, { useState, useMemo } from 'react';
import {
  Clock,
  Search,
  Download,
  RefreshCw,
  Eye,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  X,
  CreditCard,
  Building,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/table';
import { Button, Tooltip, Badge, Card } from '../../components/ui';
import { usePendingPoPayments, type PendingPoPayment } from './api/useBanking';

export const PendingPoPaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<PendingPoPayment | null>(null);

  // Query
  const {
    data: pendingList = [],
    isLoading,
    refetch,
    isRefetching,
  } = usePendingPoPayments({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  // Filter client-side for priority if set
  const filteredList = useMemo(() => {
    return pendingList.filter((item) => {
      if (priorityFilter !== 'all' && item.priority?.toLowerCase() !== priorityFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [pendingList, priorityFilter]);

  // Overview metrics
  const metrics = useMemo(() => {
    let totalLiability = 0;
    let totalAdvances = 0;
    let highPriorityCount = 0;

    filteredList.forEach((item) => {
      totalLiability += Number(item.balance || item.advance_amount || 0);
      totalAdvances += Number(item.advance_amount || 0);
      if (item.priority?.toLowerCase().includes('high') || item.priority?.toLowerCase().includes('urgent')) {
        highPriorityCount++;
      }
    });

    return {
      totalLiability,
      totalAdvances,
      highPriorityCount,
      count: filteredList.length,
    };
  }, [filteredList]);

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredList.length) return;
    const headers = [
      'Request #',
      'PO ID',
      'PO Total',
      'Advance Amount',
      'Balance Due',
      'Priority',
      'Required By',
      'Status',
      'Justification',
    ];

    const rows = filteredList.map((p) => [
      p.request_no,
      p.po_id || 'N/A',
      p.po_total || 0,
      p.advance_amount || 0,
      p.balance || 0,
      p.priority || 'Normal',
      p.funds_required_by || 'N/A',
      p.status || 'Pending',
      `"${(p.justification || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Pending_PO_Payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Priority badge formatter
  const getPriorityBadge = (priority?: string) => {
    const p = (priority || '').toLowerCase();
    if (p.includes('high') || p.includes('urgent')) {
      return (
        <Badge variant="danger" className="bg-rose-500/10 text-rose-600 border border-rose-500/20">
          High Priority
        </Badge>
      );
    }
    if (p.includes('medium')) {
      return (
        <Badge variant="warning" className="bg-amber-500/10 text-amber-600 border border-amber-500/20">
          Medium
        </Badge>
      );
    }
    return (
      <Badge variant="neutral" className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
        Normal
      </Badge>
    );
  };

  // Status badge formatter
  const getStatusBadge = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('processed') || s.includes('paid') || s.includes('completed')) {
      return (
        <Badge variant="success" className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          Settled
        </Badge>
      );
    }
    if (s.includes('approved')) {
      return (
        <Badge variant="primary" className="bg-blue-500/10 text-blue-600 border border-blue-500/20">
          Approved
        </Badge>
      );
    }
    return (
      <Badge variant="warning" className="bg-amber-500/10 text-amber-600 border border-amber-500/20">
        Pending Payout
      </Badge>
    );
  };

  // Table columns definition
  const columns = useMemo<ColumnDef<PendingPoPayment>[]>(() => [
    {
      accessorKey: 'request_no',
      header: 'Request #',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-primary-600 dark:text-primary-400">
            {row.original.request_no}
          </span>
          <span className="text-xs text-neutral-500">
            Commitment #{row.original.id}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'po_id',
      header: 'PO Reference',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-neutral-400" />
          <span className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
            {row.original.po_id ? `PO #${row.original.po_id}` : 'General Commitment'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'po_total',
      header: 'PO Total Value',
      cell: ({ row }) => {
        const amt = Number(row.original.po_total || 0);
        return (
          <span className="font-mono text-sm text-neutral-700 dark:text-neutral-300">
            {amt > 0 ? `TZS ${amt.toLocaleString()}` : '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'advance_amount',
      header: 'Advance Requested',
      cell: ({ row }) => {
        const amt = Number(row.original.advance_amount || 0);
        return (
          <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
            TZS {amt.toLocaleString()}
          </span>
        );
      },
    },
    {
      accessorKey: 'balance',
      header: 'Balance Due',
      cell: ({ row }) => {
        const amt = Number(row.original.balance || 0);
        return (
          <span className="font-mono text-sm text-neutral-900 dark:text-neutral-100 font-semibold">
            TZS {amt.toLocaleString()}
          </span>
        );
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => getPriorityBadge(row.original.priority),
    },
    {
      accessorKey: 'funds_required_by',
      header: 'Required By',
      cell: ({ row }) => {
        const d = row.original.funds_required_by;
        return (
          <span className="text-xs text-neutral-600 dark:text-neutral-400">
            {d ? new Date(d).toLocaleDateString('en-GB') : 'Standard'}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-1.5">
            <Tooltip content="View Commitment Details">
              <button
                onClick={() => setSelectedRequest(row.original)}
                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
            </Tooltip>

            <Tooltip content="Disburse via Outgoing Payment">
              <button
                onClick={() => navigate('/banking/outgoing')}
                className="px-2.5 py-1 text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-md flex items-center gap-1 transition-colors shadow-sm"
              >
                <ArrowUpRight className="w-3 h-3" />
                Pay
              </button>
            </Tooltip>
          </div>
        );
      },
    },
  ], [navigate]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-rose-600 to-rose-400 text-white rounded-xl shadow-lg shadow-rose-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                Pending PO & Advance Payments
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Track supplier advance requests, purchase order payment commitments, and cash obligations
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={!filteredList.length}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>

          <Button
            variant="primary"
            onClick={() => navigate('/banking/outgoing')}
            className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white border-0 shadow-md shadow-rose-600/20"
          >
            <ArrowUpRight className="w-4 h-4" />
            Process Outgoing Payment
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Total Pending PO Liability
              </p>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
                TZS {metrics.totalLiability.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-100 dark:border-neutral-800 pt-2">
            <span>Outstanding balance</span>
            <span className="font-semibold text-rose-600">{metrics.count} commit(s)</span>
          </div>
        </Card>

        <Card className="p-4 relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Total Advance Demands
              </p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                TZS {metrics.totalAdvances.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-100 dark:border-neutral-800 pt-2">
            <span>Requested down-payments</span>
            <span className="font-semibold text-amber-600">Pending settlement</span>
          </div>
        </Card>

        <Card className="p-4 relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                High Priority Requests
              </p>
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
                {metrics.highPriorityCount}
              </h3>
            </div>
            <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-100 dark:border-neutral-800 pt-2">
            <span>Urgent vendor commitments</span>
            <span className="font-semibold text-red-600">Requires swift action</span>
          </div>
        </Card>

        <Card className="p-4 relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Procurement Pipeline
              </p>
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                100%
              </h3>
            </div>
            <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-100 dark:border-neutral-800 pt-2">
            <span>ERP Synced with SAP POs</span>
            <span className="font-semibold text-emerald-600">Live</span>
          </div>
        </Card>
      </div>

      {/* Main Table Container */}
      <Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Spinner className="w-8 h-8 text-rose-600" />
            <p className="text-xs text-neutral-500">Loading pending PO payments...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredList}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by Request #, PO #, or justification..."
            enableViewToggle={true}
            defaultViewMode="table"
            pagination
            pageSize={10}
            extraFilters={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer"
                >
                  <option value="all">All Priorities</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low / Normal</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Processed">Processed</option>
                </select>

                <Tooltip content="Refresh" position="bottom">
                  <button
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className="p-2 text-xs text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                  </button>
                </Tooltip>

                <Tooltip content="Export CSV" position="bottom">
                  <button
                    onClick={handleExportCSV}
                    className="p-2 text-xs text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            }
            renderCard={(po) => {
              return (
                <div className="flex flex-col justify-between h-full space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <div>
                      <span className="font-bold text-rose-600 dark:text-rose-400 text-sm font-mono block">{po.request_no}</span>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        PO #{po.po_id || 'N/A'}
                      </span>
                    </div>
                    {getStatusBadge(po.status)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500">PO Total Amount</span>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono">
                        TZS {Number(po.po_total || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-200/50 dark:border-amber-900/30">
                      <span className="text-amber-800 dark:text-amber-300 font-medium">Advance Requested</span>
                      <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                        TZS {Number(po.advance_amount || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500">Balance Due</span>
                      <span className="font-bold font-mono text-neutral-900 dark:text-neutral-100">
                        TZS {Number(po.balance || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-100 dark:border-neutral-800">
                      <div>{getPriorityBadge(po.priority)}</div>
                      <span className="text-[11px] text-neutral-400">
                        Due: {po.funds_required_by ? new Date(po.funds_required_by).toLocaleDateString('en-GB') : 'Standard'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRequest(po);
                      }}
                      className="flex-1 py-1.5 px-3 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/banking/outgoing');
                      }}
                      className="flex-1 py-1.5 px-3 text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center justify-center gap-1 transition-colors shadow-sm cursor-pointer"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> Pay
                    </button>
                  </div>
                </div>
              );
            }}
            emptyMessage="No pending PO payments found matching your criteria."
          />
        )}
      </Card>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 text-rose-600 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    PO Advance Request Details
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {selectedRequest.request_no}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl">
                <div>
                  <span className="text-xs text-neutral-500 block">Purchase Order ID</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {selectedRequest.po_id ? `#${selectedRequest.po_id}` : 'General Order'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-neutral-500 block">Priority</span>
                  <div>{getPriorityBadge(selectedRequest.priority)}</div>
                </div>
                <div>
                  <span className="text-xs text-neutral-500 block">Advance Requested</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    TZS {Number(selectedRequest.advance_amount || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-neutral-500 block">Remaining Balance Due</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                    TZS {Number(selectedRequest.balance || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {selectedRequest.justification && (
                <div>
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Justification / Purpose
                  </span>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    {selectedRequest.justification}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span>Funds Required By:</span>
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  {selectedRequest.funds_required_by
                    ? new Date(selectedRequest.funds_required_by).toLocaleDateString('en-GB')
                    : 'Standard Terms'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedRequest(null);
                  navigate('/banking/outgoing');
                }}
                className="bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-1.5"
              >
                <ArrowUpRight className="w-4 h-4" />
                Go to Outgoing Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
