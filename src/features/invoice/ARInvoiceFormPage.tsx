import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Receipt,
  Calculator,
  User,
  Calendar,
  Truck,
  Copy,
} from 'lucide-react';
import {
  useARInvoice,
  useCreateARInvoice,
  useUpdateARInvoice,
  type ARInvoiceInput,
} from './api/useARInvoices';
import { useSalesOrders, useSalesOrder } from '../deals/api/useSalesOrders';
import { useRetailers } from '../customers/api/useRetailers';
import { useItems } from '../items/api/useItems';
import { useWarehouses } from '../warehouse/api/useWarehouse';
import { Button, Spinner } from '../../components/ui';

interface FormRow {
  ItemID: number;
  ItemCode: string;
  ItemName: string;
  Quantity: number;
  UnitPrice: number;
  DiscPrcnt: number;
  VATPer: number;
  WhsCode: string;
  UoM: string;
}

export const ARInvoiceFormPage: React.FC<{ mode?: 'add' | 'edit' }> = ({ mode = 'add' }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const copyFromOrderId = searchParams.get('copyFromOrder');

  const { data: existingInvoice, isLoading: isLoadingInvoice } = useARInvoice(id);
  const { data: sourceOrder, isLoading: isLoadingSourceOrder } = useSalesOrder(copyFromOrderId || undefined);
  const { data: openOrders } = useSalesOrders({ status: 'open' });
  const { data: retailersData } = useRetailers();
  const { data: itemsData } = useItems({ limit: 500 });
  const { data: warehousesData } = useWarehouses();

  const createMutation = useCreateARInvoice();
  const updateMutation = useUpdateARInvoice();

  // Form State
  const [custCode, setCustCode] = useState('');
  const [custName, setCustName] = useState('');
  const [address, setAddress] = useState('');
  const [custRefNo, setCustRefNo] = useState('');
  const [postDate, setPostDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [remarks, setRemarks] = useState('');
  const [discPrcnt, setDiscPrcnt] = useState(0);
  const [orderId, setOrderId] = useState<number | undefined>(
    copyFromOrderId ? Number(copyFromOrderId) : undefined
  );
  const [quotationId, setQuotationId] = useState<number | undefined>();
  const [vehicleId, setVehicleId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverLicenseNo, setDriverLicenseNo] = useState('');
  const [transporterName, setTransporterName] = useState('');
  const [cashSales, setCashSales] = useState('N');

  const [rows, setRows] = useState<FormRow[]>([
    { ItemID: 0, ItemCode: '', ItemName: '', Quantity: 1, UnitPrice: 0, DiscPrcnt: 0, VATPer: 18, WhsCode: '1', UoM: 'Pcs' }
  ]);

  const customersList = Array.isArray(retailersData) ? retailersData : [];
  const productsList = itemsData?.items || [];
  const warehousesList = Array.isArray(warehousesData) ? warehousesData : (warehousesData as any)?.data || [];

  // Handle pre-population from Order (Copy From)
  useEffect(() => {
    if (sourceOrder && mode === 'add') {
      setCustCode(sourceOrder.CustCode || '');
      setCustName(sourceOrder.CustName || '');
      setAddress(sourceOrder.Address || '');
      setCustRefNo(sourceOrder.CustRefNo || '');
      setOrderId(sourceOrder.ID);
      setQuotationId(sourceOrder.QuotationId || undefined);
      setRemarks(sourceOrder.Remarks ? `Copied from Order #${sourceOrder.OrderCode || sourceOrder.ID}. ${sourceOrder.Remarks}` : `Copied from Order #${sourceOrder.OrderCode || sourceOrder.ID}`);
      setDiscPrcnt(Number(sourceOrder.DiscPrcnt || 0));
      setVehicleId(sourceOrder.VehicleId || '');
      setDriverName(sourceOrder.DriverName || '');

      if (sourceOrder.items && sourceOrder.items.length > 0) {
        setRows(
          sourceOrder.items.map(it => ({
            ItemID: it.ItemID,
            ItemCode: it.ItemCode || '',
            ItemName: it.ItemName || '',
            Quantity: Number(it.Quantity || 1),
            UnitPrice: Number(it.UnitPrice || 0),
            DiscPrcnt: Number(it.DiscPrcnt || 0),
            VATPer: Number(it.VATPer != null ? it.VATPer : 18),
            WhsCode: it.WhsCode ? String(it.WhsCode) : '1',
            UoM: it.UoM || 'Pcs',
          }))
        );
      }
    }
  }, [sourceOrder, mode]);

  // Handle edit mode
  useEffect(() => {
    if (mode === 'edit' && existingInvoice) {
      setCustCode(existingInvoice.CustCode || '');
      setCustName(existingInvoice.CustName || '');
      setAddress(existingInvoice.Address || '');
      setCustRefNo(existingInvoice.CustRefNo || '');
      if (existingInvoice.PostDate) {
        setPostDate(new Date(existingInvoice.PostDate).toISOString().split('T')[0]);
      }
      if (existingInvoice.DueDate) {
        setDueDate(new Date(existingInvoice.DueDate).toISOString().split('T')[0]);
      }
      setRemarks(existingInvoice.Remarks || '');
      setDiscPrcnt(Number(existingInvoice.DiscPrcnt || 0));
      setOrderId(existingInvoice.OrderId || undefined);
      setQuotationId(existingInvoice.QuotationId || undefined);
      setVehicleId(existingInvoice.VehicleId || '');
      setDriverName(existingInvoice.DriverName || '');

      if (existingInvoice.items && existingInvoice.items.length > 0) {
        setRows(
          existingInvoice.items.map(it => ({
            ItemID: it.ItemID,
            ItemCode: it.ItemCode || '',
            ItemName: it.ItemName || '',
            Quantity: Number(it.Quantity || 1),
            UnitPrice: Number(it.UnitPrice || 0),
            DiscPrcnt: Number(it.DiscPrcnt || 0),
            VATPer: Number(it.VATPer != null ? it.VATPer : 18),
            WhsCode: it.WhsCode ? String(it.WhsCode) : '1',
            UoM: it.UoM || 'Pcs',
          }))
        );
      }
    }
  }, [mode, existingInvoice]);

  const handleCustomerSelect = (code: string) => {
    setCustCode(code);
    const found = customersList.find(c => c.Code === code);
    if (found) {
      setCustName(found.Name);
      setAddress(found.Address || '');
    }
  };

  const handleCopyFromOrderSelect = (oId: number) => {
    if (!oId) return;
    navigate(`/invoice/new?copyFromOrder=${oId}`);
  };

  const handleItemSelect = (index: number, itemId: number) => {
    const found = productsList.find(p => p.id === itemId);
    if (!found) return;

    setRows(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        ItemID: found.id,
        ItemCode: found.code || '',
        ItemName: found.name,
        UnitPrice: Number(found.lastPurPrc || 0),
        UoM: found.uom || 'Pcs',
        WhsCode: String(found.dfltWhsId || '1'),
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
      { ItemID: 0, ItemCode: '', ItemName: '', Quantity: 1, UnitPrice: 0, DiscPrcnt: 0, VATPer: 18, WhsCode: '1', UoM: 'Pcs' }
    ]);
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) return;
    setRows(prev => prev.filter((_, i) => i !== index));
  };

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

    const payload: ARInvoiceInput = {
      CustCode: custCode,
      CustName: custName,
      Address: address,
      CustRefNo: custRefNo,
      PostDate: postDate,
      DueDate: dueDate,
      Remarks: remarks,
      DiscPrcnt: discPrcnt,
      OrderId: orderId,
      QuotationId: quotationId,
      VehicleId: vehicleId || undefined,
      DriverName: driverName || undefined,
      DriverLicenseNo: driverLicenseNo || undefined,
      TransporterName: transporterName || undefined,
      CashSales: cashSales,
      items: validItems.map(r => ({
        ItemID: r.ItemID,
        ItemCode: r.ItemCode,
        ItemName: r.ItemName,
        Quantity: Number(r.Quantity),
        UnitPrice: Number(r.UnitPrice),
        DiscPrcnt: Number(r.DiscPrcnt),
        VATPer: Number(r.VATPer),
        WhsCode: r.WhsCode,
        UoM: r.UoM,
      })),
    };

    if (mode === 'edit' && id) {
      await updateMutation.mutateAsync({ id: Number(id), payload });
      navigate(`/invoice/view/${id}`);
    } else {
      const created = await createMutation.mutateAsync(payload);
      navigate(`/invoice/view/${created.ID}`);
    }
  };

  if ((mode === 'edit' && isLoadingInvoice) || (copyFromOrderId && isLoadingSourceOrder)) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-3">
        <Spinner className="w-8 h-8 text-teal-600" />
        <p className="text-xs text-slate-500">Loading invoice data...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            to="/invoice"
            className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {mode === 'edit' ? `Edit AR Invoice #${existingInvoice?.InvoiceCode || id}` : 'New Accounts Receivable Invoice'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Issue commercial tax invoice to customer and record receivables
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {mode === 'add' && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Copy className="w-3.5 h-3.5 text-teal-600" /> Copy From Order:
              </span>
              <select
                onChange={(e) => handleCopyFromOrderSelect(Number(e.target.value))}
                value={orderId || ''}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300"
              >
                <option value="">-- Select Sales Order --</option>
                {(openOrders || []).map(o => (
                  <option key={o.ID} value={o.ID}>
                    {o.OrderCode || `SO/${o.ID}`} - {o.CustName} (${o.DocTotal})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/invoice')}
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
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Invoice'}
          </Button>
        </div>
      </div>

      {/* Header Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Information Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600" /> Customer & Billing Information
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Select Customer *
            </label>
            <select
              value={custCode}
              onChange={(e) => handleCustomerSelect(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              required
            >
              <option value="">-- Choose Customer --</option>
              {customersList.map(c => (
                <option key={c.Code} value={c.Code}>
                  {c.Name} ({c.Code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Customer Name</label>
            <input
              type="text"
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              placeholder="Customer Name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Invoice Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              placeholder="Billing address..."
            />
          </div>
        </div>

        {/* Dates & Payment Details Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" /> Invoice & Payment Dates
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Invoice Date *</label>
              <input
                type="date"
                value={postDate}
                onChange={(e) => setPostDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Payment Due *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Vehicle / Truck No.</label>
              <input
                type="text"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                placeholder="e.g. TR-9021"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Transporter</label>
              <input
                type="text"
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value)}
                placeholder="Carrier name"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Customer PO Ref</label>
              <input
                type="text"
                value={custRefNo}
                onChange={(e) => setCustRefNo(e.target.value)}
                placeholder="e.g. CUST-PO-2026-88"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Cash Sales</label>
              <select
                value={cashSales}
                onChange={(e) => setCashSales(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              >
                <option value="N">No (Credit Term)</option>
                <option value="Y">Yes (Cash / POS)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Financial Summary Preview */}
        <div className="bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent p-6 rounded-2xl border border-teal-500/20 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Calculator className="w-4 h-4 text-teal-600" /> Invoice Calculations
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal (items):</span>
                <span className="font-medium">${subtotalBeforeDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>VAT / Tax Total:</span>
                <span className="font-medium">${totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 items-center">
                <span>Overall Discount (%):</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discPrcnt}
                  onChange={(e) => setDiscPrcnt(Number(e.target.value) || 0)}
                  className="w-16 px-2 py-1 text-right text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-teal-500/20 mt-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Amount Due</div>
            <div className="text-3xl font-black text-teal-600 dark:text-teal-400 mt-1">
              ${grandTotal.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Items Table Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Invoice Line Items</h2>
            <p className="text-xs text-slate-500 mt-0.5">Billed merchandise and tax breakdown</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={addRow}
            className="border-teal-500/30 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Item Row
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-2.5 px-3 w-10">#</th>
                <th className="py-2.5 px-3 min-w-[240px]">Item Description *</th>
                <th className="py-2.5 px-3 w-36">Warehouse</th>
                <th className="py-2.5 px-3 w-24">Qty *</th>
                <th className="py-2.5 px-3 w-20">UoM</th>
                <th className="py-2.5 px-3 w-28">Unit Price ($) *</th>
                <th className="py-2.5 px-3 w-20">Disc %</th>
                <th className="py-2.5 px-3 w-20">Tax %</th>
                <th className="py-2.5 px-3 w-28 text-right">Line Total</th>
                <th className="py-2.5 px-3 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="py-2 px-3 font-medium text-slate-400">{idx + 1}</td>

                  {/* Item Picker */}
                  <td className="py-2 px-3">
                    <select
                      value={row.ItemID}
                      onChange={(e) => handleItemSelect(idx, Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                      required
                    >
                      <option value={0}>-- Select Product / Item --</option>
                      {productsList.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} {item.code ? `(${item.code})` : ''} — Stock: {item.onHand || 0}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Warehouse Picker */}
                  <td className="py-2 px-3">
                    <select
                      value={row.WhsCode}
                      onChange={(e) => handleRowChange(idx, 'WhsCode', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                    >
                      {warehousesList.map((wh: any) => (
                        <option key={wh.ID} value={String(wh.ID)}>
                          {wh.Name || wh.Code}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Quantity */}
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={row.Quantity}
                      onChange={(e) => handleRowChange(idx, 'Quantity', Number(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-right font-medium"
                      required
                    />
                  </td>

                  {/* UoM */}
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={row.UoM}
                      onChange={(e) => handleRowChange(idx, 'UoM', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-center"
                    />
                  </td>

                  {/* Unit Price */}
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={row.UnitPrice}
                      onChange={(e) => handleRowChange(idx, 'UnitPrice', Number(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-right font-medium"
                      required
                    />
                  </td>

                  {/* Disc % */}
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={row.DiscPrcnt}
                      onChange={(e) => handleRowChange(idx, 'DiscPrcnt', Number(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-right"
                    />
                  </td>

                  {/* Tax % */}
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={row.VATPer}
                      onChange={(e) => handleRowChange(idx, 'VATPer', Number(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-right"
                    />
                  </td>

                  {/* Line Total */}
                  <td className="py-2 px-3 text-right font-semibold text-slate-900 dark:text-white">
                    ${calculateRowTotal(row).toFixed(2)}
                  </td>

                  {/* Delete Row */}
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      disabled={rows.length === 1}
                      className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
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
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm p-6">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
          Invoice Terms & Notes
        </label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={3}
          placeholder="Payment instructions, bank wire info, payment terms..."
          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
        />
      </div>
    </form>
  );
};

export default ARInvoiceFormPage;
