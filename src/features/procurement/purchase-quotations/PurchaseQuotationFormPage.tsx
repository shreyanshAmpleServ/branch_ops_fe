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
  Info,
  DollarSign,
  Package,
  FileText,
  Image as ImageIcon,
  Paperclip,
  ExternalLink,
  Building2,
  Layers,
  Search
} from 'lucide-react';
import {
  useCreatePurchaseQuotation,
  useUpdatePurchaseQuotation,
  usePurchaseQuotation,
  type PurchaseQuotationItem,
  type PurchaseQuotationAttachment,
  type PurchaseQuotationInput
} from './api/usePurchaseQuotations';
import api, { getAttachmentUrl, getFileName } from '../../../lib/api';
import { useRetailers } from '../../customers/api/useRetailers';
import { usePurchaseRequests } from '../purchase-requests/api/usePurchaseRequests';
import { useItems } from '../../items/api/useItems';
import { useProjects, useWarehouses, useCostCentersMain, useBranches } from '../../users/api/useMasterData';
import { Button, Spinner, SearchableSelect, type SearchableSelectOption } from '../../../components/ui';

interface PurchaseQuotationFormPageProps {
  mode: 'add' | 'edit' | 'view';
}

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label
    className="text-[10px] font-bold uppercase tracking-widest mb-1 block"
    style={{ color: 'var(--color-text-secondary)' }}
  >
    {children}
  </label>
);

const SectionCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div
    className={`rounded-2xl border shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden ${className}`}
    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
  >
    {children}
  </div>
);

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

export const PurchaseQuotationFormPage: React.FC<PurchaseQuotationFormPageProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numericId = id ? parseInt(id) : null;

  // Item Selection Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [activeRowIndexForModal, setActiveRowIndexForModal] = useState<number | null>(null);
  const [itemSearch, setItemSearch] = useState('');

  // Vendor Selection Modal State
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');

  const handleSelectVendorFromModal = (supp: any) => {
    const code = supp.Code || supp.code || supp.cardCode || supp.CardCode;
    const name = supp.Name || supp.name || supp.cardName || supp.CardName || '';
    const addr = supp.Address || supp.address || '';
    setCustCode(code);
    setCustName(name);
    setAddress(addr);
    setIsVendorModalOpen(false);
  };

  const { data: suppliersResponse = [] } = useRetailers({ cardType: 'S', aprStatus: 'Y' });
  const { data: itemsResponse } = useItems({ limit: 500, search: itemSearch || undefined });
  const { data: projectsResponse } = useProjects();
  const { data: warehousesResponse } = useWarehouses();
  const { data: costCentersMainResponse } = useCostCentersMain();
  const { data: branchesResponse } = useBranches();

  const suppliersList = (Array.isArray(suppliersResponse) ? suppliersResponse : (suppliersResponse as any)?.data) || [];
  const supplierOptions: SearchableSelectOption[] = React.useMemo(() => {
    return suppliersList.map((s: any) => ({
      value: s.Code || s.code,
      label: `${s.Code || s.code} — ${s.Name || s.name}`,
      subtext: [s.TIN || s.tin ? `TIN: ${s.TIN || s.tin}` : '', s.Address || s.address].filter(Boolean).join(' • '),
      raw: s
    }));
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
  const projectsList = projectsResponse?.data || [];
  const warehousesList = warehousesResponse?.data || [];
  const costCentersList = costCentersMainResponse?.data || [];
  const branchesList = (Array.isArray(branchesResponse) ? branchesResponse : (branchesResponse as any)?.data) || [];

  const productsList = React.useMemo(() => {
    return costCentersList.filter(cc => cc.dimCode === 1);
  }, [costCentersList]);

  const locationsList = React.useMemo(() => {
    return costCentersList.filter(cc => cc.dimCode === 3);
  }, [costCentersList]);

  const assetsList = React.useMemo(() => {
    return costCentersList.filter(cc => cc.dimCode === 4);
  }, [costCentersList]);

  const createMutation = useCreatePurchaseQuotation();
  const updateMutation = useUpdatePurchaseQuotation();
  const { data: existingQuotation, isLoading: isLoadingDetails } = usePurchaseQuotation(numericId);

  const [custCode, setCustCode] = useState('');
  const [custName, setCustName] = useState('');
  const [address, setAddress] = useState('');
  const [custRefNo, setCustRefNo] = useState('');
  const [currency, setCurrency] = useState('TZS');
  const [curRate, setCurRate] = useState(1.0);
  const [postDate, setPostDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [taxDate, setTaxDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [branchId, setBranchId] = useState<number | ''>('');
  const [quotCode, setQuotCode] = useState('');
  const [department, setDepartment] = useState('');
  const [requestType, setRequestType] = useState('Item');
  const [purchaseRequestId, setPurchaseRequestId] = useState<number | ''>('');
  const [prId, setPrId] = useState<string>('');
  const { data: rawRequests } = usePurchaseRequests({});
  const [discountPercent, setDiscountPercent] = useState(0);
  const [hasRounding, setHasRounding] = useState(false);
  const [roundingAmount, setRoundingAmount] = useState(0);
  const [hasFreight, setHasFreight] = useState(false);
  const [freightAmount, setFreightAmount] = useState(0);
  const [items, setItems] = useState<PurchaseQuotationItem[]>([]);
  const [attachments, setAttachments] = useState<PurchaseQuotationAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (existingQuotation && (mode === 'edit' || mode === 'view')) {
      setCustCode(existingQuotation.CustCode || '');
      setCustName(existingQuotation.CustName || '');
      setAddress(existingQuotation.Address || '');
      setCustRefNo(existingQuotation.CustRefNo || '');
      setCurrency(existingQuotation.Currency || 'TZS');
      setCurRate(Number(existingQuotation.CurRate || 1.0));
      if (existingQuotation.PostDate) setPostDate(new Date(existingQuotation.PostDate).toISOString().split('T')[0]);
      if (existingQuotation.DueDate) setDueDate(new Date(existingQuotation.DueDate).toISOString().split('T')[0]);
      if (existingQuotation.TaxDate) setTaxDate(new Date(existingQuotation.TaxDate).toISOString().split('T')[0]);
      setRemarks(existingQuotation.Remarks || '');
      setBranchId(existingQuotation.Branch_id || '');
      setQuotCode(existingQuotation.QuotCode || '');
      setDepartment(existingQuotation.Department || '');
      setRequestType(existingQuotation.RequestType || 'Item');
      setPurchaseRequestId(existingQuotation.PurchaseRequestId || '');
      setPrId(existingQuotation.Pr_ID || '');
      setDiscountPercent(Number(existingQuotation.DiscPrcnt || 0));
      setRoundingAmount(Number(existingQuotation.RoundingAmnt || 0));
      setHasRounding(existingQuotation.Rounding === 'Y');
      setFreightAmount(Number(existingQuotation.Freight || 0));
      setHasFreight(Number(existingQuotation.Freight || 0) > 0);
      if (existingQuotation.items) {
        setItems(existingQuotation.items.map(item => {
          const qty = Number(item.Quantity || 0);
          const price = Number(item.UnitPrice || 0);
          const disc = Number(item.DiscPrcnt || 0);
          const vat = Number(item.VATPer || 0);
          const tax = Number(item.LineTax || 0);
          const total = Number(item.LineTotalLC || (qty * price * (1 - disc / 100) + tax));
          return {
            ...item,
            ItemID: Number(item.ItemID || 0),
            Quantity: qty,
            UnitPrice: price,
            DiscPrcnt: disc,
            VATPer: vat,
            LineTax: tax,
            LineTotalLC: total,
          };
        }));
      }
      if (existingQuotation.attachments) {
        setAttachments(existingQuotation.attachments);
      }
    } else {
      setCustCode(''); setCustName(''); setAddress(''); setCustRefNo('');
      setCurrency('TZS'); setCurRate(1.0);
      setPostDate(new Date().toISOString().split('T')[0]);
      setDueDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setTaxDate(new Date().toISOString().split('T')[0]);
      setRemarks(''); setBranchId(''); setQuotCode('');
      setDepartment(''); setRequestType('Item'); setPurchaseRequestId(''); setPrId('');
      setDiscountPercent(0); setHasRounding(false); setRoundingAmount(0);
      setHasFreight(false); setFreightAmount(0); setItems([]); setAttachments([]);
    }
  }, [existingQuotation, mode]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newAttachments: PurchaseQuotationAttachment[] = [...attachments];
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
    const supplier = suppliersList.find((s: any) => (s.Code || s.code) === code);
    if (supplier) {
      setCustCode(code);
      setCustName(supplier.Name || supplier.name || '');
      setAddress(supplier.Address || supplier.address || '');
    } else {
      setCustCode(code);
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
      const newItem: PurchaseQuotationItem = {
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
      UoM: 'pcs',
      vendor: custCode || '',
      DIM1: '', DIM2: '', DIM3: '', DIM4: '', DIM5: '',
    }]);
  };

  const handleRemoveItemLine = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, LineNum: idx + 1 })));
  };

  const handleItemSelect = (index: number, itemId: number) => {
    const selectedItem = itemsList.find((i: any) => Number(i.id || i.ID) === Number(itemId));
    setItems(prev => {
      const copy = [...prev];
      const line = { ...copy[index] };
      line.ItemID = Number(selectedItem?.id || selectedItem?.ID || itemId);
      line.ItemCode = selectedItem?.code || selectedItem?.ItemCode || selectedItem?.itemCode || '';
      line.ItemName = selectedItem?.name || selectedItem?.ItemName || selectedItem?.itemName || '';
      line.UnitPrice = Number(selectedItem?.lastPurPrc ?? selectedItem?.price ?? selectedItem?.UnitPrice ?? 0);
      line.UoM = selectedItem?.uom || selectedItem?.UoM || 'pcs';

      const qty = line.Quantity || 1;
      const price = line.UnitPrice;
      const disc = line.DiscPrcnt || 0;
      const vat = line.VATPer !== undefined ? line.VATPer : 18;
      const baseAmount = qty * price;
      const afterDisc = baseAmount * (1 - disc / 100);
      const tax = afterDisc * (vat / 100);
      line.LineTax = tax;
      line.LineTotalLC = afterDisc + tax;

      copy[index] = line;
      return copy;
    });
  };

  const handleItemLineChange = (index: number, field: keyof PurchaseQuotationItem, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      const line = { ...copy[index], [field]: value };
      const qty = Number(field === 'Quantity' ? value : line.Quantity || 0);
      const price = Number(field === 'UnitPrice' ? value : line.UnitPrice || 0);
      const disc = Number(field === 'DiscPrcnt' ? value : line.DiscPrcnt || 0);
      const vat = Number(field === 'VATPer' ? value : line.VATPer || 0);

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
    if (!custCode) { alert('Please select a supplier'); return; }
    if (items.length === 0) { alert('Please add at least one item line'); return; }
    if (items.some(item => !item.ItemID)) { alert('Please select a valid item for all lines'); return; }
    const payload: PurchaseQuotationInput = {
      CustCode: custCode, CustName: custName, Address: address, CustRefNo: custRefNo,
      Currency: currency, CurRate: curRate, PostDate: postDate, DueDate: dueDate || null,
      TaxDate: taxDate || null, Remarks: remarks,
      Branch_id: branchId ? Number(branchId) : undefined,
      QuotCode: quotCode || undefined,
      Department: department || undefined,
      RequestType: requestType,
      PurchaseRequestId: purchaseRequestId ? Number(purchaseRequestId) : undefined,
      Pr_ID: prId || undefined,
      DiscPrcnt: discountPercent, Rounding: hasRounding ? 'Y' : 'N', RoundingAmnt: roundingAmount,
      Freight: hasFreight ? freightAmount : 0, Department: department || undefined,
      RequestType: requestType,
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
        DIM1: item.DIM1 || undefined, DIM2: item.DIM2 || undefined,
        DIM3: item.DIM3 || undefined, DIM4: item.DIM4 || undefined, DIM5: item.DIM5 || undefined,
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
      navigate('/procurement/quotation');
    } catch (err) {
      console.error(err);
      alert('Failed to save purchase quotation');
    }
  };

  const isView = mode === 'view';

  if (isLoadingDetails && (mode === 'edit' || mode === 'view')) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const inputCls = `w-full text-xs font-semibold py-2.5 px-3 rounded-xl border outline-none 
    transition-all duration-200 focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500
    bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100
    placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm`;
  const tableInputCls = `w-full text-xs font-bold py-2 px-3 rounded-lg border outline-none 
    transition-all duration-200 focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500
    bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 shadow-sm
    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;

  return (
    <div className="min-h-screen w-full animate-fade-in" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* PAGE HEADER */}
        <div className="rounded-2xl border px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
              <Link to="/dashboard" className="hover:text-primary transition-colors font-medium">Home</Link>
              <span className="opacity-40">/</span>
              <Link to="/procurement/quotation" className="hover:text-primary transition-colors font-medium">Purchase Quotations</Link>
              <span className="opacity-40">/</span>
              <span className="text-primary font-bold">{mode === 'edit' ? 'Edit' : 'New'}</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--color-text)' }}>
                {mode === 'edit' ? 'Modify Purchase Quotation' : 'New Purchase Quotation'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                DRAFT
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/procurement/quotation')}
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
                  : <><Check className="h-3.5 w-3.5" /> Save Quotation</>}
              </button>
            )}
          </div>
        </div>

        {/* BASIC DETAILS */}
        <SectionCard>
          <SectionHeader icon={<Info className="h-3.5 w-3.5" />} title="Quotation Header & Supplier Information" />
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SearchableSelect
                label="Supplier / Vendor *"
                value={custCode}
                onChange={(val, opt) => {
                  const code = String(val);
                  const supp = opt?.raw || suppliersList.find((s: any) => (s.Code || s.code) === code);
                  if (supp) {
                    setCustCode(code);
                    setCustName(supp.Name || supp.name || '');
                    setAddress(supp.Address || supp.address || '');
                  } else {
                    setCustCode(code);
                  }
                }}
                options={supplierOptions}
                placeholder="Select Supplier…"
                modalTitle="Select Supplier / Vendor"
                searchPlaceholder="Search supplier code, name, TIN, address..."
                disabled={isView}
              />
              <div>
                <FieldLabel>Supplier Reference No.</FieldLabel>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. REF-2026-99"
                  value={custRefNo}
                  onChange={e => setCustRefNo(e.target.value)}
                  disabled={isView}
                />
              </div>
              <div>
                <FieldLabel>Posting Date *</FieldLabel>
                <input
                  type="date"
                  className={inputCls}
                  value={postDate}
                  onChange={e => setPostDate(e.target.value)}
                  disabled={isView}
                />
              </div>
              <div>
                <FieldLabel>Valid Until Date</FieldLabel>
                <input
                  type="date"
                  className={inputCls}
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  disabled={isView}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <FieldLabel>Branch Location</FieldLabel>
                <select
                  className={inputCls}
                  value={branchId}
                  onChange={e => setBranchId(e.target.value ? Number(e.target.value) : '')}
                  disabled={isView}
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Select Branch…</option>
                  {branchesList.map((b: any) => (
                    <option key={b.id || b.Branch_id} value={b.id || b.Branch_id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      {b.Branch_name || b.name || `Branch #${b.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Linked Purchase Request</FieldLabel>
                <select
                  className={inputCls}
                  value={purchaseRequestId}
                  onChange={e => {
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
                  disabled={isView}
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">None (Direct Quotation)</option>
                  {(rawRequests || []).map((req: any) => (
                    <option key={req.ID} value={req.ID} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      {req.RequestedNo || req.OrderCode || `PR #${req.ID}`} - {req.CustName || 'Request'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Department</FieldLabel>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. Logistics / Operations"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  disabled={isView}
                />
              </div>
              <div>
                <FieldLabel>Currency &amp; Exchange Rate</FieldLabel>
                <div className="flex gap-2">
                  <select
                    className={inputCls}
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    disabled={isView}
                  >
                    <option value="TZS" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">TZS</option>
                    <option value="USD" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">USD</option>
                    <option value="EUR" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">EUR</option>
                  </select>
                  <input
                    type="number" step="any"
                    className={inputCls + ' w-24 text-right'}
                    value={curRate}
                    onChange={e => setCurRate(Number(e.target.value))}
                    disabled={isView}
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Full Supplier Address</FieldLabel>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Street, City, Country"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  disabled={isView}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ITEMS TABLE */}
        <SectionCard>
          <SectionHeader
            icon={<Package className="h-3.5 w-3.5" />}
            title="Quotation Material Lines & Details"
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
                  <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>No item lines added</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    Click <strong>Add Item Line</strong> or <strong>Catalog Search</strong> to start adding lines to this quotation
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-fade-in">
                <table className="w-full text-left text-xs border-collapse min-w-[1400px]">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-3 w-10 text-center">#</th>
                      <th className="py-3 px-4 min-w-[280px]">Item Name & Code</th>
                      <th className="py-3 px-2 min-w-[100px] w-24 text-center">Qty</th>
                      <th className="py-3 px-2 min-w-[90px] w-20 text-center">UoM</th>
                      <th className="py-3 px-2 min-w-[130px] w-32 text-right">Unit Price</th>
                      <th className="py-3 px-2 min-w-[100px] w-24 text-right">Disc %</th>
                      <th className="py-3 px-2 min-w-[110px] w-28 text-center">VAT</th>
                      <th className="py-3 px-3 min-w-[130px] text-right">Line Tax</th>
                      <th className="py-3 px-3 min-w-[140px] text-right">Line Total</th>
                      <th className="py-3 px-3 min-w-[180px]">Warehouse</th>
                      <th className="py-3 px-3 min-w-[180px]">Cost Center</th>
                      <th className="py-3 px-3 min-w-[180px]">Project</th>
                      <th className="py-3 px-3 min-w-[180px]">Product (DIM1)</th>
                      <th className="py-3 px-3 min-w-[180px]">Location (DIM3)</th>
                      <th className="py-3 px-3 min-w-[180px]">Asset (DIM4)</th>
                      <th className="py-3 px-2 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800/40">
                    {items.map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="py-3 px-3 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>

                        {/* ITEM SELECT */}
                        <td className="py-3 px-4 min-w-[300px]">
                          <SearchableSelect
                            value={line.ItemCode || (line.ItemID ? String(line.ItemID) : '')}
                            onChange={(val, opt) => {
                              if (!val) {
                                handleItemSelect(idx, 0);
                                return;
                              }
                              const rawItem = opt?.raw;
                              if (rawItem) {
                                handleAddItem(rawItem);
                              } else {
                                handleItemSelect(idx, Number(val) || 0);
                              }
                            }}
                            options={itemCatalogOptions}
                            placeholder="Search item code or name..."
                            disabled={isView}
                            size="sm"
                          />
                        </td>

                        {/* QTY */}
                        <td className="py-3 px-2 min-w-[100px]">
                          <input
                            type="number" min="1" step="any"
                            className={tableInputCls + ' text-center font-bold'}
                            value={line.Quantity}
                            onChange={e => handleItemLineChange(idx, 'Quantity', Math.max(0, Number(e.target.value)))}
                            disabled={isView}
                          />
                        </td>

                        {/* UOM */}
                        <td className="py-3 px-2 min-w-[90px]">
                          <input
                            type="text"
                            className={tableInputCls + ' text-center font-semibold'}
                            value={line.UoM || 'pcs'}
                            onChange={e => handleItemLineChange(idx, 'UoM', e.target.value)}
                            disabled={isView}
                          />
                        </td>

                        {/* UNIT PRICE */}
                        <td className="py-3 px-2 min-w-[130px]">
                          <input
                            type="number" min="0" step="any"
                            className={tableInputCls + ' text-right font-bold'}
                            value={line.UnitPrice}
                            onChange={e => handleItemLineChange(idx, 'UnitPrice', Math.max(0, Number(e.target.value)))}
                            disabled={isView}
                          />
                        </td>

                        {/* DISCOUNT % */}
                        <td className="py-3 px-2 min-w-[100px]">
                          <input
                            type="number" min="0" max="100" step="any"
                            className={tableInputCls + ' text-right font-bold'}
                            value={line.DiscPrcnt || 0}
                            onChange={e => handleItemLineChange(idx, 'DiscPrcnt', Math.min(100, Math.max(0, Number(e.target.value))))}
                            disabled={isView}
                          />
                        </td>

                        {/* VAT */}
                        <td className="py-3 px-2 min-w-[110px]">
                          <select
                            className={tableInputCls + ' text-center font-bold'}
                            value={line.VATPer !== undefined ? line.VATPer : 18}
                            onChange={e => handleItemLineChange(idx, 'VATPer', Number(e.target.value))}
                            disabled={isView}
                          >
                            <option value={18} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">18% VAT</option>
                            <option value={9} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">9% VAT</option>
                            <option value={0} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">0% VAT</option>
                            {line.VATPer !== undefined && line.VATPer !== 18 && line.VATPer !== 9 && line.VATPer !== 0 && (
                              <option value={line.VATPer} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{line.VATPer}% VAT</option>
                            )}
                          </select>
                        </td>

                        {/* LINE TAX */}
                        <td className="py-3 px-3 min-w-[130px] text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          {(line.LineTax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        {/* LINE TOTAL */}
                        <td className="py-3 px-3 min-w-[140px] text-right font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                          {(line.LineTotalLC || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        {/* WAREHOUSE */}
                        <td className="py-3 px-3 min-w-[180px]">
                          <select
                            className={tableInputCls}
                            value={line.WhsCode || ''}
                            onChange={e => handleItemLineChange(idx, 'WhsCode', e.target.value ? Number(e.target.value) : undefined)}
                            disabled={isView}
                          >
                            <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Select Warehouse…</option>
                            {line.WhsCode && !warehousesList.some((w: any) => (w.whsCode || w.WhsCode || w.id) === line.WhsCode) && (
                              <option value={line.WhsCode} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Warehouse #{line.WhsCode}</option>
                            )}
                            {warehousesList.map((w: any) => (
                              <option key={w.whsCode || w.WhsCode || w.id} value={w.whsCode || w.WhsCode || w.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                                {w.whsName || w.WhsName || w.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* COST CENTER */}
                        <td className="py-3 px-3 min-w-[180px]">
                          <select
                            className={tableInputCls}
                            value={line.cost_center || ''}
                            onChange={e => handleItemLineChange(idx, 'cost_center', e.target.value ? Number(e.target.value) : undefined)}
                            disabled={isView}
                          >
                            <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Select Cost Center…</option>
                            {line.cost_center && !costCentersList.some((c: any) => (c.code || c.PrcCode || c.id) === line.cost_center) && (
                              <option value={line.cost_center} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Cost Center #{line.cost_center}</option>
                            )}
                            {costCentersList.map((c: any) => (
                              <option key={c.code || c.PrcCode || c.id} value={c.code || c.PrcCode || c.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                                {c.name || c.PrcName || c.code}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* PROJECT */}
                        <td className="py-3 px-3 min-w-[180px]">
                          <select
                            className={tableInputCls}
                            value={line.project || ''}
                            onChange={e => handleItemLineChange(idx, 'project', e.target.value)}
                            disabled={isView}
                          >
                            <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Select Project…</option>
                            {line.project && !projectsList.some((p: any) => (p.code || p.PrjCode) === line.project) && (
                              <option value={line.project} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{line.project}</option>
                            )}
                            {projectsList.map((p: any) => (
                              <option key={p.code || p.PrjCode || p.id} value={p.code || p.PrjCode} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                                {p.name || p.PrjName || p.code}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* PRODUCT (DIM1) */}
                        <td className="py-3 px-3 min-w-[180px]">
                          <select
                            className={tableInputCls}
                            value={line.DIM1 || ''}
                            onChange={e => handleItemLineChange(idx, 'DIM1', e.target.value)}
                            disabled={isView}
                          >
                            <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Select Product…</option>
                            {line.DIM1 && !productsList.some((p: any) => p.code === line.DIM1) && (
                              <option value={line.DIM1} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{line.DIM1}</option>
                            )}
                            {productsList.map((p: any) => (
                              <option key={p.code} value={p.code} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{p.code} — {p.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* LOCATION (DIM3) */}
                        <td className="py-3 px-3 min-w-[180px]">
                          <select
                            className={tableInputCls}
                            value={line.DIM3 || ''}
                            onChange={e => handleItemLineChange(idx, 'DIM3', e.target.value)}
                            disabled={isView}
                          >
                            <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Select Location…</option>
                            {line.DIM3 && !locationsList.some((l: any) => l.code === line.DIM3) && (
                              <option value={line.DIM3} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{line.DIM3}</option>
                            )}
                            {locationsList.map((l: any) => (
                              <option key={l.code} value={l.code} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{l.code} — {l.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* ASSET (DIM4) */}
                        <td className="py-3 px-3 min-w-[180px]">
                          <select
                            className={tableInputCls}
                            value={line.DIM4 || ''}
                            onChange={e => handleItemLineChange(idx, 'DIM4', e.target.value)}
                            disabled={isView}
                          >
                            <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Select Asset…</option>
                            {line.DIM4 && !assetsList.some((a: any) => a.code === line.DIM4) && (
                              <option value={line.DIM4} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{line.DIM4}</option>
                            )}
                            {assetsList.map((a: any) => (
                              <option key={a.code} value={a.code} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{a.code} — {a.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* ACTION */}
                        <td className="py-3 px-2 w-12 text-center">
                          {!isView && (
                            <button
                              type="button"
                              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:scale-110 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              onClick={() => handleRemoveItemLine(idx)}
                              title="Delete Row"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </SectionCard>

        {/* BOTTOM ROW: REMARKS & ATTACHMENTS | FINANCIAL SUMMARY */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 space-y-5">
            {/* Remarks */}
            <SectionCard>
              <SectionHeader icon={<Info className="h-3.5 w-3.5" />} title="Remarks & Terms" />
              <div className="p-5">
                <textarea
                  rows={3}
                  className="w-full text-xs resize-none py-2.5 px-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                  placeholder="Add quotation remarks, payment terms, or delivery conditions…"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  disabled={isView}
                />
              </div>
            </SectionCard>

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
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${isUploading
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
                      {isUploading ? 'Uploading files...' : 'Click or drop quotation documents here to upload'}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider font-semibold mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      PDF · JPG · PNG · DOC · XLSX · Max 10 MB
                    </p>
                  </div>
                )}

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
                      No attachments attached to this purchase quotation.
                    </p>
                  )
                )}
              </div>
            </SectionCard>
          </div>

          {/* FINANCIAL SUMMARY */}
          <div className="xl:col-span-1">
            <div
              className="rounded-2xl border overflow-hidden shadow-sm sticky top-5"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <div className="px-5 py-3.5 border-b flex items-center gap-2" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-hover)' }}>
                <DollarSign className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>
                  Quotation Financial Summary
                </span>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Subtotal (before tax)</span>
                  <span className="text-xs font-bold font-mono" style={{ color: 'var(--color-text)' }}>
                    {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                    Header Discount (%)
                  </span>
                  <input
                    type="number" min="0" max="100"
                    className="w-20 text-right text-xs font-bold font-mono py-1.5 px-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 shadow-sm"
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
                      className="w-24 text-right text-xs font-bold font-mono py-1.5 px-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 shadow-sm"
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
                      className="w-24 text-right text-xs font-bold font-mono py-1.5 px-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 shadow-sm"
                      value={freightAmount}
                      onChange={e => setFreightAmount(Number(e.target.value))}
                      disabled={isView}
                    />
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Tax (VAT)</span>
                  <span className="text-xs font-bold font-mono" style={{ color: 'var(--color-text)' }}>
                    {totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="rounded-xl p-4 space-y-1" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-200">Total Quotation Value</p>
                  <p className="text-2xl font-extrabold text-white font-mono leading-none">
                    {finalDocTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[9px] text-emerald-100 font-semibold">
                    Currency: {currency} · System Valuation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                onClick={() => setIsVendorModalOpen(false)}
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
              {suppliersList.filter((supp: any) => {
                const code = (supp.Code || supp.code || supp.cardCode || supp.CardCode || '').toLowerCase();
                const name = (supp.Name || supp.name || supp.cardName || supp.CardName || '').toLowerCase();
                const address = (supp.Address || supp.address || '').toLowerCase();
                const tin = (supp.TIN || supp.tin || '').toLowerCase();
                const q = vendorSearch.toLowerCase();
                return code.includes(q) || name.includes(q) || address.includes(q) || tin.includes(q);
              }).length > 0 ? (
                suppliersList.filter((supp: any) => {
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

export default PurchaseQuotationFormPage;
