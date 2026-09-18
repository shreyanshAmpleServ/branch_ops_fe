import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Layers,
  FileSpreadsheet,
  Download,
  RefreshCw,
  PieChart,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Calendar,
  Building,
} from 'lucide-react';
import { useProjectFinance } from './api/useProjects';
import { Badge } from '../../components/ui';

export const ProjectFinance: React.FC = () => {
  const { data, isLoading, refetch } = useProjectFinance();
  const [filterHealth, setFilterHealth] = useState<string>('ALL');

  const summary = data?.summary ?? {
    totalBudget: 0,
    totalCommitted: 0,
    totalActualSpend: 0,
    totalInvoiced: 0,
    totalVariance: 0,
    overallUtilization: 0,
  };

  const stageFinancials = data?.stageFinancials ?? [];
  const projectRows = data?.projectFinancialRows ?? [];

  const filteredProjects = projectRows.filter((p) => {
    if (filterHealth === 'ALL') return true;
    return p.health.toLowerCase() === filterHealth.toLowerCase();
  });

  const exportCSV = () => {
    const headers = [
      'Project Code',
      'Project Name',
      'Stage',
      'Manager',
      'Budget',
      'Committed Spend',
      'Actual Spend',
      'Invoiced Spend',
      'Variance',
      'Utilization (%)',
      'Health Status',
    ];
    const rows = filteredProjects.map((p) => [
      `"${p.code}"`,
      `"${p.name}"`,
      `"${p.stage}"`,
      `"${p.manager || ''}"`,
      p.budget,
      p.committedSpend,
      p.actualSpend,
      p.invoicedSpend,
      p.variance,
      `${p.utilization}%`,
      p.health,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stage-financial-progress-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Stage Financial Progress
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Capital expenditure breakdown by stage, committed procurement vs actual invoiced spend, and budget health
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors hover:bg-surface-hover"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-sm"
            style={{ background: 'var(--color-primary)' }}
          >
            <Download className="h-4 w-4" /> Export Ledger CSV
          </button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="rounded-2xl p-5 border flex flex-col justify-between"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Program Budget</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-gray-100">
              ${isLoading ? '—' : summary.totalBudget.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">Authorized capital allocations</p>
          </div>
        </div>

        <div
          className="rounded-2xl p-5 border flex flex-col justify-between"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Committed (POs)</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-blue-400">
              ${isLoading ? '—' : summary.totalCommitted.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">Pending receipt & delivery</p>
          </div>
        </div>

        <div
          className="rounded-2xl p-5 border flex flex-col justify-between"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Incurred Actual Spend</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-emerald-400">
              ${isLoading ? '—' : summary.totalActualSpend.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Utilization: {summary.overallUtilization}% of total
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl p-5 border flex flex-col justify-between"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Net Budget Variance</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-purple-400">
              ${isLoading ? '—' : summary.totalVariance.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">Remaining headroom</p>
          </div>
        </div>
      </div>

      {/* Stage Financial Progress Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-primary" />
            Stage Financial Progress Matrix
          </h2>
          <span className="text-xs text-gray-400">Aggregated across all active stages</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {stageFinancials.map((stg) => {
            const burnPct = stg.allocatedBudget > 0 ? Math.round((stg.incurred / stg.allocatedBudget) * 100) : 0;
            return (
              <div
                key={stg.stage}
                className="rounded-2xl p-4 border flex flex-col justify-between space-y-3"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">{stg.stage}</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-hover text-gray-400">
                      {stg.projectCount} Prj
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <span className="text-[11px] text-gray-400 block">Allocated Budget</span>
                      <span className="text-sm font-bold text-gray-100">${stg.allocatedBudget.toLocaleString()}</span>
                    </div>

                    <div className="pt-2 border-t border-gray-800/80 space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Committed (PO):</span>
                        <span className="text-blue-400 font-medium">${stg.committed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Incurred Spend:</span>
                        <span className="text-emerald-400 font-medium">${stg.incurred.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Invoiced (AP):</span>
                        <span className="text-gray-300 font-medium">${stg.invoiced.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Spent</span>
                    <span className="font-semibold text-gray-200">{burnPct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, burnPct)}%`,
                        background: burnPct > 90 ? '#ef4444' : 'var(--color-primary)',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project Financial Ledger Table */}
      <div
        className="rounded-2xl p-6 border space-y-4"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-gray-100">Project Financial Progress Ledger</h3>
            <p className="text-xs text-gray-400 mt-0.5">Individual program commitments, invoices, and variance analysis</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Health Filter:</span>
            <select
              value={filterHealth}
              onChange={(e) => setFilterHealth(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border focus:outline-none"
              style={{
                background: 'var(--color-background)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <option value="ALL">All Financial Health</option>
              <option value="Healthy">Healthy (&lt; 85%)</option>
              <option value="Warning">Warning (85% - 100%)</option>
              <option value="Over Budget">Over Budget (&gt; 100%)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Code</th>
                <th className="pb-3 font-semibold">Project Name</th>
                <th className="pb-3 font-semibold">Stage</th>
                <th className="pb-3 font-semibold">Budget</th>
                <th className="pb-3 font-semibold">Committed (PO)</th>
                <th className="pb-3 font-semibold">Actual Spend</th>
                <th className="pb-3 font-semibold">Invoiced (AP)</th>
                <th className="pb-3 font-semibold">Variance</th>
                <th className="pb-3 font-semibold">Utilization</th>
                <th className="pb-3 font-semibold">Financial Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredProjects.map((p) => {
                let healthBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Healthy</span>;
                if (p.health === 'Warning') {
                  healthBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Warning</span>;
                } else if (p.health === 'Over Budget') {
                  healthBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">Over Budget</span>;
                }

                return (
                  <tr key={p.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3 font-bold text-primary">{p.code}</td>
                    <td className="py-3 font-semibold text-gray-200">{p.name}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-surface-hover text-gray-300">
                        {p.stage}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-gray-200">${p.budget.toLocaleString()}</td>
                    <td className="py-3 font-medium text-blue-400">${p.committedSpend.toLocaleString()}</td>
                    <td className="py-3 font-medium text-emerald-400">${p.actualSpend.toLocaleString()}</td>
                    <td className="py-3 font-medium text-gray-300">${p.invoicedSpend.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`font-bold ${p.variance < 0 ? 'text-rose-500' : 'text-gray-200'}`}>
                        ${p.variance.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="w-20 space-y-1">
                        <span className="text-[10px] text-gray-400">{p.utilization}%</span>
                        <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, p.utilization)}%`,
                              background: p.utilization > 100 ? '#ef4444' : p.utilization > 85 ? '#f59e0b' : '#10b981',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3">{healthBadge}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectFinance;
