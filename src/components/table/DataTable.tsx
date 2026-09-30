import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  type ExpandedState,
} from '@tanstack/react-table';

export type { ColumnDef };
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Columns3, Download, ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, X, FileText, FileJson, Trash2, CheckSquare, LayoutGrid, List, MoreVertical, Check, Filter } from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';
import { Tooltip } from '../ui/Tooltip';
import { TableSkeletonLoader } from '../ui/TableSkeletonLoader';
import { useDesignStore } from '../../store/useDesignStore';
import { useThemeStore } from '../../store/useThemeStore';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.02 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export interface RowAction<TData> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: TData) => void;
  variant?: 'default' | 'danger';
}

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  enableRowExpansion?: boolean;
  enableExport?: boolean;
  enableSearch?: boolean;
  enableBulkActions?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (row: TData) => void;
  onBulkAction?: (action: string, selectedRows: TData[]) => void;
  renderExpandedRow?: (row: TData) => React.ReactNode;
  exportFileName?: string;
  rowActions?: RowAction<TData>[];
  defaultViewMode?: 'table' | 'grid';
  enableViewToggle?: boolean;
  className?: string;
  extraFilters?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  renderCard?: (item: TData) => React.ReactNode;
  serverPagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<TData>({
  data,
  columns,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableRowSelection = false,
  enableColumnVisibility = true,
  enableRowExpansion = false,
  enableExport = true,
  enableSearch = true,
  enableBulkActions = true,
  searchPlaceholder,
  emptyMessage,
  isLoading = false,
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  onRowClick,
  onBulkAction,
  renderExpandedRow,
  exportFileName = 'data-export',
  rowActions,
  defaultViewMode = 'table',
  enableViewToggle = true,
  className = '',
  extraFilters,
  searchValue,
  onSearchChange,
  renderCard,
  serverPagination,
}: DataTableProps<TData>) {
  const { t } = useTranslation();
  const { tableDesign, activeDesign } = useDesignStore();
  const { backgroundImage, backgroundColor } = useThemeStore();
  const [sorting, setSorting] = useState<SortingState>([]);

  const resolvedGlass = activeDesign === 'design1' || !!backgroundImage || !!backgroundColor;
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(defaultViewMode);

  const enhancedColumns = useMemo(() => {
    const cols: ColumnDef<TData, unknown>[] = [];

    if (enableRowSelection) {
      cols.push({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="rounded accent-primary cursor-pointer"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="rounded accent-primary cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 40,
        enableSorting: false,
      });
    }

    if (enableRowExpansion) {
      cols.push({
        id: 'expand',
        header: () => null,
        cell: ({ row }) => (
          <button onClick={() => row.toggleExpanded()} className="p-1 rounded hover:bg-surface-hover transition-colors">
            {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ),
        size: 40,
        enableSorting: false,
      });
    }

    cols.push(...columns);

    if (rowActions && rowActions.length > 0) {
      cols.push({
        id: 'actions',
        header: () => 'ACTIONS',
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-center -ml-8"
>
      <Dropdown
              trigger={
                <button className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors">
                  <MoreVertical className="h-4 w-4 text-text-secondary" />
                </button>
              }
              items={rowActions.map((action, i) => ({
                id: `action-${i}`,
                label: action.label,
                icon: action.icon,
                onClick: () => action.onClick(row.original),
                danger: action.variant === 'danger'
              }))}
              align="right"
            />
          </div>
        ),
        size: 50,
        enableSorting: false,
      });
    }

    return cols;
  }, [columns, enableRowSelection, enableRowExpansion, rowActions]);

  const table = useReactTable({
    data,
    columns: enhancedColumns,
    state: { sorting, columnFilters, columnVisibility, rowSelection, expanded, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getExpandedRowModel: enableRowExpansion ? getExpandedRowModel() : undefined,
    initialState: { pagination: { pageSize } },
    enableRowSelection,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows.map((r) => r.original);
  const selectedCount = selectedRows.length;

  const exportData = (type: 'csv' | 'json') => {
    const rows = table.getFilteredRowModel().rows;
    const visibleColumns = table.getVisibleFlatColumns().filter((c) => c.id !== 'select' && c.id !== 'expand');

    if (type === 'csv') {
      const headers = visibleColumns.map((c) => c.id).join(',');
      const csvRows = rows.map((row) =>
        visibleColumns.map((col) => {
          const val = row.getValue(col.id);
          return typeof val === 'string' ? `"${val}"` : val;
        }).join(',')
      );
      const csv = [headers, ...csvRows].join('\n');
      downloadFile(csv, `${exportFileName}.csv`, 'text/csv');
    } else {
      const jsonData = rows.map((row) => {
        const obj: Record<string, unknown> = {};
        visibleColumns.forEach((col) => {
          obj[col.id] = row.getValue(col.id);
        });
        return obj;
      });
      downloadFile(JSON.stringify(jsonData, null, 2), `${exportFileName}.json`, 'application/json');
    }
    setShowExportMenu(false);
  };

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Design-specific table classes
  const designClasses = {
    modern: {
      wrapper: 'rounded-2xl relative',
      header: resolvedGlass ? 'bg-slate-500/5 dark:bg-black/25 border-b border-slate-200/80 dark:border-white/10' : 'bg-surface',
      headerCell: 'font-bold text-[11px] uppercase tracking-wider whitespace-nowrap text-slate-700 dark:text-slate-300',
      row: resolvedGlass
        ? 'border-b border-slate-200/60 dark:border-white/5 hover:bg-slate-500/5 dark:hover:bg-white/5 transition-colors'
        : 'border-b border-border/50 hover:bg-surface-hover/50 transition-colors',
      cell: 'py-2.5 px-3',
    },
    striped: {
      wrapper: 'rounded-xl relative',
      header: 'bg-primary/5',
      headerCell: 'font-bold text-[11px] uppercase tracking-wider text-primary whitespace-nowrap',
      row: 'border-b border-border/30 even:bg-surface-hover/30 hover:bg-primary/5 transition-colors',
      cell: 'py-2 px-2.5',
    },
    card: {
      wrapper: 'rounded-2xl relative',
      header: '',
      headerCell: 'font-bold text-[11px] uppercase tracking-wider whitespace-nowrap',
      row: 'mb-2 rounded-xl border border-border/60 hover:border-primary/30 hover:shadow-md transition-all',
      cell: 'py-3 px-3',
    },
  };

  const dc = designClasses[tableDesign];

  const isServerPaginated = !!serverPagination;
  const totalPages = isServerPaginated ? serverPagination.totalPages : table.getPageCount();
  const currentPage = isServerPaginated ? serverPagination.page : table.getState().pagination.pageIndex + 1;
  const totalItems = isServerPaginated ? serverPagination.total : data.length;
  const resolvedPageSize = isServerPaginated ? serverPagination.limit : table.getState().pagination.pageSize;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 3) {
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }
      
      if (start > 2) {
        pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div
      className={`${dc.wrapper} ${resolvedGlass ? 'glass-card' : ''} ${className}`}
      style={!resolvedGlass ? { background: 'var(--color-surface)', border: '1px solid var(--color-border)' } : undefined}
    >
      {/* Toolbar */}
      {(enableSearch || (enableBulkActions && selectedCount > 0) || extraFilters || enableViewToggle || enableColumnVisibility || enableExport) && (
      <div className="flex items-center justify-between gap-3 p-3 px-4 overflow-visible relative z-30" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-2 shrink-0">
          {/* Search */}
          {enableSearch && (
            <div className="relative w-64 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-secondary)' }} />
              <input
                value={searchValue !== undefined ? searchValue : globalFilter}
                onChange={(e) => {
                  if (onSearchChange) {
                    onSearchChange(e.target.value);
                  } else {
                    setGlobalFilter(e.target.value);
                  }
                }}
                placeholder={searchPlaceholder || t('table.search')}
                className="input-base pl-9 pr-8 h-9 py-1.5 text-xs rounded-xl w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 focus:bg-white/90 dark:focus:bg-slate-900/90 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-2xs"
              />
              {(searchValue !== undefined ? searchValue : globalFilter) && (
                <button onClick={() => {
                  if (onSearchChange) {
                    onSearchChange('');
                  } else {
                    setGlobalFilter('');
                  }
                }} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-3.5 w-3.5" style={{ color: 'var(--color-text-secondary)' }} />
                </button>
              )}
            </div>
          )}

          {/* Bulk actions */}
          {enableBulkActions && selectedCount > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
              <span className="text-xs font-medium px-2 py-1 rounded-md" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary)' }}>
                {t('common.selected', { count: selectedCount })}
              </span>
              <button
                onClick={() => onBulkAction?.('delete', selectedRows)}
                className="p-1.5 rounded-lg transition-colors hover:bg-error/10"
                style={{ color: 'var(--color-error)' }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onBulkAction?.('export', selectedRows)}
                className="p-1.5 rounded-lg transition-colors hover:bg-surface-hover"
              >
                <Download className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 z-30">
          {extraFilters && (
            <div className="flex items-center gap-2">
              {extraFilters}
            </div>
          )}

          {(enableViewToggle || enableColumnVisibility || enableFiltering || enableExport) && (
            <div className="flex items-center gap-1.5 shrink-0">
              {/* View Toggle */}
              {enableViewToggle && (
                <div className="flex items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-xl p-0.5 border border-slate-200/80 dark:border-white/10 h-9 shadow-2xs">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 shadow-2xs text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    title="Table View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow-2xs text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Column Visibility */}
              {enableColumnVisibility && (
                <div className="relative">
                  <Tooltip content={t('table.columns') || 'Columns'} position="bottom" align="center">
                    <button
                      onClick={() => setShowColumnToggle(!showColumnToggle)}
                      className="h-9 w-9 text-xs text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-xl transition-colors flex items-center justify-center cursor-pointer hover:bg-white/90 dark:hover:bg-slate-800/80 shadow-2xs"
                    >
                      <Columns3 className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  <AnimatePresence>
                    {showColumnToggle && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 top-full mt-2 z-50 min-w-[200px] rounded-xl p-3 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10"
                      >
                        {table.getAllLeafColumns().filter((c) => c.id !== 'select' && c.id !== 'expand').map((column) => (
                          <label key={column.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-surface-hover cursor-pointer">
                            <input
                              type="checkbox"
                              checked={column.getIsVisible()}
                              onChange={column.getToggleVisibilityHandler()}
                              className="rounded accent-primary"
                            />
                            <span className="text-sm capitalize text-slate-700 dark:text-slate-200">{column.id.replace(/([A-Z])/g, ' $1')}</span>
                          </label>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Column Filters Toggle */}
              {enableFiltering && (
                <Tooltip content={showColumnFilters ? "Hide Column Filters" : "Column Filters"} position="bottom" align="center">
                  <button
                    onClick={() => setShowColumnFilters(!showColumnFilters)}
                    className={`h-9 w-9 text-xs rounded-xl border transition-colors flex items-center justify-center cursor-pointer shadow-2xs ${showColumnFilters ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/40' : 'text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-slate-200/80 dark:border-white/10 hover:text-teal-600 hover:bg-white/90 dark:hover:bg-slate-800/80'}`}
                  >
                    <Filter className="h-4 w-4" />
                  </button>
                </Tooltip>
              )}

              {/* Export */}
              {enableExport && (
                <div className="relative">
                  <Tooltip content={t('table.export') || 'Export'} position="bottom" align="right">
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="h-9 w-9 text-xs text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-xl transition-colors flex items-center justify-center cursor-pointer hover:bg-white/90 dark:hover:bg-slate-800/80 shadow-2xs"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  <AnimatePresence>
                    {showExportMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 top-full mt-2 z-50 min-w-[160px] rounded-xl py-1.5 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10"
                      >
                        <button onClick={() => exportData('csv')} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-surface-hover text-slate-700 dark:text-slate-200">
                          <FileText className="h-4 w-4" /> {t('table.csv')}
                        </button>
                        <button onClick={() => exportData('json')} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-surface-hover text-slate-700 dark:text-slate-200">
                          <FileJson className="h-4 w-4" /> {t('table.json')}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <TableSkeletonLoader
            columnsCount={table.getVisibleFlatColumns().length || 6}
            viewMode={viewMode}
          />
        ) : table.getRowModel().rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <CheckSquare className="h-12 w-12 mb-3" style={{ color: 'var(--color-text-secondary)', opacity: 0.3 }} />
            <p className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>{t('table.noResults')}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{emptyMessage || t('table.noResultsDesc')}</p>
          </div>
        ) : viewMode === 'grid' ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4" 
            style={activeDesign === 'design1' ? { backgroundColor: 'transparent' } : { backgroundColor: 'var(--color-surface-hover)' }}
          >
            {table.getRowModel().rows.map((row) => (
              <motion.div
                key={row.id}
                variants={itemVariants}
                className={`${activeDesign === 'design1' ? 'glass-card' : 'bg-surface border border-border'} rounded-xl p-4 transition-all relative group ${row.getIsSelected() ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : ''}`}
                onClick={() => onRowClick?.(row.original)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {/* Top-Right Control Actions (Select Checkbox & Action Dropdown side-by-side) */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {enableRowSelection && (
                    <button
                      onClick={() => row.toggleSelected(!row.getIsSelected())}
                      className={`h-5 w-5 rounded-full flex items-center justify-center border transition-all duration-200 ${row.getIsSelected()
                        ? 'bg-primary border-primary text-white scale-110 shadow-sm shadow-primary/30'
                        : 'border-border bg-surface-hover/50 hover:border-primary text-text-secondary'
                        }`}
                    >
                      {row.getIsSelected() && <Check className="h-3 w-3 stroke-[3.5]" />}
                    </button>
                  )}

                  {rowActions && rowActions.length > 0 && (
                    <Dropdown
                      trigger={
                        <button className="p-1.5 rounded-lg bg-surface-hover/50 hover:bg-surface-hover transition-colors">
                          <MoreVertical className="h-4 w-4 text-text-secondary" />
                        </button>
                      }
                      items={rowActions.map((action, i) => ({
                        id: `action-${i}`,
                        label: action.label,
                        icon: action.icon,
                        onClick: () => action.onClick(row.original),
                        danger: action.variant === 'danger'
                      }))}
                      align="right"
                    />
                  )}
                </div>

                {renderCard ? (
                  renderCard(row.original)
                ) : (
                  <div className="space-y-3 mt-1">
                    {row.getVisibleCells().filter(c => c.column.id !== 'actions' && c.column.id !== 'select' && c.column.id !== 'expand').map((cell, i) => {
                      const isFirst = i === 0;
                      return (
                        <div key={cell.id} className={isFirst ? "mb-2 border-b border-border pb-3" : "flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1"}>
                          <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                            {typeof cell.column.columnDef.header === 'string' ? cell.column.columnDef.header : cell.column.id}
                          </span>
                          <div className={`text-sm ${isFirst ? 'font-bold text-lg text-primary truncate mt-1' : 'text-text truncate text-right'}`}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <>
            <table className={`mb-0 w-full min-w-[1250px] align-middle ${tableDesign === 'card' ? 'border border-border' : ''}`}>
                <thead className={dc.header}>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <React.Fragment key={headerGroup.id}>
                      <tr>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className={`${dc.headerCell} ${dc.cell} text-left whitespace-nowrap`}
                            style={{
                              color: 'var(--color-text-secondary)',
                              width: header.getSize(),
                              cursor: header.column.getCanSort() ? 'pointer' : 'default',
                              fontSize: '11px',
                            }}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() && (
                                <span className="opacity-50 shrink-0">
                                  {header.column.getIsSorted() === 'asc' ? (
                                    <ArrowUp className="h-3.5 w-3.5" />
                                  ) : header.column.getIsSorted() === 'desc' ? (
                                    <ArrowDown className="h-3.5 w-3.5" />
                                  ) : (
                                    <ArrowUpDown className="h-3.5 w-3.5" />
                                  )}
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                      {showColumnFilters && (
                        <tr className="bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-700">
                          {headerGroup.headers.map((header) => (
                            <th key={`filter-${header.id}`} className="px-2 py-1.5 text-left font-normal">
                              {header.column.id !== 'select' && header.column.id !== 'expand' && header.column.id !== 'actions' ? (
                                <input
                                  type="text"
                                  value={(header.column.getFilterValue() as string) ?? ''}
                                  onChange={(e) => header.column.setFilterValue(e.target.value)}
                                  placeholder={`Filter ${typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : ''}...`}
                                  className="w-full px-2 py-1 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-normal text-slate-700 dark:text-slate-200 placeholder:text-slate-400 shadow-xs"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : null}
                            </th>
                          ))}
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </thead>
                <motion.tbody
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  {table.getRowModel().rows.map((row) => (
                    <React.Fragment key={row.id}>
                      <motion.tr
                        variants={itemVariants}
                        className={`${dc.row} ${onRowClick ? 'cursor-pointer' : ''}`}
                        onClick={() => onRowClick?.(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className={`${dc.cell} text-xs whitespace-nowrap`} style={{ color: 'var(--color-text)' }}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </motion.tr>
                      {/* Expanded Row */}
                      {enableRowExpansion && row.getIsExpanded() && renderExpandedRow && (
                        <tr>
                          <td colSpan={row.getVisibleCells().length} className="p-4" style={{ background: 'var(--color-surface-hover)' }}>
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                              {renderExpandedRow(row.original)}
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </motion.tbody>
              </table>
          </>
        )}
      </div>

      {/* Pagination */}
      {enablePagination && totalPages > 1 && (
        <div 
          className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 px-4" 
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          {/* Left side: Information about current page / entries */}
          <div className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Showing{' '}
            <span style={{ color: 'var(--color-text)' }}>
              {isServerPaginated 
                ? (currentPage - 1) * resolvedPageSize + 1 
                : table.getState().pagination.pageIndex * resolvedPageSize + 1}
            </span>
            –
            <span style={{ color: 'var(--color-text)' }}>
              {isServerPaginated 
                ? Math.min(currentPage * resolvedPageSize, totalItems) 
                : Math.min((table.getState().pagination.pageIndex + 1) * resolvedPageSize, totalItems)}
            </span>{' '}
            of <span style={{ color: 'var(--color-text)' }}>{totalItems}</span> entries
          </div>

          {/* Center/Right: Page navigation */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Rows Per Page (only for client-side table) */}
            {!isServerPaginated && (
              <div className="flex items-center gap-1.5 mr-2">
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('common.rowsPerPage')}
                </span>
                <select
                  value={resolvedPageSize}
                  onChange={(e) => table.setPageSize(Number(e.target.value))}
                  className="input-base py-1 px-2.5 text-xs rounded-lg cursor-pointer"
                  style={{ 
                    background: 'var(--color-surface-hover)', 
                    borderColor: 'var(--color-border)', 
                    color: 'var(--color-text)' 
                  }}
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center bg-surface-hover/30 p-1 rounded-xl border border-border/50 gap-0.5">
              <button
                onClick={() => {
                  if (isServerPaginated) {
                    serverPagination.onPageChange(1);
                  } else {
                    table.setPageIndex(0);
                  }
                }}
                disabled={isServerPaginated ? currentPage === 1 : !table.getCanPreviousPage()}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-surface-hover disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                title="First Page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              <button
                onClick={() => {
                  if (isServerPaginated) {
                    serverPagination.onPageChange(currentPage - 1);
                  } else {
                    table.previousPage();
                  }
                }}
                disabled={isServerPaginated ? currentPage === 1 : !table.getCanPreviousPage()}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-surface-hover disabled:opacity-30 disabled:hover:bg-transparent transition-all mr-1"
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Page numbers */}
              {getPageNumbers().map((pageNumber, idx) => {
                if (pageNumber === '...') {
                  return (
                    <span 
                      key={`dots-${idx}`} 
                      className="px-2 text-xs font-semibold select-none" 
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      ...
                    </span>
                  );
                }

                const isActive = pageNumber === currentPage;

                return (
                  <button
                    key={`page-${pageNumber}`}
                    onClick={() => {
                      if (isServerPaginated) {
                        serverPagination.onPageChange(pageNumber as number);
                      } else {
                        table.setPageIndex((pageNumber as number) - 1);
                      }
                    }}
                    className={`min-w-[32px] h-[32px] px-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      isActive 
                        ? 'text-white shadow-md shadow-primary/20 scale-105' 
                        : 'text-text-secondary hover:text-text hover:bg-surface-hover'
                    }`}
                    style={isActive ? { 
                      background: 'var(--color-primary)', 
                      borderColor: 'var(--color-primary)' 
                    } : {}}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                onClick={() => {
                  if (isServerPaginated) {
                    serverPagination.onPageChange(currentPage + 1);
                  } else {
                    table.nextPage();
                  }
                }}
                disabled={isServerPaginated ? currentPage === totalPages : !table.getCanNextPage()}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-surface-hover disabled:opacity-30 disabled:hover:bg-transparent transition-all ml-1"
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => {
                  if (isServerPaginated) {
                    serverPagination.onPageChange(totalPages);
                  } else {
                    table.setPageIndex(table.getPageCount() - 1);
                  }
                }}
                disabled={isServerPaginated ? currentPage === totalPages : !table.getCanNextPage()}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-surface-hover disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                title="Last Page"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
