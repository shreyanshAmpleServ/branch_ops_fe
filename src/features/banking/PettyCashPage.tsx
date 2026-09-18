import React, { useState, useMemo, useRef } from 'react';
import {
  Wallet,
  Search,
  Download,
  RefreshCw,
  Plus,
  Eye,
  FileText,
  Building,
  CheckCircle2,
  Calendar,
  X,
  Printer,
  Receipt,
  AlertCircle,
  Clock,
  Send,
  Trash2,
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/table';
import { Button, Spinner, Tooltip, Badge, Card } from '../../components/ui';
import {
  usePettyCashAccounts,
  usePettyCashClaims,
  useCreatePettyCashClaim,
  useDisbursePettyCashClaim,
  type PettyCashClaim,
} from './api/useBanking';
import { useAuthStore } from '../../store/useAuthStore';
import { useUsers } from '../users/api/useUsers';

export const PettyCashPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { data: usersResponse } = useUsers({ limit: 100 });
  const users = usersResponse?.users || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<PettyCashClaim | null>(null);
  const [disburseModalClaim, setDisburseModalClaim] = useState<PettyCashClaim | null>(null);
  const [disburseAccountId, setDisburseAccountId] = useState<number | ''>('');

  // Create form state
  const [formData, setFormData] = useState({
    requester_user_id: currentUser?.id || 1,
    department: 'Operations',
    category: 'Office Supplies',
    request_date: new Date().toISOString().split('T')[0],
    lines: [
      {
        expense_gl_account: 'GL-6100 - General Office Supplies',
        description: '',
        amount: 0,
        has_receipt_attachment: true,
      },
    ],
  });

  const printRef = useRef<HTMLDivElement>(null);

  // Queries
  const {
    data: accounts = [],
    isLoading: accountsLoading,
    refetch: refetchAccounts,
  } = usePettyCashAccounts();

  const {
    data: claims = [],
    isLoading: claimsLoading,
    refetch: refetchClaims,
    isRefetching,
  } = usePettyCashClaims({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const createMutation = useCreatePettyCashClaim();
  const disburseMutation = useDisbursePettyCashClaim();

  // Overview metrics
  const metrics = useMemo(() => {
    const totalAuthorized = accounts.reduce((sum, a) => sum + Number(a.authorized_limit || 0), 0);
    const currentBalance = accounts.reduce((sum, a) => sum + Number(a.current_balance || 0), 0);
    const pendingClaims = claims.filter(
      (c) => c.status?.toLowerCase().includes('pending') || c.status?.toLowerCase().includes('approved')
    );
    const pendingTotal = pendingClaims.reduce((sum, c) => sum + Number(c.total_requested || 0), 0);
    const disbursedClaims = claims.filter((c) => c.status?.toLowerCase().includes('disbursed'));
    const disbursedTotal = disbursedClaims.reduce((sum, c) => sum + Number(c.total_requested || 0), 0);

    return {
      totalAuthorized,
      currentBalance,
      pendingTotal,
      pendingCount: pendingClaims.length,
      disbursedTotal,
      disbursedCount: disbursedClaims.length,
    };
  }, [accounts, claims]);

  // Handle CSV Export
  const handleExportCSV = () => {
    if (!claims.length) return;
    const headers = [
      'Claim #',
      'Requester',
      'Department',
      'Category',
      'Request Date',
      'Total Amount (TZS)',
      'Status',
      'Disbursed From',
      'Disbursed Date',
    ];

    const rows = claims.map((c) => [
      c.claim_number,
      `"${c.requester_name || ''}"`,
      `"${c.department || ''}"`,
      `"${c.category || ''}"`,
      c.request_date || '',
      c.total_requested || 0,
      c.status || '',
      `"${c.account_name || 'N/A'}"`,
      c.disbursed_date || 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Petty_Cash_Claims_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add line to form
  const handleAddLine = () => {
    setFormData((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          expense_gl_account: 'GL-6100 - General Office Supplies',
          description: '',
          amount: 0,
          has_receipt_attachment: true,
        },
      ],
    }));
  };

  // Remove line from form
  const handleRemoveLine = (idx: number) => {
    if (formData.lines.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== idx),
    }));
  };

  // Calculate form total
  const formTotalAmount = useMemo(() => {
    return formData.lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  }, [formData.lines]);

  // Submit create claim
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formTotalAmount <= 0) {
      alert('Total claim amount must be greater than zero.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        requester_user_id: formData.requester_user_id,
        department: formData.department,
        category: formData.category,
        request_date: formData.request_date,
        total_requested: formTotalAmount,
        currency: 'TZS',
        lines: formData.lines,
      });

      setIsCreateOpen(false);
      // Reset form
      setFormData({
        requester_user_id: currentUser?.id || 1,
        department: 'Operations',
        category: 'Office Supplies',
        request_date: new Date().toISOString().split('T')[0],
        lines: [
          {
            expense_gl_account: 'GL-6100 - General Office Supplies',
            description: '',
            amount: 0,
            has_receipt_attachment: true,
          },
        ],
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit claim');
    }
  };

  // Submit disburse claim
  const handleDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disburseModalClaim || !disburseAccountId) return;

    try {
      await disburseMutation.mutateAsync({
        id: disburseModalClaim.id,
        accountId: Number(disburseAccountId),
      });
      setDisburseModalClaim(null);
      setDisburseAccountId('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to disburse claim');
    }
  };

  // Print voucher
  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const win = window.open('', '', 'height=700,width=900');
    if (win) {
      win.document.write('<html><head><title>Petty Cash Expense Voucher</title>');
      win.document.write('<style>');
      win.document.write(`
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #111; }
        .voucher-header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 20px; }
        .title { font-size: 22px; font-weight: bold; color: #0284c7; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
        th { background: #f8fafc; font-weight: 600; }
        .total-row td { font-weight: bold; font-size: 14px; background: #f1f5f9; }
        .signatures { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 20px; }
        .sig-line { width: 200px; border-top: 1px solid #475569; text-align: center; font-size: 12px; padding-top: 6px; }
      `);
      win.document.write('</style></head><body>');
      win.document.write(printContent);
      win.document.write('</body></html>');
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
        win.close();
      }, 300);
    }
  };

  // Status badge formatter
  const getStatusBadge = (status?: string | null) => {
    const s = (status || '').toLowerCase();
    if (s.includes('disbursed')) {
      return <Badge variant="success" className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Disbursed</Badge>;
    }
    if (s.includes('approved')) {
      return <Badge variant="primary" className="bg-blue-500/10 text-blue-600 border border-blue-500/20">Approved</Badge>;
    }
    if (s.includes('reject')) {
      return <Badge variant="danger" className="bg-rose-500/10 text-rose-600 border border-rose-500/20">Rejected</Badge>;
    }
    return <Badge variant="warning" className="bg-amber-500/10 text-amber-600 border border-amber-500/20">Pending Approval</Badge>;
  };

  // Categories list
  const categoryOptions = [
    'Office Supplies',
    'Travel & Fuel',
    'Meals & Refreshments',
    'Maintenance & Repairs',
    'Courier & Shipping',
    'Utilities & Subscriptions',
    'Emergency Repairs',
    'Miscellaneous',
  ];

  // Table columns definition
  const columns = useMemo<ColumnDef<PettyCashClaim>[]>(() => [
    {
      accessorKey: 'claim_number',
      header: 'Claim #',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-primary-600 dark:text-primary-400">
            {row.original.claim_number}
          </span>
          <span className="text-xs text-neutral-500">
            {row.original.lines_count || 1} line item(s)
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'requester_name',
      header: 'Requester',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold">
            {(row.original.requester_name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
              {row.original.requester_name || `User #${row.original.requester_user_id}`}
            </span>
            <span className="text-xs text-neutral-500">
              {row.original.department || 'Operations'}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
          {row.original.category || 'General'}
        </span>
      ),
    },
    {
      accessorKey: 'request_date',
      header: 'Date',
      cell: ({ row }) => {
        const d = row.original.request_date;
        return (
          <span className="text-sm text-neutral-600 dark:text-neutral-300">
            {d ? new Date(d).toLocaleDateString('en-GB') : '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'total_requested',
      header: 'Amount',
      cell: ({ row }) => {
        const amt = Number(row.original.total_requested || 0);
        return (
          <div className="flex flex-col font-mono text-sm">
            <span className="font-bold text-neutral-900 dark:text-neutral-100">
              {row.original.currency || 'TZS'} {amt.toLocaleString()}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'account_name',
      header: 'Paid From',
      cell: ({ row }) => (
        <span className="text-xs text-neutral-600 dark:text-neutral-400">
          {row.original.account_name ? (
            <span className="flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-primary-500" />
              {row.original.account_name}
            </span>
          ) : (
            <span className="italic text-neutral-400">Not yet disbursed</span>
          )}
        </span>
      ),
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
        const isDisbursed = (row.original.status || '').toLowerCase().includes('disbursed');
        const isRejected = (row.original.status || '').toLowerCase().includes('reject');

        return (
          <div className="flex items-center gap-1.5">
            <Tooltip content="View Claim Details & Voucher">
              <button
                onClick={() => setSelectedClaim(row.original)}
                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
            </Tooltip>

            {!isDisbursed && !isRejected && (
              <Tooltip content="Disburse Cash">
                <button
                  onClick={() => {
                    setDisburseModalClaim(row.original);
                    if (accounts.length > 0) setDisburseAccountId(accounts[0].id);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center gap-1 transition-colors shadow-sm"
                >
                  <Send className="w-3 h-3" />
                  Disburse
                </button>
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ], [accounts]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-600 to-amber-400 text-white rounded-xl shadow-lg shadow-amber-500/20">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                Petty Cash & Expense Claims
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Track branch custodian balances, approve expense claims, and disburse petty cash
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={!claims.length}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white border-0 shadow-md shadow-amber-600/20"
          >
            <Plus className="w-4 h-4" />
            New Expense Claim
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Total Custodian Balance
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                TZS {metrics.currentBalance.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-100 dark:border-neutral-800 pt-2">
            <span>Authorized: TZS {metrics.totalAuthorized.toLocaleString()}</span>
            <span className="font-semibold text-emerald-600">
              {metrics.totalAuthorized ? Math.round((metrics.currentBalance / metrics.totalAuthorized) * 100) : 0}% remaining
            </span>
          </div>
        </Card>

        <Card className="p-4 relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Pending Approval / Payout
              </p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                TZS {metrics.pendingTotal.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-100 dark:border-neutral-800 pt-2">
            <span>Awaiting action</span>
            <span className="font-semibold text-amber-600">{metrics.pendingCount} claim(s)</span>
          </div>
        </Card>

        <Card className="p-4 relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Total Disbursed Claims
              </p>
              <h3 className="text-2xl font-bold text-primary-600 dark:text-primary-400 font-mono">
                TZS {metrics.disbursedTotal.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-100 dark:border-neutral-800 pt-2">
            <span>Successfully settled</span>
            <span className="font-semibold text-primary-600">{metrics.disbursedCount} claim(s)</span>
          </div>
        </Card>

        <Card className="p-4 relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Active Custodian Accounts
              </p>
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {accounts.length}
              </h3>
            </div>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-100 dark:border-neutral-800 pt-2">
            <span>Branch funds</span>
            <span className="font-semibold text-purple-600">All Operational</span>
          </div>
        </Card>
      </div>

      {/* Custodian Accounts Cards Section */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Building className="w-4 h-4 text-primary-500" />
          Branch Petty Cash Custodian Accounts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accountsLoading ? (
            <div className="col-span-3 py-6 text-center text-sm text-neutral-500 flex justify-center items-center gap-2">
              <Spinner size="sm" /> Loading custodian accounts...
            </div>
          ) : accounts.length === 0 ? (
            <div className="col-span-3 p-4 text-center border border-dashed rounded-lg text-sm text-neutral-500">
              No petty cash accounts found in the database.
            </div>
          ) : (
            accounts.map((acc) => {
              const pct = acc.authorized_limit
                ? Math.min(100, Math.round((Number(acc.current_balance) / Number(acc.authorized_limit)) * 100))
                : 0;
              const isLow = pct < 25;

              return (
                <div
                  key={acc.id}
                  className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-3 hover:border-primary-500/40 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                        {acc.account_name}
                      </h4>
                      <p className="text-xs text-neutral-500">
                        GL: {acc.gl_account_code}
                      </p>
                    </div>
                    <Badge variant={acc.is_active ? 'success' : 'neutral'} className="text-[10px]">
                      {acc.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-500">Current Balance</span>
                      <span className="font-bold font-mono text-neutral-900 dark:text-neutral-100">
                        {acc.currency} {Number(acc.current_balance || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isLow ? 'bg-rose-500' : pct < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-neutral-400 mt-1">
                      <span>Limit: {acc.currency} {Number(acc.authorized_limit || 0).toLocaleString()}</span>
                      <span>{pct}% available</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 flex justify-between items-center">
                    <span>Custodian: <strong className="text-neutral-700 dark:text-neutral-300">{acc.custodian_name || `User #${acc.custodian_user_id}`}</strong></span>
                    {acc.last_replenished_date && (
                      <span className="text-[10px] text-neutral-400">
                        Replenished: {new Date(acc.last_replenished_date).toLocaleDateString('en-GB')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        {claimsLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Spinner className="w-8 h-8 text-amber-600" />
            <p className="text-xs text-neutral-500">Loading petty cash claims...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={claims}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by claim #, requester, or department..."
            enableViewToggle={true}
            defaultViewMode="table"
            pagination
            pageSize={10}
            extraFilters={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending Manager</option>
                  <option value="Approved">Approved</option>
                  <option value="Disbursed">Disbursed</option>
                  <option value="Rejected">Rejected</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
                  title="Start Date"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
                  title="End Date"
                />

                <Tooltip content="Refresh" position="bottom">
                  <button
                    onClick={() => {
                      refetchAccounts();
                      refetchClaims();
                    }}
                    disabled={isRefetching}
                    className="p-2 text-xs text-neutral-600 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                  </button>
                </Tooltip>
              </div>
            }
            renderCard={(claim) => {
              return (
                <div className="flex flex-col justify-between h-full space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <div>
                      <span className="font-bold text-amber-600 dark:text-amber-400 text-sm font-mono block">{claim.claim_number}</span>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {claim.request_date ? new Date(claim.request_date).toLocaleDateString('en-GB') : '—'}
                      </span>
                    </div>
                    {getStatusBadge(claim.status)}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xs font-bold shrink-0">
                        {(claim.requester_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {claim.requester_name || `User #${claim.requester_user_id}`}
                        </p>
                        <p className="text-[10px] text-neutral-400 truncate">{claim.department || 'Operations'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        {claim.category || 'General'}
                      </span>
                      <span className="text-[11px] text-neutral-400">{claim.lines_count || 1} line item(s)</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <span className="text-xs text-neutral-400">Total Requested</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">
                        {claim.currency || 'TZS'} {Number(claim.total_requested || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClaim(claim);
                      }}
                      className="flex-1 py-1.5 px-3 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                    {claim.status?.toLowerCase().includes('approved') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDisburseModalClaim(claim);
                        }}
                        className="flex-1 py-1.5 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center gap-1 transition-colors shadow-sm cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" /> Disburse
                      </button>
                    )}
                  </div>
                </div>
              );
            }}
            emptyMessage="No petty cash claims found matching your criteria."
          />
        )}
      </Card>

      {/* =========================================================================
       * CREATE CLAIM MODAL
       * ========================================================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-gradient-to-r from-amber-500/10 via-transparent to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-lg">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    Create New Expense Claim
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Submit receipts for reimbursement or petty cash voucher
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Requester user */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Requester
                  </label>
                  <select
                    value={formData.requester_user_id}
                    onChange={(e) =>
                      setFormData({ ...formData, requester_user_id: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                  >
                    {users.length > 0 ? (
                      users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name || u.email}
                        </option>
                      ))
                    ) : (
                      <option value={currentUser?.id || 1}>{currentUser?.email || 'Current User'}</option>
                    )}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Request Date
                  </label>
                  <input
                    type="date"
                    value={formData.request_date}
                    onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Primary Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Line Items */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-amber-500" />
                    Expense Breakdown Items
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Item
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {formData.lines.map((line, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl space-y-2"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <div className="md:col-span-4">
                          <label className="block text-[10px] text-neutral-400 mb-0.5">GL Account</label>
                          <input
                            type="text"
                            value={line.expense_gl_account}
                            onChange={(e) => {
                              const newLines = [...formData.lines];
                              newLines[idx].expense_gl_account = e.target.value;
                              setFormData({ ...formData, lines: newLines });
                            }}
                            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded"
                            placeholder="e.g. GL-6100 Office"
                            required
                          />
                        </div>

                        <div className="md:col-span-4">
                          <label className="block text-[10px] text-neutral-400 mb-0.5">Description</label>
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => {
                              const newLines = [...formData.lines];
                              newLines[idx].description = e.target.value;
                              setFormData({ ...formData, lines: newLines });
                            }}
                            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded"
                            placeholder="What was purchased?"
                            required
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-[10px] text-neutral-400 mb-0.5">Amount (TZS)</label>
                          <input
                            type="number"
                            min="1"
                            value={line.amount || ''}
                            onChange={(e) => {
                              const newLines = [...formData.lines];
                              newLines[idx].amount = Number(e.target.value);
                              setFormData({ ...formData, lines: newLines });
                            }}
                            className="w-full px-2 py-1.5 text-xs font-mono font-bold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded"
                            placeholder="Amount"
                            required
                          />
                        </div>

                        <div className="md:col-span-1 flex justify-center pt-4">
                          {formData.lines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(idx)}
                              className="text-neutral-400 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Footer */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex justify-between items-center">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                  Total Claim Amount:
                </span>
                <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400">
                  TZS {formTotalAmount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={createMutation.isPending || formTotalAmount <= 0}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {createMutation.isPending ? 'Submitting...' : 'Submit Claim'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
       * DISBURSE MODAL
       * ========================================================================= */}
      {disburseModalClaim && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-lg">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    Disburse Cash Claim
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Claim #{disburseModalClaim.claim_number}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDisburseModalClaim(null)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDisburseSubmit} className="p-6 space-y-4">
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>Requester:</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {disburseModalClaim.requester_name || `User #${disburseModalClaim.requester_user_id}`}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>Department:</span>
                  <span className="text-neutral-800 dark:text-neutral-200">{disburseModalClaim.department}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <span>Disbursement Total:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    TZS {Number(disburseModalClaim.total_requested || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Pay From Petty Cash Account
                </label>
                <select
                  value={disburseAccountId}
                  onChange={(e) => setDisburseAccountId(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name} (Bal: {acc.currency} {Number(acc.current_balance || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Warning if selected account has insufficient balance */}
              {(() => {
                const sel = accounts.find((a) => a.id === Number(disburseAccountId));
                if (sel && Number(sel.current_balance) < Number(disburseModalClaim.total_requested)) {
                  return (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-xs text-rose-600">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Warning: Account balance ({sel.currency} {Number(sel.current_balance).toLocaleString()}) is lower than claim total!
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <Button variant="outline" type="button" onClick={() => setDisburseModalClaim(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={disburseMutation.isPending || !disburseAccountId}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {disburseMutation.isPending ? 'Disbursing...' : 'Confirm Disbursement'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
       * VIEW CLAIM & PRINT VOUCHER MODAL
       * ========================================================================= */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    Expense Claim Voucher
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Claim #{selectedClaim.claim_number}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-1.5">
                  <Printer className="w-4 h-4" />
                  Print Voucher
                </Button>
                <button
                  onClick={() => setSelectedClaim(null)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6" ref={printRef}>
              {/* Voucher Header Info */}
              <div className="voucher-header pb-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    PETTY CASH VOUCHER
                  </h2>
                  <p className="text-xs text-neutral-500">Dar es Salaam Branch / Main Fund</p>
                  <div className="mt-2 text-xs space-y-1">
                    <div>
                      <span className="text-neutral-400">Requester:</span>{' '}
                      <strong>{selectedClaim.requester_name || `User #${selectedClaim.requester_user_id}`}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-400">Department:</span>{' '}
                      {selectedClaim.department || 'Operations'}
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs space-y-1">
                  <div>
                    <span className="text-neutral-400">Voucher No:</span>{' '}
                    <strong className="font-mono text-primary-600">{selectedClaim.claim_number}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-400">Date:</span>{' '}
                    {selectedClaim.request_date ? new Date(selectedClaim.request_date).toLocaleDateString('en-GB') : '-'}
                  </div>
                  <div>
                    <span className="text-neutral-400">Status:</span>{' '}
                    {selectedClaim.status || 'Pending'}
                  </div>
                  {selectedClaim.account_name && (
                    <div>
                      <span className="text-neutral-400">Disbursed From:</span>{' '}
                      <strong>{selectedClaim.account_name}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Line items table */}
              <div>
                <h4 className="text-xs font-bold uppercase text-neutral-500 tracking-wider mb-2">
                  Expense Line Items
                </h4>
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                      <th className="p-2.5 font-semibold">GL Account</th>
                      <th className="p-2.5 font-semibold">Description</th>
                      <th className="p-2.5 font-semibold text-center">Receipt</th>
                      <th className="p-2.5 font-semibold text-right">Amount (TZS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClaim.petty_cash_lines && selectedClaim.petty_cash_lines.length > 0 ? (
                      selectedClaim.petty_cash_lines.map((line, i) => (
                        <tr
                          key={i}
                          className="border-b border-neutral-100 dark:border-neutral-800"
                        >
                          <td className="p-2.5 text-neutral-700 dark:text-neutral-300 font-mono">
                            {line.expense_gl_account}
                          </td>
                          <td className="p-2.5 text-neutral-900 dark:text-neutral-100">
                            {line.description}
                          </td>
                          <td className="p-2.5 text-center">
                            {line.has_receipt_attachment ? (
                              <span className="text-emerald-600 font-semibold">Yes</span>
                            ) : (
                              <span className="text-neutral-400">No</span>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                            {Number(line.amount || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-3 text-center text-neutral-400">
                          Total Claim: TZS {Number(selectedClaim.total_requested || 0).toLocaleString()}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-neutral-50 dark:bg-neutral-800/80 font-bold border-t border-neutral-300 dark:border-neutral-700">
                      <td colSpan={3} className="p-2.5 text-right uppercase">
                        Total Amount Disbursed:
                      </td>
                      <td className="p-2.5 text-right font-mono text-sm text-primary-600 dark:text-primary-400">
                        TZS {Number(selectedClaim.total_requested || 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures block for paper trail */}
              <div className="signatures pt-8 flex justify-between text-xs text-neutral-500">
                <div className="sig-line border-t border-neutral-400 pt-1 text-center w-40">
                  <p>Prepared By</p>
                  <p className="font-semibold text-neutral-800 dark:text-neutral-200 mt-0.5">
                    {selectedClaim.requester_name || 'Requester'}
                  </p>
                </div>
                <div className="sig-line border-t border-neutral-400 pt-1 text-center w-40">
                  <p>Approved By</p>
                  <p className="font-semibold text-neutral-800 dark:text-neutral-200 mt-0.5">
                    Finance Manager
                  </p>
                </div>
                <div className="sig-line border-t border-neutral-400 pt-1 text-center w-40">
                  <p>Received By</p>
                  <p className="font-semibold text-neutral-800 dark:text-neutral-200 mt-0.5">
                    Claimant Signature
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedClaim(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
