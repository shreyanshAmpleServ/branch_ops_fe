import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Warehouse, RefreshCw, MapPin, Boxes, ArrowRight, Eye, X, DollarSign, PackageCheck } from 'lucide-react';
import { useWarehouses, useWarehouseItems, type ApiWarehouse } from './api/useWarehouse';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/table';
import { Button, Spinner, Tooltip } from '../../components/ui';

export const WarehouseManagement: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const searchTimer = useRef<any>(null);

  // Quick preview warehouse modal state
  const [previewWarehouse, setPreviewWarehouse] = useState<ApiWarehouse | null>(null);

  const { data, isLoading, refetch } = useWarehouses({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
  });

  const { data: previewData, isLoading: isLoadingPreview } = useWarehouseItems(previewWarehouse?.id);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 350);
  };

  const stats = data?.stats ?? { total: 0 };
  const warehouses = data?.warehouses ?? [];
  const pagination = data?.pagination;

  // Define Columns
  const columns: ColumnDef<ApiWarehouse, unknown>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
          #{row.original.id}
        </span>
      ),
    },
    {
      accessorKey: 'code',
      header: 'CODE',
      cell: ({ row }) => (
        <span className="text-xs font-bold text-teal-600 dark:text-teal-400 font-mono">
          {row.original.code || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'WAREHOUSE NAME',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            {row.original.name || '—'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'street',
      header: 'STREET / ADDRESS',
      cell: ({ row }) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {row.original.street || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'location',
      header: 'LOCATION',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{row.original.location || 'HQ'}</span>
        </div>
      ),
    },
    // {
    //   id: 'actions',
    //   header: 'WAREHOUSE ITEMS',
    //   cell: ({ row }) => (
    //     <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
    //       <button
    //         onClick={() => setPreviewWarehouse(row.original)}
    //         className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 flex items-center gap-1.5 transition-all shadow-sm"
    //         title="Quick Stock Preview"
    //       >
    //         <Eye className="w-3.5 h-3.5" />
    //         Quick Preview
    //       </button>
    //       <button
    //         onClick={() => navigate(`/warehouse/items?whsId=${row.original.id}`)}
    //         className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-all shadow-sm"
    //         title="Open In Items Catalog"
    //       >
    //         <Boxes className="w-3.5 h-3.5" />
    //         Manage Items <ArrowRight className="w-3 h-3" />
    //       </button>
    //     </div>
    //   ),
    // },
  ];

  // Stat Cards
  const statCards = [
    { label: 'Total Warehouses', value: stats.total, icon: Warehouse, color: 'var(--color-primary)', bg: 'rgba(99,102,241,0.1)' },
  ];

  return (
    <div className="page-container p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center border border-teal-200 dark:border-teal-800">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Warehouse Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage physical distribution hubs, branches, and navigate warehouse-specific stock inventory
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate('/warehouse/item-prices')}
            className="text-xs font-semibold border-slate-200 dark:border-slate-700 py-2 rounded-xl text-teal-600 dark:text-teal-400"
          >
            <DollarSign className="w-4 h-4 mr-1.5" /> Item Price Lists
          </Button>

          <Button
            variant="secondary"
            onClick={() => navigate('/warehouse/items')}
            className="text-xs font-semibold border-slate-200 dark:border-slate-700 py-2 rounded-xl"
          >
            <Boxes className="w-4 h-4 mr-1.5 text-indigo-600" /> All Inventory Items
          </Button>

          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Unified DataTable Component */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm p-4">
        <DataTable
          data={warehouses}
          columns={columns}
          rowActions={[]}
          isLoading={isLoading}
          enableRowSelection
          enableExport
          exportFileName="warehouses-list"
          enableViewToggle
          defaultViewMode="table"
          enableSearch={true}
          searchValue={search}
          onSearchChange={handleSearchChange}
          serverPagination={pagination ? {
            total: pagination.total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: pagination.totalPages,
            onPageChange: setPage,
          } : undefined}
        />
      </div>

      {/* WAREHOUSE STOCK ITEMS QUICK PREVIEW MODAL */}
      {previewWarehouse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto border border-slate-200 dark:border-slate-700">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2.5">
                <Warehouse className="w-5 h-5 text-teal-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {previewWarehouse.name} ({previewWarehouse.code})
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Live warehouse stock breakdown and inventory valuations
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewWarehouse(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total SKUs in Warehouse</span>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
                    {previewData?.stats?.totalItems ?? '...'}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase block">Active In-Stock Items</span>
                  <span className="text-base font-bold text-emerald-600 mt-0.5 block">
                    {previewData?.stats?.inStockCount ?? '...'}
                  </span>
                </div>
                <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 rounded-xl border border-teal-200/60 dark:border-teal-800/40">
                  <span className="text-[10px] font-bold text-teal-600 uppercase block">Total Valuation</span>
                  <span className="text-base font-bold text-teal-600 mt-0.5 block font-mono">
                    ${Number(previewData?.stats?.totalValuation ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              {isLoadingPreview ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-2">
                  <Spinner className="w-7 h-7 text-teal-600" />
                  <p className="text-xs text-slate-400">Loading warehouse items...</p>
                </div>
              ) : (previewData?.items?.length ?? 0) === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No items assigned or stocked in this warehouse yet.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase font-bold text-slate-500">
                      <tr>
                        <th className="p-3">Item Code</th>
                        <th className="p-3">Item Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-right">On Hand</th>
                        <th className="p-3 text-right">Committed</th>
                        <th className="p-3 text-right">On Order</th>
                        <th className="p-3 text-right">Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {previewData?.items.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                          <td className="p-3 font-mono font-bold text-teal-600 dark:text-teal-400">{item.code}</td>
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{item.name}</td>
                          <td className="p-3 text-slate-500">{item.categoryName || '—'}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                            {item.onHand.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">{item.uom}</span>
                          </td>
                          <td className="p-3 text-right font-mono text-amber-600">{item.isCommited.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono text-blue-600">{item.onOrder.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600">
                            ${item.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-800/80">
              <span className="text-xs text-slate-500">
                Viewing items for warehouse #{previewWarehouse.id}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPreviewWarehouse(null)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const id = previewWarehouse.id;
                    setPreviewWarehouse(null);
                    navigate(`/warehouse/items?whsId=${id}`);
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Boxes className="w-3.5 h-3.5" /> Open Full Items Management
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default WarehouseManagement;
