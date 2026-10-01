import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Info,
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
  Plus,
  Receipt
} from 'lucide-react';
import {
  useCreateApInvoice,
  useUpdateApInvoice,
  useApInvoice,
  type ApInvoiceItem,
  type ApInvoiceInput
} from './api/useApInvoices';
import { usePurchaseOrders, type PurchaseOrder } from '../purchase-orders/api/usePurchaseOrders';
import { useGoodsReceipts, type GoodsReceipt } from '../goods-receipts/api/useGoodsReceipts';
import api, { getAttachmentUrl, getFileName } from '../../../lib/api';
import { useRetailers } from '../../customers/api/useRetailers';
import {
  PAYMENT_TERMS_OPTIONS,
  TAX_CODE_OPTIONS,
  formatItemCatalogOption,
  renderItemOption,
  formatVendorOption,
  renderVendorOption,
  validateDiscountPercent,
} from '../procurementConstants';
import { useItems } from '../../items/api/useItems';
import { useProjects, useWarehouses, useCostCentersMain, useBranches, useAccounts } from '../../users/api/useMasterData';
import {
  Button,
  Spinner,
  SearchableSelect,
  VendorSelect,
  WarehouseSelect,
  ProjectSelect,
  TaxSelect,
  GLAccountSelect,
  PaymentTermsSelect,
  StageSelect,
  CostCenterSelect,
  BranchSelect,
  type SearchableSelectOption,
} from '../../../components/ui';

interface APInvoiceFormPageProps {
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
    className={`rounded-2xl border border-slate-200/80 dark:border-slate-700/80 glass-card bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden ${className}`}
  >
    {children}
  </div>
);

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; right?: React.ReactNode }> = ({
  icon,
  title,
  right
}) => (
  <div
    className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/60 backdrop-blur-sm"
  >
    <div className="flex items-center gap-2.5">
      <span className="text-teal-600 dark:text-teal-400">{icon}</span>
      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">
        {title}
      </span>
    </div>
    {right && <div>{right}</div>}
  </div>
);

export const APInvoiceFormPage: React.FC<APInvoiceFormPageProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numericId = id ? parseInt(id, 10) : null;

  // Master Data hooks
  const { data: suppliersResponse = [] } = useRetailers({ cardType: 'S', aprStatus: 'Y' });
  const { data: projectsResponse } = useProjects();
  const { data: warehousesResponse } = useWarehouses();
  const { data: costCentersResponse } = useCostCentersMain();
  const { data: branchesResponse } = useBranches();
  const { data: accountsResponse } = useAccounts();
  const { data: itemsCatalogResponse } = useItems({ limit: 500 });

  // PO & GRPO lists for Copy functionality
  const { data: rawPurchaseOrders } = usePurchaseOrders({});
  const { data: rawGoodsReceipts } = useGoodsReceipts({});

  const suppliersList = Array.isArray(suppliersResponse) ? suppliersResponse : (suppliersResponse as any)?.data || [];
  const accountsList = accountsResponse?.data || [];
  const projectsList = Array.isArray(projectsResponse) ? projectsResponse : (projectsResponse as any)?.data || [];
  const warehousesList = Array.isArray(warehousesResponse) ? warehousesResponse : (warehousesResponse as any)?.data || [];
  const costCentersList = Array.isArray(costCentersResponse) ? costCentersResponse : (costCentersResponse as any)?.data || [];
  const branchesList = Array.isArray(branchesResponse) ? branchesResponse : (branchesResponse as any)?.data || [];
  const catalogItemsList = (itemsCatalogResponse as any)?.items || (Array.isArray(itemsCatalogResponse) ? itemsCatalogResponse : (itemsCatalogResponse as any)?.data) || [];
  const itemCatalogOptions: SearchableSelectOption[] = useMemo(() => {
    return catalogItemsList.map(formatItemCatalogOption);
  }, [catalogItemsList]);

  const projectStagesList = useMemo(() => {
    return costCentersList.filter((cc: any) => cc.dimCode === 1);
  }, [costCentersList]);

  const projectSubStagesList = useMemo(() => {
    return costCentersList.filter((cc: any) => cc.dimCode === 2);
  }, [costCentersList]);

  const detailSubStagesList = useMemo(() => {
    return costCentersList.filter((cc: any) => cc.dimCode === 3);
  }, [costCentersList]);

  const moreDetailSubStagesList = useMemo(() => {
    return costCentersList.filter((cc: any) => cc.dimCode === 4);
  }, [costCentersList]);

  const purchaseOrdersList: PurchaseOrder[] = useMemo(() => {
    return Array.isArray(rawPurchaseOrders) ? rawPurchaseOrders : (rawPurchaseOrders as any)?.data || [];
  }, [rawPurchaseOrders]);

  const goodsReceiptsList: GoodsReceipt[] = useMemo(() => {
    return Array.isArray(rawGoodsReceipts) ? rawGoodsReceipts : (rawGoodsReceipts as any)?.data || [];
  }, [rawGoodsReceipts]);

  const currencyOptions: SearchableSelectOption[] = [
    { value: 'TZS', label: 'TZS - Tanzanian Shilling', badge: 'TZS' },
    { value: 'USD', label: 'USD - US Dollar', badge: 'USD' },
    { value: 'EUR', label: 'EUR - Euro', badge: 'EUR' },
    { value: 'KES', label: 'KES - Kenyan Shilling', badge: 'KES' },
  ];

  const requestTypeOptions: SearchableSelectOption[] = [
    { value: 'Direct', label: 'Direct' },
    { value: 'Base Document', label: 'Base Document' },
  ];

  const typeRequestOptions: SearchableSelectOption[] = [
    { value: 'Item', label: 'Item (Products/Materials)', badge: 'Item' },
    { value: 'Service', label: 'Service (Service Lines)', badge: 'Service' },
  ];

  const typePaymentOptions: SearchableSelectOption[] = [
    { value: 'Cash', label: 'Cash Payment' },
    { value: 'Credit', label: 'Credit' },
    { value: 'Bank Transfer', label: 'Bank Wire Transfer' },
    { value: 'Cheque', label: 'Cheque' },
  ];

  // Modals state
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState('');

  // Copy from PO modal state
  const [isCopyPoModalOpen, setIsCopyPoModalOpen] = useState(false);
  const [poSearch, setPoSearch] = useState('');
  const [selectedPoForCopy, setSelectedPoForCopy] = useState<any | null>(null);
  const [selectedPoItemIds, setSelectedPoItemIds] = useState<number[]>([]);

  // Copy from GRPO modal state
  const [isCopyGrpoModalOpen, setIsCopyGrpoModalOpen] = useState(false);
  const [grpoSearch, setGrpoSearch] = useState('');
  const [selectedGrpoForCopy, setSelectedGrpoForCopy] = useState<any | null>(null);
  const [selectedGrpoItemIds, setSelectedGrpoItemIds] = useState<number[]>([]);

  // Existing Invoice for edit/view
  const { data: existingInvoice, isLoading: isLoadingExisting } = useApInvoice(numericId);
  const createMutation = useCreateApInvoice();
  const updateMutation = useUpdateApInvoice();

  // Form State
  const [custCode, setCustCode] = useState('');
  const [custName, setCustName] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [requestedNo, setRequestedNo] = useState('');
  const [purchaseOrder, setPurchaseOrder] = useState('');
  const [relationFrom, setRelationFrom] = useState('');
  const [postDate, setPostDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
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
  const [isRounding, setIsRounding] = useState<boolean>(false);
  const [roundingAmnt, setRoundingAmnt] = useState<number>(0);

  const [items, setItems] = useState<ApInvoiceItem[]>([]);
  const [attachments, setAttachments] = useState<{ id?: number; LineNum: number; Attachment: string }[]>([]);

  const supplierOptions: SearchableSelectOption[] = useMemo(() => {
    return suppliersList.map(formatVendorOption);
  }, [suppliersList]);

  // Populate data in edit/view mode
  useEffect(() => {
    if (existingInvoice && (mode === 'edit' || mode === 'view')) {
      setCustCode(existingInvoice.CustCode || '');
      setCustName(existingInvoice.CustName || '');
      setOrderCode(existingInvoice.OrderCode || '');
      setRequestedNo(existingInvoice.RequestedNo || '');
      setPurchaseOrder(existingInvoice.purchaseOrder || '');
      setRelationFrom(existingInvoice.relation_from || '');
      setPostDate(existingInvoice.PostDate ? new Date(existingInvoice.PostDate).toISOString().split('T')[0] : '');
      setDueDate(existingInvoice.DueDate ? new Date(existingInvoice.DueDate).toISOString().split('T')[0] : '');
      setPoDate(existingInvoice.PODate ? new Date(existingInvoice.PODate).toISOString().split('T')[0] : '');
      setCurrency(existingInvoice.Currency || 'TZS');
      setBranchId(existingInvoice.Branch_id || '');
      setRequestType(existingInvoice.RequestType || 'Direct');
      setTypeRequest(existingInvoice.TypeRequest || 'Item');
      setTypePayment(existingInvoice.TypePayment || 'Cash');
      setDepartment(existingInvoice.Department || '');
      setExpenseType(existingInvoice.ExpenseType || '');
      setRemarks(existingInvoice.Remarks || '');
      setDiscPrcnt(Number(existingInvoice.DiscPrcnt || 0));
      setFreight(Number(existingInvoice.Freight || 0));
      setIsRounding(existingInvoice.Rounding === 'Y');
      setRoundingAmnt(Number(existingInvoice.RoundingAmnt || 0));

      if (existingInvoice.items && existingInvoice.items.length > 0) {
        setItems(
          existingInvoice.items.map((it: any, idx: number) => {
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

      if (existingInvoice.attachments && existingInvoice.attachments.length > 0) {
        setAttachments(existingInvoice.attachments);
      }
    }
  }, [existingInvoice, mode]);

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
    return subtotal - totalDiscount + totalTax + Number(freight || 0) + (isRounding ? Number(roundingAmnt || 0) : 0);
  }, [subtotal, totalDiscount, totalTax, freight, roundingAmnt]);

  // Row operations
  const handleUpdateItemRow = (index: number, field: keyof ApInvoiceItem, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      let processedValue = value;
      if (field === 'DiscPrcnt' || (field as any) === 'Discount') {
        if (value === '' || value === undefined || value === null) {
          processedValue = '';
        } else {
          processedValue = validateDiscountPercent(Number(value));
        }
      }
      const item = { ...updated[index], [field]: processedValue };

      const qty = Number(item.Quantity) || 0;
      const delQty = Number(field === 'DeliveredQty' ? processedValue : item.DeliveredQty !== undefined ? item.DeliveredQty : qty) || 0;
      const price = Number(field === 'UnitPrice' ? processedValue : item.UnitPrice) || 0;
      const disc = Number((field === 'DiscPrcnt' || (field as any) === 'Discount') ? processedValue : item.DiscPrcnt) || 0;
      const vatPer = Number(field === 'VATPer' ? processedValue : item.VATPer) || 0;

      const lineTotalBefDisc = delQty * price;
      const lineTotalAfterDisc = lineTotalBefDisc * (1 - disc / 100);
      const lineTax = lineTotalAfterDisc * (vatPer / 100);
      const lineTotalLC = lineTotalAfterDisc + lineTax;

      item.LineTax = lineTax;
      item.LineTotalLC = lineTotalLC;

      updated[index] = item;
      return updated;
    });
  };

  const handleAddServiceLine = () => {
    const newItem: ApInvoiceItem = {
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
      VendorCode: custCode || '',
      VendorName: custName || '',
      TaxCode: 'VAT_18',
      PaymentTerms: 'Net 30 Days',
      po_id: 'Net 30 Days',
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleAddItemLine = () => {
    const newItem: ApInvoiceItem = {
      LineNum: items.length + 1,
      ItemID: 0,
      ItemCode: '',
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
      UoM: 'pcs',
      vendor: custCode || '',
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleSelectCatalogItem = (itm: any) => {
    const newItem: ApInvoiceItem = {
      LineNum: items.length + 1,
      ItemID: itm.ID || itm.id || 0,
      ItemCode: itm.Code || itm.code || '',
      ItemName: itm.Name || itm.name || '',
      Quantity: 1,
      DeliveredQty: 1,
      UnitPrice: Number(itm.LastPurPrc || itm.price || 0),
      DiscPrcnt: 0,
      VATCode: 'VAT_18',
      VATPer: 18,
      LineTax: (Number(itm.LastPurPrc || itm.price || 0)) * 0.18,
      LineTotalLC: (Number(itm.LastPurPrc || itm.price || 0)) * 1.18,
      WhsCode: itm.DfltWhsID || undefined,
      UoM: itm.UoM || 'pcs',
      Remarks: '',
    };
    setItems(prev => [...prev, newItem]);
    setIsItemModalOpen(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev =>
      prev.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, LineNum: idx + 1 }))
    );
  };

  const handleSelectVendorFromModal = (supp: any) => {
    const code = supp.Code || supp.code || supp.cardCode || supp.CardCode || '';
    const name = supp.Name || supp.name || supp.cardName || supp.CardName || '';
    setCustCode(code);
    setCustName(name);
    setIsVendorModalOpen(false);
  };

  // ─── COPY FROM PURCHASE ORDER HANDLER ───
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

    setCustCode(selectedPoForCopy.CustCode || '');
    setCustName(selectedPoForCopy.CustName || '');
    setPurchaseOrder(selectedPoForCopy.OrderCode || selectedPoForCopy.RequestedNo || String(selectedPoForCopy.ID));
    setRelationFrom(`PO #${selectedPoForCopy.OrderCode || selectedPoForCopy.ID}`);
    if (selectedPoForCopy.Currency) setCurrency(selectedPoForCopy.Currency);
    if (selectedPoForCopy.Branch_id) setBranchId(Number(selectedPoForCopy.Branch_id));
    if (selectedPoForCopy.Department) setDepartment(selectedPoForCopy.Department);
    if (selectedPoForCopy.ExpenseType) setExpenseType(selectedPoForCopy.ExpenseType);
    if (selectedPoForCopy.TypeRequest) setTypeRequest(selectedPoForCopy.TypeRequest);

    const sourceItems = (selectedPoForCopy.items || []).filter((_: any, idx: number) =>
      selectedPoItemIds.includes(idx)
    );

    const convertedItems: ApInvoiceItem[] = sourceItems.map((it: any, idx: number) => {
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

  // ─── COPY FROM GRPO HANDLER ───
  const handleOpenCopyGrpoModal = () => {
    setSelectedGrpoForCopy(null);
    setSelectedGrpoItemIds([]);
    setIsCopyGrpoModalOpen(true);
  };

  const handleSelectGrpo = async (grpo: any) => {
    let fullGrpo = grpo;
    if (!grpo.items || grpo.items.length === 0) {
      try {
        const res = await api.get(`/goods-receipts/${grpo.ID || grpo.id}`);
        if (res.data?.data) {
          fullGrpo = res.data.data;
        }
      } catch (e) {
        console.error('Failed to fetch full GRPO details:', e);
      }
    }
    setSelectedGrpoForCopy(fullGrpo);
    const itemIds = (fullGrpo.items || []).map((_: any, idx: number) => idx);
    setSelectedGrpoItemIds(itemIds);
  };

  const handleToggleGrpoItem = (idx: number) => {
    setSelectedGrpoItemIds(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleApplyGrpoCopy = (replaceExisting: boolean = true) => {
    if (!selectedGrpoForCopy) return;

    setCustCode(selectedGrpoForCopy.CustCode || '');
    setCustName(selectedGrpoForCopy.CustName || '');
    setPurchaseOrder(selectedGrpoForCopy.purchaseOrder || selectedGrpoForCopy.OrderCode || String(selectedGrpoForCopy.ID));
    setRequestedNo(selectedGrpoForCopy.RequestedNo || '');
    setRelationFrom(`GRPO #${selectedGrpoForCopy.OrderCode || selectedGrpoForCopy.ID}`);
    if (selectedGrpoForCopy.Currency) setCurrency(selectedGrpoForCopy.Currency);
    if (selectedGrpoForCopy.Branch_id) setBranchId(Number(selectedGrpoForCopy.Branch_id));
    if (selectedGrpoForCopy.Department) setDepartment(selectedGrpoForCopy.Department);
    if (selectedGrpoForCopy.ExpenseType) setExpenseType(selectedGrpoForCopy.ExpenseType);
    if (selectedGrpoForCopy.TypeRequest) setTypeRequest(selectedGrpoForCopy.TypeRequest);

    const sourceItems = (selectedGrpoForCopy.items || []).filter((_: any, idx: number) =>
      selectedGrpoItemIds.includes(idx)
    );

    const convertedItems: ApInvoiceItem[] = sourceItems.map((it: any, idx: number) => {
      const qty = Number(it.DeliveredQty !== undefined ? it.DeliveredQty : it.Quantity || 1);
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
        vendor: it.vendor || selectedGrpoForCopy.CustCode || '',
        SourceDocId: String(selectedGrpoForCopy.ID),
        SourceLineNum: it.LineNum || idx + 1,
        SourceDocType: 'GRPO'
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

    setIsCopyGrpoModalOpen(false);
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
        const { data } = await api.post('/upload/file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const fileUrl = data?.data?.path || data?.path || data?.url || data?.file;
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
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    if (!custCode) {
      alert('Please select a Supplier/Vendor');
      return;
    }

    if (items.length === 0) {
      alert(typeRequest === 'Service' ? 'Please add at least one service line' : 'Please copy or add items to the AP invoice');
      return;
    }

    if (typeRequest === 'Service') {
      if (items.some(item => !item.ItemName && !item.Remarks)) {
        alert('Please enter a service description for all service lines');
        return;
      }
    } else {
      if (items.some(item => !item.ItemID && !item.ItemName)) {
        alert('Please select or specify a valid item for all lines');
        return;
      }
    }

    const payload: ApInvoiceInput = {
      CustCode: custCode,
      CustName: custName || null,
      OrderCode: orderCode || undefined,
      RequestedNo: requestedNo || undefined,
      purchaseOrder: purchaseOrder || undefined,
      relation_from: relationFrom || undefined,
      PostDate: postDate || undefined,
      DueDate: dueDate || undefined,
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
      Rounding: isRounding ? 'Y' : 'N',
      RoundingAmnt: isRounding ? Number(roundingAmnt || 0) : undefined,
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
        vendor: item.vendor || item.VendorCode || custCode || undefined,
        vendorRef: item.GLCode || item.vendorRef || undefined,
        po_id: item.PaymentTerms || item.po_id || undefined,
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
      navigate('/procurement/ap-invoice');
    } catch (err: any) {
      console.error('Failed to save AP Invoice:', err);
      alert(err.response?.data?.message || 'Failed to save AP Invoice');
    }
  };

  if (isLoadingExisting && numericId) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner className="w-8 h-8 text-teal-600" />
      </div>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  const inputCls = `w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-xs`;

  return (
    <div className="p-4 space-y-4 w-full max-w-full animate-fade-in">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Link to="/dashboard" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium">Home</Link>
            <span className="opacity-40">/</span>
            <Link to="/procurement/ap-invoice" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium">A/P Invoices</Link>
            <span className="opacity-40">/</span>
            <span className="text-teal-600 dark:text-teal-400 font-bold">{mode === 'edit' ? 'Edit' : 'New'}</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              {mode === 'edit'
                ? `Modify AP Invoice #${existingInvoice?.OrderCode || numericId}`
                : 'Create New AP Invoice'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
              {mode === 'edit' ? (existingInvoice?.Status || 'DRAFT') : 'DRAFT'}
            </span>
          </div>
          <p className="text-xs mt-0.5 text-slate-500 dark:text-slate-400">
            Accounts Payable vendor invoice voucher with PO &amp; Goods Receipt (GRPO) imports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/procurement/ap-invoice')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all hover:scale-95 active:scale-90"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
            {mode !== 'view' && (
              <>
                <button
                  type="button"
                  onClick={handleOpenCopyPoModal}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-all shadow-xs"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy From PO
                </button>
                <button
                  type="button"
                  onClick={handleOpenCopyGrpoModal}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all shadow-xs"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy From GRPO
                </button>
                <button
                  type="submit"
                  form="ap-invoice-form"
                  onClick={() => handleSubmit()}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-95 active:scale-90 disabled:opacity-60 shadow-md shadow-emerald-500/20"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  {isPending ? (
                    <Spinner size="sm" />
                  ) : (
                    <><Check className="h-3.5 w-3.5" /> {mode === 'edit' ? 'Update Invoice' : 'Save Invoice'}</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        <form id="ap-invoice-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Header Information Card */}
          <SectionCard>
            <SectionHeader icon={<Info className="w-4 h-4" />} title="Header & Supplier Information" />
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <FieldLabel>Vendor / Supplier *</FieldLabel>
                    {mode !== 'view' && (
                      <button
                        type="button"
                        onClick={() => setIsVendorModalOpen(true)}
                        className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Search className="w-2.5 h-2.5" /> Advanced Search
                      </button>
                    )}
                  </div>
                  <VendorSelect
                    value={custCode}
                    data={suppliersList}
                    onChange={(val, supp) => {
                      setCustCode(val);
                      if (supp) {
                        setCustName(supp.Name || supp.name || supp.cardName || supp.CardName || '');
                      }
                    }}
                    disabled={mode === 'view'}
                  />
                </div>

                <div>
                  <FieldLabel>Invoice No / Order Code</FieldLabel>
                  <input
                    type="text"
                    value={orderCode}
                    onChange={e => setOrderCode(e.target.value)}
                    disabled={mode === 'view'}
                    placeholder="Auto-generated if empty"
                    className={inputCls}
                  />
                </div>

                <div>
                  <FieldLabel>Posting Date *</FieldLabel>
                  <input
                    type="date"
                    value={postDate}
                    onChange={e => setPostDate(e.target.value)}
                    disabled={mode === 'view'}
                    required
                    className={inputCls}
                  />
                </div>

                <div>
                  <FieldLabel>Due Date *</FieldLabel>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    disabled={mode === 'view'}
                    required
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <BranchSelect
                    label="Branch Location"
                    value={branchId}
                    data={branchesList}
                    onChange={val => setBranchId(val ? Number(val) : '')}
                    disabled={mode === 'view'}
                    placeholder="Select Branch..."
                  />
                </div>

                <div>
                  <FieldLabel>Base Doc Reference</FieldLabel>
                  <input
                    type="text"
                    value={purchaseOrder || requestedNo || relationFrom}
                    onChange={e => setPurchaseOrder(e.target.value)}
                    disabled={mode === 'view'}
                    placeholder="e.g. PO26/104 or GR26/89"
                    className={inputCls}
                  />
                </div>

                <div>
                  <FieldLabel>Document Date</FieldLabel>
                  <input
                    type="date"
                    value={poDate}
                    onChange={e => setPoDate(e.target.value)}
                    disabled={mode === 'view'}
                    className={inputCls}
                  />
                </div>

                <div>
                  <SearchableSelect
                    label="Currency"
                    value={currency}
                    options={currencyOptions}
                    onChange={val => setCurrency(String(val || 'TZS'))}
                    disabled={mode === 'view'}
                    clearable={false}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <SearchableSelect
                    label="Request Type"
                    value={requestType}
                    options={requestTypeOptions}
                    onChange={val => setRequestType(String(val || 'Direct'))}
                    disabled={mode === 'view'}
                    clearable={false}
                  />
                </div>

                <div>
                  <SearchableSelect
                    label="Type Request *"
                    value={typeRequest}
                    options={typeRequestOptions}
                    onChange={val => {
                      const strVal = String(val || 'Item');
                      setTypeRequest(strVal);
                      if (strVal === 'Service' && items.length === 0) {
                        handleAddServiceLine();
                      }
                    }}
                    disabled={mode === 'view'}
                    clearable={false}
                  />
                </div>

                <div>
                  <SearchableSelect
                    label="Payment Terms / Type"
                    value={typePayment}
                    options={typePaymentOptions}
                    onChange={val => setTypePayment(String(val || 'Cash'))}
                    disabled={mode === 'view'}
                    clearable={false}
                  />
                </div>

                <div>
                  <FieldLabel>Department</FieldLabel>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    disabled={mode === 'view'}
                    placeholder="e.g. Accounts, Finance"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <FieldLabel>Expense Type</FieldLabel>
                  <input
                    type="text"
                    value={expenseType}
                    onChange={e => setExpenseType(e.target.value)}
                    disabled={mode === 'view'}
                    placeholder="e.g. Operating Expense"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

        {/* Items / Service Lines Section */}
        <SectionCard>
          <SectionHeader
            icon={<Package className="w-4 h-4" />}
            title={typeRequest === 'Service' ? 'AP Invoice Service Lines' : 'AP Invoice Material Items'}
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleOpenCopyGrpoModal}
                    className="text-[11px] h-7 px-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy From GRPO
                  </Button>
                  {typeRequest === 'Service' ? (
                    <Button
                      type="button"
                      onClick={handleAddServiceLine}
                      className="text-[11px] h-7 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3 h-3" />
                      Add Service Line
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        onClick={handleAddItemLine}
                        className="text-[11px] h-7 px-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3 h-3" />
                        Add Item Line
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsItemModalOpen(true)}
                        className="text-[11px] h-7 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 flex items-center gap-1"
                      >
                        <Search className="w-3 h-3" />
                        Catalog Search
                      </Button>
                    </>
                  )}
                </div>
              )
            }
          />

          <div className="p-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl gap-3 bg-slate-50/40 dark:bg-slate-900/20">
                <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <Package className="h-6 w-6" />
                </div>
                <div className="text-center max-w-sm">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {typeRequest === 'Service' ? 'No service lines added' : 'No items added'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {typeRequest === 'Service'
                      ? 'Click "Add Service Line" to describe services/fees, or use "Copy From PO" / "Copy From GRPO" to import lines.'
                      : 'Click "Copy From PO" or "Copy From GRPO" to import items, or click "Add Item Line" to add items directly.'}
                  </p>
                </div>
                {mode !== 'view' && (
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                    <Button
                      type="button"
                      onClick={handleOpenCopyPoModal}
                      className="text-xs h-8 px-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-sm flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy From PO
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOpenCopyGrpoModal}
                      className="text-xs h-8 px-3.5 rounded-xl font-semibold shadow-sm flex items-center gap-1.5 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy From GRPO
                    </Button>
                    {typeRequest === 'Service' ? (
                      <Button
                        type="button"
                        onClick={handleAddServiceLine}
                        className="text-xs h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Service Line
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          onClick={handleAddItemLine}
                          className="text-xs h-8 px-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-sm flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Item Line
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsItemModalOpen(true)}
                          className="text-xs h-8 px-3.5 rounded-xl font-semibold shadow-sm flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600"
                        >
                          <Search className="w-3.5 h-3.5" />
                          Catalog Search
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : typeRequest === 'Service' ? (
              /* ─── SERVICE INVOICE TABLE ─── */
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm animate-fade-in">
                <table className="w-full text-left border-collapse min-w-[2200px]">
                  <thead>
                    <tr className="bg-slate-100/60 dark:bg-slate-900/60 backdrop-blur-sm text-slate-800 dark:text-slate-200 font-bold uppercase text-[9px] tracking-widest border-b border-slate-200/80 dark:border-slate-700/80">
                      {[
                        '#', 'VENDOR', 'DESCRIPTION *', 'GL CODE', 'TOTAL (EXCLUSIVE)',
                        'TAX CODE', 'DISCOUNT', 'TAX AMOUNT', 'TOTAL (INCLUSIVE)', 'PAYMENT TERMS',
                        'PROJECT', 'PROJECT STAGE', 'PROJECT SUB STAGE',
                        'DETAIL SUB STAGE', 'MORE DETAIL SUB STAGE', ...(mode !== 'view' ? ['ACTION'] : [])
                      ].map((h, i) => (
                        <th
                          key={i}
                          className="py-3 px-3 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap text-slate-600 dark:text-slate-300"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60 bg-transparent">
                    {items.map((line, idx) => {
                        const amountBeforeTax = Number(line.UnitPrice || 0) * (1 - Number(line.DiscPrcnt || 0) / 100);
                        return (
                          <tr
                            key={idx}
                            className="border-b transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-700/30"
                          >
                            {/* # */}
                            <td className="py-2.5 px-3 w-[45px] text-center font-bold text-slate-500 font-mono text-[11px]">
                              {idx + 1}
                            </td>

                            {/* VENDOR */}
                            <td className="py-2.5 px-2 min-w-[210px]">
                              <VendorSelect
                                size="sm"
                                data={suppliersList}
                                value={line.vendor || line.VendorCode || ''}
                                onChange={(selectedVendorCode, supp) => {
                                  handleUpdateItemRow(idx, 'vendor', selectedVendorCode);
                                  handleUpdateItemRow(idx, 'VendorCode' as any, selectedVendorCode);
                                  if (supp) {
                                    handleUpdateItemRow(idx, 'VendorName' as any, supp.Name || supp.name);
                                    if (supp.PaymentTerms && !line.PaymentTerms) {
                                      handleUpdateItemRow(idx, 'PaymentTerms' as any, supp.PaymentTerms);
                                      handleUpdateItemRow(idx, 'po_id', supp.PaymentTerms);
                                    }
                                  }
                                }}
                                disabled={mode === 'view'}
                              />
                            </td>

                            {/* SERVICE DESCRIPTION */}
                            <td className="py-2.5 px-2 min-w-[260px]">
                              <input
                                type="text"
                                placeholder="Describe service / fee / contract details..."
                                className="w-full text-xs font-semibold py-2 px-3 rounded-lg border outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 shadow-sm focus:ring-2 focus:ring-teal-500"
                                value={line.ItemName || line.Remarks || ''}
                                onChange={e => {
                                  handleUpdateItemRow(idx, 'ItemName', e.target.value);
                                  handleUpdateItemRow(idx, 'Remarks', e.target.value);
                                }}
                                disabled={mode === 'view'}
                              />
                            </td>

                            {/* GL CODE */}
                            <td className="py-2.5 px-2 min-w-[220px]">
                              <GLAccountSelect
                                size="sm"
                                data={accountsList}
                                value={line.GLCode || line.vendorRef || ''}
                                onChange={(val, acct) => {
                                  handleUpdateItemRow(idx, 'GLCode' as any, val);
                                  handleUpdateItemRow(idx, 'vendorRef', val);
                                  if (acct) {
                                    handleUpdateItemRow(idx, 'GLName' as any, acct.acctName || acct.name);
                                  }
                                }}
                                disabled={mode === 'view'}
                              />
                            </td>

                            {/* AMOUNT / FEE */}
                            <td className="py-2.5 px-2 w-[150px]">
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                className="w-full h-9 px-2.5 text-xs font-bold font-mono text-right bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-xs outline-none transition-all duration-150 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                                value={line.UnitPrice === 0 ? '0' : (line.UnitPrice ?? '')}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                    handleUpdateItemRow(idx, 'UnitPrice', val);
                                    handleUpdateItemRow(idx, 'TotalExclusive' as any, val);
                                    handleUpdateItemRow(idx, 'Quantity', 1);
                                    handleUpdateItemRow(idx, 'DeliveredQty', 1);
                                  }
                                }}
                                onBlur={() => {
                                  const p = line.UnitPrice === '' || isNaN(Number(line.UnitPrice)) ? 0 : Number(line.UnitPrice);
                                  handleUpdateItemRow(idx, 'UnitPrice', p);
                                  handleUpdateItemRow(idx, 'TotalExclusive' as any, p);
                                }}
                                disabled={mode === 'view'}
                              />
                            </td>

                            {/* TAX CODE */}
                            <td className="py-2.5 px-2 w-[160px]">
                              <TaxSelect
                                size="sm"
                                value={line.VATCode || 'VAT_18'}
                                onChange={code => {
                                  const rate = code === 'VAT_18' ? 18 : code === 'VAT_10' ? 10 : 0;
                                  handleUpdateItemRow(idx, 'VATCode', code);
                                  handleUpdateItemRow(idx, 'TaxCode' as any, code);
                                  handleUpdateItemRow(idx, 'VATPer', rate);
                                }}
                                disabled={mode === 'view'}
                              />
                            </td>

                            {/* DISCOUNT % */}
                            <td className="py-2.5 px-2 w-[90px]">
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="0"
                                className="w-full h-9 px-2.5 text-xs font-bold font-mono text-right bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-xs outline-none transition-all duration-150 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                                value={line.DiscPrcnt === 0 ? '0' : (line.DiscPrcnt ?? '')}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                    const num = val === '' ? '' : Math.min(100, Math.max(0, Number(val)));
                                    handleUpdateItemRow(idx, 'DiscPrcnt', num);
                                    handleUpdateItemRow(idx, 'Discount' as any, num);
                                  }
                                }}
                                onBlur={() => {
                                  const d = line.DiscPrcnt === '' || isNaN(Number(line.DiscPrcnt)) ? 0 : Number(line.DiscPrcnt);
                                  handleUpdateItemRow(idx, 'DiscPrcnt', d);
                                  handleUpdateItemRow(idx, 'Discount' as any, d);
                                }}
                                disabled={mode === 'view'}
                              />
                            </td>

                            {/* TAX AMOUNT */}
                            <td className="py-2.5 px-2 w-[130px]">
                              <input
                                type="text"
                                className="w-full text-right py-2 px-2.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg opacity-80 cursor-not-allowed"
                                value={Number(line.LineTax || 0).toFixed(2)}
                                disabled
                              />
                            </td>

                            {/* TOTAL WITH TAX */}
                            <td className="py-2.5 px-3 w-[150px] text-right font-extrabold font-mono text-xs text-teal-600 dark:text-teal-400">
                              {Number(line.LineTotalLC || amountBeforeTax).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>

                            {/* PAYMENT TERMS */}
                            <td className="py-2.5 px-2 min-w-[170px]">
                              <PaymentTermsSelect
                                size="sm"
                                value={line.PaymentTerms || line.po_id || 'Net 30 Days'}
                                onChange={val => {
                                  handleUpdateItemRow(idx, 'PaymentTerms' as any, val);
                                  handleUpdateItemRow(idx, 'po_id', val);
                                }}
                                disabled={mode === 'view'}
                              />
                            </td>

                            {/* PROJECT */}
                            <td className="py-2.5 px-2 min-w-[170px]">
                              <ProjectSelect
                                size="sm"
                                data={projectsList}
                                value={line.project || ''}
                                onChange={val => handleUpdateItemRow(idx, 'project', val)}
                                disabled={mode === 'view'}
                              />
                            </td>

                            {/* PROJECT STAGE */}
                            <td className="py-2.5 px-2 min-w-[170px]">
                              <StageSelect
                                size="sm"
                                dimCode={1}
                                data={costCentersList}
                                value={line.DIM1 || ''}
                                onChange={val => handleUpdateItemRow(idx, 'DIM1', val)}
                                disabled={mode === 'view'}
                              />
                            </td>

                            {/* PROJECT SUB STAGE */}
                            <td className="py-2.5 px-2 min-w-[170px]">
                              <StageSelect
                                size="sm"
                                dimCode={2}
                                data={costCentersList}
                                value={line.DIM2 || ''}
                                onChange={val => handleUpdateItemRow(idx, 'DIM2', val)}
                                disabled={mode === 'view'}
                              />
                            </td>

                            {/* DETAIL SUB STAGE */}
                            <td className="py-2.5 px-2 min-w-[170px]">
                              <StageSelect
                                size="sm"
                                dimCode={3}
                                data={costCentersList}
                                value={line.DIM3 || line.Location || ''}
                                onChange={val => {
                                  handleUpdateItemRow(idx, 'DIM3', val);
                                  handleUpdateItemRow(idx, 'Location', val);
                                }}
                                disabled={mode === 'view'}
                              />
                            </td>

                            {/* MORE DETAIL SUB STAGE */}
                            <td className="py-2.5 px-2 min-w-[170px]">
                              <StageSelect
                                size="sm"
                                dimCode={4}
                                data={costCentersList}
                                value={line.DIM4 || ''}
                                onChange={val => handleUpdateItemRow(idx, 'DIM4', val)}
                                disabled={mode === 'view'}
                              />
                            </td>

                            {/* ACTION */}
                            <td className="py-2.5 px-2 text-center w-[55px]">
                              {mode !== 'view' && (
                                <button
                                  type="button"
                                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:scale-110 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                  onClick={() => handleRemoveItem(idx)}
                                  title="Delete service line"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* ─── PHYSICAL INVENTORY ITEMS TABLE ─── */
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm animate-fade-in">
                <table className="w-full text-left text-xs border-collapse min-w-[1900px]">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-900/60 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3 min-w-[280px]">Item Code & Description</th>
                      <th className="p-3 min-w-[110px] text-right">Invoiced Qty</th>
                      <th className="p-3 min-w-[90px] text-center">UoM</th>
                      <th className="p-3 min-w-[130px] text-right">Unit Price</th>
                      <th className="p-3 min-w-[100px] text-right">Disc %</th>
                      <th className="p-3 min-w-[140px]">VAT %</th>
                      <th className="p-3 min-w-[120px] text-right">Tax Total</th>
                      <th className="p-3 min-w-[130px] text-right">Line Total</th>
                      <th className="p-3 min-w-[180px]">Warehouse</th>
                      <th className="p-3 min-w-[180px]">Cost Center</th>
                      <th className="p-3 min-w-[180px]">Project</th>
                      <th className="p-3 min-w-[170px]">PROJECT STAGE</th>
                      <th className="p-3 min-w-[170px]">PROJECT SUB STAGE</th>
                      <th className="p-3 min-w-[170px]">DETAIL SUB STAGE</th>
                      <th className="p-3 min-w-[170px]">MORE DETAIL SUB STAGE</th>
                      {mode !== 'view' && <th className="p-3 w-12 text-center">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/60 dark:divide-slate-700/60 bg-transparent">
                    {items.map((item, index) => (
                      <tr
                        key={index}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors duration-150"
                      >
                        <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                          {index + 1}
                        </td>

                        {/* Item Code & Description */}
                        <td className="p-2.5 min-w-[280px]">
                          <SearchableSelect
                            value={item.ItemCode || (item.ItemID ? String(item.ItemID) : '')}
                            onChange={(val, opt) => {
                              if (!val) {
                                handleUpdateItemRow(index, 'ItemID', 0);
                                handleUpdateItemRow(index, 'ItemCode', '');
                                handleUpdateItemRow(index, 'ItemName', '');
                                return;
                              }
                              const rawItem = opt?.raw;
                              if (rawItem) {
                                const itemCode = rawItem.itemCode || rawItem.ItemCode || rawItem.code || `ITM-${rawItem.id || rawItem.ID}`;
                                const itemName = rawItem.itemName || rawItem.ItemName || rawItem.name || 'Unnamed Item';
                                const unitPrice = Number(rawItem.lastPurPrc || rawItem.price || rawItem.UnitPrice || 0);
                                const uom = rawItem.uom || rawItem.UoM || 'pcs';
                                handleUpdateItemRow(index, 'ItemID', Number(rawItem.id || rawItem.ID || 0));
                                handleUpdateItemRow(index, 'ItemCode', itemCode);
                                handleUpdateItemRow(index, 'ItemName', itemName);
                                handleUpdateItemRow(index, 'UnitPrice', unitPrice);
                                handleUpdateItemRow(index, 'UoM', uom);
                              }
                            }}
                            options={itemCatalogOptions}
                            placeholder="Search item code or name..."
                            disabled={mode === 'view'}
                            size="sm"
                            renderOption={renderItemOption}
                          />
                          {item.SourceDocType && (
                            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                              <span className="text-teal-600 dark:text-teal-400 font-semibold">
                                {item.SourceDocType} #{item.SourceDocId}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Invoiced Qty */}
                        <td className="p-2.5 min-w-[110px]">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.DeliveredQty !== undefined ? item.DeliveredQty : (item.Quantity ?? '')}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                handleUpdateItemRow(index, 'DeliveredQty', val);
                              }
                            }}
                            onBlur={() => {
                              const current = item.DeliveredQty !== undefined ? item.DeliveredQty : item.Quantity;
                              if (current === '' || isNaN(Number(current))) {
                                handleUpdateItemRow(index, 'DeliveredQty', 1);
                              } else {
                                handleUpdateItemRow(index, 'DeliveredQty', Number(current));
                              }
                            }}
                            disabled={mode === 'view'}
                            className="w-full h-9 px-2.5 text-xs font-bold font-mono bg-teal-50/50 dark:bg-teal-900/20 border border-teal-300 dark:border-teal-700 rounded-md text-teal-900 dark:text-teal-200 text-right shadow-xs outline-none transition-all duration-150 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                          />
                        </td>

                        {/* UoM */}
                        <td className="p-2.5 min-w-[90px]">
                          <input
                            type="text"
                            value={item.UoM || 'pcs'}
                            onChange={e => handleUpdateItemRow(index, 'UoM', e.target.value)}
                            disabled={mode === 'view'}
                            className="w-full h-9 px-2 text-xs font-semibold text-center bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-md shadow-xs outline-none transition-all duration-150 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                          />
                        </td>

                        {/* Unit Price */}
                        <td className="p-2.5 min-w-[130px]">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.UnitPrice === 0 ? '0' : (item.UnitPrice ?? '')}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                handleUpdateItemRow(index, 'UnitPrice', val);
                              }
                            }}
                            onBlur={() => {
                              if (item.UnitPrice === '' || isNaN(Number(item.UnitPrice))) {
                                handleUpdateItemRow(index, 'UnitPrice', 0);
                              } else {
                                handleUpdateItemRow(index, 'UnitPrice', Number(item.UnitPrice));
                              }
                            }}
                            disabled={mode === 'view'}
                            className="w-full h-9 px-2.5 text-xs font-bold font-mono text-right bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-xs outline-none transition-all duration-150 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                          />
                        </td>

                        {/* Discount % */}
                        <td className="p-2.5 min-w-[100px]">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.DiscPrcnt === 0 ? '0' : (item.DiscPrcnt ?? '')}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                const num = val === '' ? '' : Math.min(100, Math.max(0, Number(val)));
                                handleUpdateItemRow(index, 'DiscPrcnt', num);
                              }
                            }}
                            onBlur={() => {
                              if (item.DiscPrcnt === '' || isNaN(Number(item.DiscPrcnt))) {
                                handleUpdateItemRow(index, 'DiscPrcnt', 0);
                              } else {
                                handleUpdateItemRow(index, 'DiscPrcnt', Number(item.DiscPrcnt));
                              }
                            }}
                            disabled={mode === 'view'}
                            className="w-full h-9 px-2.5 text-xs font-bold font-mono text-right bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-xs outline-none transition-all duration-150 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                          />
                        </td>

                        {/* VAT % */}
                        <td className="p-2.5 min-w-[140px]">
                          <TaxSelect
                            size="sm"
                            value={item.VATCode || (item.VATPer === 18 ? 'VAT_18' : item.VATPer === 10 ? 'VAT_10' : item.VATPer === 0 ? 'VAT_0' : 'VAT_18')}
                            onChange={code => {
                              const rate = code === 'VAT_18' ? 18 : (code === 'VAT_10' || code === 'VAT_9') ? 10 : 0;
                              handleUpdateItemRow(index, 'VATCode', code);
                              handleUpdateItemRow(index, 'VATPer', rate);
                            }}
                            disabled={mode === 'view'}
                          />
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
                        <td className="p-2.5 min-w-[180px]">
                          <WarehouseSelect
                            size="sm"
                            data={warehousesList}
                            value={item.WhsCode || ''}
                            onChange={val => handleUpdateItemRow(index, 'WhsCode', val ? Number(val) : undefined)}
                            disabled={mode === 'view'}
                          />
                        </td>

                        {/* Cost Center */}
                        <td className="p-2.5 min-w-[180px]">
                          <CostCenterSelect
                            size="sm"
                            data={costCentersList}
                            value={item.cost_center || ''}
                            onChange={val => handleUpdateItemRow(index, 'cost_center', val ? Number(val) : undefined)}
                            disabled={mode === 'view'}
                          />
                        </td>

                        {/* Project */}
                        <td className="p-2.5 min-w-[180px]">
                          <ProjectSelect
                            size="sm"
                            data={projectsList}
                            value={item.project || ''}
                            onChange={val => handleUpdateItemRow(index, 'project', val)}
                            disabled={mode === 'view'}
                          />
                        </td>

                        {/* PROJECT STAGE */}
                        <td className="p-2.5 min-w-[170px]">
                          <StageSelect
                            size="sm"
                            dimCode={1}
                            data={costCentersList}
                            value={item.DIM1 || ''}
                            onChange={val => handleUpdateItemRow(index, 'DIM1', val)}
                            disabled={mode === 'view'}
                          />
                        </td>

                        {/* PROJECT SUB STAGE */}
                        <td className="p-2.5 min-w-[170px]">
                          <StageSelect
                            size="sm"
                            dimCode={2}
                            data={costCentersList}
                            value={item.DIM2 || ''}
                            onChange={val => handleUpdateItemRow(index, 'DIM2', val)}
                            disabled={mode === 'view'}
                          />
                        </td>

                        {/* DETAIL SUB STAGE */}
                        <td className="p-2.5 min-w-[170px]">
                          <StageSelect
                            size="sm"
                            dimCode={3}
                            data={costCentersList}
                            value={item.DIM3 || item.Location || ''}
                            onChange={val => {
                              handleUpdateItemRow(index, 'DIM3', val);
                              handleUpdateItemRow(index, 'Location', val);
                            }}
                            disabled={mode === 'view'}
                          />
                        </td>

                        {/* MORE DETAIL SUB STAGE */}
                        <td className="p-2.5 min-w-[170px]">
                          <StageSelect
                            size="sm"
                            dimCode={4}
                            data={costCentersList}
                            value={item.DIM4 || ''}
                            onChange={val => handleUpdateItemRow(index, 'DIM4', val)}
                            disabled={mode === 'view'}
                          />
                        </td>

                        {/* Remove Action */}
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Financial Summary, Remarks, and Attachments Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-6">
            {/* Remarks Card */}
            <SectionCard>
              <SectionHeader icon={<MessageSquare className="w-4 h-4" />} title="Remarks & Instructions" />
              <div className="p-5">
                <FieldLabel>Remarks / Instructions / Comments</FieldLabel>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  disabled={mode === 'view'}
                  placeholder="Enter any notes, payment terms, or invoice comments..."
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
                      Click to upload vendor invoice PDF or documents
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">PDF, PNG, JPG, XLSX</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((att, idx) => {
                      const fileUrl = getAttachmentUrl(att.Attachment);
                      const fileName = getFileName(att.Attachment) || `Attachment ${idx + 1}`;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                            <span className="truncate font-medium text-slate-800 dark:text-slate-200" title={fileName}>
                              {fileName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold text-teal-600 hover:underline"
                            >
                              View
                            </a>
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
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          {/* Financial Summary Card */}
          <div className="lg:col-span-6">
            <SectionCard>
              <SectionHeader icon={<DollarSign className="w-4 h-4" />} title="Financial Summary" />
              <div className="p-5 space-y-3.5 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Subtotal (Exclusive):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>

                {/* Header Discount */}
                <div className="flex justify-between items-center gap-4">
                  <span className="text-slate-600 dark:text-slate-400">Document Discount %:</span>
                  <div className="w-32">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={discPrcnt}
                      onChange={e => setDiscPrcnt(validateDiscountPercent(parseFloat(e.target.value) || 0))}
                      disabled={mode === 'view'}
                      className="w-full px-2 py-1 text-right text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {discPrcnt > 0 && (
                  <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                    <span>Discount Amount:</span>
                    <span className="font-mono font-bold">
                      - {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Total Tax:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>

                {/* Freight */}
                <div className="flex justify-between items-center gap-4">
                  <span className="text-slate-600 dark:text-slate-400">Freight / Shipping:</span>
                  <div className="w-32">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={freight}
                      onChange={e => setFreight(parseFloat(e.target.value) || 0)}
                      disabled={mode === 'view'}
                      className="w-full px-2 py-1 text-right text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Rounding */}
                <div className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isRounding}
                      onChange={(e) => setIsRounding(e.target.checked)}
                      disabled={mode === 'view'}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-slate-600 dark:text-slate-400">Rounding Option</span>
                  </div>
                  {isRounding && (
                    <div className="w-32">
                      <input
                        type="number"
                        step="any"
                        value={roundingAmnt}
                        onChange={e => setRoundingAmnt(parseFloat(e.target.value) || 0)}
                        disabled={mode === 'view'}
                        className="w-full px-2 py-1 text-right text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  )}
                </div>

                <div className="border-t-2 border-slate-200 dark:border-slate-700 pt-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Grand Total:</span>
                  <span className="text-base font-black text-teal-600 dark:text-teal-400 font-mono">
                    {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/procurement/ap-invoice')}
            className="text-xs"
          >
            Cancel
          </Button>
          {mode !== 'view' && (
            <Button
              type="submit"
              disabled={isPending}
              className="text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
            >
              {isPending ? (
                <div className="flex items-center gap-1.5">
                  <Spinner className="w-4 h-4" /> Saving...
                </div>
              ) : mode === 'edit' ? (
                'Update AP Invoice'
              ) : (
                'Create AP Invoice'
              )}
            </Button>
          )}
        </div>
      </form>

      {/* ─── MODAL: COPY FROM PURCHASE ORDER ─── */}
      {isCopyPoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card bg-white/90 dark:bg-slate-800/90 rounded-2xl max-w-4xl w-full max-h-[85vh] shadow-2xl border border-slate-200/80 dark:border-white/10 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/60 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <Copy className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Copy From Purchase Order (PO)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select a Purchase Order to import items/services into AP Invoice ({typeRequest} mode)
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

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
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
                            {selectedPoForCopy.OrderCode || `PO #${selectedPoForCopy.ID}`} — Lines ({selectedPoForCopy.items?.length || 0})
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

                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {(selectedPoForCopy.items || []).map((it: any, idx: number) => {
                          const isChecked = selectedPoItemIds.includes(idx);
                          return (
                            <div
                              key={idx}
                              onClick={() => handleTogglePoItem(idx)}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                                isChecked
                                  ? 'bg-teal-50/50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-teal-600 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <div className="flex-1 truncate">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                                  {it.ItemName || it.Remarks || it.ItemCode || `Line #${idx + 1}`}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Qty: {it.Quantity} | Price: {Number(it.UnitPrice || 0).toLocaleString()} {selectedPoForCopy.Currency || 'TZS'}
                                </span>
                              </div>
                              <span className="font-mono text-xs font-bold text-teal-600">
                                {Number(it.LineTotalLC || (it.Quantity * it.UnitPrice) || 0).toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                      <Copy className="w-8 h-8 mb-2 text-slate-300" />
                      <p className="text-xs">Select a Purchase Order from the list on the left to preview lines</p>
                    </div>
                  )}

                  {selectedPoForCopy && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleApplyPoCopy(false)}
                        className="text-xs"
                      >
                        Append Lines
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleApplyPoCopy(true)}
                        className="text-xs bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        Replace & Import ({selectedPoItemIds.length}) Lines
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: COPY FROM GRPO ─── */}
      {isCopyGrpoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card bg-white/90 dark:bg-slate-800/90 rounded-2xl max-w-4xl w-full max-h-[85vh] shadow-2xl border border-slate-200/80 dark:border-white/10 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/60 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <Copy className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Copy From Goods Receipt (GRPO)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select a Goods Receipt to import received items into AP Invoice ({typeRequest} mode)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCopyGrpoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Goods Receipt by Order Code, Vendor Name or Code..."
                  value={grpoSearch}
                  onChange={e => setGrpoSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* GRPO List */}
                <div className="md:col-span-5 max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700/60">
                  {goodsReceiptsList
                    .filter(gr => {
                      const isService = typeRequest === 'Service';
                      const grType = (gr.TypeRequest || (gr as any).RequestType || '').toLowerCase();
                      const isMatch = isService ? grType === 'service' : grType !== 'service';
                      if (!isMatch) return false;

                      const q = grpoSearch.toLowerCase();
                      const code = (gr.OrderCode || `GR #${gr.ID}`).toLowerCase();
                      const vendor = (gr.CustName || gr.CustCode || '').toLowerCase();
                      return code.includes(q) || vendor.includes(q);
                    })
                    .map(gr => {
                      const isSelected = selectedGrpoForCopy?.ID === gr.ID;
                      return (
                        <div
                          key={gr.ID}
                          onClick={() => handleSelectGrpo(gr)}
                          className={`p-3 cursor-pointer transition-colors text-xs ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-l-indigo-600'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {gr.OrderCode || `GR #${gr.ID}`}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                              {gr.Status || 'Active'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 truncate">
                            {gr.CustName || gr.CustCode || 'Vendor'}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                            <span>
                              {gr.PostDate ? new Date(gr.PostDate).toLocaleDateString() : 'No date'}
                            </span>
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {Number(gr.DocTotal || 0).toLocaleString()} {gr.Currency || 'TZS'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* GRPO Items Preview */}
                <div className="md:col-span-7 border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between">
                  {selectedGrpoForCopy ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {selectedGrpoForCopy.OrderCode || `GR #${selectedGrpoForCopy.ID}`} — Items ({selectedGrpoForCopy.items?.length || 0})
                          </h4>
                          <p className="text-[10px] text-slate-500">
                            Vendor: {selectedGrpoForCopy.CustName} ({selectedGrpoForCopy.CustCode})
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (selectedGrpoItemIds.length === (selectedGrpoForCopy.items?.length || 0)) {
                              setSelectedGrpoItemIds([]);
                            } else {
                              setSelectedGrpoItemIds((selectedGrpoForCopy.items || []).map((_: any, idx: number) => idx));
                            }
                          }}
                          className="text-[10px] h-6 px-2"
                        >
                          {selectedGrpoItemIds.length === (selectedGrpoForCopy.items?.length || 0)
                            ? 'Deselect All'
                            : 'Select All'}
                        </Button>
                      </div>

                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {(selectedGrpoForCopy.items || []).map((it: any, idx: number) => {
                          const isChecked = selectedGrpoItemIds.includes(idx);
                          return (
                            <div
                              key={idx}
                              onClick={() => handleToggleGrpoItem(idx)}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                                isChecked
                                  ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <div className="flex-1 truncate">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                                  {it.ItemName || it.Remarks || it.ItemCode || `Line #${idx + 1}`}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Received Qty: {it.DeliveredQty !== undefined ? it.DeliveredQty : it.Quantity} | Price: {Number(it.UnitPrice || 0).toLocaleString()}
                                </span>
                              </div>
                              <span className="font-mono text-xs font-bold text-indigo-600">
                                {Number(it.LineTotalLC || 0).toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                      <Copy className="w-8 h-8 mb-2 text-slate-300" />
                      <p className="text-xs">Select a Goods Receipt from the list on the left to preview items</p>
                    </div>
                  )}

                  {selectedGrpoForCopy && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleApplyGrpoCopy(false)}
                        className="text-xs"
                      >
                        Append Lines
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleApplyGrpoCopy(true)}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        Replace & Import ({selectedGrpoItemIds.length}) Lines
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CATALOG SEARCH ─── */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card bg-white/90 dark:bg-slate-800/90 rounded-2xl max-w-2xl w-full max-h-[80vh] shadow-2xl border border-slate-200/80 dark:border-white/10 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/60 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Item Master Catalog</h3>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
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
                  placeholder="Search item by code or name..."
                  value={itemSearch}
                  onChange={e => setItemSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
            <div className="p-4 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 max-h-96">
              {catalogItemsList
                .filter((itm: any) => {
                  const q = itemSearch.toLowerCase();
                  return (
                    (itm.Name || itm.name || '').toLowerCase().includes(q) ||
                    (itm.Code || itm.code || '').toLowerCase().includes(q)
                  );
                })
                .map((itm: any) => (
                  <div
                    key={itm.ID || itm.id}
                    onClick={() => handleSelectCatalogItem(itm)}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {itm.Name || itm.name}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-mono">
                          Code: {itm.Code || itm.code}
                        </span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium">
                          Category: {itm.categoryName || itm.CategoryName || itm.category || 'General'}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${Number(itm.onHand || itm.OnHand || 0) > 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'}`}>
                          In Stock: {Number(itm.onHand || itm.OnHand || 0)} {itm.UoM || itm.uom || 'pcs'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-teal-600 dark:text-teal-400 block text-xs">
                        {Number(itm.LastPurPrc || itm.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                      </span>
                      <span className="text-[10px] text-slate-400">Price</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: VENDOR ADVANCED SEARCH ─── */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card bg-white/90 dark:bg-slate-800/90 rounded-2xl max-w-2xl w-full max-h-[80vh] shadow-2xl border border-slate-200/80 dark:border-white/10 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/60 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Vendor & Supplier Catalog</h3>
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
                  placeholder="Search vendor by code, name, TIN, or address..."
                  value={vendorSearch}
                  onChange={e => setVendorSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
            <div className="p-4 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 max-h-96">
              {suppliersList
                .filter((supp: any) => {
                  const q = vendorSearch.toLowerCase();
                  const name = (supp.Name || supp.name || supp.cardName || supp.CardName || '').toLowerCase();
                  const code = (supp.Code || supp.code || supp.cardCode || supp.CardCode || '').toLowerCase();
                  const tin = (supp.TIN || supp.tin || '').toLowerCase();
                  return name.includes(q) || code.includes(q) || tin.includes(q);
                })
                .map((supp: any) => (
                  <div
                    key={supp.ID || supp.id || supp.Code || supp.code}
                    onClick={() => handleSelectVendorFromModal(supp)}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {supp.Name || supp.name || supp.cardName || supp.CardName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Code: {supp.Code || supp.code || supp.cardCode || supp.CardCode}
                        {supp.TIN ? ` | TIN: ${supp.TIN}` : ''}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
