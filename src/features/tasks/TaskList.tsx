import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  CheckSquare,
  Clock,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  LayoutList,
  Kanban,
} from 'lucide-react';
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
  const [tasks] = useState<Task[]>(MOCK_TASKS);

  const stats = useMemo(() => {
    const totalCount = tasks.length;
    let todoCount = 0;
    let inProgressCount = 0;
    let doneCount = 0;

    tasks.forEach(task => {
      if (task.status === 'done') {
        doneCount++;
      } else if (task.status === 'in_progress' || task.status === 'review') {
        inProgressCount++;
      } else {
        todoCount++;
      }
    });

    return {
      totalCount,
      todoCount,
      inProgressCount,
      doneCount,
    };
  }, [tasks]);

  const statusColors: Record<string, string> = { todo: 'default', in_progress: 'info', review: 'warning', done: 'success' };
  const priorityColors: Record<string, string> = { low: 'default', medium: 'info', high: 'warning', urgent: 'error' };

  const columns: ColumnDef<Task, unknown>[] = [
    { accessorKey: 'title', header: 'TASK TITLE', cell: ({ row }) => <span className="font-semibold text-xs text-slate-800 dark:text-slate-100">{row.original.title}</span> },
    {
      accessorKey: 'status', header: 'STATUS',
      cell: ({ row }) => <Badge variant={statusColors[row.original.status] as any} dot>{t(`tasks.${row.original.status === 'in_progress' ? 'inProgress' : row.original.status}`)}</Badge>,
    },
    {
      accessorKey: 'priority', header: 'PRIORITY',
      cell: ({ row }) => <Badge variant={priorityColors[row.original.priority] as any}>{t(`leads.${row.original.priority}`)}</Badge>,
    },
    { accessorKey: 'assignedTo', header: 'ASSIGNED TO', cell: ({ row }) => <span className="text-xs text-slate-600 dark:text-slate-300">{row.original.assignedTo}</span> },
    {
      accessorKey: 'dueDate', header: 'DUE DATE',
      cell: ({ row }) => <span className="text-xs text-slate-500">{formatDate(row.original.dueDate, dateFormat)}</span>,
    },
  ];

  // Kanban board view
  const statusColumns = ['todo', 'in_progress', 'review', 'done'];
  const statusLabels: Record<string, string> = { todo: t('tasks.todo'), in_progress: t('tasks.inProgress'), review: t('tasks.review'), done: t('tasks.done') };
  const statusHeaderColors: Record<string, string> = { todo: '#64748b', in_progress: '#3b82f6', review: '#f59e0b', done: '#10b981' };

  return (
    <div className="p-4 space-y-4 w-full max-w-full animate-fade-in">
      {/* Top Header Card Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
            style={{ background: 'var(--color-primary-50, rgba(99,102,241,0.08))', border: '1px solid var(--color-primary-200, rgba(99,102,241,0.2))' }}
          >
            <CheckSquare className="w-4.5 h-4.5" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Task Management
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Organize team activities, monitor task deadlines, and progress board
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                view === 'table' ? 'bg-primary text-white' : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
              style={{ background: view === 'table' ? 'var(--color-primary)' : undefined }}
            >
              <LayoutList className="w-3.5 h-3.5" />
              Table
            </button>
            <button
              onClick={() => setView('board')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                view === 'board' ? 'bg-primary text-white' : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
              style={{ background: view === 'board' ? 'var(--color-primary)' : undefined }}
            >
              <Kanban className="w-3.5 h-3.5" />
              Board
            </button>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg text-white shadow-xs transition-all hover:opacity-95 active:scale-98 cursor-pointer"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            {t('tasks.addTask')}
          </button>
        </div>
      </div>

      {/* Dynamic KPI Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Tasks */}
        <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <CheckSquare className="w-3 h-3" />
              </div>
              Total Tasks
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.totalCount}</div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              Active items
            </div>
          </div>
          <div className="text-blue-400 opacity-60">
            <BarChart3 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 2: To Do */}
        <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <AlertCircle className="w-3 h-3" />
              </div>
              To Do
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.todoCount}</div>
            <div className="text-[10px] text-slate-400">
              Backlog pending start
            </div>
          </div>
          <div className="text-slate-400 opacity-60">
            <Clock className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 3: In Progress */}
        <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-3 h-3" />
              </div>
              In Progress
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.inProgressCount}</div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              Under active work
            </div>
          </div>
          <div className="text-amber-400 opacity-60">
            <Clock className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 4: Done */}
        <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              Completed
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats.doneCount}</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Successfully finished
            </div>
          </div>
          <div className="text-emerald-400 opacity-60">
            <CheckCircle2 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      {view === 'table' ? (
        <div className="w-full">
          <DataTable data={tasks} columns={columns} enableRowSelection enableExport exportFileName="tasks" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusColumns.map(status => (
            <div key={status} className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: statusHeaderColors[status] }} />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{statusLabels[status]}</span>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {tasks.filter(t => t.status === status).length}
                </span>
              </div>
              <div className="space-y-2">
                {tasks.filter(t => t.status === status).map(task => (
                  <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 hover:border-primary/40 transition-colors cursor-pointer">
                      <p className="text-xs font-semibold mb-2 text-slate-800 dark:text-slate-100">{task.title}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant={priorityColors[task.priority] as any} size="sm">{t(`leads.${task.priority}`)}</Badge>
                        <span className="text-[11px] text-slate-400">{formatDate(task.dueDate, dateFormat)}</span>
                      </div>
                    </div>
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

export default TaskList;
