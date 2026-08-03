import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/table';
import { Button, Badge, Modal, Input, Select } from '../../components/ui';
import { MOCK_DEALS } from '../../config/constants';
import type { Deal } from '../../types/crm.types';
import { useLocaleStore } from '../../store/useLocaleStore';
import { formatCurrency, formatDate } from '../../lib/formatters';

export const DealList: React.FC = () => {
  const { t } = useTranslation();
  const { currency, dateFormat } = useLocaleStore();
  const [showForm, setShowForm] = useState(false);
  const [deals] = useState(MOCK_DEALS);

  const stageColors: Record<string, string> = { discovery: 'info', proposal: 'primary', negotiation: 'warning', contract: 'primary', closed_won: 'success', closed_lost: 'error' };

  const columns: ColumnDef<Deal, unknown>[] = [
    { accessorKey: 'title', header: 'Title', cell: ({ row }) => <span className="font-medium">{row.original.title}</span> },
    {
      accessorKey: 'value', header: t('deals.value'),
      cell: ({ row }) => <span className="font-semibold">{formatCurrency(row.original.value, currency)}</span>,
    },
    {
      accessorKey: 'stage', header: t('deals.stage'),
      cell: ({ row }) => <Badge variant={stageColors[row.original.stage] as any} dot>{t(`deals.${row.original.stage.replace('_', '')}` as any) || row.original.stage}</Badge>,
    },
    {
      accessorKey: 'probability', header: t('deals.probability'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-surface-hover max-w-[80px]">
            <div className="h-full rounded-full" style={{ width: `${row.original.probability}%`, background: row.original.probability >= 70 ? 'var(--color-success)' : row.original.probability >= 40 ? 'var(--color-warning)' : 'var(--color-error)' }} />
          </div>
          <span className="text-xs">{row.original.probability}%</span>
        </div>
      ),
    },
    { accessorKey: 'assignedTo', header: t('deals.assignedTo') },
    {
      accessorKey: 'expectedCloseDate', header: t('deals.expectedClose'),
      cell: ({ row }) => <span className="text-xs">{formatDate(row.original.expectedCloseDate, dateFormat)}</span>,
    },
  ];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-0.5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{t('deals.title')}</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{deals.length} deals</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowForm(true)}>{t('deals.addDeal')}</Button>
      </div>

      <DataTable data={deals} columns={columns} enableRowSelection enableExport exportFileName="deals" />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={t('deals.addDeal')} size="lg">
        <form className="space-y-4">
          <Input label="Title" placeholder="Deal title" />
          <Input label={t('deals.value')} type="number" placeholder="0" />
          <Select label={t('deals.stage')} options={['discovery', 'proposal', 'negotiation', 'contract'].map(s => ({ value: s, label: t(`deals.${s}`) }))} />
          <Input label={t('deals.probability')} type="number" placeholder="50" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
