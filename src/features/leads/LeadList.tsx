import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Target,
  TrendingUp,
  BarChart3,
  Flame,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/table';
import { Button, Badge, Modal, Input, Select } from '../../components/ui';
import { MOCK_LEADS } from '../../config/constants';
import type { Lead } from '../../types/crm.types';
import { useLocaleStore } from '../../store/useLocaleStore';
import { formatCurrency, formatDate } from '../../lib/formatters';

export const LeadList: React.FC = () => {
  const { t } = useTranslation();
  const { currency, dateFormat } = useLocaleStore();
  const [showForm, setShowForm] = useState(false);
  const [leads] = useState<Lead[]>(MOCK_LEADS);

  const stats = useMemo(() => {
    const totalCount = leads.length;
    let inProgressCount = 0;
    let wonCount = 0;
    let totalValue = 0;

    leads.forEach(l => {
      totalValue += Number(l.value || 0);
      if (l.stage === 'won') {
        wonCount++;
      } else if (l.stage !== 'lost') {
        inProgressCount++;
      }
    });

    return {
      totalCount,
      inProgressCount,
      wonCount,
      totalValue,
    };
  }, [leads]);

  const stageColors: Record<string, string> = { new: 'info', contacted: 'primary', qualified: 'warning', proposal: 'primary', negotiation: 'warning', won: 'success', lost: 'error' };
  const priorityColors: Record<string, string> = { low: 'default', medium: 'info', high: 'warning', urgent: 'error' };

  const columns: ColumnDef<Lead, unknown>[] = [
    { accessorKey: 'title', header: 'LEAD TITLE', cell: ({ row }) => <span className="font-semibold text-xs text-slate-800 dark:text-slate-100">{row.original.title}</span> },
    {
      accessorKey: 'value',
      header: 'VALUE',
      cell: ({ row }) => <span className="font-bold text-xs font-mono text-slate-900 dark:text-white">{formatCurrency(row.original.value, currency)}</span>,
    },
    {
      accessorKey: 'stage',
      header: 'STAGE',
      cell: ({ row }) => <Badge variant={stageColors[row.original.stage] as any} dot>{t(`leads.${row.original.stage}`)}</Badge>,
    },
    {
      accessorKey: 'priority',
      header: 'PRIORITY',
      cell: ({ row }) => <Badge variant={priorityColors[row.original.priority] as any}>{t(`leads.${row.original.priority}`)}</Badge>,
    },
    { accessorKey: 'assignedTo', header: 'ASSIGNED TO', cell: ({ row }) => <span className="text-xs text-slate-600 dark:text-slate-300">{row.original.assignedTo}</span> },
    {
      accessorKey: 'expectedCloseDate',
      header: 'EXPECTED CLOSE',
      cell: ({ row }) => <span className="text-xs text-slate-500">{formatDate(row.original.expectedCloseDate, dateFormat)}</span>,
    },
  ];

  return (
    <div className="p-4 space-y-4 w-full max-w-full animate-fade-in">
      {/* Top Header Card Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
            style={{ background: 'var(--color-primary-50, rgba(99,102,241,0.08))', border: '1px solid var(--color-primary-200, rgba(99,102,241,0.2))' }}
          >
            <Target className="w-4.5 h-4.5" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Lead Management
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Track prospect opportunities, sales qualification stages, and deal pipeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg text-white shadow-xs transition-all hover:opacity-95 active:scale-98 cursor-pointer"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            {t('leads.addLead')}
          </button>
        </div>
      </div>

      {/* Dynamic KPI Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Leads */}
        <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Target className="w-3 h-3" />
              </div>
              Total Leads
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.totalCount}</div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              Active opportunities
            </div>
          </div>
          <div className="text-blue-400 opacity-60">
            <BarChart3 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 2: Active Pipeline */}
        <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Flame className="w-3 h-3" />
              </div>
              In Progress
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.inProgressCount}</div>
            <div className="text-[10px] text-slate-400">
              Negotiation & Proposal
            </div>
          </div>
          <div className="text-amber-400 opacity-60">
            <Flame className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 3: Won Leads */}
        <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              Won Deals
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.wonCount}</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Converted clients
            </div>
          </div>
          <div className="text-emerald-400 opacity-60">
            <CheckCircle2 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 4: Pipeline Value */}
        <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <DollarSign className="w-3 h-3" />
              </div>
              Pipeline Value
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {formatCurrency(stats.totalValue, currency)}
            </div>
            <div className="text-[10px] text-slate-400">
              Cumulative potential
            </div>
          </div>
          <div className="text-purple-400 opacity-60">
            <BarChart3 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="w-full">
        <DataTable data={leads} columns={columns} enableRowSelection enableExport exportFileName="leads" />
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={t('leads.addLead')} size="lg">
        <form className="space-y-4">
          <Input label="Title" placeholder="Lead title" />
          <Input label={t('leads.value')} type="number" placeholder="0" />
          <Select label={t('leads.stage')} options={['new', 'contacted', 'qualified', 'proposal', 'negotiation'].map(s => ({ value: s, label: t(`leads.${s}`) }))} />
          <Select label={t('leads.priority')} options={['low', 'medium', 'high', 'urgent'].map(p => ({ value: p, label: t(`leads.${p}`) }))} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeadList;
