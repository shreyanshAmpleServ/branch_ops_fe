import React from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Layers,
  PieChart,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  FolderKanban,
  Target,
  ArrowUpRight,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { useProjectAnalytics } from './api/useProjects';

export const ProjectAnalytics: React.FC = () => {
  const { data, isLoading, refetch } = useProjectAnalytics();

  const summary = data?.summary ?? {
    totalProjects: 0,
    totalBudget: 0,
    totalSpend: 0,
    totalCommitted: 0,
    burnRatePercent: 0,
    avgCompletion: 0,
  };

  const stageBreakdown = data?.stageBreakdown ?? {
    Planning: 0,
    Procurement: 0,
    Execution: 0,
    Inspection: 0,
    Handover: 0,
  };

  const statusBreakdown = data?.statusBreakdown ?? {
    notStarted: 0,
    inProgress: 0,
    onHold: 0,
    completed: 0,
  };

  const priorityBreakdown = data?.priorityBreakdown ?? {
    Low: 0,
    Medium: 0,
    High: 0,
    Critical: 0,
  };

  const topProjects = data?.topProjectsByCost ?? [];

  return (
    <div className="page-container p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Executive Project Analytics
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Executive intelligence, milestone velocity, capital allocation efficiency, and portfolio burn rates
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors hover:bg-surface-hover"
          style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Top Executive Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="rounded-2xl p-5 border flex flex-col justify-between"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Portfolio Budget</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-gray-100">
              ${isLoading ? '—' : summary.totalBudget.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="h-3.5 w-3.5" /> Allocated across {summary.totalProjects} programs
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl p-5 border flex flex-col justify-between"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Actual Spend Incurred</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-emerald-400">
              ${isLoading ? '—' : summary.totalSpend.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Committed: ${summary.totalCommitted.toLocaleString()}
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl p-5 border flex flex-col justify-between"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Budget Burn Rate</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <Flame className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-amber-400">
              {isLoading ? '—' : `${summary.burnRatePercent}%`}
            </p>
            <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden mt-2">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, summary.burnRatePercent)}%`,
                  background: summary.burnRatePercent > 90 ? '#ef4444' : '#f59e0b',
                }}
              />
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl p-5 border flex flex-col justify-between"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Avg Milestone Progress</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-blue-400">
              {isLoading ? '—' : `${summary.avgCompletion}%`}
            </p>
            <p className="text-xs text-gray-400 mt-1">Overall completion velocity</p>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Phase Completion Breakdown */}
        <div
          className="rounded-2xl p-6 border space-y-4"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-primary" />
              Stage & Lifecycle Distribution
            </h3>
            <span className="text-xs text-gray-400">{summary.totalProjects} Total</span>
          </div>

          <div className="space-y-3.5 pt-2">
            {[
              { label: 'Planning & Design', count: stageBreakdown.Planning, color: '#a855f7' },
              { label: 'Procurement & Tendering', count: stageBreakdown.Procurement, color: '#3b82f6' },
              { label: 'Site Execution & Works', count: stageBreakdown.Execution, color: '#10b981' },
              { label: 'Inspection & QC', count: stageBreakdown.Inspection, color: '#f59e0b' },
              { label: 'Handover & Commissioning', count: stageBreakdown.Handover, color: '#06b6d4' },
            ].map((stg) => {
              const pct = summary.totalProjects > 0 ? Math.round((stg.count / summary.totalProjects) * 100) : 0;
              return (
                <div key={stg.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-300">{stg.label}</span>
                    <span className="text-gray-400">
                      {stg.count} projects ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: stg.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority & Risk Matrix */}
        <div
          className="rounded-2xl p-6 border space-y-4"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-500" />
              Portfolio Risk & Priority Matrix
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1">
              <span className="text-[11px] font-semibold text-rose-400 block uppercase">Critical Priority</span>
              <p className="text-2xl font-black text-rose-400">{priorityBreakdown.Critical}</p>
              <span className="text-[11px] text-gray-400 block">Immediate escalation</span>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1">
              <span className="text-[11px] font-semibold text-amber-400 block uppercase">High Priority</span>
              <p className="text-2xl font-black text-amber-400">{priorityBreakdown.High}</p>
              <span className="text-[11px] text-gray-400 block">Active weekly review</span>
            </div>

            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-1">
              <span className="text-[11px] font-semibold text-blue-400 block uppercase">Medium Priority</span>
              <p className="text-2xl font-black text-blue-400">{priorityBreakdown.Medium}</p>
              <span className="text-[11px] text-gray-400 block">Standard milestone plan</span>
            </div>

            <div className="p-4 rounded-xl border border-gray-700/40 bg-surface space-y-1">
              <span className="text-[11px] font-semibold text-gray-400 block uppercase">Low Priority</span>
              <p className="text-2xl font-black text-gray-200">{priorityBreakdown.Low}</p>
              <span className="text-[11px] text-gray-400 block">Periodic review</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-hover/60 border border-gray-800 text-xs text-gray-400 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>
              {statusBreakdown.completed} projects completed successfully, {statusBreakdown.inProgress} active in flight.
            </span>
          </div>
        </div>

        {/* Status Distribution */}
        <div
          className="rounded-2xl p-6 border space-y-4"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Project Operational Health
            </h3>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-blue-400 block">In Progress</span>
                <span className="text-[11px] text-gray-400">Actively executing tasks</span>
              </div>
              <span className="text-lg font-bold text-blue-400">{statusBreakdown.inProgress}</span>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-emerald-400 block">Completed</span>
                <span className="text-[11px] text-gray-400">Commissioned & handed over</span>
              </div>
              <span className="text-lg font-bold text-emerald-400">{statusBreakdown.completed}</span>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-amber-400 block">On Hold</span>
                <span className="text-[11px] text-gray-400">Awaiting clearance or budget</span>
              </div>
              <span className="text-lg font-bold text-amber-400">{statusBreakdown.onHold}</span>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-700/40 bg-surface flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-gray-300 block">Planning / Not Started</span>
                <span className="text-[11px] text-gray-400">Drafting scope & budgets</span>
              </div>
              <span className="text-lg font-bold text-gray-300">{statusBreakdown.notStarted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 Capital Programs by Budget */}
      <div
        className="rounded-2xl p-6 border space-y-4"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-100">Top Capital Projects by Allocated Budget</h3>
            <p className="text-xs text-gray-400 mt-0.5">High-impact programs and current expenditure tracking</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Code</th>
                <th className="pb-3 font-semibold">Project Name</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Budget</th>
                <th className="pb-3 font-semibold">Actual Spend</th>
                <th className="pb-3 font-semibold">Burn Rate</th>
                <th className="pb-3 font-semibold">Milestone Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {topProjects.map((p) => {
                const burn = p.budget > 0 ? Math.round((p.actualSpend / p.budget) * 100) : 0;
                return (
                  <tr key={p.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3 font-bold text-primary">{p.code}</td>
                    <td className="py-3 font-semibold text-gray-200">{p.name}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-gray-200">${p.budget.toLocaleString()}</td>
                    <td className="py-3 font-medium text-emerald-400">${p.actualSpend.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`font-semibold ${burn > 95 ? 'text-rose-500' : 'text-gray-300'}`}>
                        {burn}%
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="w-24 space-y-1">
                        <div className="flex justify-between text-[10px] text-gray-400">
                          <span>{p.progressPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${p.progressPercent}%`,
                              background: p.progressPercent >= 100 ? '#10b981' : 'var(--color-primary)',
                            }}
                          />
                        </div>
                      </div>
                    </td>
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

export default ProjectAnalytics;
