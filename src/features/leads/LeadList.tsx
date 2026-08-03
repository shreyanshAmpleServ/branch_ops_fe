import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
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
  const [leads] = useState(MOCK_LEADS);

  const stageColors: Record<string, string> = { new: 'info', contacted: 'primary', qualified: 'warning', proposal: 'primary', negotiation: 'warning', won: 'success', lost: 'error' };
  const priorityColors: Record<string, string> = { low: 'default', medium: 'info', high: 'warning', urgent: 'error' };

  const columns: ColumnDef<Lead, unknown>[] = [
    { accessorKey: 'title', header: 'Title', cell: ({ row }) => <span className="font-medium">{row.original.title}</span> },
    {
      accessorKey: 'value',
      header: t('leads.value'),
      cell: ({ row }) => <span className="font-semibold">{formatCurrency(row.original.value, currency)}</span>,
    },
    {
      accessorKey: 'stage',
      header: t('leads.stage'),
      cell: ({ row }) => <Badge variant={stageColors[row.original.stage] as any} dot>{t(`leads.${row.original.stage}`)}</Badge>,
    },
    {
      accessorKey: 'priority',
      header: t('leads.priority'),
      cell: ({ row }) => <Badge variant={priorityColors[row.original.priority] as any}>{t(`leads.${row.original.priority}`)}</Badge>,
    },
    { accessorKey: 'assignedTo', header: t('leads.assignedTo') },
    {
      accessorKey: 'expectedCloseDate',
      header: t('leads.expectedClose'),
      cell: ({ row }) => <span className="text-xs">{formatDate(row.original.expectedCloseDate, dateFormat)}</span>,
    },
  ];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-0.5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{t('leads.title')}</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{leads.length} leads</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowForm(true)}>{t('leads.addLead')}</Button>
      </div>

      <DataTable data={leads} columns={columns} enableRowSelection enableExport exportFileName="leads" />

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
