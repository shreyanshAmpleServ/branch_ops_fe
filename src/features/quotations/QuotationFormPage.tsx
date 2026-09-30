import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  FileText,
  Calculator,
  User,
  Calendar,
  Building2,
} from 'lucide-react';
import {
  useQuotation,
  useCreateQuotation,
  useUpdateQuotation,
  type QuotationInput,
} from './api/useQuotations';
import { useRetailers } from '../customers/api/useRetailers';
import { useItems } from '../items/api/useItems';
import { useWarehouses } from '../warehouse/api/useWarehouse';
import { Button, Input, Spinner, CustomerSelect, ItemSelect, WarehouseSelect } from '../../components/ui';

interface FormRow {
  ItemID: number;
  ItemCode: string;
  ItemName: string;
  Quantity: number;
  UnitPrice: number;
  DiscPrcnt: number;
  VATPer: number;
  WhsCode: number;
  UoM: string;
}

export const QuotationFormPage: React.FC<{ mode?: 'add' | 'edit' }> = ({ mode = 'add' }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: existingQuotation, isLoading: isLoadingQuotation } = useQuotation(id);
  const { data: retailersData, isLoading: isLoadingRetailers } = useRetailers();
  const { data: itemsData, isLoading: isLoadingItems } = useItems({ limit: 500 });
  const { data: warehousesData } = useWarehouses();

  const createMutation = useCreateQuotation();
  const updateMutation = useUpdateQuotation();

  // Form State
  const [custCode, setCustCode] = useState('');
  const [custName, setCustName] = useState('');
  const [address, setAddress] = useState('');
  const [custRefNo, setCustRefNo] = useState('');
  const [postDate, setPostDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [remarks, setRemarks] = useState('');
  const [discPrcnt, setDiscPrcnt] = useState(0);

  const [rows, setRows] = useState<FormRow[]>([
    { ItemID: 0, ItemCode: '', ItemName: '', Quantity: 1, UnitPrice: 0, DiscPrcnt: 0, VATPer: 18, WhsCode: 0, UoM: 'Pcs' }
  ]);

  const customersList = Array.isArray(retailersData) ? retailersData : [];
  const productsList = itemsData?.items || [];
  const warehousesList = Array.isArray(warehousesData) ? warehousesData : (warehousesData as any)?.data || [];

  // Populate form in edit mode
  useEffect(() => {
    if (mode === 'edit' && existingQuotation) {
      setCustCode(existingQuotation.CustCode || '');
      setCustName(existingQuotation.CustName || '');
      setAddress(existingQuotation.Address || '');
      setCustRefNo(existingQuotation.CustRefNo || '');
      if (existingQuotation.PostDate) {
        setPostDate(new Date(existingQuotation.PostDate).toISOString().split('T')[0]);
      }
      if (existingQuotation.DueDate) {
        setDueDate(new Date(existingQuotation.DueDate).toISOString().split('T')[0]);
      }
      setRemarks(existingQuotation.Remarks || '');
      setDiscPrcnt(Number(existingQuotation.DiscPrcnt || 0));

      if (existingQuotation.items && existingQuotation.items.length > 0) {
        setRows(
          existingQuotation.items.map(it => ({
            ItemID: it.ItemID,
            ItemCode: it.ItemCode || '',
            ItemName: it.ItemName || '',
            Quantity: Number(it.Quantity || 1),
            UnitPrice: Number(it.UnitPrice || 0),
            DiscPrcnt: Number(it.DiscPrcnt || 0),
            VATPer: Number(it.VATPer != null ? it.VATPer : 18),
            WhsCode: it.WhsCode ? Number(it.WhsCode) : 0,
            UoM: it.UoM || 'Pcs',
          }))
        );
      }
    }
  }, [mode, existingQuotation]);

  const handleCustomerSelect = (code: string) => {
    setCustCode(code);
    const found = customersList.find(c => c.Code === code);
    if (found) {
      setCustName(found.Name);
      setAddress(found.Address || '');
    }
  };

  const handleItemSelect = (index: number, val: any, itm?: any) => {
    const found = itm || productsList.find(p => p.id === Number(val) || p.code === val);
    if (!found) return;

    setRows(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        ItemID: found.id || found.ID || Number(val),
        ItemCode: found.code || found.Code || '',
        ItemName: found.name || found.Name || '',
        UnitPrice: Number(found.price || found.lastPurPrc || 0),
        UoM: found.uom || found.UoM || 'Pcs',
        WhsCode: found.dfltWhsId || found.WhsCode || (warehousesList[0]?.id || 1),
      };
      return updated;
    });
  };

  const handleRowChange = (index: number, field: keyof FormRow, value: any) => {
    setRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addRow = () => {
    setRows(prev => [
      ...prev,
      { ItemID: 0, ItemCode: '', ItemName: '', Quantity: 1, UnitPrice: 0, DiscPrcnt: 0, VATPer: 18, WhsCode: 0, UoM: 'Pcs' }
    ]);
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) return;
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const calculateRowTotal = (row: FormRow) => {
    const base = Number(row.Quantity || 0) * Number(row.UnitPrice || 0);
    const afterDisc = base * (1 - Number(row.DiscPrcnt || 0) / 100);
    const tax = afterDisc * (Number(row.VATPer || 0) / 100);
    return afterDisc + tax;
  };

  const subtotalBeforeDiscount = rows.reduce(
    (acc, row) => acc + Number(row.Quantity || 0) * Number(row.UnitPrice || 0),
    0
  );

  const subtotalAfterRowDiscount = rows.reduce((acc, row) => {
    const base = Number(row.Quantity || 0) * Number(row.UnitPrice || 0);
    return acc + base * (1 - Number(row.DiscPrcnt || 0) / 100);
  }, 0);

  const globalDiscountAmount = subtotalAfterRowDiscount * (discPrcnt / 100);
  const totalTax = rows.reduce((acc, row) => {
    const base = Number(row.Quantity || 0) * Number(row.UnitPrice || 0);
    const afterDisc = base * (1 - Number(row.DiscPrcnt || 0) / 100);
    return acc + afterDisc * (Number(row.VATPer || 0) / 100);
  }, 0);

  const grandTotal = subtotalAfterRowDiscount - globalDiscountAmount + totalTax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!custCode) {
      alert('Please select a customer.');
      return;
    }

    const validItems = rows.filter(r => r.ItemID > 0 && r.Quantity > 0);
    if (validItems.length === 0) {
      alert('Please add at least one valid line item.');
      return;
    }

    const payload: QuotationInput = {
      CustCode: custCode,
      CustName: custName,
      Address: address,
      CustRefNo: custRefNo,
      PostDate: postDate,
      DueDate: dueDate,
      Remarks: remarks,
      DiscPrcnt: discPrcnt,
      items: validItems.map(r => ({
        ItemID: r.ItemID,
        ItemCode: r.ItemCode,
        ItemName: r.ItemName,
        Quantity: Number(r.Quantity),
        UnitPrice: Number(r.UnitPrice),
        DiscPrcnt: Number(r.DiscPrcnt),
        VATPer: Number(r.VATPer),
        WhsCode: Number(r.WhsCode || 1),
        UoM: r.UoM,
      })),
    };

    if (mode === 'edit' && id) {
      await updateMutation.mutateAsync({ id: Number(id), payload });
      navigate(`/quotations/view/${id}`);
    } else {
      const created = await createMutation.mutateAsync(payload);
      navigate(`/quotations/view/${created.ID}`);
    }
  };

  if (mode === 'edit' && isLoadingQuotation) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-3">
        <Spinner className="w-8 h-8 text-teal-600" />
        <p className="text-xs text-slate-500">Loading quotation details...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 w-full max-w-full animate-fade-in pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl p-4 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            to="/quotations"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {mode === 'edit' ? `Edit Quotation #${existingQuotation?.QuotCode || id}` : 'New Sales Quotation'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Draft and issue official sales quotation for customer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/quotations')}
            className="border-slate-200 dark:border-slate-700 text-xs py-2 px-4 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2 px-5 rounded-xl shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Quotation'}
          </Button>
        </div>
      </div>

      {/* Header Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer Information Card */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl p-4 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Customer Information</h2>
          </div>

          <div>
            <CustomerSelect
              label="Select Customer *"
              value={custCode}
              data={customersList}
              onChange={(val) => handleCustomerSelect(String(val || ''))}
              placeholder="Search & select customer..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              placeholder="Customer Name"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Billing Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              placeholder="Billing address..."
            />
          </div>
        </div>

        {/* Dates & Reference Card */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl p-4 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Quotation Dates & Reference</h2>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Quotation Date *
            </label>
            <input
              type="date"
              value={postDate}
              onChange={(e) => setPostDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Valid Until / Due Date *
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Customer Ref No.
            </label>
            <input
              type="text"
              value={custRefNo}
              onChange={(e) => setCustRefNo(e.target.value)}
              placeholder="e.g. PO-REQ-9812"
              className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>

        {/* Financial Summary Card - High Contrast & Crisp */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl p-4 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Quotation Total
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                Summary
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span className="font-medium">Subtotal (items):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ${subtotalBeforeDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span className="font-medium">VAT / Tax Total:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ${totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span className="font-medium">Overall Discount (%):</span>
                <div className="w-20">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={discPrcnt}
                    onChange={(e) => setDiscPrcnt(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                    className="w-full px-2 py-1 text-right text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {discPrcnt > 0 && (
                <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                  <span className="font-medium">Discount Amount:</span>
                  <span className="font-mono font-bold">
                    -${globalDiscountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3.5 border-t border-slate-200 dark:border-slate-700 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                  Grand Total
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">Net payable</div>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table Card */}
      <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Quotation Line Items</h2>
            <p className="text-xs text-slate-500 mt-0.5">Add items, select warehouse, set quantities and pricing</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={addRow}
            className="border-teal-500/30 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 font-semibold"
          >
            <Plus className="w-4 h-4" /> Add Item Row
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3 min-w-[240px]">Item Description *</th>
                <th className="py-3 px-3 w-36">Warehouse</th>
                <th className="py-3 px-3 w-24 text-right">Qty *</th>
                <th className="py-3 px-3 w-20 text-center">UoM</th>
                <th className="py-3 px-3 w-28 text-right">Unit Price ($) *</th>
                <th className="py-3 px-3 w-20 text-right">Disc %</th>
                <th className="py-3 px-3 w-20 text-right">Tax %</th>
                <th className="py-3 px-3 w-28 text-right">Line Total</th>
                <th className="py-3 px-3 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-400 dark:text-slate-500 text-center">{idx + 1}</td>

                  {/* Item Picker */}
                  <td className="py-2.5 px-3 min-w-[200px]">
                    <ItemSelect
                      size="sm"
                      value={row.ItemCode || (row.ItemID > 0 ? row.ItemID : '')}
                      data={productsList}
                      onChange={(val, itm) => handleItemSelect(idx, val, itm)}
                      placeholder="Select Product..."
                    />
                  </td>

                  {/* Warehouse Picker */}
                  <td className="py-2.5 px-3 min-w-[150px]">
                    <WarehouseSelect
                      size="sm"
                      value={row.WhsCode || ''}
                      data={warehousesList}
                      onChange={(val) => handleRowChange(idx, 'WhsCode', val ? Number(val) : 0)}
                      placeholder="Select Whs..."
                    />
                  </td>

                  {/* Quantity */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={row.Quantity}
                      onChange={(e) => handleRowChange(idx, 'Quantity', Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-right focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      required
                    />
                  </td>

                  {/* UoM */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={row.UoM}
                      onChange={(e) => handleRowChange(idx, 'UoM', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-center focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </td>

                  {/* Unit Price */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={row.UnitPrice}
                      onChange={(e) => handleRowChange(idx, 'UnitPrice', Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-right focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      required
                    />
                  </td>

                  {/* Disc % */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={row.DiscPrcnt}
                      onChange={(e) => handleRowChange(idx, 'DiscPrcnt', Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-right focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </td>

                  {/* Tax % */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={row.VATPer}
                      onChange={(e) => handleRowChange(idx, 'VATPer', Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-right focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </td>

                  {/* Line Total */}
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    ${calculateRowTotal(row).toFixed(2)}
                  </td>

                  {/* Delete Row */}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      disabled={rows.length === 1}
                      className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-20 transition-all"
                      title="Remove line item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remarks Section */}
      <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-4">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
          Special Terms, Conditions & Remarks
        </label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={3}
          placeholder="Delivery terms, validity guarantees, payment terms..."
          className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>
    </form>
  );
};

export default QuotationFormPage;
