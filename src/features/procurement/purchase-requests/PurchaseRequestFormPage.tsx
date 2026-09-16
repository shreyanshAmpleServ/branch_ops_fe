import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  UploadCloud,
  ShoppingBag,
  Info,
  Layers,
  FileSpreadsheet,
  Building2,
  Hash,
  ShieldCheck,
  AlertCircle,
  Calendar,
  DollarSign,
  Package,
  FileText,
  Image as ImageIcon,
  Paperclip,
  ExternalLink,
  Search
} from 'lucide-react';
import {
  useCreatePurchaseRequest,
  useUpdatePurchaseRequest,
  usePurchaseRequest,
  type PurchaseRequestItem,
  type PurchaseRequestAttachment,
  type PurchaseRequestInput
} from './api/usePurchaseRequests';
import api, { getAttachmentUrl, getFileName } from '../../../lib/api';
import { useRetailers } from '../../customers/api/useRetailers';
import { useItems } from '../../items/api/useItems';
import { useExpenses, useProjects, useWarehouses, useCostCentersMain } from '../../users/api/useMasterData';
import { Button, Spinner, Badge, SearchableSelect, type SearchableSelectOption } from '../../../components/ui';
import { PurchaseRequestReceiptView } from './components/PurchaseRequestReceiptView';

interface PurchaseRequestFormPageProps {
  mode: 'add' | 'edit' | 'view';
}

/* ── Reusable field label ── */
const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label
    className="text-[10px] font-bold uppercase tracking-widest mb-1 block"
    style={{ color: 'var(--color-text-secondary)' }}
  >
    {children}
  </label>
);

/* ── Section card wrapper ── */
const SectionCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div
    className={`rounded-2xl border shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden ${className}`}
    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
  >
    {children}
  </div>
);

/* ── Section header bar ── */
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; right?: React.ReactNode }> = ({ icon, title, right }) => (
  <div
    className="flex items-center justify-between px-5 py-3.5 border-b"
    style={{ background: 'var(--color-surface-hover)', borderColor: 'var(--color-border)' }}
  >
    <div className="flex items-center gap-2.5">
      <span className="text-primary">{icon}</span>
      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>
        {title}
      </span>
    </div>
    {right && <div>{right}</div>}
  </div>
);

export const PurchaseRequestFormPage: React.FC<PurchaseRequestFormPageProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numericId = id ? parseInt(id) : null;

  // Item Selection Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [activeRowIndexForModal, setActiveRowIndexForModal] = useState<number | null>(null);
  const [itemSearch, setItemSearch] = useState('');

  // Vendor Selection Modal State
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [activeRowVendorIndexForModal, setActiveRowVendorIndexForModal] = useState<number | null>(null);
  const [vendorSearch, setVendorSearch] = useState('');

  const handleSelectVendorFromModal = (supp: any) => {
    const code = supp.Code || supp.code || supp.cardCode || supp.CardCode;
    const name = supp.Name || supp.name || supp.cardName || supp.CardName || '';
    const addr = supp.Address || supp.address || '';

    if (activeRowVendorIndexForModal !== null && activeRowVendorIndexForModal >= 0 && activeRowVendorIndexForModal < items.length) {
      handleItemLineChange(activeRowVendorIndexForModal, 'vendor', code);
    } else {
      setCustCode(code);
      setCustName(name);
      setAddress(addr);
    }

    setIsVendorModalOpen(false);
    setActiveRowVendorIndexForModal(null);
  };

  const { data: suppliersResponse = [] } = useRetailers({ cardType: 'S', aprStatus: 'Y' });
  const { data: itemsResponse } = useItems({ limit: 500, search: itemSearch || undefined });
  const { data: expensesResponse } = useExpenses();
  const { data: projectsResponse } = useProjects();
  const { data: warehousesResponse } = useWarehouses();
  const { data: costCentersMainResponse } = useCostCentersMain();

  const suppliersList = (Array.isArray(suppliersResponse) ? suppliersResponse : (suppliersResponse as any)?.data) || [];
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

  const itemsList = itemsResponse?.items || (Array.isArray(itemsResponse) ? itemsResponse : (itemsResponse as any)?.data) || [];
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

  const expenses = expensesResponse?.data || [];
  const projectsList = projectsResponse?.data || [];
  const warehousesList = warehousesResponse?.data || [];
  const costCentersList = costCentersMainResponse?.data || [];

  const productsList = React.useMemo(() => {
    return costCentersList.filter(cc => cc.dimCode === 1);
  }, [costCentersList]);

  const locationsList = React.useMemo(() => {
    return costCentersList.filter(cc => cc.dimCode === 3);
  }, [costCentersList]);

  const assetsList = React.useMemo(() => {
    return costCentersList.filter(cc => cc.dimCode === 4);
  }, [costCentersList]);

  const createMutation = useCreatePurchaseRequest();
  const updateMutation = useUpdatePurchaseRequest();
  const { data: existingRequest, isLoading: isLoadingDetails } = usePurchaseRequest(numericId);

  const [basicDetailsOpen, setBasicDetailsOpen] = useState(true);
  const [advancedSapOpen, setAdvancedSapOpen] = useState(false);

  const [custCode, setCustCode] = useState('');
  const [custName, setCustName] = useState('');
  const [address, setAddress] = useState('');
  const [custRefNo, setCustRefNo] = useState('');
  const [currency, setCurrency] = useState('TZS');
  const [curRate, setCurRate] = useState(1.0);
  const [postDate, setPostDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [typeRequest, setTypeRequest] = useState('Item');
  const [requestedByDate, setRequestedByDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [branchId, setBranchId] = useState<number | ''>('');
  const [requestType, setRequestType] = useState('Direct');
  const [expenseType, setExpenseType] = useState('');
  const [memoText, setMemoText] = useState('');
  const [department, setDepartment] = useState('');
  const [requestTerms, setRequestTerms] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [hasRounding, setHasRounding] = useState(false);
  const [roundingAmount, setRoundingAmount] = useState(0);
  const [hasFreight, setHasFreight] = useState(false);
  const [freightAmount, setFreightAmount] = useState(0);
  const [items, setItems] = useState<PurchaseRequestItem[]>([]);
  const [attachments, setAttachments] = useState<PurchaseRequestAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (existingRequest && (mode === 'edit' || mode === 'view')) {
      setCustCode(existingRequest.CustCode || '');
      setCustName(existingRequest.CustName || '');
      setAddress(existingRequest.Address || '');
      setCustRefNo(existingRequest.CustRefNo || '');
      setCurrency(existingRequest.Currency || 'TZS');
      setCurRate(Number(existingRequest.CurRate || 1.0));
      if (existingRequest.PostDate) setPostDate(new Date(existingRequest.PostDate).toISOString().split('T')[0]);
      if (existingRequest.DueDate) setDueDate(new Date(existingRequest.DueDate).toISOString().split('T')[0]);
      setTypeRequest(existingRequest.TypeRequest || 'Item');
      if (existingRequest.RequestedByDate) setRequestedByDate(new Date(existingRequest.RequestedByDate).toISOString().split('T')[0]);
      setRemarks(existingRequest.Remarks || '');
      setBranchId(existingRequest.Branch_id || '');
      setRequestType(existingRequest.RequestType || 'Direct');
      setExpenseType(existingRequest.Expense_type || '');
      setMemoText(existingRequest.memo_text || '');
      setDepartment(existingRequest.Department || '');
      setDiscountPercent(Number(existingRequest.DiscPrcnt || 0));
      setRoundingAmount(Number(existingRequest.RoundingAmnt || 0));
      setHasRounding(existingRequest.Rounding === 'Y');
      setFreightAmount(Number(existingRequest.Freight || 0));
      setHasFreight(Number(existingRequest.Freight || 0) > 0);
      setPaymentMethod(existingRequest.PaymentMethod || '');
      if (existingRequest.items) {
        setItems(existingRequest.items.map(item => ({
          ...item,
          Quantity: Number(item.Quantity),
          UnitPrice: Number(item.UnitPrice),
          DiscPrcnt: Number(item.DiscPrcnt || 0),
          VATPer: Number(item.VATPer || 0),
        })));
      }
      if (existingRequest.attachments) {
        setAttachments(existingRequest.attachments);
      }
    } else {
      setCustCode(''); setCustName(''); setAddress(''); setCustRefNo('');
      setCurrency('TZS'); setCurRate(1.0);
      setPostDate(new Date().toISOString().split('T')[0]);
      setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setTypeRequest('Item');
      setRequestedByDate(new Date().toISOString().split('T')[0]);
      setRemarks(''); setBranchId(''); setRequestType('Direct');
      setExpenseType(''); setMemoText(''); setDepartment('');
      setRequestTerms(''); setPaymentMethod('');
      setDiscountPercent(0); setHasRounding(false); setRoundingAmount(0);
      setHasFreight(false); setFreightAmount(0); setItems([]);
      setAttachments([]);
    }
  }, [existingRequest, mode]);



  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newAttachments: PurchaseRequestAttachment[] = [...attachments];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<{ status: string; data: { path: string } }>(
          '/upload/file',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        if (response.data?.data?.path) {
          newAttachments.push({
            LineNum: newAttachments.length + 1,
            Attachment: response.data.data.path,
          });
        }
      }
      setAttachments(newAttachments);
    } catch (err) {
      console.error('File upload failed:', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== index).map((att, idx) => ({ ...att, LineNum: idx + 1 })));
  };

  const handleSupplierChange = (code: string) => {
    const supplier = suppliersResponse.find(s => s.Code === code);
    if (supplier) {
      setCustCode(code);
      setCustName(supplier.Name);
      setAddress(supplier.Address || '');
    }
  };

  const handleAddItem = (selectedItem: any) => {
    const itemCode = selectedItem.itemCode || selectedItem.ItemCode || selectedItem.code || `ITM-${selectedItem.id || selectedItem.ID}`;
    const itemName = selectedItem.itemName || selectedItem.ItemName || selectedItem.name || 'Unnamed Item';
    const unitPrice = Number(selectedItem.lastPurPrc || selectedItem.price || selectedItem.UnitPrice || 0);
    const itemId = Number(selectedItem.id || selectedItem.ID || 0);
    const uom = selectedItem.uom || selectedItem.UoM || 'pcs';

    if (activeRowIndexForModal !== null && activeRowIndexForModal >= 0 && activeRowIndexForModal < items.length) {
      setItems(prev => {
        const copy = [...prev];
        const line = { ...copy[activeRowIndexForModal] };
        line.ItemID = itemId;
        line.ItemCode = itemCode;
        line.ItemName = itemName;
        line.UnitPrice = unitPrice;
        line.UoM = uom;

        const qty = line.Quantity || 1;
        const disc = line.DiscPrcnt || 0;
        const vat = line.VATPer !== undefined ? line.VATPer : 18;
        const baseAmount = qty * unitPrice;
        const afterDisc = baseAmount * (1 - disc / 100);
        const tax = afterDisc * (vat / 100);
        line.LineTax = tax;
        line.LineTotalLC = afterDisc + tax;

        copy[activeRowIndexForModal] = line;
        return copy;
      });
    } else {
      const newItem: PurchaseRequestItem = {
        LineNum: items.length + 1,
        ItemID: itemId,
        ItemCode: itemCode,
        ItemName: itemName,
        LineStatus: 'O',
        Quantity: 1,
        UnitPrice: unitPrice,
        DiscPrcnt: 0,
        VATCode: 'VAT_18',
        VATPer: 18,
        LineTax: unitPrice * 0.18,
        LineTotalLC: unitPrice * 1.18,
        UoM: uom,
        vendor: custCode || '',
        DIM1: '', DIM2: '', DIM3: '', DIM4: '', DIM5: '',
      };
      setItems(prev => [...prev, newItem]);
    }

    setIsItemModalOpen(false);
    setActiveRowIndexForModal(null);
  };

  const handleAddItemLine = () => {
    setItems(prev => [...prev, {
      LineNum: prev.length + 1,
      ItemID: 0, ItemCode: '', ItemName: '',
      LineStatus: 'O', Quantity: 1, UnitPrice: 0,
      DiscPrcnt: 0, VATCode: 'VAT_18', VATPer: 18,
      LineTax: 0, LineTotalLC: 0, Remarks: '',
      vendor: custCode || '',
      DIM1: '',
      DIM2: '',
      DIM3: '',
      DIM4: '',
      DIM5: '',
      ferightType: '',
      vendorRef: '',
      po_id: '',
      Location: '',
      WhsCode: undefined,
      project: '',
    }]);
  };

  const handleRemoveItemLine = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, LineNum: i + 1 })));
  };

  const handleItemLineChange = (index: number, field: keyof PurchaseRequestItem, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      const line = { ...copy[index] };
      if (field === 'ItemID') {
        const itemObj = itemsList.find(item => Number(item.id || item.ID) === Number(value));
        if (itemObj) {
          line.ItemID = Number(itemObj.id || itemObj.ID);
          line.ItemCode = itemObj.code || itemObj.itemCode || itemObj.ItemCode || `ITM-${itemObj.id || itemObj.ID}`;
          line.ItemName = itemObj.name || itemObj.itemName || itemObj.ItemName || '';
          line.UoM = itemObj.uom || itemObj.UoM || line.UoM || 'pcs';
          line.UnitPrice = Number(itemObj.lastPurPrc || itemObj.price || itemObj.UnitPrice || line.UnitPrice || 0);
        }
      } else if (field === 'VATCode') {
        line.VATCode = value;
        if (value === 'VAT_18') line.VATPer = 18;
        else if (value === 'VAT_10') line.VATPer = 10;
        else if (value === 'VAT_0') line.VATPer = 0;
        else if (value === 'VAT_EXEMPT') line.VATPer = 0;
      } else if (field === 'DIM3') {
        line.DIM3 = value;
        line.Location = value;
      } else {
        (line as any)[field] = value;
      }
      
      const qty = Number(line.Quantity || 0);
      const price = Number(line.UnitPrice || 0);
      const disc = Number(line.DiscPrcnt || 0);
      const vat = Number(line.VATPer || 0);
      
      // Calculate derived field: OpenQty changes in sync with Quantity
      line.OpenQty = qty;
      
      const baseAmount = qty * price;
      const afterDisc = baseAmount * (1 - disc / 100);
      const tax = afterDisc * (vat / 100);
      line.LineTax = tax;
      line.LineTotalLC = afterDisc + tax;
      copy[index] = line;
      return copy;
    });
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.Quantity || 0) * Number(item.UnitPrice || 0)), 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const baseAfterHeaderDisc = subtotal - discountAmount;
  const totalTax = items.reduce((sum, item) => {
    const lineBase = Number(item.Quantity || 0) * Number(item.UnitPrice || 0) * (1 - Number(item.DiscPrcnt || 0) / 100);
    const lineRatio = subtotal > 0 ? lineBase / subtotal : 0;
    const scaledLineBase = baseAfterHeaderDisc * lineRatio;
    return sum + (scaledLineBase * (Number(item.VATPer || 0) / 100));
  }, 0);
  const rawDocTotal = baseAfterHeaderDisc + totalTax + (hasFreight ? Number(freightAmount) : 0);
  const finalDocTotal = hasRounding ? rawDocTotal + Number(roundingAmount) : rawDocTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custCode) { alert('Please select a vendor/supplier'); return; }
    if (items.length === 0) { alert('Please add at least one item line'); return; }
    if (items.some(item => !item.ItemID)) { alert('Please select a valid item for all lines'); return; }
    const payload: PurchaseRequestInput = {
      CustCode: custCode, CustName: custName, Address: address, CustRefNo: custRefNo,
      Currency: currency, CurRate: curRate, PostDate: postDate, DueDate: dueDate || null,
      TypeRequest: typeRequest, RequestedByDate: requestedByDate || null, Remarks: remarks,
      Branch_id: branchId ? Number(branchId) : undefined, RequestType: requestType,
      Expense_type: expenseType || undefined, memo_text: memoText || undefined,
      Department: department || undefined,
      items: items.map((item, idx) => ({
        LineNum: idx + 1, LineStatus: item.LineStatus || 'O', ItemID: item.ItemID,
        ItemCode: item.ItemCode || undefined, ItemName: item.ItemName || undefined,
        Quantity: Number(item.Quantity), UnitPrice: Number(item.UnitPrice),
        DiscPrcnt: Number(item.DiscPrcnt || 0), VATCode: item.VATCode || undefined,
        VATPer: Number(item.VATPer || 0),
        WhsCode: item.WhsCode ? Number(item.WhsCode) : undefined,
        cost_center: item.cost_center ? Number(item.cost_center) : undefined,
        project: item.project || undefined, Remarks: item.Remarks || undefined,
        UoM: item.UoM || undefined,
        vendor: item.vendor || undefined,
        DIM1: item.DIM1 || undefined,
        DIM2: item.DIM2 || undefined,
        DIM3: item.DIM3 || undefined,
        DIM4: item.DIM4 || undefined,
        DIM5: item.DIM5 || undefined,
        ferightType: item.ferightType || undefined,
        vendorRef: item.vendorRef || undefined,
        po_id: item.po_id || undefined,
        Location: item.Location || undefined,
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
      navigate('/procurement/request');
    } catch (err) {
      console.error(err);
      alert('Failed to save purchase request');
    }
  };

  const isView = mode === 'view';
  const isApproved = existingRequest?.AprStatus === 'Y';

  if (isLoadingDetails && (mode === 'edit' || mode === 'view')) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isView && existingRequest) {
    return (
      <PurchaseRequestReceiptView
        request={existingRequest}
        onBack={() => navigate('/procurement/request')}
      />
    );
  }

  /* ─────────────────────────── INPUT STYLE HELPERS ─────────────────────────── */
  const inputCls = `w-full text-xs font-semibold py-2.5 px-3 rounded-xl border outline-none 
    transition-all duration-200 focus:ring-2 focus:ring-primary/25 focus:border-primary
    placeholder:text-slate-400 dark:placeholder:text-slate-600`;
  const inputStyle = {
    background: 'var(--color-surface)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text)',
  };

  return (
    <div className="min-h-screen w-full animate-fade-in" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ══════════════════════ PAGE HEADER ══════════════════════ */}
        <div className="rounded-2xl border px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="space-y-0.5">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
              <Link to="/dashboard" className="hover:text-primary transition-colors font-medium">Home</Link>
              <span className="opacity-40">/</span>
              <Link to="/procurement/request" className="hover:text-primary transition-colors font-medium">Purchase Requests</Link>
              <span className="opacity-40">/</span>
              <span className="text-primary font-bold">{mode === 'edit' ? 'Edit' : 'New'}</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--color-text)' }}>
                {mode === 'edit' ? 'Modify Purchase Request' : 'New Purchase Request'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                DRAFT
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/procurement/request')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-95 active:scale-90"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', background: 'var(--color-surface)' }}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            {!isView && (
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-95 active:scale-90 disabled:opacity-60 shadow-md shadow-emerald-500/20"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? <Spinner size="sm" />
                  : <><Check className="h-3.5 w-3.5" /> Submit Request</>}
              </button>
            )}
          </div>
        </div>

        {/* ══════════════════════ ROW 1: Basic Info + Audit Ledger ══════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* LEFT ── Basic Details + Dates + Memo */}
          <div className="xl:col-span-2 space-y-5">

            {/* 1. Basic Details */}
            <SectionCard>
              <button
                type="button"
                className="w-full flex items-center justify-between px-5 py-3.5 border-b text-left transition-colors hover:brightness-95"
                style={{ background: 'var(--color-surface-hover)', borderColor: 'var(--color-border)' }}
                onClick={() => setBasicDetailsOpen(!basicDetailsOpen)}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>
                    Basic Details
                  </span>
                </div>
                {basicDetailsOpen
                  ? <ChevronUp className="h-4 w-4 text-primary" />
                  : <ChevronDown className="h-4 w-4 text-primary" />}
              </button>

              {basicDetailsOpen && (
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SearchableSelect
                    label="Vendor / Supplier"
                    value={custCode}
                    onChange={(val, opt) => {
                      const code = String(val || '');
                      const supp = opt?.raw || suppliersList.find((s: any) => (s.Code || s.code || s.cardCode || s.CardCode) === code);
                      if (supp) {
                        setCustCode(code);
                        setCustName(supp.Name || supp.name || supp.cardName || supp.CardName || '');
                        setAddress(supp.Address || supp.address || '');
                      } else {
                        setCustCode(code);
                        setCustName('');
                      }
                    }}
                    options={supplierOptions}
                    placeholder="Search & select vendor..."
                    disabled={isView}
                  />
                  <div>
                    <FieldLabel>Vendor Name</FieldLabel>
                    <input
                      type="text"
                      className={inputCls + ' opacity-70 cursor-not-allowed'}
                      style={{ ...inputStyle, background: 'var(--color-surface-hover)' }}
                      value={custName}
                      disabled
                    />
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel>Address</FieldLabel>
                    <input
                      type="text"
                      placeholder="Physical or mailing address…"
                      className={inputCls}
                      style={inputStyle}
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      disabled={isView}
                    />
                  </div>
                </div>
              )}
            </SectionCard>

            {/* 2. Dates & Financing Logistics */}
            <SectionCard>
              <SectionHeader icon={<Info className="h-3.5 w-3.5" />} title="Dates & Financing Logistics" />
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Post Date</FieldLabel>
                  <div className="relative">
                    <Calendar className="absolute left-1 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      className={inputCls + ' pl-8'}
 style={{
    ...inputStyle,
    textIndent: '5px'
  }}                      value={postDate}
                      onChange={e => setPostDate(e.target.value)}
                      disabled={isView}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Validity Date</FieldLabel>
                  <div className="relative">
                    <Calendar className="absolute left-1 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      className={inputCls + ' pl-8'}     
 style={{
    ...inputStyle,
    textIndent: '5px'
  }}                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      disabled={isView}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Required By</FieldLabel>
                  <div className="relative">
                    <Calendar className="absolute left-1 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      className={inputCls + ' pl-8 mr-1'}
 style={{
    ...inputStyle,
    textIndent: '5px'
  }}                      value={requestedByDate 
                        
                      }
                      onChange={e => setRequestedByDate(e.target.value)}
                      disabled={isView}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Request Terms</FieldLabel>
                  <select
                    className={inputCls}
                    style={inputStyle}
                    value={requestTerms}
                    onChange={e => setRequestTerms(e.target.value)}
                    disabled={isView}
                  >
                    <option value="">Select Terms…</option>
                    <option value="cash">Cash Payment</option>
                    <option value="net30">Net 30 Days</option>
                    <option value="net60">Net 60 Days</option>
                    <option value="cod">Cash on Delivery</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Expense Classification</FieldLabel>
                  <select
                    className={inputCls}
                    style={inputStyle}
                    value={expenseType}
                    onChange={e => setExpenseType(e.target.value)}
                    disabled={isView}
                  >
                    <option value="">Select Classification…</option>
                    {expenses.map(e => (
                      <option key={e.type} value={e.type}>{e.type} — {e.description}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Payment Method</FieldLabel>
                  <select
                    className={inputCls}
                    style={inputStyle}
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    disabled={isView}
                  >
                    <option value="">Select Method…</option>
                    <option value="Bank Transfer">Bank Wire Transfer</option>
                    <option value="Cash">Petty Cash</option>
                    <option value="Mobile Money">Mobile Money (M-Pesa)</option>
                    <option value="Cheque">Cheque Payment</option>
                  </select>
                </div>
              </div>
            </SectionCard>

            {/* 3. Internal Memo */}
            <SectionCard>
              <SectionHeader icon={<FileSpreadsheet className="h-3.5 w-3.5" />} title="Detailed Description / Internal Memo" />
              <div className="p-5 space-y-3">
                {!isView && (
                  <div className="flex flex-wrap gap-1 p-1.5 border rounded-xl" style={{ background: 'var(--color-surface-hover)', borderColor: 'var(--color-border)' }}>
                    {['B', 'I', 'U'].map(t => (
                      <button key={t} type="button"
                        className="px-2.5 py-1 rounded-lg text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border-0 font-bold"
                        style={{ fontStyle: t === 'I' ? 'italic' : 'normal', textDecoration: t === 'U' ? 'underline' : 'none', color: 'var(--color-text)' }}>
                        {t}
                      </button>
                    ))}
                    <div className="w-px bg-slate-300 dark:bg-slate-600 my-0.5 mx-1" />
                    <select className="text-xs border-0 rounded-lg px-2 py-0.5 outline-none bg-transparent" style={{ color: 'var(--color-text)' }}>
                      <option>14px</option><option>16px</option><option>18px</option>
                    </select>
                    <div className="w-px bg-slate-300 dark:bg-slate-600 my-0.5 mx-1" />
                    <button type="button" className="px-2.5 py-1 rounded-lg text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border-0" style={{ color: 'var(--color-text)' }}>List</button>
                    <button type="button" className="px-2.5 py-1 rounded-lg text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border-0" style={{ color: 'var(--color-text)' }}>&lt;&gt;</button>
                  </div>
                )}
                <textarea
                  rows={5}
                  className="w-full text-xs resize-none py-3 px-4 border rounded-xl outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all font-mono placeholder:text-slate-400"
                  placeholder="Add administrative details or internal specifications here…"
                  value={memoText}
                  onChange={e => setMemoText(e.target.value)}
                  disabled={isView}
                  style={inputStyle}
                />
              </div>
            </SectionCard>
          </div>

          {/* RIGHT ── Identity Audit Ledger */}
          <div className="xl:col-span-1 space-y-5">
            {/* Audit Ledger */}
            <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)' }}>
              {/* Header strip */}
              <div className="px-5 py-3 flex items-center gap-2 border-b border-white/10">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Identity Audit Ledger
                </span>
              </div>
              <div className="p-5 space-y-5">
                {/* Tracking No */}
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    Tracking Number
                  </span>
                  <span className="font-mono text-base font-extrabold text-emerald-400 tracking-wide">
                    {existingRequest?.RequestedNo || 'PR26/NEW'}
                  </span>
                </div>
                {/* SAP Doc */}
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    SAP Doc Number
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-300">
                    {existingRequest?.SAPDocNum || '— Not synced —'}
                  </span>
                </div>
                {/* Divider */}
                <div className="border-t border-white/10" />
                {/* APR Status */}
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                    APR Status
                  </span>
                  {isApproved ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck className="h-3 w-3" /> Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <AlertCircle className="h-3 w-3" /> Pending Review
                    </span>
                  )}
                </div>
                {/* Currency */}
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Base Currency</span>
                  <span className="text-xs font-bold text-slate-200 font-mono">{currency}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-2xl border p-4 space-y-3" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>
                Quick Overview
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--color-surface-hover)' }}>
                  <p className="text-[9px] uppercase tracking-wider font-bold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Lines</p>
                  <p className="text-xl font-extrabold text-primary">{items.length}</p>
                </div>
                <div
  className="rounded-xl p-3 text-center min-w-0 overflow-hidden"
  style={{ background: 'var(--color-surface-hover)' }}
>
  <p
    className="text-[9px] uppercase tracking-wider font-bold mb-1"
    style={{ color: 'var(--color-text-secondary)' }}
  >
    Total
  </p>

  <p className="text-sm font-extrabold text-emerald-500 font-mono truncate">
    {finalDocTotal.toLocaleString(undefined, {
      minimumFractionDigits: 0
    })}
  </p>
</div>
              </div>
            
            </div>
               {/* Attachments */}
            <SectionCard>
              <SectionHeader 
                icon={<Paperclip className="h-3.5 w-3.5" />} 
                title={`Attachments (${attachments.length})`}
                right={
                  !isView && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isUploading ? <Spinner size="sm" /> : <UploadCloud className="h-3.5 w-3.5" />}
                      <span>Upload File</span>
                    </button>
                  )
                }
              />
              <div className="p-5 space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                />

                {!isView && (
                  <div
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                      isUploading
                        ? 'opacity-60 cursor-not-allowed border-gray-300'
                        : 'cursor-pointer hover:border-primary hover:bg-primary/[0.02]'
                    }`}
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 transition-colors flex items-center justify-center mx-auto mb-2">
                      {isUploading ? (
                        <Spinner size="sm" />
                      ) : (
                        <UploadCloud className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <p className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                      {isUploading ? 'Uploading files...' : 'Click or drop files here to upload'}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider font-semibold mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      PDF · JPG · PNG · DOC · XLSX · Max 10 MB
                    </p>
                  </div>
                )}

                {/* Attachments List */}
                {attachments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attachments.map((att, idx) => {
                      const fileUrl = getAttachmentUrl(att.Attachment);
                      const fileName = getFileName(att.Attachment);
                      const isImg = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.Attachment);
                      const isPdf = /\.pdf$/i.test(att.Attachment);

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl border transition-all hover:shadow-sm"
                          style={{ background: 'var(--color-surface-hover)', borderColor: 'var(--color-border)' }}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              {isImg ? (
                                <ImageIcon className="h-4 w-4 text-emerald-500" />
                              ) : isPdf ? (
                                <FileText className="h-4 w-4 text-rose-500" />
                              ) : (
                                <Paperclip className="h-4 w-4 text-indigo-500" />
                              )}
                            </div>
                            <div className="truncate min-w-0">
                              <p className="text-xs font-bold truncate" style={{ color: 'var(--color-text)' }} title={fileName}>
                                {fileName}
                              </p>
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1 mt-0.5"
                              >
                                View File <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            </div>
                          </div>

                          {!isView && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(idx)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all shrink-0 ml-2"
                              title="Delete attachment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  isView && (
                    <p className="text-xs italic text-center py-2" style={{ color: 'var(--color-text-secondary)' }}>
                      No attachments attached to this purchase request.
                    </p>
                  )
                )}
              </div>
            </SectionCard>
          </div>
        </div>

        {/* ══════════════════════ ROW 2: Full-width Items Table ══════════════════════ */}
        <SectionCard>
          <SectionHeader
            icon={<Package className="h-3.5 w-3.5" />}
            title="Material Procurement Items"
            right={
              !isView && (
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
                    onClick={() => {
                      setActiveRowIndexForModal(null);
                      setIsItemModalOpen(true);
                    }}
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
              <div className="overflow-x-auto rounded-xl border animate-fade-in" style={{ borderColor: 'var(--color-border)' }}>
                <table className="w-full text-left border-collapse" style={{ minWidth: 2600 }}>
                  <thead>
                    <tr style={{ background: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)' }}>
                      {[
                        '#', 'VENDOR', 'RECEIPT QTY', 'CODE', 'ITEM', 'UOM', 'UNIT PRICE',
                        'TAX CODE', 'DISCOUNT', 'TAX AMOUNT', 'LINE TOTAL', 'TOTAL WITH TAX',
                        'PROJECT', 'WAREHOUSE', 'FOB', 'COC', 'FREIGHTCHARGES', 'OPEN QTY.',
                        'REFRENCE', 'PRODUCT', 'LOCATION', 'ASSET', 'ACTION'
                      ].map((h, i) => (
                        <th
                          key={i}
                          className="py-3 px-3 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((line, idx) => {
                      const lineTotalBeforeTax = (Number(line.Quantity || 0) * Number(line.UnitPrice || 0)) * (1 - Number(line.DiscPrcnt || 0) / 100);
                      return (
                        <tr
                          key={idx}
                          className="border-b transition-colors hover:bg-primary/[0.03]"
                          style={{ borderColor: 'var(--color-border)' }}
                        >
                          {/* Line number */}
                          <td className="py-2.5 px-3">
                            <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)' }}>
                              {idx + 1}
                            </span>
                          </td>
                          
                          {/* VENDOR */}
                          <td className="py-2.5 px-2 min-w-[210px]">
                            <SearchableSelect
                              value={line.vendor || ''}
                              onChange={(val) => handleItemLineChange(idx, 'vendor', String(val || ''))}
                              options={supplierOptions}
                              placeholder="Search & select vendor..."
                              disabled={isView}
                              size="sm"
                            />
                          </td>

                          {/* RECEIPT QTY */}
                          <td className="py-2.5 px-2 w-[90px]">
                            <input
                              type="number" min="1" step="any"
                              className="w-full text-xs font-bold font-mono py-1.5 px-2 rounded-lg text-center border outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              style={inputStyle}
                              value={line.Quantity}
                              onChange={e => handleItemLineChange(idx, 'Quantity', Number(e.target.value))}
                              disabled={isView}
                            />
                          </td>

                          {/* CODE */}
                          <td className="py-2.5 px-3 w-[100px]">
                            <span className="font-mono text-xs font-bold text-primary">
                              {line.ItemCode || '—'}
                            </span>
                          </td>

                          {/* ITEM */}
                          <td className="py-2.5 px-2 min-w-[300px]">
                            <SearchableSelect
                              value={line.ItemCode || (line.ItemID ? String(line.ItemID) : '')}
                              onChange={(val, opt) => {
                                if (!val) {
                                  handleItemLineChange(idx, 'ItemID', 0);
                                  return;
                                }
                                const rawItem = opt?.raw;
                                if (rawItem) {
                                  const itemCode = rawItem.itemCode || rawItem.ItemCode || rawItem.code || `ITM-${rawItem.id || rawItem.ID}`;
                                  const itemName = rawItem.itemName || rawItem.ItemName || rawItem.name || 'Unnamed Item';
                                  const unitPrice = Number(rawItem.lastPurPrc || rawItem.price || rawItem.UnitPrice || 0);

                                  const updated = [...items];
                                  const lineItem = { ...updated[idx] };
                                  lineItem.ItemID = Number(rawItem.id || rawItem.ID || 0);
                                  lineItem.ItemCode = itemCode;
                                  lineItem.ItemName = itemName;
                                  lineItem.UnitPrice = unitPrice;
                                  lineItem.UoM = rawItem.uom || rawItem.UoM || 'pcs';

                                  const qty = Number(lineItem.Quantity || 1);
                                  const disc = Number(lineItem.DiscPrcnt || 0);
                                  const vatPer = 18;

                                  const lineTotalBefDisc = qty * unitPrice;
                                  const lineTotalAfterDisc = lineTotalBefDisc * (1 - disc / 100);
                                  const lineTax = lineTotalAfterDisc * (vatPer / 100);
                                  const lineTotalLC = lineTotalAfterDisc + lineTax;

                                  lineItem.LineTax = lineTax;
                                  lineItem.LineTotalLC = lineTotalLC;

                                  updated[idx] = lineItem;
                                  setItems(updated);
                                } else {
                                  handleItemLineChange(idx, 'ItemID', Number(val) || 0);
                                }
                              }}
                              options={itemCatalogOptions}
                              placeholder="Search item code or name..."
                              disabled={isView}
                              size="sm"
                            />
                          </td>

                          {/* UOM */}
                          <td className="py-2.5 px-3 w-[80px]">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)' }}>
                              {line.UoM || 'pcs'}
                            </span>
                          </td>

                          {/* UNIT PRICE */}
                          <td className="py-2.5 px-2 w-[120px]">
                            <input
                              type="number" step="any"
                              className="w-full text-xs font-bold font-mono py-1.5 px-2 rounded-lg text-right border outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              style={inputStyle}
                              value={line.UnitPrice}
                              onChange={e => handleItemLineChange(idx, 'UnitPrice', Number(e.target.value))}
                              disabled={isView}
                            />
                          </td>

                          {/* TAX CODE */}
                          <td className="py-2.5 px-2 min-w-[150px]">
                            <select
                              className="w-full text-xs font-semibold py-1.5 px-2 rounded-lg border outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              style={inputStyle}
                              value={line.VATCode || 'VAT_18'}
                              onChange={e => handleItemLineChange(idx, 'VATCode', e.target.value)}
                              disabled={isView}
                            >
                              <option value="VAT_18">Input VAT 18%</option>
                              <option value="VAT_10">Input VAT 10%</option>
                              <option value="VAT_0">Zero Rated 0%</option>
                              <option value="VAT_EXEMPT">Exempt 0%</option>
                            </select>
                          </td>

                          {/* DISCOUNT */}
                          <td className="py-2.5 px-2 w-[80px]">
                            <input
                              type="number" min="0" max="100" step="any"
                              className="w-full text-xs font-bold font-mono py-1.5 px-2 rounded-lg text-center border outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              style={inputStyle}
                              value={line.DiscPrcnt || 0}
                              onChange={e => handleItemLineChange(idx, 'DiscPrcnt', Number(e.target.value))}
                              disabled={isView}
                            />
                          </td>

                          {/* TAX AMOUNT */}
                          <td className="py-2.5 px-2 w-[120px]">
                            <input
                              type="text"
                              className="w-full text-xs font-bold font-mono py-1.5 px-2 rounded-lg text-right border outline-none bg-slate-50 dark:bg-slate-800 opacity-80 cursor-not-allowed"
                              style={inputStyle}
                              value={Number(line.LineTax || 0).toFixed(2)}
                              disabled
                            />
                          </td>

                          {/* LINE TOTAL */}
                          <td className="py-2.5 px-3 w-[120px] text-right font-bold font-mono text-xs" style={{ color: 'var(--color-text)' }}>
                            {lineTotalBeforeTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>

                          {/* TOTAL WITH TAX */}
                          <td className="py-2.5 px-3 w-[120px] text-right font-extrabold font-mono text-xs text-primary">
                            {Number(line.LineTotalLC || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>

                          {/* PROJECT */}
                          <td className="py-2.5 px-2 min-w-[150px]">
                            <select
                              className="w-full text-xs font-semibold py-1.5 px-2 rounded-lg border outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              style={inputStyle}
                              value={line.project || ''}
                              onChange={e => handleItemLineChange(idx, 'project', e.target.value)}
                              disabled={isView}
                            >
                              <option value="">Search Project…</option>
                              {projectsList.map(p => (
                                <option key={p.code} value={p.code}>{p.code} — {p.name}</option>
                              ))}
                            </select>
                          </td>

                          {/* WAREHOUSE */}
                          <td className="py-2.5 px-2 min-w-[180px]">
                            <select
                              className="w-full text-xs font-semibold py-1.5 px-2 rounded-lg border outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              style={inputStyle}
                              value={line.WhsCode || ''}
                              onChange={e => handleItemLineChange(idx, 'WhsCode', Number(e.target.value) || undefined)}
                              disabled={isView}
                            >
                              <option value="">Search Warehouse…</option>
                              {warehousesList.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                              ))}
                            </select>
                          </td>

                          {/* FOB */}
                          <td className="py-2.5 px-2 w-[120px]">
                            <input
                              type="text"
                              placeholder="FOB…"
                              className="w-full text-xs font-semibold py-1.5 px-2 rounded-lg border outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              style={inputStyle}
                              value={line.DIM2 || ''}
                              onChange={e => handleItemLineChange(idx, 'DIM2', e.target.value)}
                              disabled={isView}
                            />
                          </td>

                          {/* COC */}
                          <td className="py-2.5 px-2 w-[120px]">
                            <input
                              type="text"
                              placeholder="COC…"
                              className="w-full text-xs font-semibold py-1.5 px-2 rounded-lg border outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              style={inputStyle}
                              value={line.DIM5 || ''}
                              onChange={e => handleItemLineChange(idx, 'DIM5', e.target.value)}
                              disabled={isView}
                            />
                          </td>

                          {/* FREIGHTCHARGES */}
                          <td className="py-2.5 px-2 w-[150px]">
                            <input
                              type="text"
                              placeholder="Freight charges…"
                              className="w-full text-xs font-semibold py-1.5 px-2 rounded-lg border outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              style={inputStyle}
                              value={line.ferightType || ''}
                              onChange={e => handleItemLineChange(idx, 'ferightType', e.target.value)}
                              disabled={isView}
                            />
                          </td>

                          {/* OPEN QTY. */}
                          <td className="py-2.5 px-3 w-[90px] font-mono text-xs font-bold text-center">
                            {Number(line.OpenQty ?? line.Quantity).toFixed(2)}
                          </td>

                          {/* REFRENCE */}
                          <td className="py-2.5 px-2 w-[150px]">
                            <input
                              type="text"
                              placeholder="Reference…"
                              className="w-full text-xs font-semibold py-1.5 px-2 rounded-lg border outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              style={inputStyle}
                              value={line.vendorRef || ''}
                              onChange={e => handleItemLineChange(idx, 'vendorRef', e.target.value)}
                              disabled={isView}
                            />
                          </td>

                          {/* PRODUCT */}
                          <td className="py-2.5 px-2 min-w-[180px]">
                            <select
                              className="w-full text-xs font-semibold py-1.5 px-2 rounded-lg border outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              style={inputStyle}
                              value={line.DIM1 || ''}
                              onChange={e => handleItemLineChange(idx, 'DIM1', e.target.value)}
                              disabled={isView}
                            >
                              <option value="">Select Product…</option>
                              {productsList.map(p => (
                                <option key={p.code} value={p.code}>{p.code} — {p.name}</option>
                              ))}
                            </select>
                          </td>

                          {/* LOCATION */}
                          <td className="py-2.5 px-2 min-w-[180px]">
                            <select
                              className="w-full text-xs font-semibold py-1.5 px-2 rounded-lg border outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              style={inputStyle}
                              value={line.DIM3 || ''}
                              onChange={e => handleItemLineChange(idx, 'DIM3', e.target.value)}
                              disabled={isView}
                            >
                              <option value="">Select Location…</option>
                              {locationsList.map(l => (
                                <option key={l.code} value={l.code}>{l.code} — {l.name}</option>
                              ))}
                            </select>
                          </td>

                          {/* ASSET */}
                          <td className="py-2.5 px-2 min-w-[180px]">
                            <select
                              className="w-full text-xs font-semibold py-1.5 px-2 rounded-lg border outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              style={inputStyle}
                              value={line.DIM4 || ''}
                              onChange={e => handleItemLineChange(idx, 'DIM4', e.target.value)}
                              disabled={isView}
                            >
                              <option value="">Select Asset…</option>
                              {assetsList.map(a => (
                                <option key={a.code} value={a.code}>{a.code} — {a.name}</option>
                              ))}
                            </select>
                          </td>

                          {/* ACTION */}
                          <td className="py-2.5 px-2 text-center w-[50px]">
                            {!isView && (
                              <button
                                type="button"
                                className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:scale-110 text-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                onClick={() => handleRemoveItemLine(idx)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ══════════════════════ ROW 3: Remarks + Attachments + SAP | Financial Summary ══════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* LEFT ── Remarks, Attachments, SAP */}
          <div className="xl:col-span-2 space-y-5">

            {/* Remarks */}
            <SectionCard>
              <SectionHeader icon={<Info className="h-3.5 w-3.5" />} title="Remarks" />
              <div className="p-5">
                <textarea
                  rows={3}
                  className="w-full text-xs resize-none py-2.5 px-3 border rounded-xl focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all placeholder:text-slate-400"
                  placeholder="Add administrative scope descriptions or notes here…"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  disabled={isView}
                  style={inputStyle}
                />
              </div>
            </SectionCard>

           

            {/* SAP Advanced */}
            <SectionCard>
              <button
                type="button"
                className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors hover:brightness-95"
                style={{ background: 'var(--color-surface-hover)' }}
                onClick={() => setAdvancedSapOpen(!advancedSapOpen)}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Layers className="h-3.5 w-3.5 text-violet-500" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>
                    Advanced SAP ERP — Financial Series &amp; Cost Centers
                  </span>
                </div>
                {advancedSapOpen
                  ? <ChevronUp className="h-4 w-4 text-primary" />
                  : <ChevronDown className="h-4 w-4 text-primary" />}
              </button>

              {advancedSapOpen && (
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <div>
                    <FieldLabel>SAP Doc Num Token</FieldLabel>
                    <input
                      type="text"
                      className={inputCls + ' opacity-60 cursor-not-allowed'}
                      style={{ ...inputStyle, background: 'var(--color-surface-hover)' }}
                      value={existingRequest?.SAPDocNum || 'Not synced'}
                      disabled
                    />
                  </div>
                  <div>
                    <FieldLabel>Series</FieldLabel>
                    <select
                      className={inputCls}
                      style={inputStyle}
                      value={existingRequest?.series || 'Primary'}
                      onChange={() => { }}
                      disabled={isView}
                    >
                      <option value="Primary">Primary</option>
                      <option value="Secondary">Secondary</option>
                    </select>
                  </div>
                </div>
              )}
            </SectionCard>

          </div>

          {/* RIGHT ── Financial Aggregation Summary */}
          <div className="xl:col-span-1">
            <div
              className="rounded-2xl border overflow-hidden shadow-sm sticky top-5"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              {/* Summary header */}
              <div className="px-5 py-3.5 border-b flex items-center gap-2" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-hover)' }}>
                <DollarSign className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>
                  Financial Summary
                </span>
              </div>

              <div className="p-5 space-y-4">

                {/* Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Subtotal (before tax)</span>
                  <span className="text-xs font-bold font-mono" style={{ color: 'var(--color-text)' }}>
                    {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Discount */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                    Header Discount (%)
                  </span>
                  <input
                    type="number" min="0" max="100"
                    className="w-20 text-right text-xs font-bold font-mono py-1.5 px-2 rounded-lg border outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                    style={inputStyle}
                    value={discountPercent}
                    onChange={e => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                    disabled={isView}
                  />
                </div>

                {/* Rounding */}
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasRounding}
                      onChange={e => setHasRounding(e.target.checked)}
                      disabled={isView}
                      className="rounded border-gray-300 text-primary focus:ring-primary w-3.5 h-3.5"
                    />
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Rounding</span>
                  </label>
                  {hasRounding && (
                    <input
                      type="number" step="any"
                      className="w-24 text-right text-xs font-bold font-mono py-1.5 px-2 rounded-lg border outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                      style={inputStyle}
                      value={roundingAmount}
                      onChange={e => setRoundingAmount(Number(e.target.value))}
                      disabled={isView}
                    />
                  )}
                </div>

                {/* Freight */}
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasFreight}
                      onChange={e => setHasFreight(e.target.checked)}
                      disabled={isView}
                      className="rounded border-gray-300 text-primary focus:ring-primary w-3.5 h-3.5"
                    />
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Freight</span>
                  </label>
                  {hasFreight && (
                    <input
                      type="number" min="0" step="any"
                      className="w-24 text-right text-xs font-bold font-mono py-1.5 px-2 rounded-lg border outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                      style={inputStyle}
                      value={freightAmount}
                      onChange={e => setFreightAmount(Number(e.target.value))}
                      disabled={isView}
                    />
                  )}
                </div>

                {/* Tax */}
                <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Tax (VAT)</span>
                  <span className="text-xs font-bold font-mono" style={{ color: 'var(--color-text)' }}>
                    {totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Grand Total */}
                <div className="rounded-xl p-4 space-y-1" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-200">Final Total Amount</p>
                  <p className="text-2xl font-extrabold text-white font-mono leading-none">
                    {finalDocTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[9px] text-indigo-300 font-semibold">
                    Currency Base: {currency} · System Valuation
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>
        {/* END Row 3 */}

      </div>

      {/* Select Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Select Item from Catalog</h3>
              <button
                type="button"
                onClick={() => {
                  setIsItemModalOpen(false);
                  setActiveRowIndexForModal(null);
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
                  placeholder="Search item code or name..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 dark:divide-slate-700">
              {itemsList.filter((itm: any) => {
                const code = (itm.itemCode || itm.ItemCode || itm.code || '').toLowerCase();
                const name = (itm.itemName || itm.ItemName || itm.name || '').toLowerCase();
                const q = itemSearch.toLowerCase();
                return code.includes(q) || name.includes(q);
              }).length > 0 ? (
                itemsList.filter((itm: any) => {
                  const code = (itm.itemCode || itm.ItemCode || itm.code || '').toLowerCase();
                  const name = (itm.itemName || itm.ItemName || itm.name || '').toLowerCase();
                  const q = itemSearch.toLowerCase();
                  return code.includes(q) || name.includes(q);
                }).map((itm: any) => {
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
                        <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{price.toLocaleString(undefined, { minimumFractionDigits: 2 })} TZS</div>
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
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 dark:divide-slate-700">
              {suppliersResponse.filter((supp: any) => {
                const code = (supp.Code || supp.code || supp.cardCode || supp.CardCode || '').toLowerCase();
                const name = (supp.Name || supp.name || supp.cardName || supp.CardName || '').toLowerCase();
                const address = (supp.Address || supp.address || '').toLowerCase();
                const tin = (supp.TIN || supp.tin || '').toLowerCase();
                const q = vendorSearch.toLowerCase();
                return code.includes(q) || name.includes(q) || address.includes(q) || tin.includes(q);
              }).length > 0 ? (
                suppliersResponse.filter((supp: any) => {
                  const code = (supp.Code || supp.code || supp.cardCode || supp.CardCode || '').toLowerCase();
                  const name = (supp.Name || supp.name || supp.cardName || supp.CardName || '').toLowerCase();
                  const address = (supp.Address || supp.address || '').toLowerCase();
                  const tin = (supp.TIN || supp.tin || '').toLowerCase();
                  const q = vendorSearch.toLowerCase();
                  return code.includes(q) || name.includes(q) || address.includes(q) || tin.includes(q);
                }).map((supp: any) => {
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
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg uppercase">Select</span>
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

export default PurchaseRequestFormPage;
