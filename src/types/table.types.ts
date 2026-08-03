import type { ColumnDef, SortingState, ColumnFiltersState, VisibilityState, RowSelectionState, ExpandedState, PaginationState } from '@tanstack/react-table';

export type TableDesignVariant = 'modern' | 'striped' | 'card';
export type TableLibrary = 'antd' | 'primereact' | 'bootstrap' | 'mui' | 'aggrid';

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  design?: TableDesignVariant;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  enableColumnResize?: boolean;
  enableRowExpansion?: boolean;
  enableExport?: boolean;
  enableSearch?: boolean;
  enableBulkActions?: boolean;
  enableInlineEdit?: boolean;
  enableStickyHeader?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (row: TData) => void;
  onBulkAction?: (action: string, selectedRows: TData[]) => void;
  onCellEdit?: (rowId: string, columnId: string, value: unknown) => void;
  renderExpandedRow?: (row: TData) => React.ReactNode;
  bulkActions?: BulkAction[];
  exportFileName?: string;
  className?: string;
}

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
}

export interface TableState {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  rowSelection: RowSelectionState;
  expanded: ExpandedState;
  pagination: PaginationState;
  globalFilter: string;
}

export interface ExportConfig {
  type: 'csv' | 'json';
  fileName: string;
  columns?: string[];
}
