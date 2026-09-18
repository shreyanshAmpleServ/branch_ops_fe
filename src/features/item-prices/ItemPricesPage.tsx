import React, { useState } from 'react';
import {
  Tag,
  RefreshCw,
  FileSpreadsheet,
  Check,
  Boxes,
  DollarSign,
  Layers,
  Warehouse,
  Percent,
} from 'lucide-react';
import {
  useItemPrices,
  usePriceLists,
  useUpdateItemPrice,
  type ItemPriceRow,
} from './api/useItemPrices';
import { useItemCategories } from '../items/api/useItems';
import { useWarehouses } from '../warehouse/api/useWarehouse';
import { DataTable, type ColumnDef } from '../../components/table/DataTable';
import { Button, Tooltip, Spinner } from '../../components/ui';

export const ItemPricesPage: React.FC = () => {
  const [selectedPriceListId, setSelectedPriceListId] = useState<number | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [selectedWhsId, setSelectedWhsId] = useState<string>('all');

  // Inline editing state: itemId -> edited price string
  const [editingPrices, setEditingPrices] = useState<Record<number, string>>({});
  const [savingItemIds, setSavingItemIds] = useState<Record<number, boolean>>({});

  // Queries
  const { data: priceListsData } = usePriceLists();
  const priceLists = priceListsData?.data || [];

  const { data, isLoading, refetch, isRefetching } = useItemPrices({
    priceListId: selectedPriceListId,
    search: searchTerm || undefined,
    catId: selectedCatId !== 'all' ? Number(selectedCatId) : undefined,
    whsId: selectedWhsId !== 'all' ? Number(selectedWhsId) : undefined,
  });

  const { data: categories = [] } = useItemCategories();
  const { data: warehousesData } = useWarehouses({ limit: 100 });
  const warehouses = warehousesData?.warehouses || [];

  const updatePriceMutation = useUpdateItemPrice();

  const itemPrices = data?.itemPrices || [];
  const stats = data?.stats || {
    totalItems: 0,
    totalPricedItems: 0,
    activePriceListsCount: 0,
    avgMargin: 0,
    highestPrice: 0,
  };

  const handlePriceChange = (itemId: number, value: string) => {
    setEditingPrices(prev => ({ ...prev, [itemId]: value }));
  };

  const handleSaveInlinePrice = async (item: ItemPriceRow) => {
    const rawVal = editingPrices[item.itemId];
    if (rawVal === undefined || rawVal === '') return;

    const numVal = parseFloat(rawVal);
    if (isNaN(numVal) || numVal < 0) {
      alert('Please enter a valid price');
      return;
    }

    try {
      setSavingItemIds(prev => ({ ...prev, [item.itemId]: true }));
      await updatePriceMutation.mutateAsync({
        priceListId: item.priceListId,
        itemId: item.itemId,
        price: numVal,
        currency: item.currency,
      });

      setEditingPrices(prev => {
        const next = { ...prev };
        delete next[item.itemId];
        return next;
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update price');
    } finally {
      setSavingItemIds(prev => ({ ...prev, [item.itemId]: false }));
    }
  };

  const handleExportCSV = () => {
    if (!itemPrices || itemPrices.length === 0) return;
    const headers = [
      'ITEM CODE',
      'ITEM NAME',
      'CATEGORY',
      'PRICE LIST',
      'WAREHOUSE',
      'UOM',
      'ON HAND',
      'COMMITTED',
      'ON ORDER',
      'LAST PUR PRC',
      'PRICE',
      'MARGIN (%)',
      'CURRENCY',
    ];
    const csvRows = [
      headers.join(','),
      ...itemPrices.map(i => [
        `"${i.itemCode}"`,
        `"${(i.itemName || '').replace(/"/g, '""')}"`,
        `"${i.categoryName || ''}"`,
        `"${i.priceListName}"`,
        `"${i.warehouseName || ''}"`,
        `"${i.uom || ''}"`,
        i.onHand ?? 0,
        i.isCommited ?? 0,
        i.onOrder ?? 0,
        i.lastPurPrc,
        i.price,
        `${i.marginPercent}%`,
        `"${i.currency}"`,
      ].join(',')),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `ItemPrices-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<ItemPriceRow, unknown>[] = [
    {
      accessorKey: 'itemCode',
      header: 'ITEM CODE',
      cell: ({ row }) => (
        <span className="text-xs font-bold text-teal-600 dark:text-teal-400 font-mono">
          {row.original.itemCode}
        </span>
      ),
    },
    {
      accessorKey: 'itemName',
      header: 'ITEM DETAILS',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">
            {row.original.itemName}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {row.original.categoryName && (
              <span className="text-[10px] text-slate-400 font-medium">
                {row.original.categoryName}
              </span>
            )}
            {row.original.remarks && (
              <span className="text-[10px] text-slate-400 truncate max-w-[140px]" title={row.original.remarks}>
                • {row.original.remarks}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'priceListName',
      header: 'PRICE LIST',
      cell: ({ row }) => (
        <div>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block">
            {row.original.priceListName}
          </span>
          {row.original.priceListCode && (
            <span className="text-[10px] text-slate-400 font-mono">
              {row.original.priceListCode}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'warehouseName',
      header: 'WAREHOUSE',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
          <Warehouse className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>{row.original.warehouseName || 'Main Warehouse'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'uom',
      header: 'UOM / PACK',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 uppercase">
            {row.original.uom || 'PCS'}
          </span>
          {(row.original.qtyInCase ?? 1) > 1 && (
            <span className="text-[10px] text-slate-400">
              Pack: {row.original.qtyInCase}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'onHand',
      header: 'ON HAND',
      cell: ({ row }) => {
        const onHand = Number(row.original.onHand ?? 0);
        return (
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {onHand.toLocaleString()}
          </span>
        );
      },
    },
    {
      id: 'available',
      header: 'AVAILABLE',
      cell: ({ row }) => {
        const available = Number(row.original.onHand ?? 0) - Number(row.original.isCommited ?? 0);
        return (
          <span
            className={`text-xs font-semibold ${
              available <= 0 ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {available.toLocaleString()}
          </span>
        );
      },
    },
    {
      accessorKey: 'lastPurPrc',
      header: 'LAST PUR PRC',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
          ${Number(row.original.lastPurPrc || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      accessorKey: 'currency',
      header: 'CURRENCY',
      cell: ({ row }) => (
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {row.original.currency || 'USD'}
        </span>
      ),
    },
    {
      accessorKey: 'price',
      header: 'ITEM PRICE',
      cell: ({ row }) => {
        const item = row.original;
        const isEditing = editingPrices[item.itemId] !== undefined;
        const currentEditVal = isEditing
          ? editingPrices[item.itemId]
          : item.price > 0
          ? String(item.price)
          : '0';
        const isSaving = savingItemIds[item.itemId];

        return (
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <div className="relative w-28">
              <span className="absolute left-2 top-2 text-[11px] text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={currentEditVal}
                onChange={e => handlePriceChange(item.itemId, e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleSaveInlinePrice(item);
                  }
                }}
                className={`w-full pl-5 pr-2 py-1 text-xs font-mono font-bold rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all ${
                  isEditing
                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 text-amber-900 dark:text-amber-200'
                    : item.price > 0
                    ? 'bg-white dark:bg-slate-900 border-teal-500/40 text-teal-600 dark:text-teal-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              />
            </div>

            {isEditing && (
              <button
                onClick={() => handleSaveInlinePrice(item)}
                disabled={isSaving}
                className="p-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all flex items-center justify-center cursor-pointer"
                title="Save Price"
              >
                {isSaving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'marginPercent',
      header: 'MARGIN (%)',
      cell: ({ row }) => {
        const item = row.original;
        if (item.price === 0) {
          return <span className="text-xs text-slate-400 font-mono">—</span>;
        }
        const margin = item.marginPercent;
        const isPositive = margin >= 0;
        return (
          <span
            className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded-full font-mono ${
              isPositive
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400'
            }`}
          >
            {isPositive ? `+${margin}%` : `${margin}%`}
          </span>
        );
      },
    },
    {
      id: 'pricingStatus',
      header: 'STATUS',
      cell: ({ row }) => {
        const isPriced = row.original.isPriced || row.original.price > 0;
        return isPriced ? (
          <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400">
            PRICED
          </span>
        ) : (
          <span className="inline-block px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
            NOT SET
          </span>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center border border-teal-200 dark:border-teal-800">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Item Price Lists
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive overview of item prices across price lists, inventory stock, purchase costs, and margins
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={handleExportCSV}
            className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-xs font-medium py-2 rounded-xl"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium uppercase">Catalog Items</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {stats.totalItems.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium uppercase">Price Lists</span>
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {priceLists.length} Active
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium uppercase">Average Margin</span>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              +{stats.avgMargin}%
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium uppercase">Highest Price</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
              ${stats.highestPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Table with Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Spinner className="w-8 h-8 text-teal-600" />
            <p className="text-xs text-slate-500">Loading item prices...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={itemPrices}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by item code, item name..."
            extraFilters={
              <div className="flex items-center gap-2">
                {/* Price List Filter */}
                <select
                  value={selectedPriceListId ?? ''}
                  onChange={e => setSelectedPriceListId(e.target.value ? Number(e.target.value) : undefined)}
                  className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  <option value="">All Price Lists</option>
                  {priceLists.map(pl => (
                    <option key={pl.id} value={pl.id}>
                      {pl.name}
                    </option>
                  ))}
                </select>

                {/* Category Filter */}
                <select
                  value={selectedCatId}
                  onChange={e => setSelectedCatId(e.target.value)}
                  className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Warehouse Filter */}
                <select
                  value={selectedWhsId}
                  onChange={e => setSelectedWhsId(e.target.value)}
                  className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  <option value="all">All Warehouses</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={String(w.id)}>
                      {w.name}
                    </option>
                  ))}
                </select>

                <Tooltip content="Refresh" position="bottom">
                  <button
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className="h-9 w-9 text-xs text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                  </button>
                </Tooltip>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
};

export default ItemPricesPage;
