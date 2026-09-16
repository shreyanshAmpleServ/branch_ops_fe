import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  UploadCloud,
  Package,
  Paperclip,
  Building2,
  Search,
  Sliders,
  DollarSign,
  FileText
} from 'lucide-react';
import {
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  usePurchaseOrder,
  type PurchaseOrderItem,
  type PurchaseOrderInput
} from './api/usePurchaseOrders';
import api, { getFileName } from '../../../lib/api';
import { useRetailers } from '../../customers/api/useRetailers';
import { usePurchaseRequests } from '../purchase-requests/api/usePurchaseRequests';
import { usePurchaseQuotations } from '../purchase-quotations/api/usePurchaseQuotations';
import { useItems } from '../../items/api/useItems';
import { useProjects, useWarehouses, useCostCentersMain, useBranches } from '../../users/api/useMasterData';
import { Button, Spinner, SearchableSelect, type SearchableSelectOption } from '../../../components/ui';

interface PurchaseOrderFormPageProps {
  mode: 'add' | 'edit' | 'view';
}

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label
    className="text-[10px] font-bold uppercase tracking-widest mb-1 block text-slate-500 dark:text-slate-400"
  >
    {children}
  </label>
);

const SectionCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div
    className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden ${className}`}
  >
    {children}
  </div>
);

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; right?: React.ReactNode }> = ({ icon, title, right }) => (
  <div
    className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80"
  >
    <div className="flex items-center gap-2.5">
      <span className="text-teal-600">{icon}</span>
      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">
        {title}
      </span>
    </div>
    {right && <div>{right}</div>}
  </div>
);

export const PurchaseOrderFormPage: React.FC<PurchaseOrderFormPageProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numericId = id ? parseInt(id, 10) : null;

  // Item Selection Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [activeRowIndexForModal, setActiveRowIndexForModal] = useState<number | null>(null);
  const [itemSearch, setItemSearch] = useState('');

  const { data: suppliersResponse = [] } = useRetailers({ cardType: 'S', aprStatus: 'Y' });
  const { data: itemsResponse } = useItems({ limit: 500, search: itemSearch || undefined });
  const { data: projectsResponse } = useProjects();
  const { data: warehousesResponse } = useWarehouses();
  const { data: costCentersResponse } = useCostCentersMain();
  const { data: branchesResponse } = useBranches();

  const suppliersList = Array.isArray(suppliersResponse) ? suppliersResponse : (suppliersResponse as any)?.data || [];
  const itemsList = itemsResponse?.items || (Array.isArray(itemsResponse) ? itemsResponse : (itemsResponse as any)?.data) || [];
  const projectsList = Array.isArray(projectsResponse) ? projectsResponse : (projectsResponse as any)?.data || [];
  const warehousesList = Array.isArray(warehousesResponse) ? warehousesResponse : (warehousesResponse as any)?.data || [];
  const costCentersList = Array.isArray(costCentersResponse) ? costCentersResponse : (costCentersResponse as any)?.data || [];
  const branchesList = Array.isArray(branchesResponse) ? branchesResponse : (branchesResponse as any)?.data || [];

  const supplierOptions: SearchableSelectOption[] = React.useMemo(() => {
    return suppliersList.map((supp: any) => {
      const code = supp.Code || supp.code || supp.cardCode || supp.CardCode;
      const name = supp.Name || supp.name || supp.cardName || supp.CardName || 'Unnamed Vendor';
      const tin = supp.TIN || supp.tin;
      const address = supp.Address || supp.address;
      return {
        value: code,
        label: `${name} (${code})`,
        subtext: [tin ? `TIN: ${tin}` : '', address].filter(Boolean).join(' • '),
        raw: supp,
      };
    });
  }, [suppliersList]);

  const itemCatalogOptions: SearchableSelectOption[] = React.useMemo(() => {
    return itemsList.map((itm: any) => {
      const code = itm.itemCode || itm.ItemCode || itm.code || `ITM-${itm.id || itm.ID}`;
      const name = itm.itemName || itm.ItemName || itm.name || 'Unnamed Item';
      const price = Number(itm.lastPurPrc || itm.price || itm.UnitPrice || 0);
      return {
        value: code,
        label: `${code} — ${name}`,
        subtext: `Price: ${price.toLocaleString(undefined, { minimumFractionDigits: 2 })} TZS`,
        extra: `${price.toLocaleString(undefined, { minimumFractionDigits: 2 })} TZS`,
        raw: itm,
      };
    });
  }, [itemsList]);

  const productsList = React.useMemo(() => {
    return costCentersList.filter((cc: any) => cc.dimCode === 1);
  }, [costCentersList]);

  const locationsList = React.useMemo(() => {
    return costCentersList.filter((cc: any) => cc.dimCode === 3);
  }, [costCentersList]);

  const assetsList = React.useMemo(() => {
    return costCentersList.filter((cc: any) => cc.dimCode === 4);
  }, [costCentersList]);

  const { data: existingOrder, isLoading: isLoadingExisting } = usePurchaseOrder(numericId);

  const createMutation = useCreatePurchaseOrder();
  const updateMutation = useUpdatePurchaseOrder();

  // Header State according to schema keys
  const [custCode, setCustCode] = useState('');
  const [custName, setCustName] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [requestedNo, setRequestedNo] = useState('');
  const [relationFrom, setRelationFrom] = useState('');
  const [postDate, setPostDate] = useState(new Date().toISOString().split('T')[0]);
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptDate, setReceiptDate] = useState('');
  const [currency, setCurrency] = useState('TZS');
  // Vendor Selection Modal State
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [activeRowVendorIndexForModal, setActiveRowVendorIndexForModal] = useState<number | null>(null);
  const [vendorSearch, setVendorSearch] = useState('');

  const handleSelectVendorFromModal = (supp: any) => {
    const code = supp.Code || supp.code || supp.cardCode || supp.CardCode;
    const name = supp.Name || supp.name || supp.cardName || supp.CardName || '';

    if (activeRowVendorIndexForModal !== null && activeRowVendorIndexForModal >= 0 && activeRowVendorIndexForModal < items.length) {
      handleUpdateItemRow(activeRowVendorIndexForModal, 'vendor', code);
    } else {
      setCustCode(code);
      setCustName(name);
    }

    setIsVendorModalOpen(false);
    setActiveRowVendorIndexForModal(null);
  };
  const [branchId, setBranchId] = useState<number | ''>('');
  const [requestType, setRequestType] = useState('Direct');
  const [typeRequest, setTypeRequest] = useState('Item');
  const [typePayment, setTypePayment] = useState('Cash');
  const [department, setDepartment] = useState('');
  const [expenseType, setExpenseType] = useState('');
  const [remarks, setRemarks] = useState('');
  const [discPrcnt, setDiscPrcnt] = useState<number>(0);
  const [freight, setFreight] = useState<number>(0);
  const [purchaseRequestId, setPurchaseRequestId] = useState<number | ''>('');
  const [prId, setPrId] = useState<string>('');
  const [purchaseQuotationId, setPurchaseQuotationId] = useState<number | ''>('');
  const [pqId, setPqId] = useState<string>('');
  const { data: rawRequests } = usePurchaseRequests({});
  const { data: rawQuotations } = usePurchaseQuotations({});
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [attachments, setAttachments] = useState<{ id?: number; LineNum: number; Attachment: string }[]>([]);

  // Populate Existing Data
  useEffect(() => {
    if (existingOrder && (mode === 'edit' || mode === 'view')) {
      setCustCode(existingOrder.CustCode || '');
      setCustName(existingOrder.CustName || '');
      setOrderCode(existingOrder.OrderCode || '');
      setRequestedNo(existingOrder.RequestedNo || '');
      setRelationFrom((existingOrder as any).relation_from || '');
      setPostDate(existingOrder.PostDate ? new Date(existingOrder.PostDate).toISOString().split('T')[0] : '');
      setPoDate(existingOrder.PODate ? new Date(existingOrder.PODate).toISOString().split('T')[0] : '');
      setReceiptDate(existingOrder.ReceiptDate ? new Date(existingOrder.ReceiptDate).toISOString().split('T')[0] : '');
      setCurrency(existingOrder.Currency || 'TZS');
      setBranchId(existingOrder.Branch_id || '');
      setRequestType(existingOrder.RequestType || 'Direct');
      setTypeRequest(existingOrder.TypeRequest || 'Item');
      setTypePayment(existingOrder.TypePayment || 'Cash');
      setDepartment(existingOrder.Department || '');
      setExpenseType(existingOrder.ExpenseType || existingOrder.Expense_type || '');
      setRemarks(existingOrder.Remarks || '');
      setDiscPrcnt(Number(existingOrder.DiscPrcnt || 0));
      setFreight(Number(existingOrder.Freight || 0));
      setPurchaseRequestId((existingOrder as any).PurchaseRequestId || '');
      setPrId(existingOrder.Pr_ID ? String(existingOrder.Pr_ID) : '');
      setPurchaseQuotationId((existingOrder as any).PurchaseQuotationId || '');
      setPqId((existingOrder as any).Pq_ID ? String((existingOrder as any).Pq_ID) : '');

      if (existingOrder.items && existingOrder.items.length > 0) {
        setItems(existingOrder.items.map((it: any, idx: number) => {
          const qty = Number(it.Quantity || 1);
          const price = Number(it.UnitPrice || 0);
          const disc = Number(it.DiscPrcnt || 0);
          const vatPer = Number(it.VATPer !== undefined ? it.VATPer : 18);
          const lineTotalBefDisc = qty * price;
          const lineTotalAfterDisc = lineTotalBefDisc * (1 - disc / 100);
          const lineTax = it.LineTax !== undefined ? Number(it.LineTax) : lineTotalAfterDisc * (vatPer / 100);
          const lineTotalLC = it.LineTotalLC !== undefined ? Number(it.LineTotalLC) : lineTotalAfterDisc + lineTax;

          return {
            LineNum: it.LineNum || idx + 1,
            ItemID: Number(it.ItemID || 0),
            ItemCode: it.ItemCode || '',
            ItemName: it.ItemName || '',
            Quantity: qty,
            UnitPrice: price,
            DiscPrcnt: disc,
            VATCode: it.VATCode || 'VAT_18',
            VATPer: vatPer,
            LineTax: lineTax,
            LineTotalLC: lineTotalLC,
            WhsCode: it.WhsCode ? Number(it.WhsCode) : undefined,
            cost_center: it.cost_center ? Number(it.cost_center) : undefined,
            project: it.project || '',
            Remarks: it.Remarks || '',
            UoM: it.UoM || 'pcs',
            vendor: it.vendor || '',
          };
        }));
      }
      if (existingOrder.attachments && existingOrder.attachments.length > 0) {
        setAttachments(existingOrder.attachments);
      }
    }
  }, [existingOrder, mode]);

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setCustCode(code);
    const supp = suppliersList.find((s: any) => s.cardCode === code || s.CardCode === code);
    if (supp) {
      setCustName(supp.cardName || supp.CardName || supp.name || '');
    } else {
      setCustName('');
    }
  };

  const handleAddItem = (selectedItem: any) => {
    const itemCode = selectedItem.itemCode || selectedItem.ItemCode || selectedItem.code || `ITM-${selectedItem.id || selectedItem.ID}`;
    const itemName = selectedItem.itemName || selectedItem.ItemName || selectedItem.name || 'Unnamed Item';
    const unitPrice = Number(selectedItem.lastPurPrc || selectedItem.price || selectedItem.UnitPrice || 0);
    const itemId = Number(selectedItem.id || selectedItem.ID || 0);
    const uom = selectedItem.uom || selectedItem.UoM || 'pcs';

    if (activeRowIndexForModal !== null && activeRowIndexForModal >= 0 && activeRowIndexForModal < items.length) {
      const updated = [...items];
      const item = { ...updated[activeRowIndexForModal] };
      item.ItemID = itemId;
      item.ItemCode = itemCode;
      item.ItemName = itemName;
      item.UnitPrice = unitPrice;
      item.UoM = uom;

      const qty = Number(item.Quantity || 1);
      const disc = Number(item.DiscPrcnt || 0);
      const vatPer = Number(item.VATPer || 18);

      const lineTotalBefDisc = qty * unitPrice;
      const lineTotalAfterDisc = lineTotalBefDisc * (1 - disc / 100);
      const lineTax = lineTotalAfterDisc * (vatPer / 100);

      item.LineTax = lineTax;
      item.LineTotalLC = lineTotalAfterDisc + lineTax;

      updated[activeRowIndexForModal] = item;
      setItems(updated);
    } else {
      const newItem: PurchaseOrderItem = {
        LineNum: items.length + 1,
        ItemID: itemId,
        ItemCode: itemCode,
        ItemName: itemName,
        Quantity: 1,
        UnitPrice: unitPrice,
        DiscPrcnt: 0,
        VATPer: 18,
        LineTax: unitPrice * 0.18,
        LineTotalLC: unitPrice * 1.18,
        UoM: uom,
      };
      setItems([...items, newItem]);
    }

    setIsItemModalOpen(false);
    setActiveRowIndexForModal(null);
  };

  const handleAddItemLine = () => {
    const newItem: PurchaseOrderItem = {
      LineNum: items.length + 1,
      ItemID: 0,
      ItemCode: '',
      ItemName: '',
      Quantity: 1,
      UnitPrice: 0,
      DiscPrcnt: 0,
      VATPer: 18,
      LineTax: 0,
      LineTotalLC: 0,
      UoM: 'pcs',
    };
    setItems([...items, newItem]);
  };

  const handleItemSelectInRow = (index: number, itemId: number) => {
    const selectedItem = itemsList.find((i: any) => Number(i.id || i.ID) === Number(itemId));
    if (!selectedItem) {
      const updated = [...items];
      updated[index] = {
        ...updated[index],
        ItemID: 0,
        ItemCode: '',
        ItemName: '',
      };
      setItems(updated);
      return;
    }

    const itemCode = selectedItem.itemCode || selectedItem.ItemCode || selectedItem.code || `ITM-${selectedItem.id || selectedItem.ID}`;
    const itemName = selectedItem.itemName || selectedItem.ItemName || selectedItem.name || 'Unnamed Item';
    const unitPrice = Number(selectedItem.lastPurPrc || selectedItem.price || selectedItem.UnitPrice || 0);

    const updated = [...items];
    const item = { ...updated[index] };
    item.ItemID = Number(selectedItem.id || selectedItem.ID || itemId);
    item.ItemCode = itemCode;
    item.ItemName = itemName;
    item.UnitPrice = unitPrice;
    item.UoM = selectedItem.uom || selectedItem.UoM || 'pcs';

    const qty = Number(item.Quantity || 1);
    const disc = Number(item.DiscPrcnt || 0);
    const vatPer = Number(item.VATPer || 18);

    const lineTotalBefDisc = qty * unitPrice;
    const lineTotalAfterDisc = lineTotalBefDisc * (1 - disc / 100);
    const lineTax = lineTotalAfterDisc * (vatPer / 100);

    item.LineTax = lineTax;
    item.LineTotalLC = lineTotalAfterDisc + lineTax;

    updated[index] = item;
    setItems(updated);
  };

  const handleUpdateItemRow = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    const qty = Number(field === 'Quantity' ? value : item.Quantity || 0);
    const price = Number(field === 'UnitPrice' ? value : item.UnitPrice || 0);
    const disc = Number(field === 'DiscPrcnt' ? value : item.DiscPrcnt || 0);
    const vatPer = Number(field === 'VATPer' ? value : item.VATPer || 0);

    const lineTotalBefDisc = qty * price;
    const lineTotalAfterDisc = lineTotalBefDisc * (1 - disc / 100);
    const lineTax = lineTotalAfterDisc * (vatPer / 100);
    const lineTotalLC = lineTotalAfterDisc + lineTax;

    item.LineTax = lineTax;
    item.LineTotalLC = lineTotalLC;

    updated[index] = item;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, idx) => idx !== index).map((item, idx) => ({
      ...item,
      LineNum: idx + 1,
    }));
    setItems(updated);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const { data } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const fileUrl = data.url || data.path || data.file;
        if (fileUrl) {
          setAttachments(prev => [
            ...prev,
            { LineNum: prev.length + 1, Attachment: fileUrl },
          ]);
        }
      } catch (err) {
        console.error('Failed to upload file', err);
      }
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== index).map((att, idx) => ({
      ...att,
      LineNum: idx + 1,
    })));
  };

  // Computations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.Quantity || 0) * Number(item.UnitPrice || 0)), 0);
  const totalTax = items.reduce((sum, item) => sum + Number(item.LineTax || 0), 0);
  const discountAmount = subtotal * (discPrcnt / 100);
  const grandTotal = (subtotal - discountAmount) + totalTax + Number(freight || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!custCode) {
      alert('Please select a Supplier/Vendor');
      return;
    }

    if (items.length === 0) {
      alert('Please add at least one item line to the order');
      return;
    }

    const payload: PurchaseOrderInput = {
      CustCode: custCode,
      CustName: custName,
      OrderCode: orderCode || undefined,
      RequestedNo: requestedNo || undefined,
      relation_from: relationFrom || undefined,
      PostDate: postDate || undefined,
      PODate: poDate || undefined,
      ReceiptDate: receiptDate || undefined,
      Currency: currency,
      Branch_id: branchId ? Number(branchId) : undefined,
      RequestType: requestType,
      TypeRequest: typeRequest,
      TypePayment: typePayment,
      Department: department || undefined,
      ExpenseType: expenseType || undefined,
      Expense_type: expenseType || undefined,
      Remarks: remarks || undefined,
      Pr_ID: prId || undefined,
      Pq_ID: pqId || undefined,
      PurchaseRequestId: purchaseRequestId ? Number(purchaseRequestId) : undefined,
      PurchaseQuotationId: purchaseQuotationId ? Number(purchaseQuotationId) : undefined,
      DiscPrcnt: Number(discPrcnt),
      Freight: Number(freight),
      items: items.map((item, idx) => ({
        LineNum: idx + 1,
        ItemID: item.ItemID,
        ItemCode: item.ItemCode,
        ItemName: item.ItemName,
        Quantity: Number(item.Quantity),
        UnitPrice: Number(item.UnitPrice),
        DiscPrcnt: Number(item.DiscPrcnt || 0),
        VATCode: item.VATCode,
        VATPer: Number(item.VATPer || 0),
        WhsCode: item.WhsCode ? Number(item.WhsCode) : undefined,
        cost_center: item.cost_center ? Number(item.cost_center) : undefined,
        project: item.project,
        Remarks: item.Remarks,
        UoM: item.UoM,
        vendor: item.vendor,
      })),
      attachments: attachments.map((att, idx) => ({
        LineNum: idx + 1,
        Attachment: att.Attachment,
      })),
    };

    try {
      if (mode === 'edit' && numericId) {
        await updateMutation.mutateAsync({ id: numericId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate('/procurement/order');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving purchase order');
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isLoadingExisting && mode !== 'add') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Spinner className="w-8 h-8 text-teal-600" />
        <p className="text-xs text-slate-500">Loading purchase order data...</p>
      </div>
    );
  }

  const filteredItemsForModal = itemsList.filter((itm: any) => {
    const code = (itm.itemCode || itm.ItemCode || itm.code || '').toLowerCase();
    const name = (itm.itemName || itm.ItemName || itm.name || '').toLowerCase();
    const q = itemSearch.toLowerCase();
    return code.includes(q) || name.includes(q);
  });

  const filteredSuppliersForModal = suppliersList.filter((supp: any) => {
    const code = (supp.Code || supp.code || supp.cardCode || supp.CardCode || '').toLowerCase();
    const name = (supp.Name || supp.name || supp.cardName || supp.CardName || '').toLowerCase();
    const address = (supp.Address || supp.address || '').toLowerCase();
    const tin = (supp.TIN || supp.tin || '').toLowerCase();
    const q = vendorSearch.toLowerCase();
    return code.includes(q) || name.includes(q) || address.includes(q) || tin.includes(q);
  });

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/procurement/order')}
            className="hover:scale-95 transition-all text-xs font-bold rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {mode === 'add' ? 'Create New Purchase Order' : mode === 'edit' ? `Edit Purchase Order #${numericId}` : `Purchase Order #${numericId}`}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Fill in header information and item lines for the supplier purchase order
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Information Card */}
        <SectionCard>
          <SectionHeader icon={<Building2 className="w-4 h-4" />} title="Header & Vendor Information" />
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Vendor Dropdown */}
            <SearchableSelect
              label="Supplier / Vendor *"
              value={custCode}
              onChange={(val, opt) => {
                const code = String(val || '');
                const supp = opt?.raw || suppliersList.find((s: any) => (s.Code || s.code || s.cardCode || s.CardCode) === code);
                if (supp) {
                  setCustCode(code);
                  setCustName(supp.Name || supp.name || supp.cardName || supp.CardName || '');
                } else {
                  setCustCode(code);
                  setCustName('');
                }
              }}
              options={supplierOptions}
              placeholder="Search & select vendor..."
              disabled={mode === 'view'}
            />

            {/* Order Code */}
            <div>
              <FieldLabel>Order Code</FieldLabel>
              <input
                type="text"
                placeholder="Auto-generated if blank (e.g. PO26/144)"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Ref No / PR No */}
            <div>
              <FieldLabel>Ref / Base PR No</FieldLabel>
              <input
                type="text"
                placeholder="e.g. PR26/106"
                value={requestedNo}
                onChange={(e) => setRequestedNo(e.target.value)}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Relation From */}
            <div>
              <FieldLabel>Relation From</FieldLabel>
              <input
                type="text"
                placeholder="e.g. RFQ 2026-0020 or Based on PQ 80"
                value={relationFrom}
                onChange={(e) => setRelationFrom(e.target.value)}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Posting Date */}
            <div>
              <FieldLabel>Linked Purchase Request</FieldLabel>
              <select
                value={purchaseRequestId}
                onChange={(e) => {
                  const reqId = e.target.value ? Number(e.target.value) : '';
                  setPurchaseRequestId(reqId);
                  const matchedReq = (rawRequests || []).find((r: any) => r.ID === reqId);
                  if (matchedReq) {
                    setPrId(matchedReq.RequestedNo || matchedReq.OrderCode || String(matchedReq.ID));
                    if (matchedReq.items && matchedReq.items.length > 0 && items.length === 0) {
                      setItems(matchedReq.items.map((it: any, idx: number) => ({
                        LineNum: idx + 1,
                        ItemID: it.ItemID,
                        ItemCode: it.ItemCode || '',
                        ItemName: it.ItemName || '',
                        LineStatus: 'O',
                        Quantity: Number(it.Quantity || 1),
                        UnitPrice: Number(it.UnitPrice || 0),
                        DiscPrcnt: Number(it.DiscPrcnt || 0),
                        VATCode: it.VATCode || 'VAT_18',
                        VATPer: Number(it.VATPer || 18),
                        LineTax: Number(it.LineTax || 0),
                        LineTotalLC: Number(it.LineTotalLC || 0),
                        Remarks: it.Remarks || '',
                        UoM: it.UoM || 'pcs',
                      })));
                    }
                  } else {
                    setPrId('');
                  }
                }}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              >
                <option value="">None (Direct Order)</option>
                {(rawRequests || []).map((req: any) => (
                  <option key={req.ID} value={req.ID}>
                    {req.RequestedNo || req.OrderCode || `PR #${req.ID}`} - {req.CustName || 'Request'}
                  </option>
                ))}
              </select>
            </div>

            {/* Linked Purchase Quotation */}
            <div>
              <FieldLabel>Linked Purchase Quotation</FieldLabel>
              <select
                value={purchaseQuotationId}
                onChange={(e) => {
                  const qId = e.target.value ? Number(e.target.value) : '';
                  setPurchaseQuotationId(qId);
                  const matchedQ = (rawQuotations || []).find((q: any) => q.ID === qId);
                  if (matchedQ) {
                    setPqId(matchedQ.QuotCode || matchedQ.RequestedNo || String(matchedQ.ID));
                    if (matchedQ.items && matchedQ.items.length > 0) {
                      setItems(matchedQ.items.map((it: any, idx: number) => ({
                        LineNum: idx + 1,
                        ItemID: it.ItemID,
                        ItemCode: it.ItemCode || '',
                        ItemName: it.ItemName || '',
                        LineStatus: 'O',
                        Quantity: Number(it.Quantity || 1),
                        UnitPrice: Number(it.UnitPrice || 0),
                        DiscPrcnt: Number(it.DiscPrcnt || 0),
                        VATCode: it.VATCode || 'VAT_18',
                        VATPer: Number(it.VATPer || 18),
                        LineTax: Number(it.LineTax || 0),
                        LineTotalLC: Number(it.LineTotalLC || 0),
                        Remarks: it.Remarks || '',
                        UoM: it.UoM || 'pcs',
                      })));
                    }
                  } else {
                    setPqId('');
                  }
                }}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              >
                <option value="">None (Direct Order)</option>
                {(rawQuotations || []).map((q: any) => (
                  <option key={q.ID} value={q.ID}>
                    {q.QuotCode || q.RequestedNo || `PQ #${q.ID}`} - {q.CustName || 'Quotation'}
                  </option>
                ))}
              </select>
            </div>

            {/* Posting Date */}
            <div>
              <FieldLabel>Posting Date</FieldLabel>
              <input
                type="date"
                value={postDate}
                onChange={(e) => setPostDate(e.target.value)}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* PO Date */}
            <div>
              <FieldLabel>PO Date</FieldLabel>
              <input
                type="date"
                value={poDate}
                onChange={(e) => setPoDate(e.target.value)}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Expected Receipt Date */}
            <div>
              <FieldLabel>Expected Receipt Date</FieldLabel>
              <input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Currency */}
            <div>
              <FieldLabel>Currency</FieldLabel>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              >
                <option value="TZS">TZS - Tanzanian Shilling</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>

            {/* Branch */}
            <div>
              <FieldLabel>Branch</FieldLabel>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : '')}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              >
                <option value="">Select Branch...</option>
                {branchesList.map((b: any) => (
                  <option key={b.id || b.ID} value={b.id || b.ID}>
                    {b.name || b.Name || `Branch #${b.id || b.ID}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Request Type */}
            <div>
              <FieldLabel>Request Type</FieldLabel>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              >
                <option value="Direct">Direct</option>
                <option value="Base Document">Base Document</option>
              </select>
            </div>

            {/* Type Request */}
            <div>
              <FieldLabel>Type Request</FieldLabel>
              <select
                value={typeRequest}
                onChange={(e) => setTypeRequest(e.target.value)}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              >
                <option value="Item">Item</option>
                <option value="Service">Service</option>
              </select>
            </div>

            {/* Payment Type */}
            <div>
              <FieldLabel>Payment Type</FieldLabel>
              <select
                value={typePayment}
                onChange={(e) => setTypePayment(e.target.value)}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              >
                <option value="Cash">Cash</option>
                <option value="Credit">Credit</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            {/* Department */}
            <div>
              <FieldLabel>Department</FieldLabel>
              <input
                type="text"
                placeholder="e.g. Logistics / Operations"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Expense Type */}
            <div>
              <FieldLabel>Expense Type</FieldLabel>
              <input
                type="text"
                placeholder="e.g. Operational Expense"
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value)}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </SectionCard>

        {/* Item Lines Section */}
        <SectionCard>
          <SectionHeader
            icon={<Package className="h-3.5 w-3.5" />}
            title="Material Procurement Items"
            right={
              mode !== 'view' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddItemLine}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-95 active:scale-90 shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Item Line
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsItemModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 transition-all"
                  >
                    <Search className="h-3.5 w-3.5" /> Catalog Search
                  </button>
                </div>
              )
            }
          />
          <div className="p-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 border-2 border-dashed rounded-2xl gap-3" style={{ borderColor: 'var(--color-border)' }}>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>No items added</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    Click <strong>Add Item Line</strong> or <strong>Catalog Search</strong> to start adding procurement lines
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <table className="w-full text-left text-xs border-collapse min-w-[1600px]">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3.5 px-3 text-center w-10">#</th>
                      <th className="py-3.5 px-4 min-w-[280px]">Item Code & Name</th>
                      <th className="py-3.5 px-2 min-w-[100px] w-24 text-center">Qty</th>
                      <th className="py-3.5 px-2 min-w-[90px] w-20 text-center">UoM</th>
                      <th className="py-3.5 px-2 min-w-[130px] w-32 text-right">Unit Price</th>
                      <th className="py-3.5 px-2 min-w-[100px] w-24 text-right">Disc %</th>
                      <th className="py-3.5 px-2 min-w-[110px] w-28 text-center">VAT %</th>
                      <th className="py-3.5 px-3 min-w-[130px] text-right">Line Tax</th>
                      <th className="py-3.5 px-4 min-w-[140px] text-right">Line Total ({currency})</th>
                      <th className="py-3.5 px-3 min-w-[180px]">Warehouse</th>
                      <th className="py-3.5 px-3 min-w-[180px]">Cost Center</th>
                      <th className="py-3.5 px-3 min-w-[180px]">Project</th>
                      <th className="py-3.5 px-3 min-w-[180px]">Product (DIM1)</th>
                      <th className="py-3.5 px-3 min-w-[180px]">Location (DIM3)</th>
                      <th className="py-3.5 px-3 min-w-[180px]">Asset (DIM4)</th>
                      {mode !== 'view' && <th className="py-3.5 px-3 w-12 text-center">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800/40">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                        <td className="py-3 px-4 min-w-[300px]">
                          <SearchableSelect
                            value={item.ItemCode || (item.ItemID ? String(item.ItemID) : '')}
                            onChange={(val, opt) => {
                              if (!val) {
                                handleItemSelectInRow(idx, 0);
                                return;
                              }
                              const rawItem = opt?.raw;
                              if (rawItem) {
                                const itemCode = rawItem.itemCode || rawItem.ItemCode || rawItem.code || `ITM-${rawItem.id || rawItem.ID}`;
                                const itemName = rawItem.itemName || rawItem.ItemName || rawItem.name || 'Unnamed Item';
                                const unitPrice = Number(rawItem.lastPurPrc || rawItem.price || rawItem.UnitPrice || 0);

                                const updated = [...items];
                                const updatedRow = { ...updated[idx] };
                                updatedRow.ItemID = Number(rawItem.id || rawItem.ID || 0);
                                updatedRow.ItemCode = itemCode;
                                updatedRow.ItemName = itemName;
                                updatedRow.UnitPrice = unitPrice;
                                updatedRow.UoM = rawItem.uom || rawItem.UoM || 'pcs';

                                const qty = Number(updatedRow.Quantity || 1);
                                const disc = Number(updatedRow.DiscPrcnt || 0);
                                const vatPer = Number(updatedRow.VATPer !== undefined ? updatedRow.VATPer : 18);

                                const lineTotalBefDisc = qty * unitPrice;
                                const lineTotalAfterDisc = lineTotalBefDisc * (1 - disc / 100);
                                const lineTax = lineTotalAfterDisc * (vatPer / 100);
                                const lineTotalLC = lineTotalAfterDisc + lineTax;

                                updatedRow.LineTax = lineTax;
                                updatedRow.LineTotalLC = lineTotalLC;

                                updated[idx] = updatedRow;
                                setItems(updated);
                              } else {
                                handleItemSelectInRow(idx, Number(val) || 0);
                              }
                            }}
                            options={itemCatalogOptions}
                            placeholder="Search item code or name..."
                            disabled={mode === 'view'}
                            size="sm"
                          />
                        </td>
                        <td className="py-3 px-2 min-w-[100px]">
                          <input
                            type="number"
                            min="1"
                            value={item.Quantity}
                            onChange={(e) => handleUpdateItemRow(idx, 'Quantity', Number(e.target.value))}
                            disabled={mode === 'view'}
                            className="w-full text-center py-2 px-2.5 text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>
                        <td className="py-3 px-2 min-w-[90px]">
                          <input
                            type="text"
                            value={item.UoM || 'pcs'}
                            onChange={(e) => handleUpdateItemRow(idx, 'UoM', e.target.value)}
                            disabled={mode === 'view'}
                            className="w-full text-center py-2 px-2 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                          />
                        </td>
                        <td className="py-3 px-2 min-w-[130px]">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.UnitPrice}
                            onChange={(e) => handleUpdateItemRow(idx, 'UnitPrice', Number(e.target.value))}
                            disabled={mode === 'view'}
                            className="w-full text-right py-2 px-2.5 text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>
                        <td className="py-3 px-2 min-w-[100px]">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.DiscPrcnt || 0}
                            onChange={(e) => handleUpdateItemRow(idx, 'DiscPrcnt', Number(e.target.value))}
                            disabled={mode === 'view'}
                            className="w-full text-right py-2 px-2.5 text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>
                        <td className="py-3 px-2 min-w-[110px]">
                          <select
                            value={item.VATPer !== undefined ? item.VATPer : 18}
                            onChange={(e) => handleUpdateItemRow(idx, 'VATPer', Number(e.target.value))}
                            disabled={mode === 'view'}
                            className="w-full text-center py-2 px-2 text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm cursor-pointer"
                          >
                            <option value={18} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">18%</option>
                            <option value={9} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">9%</option>
                            <option value={0} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">0%</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 min-w-[130px] text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          {Number(item.LineTax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 min-w-[140px] text-right font-extrabold text-teal-600 dark:text-teal-400 font-mono">
                          {Number(item.LineTotalLC || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        {/* Warehouse Dropdown */}
                        <td className="py-3 px-3 min-w-[180px]">
                          <select
                            value={item.WhsCode || ''}
                            onChange={(e) => handleUpdateItemRow(idx, 'WhsCode', e.target.value ? Number(e.target.value) : null)}
                            disabled={mode === 'view'}
                            className="w-full py-2 px-3 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm cursor-pointer"
                          >
                            <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Select Warehouse...</option>
                            {warehousesList.map((wh: any) => (
                              <option key={wh.id || wh.WhsCode} value={wh.id || wh.WhsCode} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                                {wh.name || wh.WhsName || `Whs #${wh.id || wh.WhsCode}`}
                              </option>
                            ))}
                          </select>
                        </td>
                        {/* Cost Center Select */}
                        <td className="py-3 px-3 min-w-[180px]">
                          <select
                            value={item.cost_center || ''}
                            onChange={(e) => handleUpdateItemRow(idx, 'cost_center', e.target.value ? Number(e.target.value) : null)}
                            disabled={mode === 'view'}
                            className="w-full py-2 px-3 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm cursor-pointer"
                          >
                            <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Select Cost Center...</option>
                            {costCentersList.map((cc: any) => (
                              <option key={cc.id || cc.ID || cc.code} value={cc.id || cc.ID || cc.code} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                                {cc.name || cc.PrcName || cc.code}
                              </option>
                            ))}
                          </select>
                        </td>
                        {/* Project Select */}
                        <td className="py-3 px-3 min-w-[180px]">
                          <select
                            value={item.project || ''}
                            onChange={(e) => handleUpdateItemRow(idx, 'project', e.target.value)}
                            disabled={mode === 'view'}
                            className="w-full py-2 px-3 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm cursor-pointer"
                          >
                            <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Select Project...</option>
                            {projectsList.map((prj: any) => (
                              <option key={prj.id || prj.Code || prj.code} value={prj.code || prj.Code || prj.name} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                                {prj.name || prj.Name || prj.code || prj.Code}
                              </option>
                            ))}
                          </select>
                        </td>
                        {/* Product Select (DIM1) */}
                        <td className="py-3 px-3 min-w-[180px]">
                          <select
                            value={item.DIM1 || ''}
                            onChange={(e) => handleUpdateItemRow(idx, 'DIM1', e.target.value)}
                            disabled={mode === 'view'}
                            className="w-full py-2 px-3 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm cursor-pointer"
                          >
                            <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Select Product...</option>
                            {productsList.map((p: any) => (
                              <option key={p.code || p.id} value={p.code || p.name} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                                {p.code ? `${p.code} — ` : ''}{p.name || p.PrcName}
                              </option>
                            ))}
                          </select>
                        </td>
                        {/* Location Select (DIM3) */}
                        <td className="py-3 px-3 min-w-[180px]">
                          <select
                            value={item.DIM3 || ''}
                            onChange={(e) => handleUpdateItemRow(idx, 'DIM3', e.target.value)}
                            disabled={mode === 'view'}
                            className="w-full py-2 px-3 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm cursor-pointer"
                          >
                            <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Select Location...</option>
                            {locationsList.map((l: any) => (
                              <option key={l.code || l.id} value={l.code || l.name} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                                {l.code ? `${l.code} — ` : ''}{l.name || l.PrcName}
                              </option>
                            ))}
                          </select>
                        </td>
                        {/* Asset Select (DIM4) */}
                        <td className="py-3 px-3 min-w-[180px]">
                          <select
                            value={item.DIM4 || ''}
                            onChange={(e) => handleUpdateItemRow(idx, 'DIM4', e.target.value)}
                            disabled={mode === 'view'}
                            className="w-full py-2 px-3 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm cursor-pointer"
                          >
                            <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Select Asset...</option>
                            {assetsList.map((a: any) => (
                              <option key={a.code || a.id} value={a.code || a.name} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                                {a.code ? `${a.code} — ` : ''}{a.name || a.PrcName}
                              </option>
                            ))}
                          </select>
                        </td>
                        {mode !== 'view' && (
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Delete Row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4">
              <div className="w-full sm:w-1/2 space-y-3">
                <FieldLabel>Remarks / Instructions</FieldLabel>
                <textarea
                  rows={3}
                  placeholder="Additional order comments..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={mode === 'view'}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="w-full sm:w-80 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                  <span>Header Discount (%):</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discPrcnt}
                    onChange={(e) => setDiscPrcnt(Number(e.target.value))}
                    disabled={mode === 'view'}
                    className="w-20 text-right px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                  <span>Freight Charges:</span>
                  <input
                    type="number"
                    min="0"
                    value={freight}
                    onChange={(e) => setFreight(Number(e.target.value))}
                    disabled={mode === 'view'}
                    className="w-24 text-right px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Tax Amount:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
                  <span>Grand Total:</span>
                  <span className="text-teal-600 dark:text-teal-400 font-black">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</span>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Attachments Section */}
        <SectionCard>
          <SectionHeader icon={<Paperclip className="w-4 h-4" />} title="Attachments" />
          <div className="p-6 space-y-4">
            {mode !== 'view' && (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 rounded-2xl cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 transition-colors">
                <UploadCloud className="w-8 h-8 text-teal-600 mb-2" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Click to upload files</span>
                <span className="text-[10px] text-slate-400 mt-1">PDF, Images, Excel up to 10MB</span>
                <input type="file" multiple onChange={handleFileUpload} className="hidden" />
              </label>
            )}

            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-xs"
                  >
                    <span className="truncate max-w-[80%] text-slate-700 dark:text-slate-300 font-medium">
                      {getFileName(att.Attachment)}
                    </span>
                    {mode !== 'view' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

        {/* Submit Actions Footer */}
        {mode !== 'view' && (
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/procurement/order')}
              className="text-xs font-semibold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2 px-6 rounded-xl shadow-md"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Spinner className="w-4 h-4 text-white" />
                  <span>Saving...</span>
                </div>
              ) : mode === 'add' ? (
                'Create Purchase Order'
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        )}
      </form>

      {/* Select Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Select Item from Catalog</h3>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search item code or name..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 dark:divide-slate-700">
              {filteredItemsForModal.length > 0 ? (
                filteredItemsForModal.map((itm: any) => {
                  const code = itm.itemCode || itm.ItemCode || itm.code || `ITM-${itm.id || itm.ID}`;
                  const name = itm.itemName || itm.ItemName || itm.name || 'Unnamed Item';
                  const price = Number(itm.lastPurPrc || itm.price || itm.UnitPrice || 0);

                  return (
                    <div
                      key={itm.id || itm.ID}
                      onClick={() => handleAddItem(itm)}
                      className="py-3 px-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{name}</div>
                        <div className="text-[10px] text-slate-400">{code}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-teal-600">{price.toLocaleString(undefined, { minimumFractionDigits: 2 })} TZS</div>
                        <span className="text-[10px] text-slate-400 uppercase">Click to select</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">No matching items found</div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Select Vendor / Supplier Modal */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Select Supplier / Vendor</h3>
              <button
                type="button"
                onClick={() => {
                  setIsVendorModalOpen(false);
                  setActiveRowVendorIndexForModal(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search supplier code, name, TIN, address..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 dark:divide-slate-700">
              {filteredSuppliersForModal.length > 0 ? (
                filteredSuppliersForModal.map((supp: any) => {
                  const code = supp.Code || supp.code || supp.cardCode || supp.CardCode;
                  const name = supp.Name || supp.name || supp.cardName || supp.CardName || 'Unnamed Vendor';
                  const address = supp.Address || supp.address || '';
                  const tin = supp.TIN || supp.tin || '';

                  return (
                    <div
                      key={supp.id || supp.ID || code}
                      onClick={() => handleSelectVendorFromModal(supp)}
                      className="py-3 px-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{name}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Code: {code}</span>
                          {tin && <span>• TIN: {tin}</span>}
                          {address && <span>• {address}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-1 rounded-lg uppercase">Select</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">No matching suppliers found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
