import React, { useState, useMemo, useRef } from 'react';
import {
  ArrowDownRight,
  Search,
  Download,
  RefreshCw,
  Plus,
  Eye,
  FileText,
  Building,
  CreditCard,
  Wallet,
  CheckCircle2,
  Calendar,
  X,
  Printer,
  Receipt,
  User,
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/table';
import { Button, Spinner, DateRangePicker, Tooltip, Badge, Card } from '../../components/ui';
import {
  useIncomingPayments,
  useCreateIncomingPayment,
  useAvailableInvoices,
  type IncomingPayment,
} from './api/useBanking';
import { useRetailers } from '../customers/api/useRetailers';

export const IncomingPaymentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<IncomingPayment | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    customer_code: '',
    payment_type: 'Incoming Payment (A/R Invoice)',
    posting_date: new Date().toISOString().split('T')[0],
    document_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    journal_remarks: '',
    currency: 'TZS',
    means_type: 'bank',
    gl_account: 'CRDB Bank - Main (TZS)',
    reference_num: '',
    selectedInvoices: [] as Array<{
      ar_invoice_id: number;
      applied_amount: number;
      total_payment: number;
      invoice_code: string;
      doc_total: number;
    }>,
  });

  const printRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: payments = [], isLoading, refetch, isRefetching } = useIncomingPayments({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const { data: retailers = [] } = useRetailers();
  const { data: availableInvoices = [] } = useAvailableInvoices(formData.customer_code || undefined);
  const createMutation = useCreateIncomingPayment();

  // Metrics calculation
  const metrics = useMemo(() => {
    let total = 0;
    let bankTotal = 0;
    let cashTotal = 0;
    payments.forEach((p) => {
      const amt = Number(p.total_amount || 0);
      total += amt;
      const means = p.primary_means?.toLowerCase() || '';
      if (means.includes('cash')) {
        cashTotal += amt;
      } else {
        bankTotal += amt;
      }
    });
    return {
      total,
      bankTotal,
      cashTotal,
      count: payments.length,
    };
  }, [payments]);

  // CSV Export
  const handleExportCSV = () => {
    if (!payments || payments.length === 0) return;
    const headers = ['ID', 'DOC NUMBER', 'CUSTOMER CODE', 'CUSTOMER NAME', 'TYPE', 'POST DATE', 'MEANS', 'CURRENCY', 'TOTAL AMOUNT', 'STATUS'];
    const csvRows = [
      headers.join(','),
      ...payments.map((r) => [
        r.id,
        `"${r.doc_number}"`,
        `"${r.customer_code}"`,
        `"${(r.customer_name || '').replace(/"/g, '""')}"`,
        `"${r.payment_type || ''}"`,
        `"${r.posting_date ? new Date(r.posting_date).toISOString().split('T')[0] : ''}"`,
        `"${r.primary_means || 'bank'}"`,
        `"${r.currency || 'TZS'}"`,
        r.total_amount || 0,
        `"${r.status || 'Posted'}"`,
      ].join(',')),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'IncomingPaymentsExport.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Form submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_code) {
      alert('Please select a customer.');
      return;
    }

    const totalAmount = formData.selectedInvoices.reduce((sum, inv) => sum + Number(inv.applied_amount || 0), 0) || 1000;

    try {
      await createMutation.mutateAsync({
        customer_code: formData.customer_code,
        payment_type: formData.payment_type,
        posting_date: formData.posting_date,
        document_date: formData.document_date,
        reference_number: formData.reference_number,
        journal_remarks: formData.journal_remarks,
        total_amount: totalAmount,
        currency: formData.currency,
        status: 'Posted',
        invoices: formData.selectedInvoices.map((inv) => ({
          ar_invoice_id: inv.ar_invoice_id,
          applied_amount: inv.applied_amount,
          total_payment: inv.applied_amount,
          balance_due: Math.max(0, inv.doc_total - inv.applied_amount),
        })),
        means: [
          {
            means_type: formData.means_type,
            gl_account: formData.gl_account,
            amount: totalAmount,
            reference_num: formData.reference_num,
          },
        ],
      });
      setIsCreateOpen(false);
      setFormData({
        customer_code: '',
        payment_type: 'Incoming Payment (A/R Invoice)',
        posting_date: new Date().toISOString().split('T')[0],
        document_date: new Date().toISOString().split('T')[0],
        reference_number: '',
        journal_remarks: '',
        currency: 'TZS',
        means_type: 'bank',
        gl_account: 'CRDB Bank - Main (TZS)',
        reference_num: '',
        selectedInvoices: [],
      });
    } catch (err: any) {
      alert(err.message || 'Failed to record incoming payment');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Table columns
  const columns: ColumnDef<IncomingPayment, unknown>[] = [
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
      accessorKey: 'customer_name',
      header: 'CUSTOMER',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
            {row.original.customer_name || row.original.customer_code}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">{row.original.customer_code}</div>
        </div>
      ),
    },
    {
      accessorKey: 'payment_type',
      header: 'TYPE',
      cell: ({ row }) => (
        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
          {row.original.payment_type || 'Incoming Payment'}
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
      accessorKey: 'primary_means',
      header: 'PAYMENT METHOD',
      cell: ({ row }) => {
        const means = (row.original.primary_means || 'bank').toLowerCase();
        let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300';
        let Icon = Building;

        if (means.includes('cash')) {
          badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300';
          Icon = Wallet;
        } else if (means.includes('check') || means.includes('cheque')) {
          badgeColor = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300';
          Icon = FileText;
        } else if (means.includes('credit') || means.includes('card')) {
          badgeColor = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300';
          Icon = CreditCard;
        }

        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeColor} capitalize`}>
            <Icon className="w-3 h-3" />
            {means}
          </span>
        );
      },
    },
    {
      accessorKey: 'total_amount',
      header: 'TOTAL RECEIVED',
      cell: ({ row }) => (
        <span className="font-bold text-slate-900 dark:text-white text-xs font-mono">
          {Number(row.original.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
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
          <Tooltip content="View Receipt" position="top">
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
            <ArrowDownRight className="w-7 h-7 text-teal-600" /> Incoming Payments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Customer collections, AR invoice settlements, bank transfers, and cash receipts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Record Incoming Payment
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-teal-500 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Received</span>
            <ArrowDownRight className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            ${metrics.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-teal-600 font-medium mt-1">Total customer cashflow</div>
        </Card>

        <Card className="p-5 border-l-4 border-l-blue-500 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Bank & Cheque</span>
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            ${metrics.bankTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">Direct wire & cheques</div>
        </Card>

        <Card className="p-5 border-l-4 border-l-emerald-500 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cash Collections</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            ${metrics.cashTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Over-the-counter cash</div>
        </Card>

        <Card className="p-5 border-l-4 border-l-purple-500 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Transactions</span>
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {metrics.count}
          </div>
          <div className="text-[11px] text-purple-600 font-medium mt-1">Completed records</div>
        </Card>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Spinner className="w-8 h-8 text-teal-600" />
            <p className="text-xs text-slate-500">Loading incoming payments...</p>
          </div>
        ) : (
          <DataTable
            data={payments}
            columns={columns}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by doc #, customer, reference..."
            enableViewToggle={true}
            defaultViewMode="table"
            pagination
            pageSize={10}
            extraFilters={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
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
                    className="p-2 text-xs text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                  </button>
                </Tooltip>

                <Tooltip content="Export CSV" position="bottom">
                  <button
                    onClick={handleExportCSV}
                    className="p-2 text-xs text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            }
            renderCard={(payment) => {
              const means = (payment.primary_means || 'cash').toLowerCase();
              let badgeColor = 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:border-teal-800 dark:text-teal-300';
              let Icon = Wallet;
              if (means.includes('bank') || means.includes('wire')) {
                badgeColor = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300';
                Icon = Building;
              } else if (means.includes('credit') || means.includes('card')) {
                badgeColor = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300';
                Icon = CreditCard;
              }

              const status = (payment.status || 'Posted').toUpperCase();
              let variant: 'success' | 'warning' | 'default' = 'default';
              if (status === 'POSTED' || status === 'COMPLETED') variant = 'success';
              else if (status === 'DRAFT' || status === 'PENDING') variant = 'warning';

              return (
                <div className="flex flex-col justify-between h-full space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                    <div>
                      <span className="font-bold text-teal-600 dark:text-teal-400 text-sm font-mono block">{payment.doc_number}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {payment.posting_date ? new Date(payment.posting_date).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    <Badge variant={variant} dot>{payment.status || 'Posted'}</Badge>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center text-xs font-bold shrink-0">
                        {(payment.customer_name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={payment.customer_name}>
                          {payment.customer_name || payment.customer_code}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{payment.customer_code}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeColor} capitalize`}>
                      <Icon className="w-2.5 h-2.5" />
                      {payment.primary_means || 'Cash'}
                    </span>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                        {Number(payment.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
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
                      className="w-full py-1.5 px-3 text-xs font-semibold bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Receipt
                    </button>
                  </div>
                </div>
              );
            }}
            emptyMessage="No incoming payments found matching your criteria."
          />
        )}
      </div>

      {/* View / Printable Receipt Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-teal-600 font-bold text-lg">
                <Receipt className="w-5 h-5" /> Official Payment Receipt
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
                  <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">INCOMING PAYMENT RECEIPT</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Reference #{selectedPayment.doc_number}</p>
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
                  <div className="text-slate-400 font-medium uppercase text-[10px]">Received From</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                    {selectedPayment.customer_name || selectedPayment.customer_code}
                  </div>
                  <div className="text-slate-500 font-mono mt-0.5">{selectedPayment.customer_code}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium uppercase text-[10px]">Payment Method</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 capitalize">
                    {selectedPayment.primary_means || 'Bank Transfer'}
                  </div>
                  {selectedPayment.reference_number && (
                    <div className="text-slate-500 mt-0.5">Ref: {selectedPayment.reference_number}</div>
                  )}
                </div>
              </div>

              {selectedPayment.incoming_payment_invoices && selectedPayment.incoming_payment_invoices.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Settled A/R Invoices
                  </h4>
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-2">Invoice #</th>
                        <th className="p-2 text-right">Applied Amount</th>
                        <th className="p-2 text-right">Discount</th>
                        <th className="p-2 text-right">Total Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {selectedPayment.incoming_payment_invoices.map((inv, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-mono font-medium">INV #{inv.ar_invoice_id}</td>
                          <td className="p-2 text-right font-mono">${Number(inv.applied_amount).toFixed(2)}</td>
                          <td className="p-2 text-right font-mono">${Number(inv.discount_amount || 0).toFixed(2)}</td>
                          <td className="p-2 text-right font-mono font-bold">${Number(inv.total_payment).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-between items-center bg-teal-50 dark:bg-teal-950/30 p-4 rounded-xl border border-teal-200 dark:border-teal-800">
                <span className="font-bold text-teal-900 dark:text-teal-200 text-sm">TOTAL AMOUNT COLLECTED</span>
                <span className="font-black text-xl text-teal-700 dark:text-teal-400 font-mono">
                  ${Number(selectedPayment.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-xs">{selectedPayment.currency || 'TZS'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Incoming Payment Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600" /> New Incoming Payment
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
                    Select Customer *
                  </label>
                  <select
                    value={formData.customer_code}
                    onChange={(e) => setFormData({ ...formData, customer_code: e.target.value, selectedInvoices: [] })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
                    required
                  >
                    <option value="">-- Choose Customer --</option>
                    {retailers.map((r: any) => (
                      <option key={r.Code} value={r.Code}>
                        {r.Name} ({r.Code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.means_type}
                    onChange={(e) => setFormData({ ...formData, means_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
                  >
                    <option value="bank">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="check">Cheque</option>
                    <option value="credit">Credit Card</option>
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bank / Account Name
                  </label>
                  <input
                    type="text"
                    value={formData.gl_account}
                    onChange={(e) => setFormData({ ...formData, gl_account: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reference / Check #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WIRE-88492"
                    value={formData.reference_number}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value, reference_num: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Outstanding AR Invoices Selection */}
              {formData.customer_code && (
                <div className="pt-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1.5">
                    Select Invoices to Settle (Optional)
                  </label>
                  {availableInvoices.length === 0 ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-500 text-xs rounded-xl border border-slate-200 dark:border-slate-700">
                      No unpaid invoices found for this customer. Payment will be recorded on account.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-900/50">
                      {availableInvoices.map((inv: any) => {
                        const isSelected = formData.selectedInvoices.some((si) => si.ar_invoice_id === inv.ID);
                        return (
                          <div
                            key={inv.ID}
                            onClick={() => {
                              if (isSelected) {
                                setFormData({
                                  ...formData,
                                  selectedInvoices: formData.selectedInvoices.filter((si) => si.ar_invoice_id !== inv.ID),
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  selectedInvoices: [
                                    ...formData.selectedInvoices,
                                    {
                                      ar_invoice_id: inv.ID,
                                      applied_amount: Number(inv.DocTotal || 0),
                                      total_payment: Number(inv.DocTotal || 0),
                                      invoice_code: inv.InvoiceCode || `INV/${inv.ID}`,
                                      doc_total: Number(inv.DocTotal || 0),
                                    },
                                  ],
                                });
                              }
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-teal-50 border-teal-300 dark:bg-teal-950/40 dark:border-teal-800'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input type="checkbox" checked={isSelected} readOnly className="rounded text-teal-600" />
                              <span className="font-bold text-teal-700 dark:text-teal-400 font-mono">
                                {inv.InvoiceCode || `INV/${inv.ID}`}
                              </span>
                              <span className="text-slate-400">({inv.PostDate ? new Date(inv.PostDate).toLocaleDateString() : '—'})</span>
                            </div>
                            <span className="font-bold font-mono text-slate-800 dark:text-slate-100">
                              ${Number(inv.DocTotal || 0).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.journal_remarks}
                  onChange={(e) => setFormData({ ...formData, journal_remarks: e.target.value })}
                  placeholder="Payment notes, bank transaction memo..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-xs text-slate-900 dark:text-white"
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
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2 px-5 rounded-xl shadow-md"
                >
                  {createMutation.isPending ? 'Saving...' : 'Post Incoming Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomingPaymentsPage;
