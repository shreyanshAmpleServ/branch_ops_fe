import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/table';
import { Button, Badge, Card, Modal, Input, Select } from '../../components/ui';
import { MOCK_TASKS } from '../../config/constants';
import type { Task } from '../../types/crm.types';
import { useLocaleStore } from '../../store/useLocaleStore';
import { formatDate } from '../../lib/formatters';

export const TaskList: React.FC = () => {
  const { t } = useTranslation();
  const { dateFormat } = useLocaleStore();
  const [view, setView] = useState<'table' | 'board'>('table');
  const [showForm, setShowForm] = useState(false);
  const [tasks] = useState(MOCK_TASKS);

  const statusColors: Record<string, string> = { todo: 'default', in_progress: 'info', review: 'warning', done: 'success' };
  const priorityColors: Record<string, string> = { low: 'default', medium: 'info', high: 'warning', urgent: 'error' };

  const columns: ColumnDef<Task, unknown>[] = [
    { accessorKey: 'title', header: 'Title', cell: ({ row }) => <span className="font-medium">{row.original.title}</span> },
    {
      accessorKey: 'status', header: t('common.status'),
      cell: ({ row }) => <Badge variant={statusColors[row.original.status] as any} dot>{t(`tasks.${row.original.status === 'in_progress' ? 'inProgress' : row.original.status}`)}</Badge>,
    },
    {
      accessorKey: 'priority', header: t('leads.priority'),
      cell: ({ row }) => <Badge variant={priorityColors[row.original.priority] as any}>{t(`leads.${row.original.priority}`)}</Badge>,
    },
    { accessorKey: 'assignedTo', header: t('tasks.assignedTo') },
    {
      accessorKey: 'dueDate', header: t('tasks.dueDate'),
      cell: ({ row }) => <span className="text-xs">{formatDate(row.original.dueDate, dateFormat)}</span>,
    },
  ];

  // Kanban board view
  const statusColumns = ['todo', 'in_progress', 'review', 'done'];
  const statusLabels: Record<string, string> = { todo: t('tasks.todo'), in_progress: t('tasks.inProgress'), review: t('tasks.review'), done: t('tasks.done') };
  const statusHeaderColors: Record<string, string> = { todo: '#64748b', in_progress: '#3b82f6', review: '#f59e0b', done: '#10b981' };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-0.5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{t('tasks.title')}</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{tasks.length} tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
            <button onClick={() => setView('table')} className="px-3 py-1.5 text-xs font-medium transition-colors" style={{ background: view === 'table' ? 'var(--color-primary)' : 'transparent', color: view === 'table' ? 'white' : 'var(--color-text-secondary)' }}>Table</button>
            <button onClick={() => setView('board')} className="px-3 py-1.5 text-xs font-medium transition-colors" style={{ background: view === 'board' ? 'var(--color-primary)' : 'transparent', color: view === 'board' ? 'white' : 'var(--color-text-secondary)' }}>Board</button>
          </div>
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowForm(true)}>{t('tasks.addTask')}</Button>
        </div>
      </div>

      {view === 'table' ? (
        <DataTable data={tasks} columns={columns} enableRowSelection enableExport exportFileName="tasks" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusColumns.map(status => (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full" style={{ background: statusHeaderColors[status] }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{statusLabels[status]}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)' }}>
                  {tasks.filter(t => t.status === status).length}
                </span>
              </div>
              <div className="space-y-2">
                {tasks.filter(t => t.status === status).map(task => (
                  <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card padding="sm" hover className="cursor-pointer">
                      <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>{task.title}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant={priorityColors[task.priority] as any} size="sm">{t(`leads.${task.priority}`)}</Badge>
                        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(task.dueDate, dateFormat)}</span>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={t('tasks.addTask')} size="md">
        <form className="space-y-4">
          <Input label="Title" placeholder="Task title" />
          <Input label={t('tasks.description')} placeholder="Description" />
          <Select label={t('common.status')} options={statusColumns.map(s => ({ value: s, label: statusLabels[s] }))} />
          <Select label={t('leads.priority')} options={['low', 'medium', 'high', 'urgent'].map(p => ({ value: p, label: t(`leads.${p}`) }))} />
          <Input label={t('tasks.dueDate')} type="date" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
