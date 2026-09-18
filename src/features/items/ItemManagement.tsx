import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  RefreshCw,
  Box,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Layers,
  DollarSign,
  Eye,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Warehouse,
  Tag,
  Info,
  Sliders,
} from 'lucide-react';
import {
  useItems,
  useItemCategories,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  type ApiItem,
} from './api/useItems';
import { useWarehouses } from '../users/api/useMasterData';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/table';
import { Badge } from '../../components/ui';

export const ItemManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const whsParam = searchParams.get('whsId');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number | undefined>(undefined);
  const [selectedWhsId, setSelectedWhsId] = useState<number | undefined>(
    whsParam ? Number(whsParam) : undefined
  );
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [page, setPage] = useState(1);
  const searchTimer = useRef<any>(null);

  // Sync state if URL query param changes
  useEffect(() => {
    if (whsParam) {
      setSelectedWhsId(Number(whsParam));
    } else {
      setSelectedWhsId(undefined);
    }
  }, [whsParam]);

  // Modals & Drawer State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ApiItem | null>(null);
  const [viewingItem, setViewingItem] = useState<ApiItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ApiItem | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'inventory' | 'pricing' | 'flags'>('general');

  // Form State
  const [formData, setFormData] = useState<Partial<ApiItem>>({
    code: '',
    name: '',
    catId: null,
    subCatId: null,
    dfltWhsId: null,
    uom: 'PCS',
    qtyInCase: 1,
    minQtyLevel: 0,
    maxQtyLevel: 0,
    lastPurPrc: 0,
    weight: 0,
    saleVAT: null,
    remarks: '',
    posItem: 'N',
    itemPurchased: 'Y',
    itemSales: 'Y',
    itemInventory: 'Y',
  });

  // Queries & Mutations
  const { data, isLoading, refetch } = useItems({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    catId: selectedCatId,
    whsId: selectedWhsId,
    lowStock: lowStockFilter ? true : undefined,
  });

  const { data: categories = [] } = useItemCategories();
  const { data: warehousesResponse } = useWarehouses();
  const warehouses = warehousesResponse?.data || [];

  const createItemMutation = useCreateItem();
  const updateItemMutation = useUpdateItem();
  const deleteItemMutation = useDeleteItem();

  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 350);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      name: '',
      catId: categories[0]?.id || null,
      subCatId: null,
      dfltWhsId: warehouses[0]?.id || null,
      uom: 'PCS',
      qtyInCase: 1,
      minQtyLevel: 0,
      maxQtyLevel: 0,
      lastPurPrc: 0,
      weight: 0,
      saleVAT: null,
      remarks: '',
      posItem: 'N',
      itemPurchased: 'Y',
      itemSales: 'Y',
      itemInventory: 'Y',
    });
    setActiveTab('general');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: ApiItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setActiveTab('general');
    setIsAddModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Please provide an item name');
      return;
    }

    try {
      if (editingItem) {
        await updateItemMutation.mutateAsync({
          id: editingItem.id,
          data: formData,
        });
      } else {
        await createItemMutation.mutateAsync(formData);
      }
      setIsAddModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      await deleteItemMutation.mutateAsync(deletingItem.id);
      setDeletingItem(null);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete item');
    }
  };

  const stats = data?.stats ?? { total: 0, inStock: 0, lowStock: 0, totalValuation: 0 };
  const items = data?.items ?? [];
  const pagination = data?.pagination;

  // Define Columns
  const columns: ColumnDef<ApiItem, unknown>[] = [
    {
      accessorKey: 'code',
      header: 'CODE',
      cell: ({ row }) => (
        <span style={{ color: 'var(--color-primary)' }} className="text-[13px] font-semibold">
          {row.original.code || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'ITEM NAME',
      cell: ({ row }) => (
        <div>
          <span style={{ color: 'var(--color-text)' }} className="text-[13px] font-medium block">
            {row.original.name || '—'}
          </span>
          {row.original.remarks && (
            <span className="text-[11px] text-gray-400 truncate max-w-xs block">
              {row.original.remarks}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'categoryName',
      header: 'CATEGORY',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[11px] font-normal">
          {row.original.categoryName || 'General'}
        </Badge>
      ),
    },
    {
      accessorKey: 'onHand',
      header: 'ON HAND',
      cell: ({ row }) => {
        const val = Number(row.original.onHand);
        const min = Number(row.original.minQtyLevel);
        const isLow = min > 0 && val <= min;
        return (
          <div className="flex items-center gap-1.5">
            <span
              style={{ color: isLow ? '#ef4444' : 'var(--color-text)' }}
              className="text-[13px] font-semibold"
            >
              {val.toLocaleString()} {row.original.uom || ''}
            </span>
            {isLow && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/10 text-red-500 font-medium">
                Low
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'isCommited',
      header: 'COMMITTED',
      cell: ({ row }) => {
        const val = Number(row.original.isCommited);
        return (
          <span style={{ color: 'var(--color-text-secondary)' }} className="text-[13px]">
            {val.toLocaleString()}
          </span>
        );
      },
    },
    {
      accessorKey: 'onOrder',
      header: 'ON ORDER',
      cell: ({ row }) => {
        const val = Number(row.original.onOrder);
        return (
          <span style={{ color: 'var(--color-text-secondary)' }} className="text-[13px]">
            {val.toLocaleString()}
          </span>
        );
      },
    },
    {
      id: 'available',
      header: 'AVAILABLE',
      cell: ({ row }) => {
        const available = Number(row.original.onHand) - Number(row.original.isCommited);
        return (
          <span
            style={{
              color: available <= 0 ? 'var(--color-text-secondary)' : '#10b981',
            }}
            className="text-[13px] font-medium"
          >
            {available.toLocaleString()} {row.original.uom || ''}
          </span>
        );
      },
    },
    {
      accessorKey: 'lastPurPrc',
      header: 'LAST PRICE',
      cell: ({ row }) => (
        <span style={{ color: 'var(--color-text)' }} className="text-[13px]">
          {Number(row.original.lastPurPrc).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      accessorKey: 'warehouseName',
      header: 'WAREHOUSE',
      cell: ({ row }) => {
        const whsId = row.original.dfltWhsId;
        const whsName = row.original.warehouseName || 'Main Warehouse';
        const isSelected = selectedWhsId !== undefined && selectedWhsId === whsId;

        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (whsId) {
                if (isSelected) {
                  setSelectedWhsId(undefined);
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.delete('whsId');
                    return next;
                  });
                } else {
                  setSelectedWhsId(whsId);
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.set('whsId', String(whsId));
                    return next;
                  });
                }
                setPage(1);
              }
            }}
            className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
              isSelected
                ? 'bg-teal-500/20 border-teal-500 text-teal-600 dark:text-teal-400 font-semibold shadow-sm'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 hover:border-teal-500/60 hover:bg-teal-500/10 text-slate-800 dark:text-slate-200'
            }`}
            title={whsId ? `Click to ${isSelected ? 'clear' : 'filter by'} ${whsName}` : 'Warehouse'}
          >
            <div className={`p-1 rounded-lg shrink-0 ${isSelected ? 'bg-teal-500 text-white' : 'bg-teal-500/10 text-teal-600 dark:text-teal-400'}`}>
              <Warehouse className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold block truncate max-w-[150px]">
              {whsName}
            </span>
          </button>
        );
      },
    },
    // {
    //   id: 'actions',
    //   header: 'ACTIONS',
    //   cell: ({ row }) => (
    //     <div className="flex items-center gap-1">
    //       <button
    //         onClick={() => setViewingItem(row.original)}
    //         className="p-1.5 rounded-lg hover:bg-surface-hover text-gray-400 hover:text-blue-500 transition-colors"
    //         title="View Details"
    //       >
    //         <Eye className="h-4 w-4" />
    //       </button>
    //       <button
    //         onClick={() => handleOpenEditModal(row.original)}
    //         className="p-1.5 rounded-lg hover:bg-surface-hover text-gray-400 hover:text-amber-500 transition-colors"
    //         title="Edit Item"
    //       >
    //         <Edit2 className="h-4 w-4" />
    //       </button>
    //       <button
    //         onClick={() => setDeletingItem(row.original)}
    //         className="p-1.5 rounded-lg hover:bg-surface-hover text-gray-400 hover:text-red-500 transition-colors"
    //         title="Delete Item"
    //       >
    //         <Trash2 className="h-4 w-4" />
    //       </button>
    //     </div>
    //   ),
    // },
  ];

  // Stat Cards
  const statCards = [
    {
      label: 'Total Items Catalog',
      value: stats.total.toLocaleString(),
      icon: Box,
      color: 'var(--color-primary)',
      bg: 'var(--color-primary)/10',
    },
    {
      label: 'In Stock Items',
      value: (stats.inStock ?? 0).toLocaleString(),
      icon: Package,
      color: '#10b981',
      bg: '#10b98115',
    },
    {
      label: 'Low Stock Alerts',
      value: (stats.lowStock ?? 0).toLocaleString(),
      icon: AlertTriangle,
      color: '#f59e0b',
      bg: '#f59e0b15',
    },
    {
      label: 'Total Inventory Value',
      value: `$${(stats.totalValuation ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: '#6366f1',
      bg: '#6366f115',
    },
  ];

  return (
    <div className="page-container p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Item Master & Stock Management
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Comprehensive catalog of inventory items, warehouse levels, pricing, and stock alerts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors hover:bg-surface-hover"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {/* Creation Commented Out */}
          {/* <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-sm"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus className="h-4 w-4" /> Add Item
          </button> */}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-4 flex items-center gap-4 transition-all hover:translate-y-[-2px]"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
              <s.icon className="h-6 w-6" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                {s.label}
              </p>
              <p className="text-xl font-bold mt-1" style={{ color: s.color }}>
                {isLoading ? '—' : s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm p-4">
        <DataTable
          data={items}
          columns={columns}
          rowActions={[]}
          isLoading={isLoading}
          enableRowSelection
          enableExport
          exportFileName="items-catalog-list"
          enableViewToggle
          defaultViewMode="table"
          enableSearch={true}
          searchValue={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search item code, name, UoM..."
          extraFilters={
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                value={selectedCatId ?? ''}
                onChange={(e) => {
                  setSelectedCatId(e.target.value ? Number(e.target.value) : undefined);
                  setPage(1);
                }}
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 focus:outline-none font-medium cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Warehouse Filter (ONLY Name) */}
              <select
                value={selectedWhsId ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setSelectedWhsId(val);
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    if (val) {
                      next.set('whsId', String(val));
                    } else {
                      next.delete('whsId');
                    }
                    return next;
                  });
                  setPage(1);
                }}
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 focus:outline-none font-medium cursor-pointer"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>

              {/* Active warehouse filter badge */}
              {selectedWhsId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWhsId(undefined);
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.delete('whsId');
                      return next;
                    });
                    setPage(1);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
                  title="Clear warehouse filter"
                >
                  <Warehouse className="w-3.5 h-3.5" />
                  <span>{warehouses.find((w) => w.id === selectedWhsId)?.name || 'Warehouse'}</span>
                  <X className="h-3 w-3" />
                </button>
              )}

              {/* Low Stock Toggle */}
              <button
                type="button"
                onClick={() => {
                  setLowStockFilter(!lowStockFilter);
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  lowStockFilter
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-300 dark:border-amber-800 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Low Stock
              </button>
            </div>
          }
          serverPagination={
            pagination
              ? {
                  total: pagination.total,
                  page: pagination.page,
                  limit: pagination.limit,
                  totalPages: pagination.totalPages,
                  onPageChange: setPage,
                }
              : undefined
          }
        />
      </div>

      {/* ADD / EDIT ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto animate-in zoom-in-95 duration-150"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            {/* Modal Fixed Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <Box className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                  {editingItem ? 'Edit Item' : 'Create New Item'}
                </h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-surface-hover transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Fixed Tabs */}
            <div className="flex border-b px-6 gap-6 shrink-0 bg-surface" style={{ borderColor: 'var(--color-border)' }}>
              {[
                { id: 'general', label: 'General Info', icon: Info },
                { id: 'inventory', label: 'Inventory & Stock', icon: Warehouse },
                { id: 'pricing', label: 'Pricing & Valuation', icon: DollarSign },
                { id: 'flags', label: 'Attributes & Flags', icon: Sliders },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === t.id
                      ? 'border-primary text-primary font-semibold'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                  style={activeTab === t.id ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Form Scrollable Content */}
            <form id="item-form" onSubmit={handleSaveItem} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* TAB 1: GENERAL */}
              {activeTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Item Code
                    </label>
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="Auto-generated if blank (e.g. ITM-0001)"
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{
                        background: 'var(--color-background)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Item Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Premium Unleaded 95 Gasoline"
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{
                        background: 'var(--color-background)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Item Category
                    </label>
                    <select
                      value={formData.catId ?? ''}
                      onChange={(e) => setFormData({ ...formData, catId: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{
                        background: 'var(--color-background)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Unit of Measure (UoM)
                    </label>
                    <input
                      type="text"
                      value={formData.uom || ''}
                      onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                      placeholder="PCS, Liters, KG, Box..."
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{
                        background: 'var(--color-background)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Remarks / Description
                    </label>
                    <textarea
                      rows={3}
                      value={formData.remarks || ''}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="Enter item description, specifications or barcodes..."
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none resize-none"
                      style={{
                        background: 'var(--color-background)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: INVENTORY & STOCK */}
              {activeTab === 'inventory' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Default Warehouse
                    </label>
                    <select
                      value={formData.dfltWhsId ?? ''}
                      onChange={(e) => setFormData({ ...formData, dfltWhsId: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{
                        background: 'var(--color-background)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    >
                      <option value="">-- Select Default Warehouse --</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Quantity In Case / Pack
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.qtyInCase || 1}
                      onChange={(e) => setFormData({ ...formData, qtyInCase: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{
                        background: 'var(--color-background)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Minimum Reorder Stock Level
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minQtyLevel || 0}
                      onChange={(e) => setFormData({ ...formData, minQtyLevel: Number(e.target.value) })}
                      placeholder="Alert triggered below this level"
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{
                        background: 'var(--color-background)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Maximum Stock Level
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxQtyLevel || 0}
                      onChange={(e) => setFormData({ ...formData, maxQtyLevel: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{
                        background: 'var(--color-background)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    />
                  </div>

                  {editingItem && (
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Current Stock On Hand
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.onHand || 0}
                        onChange={(e) => setFormData({ ...formData, onHand: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                        style={{
                          background: 'var(--color-background)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text)',
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PRICING & VALUATION */}
              {activeTab === 'pricing' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Last Purchase Price / Cost
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.lastPurPrc || 0}
                        onChange={(e) => setFormData({ ...formData, lastPurPrc: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                        style={{
                          background: 'var(--color-background)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text)',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Weight (KG)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.weight || 0}
                      onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{
                        background: 'var(--color-background)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Sales VAT / Tax Code ID
                    </label>
                    <input
                      type="number"
                      value={formData.saleVAT || ''}
                      onChange={(e) => setFormData({ ...formData, saleVAT: e.target.value ? Number(e.target.value) : null })}
                      placeholder="Default Tax Rate ID"
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{
                        background: 'var(--color-background)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: FLAGS & ATTRIBUTES */}
              {activeTab === 'flags' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'itemPurchased', label: 'Purchasable Item', desc: 'Can be ordered via Purchase Orders / Requests' },
                    { key: 'itemSales', label: 'Sales Item', desc: 'Can be sold to customers on Invoices / Quotations' },
                    { key: 'itemInventory', label: 'Inventory Item', desc: 'Tracked for on-hand stock and warehouse movements' },
                    { key: 'posItem', label: 'POS Terminal Item', desc: 'Exposed in fuel station / retail POS screens' },
                  ].map((f) => (
                    <label
                      key={f.key}
                      className="flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer hover:bg-surface-hover transition-colors"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)' }}
                    >
                      <input
                        type="checkbox"
                        checked={(formData as any)[f.key] === 'Y'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [f.key]: e.target.checked ? 'Y' : 'N',
                          })
                        }
                        className="mt-1 h-4 w-4 rounded border-gray-600 text-primary focus:ring-0"
                      />
                      <div>
                        <span className="text-sm font-semibold block" style={{ color: 'var(--color-text)' }}>
                          {f.label}
                        </span>
                        <span className="text-xs text-gray-400">{f.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </form>

            {/* Modal Fixed Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t shrink-0" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-surface-hover transition-colors"
                style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="item-form"
                disabled={createItemMutation.isPending || updateItemMutation.isPending}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 flex items-center gap-2 shadow-sm"
                style={{ background: 'var(--color-primary)' }}
              >
                {createItemMutation.isPending || updateItemMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {editingItem ? 'Update Item' : 'Save Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ITEM DRAWER */}
      {viewingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
            style={{ background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)' }}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Item Details</span>
                  <h3 className="text-lg font-bold mt-0.5" style={{ color: 'var(--color-text)' }}>
                    {viewingItem.name}
                  </h3>
                </div>
                <button
                  onClick={() => setViewingItem(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-surface-hover transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="p-3.5 rounded-xl bg-surface-hover flex items-center justify-between">
                  <span className="text-xs text-gray-400">Item Code</span>
                  <span className="text-sm font-bold text-primary">{viewingItem.code || '—'}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-gray-700/40">
                    <span className="text-[11px] text-gray-400 block">Category</span>
                    <span className="text-xs font-semibold text-gray-200 mt-0.5 block">{viewingItem.categoryName || '—'}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-gray-700/40">
                    <span className="text-[11px] text-gray-400 block">Warehouse</span>
                    <span className="text-xs font-semibold text-gray-200 mt-0.5 block">{viewingItem.warehouseName || '—'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Stock On Hand</span>
                    <span className="text-sm font-bold text-gray-100">{viewingItem.onHand} {viewingItem.uom}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Committed (Orders)</span>
                    <span className="text-sm font-medium text-gray-300">{viewingItem.isCommited} {viewingItem.uom}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">On Order (PO)</span>
                    <span className="text-sm font-medium text-gray-300">{viewingItem.onOrder} {viewingItem.uom}</span>
                  </div>
                  <div className="pt-2 border-t border-primary/20 flex justify-between items-center">
                    <span className="text-xs font-semibold text-emerald-400">Net Available</span>
                    <span className="text-base font-bold text-emerald-400">
                      {viewingItem.onHand - viewingItem.isCommited} {viewingItem.uom}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-gray-800">
                    <span className="text-gray-400">Last Purchase Price</span>
                    <span className="font-semibold text-gray-200">${Number(viewingItem.lastPurPrc).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-800">
                    <span className="text-gray-400">Inventory Valuation</span>
                    <span className="font-semibold text-emerald-400">
                      ${(Number(viewingItem.onHand) * Number(viewingItem.lastPurPrc)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-800">
                    <span className="text-gray-400">Min Reorder Level</span>
                    <span className="font-semibold text-gray-200">{viewingItem.minQtyLevel} {viewingItem.uom}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-800">
                    <span className="text-gray-400">Max Stock Level</span>
                    <span className="font-semibold text-gray-200">{viewingItem.maxQtyLevel} {viewingItem.uom}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex gap-2" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => {
                  const itm = viewingItem;
                  setViewingItem(null);
                  handleOpenEditModal(itm);
                }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 transition-colors flex items-center justify-center gap-1.5"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit Item
              </button>
              <button
                onClick={() => setViewingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-gray-700 hover:bg-surface-hover text-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="h-12 w-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-gray-100">Delete Item?</h3>
              <p className="text-xs text-gray-400 mt-1">
                Are you sure you want to delete <strong className="text-gray-200">{deletingItem.name}</strong> ({deletingItem.code})? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeletingItem(null)}
                className="flex-1 py-2 rounded-xl text-xs font-medium border border-gray-700 hover:bg-surface-hover text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteItemMutation.isPending}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center gap-1"
              >
                {deleteItemMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemManagement;
