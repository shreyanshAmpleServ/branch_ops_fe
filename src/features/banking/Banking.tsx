import React from 'react';
import {
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  Wallet,
  Clock,
  RefreshCw,
  Plus,
  Receipt,
  FileText,
  CreditCard,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Badge } from '../../components/ui';
import { useBankingOverview } from './api/useBanking';

export const Banking: React.FC = () => {
  const navigate = useNavigate();
  const { data: overview, isLoading, refetch, isRefetching } = useBankingOverview();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-neutral-500">Loading banking analytics & financial records...</p>
      </div>
    );
  }

  const netCash = overview?.netCashFlow ?? 0;
  const isPositiveNet = netCash >= 0;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-primary-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-primary-500/20">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                Banking & Treasury Dashboard
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Consolidated cash management, payment settlement, petty cash, and liability commitments
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            onClick={() => navigate('/banking/incoming')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <ArrowDownRight className="w-4 h-4" /> Record Inflow
          </Button>

          <Button
            variant="primary"
            onClick={() => navigate('/banking/outgoing')}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <ArrowUpRight className="w-4 h-4" /> Make Payment
          </Button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Incoming */}
        <Card
          onClick={() => navigate('/banking/incoming')}
          className="p-5 relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-emerald-500/50 cursor-pointer transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Total Inflow (A/R)
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                TZS {(overview?.totalIncomingAllTime || 0).toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs border-t border-neutral-100 dark:border-neutral-800 pt-2">
            <span className="text-neutral-500">
              This Month: <strong>TZS {(overview?.totalIncomingThisMonth || 0).toLocaleString()}</strong>
            </span>
            <span className="font-semibold text-emerald-600 flex items-center gap-0.5">
              {overview?.incomingCount || 0} receipts <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </Card>

        {/* Total Outgoing */}
        <Card
          onClick={() => navigate('/banking/outgoing')}
          className="p-5 relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-indigo-500/50 cursor-pointer transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Total Outflow (A/P)
              </p>
              <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                TZS {(overview?.totalOutgoingAllTime || 0).toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs border-t border-neutral-100 dark:border-neutral-800 pt-2">
            <span className="text-neutral-500">
              This Month: <strong>TZS {(overview?.totalOutgoingThisMonth || 0).toLocaleString()}</strong>
            </span>
            <span className="font-semibold text-indigo-600 flex items-center gap-0.5">
              {overview?.outgoingCount || 0} vouchers <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </Card>

        {/* Net Flow */}
        <Card className="p-5 relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Net Cash Flow
              </p>
              <h3
                className={`text-2xl font-bold font-mono ${
                  isPositiveNet ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                TZS {netCash.toLocaleString()}
              </h3>
            </div>
            <div
              className={`p-2.5 rounded-lg ${
                isPositiveNet
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
              }`}
            >
              {isPositiveNet ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs border-t border-neutral-100 dark:border-neutral-800 pt-2 text-neutral-500">
            <span>Inflow vs Outflow Net</span>
            <span className={`font-semibold ${isPositiveNet ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPositiveNet ? 'Surplus Balance' : 'Deficit Outflow'}
            </span>
          </div>
        </Card>

        {/* Petty Cash Balances */}
        <Card
          onClick={() => navigate('/banking/petty-cash')}
          className="p-5 relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-amber-500/50 cursor-pointer transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Branch Petty Cash
              </p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                TZS {(overview?.totalPettyCashBalance || 0).toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs border-t border-neutral-100 dark:border-neutral-800 pt-2">
            <span className="text-neutral-500">
              Authorized: TZS {(overview?.totalPettyCashAuthorized || 0).toLocaleString()}
            </span>
            <span className="font-semibold text-amber-600 flex items-center gap-0.5">
              {overview?.pettyAccountsCount || 0} funds <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </Card>
      </div>

      {/* Bank & Branch Accounts */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-primary-500" />
            Active Cash & Bank GL Accounts
          </h2>
          <span className="text-xs text-neutral-500">Real-time balances from Chart of Accounts</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {overview?.accounts && overview.accounts.length > 0 ? (
            overview.accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                      {acc.account_name}
                    </h4>
                    <p className="text-xs text-neutral-400 font-mono">{acc.gl_account_code}</p>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    Active
                  </Badge>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-500">Ledger Balance</span>
                    <span className="font-bold font-mono text-neutral-900 dark:text-neutral-100">
                      {acc.currency} {Number(acc.current_balance || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((Number(acc.current_balance || 0) / Number(acc.authorized_limit || 10000000)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 p-4 text-center border border-dashed rounded-lg text-sm text-neutral-500">
              No active bank accounts configured.
            </div>
          )}
        </div>
      </div>

      {/* Pending PO Liabilities Banner */}
      {(overview?.totalPendingPoLiability ?? 0) > 0 && (
        <Card
          onClick={() => navigate('/banking/pending-po')}
          className="p-4 bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-transparent border border-rose-500/20 rounded-xl cursor-pointer hover:border-rose-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500 text-white rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                Outstanding Purchase Order Commitments ({overview?.pendingPoCount} pending)
              </h4>
              <p className="text-xs text-neutral-500">
                You have TZS {(overview?.totalPendingPoLiability || 0).toLocaleString()} in pending PO advances and commitments requiring review.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 border-rose-500/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5"
          >
            Review PO Liabilities <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </Card>
      )}

      {/* Recent Transactions Feed */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-500" />
            Recent Banking Transactions
          </h2>
          <span className="text-xs text-neutral-500">Latest receipts and disbursement vouchers</span>
        </div>

        <Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm divide-y divide-neutral-100 dark:divide-neutral-800">
          {overview?.recentTransactions && overview.recentTransactions.length > 0 ? (
            overview.recentTransactions.map((txn) => {
              const isIncoming = txn.type === 'incoming';
              return (
                <div
                  key={txn.id}
                  onClick={() => navigate(isIncoming ? '/banking/incoming' : '/banking/outgoing')}
                  className="p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        isIncoming
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {isIncoming ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                          {txn.party}
                        </span>
                        <span className="text-xs font-mono text-neutral-400">({txn.doc_number})</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <span>{txn.payment_type}</span>
                        <span>•</span>
                        <span>{txn.date ? new Date(txn.date).toLocaleDateString('en-GB') : '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span
                        className={`font-mono font-bold text-sm ${
                          isIncoming ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-900 dark:text-neutral-100'
                        }`}
                      >
                        {isIncoming ? '+' : '-'} {txn.currency} {Number(txn.amount || 0).toLocaleString()}
                      </span>
                      <div className="text-[11px] text-neutral-400 uppercase tracking-wider">{txn.status}</div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-neutral-400" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-sm text-neutral-500">
              No recent transactions recorded yet.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
