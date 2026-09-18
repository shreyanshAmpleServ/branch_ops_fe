import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  UploadCloud,
  Package,
  Paperclip,
  Building2,
  Search,
  DollarSign,
  FileText,
  Copy,
  CheckSquare,
  Square,
  AlertCircle,
  MessageSquare,
  Plus
} from 'lucide-react';
import {
  useCreateGoodsReceipt,
  useUpdateGoodsReceipt,
  useGoodsReceipt,
  type GoodsReceiptItem,
  type GoodsReceiptInput
} from './api/useGoodsReceipts';
import { usePurchaseOrders, type PurchaseOrder } from '../purchase-orders/api/usePurchaseOrders';
import api from '../../../lib/api';
import { useRetailers } from '../../customers/api/useRetailers';
import { useProjects, useWarehouses, useCostCentersMain, useBranches } from '../../users/api/useMasterData';
import { Button, Spinner, SearchableSelect, type SearchableSelectOption } from '../../../components/ui';

interface GoodsReceiptFormPageProps {
  mode: 'add' | 'edit' | 'view';
}

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block text-slate-500 dark:text-slate-400">
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

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; right?: React.ReactNode }> = ({
  icon,
  title,
  right
}) => (
  <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
    <div className="flex items-center gap-2.5">
      <span className="text-teal-600">{icon}</span>
      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">
        {title}
      </span>
    </div>
    {right && <div>{right}</div>}
  </div>
);

export const GoodsReceiptFormPage: React.FC<GoodsReceiptFormPageProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numericId = id ? parseInt(id, 10) : null;

  // Master Data hooks
  const { data: suppliersResponse = [] } = useRetailers({ cardType: 'S', aprStatus: 'Y' });
  const { data: projectsResponse } = useProjects();
  const { data: warehousesResponse } = useWarehouses();
  const { data: costCentersResponse } = useCostCentersMain();
  const { data: branchesResponse } = useBranches();

  // PO list for Copy From PO functionality
  const { data: rawPurchaseOrders } = usePurchaseOrders({});

  const suppliersList = Array.isArray(suppliersResponse) ? suppliersResponse : (suppliersResponse as any)?.data || [];
  const projectsList = Array.isArray(projectsResponse) ? projectsResponse : (projectsResponse as any)?.data || [];
  const warehousesList = Array.isArray(warehousesResponse) ? warehousesResponse : (warehousesResponse as any)?.data || [];
  const costCentersList = Array.isArray(costCentersResponse) ? costCentersResponse : (costCentersResponse as any)?.data || [];
  const branchesList = Array.isArray(branchesResponse) ? branchesResponse : (branchesResponse as any)?.data || [];

  const purchaseOrdersList: PurchaseOrder[] = useMemo(() => {
    return Array.isArray(rawPurchaseOrders) ? rawPurchaseOrders : (rawPurchaseOrders as any)?.data || [];
  }, [rawPurchaseOrders]);

  // Modals state
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  const [isCopyPoModalOpen, setIsCopyPoModalOpen] = useState(false);
  const [poSearch, setPoSearch] = useState('');
  const [selectedPoForCopy, setSelectedPoForCopy] = useState<any | null>(null);
  const [selectedPoItemIds, setSelectedPoItemIds] = useState<number[]>([]);

  // Existing GRPO for edit/view
  const { data: existingGRPO, isLoading: isLoadingExisting } = useGoodsReceipt(numericId);
  const createMutation = useCreateGoodsReceipt();
  const updateMutation = useUpdateGoodsReceipt();

  // Form State
  const [custCode, setCustCode] = useState('');
  const [custName, setCustName] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [requestedNo, setRequestedNo] = useState('');
  const [purchaseOrder, setPurchaseOrder] = useState('');
  const [purchaseOrderId, setPurchaseOrderId] = useState<number | ''>('');
  const [relationFrom, setRelationFrom] = useState('');
  const [postDate, setPostDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [poDate, setPoDate] = useState('');
  const [currency, setCurrency] = useState('TZS');
  const [branchId, setBranchId] = useState<number | ''>('');
  const [requestType, setRequestType] = useState('Direct');
  const [typeRequest, setTypeRequest] = useState('Item');
  const [typePayment, setTypePayment] = useState('Cash');
  const [department, setDepartment] = useState('');
  const [expenseType, setExpenseType] = useState('');
  const [remarks, setRemarks] = useState('');
  const [discPrcnt, setDiscPrcnt] = useState<number>(0);
  const [freight, setFreight] = useState<number>(0);
  const [roundingAmnt, setRoundingAmnt] = useState<number>(0);

  const [items, setItems] = useState<GoodsReceiptItem[]>([]);
  const [attachments, setAttachments] = useState<{ id?: number; LineNum: number; Attachment: string }[]>([]);

  const supplierOptions: SearchableSelectOption[] = useMemo(() => {
    return suppliersList.map((supp: any) => {
      const code = supp.Code || supp.code || supp.cardCode || supp.CardCode;
      const name = supp.Name || supp.name || supp.cardName || supp.CardName || 'Unnamed Vendor';
      const tin = supp.TIN || supp.tin;
      const address = supp.Address || supp.address;
      return {
        value: code,
        label: `${name} (${code})`,
        subtext: [tin ? `TIN: ${tin}` : '', address].filter(Boolean).join(' • '),
        raw: supp
      };
    });
  }, [suppliersList]);

  // Populate data in edit/view mode
  useEffect(() => {
    if (existingGRPO && (mode === 'edit' || mode === 'view')) {
      setCustCode(existingGRPO.CustCode || '');
      setCustName(existingGRPO.CustName || '');
      setOrderCode(existingGRPO.OrderCode || '');
      setRequestedNo(existingGRPO.RequestedNo || '');
      setPurchaseOrder(existingGRPO.purchaseOrder || '');
      setPurchaseOrderId(existingGRPO.PurchaseOrderId || '');
      setRelationFrom(existingGRPO.relation_from || '');
      setPostDate(existingGRPO.PostDate ? new Date(existingGRPO.PostDate).toISOString().split('T')[0] : '');
      setDeliveryDate(existingGRPO.DeliveryDate ? new Date(existingGRPO.DeliveryDate).toISOString().split('T')[0] : '');
      setPoDate(existingGRPO.PODate ? new Date(existingGRPO.PODate).toISOString().split('T')[0] : '');
      setCurrency(existingGRPO.Currency || 'TZS');
      setBranchId(existingGRPO.Branch_id || '');
      setRequestType(existingGRPO.RequestType || 'Direct');
      setTypeRequest(existingGRPO.TypeRequest || 'Item');
      setTypePayment(existingGRPO.TypePayment || 'Cash');
      setDepartment(existingGRPO.Department || '');
      setExpenseType(existingGRPO.ExpenseType || '');
      setRemarks(existingGRPO.Remarks || '');
      setDiscPrcnt(Number(existingGRPO.DiscPrcnt || 0));
      setFreight(Number(existingGRPO.Freight || 0));
      setRoundingAmnt(Number(existingGRPO.RoundingAmnt || 0));

      if (existingGRPO.items && existingGRPO.items.length > 0) {
        setItems(
          existingGRPO.items.map((it: any, idx: number) => {
            const qty = Number(it.Quantity || 1);
            const delQty = Number(it.DeliveredQty !== undefined && it.DeliveredQty !== null ? it.DeliveredQty : qty);
            const price = Number(it.UnitPrice || 0);
            const disc = Number(it.DiscPrcnt || 0);
            const vatPer = Number(it.VATPer !== undefined ? it.VATPer : 18);
            const lineTotalBefDisc = delQty * price;
            const lineTotalAfterDisc = lineTotalBefDisc * (1 - disc / 100);
            const lineTax = it.LineTax !== undefined ? Number(it.LineTax) : lineTotalAfterDisc * (vatPer / 100);
            const lineTotalLC = it.LineTotalLC !== undefined ? Number(it.LineTotalLC) : lineTotalAfterDisc + lineTax;

            return {
              LineNum: it.LineNum || idx + 1,
              ItemID: Number(it.ItemID || 0),
              ItemCode: it.ItemCode || '',
              ItemName: it.ItemName || '',
              Quantity: qty,
              DeliveredQty: delQty,
              UnitPrice: price,
              DiscPrcnt: disc,
              VATCode: it.VATCode || 'VAT_18',
              VATPer: vatPer,
              LineTax: lineTax,
              LineTotalLC: lineTotalLC,
              WhsCode: it.WhsCode ? Number(it.WhsCode) : undefined,
              cost_center: it.cost_center ? Number(it.cost_center) : undefined,
              project: it.project || '',
              DIM1: it.DIM1 || '',
              DIM2: it.DIM2 || '',
              DIM3: it.DIM3 || '',
              DIM4: it.DIM4 || '',
              DIM5: it.DIM5 || '',
              Remarks: it.Remarks || '',
              UoM: it.UoM || 'pcs',
              vendor: it.vendor || '',
              Location: it.Location || '',
              SourceDocId: it.SourceDocId || undefined,
              SourceLineNum: it.SourceLineNum || undefined,
              SourceDocType: it.SourceDocType || undefined
            };
          })
        );
      }

      if (existingGRPO.attachments && existingGRPO.attachments.length > 0) {
        setAttachments(existingGRPO.attachments);
      }
    }
  }, [existingGRPO, mode]);

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => {
      const q = Number(it.DeliveredQty !== undefined ? it.DeliveredQty : it.Quantity || 0);
      const p = Number(it.UnitPrice || 0);
      return sum + q * p;
    }, 0);
  }, [items]);

  const totalDiscount = useMemo(() => {
    return subtotal * (Number(discPrcnt || 0) / 100);
  }, [subtotal, discPrcnt]);

  const totalTax = useMemo(() => {
    return items.reduce((sum, it) => sum + Number(it.LineTax || 0), 0);
  }, [items]);

  const grandTotal = useMemo(() => {
    return subtotal - totalDiscount + totalTax + Number(freight || 0) + Number(roundingAmnt || 0);
  }, [subtotal, totalDiscount, totalTax, freight, roundingAmnt]);

  // Row operations
  const handleUpdateItemRow = (index: number, field: keyof GoodsReceiptItem, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      const qty = Number(item.Quantity || 0);
      const delQty = Number(field === 'DeliveredQty' ? value : item.DeliveredQty !== undefined ? item.DeliveredQty : qty);
      const price = Number(field === 'UnitPrice' ? value : item.UnitPrice || 0);
      const disc = Number(field === 'DiscPrcnt' ? value : item.DiscPrcnt || 0);
      const vatPer = Number(field === 'VATPer' ? value : item.VATPer || 0);

      const lineTotalBefDisc = delQty * price;
      const lineTotalAfterDisc = lineTotalBefDisc * (1 - disc / 100);
      const lineTax = lineTotalAfterDisc * (vatPer / 100);
      const lineTotalLC = lineTotalAfterDisc + lineTax;

      item.DeliveredQty = delQty;
      item.LineTax = lineTax;
      item.LineTotalLC = lineTotalLC;

      updated[index] = item;
      return updated;
    });
  };

  const handleSelectVendorFromModal = (supp: any) => {
    const code = supp.Code || supp.code || supp.cardCode || supp.CardCode || '';
    const name = supp.Name || supp.name || supp.cardName || supp.CardName || '';
    setCustCode(code);
    setCustName(name);
    setIsVendorModalOpen(false);
  };

  // COPY FROM PURCHASE ORDER HANDLER
  const handleOpenCopyPoModal = () => {
    setSelectedPoForCopy(null);
    setSelectedPoItemIds([]);
    setIsCopyPoModalOpen(true);
  };

  const handleSelectPo = async (po: any) => {
    let fullPo = po;
    if (!po.items || po.items.length === 0) {
      try {
        const res = await api.get(`/purchase-order/${po.ID || po.id}`);
        if (res.data?.data) {
          fullPo = res.data.data;
        }
      } catch (e) {
        console.error('Failed to fetch full PO details:', e);
      }
    }
    setSelectedPoForCopy(fullPo);
    const itemIds = (fullPo.items || []).map((_: any, idx: number) => idx);
    setSelectedPoItemIds(itemIds);
  };

  const handleTogglePoItem = (idx: number) => {
    setSelectedPoItemIds(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleApplyPoCopy = (replaceExisting: boolean = true) => {
    if (!selectedPoForCopy) return;

    // Set header fields from PO
    setCustCode(selectedPoForCopy.CustCode || '');
    setCustName(selectedPoForCopy.CustName || '');
    setPurchaseOrder(selectedPoForCopy.OrderCode || selectedPoForCopy.RequestedNo || String(selectedPoForCopy.ID));
    setPurchaseOrderId(Number(selectedPoForCopy.ID));
    setRelationFrom('PO');
    if (selectedPoForCopy.Currency) setCurrency(selectedPoForCopy.Currency);
    if (selectedPoForCopy.Branch_id) setBranchId(Number(selectedPoForCopy.Branch_id));
    if (selectedPoForCopy.Department) setDepartment(selectedPoForCopy.Department);
    if (selectedPoForCopy.ExpenseType) setExpenseType(selectedPoForCopy.ExpenseType);
    if (selectedPoForCopy.TypeRequest) setTypeRequest(selectedPoForCopy.TypeRequest);
    if (selectedPoForCopy.PODate) setPoDate(new Date(selectedPoForCopy.PODate).toISOString().split('T')[0]);

    const sourceItems = (selectedPoForCopy.items || []).filter((_: any, idx: number) =>
      selectedPoItemIds.includes(idx)
    );

    const convertedItems: GoodsReceiptItem[] = sourceItems.map((it: any, idx: number) => {
      const qty = Number(it.Quantity || 1);
      const price = Number(it.UnitPrice || 0);
      const disc = Number(it.DiscPrcnt || 0);
      const vatPer = Number(it.VATPer !== undefined ? it.VATPer : 18);
      const lineTotalBefDisc = qty * price;
      const lineTotalAfterDisc = lineTotalBefDisc * (1 - disc / 100);
      const lineTax = it.LineTax !== undefined ? Number(it.LineTax) : lineTotalAfterDisc * (vatPer / 100);
      const lineTotalLC = it.LineTotalLC !== undefined ? Number(it.LineTotalLC) : lineTotalAfterDisc + lineTax;

      return {
        LineNum: idx + 1,
        ItemID: Number(it.ItemID || 0),
        ItemCode: it.ItemCode || '',
        ItemName: it.ItemName || '',
        Quantity: qty,
        DeliveredQty: qty,
        UnitPrice: price,
        DiscPrcnt: disc,
        VATCode: it.VATCode || 'VAT_18',
        VATPer: vatPer,
        LineTax: lineTax,
        LineTotalLC: lineTotalLC,
        WhsCode: it.WhsCode ? Number(it.WhsCode) : undefined,
        cost_center: it.cost_center ? Number(it.cost_center) : undefined,
        project: it.project || '',
        DIM1: it.DIM1 || '',
        DIM2: it.DIM2 || '',
        DIM3: it.DIM3 || '',
        DIM4: it.DIM4 || '',
        DIM5: it.DIM5 || '',
        Remarks: it.Remarks || '',
        UoM: it.UoM || 'pcs',
        vendor: it.vendor || selectedPoForCopy.CustCode || '',
        SourceDocId: String(selectedPoForCopy.ID),
        SourceLineNum: it.LineNum || idx + 1,
        SourceDocType: 'PO'
      };
    });

    if (replaceExisting) {
      setItems(convertedItems);
    } else {
      setItems(prev => [
        ...prev,
        ...convertedItems.map((it, idx) => ({ ...it, LineNum: prev.length + idx + 1 }))
      ]);
    }

    setIsCopyPoModalOpen(false);
  };

  const handleAddServiceLine = () => {
    const newItem: GoodsReceiptItem = {
      LineNum: items.length + 1,
      ItemID: 0,
      ItemCode: 'SERVICE',
      ItemName: '',
      Quantity: 1,
      DeliveredQty: 1,
      UnitPrice: 0,
      DiscPrcnt: 0,
      VATCode: 'VAT_18',
      VATPer: 18,
      LineTax: 0,
      LineTotalLC: 0,
      Remarks: '',
      UoM: 'svc',
      vendor: custCode || '',
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev =>
      prev.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, LineNum: idx + 1 }))
    );
  };

  // Attachments handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const { data } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const fileUrl = data.url || data.path || data.file;
        if (fileUrl) {
          setAttachments(prev => [
            ...prev,
            { LineNum: prev.length + 1, Attachment: fileUrl }
          ]);
        }
      } catch (err) {
        console.error('Failed to upload attachment', err);
      }
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev =>
      prev.filter((_, idx) => idx !== index).map((att, idx) => ({ ...att, LineNum: idx + 1 }))
    );
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!custCode) {
      alert('Please select a Supplier/Vendor');
      return;
    }

    if (items.length === 0) {
      alert(typeRequest === 'Service' ? 'Please add at least one service line' : 'Please copy or add items to the goods receipt');
      return;
    }

    if (typeRequest === 'Service') {
      if (items.some(item => !item.ItemName && !item.Remarks)) {
        alert('Please enter a service description for all service lines');
        return;
      }
    } else {
      if (items.some(item => !item.ItemID)) {
        alert('Please select a valid item for all lines');
        return;
      }
    }

    const payload: GoodsReceiptInput = {
      CustCode: custCode,
      CustName: custName || null,
      OrderCode: orderCode || undefined,
      RequestedNo: requestedNo || undefined,
      purchaseOrder: purchaseOrder || undefined,
      PurchaseOrderId: purchaseOrderId ? Number(purchaseOrderId) : undefined,
      relation_from: relationFrom || undefined,
      PostDate: postDate || undefined,
      DeliveryDate: deliveryDate || undefined,
      PODate: poDate || undefined,
      Currency: currency,
      Branch_id: branchId ? Number(branchId) : undefined,
      RequestType: requestType,
      TypeRequest: typeRequest,
      TypePayment: typePayment,
      Department: department || undefined,
      ExpenseType: expenseType || undefined,
      Remarks: remarks || undefined,
      DiscPrcnt: Number(discPrcnt || 0),
      Freight: Number(freight || 0),
      RoundingAmnt: Number(roundingAmnt || 0),
      items: items.map((item, idx) => ({
        LineNum: idx + 1,
        ItemID: Number(item.ItemID || 0),
        ItemCode: item.ItemCode || (typeRequest === 'Service' ? 'SERVICE' : undefined),
        ItemName: item.ItemName || item.Remarks || undefined,
        Quantity: Number(item.Quantity || 1),
        DeliveredQty: Number(item.DeliveredQty !== undefined ? item.DeliveredQty : item.Quantity || 1),
        UnitPrice: Number(item.UnitPrice || 0),
        DiscPrcnt: Number(item.DiscPrcnt || 0),
        VATCode: item.VATCode || 'VAT_18',
        VATPer: Number(item.VATPer || 0),
        WhsCode: item.WhsCode ? Number(item.WhsCode) : undefined,
        cost_center: item.cost_center ? Number(item.cost_center) : undefined,
        project: item.project || undefined,
        DIM1: item.DIM1 || undefined,
        DIM2: item.DIM2 || undefined,
        DIM3: item.DIM3 || undefined,
        DIM4: item.DIM4 || undefined,
        DIM5: item.DIM5 || undefined,
        Remarks: item.Remarks || undefined,
        UoM: item.UoM || (typeRequest === 'Service' ? 'svc' : 'pcs'),
        vendor: item.vendor || undefined,
        Location: item.Location || undefined,
        SourceDocId: item.SourceDocId || undefined,
        SourceLineNum: item.SourceLineNum ? Number(item.SourceLineNum) : undefined,
        SourceDocType: item.SourceDocType || undefined
      })),
      attachments: attachments.map((att, idx) => ({
        LineNum: idx + 1,
        Attachment: att.Attachment
      }))
    };

    try {
      if (mode === 'edit' && numericId) {
        await updateMutation.mutateAsync({ id: numericId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate('/procurement/grpo');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving Goods Receipt Purchase Order');
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isLoadingExisting && mode !== 'add') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Spinner className="w-8 h-8 text-teal-600" />
        <p className="text-xs text-slate-500">Loading goods receipt record...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/procurement/grpo')}
            className="hover:scale-95 transition-all text-xs font-bold rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {mode === 'add'
                ? 'Create Goods Receipt Purchase Order (GRPO)'
                : mode === 'edit'
                ? `Edit Goods Receipt #${numericId}`
                : `Goods Receipt #${numericId}`}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Receive goods against Purchase Orders and record physical inventory intake
            </p>
          </div>
        </div>

        {mode !== 'view' && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenCopyPoModal}
              className="bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 py-2 px-3.5 shadow-xs"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy From PO
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Information Card */}
        <SectionCard>
          <SectionHeader icon={<Building2 className="w-4 h-4" />} title="Header & Vendor Information" />
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Vendor Selector */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <FieldLabel>Vendor / Supplier *</FieldLabel>
                {mode !== 'view' && (
                  <button
                    type="button"
                    onClick={() => setIsVendorModalOpen(true)}
                    className="text-[10px] text-teal-600 hover:text-teal-700 dark:text-teal-400 font-semibold flex items-center gap-1"
                  >
                    <Search className="w-3 h-3" /> Browse Vendors
                  </button>
                )}
              </div>
              <SearchableSelect
                options={supplierOptions}
                value={custCode}
                onChange={val => {
                  setCustCode(val);
                  const supp = suppliersList.find((s: any) => (s.Code || s.code || s.cardCode || s.CardCode) === val);
                  if (supp) {
                    setCustName(supp.Name || supp.name || supp.cardName || supp.CardName || '');
                  }
                }}
                disabled={mode === 'view'}
                placeholder="Search vendor by name, code or TIN..."
                className="w-full text-xs"
              />
            </div>

            {/* Linked Purchase Order Dropdown */}
            <div>
              <FieldLabel>Linked Purchase Order</FieldLabel>
              <select
                value={purchaseOrderId}
                onChange={e => {
                  const pId = e.target.value ? Number(e.target.value) : '';
                  setPurchaseOrderId(pId);
                  const matchedPo = purchaseOrdersList.find((p: any) => p.ID === pId);
                  if (matchedPo) {
                    setPurchaseOrder(matchedPo.OrderCode || matchedPo.RequestedNo || String(matchedPo.ID));
                    setRelationFrom('PO');
                    if (!custCode) {
                      setCustCode(matchedPo.CustCode || '');
                      setCustName(matchedPo.CustName || '');
                    }
                  } else {
                    setPurchaseOrder('');
                    setRelationFrom('');
                  }
                }}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              >
                <option value="">Select Purchase Order</option>
                {purchaseOrdersList.map((po: any) => (
                  <option key={po.ID} value={po.ID}>
                    {po.OrderCode || `PO #${po.ID}`} - {po.CustName || 'Vendor'}
                  </option>
                ))}
              </select>
            </div>

            {/* Posting Date */}
            <div>
              <FieldLabel>Posting Date *</FieldLabel>
              <input
                type="date"
                value={postDate}
                onChange={e => setPostDate(e.target.value)}
                disabled={mode === 'view'}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Delivery / Receipt Date */}
            <div>
              <FieldLabel>Delivery Date</FieldLabel>
              <input
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* PO Reference Date */}
            <div>
              <FieldLabel>PO Reference Date</FieldLabel>
              <input
                type="date"
                value={poDate}
                onChange={e => setPoDate(e.target.value)}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Currency */}
            <div>
              <FieldLabel>Currency</FieldLabel>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              >
                <option value="TZS">TZS - Tanzanian Shilling</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="KES">KES - Kenyan Shilling</option>
              </select>
            </div>

            {/* Branch */}
            <div>
              <FieldLabel>Branch</FieldLabel>
              <select
                value={branchId}
                onChange={e => setBranchId(e.target.value ? Number(e.target.value) : '')}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              >
                <option value="">Select Branch</option>
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
                onChange={e => setRequestType(e.target.value)}
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
                onChange={e => setTypeRequest(e.target.value)}
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
                onChange={e => setTypePayment(e.target.value)}
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
                value={department}
                onChange={e => setDepartment(e.target.value)}
                disabled={mode === 'view'}
                placeholder="e.g. Warehouse, Logistics"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Expense Type */}
            <div>
              <FieldLabel>Expense Type</FieldLabel>
              <input
                type="text"
                value={expenseType}
                onChange={e => setExpenseType(e.target.value)}
                disabled={mode === 'view'}
                placeholder="e.g. Direct Material, Inventory"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </SectionCard>

        {/* Items / Service Lines Section */}
        <SectionCard>
          <SectionHeader
            icon={<Package className="w-4 h-4" />}
            title={typeRequest === 'Service' ? 'GRPO Service Procurement Lines' : 'GRPO Physical Inventory Items'}
            right={
              mode !== 'view' && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleOpenCopyPoModal}
                    className="text-[11px] h-7 px-2.5 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-100 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy From PO
                  </Button>
                  {typeRequest === 'Service' && (
                    <Button
                      type="button"
                      onClick={handleAddServiceLine}
                      className="text-[11px] h-7 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3 h-3" />
                      Add Service Line
                    </Button>
                  )}
                </div>
              )
            }
          />

          <div className="overflow-x-auto">
            {typeRequest === 'Service' ? (
              /* ─── SERVICE PROCUREMENT TABLE ─── */
              <table className="w-full text-left text-xs border-collapse min-w-[1500px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3 min-w-[300px]">Service Description *</th>
                    <th className="p-3 w-36">Amount / Fee (TZS)</th>
                    <th className="p-3 w-36">Tax Code</th>
                    <th className="p-3 w-24">Disc %</th>
                    <th className="p-3 w-32">Tax Amount</th>
                    <th className="p-3 w-36">Total With Tax</th>
                    <th className="p-3 w-40">Project</th>
                    <th className="p-3 w-40">Cost Center</th>
                    <th className="p-3 w-36">Location</th>
                    <th className="p-3 w-36">Asset</th>
                    <th className="p-3 min-w-[180px]">Remarks</th>
                    {mode !== 'view' && <th className="p-3 w-12 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={13}
                        className="p-10 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/30 dark:bg-slate-800/30"
                      >
                        <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                          <AlertCircle className="w-7 h-7 text-indigo-600/70" />
                          <p className="font-semibold text-slate-700 dark:text-slate-300">No service lines added</p>
                          <p className="text-[11px] text-slate-400">
                            Click &quot;Add Service Line&quot; to describe services, fees, or contracts, or click &quot;Copy From PO&quot; to import service lines from a Purchase Order.
                          </p>
                          {mode !== 'view' && (
                            <div className="pt-2 flex items-center gap-2">
                              <Button
                                type="button"
                                onClick={handleAddServiceLine}
                                className="text-xs h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                Add Service Line
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleOpenCopyPoModal}
                                className="text-xs h-8 px-3.5 rounded-xl font-semibold shadow-sm"
                              >
                                <Copy className="w-3.5 h-3.5 mr-1.5" />
                                Copy From PO
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((line, idx) => {
                      const amountBeforeTax = Number(line.UnitPrice || 0) * (1 - Number(line.DiscPrcnt || 0) / 100);
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors duration-150"
                        >
                          {/* # */}
                          <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>

                          {/* SERVICE DESCRIPTION */}
                          <td className="p-2.5 min-w-[300px]">
                            <input
                              type="text"
                              placeholder="Describe service / fee / contract details..."
                              className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                              value={line.ItemName || line.Remarks || ''}
                              onChange={e => handleUpdateItemRow(idx, 'ItemName', e.target.value)}
                              disabled={mode === 'view'}
                            />
                          </td>

                          {/* AMOUNT / FEE */}
                          <td className="p-2.5 w-36">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="0.00"
                              className="w-full px-2.5 py-1.5 text-right text-xs font-bold bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                              value={line.UnitPrice || ''}
                              onChange={e => {
                                const price = Number(e.target.value) || 0;
                                handleUpdateItemRow(idx, 'UnitPrice', price);
                                handleUpdateItemRow(idx, 'Quantity', 1);
                                handleUpdateItemRow(idx, 'DeliveredQty', 1);
                              }}
                              disabled={mode === 'view'}
                            />
                          </td>

                          {/* TAX CODE */}
                          <td className="p-2.5 w-36">
                            <select
                              className="w-full px-2 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                              value={line.VATCode || 'VAT_18'}
                              onChange={e => {
                                const code = e.target.value;
                                const rate = code === 'VAT_18' ? 18 : code === 'VAT_10' ? 10 : 0;
                                handleUpdateItemRow(idx, 'VATCode', code);
                                handleUpdateItemRow(idx, 'VATPer', rate);
                              }}
                              disabled={mode === 'view'}
                            >
                              <option value="VAT_18">Input VAT 18%</option>
                              <option value="VAT_10">Input VAT 10%</option>
                              <option value="VAT_0">Zero Rated 0%</option>
                              <option value="VAT_EXEMPT">Exempt 0%</option>
                            </select>
                          </td>

                          {/* DISCOUNT % */}
                          <td className="p-2.5 w-24">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              className="w-full px-2 py-1.5 text-right text-xs font-bold bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                              value={line.DiscPrcnt || 0}
                              onChange={e => handleUpdateItemRow(idx, 'DiscPrcnt', Math.min(100, Math.max(0, Number(e.target.value))))}
                              disabled={mode === 'view'}
                            />
                          </td>

                          {/* TAX AMOUNT */}
                          <td className="p-2.5 w-32 text-right font-mono text-xs text-slate-600 dark:text-slate-300">
                            {Number(line.LineTax || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* TOTAL WITH TAX */}
                          <td className="p-2.5 w-36 text-right font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                            {Number(line.LineTotalLC || amountBeforeTax).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* PROJECT */}
                          <td className="p-2.5 w-40">
                            <select
                              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                              value={line.project || ''}
                              onChange={e => handleUpdateItemRow(idx, 'project', e.target.value)}
                              disabled={mode === 'view'}
                            >
                              <option value="">Select Project…</option>
                              {projectsList.map((p: any) => (
                                <option key={p.id || p.PrjCode} value={p.PrjCode || p.name || p.id}>
                                  {p.PrjName || p.name || p.PrjCode}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* COST CENTER */}
                          <td className="p-2.5 w-40">
                            <select
                              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                              value={line.cost_center || ''}
                              onChange={e => handleUpdateItemRow(idx, 'cost_center', e.target.value ? Number(e.target.value) : undefined)}
                              disabled={mode === 'view'}
                            >
                              <option value="">Select Cost Center…</option>
                              {costCentersList.map((cc: any) => (
                                <option key={cc.id || cc.PrcCode} value={cc.id || cc.PrcCode}>
                                  {cc.name || cc.PrcName || cc.PrcCode}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* LOCATION */}
                          <td className="p-2.5 w-36">
                            <input
                              type="text"
                              placeholder="Location…"
                              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                              value={line.DIM3 || line.Location || ''}
                              onChange={e => {
                                handleUpdateItemRow(idx, 'DIM3', e.target.value);
                                handleUpdateItemRow(idx, 'Location', e.target.value);
                              }}
                              disabled={mode === 'view'}
                            />
                          </td>

                          {/* ASSET */}
                          <td className="p-2.5 w-36">
                            <input
                              type="text"
                              placeholder="Asset tag / ID…"
                              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                              value={line.DIM4 || ''}
                              onChange={e => handleUpdateItemRow(idx, 'DIM4', e.target.value)}
                              disabled={mode === 'view'}
                            />
                          </td>

                          {/* REMARKS */}
                          <td className="p-2.5 min-w-[180px]">
                            <input
                              type="text"
                              placeholder="Notes…"
                              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                              value={line.Remarks || ''}
                              onChange={e => handleUpdateItemRow(idx, 'Remarks', e.target.value)}
                              disabled={mode === 'view'}
                            />
                          </td>

                          {/* ACTION */}
                          {mode !== 'view' && (
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              /* ─── PHYSICAL INVENTORY ITEMS TABLE ─── */
              <table className="w-full text-left text-xs border-collapse min-w-[1300px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3 min-w-[220px]">Item Code & Description</th>
                    <th className="p-3 w-24">Ordered Qty</th>
                    <th className="p-3 w-28">Received Qty</th>
                    <th className="p-3 w-24">UoM</th>
                    <th className="p-3 w-28">Unit Price</th>
                    <th className="p-3 w-20">Disc %</th>
                    <th className="p-3 w-24">VAT %</th>
                    <th className="p-3 w-28">Tax Total</th>
                    <th className="p-3 w-32">Line Total</th>
                    <th className="p-3 w-36">Warehouse</th>
                    <th className="p-3 w-32">Cost Center</th>
                    <th className="p-3 w-32">Project</th>
                    {mode !== 'view' && <th className="p-3 w-12 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={14}
                        className="p-10 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/30 dark:bg-slate-800/30"
                      >
                        <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                          <AlertCircle className="w-7 h-7 text-teal-600/70" />
                          <p className="font-semibold text-slate-700 dark:text-slate-300">No items in this Goods Receipt</p>
                          <p className="text-[11px] text-slate-400">
                            In GRPO, items must be imported from a Purchase Order. Click &quot;Copy From PO&quot; to import received materials.
                          </p>
                          {mode !== 'view' && (
                            <div className="pt-2">
                              <Button
                                type="button"
                                onClick={handleOpenCopyPoModal}
                                className="text-xs h-8 px-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-sm"
                              >
                                <Copy className="w-3.5 h-3.5 mr-1.5" />
                                Copy From PO
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr
                        key={index}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors duration-150"
                      >
                        {/* # */}
                        <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                          {index + 1}
                        </td>

                        {/* Item Code & Description (Copied from PO) */}
                        <td className="p-2.5">
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {item.ItemName || item.ItemCode || `Item #${item.ItemID}`}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {item.ItemCode || `ID-${item.ItemID}`}
                              </span>
                              {item.SourceDocType && (
                                <span className="text-teal-600 dark:text-teal-400 font-semibold">
                                  {item.SourceDocType} #{item.SourceDocId} (Line {item.SourceLineNum})
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Ordered Qty */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.Quantity || 0}
                            onChange={e => handleUpdateItemRow(index, 'Quantity', parseFloat(e.target.value) || 0)}
                            disabled={mode === 'view'}
                            className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-right focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </td>

                        {/* Delivered / Received Qty */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.DeliveredQty !== undefined ? item.DeliveredQty : item.Quantity || 0}
                            onChange={e => handleUpdateItemRow(index, 'DeliveredQty', parseFloat(e.target.value) || 0)}
                            disabled={mode === 'view'}
                            className="w-full px-2 py-1 text-xs font-bold bg-teal-50/50 dark:bg-teal-900/20 border border-teal-300 dark:border-teal-700 rounded-lg text-teal-900 dark:text-teal-200 text-right focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </td>

                        {/* UoM */}
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.UoM || 'pcs'}
                            onChange={e => handleUpdateItemRow(index, 'UoM', e.target.value)}
                            disabled={mode === 'view'}
                            className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </td>

                        {/* Unit Price */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.UnitPrice || 0}
                            onChange={e => handleUpdateItemRow(index, 'UnitPrice', parseFloat(e.target.value) || 0)}
                            disabled={mode === 'view'}
                            className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-right focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </td>

                        {/* Discount % */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={item.DiscPrcnt || 0}
                            onChange={e => handleUpdateItemRow(index, 'DiscPrcnt', parseFloat(e.target.value) || 0)}
                            disabled={mode === 'view'}
                            className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-right focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </td>

                        {/* VAT % */}
                        <td className="p-2.5">
                          <select
                            value={item.VATPer !== undefined ? item.VATPer : 18}
                            onChange={e => handleUpdateItemRow(index, 'VATPer', parseFloat(e.target.value) || 0)}
                            disabled={mode === 'view'}
                            className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          >
                            <option value="18">18% (Standard)</option>
                            <option value="0">0% (Exempt)</option>
                          </select>
                        </td>

                        {/* Tax Total */}
                        <td className="p-2.5 text-right font-mono text-xs text-slate-600 dark:text-slate-300">
                          {Number(item.LineTax || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Line Total */}
                        <td className="p-2.5 text-right font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {Number(item.LineTotalLC || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Warehouse */}
                        <td className="p-2.5">
                          <select
                            value={item.WhsCode || ''}
                            onChange={e => handleUpdateItemRow(index, 'WhsCode', e.target.value ? Number(e.target.value) : undefined)}
                            disabled={mode === 'view'}
                            className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          >
                            <option value="">Select Warehouse</option>
                            {warehousesList.map((wh: any) => (
                              <option key={wh.id || wh.WhsCode} value={wh.id || wh.WhsCode}>
                                {wh.name || wh.WhsName || wh.WhsCode}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Cost Center */}
                        <td className="p-2.5">
                          <select
                            value={item.cost_center || ''}
                            onChange={e => handleUpdateItemRow(index, 'cost_center', e.target.value ? Number(e.target.value) : undefined)}
                            disabled={mode === 'view'}
                            className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          >
                            <option value="">Cost Center</option>
                            {costCentersList.map((cc: any) => (
                              <option key={cc.id || cc.PrcCode} value={cc.id || cc.PrcCode}>
                                {cc.name || cc.PrcName || cc.PrcCode}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Project */}
                        <td className="p-2.5">
                          <select
                            value={item.project || ''}
                            onChange={e => handleUpdateItemRow(index, 'project', e.target.value)}
                            disabled={mode === 'view'}
                            className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          >
                            <option value="">Select Project</option>
                            {projectsList.map((p: any) => (
                              <option key={p.id || p.PrjCode} value={p.PrjCode || p.name || p.id}>
                                {p.PrjName || p.name || p.PrjCode}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Remove Row Action */}
                        {mode !== 'view' && (
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-1 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </SectionCard>

        {/* Financial Summary, Remarks, and Attachments Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Bottom-Left Column: Remarks (Above) and Attachments (Below) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Remarks / Receiving Notes Card (Placed Above Attachments) */}
            <SectionCard>
              <SectionHeader icon={<MessageSquare className="w-4 h-4" />} title="Remarks & Receiving Notes" />
              <div className="p-5">
                <FieldLabel>Remarks / Instructions / Comments</FieldLabel>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  disabled={mode === 'view'}
                  placeholder="Enter any notes about goods condition, delivery discrepancies, or warehouse instructions..."
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200 resize-y"
                />
              </div>
            </SectionCard>

            {/* Attachments Section */}
            <SectionCard>
              <SectionHeader icon={<Paperclip className="w-4 h-4" />} title="Supporting Attachments" />
              <div className="p-5 space-y-4">
                {mode !== 'view' && (
                  <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/30">
                    <UploadCloud className="w-8 h-8 text-teal-600 mb-2" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Upload Delivery Notes, Invoices or Inspection Slips
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, PDF up to 10MB</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx"
                    />
                  </label>
                )}

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <FieldLabel>Attached Files ({attachments.length})</FieldLabel>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {attachments.map((att, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                            <a
                              href={att.Attachment}
                              target="_blank"
                              rel="noreferrer"
                              className="truncate font-medium text-slate-700 dark:text-slate-300 hover:text-teal-600 underline"
                            >
                              {att.Attachment.split('/').pop() || `Attachment ${idx + 1}`}
                            </a>
                          </div>
                          {mode !== 'view' && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(idx)}
                              className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          {/* Bottom-Right Column: Financial Summary Calculation Panel */}
          <div className="lg:col-span-6">
            <SectionCard>
              <SectionHeader icon={<DollarSign className="w-4 h-4" />} title="Financial Summary" />
              <div className="p-5 space-y-3.5 text-xs">
                {/* Subtotal */}
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
                  <span>Subtotal Before Discount</span>
                  <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                    {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>

                {/* Discount % */}
                <div className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Document Discount %</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={discPrcnt}
                      onChange={e => setDiscPrcnt(parseFloat(e.target.value) || 0)}
                      disabled={mode === 'view'}
                      className="w-16 px-2 py-1 text-right text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <span className="font-mono text-rose-600 dark:text-rose-400 font-semibold">
                    - {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>

                {/* Freight */}
                <div className="flex justify-between items-center gap-4">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Freight / Transport Charges</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={freight}
                      onChange={e => setFreight(parseFloat(e.target.value) || 0)}
                      disabled={mode === 'view'}
                      className="w-28 px-2 py-1 text-right text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{currency}</span>
                  </div>
                </div>

                {/* Tax Total */}
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
                  <span>VAT / Tax Total</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>

                {/* Rounding Adjustment */}
                <div className="flex justify-between items-center gap-4">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Rounding Adjustment</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      value={roundingAmnt}
                      onChange={e => setRoundingAmnt(parseFloat(e.target.value) || 0)}
                      disabled={mode === 'view'}
                      className="w-24 px-2 py-1 text-right text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{currency}</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-3.5 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Total Document Amount
                    </span>
                    <p className="text-[10px] text-slate-400">Includes all line items, tax, and freight</p>
                  </div>
                  <span className="text-xl font-black font-mono text-teal-600 dark:text-teal-400">
                    {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/procurement/grpo')}
            className="rounded-xl px-5 text-xs font-semibold"
          >
            Cancel
          </Button>

          {mode !== 'view' && (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl px-6 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-lg shadow-teal-600/20"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Spinner className="w-4 h-4" /> Saving...
                </div>
              ) : mode === 'edit' ? (
                'Update Goods Receipt'
              ) : (
                'Create Goods Receipt'
              )}
            </Button>
          )}
        </div>
      </form>

      {/* MODAL: COPY FROM PURCHASE ORDER */}
      {isCopyPoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2.5">
                <Copy className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Copy From Purchase Order (PO)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select a Purchase Order to import items, vendor details, and prices
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCopyPoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Purchase Order by Order Code, Vendor Name or Code..."
                  value={poSearch}
                  onChange={e => setPoSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Purchase Orders List & Details split view */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* PO List */}
                <div className="md:col-span-5 max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700/60">
                  {purchaseOrdersList
                    .filter(po => {
                      const isService = typeRequest === 'Service';
                      const poType = (po.TypeRequest || (po as any).RequestType || '').toLowerCase();
                      const isMatch = isService ? poType === 'service' : poType !== 'service';
                      if (!isMatch) return false;

                      const q = poSearch.toLowerCase();
                      const code = (po.OrderCode || `PO #${po.ID}`).toLowerCase();
                      const vendor = (po.CustName || po.CustCode || '').toLowerCase();
                      return code.includes(q) || vendor.includes(q);
                    })
                    .map(po => {
                      const isSelected = selectedPoForCopy?.ID === po.ID;
                      return (
                        <div
                          key={po.ID}
                          onClick={() => handleSelectPo(po)}
                          className={`p-3 cursor-pointer transition-colors text-xs ${
                            isSelected
                              ? 'bg-teal-50 dark:bg-teal-900/30 border-l-4 border-l-teal-600'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {po.OrderCode || `PO #${po.ID}`}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                              {po.Status || 'Active'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 truncate">
                            {po.CustName || po.CustCode || 'Vendor'}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                            <span>
                              {po.PODate ? new Date(po.PODate).toLocaleDateString() : 'No date'}
                            </span>
                            <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                              {Number(po.DocTotal || 0).toLocaleString()} {po.Currency || 'TZS'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* PO Items Preview */}
                <div className="md:col-span-7 border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between">
                  {selectedPoForCopy ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {selectedPoForCopy.OrderCode || `PO #${selectedPoForCopy.ID}`} — Items (
                            {selectedPoForCopy.items?.length || 0})
                          </h4>
                          <p className="text-[10px] text-slate-500">
                            Vendor: {selectedPoForCopy.CustName} ({selectedPoForCopy.CustCode})
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (selectedPoItemIds.length === (selectedPoForCopy.items?.length || 0)) {
                              setSelectedPoItemIds([]);
                            } else {
                              setSelectedPoItemIds((selectedPoForCopy.items || []).map((_: any, idx: number) => idx));
                            }
                          }}
                          className="text-[10px] h-6 px-2"
                        >
                          {selectedPoItemIds.length === (selectedPoForCopy.items?.length || 0)
                            ? 'Deselect All'
                            : 'Select All'}
                        </Button>
                      </div>

                      <div className="space-y-1.5 max-h-64 overflow-y-auto">
                        {(selectedPoForCopy.items || []).map((it: any, idx: number) => {
                          const isChecked = selectedPoItemIds.includes(idx);
                          return (
                            <div
                              key={idx}
                              onClick={() => handleTogglePoItem(idx)}
                              className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                                isChecked
                                  ? 'bg-white dark:bg-slate-800 border-teal-500 dark:border-teal-500/50 shadow-xs'
                                  : 'bg-slate-100/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate mr-2">
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-teal-600 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                )}
                                <div className="truncate">
                                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                    {it.ItemName || it.ItemCode || `Item #${it.ItemID}`}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {it.ItemCode} • Qty: {it.Quantity} {it.UoM || 'pcs'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0">
                                {Number(it.LineTotalLC || 0).toLocaleString()} {selectedPoForCopy.Currency || 'TZS'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mb-2 stroke-1" />
                      <p className="text-xs">Select a Purchase Order from the left list to view items</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
              <span className="text-xs text-slate-500">
                {selectedPoItemIds.length} item(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsCopyPoModalOpen(false)}
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!selectedPoForCopy || selectedPoItemIds.length === 0}
                  onClick={() => handleApplyPoCopy(false)}
                  className="text-xs rounded-xl"
                >
                  Append Items
                </Button>
                <Button
                  type="button"
                  disabled={!selectedPoForCopy || selectedPoItemIds.length === 0}
                  onClick={() => handleApplyPoCopy(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs rounded-xl font-bold"
                >
                  Replace & Import
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BROWSE VENDORS */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Browse Approved Suppliers</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVendorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter suppliers by name, code or TIN..."
                  value={vendorSearch}
                  onChange={e => setVendorSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
            <div className="p-4 overflow-y-auto space-y-1.5 flex-1 divide-y divide-slate-100 dark:divide-slate-700/50">
              {suppliersList
                .filter((supp: any) => {
                  const q = vendorSearch.toLowerCase();
                  const name = (supp.Name || supp.name || supp.cardName || supp.CardName || '').toLowerCase();
                  const code = (supp.Code || supp.code || supp.cardCode || supp.CardCode || '').toLowerCase();
                  return name.includes(q) || code.includes(q);
                })
                .map((supp: any) => {
                  const code = supp.Code || supp.code || supp.cardCode || supp.CardCode;
                  const name = supp.Name || supp.name || supp.cardName || supp.CardName || 'Unnamed Vendor';
                  const tin = supp.TIN || supp.tin;
                  const address = supp.Address || supp.address;
                  return (
                    <div
                      key={code}
                      onClick={() => handleSelectVendorFromModal(supp)}
                      className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-xl cursor-pointer flex items-center justify-between transition-colors text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{name}</div>
                        <div className="text-[10px] text-slate-400">
                          Code: {code} {tin ? `• TIN: ${tin}` : ''} {address ? `• ${address}` : ''}
                        </div>
                      </div>
                      <Button type="button" variant="outline" className="text-[10px] h-6 px-2">
                        Select
                      </Button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
