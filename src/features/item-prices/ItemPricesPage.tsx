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
  TrendingUp,
  BarChart3,
  Download,
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
    <div className="p-4 space-y-4 w-full max-w-full animate-fade-in">
      {/* Top Header Card Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
            style={{ background: 'var(--color-primary-50, rgba(99,102,241,0.08))', border: '1px solid var(--color-primary-200, rgba(99,102,241,0.2))' }}
          >
            <Tag className="w-4.5 h-4.5" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Item Price Lists
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive overview of item prices across price lists, inventory stock, purchase costs, and margins
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Dynamic KPI Stats Cards Row (Real counts from API) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Catalog Items */}
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Boxes className="w-3 h-3" />
              </div>
              Catalog Items
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{isLoading ? '—' : stats.totalItems.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              Active SKUs
            </div>
          </div>
          <div className="text-blue-500/40 dark:text-blue-400/40">
            <BarChart3 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 2: Price Lists */}
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <Layers className="w-3 h-3" />
              </div>
              Active Price Lists
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{priceLists.length}</div>
            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
              Configured lists
            </div>
          </div>
          <div className="text-indigo-500/40 dark:text-indigo-400/40">
            <Layers className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 3: Average Margin */}
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Percent className="w-3 h-3" />
              </div>
              Average Margin
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">+{stats.avgMargin}%</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Target markup spread
            </div>
          </div>
          <div className="text-emerald-500/40 dark:text-emerald-400/40">
            <Percent className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 4: Highest Price */}
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="w-5.5 h-5.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <DollarSign className="w-3 h-3" />
              </div>
              Highest Price
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              ${stats.highestPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
              Max catalog unit price
            </div>
          </div>
          <div className="text-purple-500/40 dark:text-purple-400/40">
            <BarChart3 className="w-5.5 h-5.5 stroke-[1.5]" />
          </div>
        </div>
      </div>

      {/* Main Table with Filters */}
      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        <DataTable
          columns={columns}
          data={itemPrices}
          isLoading={isLoading}
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
      </div>
    </div>
  );
};

export default ItemPricesPage;
