import React, { useState, useMemo, useRef } from 'react';
import {
  ArrowUpRight,
  Search,
  Download,
  RefreshCw,
  Plus,
  Eye,
  Building,
  CreditCard,
  Wallet,
  CheckCircle2,
  X,
  Printer,
  Receipt,
  FileText,
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/table';
import { Button, Spinner, DateRangePicker, Tooltip, Badge, Card } from '../../components/ui';
import {
  useOutgoingPayments,
  useCreateOutgoingPayment,
  type OutgoingPayment,
} from './api/useBanking';

export const OutgoingPaymentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<OutgoingPayment | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    vendor_code: '',
    payment_type: 'Outgoing Payment (A/P Invoice)',
    posting_date: new Date().toISOString().split('T')[0],
    document_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    journal_remarks: '',
    total_amount: 0,
    currency: 'TZS',
    means_type: 'bank',
    gl_account: 'CRDB Bank - Main (TZS)',
    bank_name: 'CRDB Bank',
    account_number: '015024458900',
    check_number: '',
  });

  const printRef = useRef<HTMLDivElement>(null);

  // Query
  const { data: payments = [], isLoading, refetch, isRefetching } = useOutgoingPayments({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const createMutation = useCreateOutgoingPayment();

  // Metrics
  const metrics = useMemo(() => {
    let total = 0;
    let bankTotal = 0;
    let chequeTotal = 0;
    payments.forEach((p) => {
      const amt = Number(p.total_amount || 0);
      total += amt;
      const means = p.primary_means?.toLowerCase() || '';
      if (means.includes('check') || means.includes('cheque')) {
        chequeTotal += amt;
      } else {
        bankTotal += amt;
      }
    });
    return {
      total,
      bankTotal,
      chequeTotal,
      count: payments.length,
    };
  }, [payments]);

  // CSV Export
  const handleExportCSV = () => {
    if (!payments || payments.length === 0) return;
    const headers = ['ID', 'DOC NUMBER', 'VENDOR CODE', 'TYPE', 'POST DATE', 'BANK / MEANS', 'CURRENCY', 'TOTAL AMOUNT', 'STATUS'];
    const csvRows = [
      headers.join(','),
      ...payments.map((r) => [
        r.id,
        `"${r.doc_number}"`,
        `"${r.vendor_code}"`,
        `"${r.payment_type || ''}"`,
        `"${r.posting_date ? new Date(r.posting_date).toISOString().split('T')[0] : ''}"`,
        `"${r.bank_account || r.primary_means || 'bank'}"`,
        `"${r.currency || 'TZS'}"`,
        r.total_amount || 0,
        `"${r.status || 'Posted'}"`,
      ].join(',')),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'OutgoingPaymentsExport.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Form submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendor_code) {
      alert('Please enter a vendor code.');
      return;
    }
    if (!formData.total_amount || formData.total_amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        vendor_code: formData.vendor_code,
        payment_type: formData.payment_type,
        posting_date: formData.posting_date,
        document_date: formData.document_date,
        reference_number: formData.reference_number,
        journal_remarks: formData.journal_remarks,
        total_amount: Number(formData.total_amount),
        currency: formData.currency,
        status: 'Posted',
        means: [
          {
            means_type: formData.means_type,
            gl_account: formData.gl_account,
            amount: Number(formData.total_amount),
            reference_num: formData.reference_number,
            bank_name: formData.bank_name,
            account_number: formData.account_number,
            check_number: formData.check_number,
          },
        ],
      });
      setIsCreateOpen(false);
      setFormData({
        vendor_code: '',
        payment_type: 'Outgoing Payment (A/P Invoice)',
        posting_date: new Date().toISOString().split('T')[0],
        document_date: new Date().toISOString().split('T')[0],
        reference_number: '',
        journal_remarks: '',
        total_amount: 0,
        currency: 'TZS',
        means_type: 'bank',
        gl_account: 'CRDB Bank - Main (TZS)',
        bank_name: 'CRDB Bank',
        account_number: '015024458900',
        check_number: '',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to record outgoing payment');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Table Columns
  const columns: ColumnDef<OutgoingPayment, unknown>[] = [
    {
      accessorKey: 'doc_number',
      header: 'DOC #',
      cell: ({ row }) => (
        <span className="font-bold text-teal-600 dark:text-teal-400 font-mono text-xs">
          {row.original.doc_number}
        </span>
      ),
    },
    {
      accessorKey: 'vendor_code',
      header: 'VENDOR',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
            {row.original.vendor_name || row.original.vendor_code}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">{row.original.vendor_code}</div>
        </div>
      ),
    },
    {
      accessorKey: 'payment_type',
      header: 'TYPE',
      cell: ({ row }) => (
        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
          {row.original.payment_type || 'Outgoing Payment'}
        </span>
      ),
    },
    {
      accessorKey: 'posting_date',
      header: 'POST DATE',
      cell: ({ row }) => {
        const val = row.original.posting_date;
        return <span className="text-xs text-slate-500 font-mono">{val ? new Date(val).toLocaleDateString() : '—'}</span>;
      },
    },
    {
      accessorKey: 'bank_account',
      header: 'BANK / GL ACCOUNT',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
          <Building className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate max-w-[200px]" title={row.original.bank_account || 'CRDB Bank'}>
            {row.original.bank_account || 'CRDB Bank - Main'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'total_amount',
      header: 'TOTAL PAID',
      cell: ({ row }) => (
        <span className="font-bold text-slate-900 dark:text-white text-xs font-mono">
          ${Number(row.original.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
          <span className="text-[10px] text-slate-400 font-normal">{row.original.currency || 'TZS'}</span>
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'STATUS',
      cell: ({ row }) => {
        const status = (row.original.status || 'Posted').toUpperCase();
        let variant: 'success' | 'warning' | 'default' = 'default';
        if (status === 'POSTED' || status === 'COMPLETED') variant = 'success';
        else if (status === 'DRAFT' || status === 'PENDING') variant = 'warning';

        return <Badge variant={variant} dot>{row.original.status || 'Posted'}</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Tooltip content="View Voucher" position="top">
            <button
              onClick={() => setSelectedPayment(row.original)}
              className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ArrowUpRight className="w-7 h-7 text-indigo-600" /> Outgoing Payments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supplier settlements, AP invoice payments, wire disbursements, and payment vouchers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Outgoing Payment
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-indigo-500 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Disbursed</span>
            <ArrowUpRight className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            ${metrics.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-indigo-600 font-medium mt-1">Total vendor payouts</div>
        </Card>

        <Card className="p-5 border-l-4 border-l-blue-500 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Bank Transfers</span>
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            ${metrics.bankTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">EFT & wire settlements</div>
        </Card>

        <Card className="p-5 border-l-4 border-l-purple-500 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cheque Payments</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            ${metrics.chequeTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-purple-600 font-medium mt-1">Physical cheques issued</div>
        </Card>

        <Card className="p-5 border-l-4 border-l-teal-500 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Vouchers</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {metrics.count}
          </div>
          <div className="text-[11px] text-teal-600 font-medium mt-1">Processed vouchers</div>
        </Card>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Spinner className="w-8 h-8 text-indigo-600" />
            <p className="text-xs text-slate-500">Loading outgoing payments...</p>
          </div>
        ) : (
          <DataTable
            data={payments}
            columns={columns}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by doc #, vendor, reference..."
            enableViewToggle={true}
            defaultViewMode="table"
            pagination
            pageSize={10}
            extraFilters={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="Posted">Posted</option>
                  <option value="Draft">Draft</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                  }}
                />

                <Tooltip content="Refresh" position="bottom">
                  <button
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className="p-2 text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                  </button>
                </Tooltip>

                <Tooltip content="Export CSV" position="bottom">
                  <button
                    onClick={handleExportCSV}
                    className="p-2 text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            }
            renderCard={(payment) => {
              const status = (payment.status || 'Posted').toUpperCase();
              let variant: 'success' | 'warning' | 'default' = 'default';
              if (status === 'POSTED' || status === 'COMPLETED') variant = 'success';
              else if (status === 'DRAFT' || status === 'PENDING') variant = 'warning';

              return (
                <div className="flex flex-col justify-between h-full space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                    <div>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm font-mono block">{payment.doc_number}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {payment.posting_date ? new Date(payment.posting_date).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    <Badge variant={variant} dot>{payment.status || 'Posted'}</Badge>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0">
                        {(payment.vendor_name || 'V').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={payment.vendor_name}>
                          {payment.vendor_name || payment.vendor_code}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{payment.vendor_code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{payment.bank_account || 'CRDB Bank - Main'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium capitalize">
                      {payment.payment_type || 'Outgoing Payment'}
                    </span>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                        ${Number(payment.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">{payment.currency || 'TZS'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end border-t border-slate-100 dark:border-slate-700/60">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPayment(payment);
                      }}
                      className="w-full py-1.5 px-3 text-xs font-semibold bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Voucher
                    </button>
                  </div>
                </div>
              );
            }}
            emptyMessage="No outgoing payments found matching your criteria."
          />
        )}
      </div>

      {/* View Voucher Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
                <FileText className="w-5 h-5" /> Payment Voucher
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handlePrint} className="flex items-center gap-1.5 text-xs">
                  <Printer className="w-4 h-4" /> Print
                </Button>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div ref={printRef} className="p-8 space-y-6 overflow-y-auto">
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-4">
                <div>
                  <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">PAYMENT DISBURSEMENT VOUCHER</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Voucher #{selectedPayment.doc_number}</p>
                </div>
                <div className="text-right text-xs space-y-1">
                  <div>
                    <span className="text-slate-400">Date: </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedPayment.posting_date ? new Date(selectedPayment.posting_date).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Status: </span>
                    <span className="font-semibold text-emerald-600">{selectedPayment.status || 'Posted'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl text-xs">
                <div>
                  <div className="text-slate-400 font-medium uppercase text-[10px]">Beneficiary / Vendor</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                    {selectedPayment.vendor_name || selectedPayment.vendor_code}
                  </div>
                  <div className="text-slate-500 font-mono mt-0.5">{selectedPayment.vendor_code}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium uppercase text-[10px]">Bank / Account</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                    {selectedPayment.bank_account || 'CRDB Bank - Main'}
                  </div>
                  {selectedPayment.reference_number && (
                    <div className="text-slate-500 mt-0.5">Ref: {selectedPayment.reference_number}</div>
                  )}
                </div>
              </div>

              {selectedPayment.journal_remarks && (
                <div className="text-xs bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Journal Remarks: </span>
                  <span className="text-slate-700 dark:text-slate-200">{selectedPayment.journal_remarks}</span>
                </div>
              )}

              <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <span className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">TOTAL DISBURSED AMOUNT</span>
                <span className="font-black text-xl text-indigo-700 dark:text-indigo-400 font-mono">
                  ${Number(selectedPayment.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-xs">{selectedPayment.currency || 'TZS'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Outgoing Payment Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" /> New Outgoing Payment
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vendor Code / Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. V_000001 or Acme Supplier"
                    value={formData.vendor_code}
                    onChange={(e) => setFormData({ ...formData, vendor_code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.means_type}
                    onChange={(e) => setFormData({ ...formData, means_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="bank">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="check">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Posting Date
                  </label>
                  <input
                    type="date"
                    value={formData.posting_date}
                    onChange={(e) => setFormData({ ...formData, posting_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.total_amount || ''}
                    onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bank / Source GL Account
                  </label>
                  <input
                    type="text"
                    value={formData.gl_account}
                    onChange={(e) => setFormData({ ...formData, gl_account: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reference / Check #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WIRE-99120"
                    value={formData.reference_number}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                  Journal Remarks / Description
                </label>
                <textarea
                  rows={2}
                  value={formData.journal_remarks}
                  onChange={(e) => setFormData({ ...formData, journal_remarks: e.target.value })}
                  placeholder="Settlement for supplier goods, monthly invoice..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={createMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-5 rounded-xl shadow-md"
                >
                  {createMutation.isPending ? 'Saving...' : 'Post Outgoing Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutgoingPaymentsPage;
