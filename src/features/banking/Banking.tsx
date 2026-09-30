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
  CircleDollarSign,
  ArrowRightLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Spinner, Badge } from '../../components/ui';
import { useBankingOverview } from './api/useBanking';

export const Banking: React.FC = () => {
  const navigate = useNavigate();
  const { data: overview, isLoading, refetch, isRefetching } = useBankingOverview();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Spinner size="lg" className="text-teal-600" />
        <p className="text-xs text-slate-500">Loading banking analytics & financial records...</p>
      </div>
    );
  }

  const netCash = overview?.netCashFlow ?? 0;
  const isPositiveNet = netCash >= 0;

  return (
    <div className="p-4 space-y-4 w-full max-w-full animate-fade-in">
      {/* Top Header Card Banner */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60 flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Banking & Treasury Dashboard
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Consolidated cash management, payment settlement, petty cash, and liability commitments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => navigate('/banking/incoming')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            Record Inflow
          </button>

          <button
            onClick={() => navigate('/banking/outgoing')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Make Payment
          </button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Inflow */}
        <div
          onClick={() => navigate('/banking/incoming')}
          className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between cursor-pointer hover:border-teal-500/50 transition-colors"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <ArrowDownRight className="w-3 h-3" />
              </div>
              Total Inflow (A/R)
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight font-mono">
              TZS {(overview?.totalIncomingAllTime || 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-teal-600 dark:text-teal-400">
              <TrendingUp className="w-3 h-3" />
              {overview?.incomingCount || 0} receipts this month
            </div>
          </div>
          <div className="text-teal-400 opacity-60">
            <ArrowDownRight className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 2: Total Outflow */}
        <div
          onClick={() => navigate('/banking/outgoing')}
          className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between cursor-pointer hover:border-indigo-500/50 transition-colors"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <ArrowUpRight className="w-3 h-3" />
              </div>
              Total Outflow (A/P)
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight font-mono">
              TZS {(overview?.totalOutgoingAllTime || 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
              <TrendingDown className="w-3 h-3" />
              {overview?.outgoingCount || 0} vouchers paid
            </div>
          </div>
          <div className="text-indigo-400 opacity-60">
            <ArrowUpRight className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 3: Net Cash Flow */}
        <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className={`w-5.5 h-5.5 rounded-md flex items-center justify-center ${isPositiveNet ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'}`}>
                <ArrowRightLeft className="w-3 h-3" />
              </div>
              Net Cash Flow
            </div>
            <div className={`text-lg font-bold leading-tight font-mono ${isPositiveNet ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              TZS {netCash.toLocaleString()}
            </div>
            <div className={`text-[10px] font-semibold ${isPositiveNet ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isPositiveNet ? 'Surplus Balance' : 'Deficit Outflow'}
            </div>
          </div>
          <div className={`${isPositiveNet ? 'text-emerald-400' : 'text-rose-400'} opacity-60`}>
            {isPositiveNet ? <TrendingUp className="w-5.5 h-5.5 stroke-[1.5]" /> : <TrendingDown className="w-5.5 h-5.5 stroke-[1.5]" />}
          </div>
        </div>

        {/* Card 4: Petty Cash */}
        <div
          onClick={() => navigate('/banking/petty-cash')}
          className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between cursor-pointer hover:border-amber-500/50 transition-colors"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Wallet className="w-3 h-3" />
              </div>
              Branch Petty Cash
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight font-mono">
              TZS {(overview?.totalPettyCashBalance || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
              {overview?.pettyAccountsCount || 0} custodian funds
            </div>
          </div>
          <div className="text-amber-400 opacity-60">
            <Wallet className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>
      </div>

      {/* Bank & Branch Accounts Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wider">
            <Building className="w-4 h-4 text-teal-600" />
            Active Cash & Bank GL Accounts
          </h2>
          <span className="text-[11px] text-slate-400">Real-time balances from Chart of Accounts</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {overview?.accounts && overview.accounts.length > 0 ? (
            overview.accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/40 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                      {acc.account_name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">{acc.gl_account_code}</p>
                  </div>
                  <Badge variant="success" className="text-[9px] px-1.5 py-0.5">
                    Active
                  </Badge>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-500">Ledger Balance</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      {acc.currency} {Number(acc.current_balance || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full"
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
            <div className="col-span-3 p-4 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-400">
              No active bank accounts configured.
            </div>
          )}
        </div>
      </div>

      {/* Pending PO Liabilities Banner */}
      {(overview?.totalPendingPoLiability ?? 0) > 0 && (
        <div
          onClick={() => navigate('/banking/pending-po')}
          className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl cursor-pointer hover:border-rose-400 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500 text-white rounded-lg shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                Outstanding Purchase Order Commitments ({overview?.pendingPoCount} pending)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                You have TZS {(overview?.totalPendingPoLiability || 0).toLocaleString()} in pending PO advances and commitments requiring review.
              </p>
            </div>
          </div>
          <button
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100/50 dark:hover:bg-rose-900/30 flex items-center gap-1.5 transition-colors"
          >
            Review PO Liabilities <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Recent Transactions Feed */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wider">
            <FileText className="w-4 h-4 text-teal-600" />
            Recent Banking Transactions
          </h2>
          <span className="text-[11px] text-slate-400">Latest receipts and disbursement vouchers</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {overview?.recentTransactions && overview.recentTransactions.length > 0 ? (
            overview.recentTransactions.map((txn) => {
              const isIncoming = txn.type === 'incoming';
              return (
                <div
                  key={txn.id}
                  onClick={() => navigate(isIncoming ? '/banking/incoming' : '/banking/outgoing')}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-700/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isIncoming
                          ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400'
                          : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {isIncoming ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                          {txn.party}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">({txn.doc_number})</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{txn.payment_type}</span>
                        <span>•</span>
                        <span>{txn.date ? new Date(txn.date).toLocaleDateString('en-GB') : '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span
                        className={`font-mono font-bold text-xs ${
                          isIncoming ? 'text-teal-600 dark:text-teal-400' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {isIncoming ? '+' : '-'} {txn.currency} {Number(txn.amount || 0).toLocaleString()}
                      </span>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">{txn.status}</div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No recent transactions recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
