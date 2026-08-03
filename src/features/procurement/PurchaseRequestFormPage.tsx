import React, { useState, useEffect } from 'react';
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
  FileSpreadsheet
} from 'lucide-react';
import { 
  useCreatePurchaseRequest, 
  useUpdatePurchaseRequest, 
  usePurchaseRequest,
  type PurchaseRequestItem,
  type PurchaseRequestInput
} from './api/usePurchaseRequests';
import { useRetailers } from '../customers/api/useRetailers';
import { useItems } from '../items/api/useItems';
import { 
  useBranches, 
  useProjects, 
  useCostCenters, 
  useExpenses 
} from '../users/api/useMasterData';
import { Button, Spinner, Badge } from '../../components/ui';

interface PurchaseRequestFormPageProps {
  mode: 'add' | 'edit' | 'view';
}

export const PurchaseRequestFormPage: React.FC<PurchaseRequestFormPageProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const numericId = id ? parseInt(id) : null;

  // Master Data hooks
  const { data: suppliersResponse = [] } = useRetailers({ cardType: 'S', aprStatus: 'Y' });
  const { data: itemsResponse } = useItems({ limit: 100 });
  const { data: branchesResponse } = useBranches();
  const { data: projectsResponse } = useProjects();
  const { data: costCentersResponse } = useCostCenters();
  const { data: expensesResponse } = useExpenses();

  const branches = branchesResponse?.data || [];
  const projects = projectsResponse?.data || [];
  const costCenters = costCentersResponse?.data || [];
  const expenses = expensesResponse?.data || [];
  const itemsList = itemsResponse?.items || [];

  // Mutations
  const createMutation = useCreatePurchaseRequest();
  const updateMutation = useUpdatePurchaseRequest();

  // Fetch details if edit/view
  const { data: existingRequest, isLoading: isLoadingDetails } = usePurchaseRequest(numericId);

  // Accordion open/close states
  const [basicDetailsOpen, setBasicDetailsOpen] = useState(true);
  const [advancedSapOpen, setAdvancedSapOpen] = useState(false);

  // Form State
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
  
  // Custom finance parameters
  const [requestTerms, setRequestTerms] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [hasRounding, setHasRounding] = useState(false);
  const [roundingAmount, setRoundingAmount] = useState(0);
  const [hasFreight, setHasFreight] = useState(false);
  const [freightAmount, setFreightAmount] = useState(0);

  // Items State
  const [items, setItems] = useState<PurchaseRequestItem[]>([]);

  // Populate data when editing/viewing
  useEffect(() => {
    if (existingRequest && (mode === 'edit' || mode === 'view')) {
      setCustCode(existingRequest.CustCode || '');
      setCustName(existingRequest.CustName || '');
      setAddress(existingRequest.Address || '');
      setCustRefNo(existingRequest.CustRefNo || '');
      setCurrency(existingRequest.Currency || 'TZS');
      setCurRate(Number(existingRequest.CurRate || 1.0));
      if (existingRequest.PostDate) {
        setPostDate(new Date(existingRequest.PostDate).toISOString().split('T')[0]);
      }
      if (existingRequest.DueDate) {
        setDueDate(new Date(existingRequest.DueDate).toISOString().split('T')[0]);
      }
      setTypeRequest(existingRequest.TypeRequest || 'Item');
      if (existingRequest.RequestedByDate) {
        setRequestedByDate(new Date(existingRequest.RequestedByDate).toISOString().split('T')[0]);
      }
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
    } else {
      // Defaults for new request
      setCustCode('');
      setCustName('');
      setAddress('');
      setCustRefNo('');
      setCurrency('TZS');
      setCurRate(1.0);
      setPostDate(new Date().toISOString().split('T')[0]);
      setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setTypeRequest('Item');
      setRequestedByDate(new Date().toISOString().split('T')[0]);
      setRemarks('');
      setBranchId('');
      setRequestType('Direct');
      setExpenseType('');
      setMemoText('');
      setDepartment('');
      setRequestTerms('');
      setPaymentMethod('');
      setDiscountPercent(0);
      setHasRounding(false);
      setRoundingAmount(0);
      setHasFreight(false);
      setFreightAmount(0);
      setItems([]);
    }
  }, [existingRequest, mode]);

  // Handle supplier change
  const handleSupplierChange = (code: string) => {
    const supplier = suppliersResponse.find(s => s.Code === code);
    if (supplier) {
      setCustCode(code);
      setCustName(supplier.Name);
      setAddress(supplier.Address || '');
    }
  };

  // Item lines operations
  const handleAddItemLine = () => {
    setItems(prev => [
      ...prev,
      {
        LineNum: prev.length + 1,
        ItemID: 0,
        ItemCode: '',
        ItemName: '',
        LineStatus: 'O',
        Quantity: 1,
        UnitPrice: 0,
        DiscPrcnt: 0,
        VATCode: 'VAT_18',
        VATPer: 18,
        LineTax: 0,
        LineTotalLC: 0,
        Remarks: '',
      }
    ]);
  };

  const handleRemoveItemLine = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, LineNum: i + 1 })));
  };

  const handleItemLineChange = (index: number, field: keyof PurchaseRequestItem, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      const line = { ...copy[index] };

      if (field === 'ItemID') {
        const itemObj = itemsList.find(item => item.id === Number(value));
        if (itemObj) {
          line.ItemID = itemObj.id;
          line.ItemCode = itemObj.code;
          line.ItemName = itemObj.name;
          line.UoM = itemObj.uom;
          line.UnitPrice = itemObj.lastPurPrc || 0;
        }
      } else {
        (line as any)[field] = value;
      }

      // Calculations
      const qty = Number(line.Quantity || 0);
      const price = Number(line.UnitPrice || 0);
      const disc = Number(line.DiscPrcnt || 0);
      const vat = Number(line.VATPer || 0);

      const baseAmount = qty * price;
      const afterDisc = baseAmount * (1 - disc / 100);
      const tax = afterDisc * (vat / 100);
      
      line.LineTax = tax;
      line.LineTotalLC = afterDisc + tax;

      copy[index] = line;
      return copy;
    });
  };

  // Recalculate totals
  const subtotal = items.reduce((sum, item) => sum + (Number(item.Quantity || 0) * Number(item.UnitPrice || 0)), 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const baseAfterHeaderDisc = subtotal - discountAmount;
  const totalTax = items.reduce((sum, item) => {
    const lineBase = Number(item.Quantity || 0) * Number(item.UnitPrice || 0) * (1 - Number(item.DiscPrcnt || 0)/100);
    const lineRatio = subtotal > 0 ? lineBase / subtotal : 0;
    const scaledLineBase = baseAfterHeaderDisc * lineRatio;
    return sum + (scaledLineBase * (Number(item.VATPer || 0) / 100));
  }, 0);

  const rawDocTotal = baseAfterHeaderDisc + totalTax + (hasFreight ? Number(freightAmount) : 0);
  const finalDocTotal = hasRounding ? rawDocTotal + Number(roundingAmount) : rawDocTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custCode) {
      alert('Please select a vendor/supplier');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one item line');
      return;
    }
    if (items.some(item => !item.ItemID)) {
      alert('Please select a valid item for all lines');
      return;
    }

    const payload: PurchaseRequestInput = {
      CustCode: custCode,
      CustName: custName,
      Address: address,
      CustRefNo: custRefNo,
      Currency: currency,
      CurRate: curRate,
      PostDate: postDate,
      DueDate: dueDate || null,
      TypeRequest: typeRequest,
      RequestedByDate: requestedByDate || null,
      Remarks: remarks,
      Branch_id: branchId ? Number(branchId) : undefined,
      RequestType: requestType,
      Expense_type: expenseType || undefined,
      memo_text: memoText || undefined,
      Department: department || undefined,
      items: items.map((item, idx) => ({
        LineNum: idx + 1,
        LineStatus: item.LineStatus || 'O',
        ItemID: item.ItemID,
        ItemCode: item.ItemCode || undefined,
        ItemName: item.ItemName || undefined,
        Quantity: Number(item.Quantity),
        UnitPrice: Number(item.UnitPrice),
        DiscPrcnt: Number(item.DiscPrcnt || 0),
        VATCode: item.VATCode || undefined,
        VATPer: Number(item.VATPer || 0),
        WhsCode: item.WhsCode ? Number(item.WhsCode) : undefined,
        cost_center: item.cost_center ? Number(item.cost_center) : undefined,
        project: item.project || undefined,
        Remarks: item.Remarks || undefined,
        UoM: item.UoM || undefined,
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

  if (isLoadingDetails && (mode === 'edit' || mode === 'view')) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in space-y-6">
      
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-[11px] mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            <Link to="/dashboard" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link to="/procurement/request" className="hover:text-primary transition-colors">Purchase Request</Link>
            <span>/</span>
            <span className="font-semibold text-primary">{isView ? 'Details' : mode === 'edit' ? 'Edit' : 'New'}</span>
          </div>
          {/* Title & Status Badge */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-display" style={{ color: 'var(--color-text)' }}>
              {isView ? 'Purchase Request Details' : mode === 'edit' ? 'Modify Purchase Request' : 'New Purchase Request'}
            </h1>
            <Badge variant={isView && existingRequest?.Status === 'Approved' ? 'success' : 'warning'}>
              {isView ? existingRequest?.Status : 'DRAFT'}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button 
            variant="secondary" 
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/procurement/request')}
            className="hover:scale-95 transition-all text-xs font-bold"
          >
            Back
          </Button>
          {!isView && (
            <Button 
              icon={<Check className="h-4 w-4" />}
              disabled={createMutation.isPending || updateMutation.isPending}
              onClick={handleSubmit}
              className="hover:scale-95 transition-all text-xs font-bold bg-[#10b981] hover:bg-[#059669] text-white border-0"
            >
              {createMutation.isPending || updateMutation.isPending ? <Spinner size="sm" /> : 'Submit'}
            </Button>
          )}
          {isView && (
            <Button 
              icon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/procurement/request/new')}
              className="hover:scale-95 transition-all text-xs font-bold"
            >
              New Request
            </Button>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (Inputs & Table) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Basic Details (Collapsible Card with Premium Styling) */}
          <div className="rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <button 
              type="button"
              className="w-full flex items-center justify-between p-4 font-bold border-b text-xs uppercase tracking-wider" 
              style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)', background: 'var(--color-surface-hover)' }}
              onClick={() => setBasicDetailsOpen(!basicDetailsOpen)}
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Basic details
              </span>
              {basicDetailsOpen ? <ChevronUp className="h-4.5 w-4.5 text-primary" /> : <ChevronDown className="h-4.5 w-4.5 text-primary" />}
            </button>
            
            {basicDetailsOpen && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-down">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Vendor / Supplier</label>
                  <select
                    className="input-base w-full text-xs font-semibold py-2 px-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-primary/20"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    value={custCode}
                    onChange={e => handleSupplierChange(e.target.value)}
                    disabled={isView}
                  >
                    <option value="">Select Vendor/Supplier...</option>
                    {suppliersResponse.map(s => (
                      <option key={s.Code} value={s.Code}>{s.Code} - {s.Name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Vendor Name</label>
                  <input
                    type="text"
                    className="input-base w-full text-xs font-semibold py-2 px-3 rounded-xl border outline-none bg-slate-100 dark:bg-slate-800"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    value={custName}
                    disabled
                  />
                </div>
                <div className="md:col-span-2 flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Address</label>
                  <input
                    type="text"
                    placeholder="Physical or mailing address..."
                    className="input-base w-full text-xs font-semibold py-2 px-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-primary/20"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    disabled={isView}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Dates & Financing Logistics */}
          <div className="rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all duration-300 space-y-4" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-2 border-b pb-2 mb-1" style={{ borderColor: 'var(--color-border)' }}>
              <Info className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider m-0" style={{ color: 'var(--color-text)' }}>
                Dates & Financing Logistics
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Post Date</label>
                <input
                  type="date"
                  className="input-base w-full text-xs font-semibold py-2 px-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  value={postDate}
                  onChange={e => setPostDate(e.target.value)}
                  disabled={isView}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Validity Date</label>
                <input
                  type="date"
                  className="input-base w-full text-xs font-semibold py-2 px-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  disabled={isView}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Required By</label>
                <input
                  type="date"
                  className="input-base w-full text-xs font-semibold py-2 px-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  value={requestedByDate}
                  onChange={e => setRequestedByDate(e.target.value)}
                  disabled={isView}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Request Terms</label>
                <select
                  className="input-base w-full text-xs font-semibold py-2 px-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  value={requestTerms}
                  onChange={e => setRequestTerms(e.target.value)}
                  disabled={isView}
                >
                  <option value="">Select Terms...</option>
                  <option value="cash">Cash Payment</option>
                  <option value="net30">Net 30 Days</option>
                  <option value="net60">Net 60 Days</option>
                  <option value="cod">Cash on Delivery</option>
                </select>
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Expense Classification</label>
                <select
                  className="input-base w-full text-xs font-semibold py-2 px-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  value={expenseType}
                  onChange={e => setExpenseType(e.target.value)}
                  disabled={isView}
                >
                  <option value="">Select Classification...</option>
                  {expenses.map(e => (
                    <option key={e.type} value={e.type}>{e.type} - {e.description}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Payment Method</label>
                <select
                  className="input-base w-full text-xs font-semibold py-2 px-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  disabled={isView}
                >
                  <option value="">Select Method...</option>
                  <option value="Bank Transfer">Bank Wire Transfer</option>
                  <option value="Cash">Petty Cash</option>
                  <option value="Mobile Money">Mobile Money (M-Pesa)</option>
                  <option value="Cheque">Cheque Payment</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Detailed Description / Internal Memo */}
          <div className="rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all duration-300 space-y-3" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-[10px] font-bold uppercase tracking-wider mb-0" style={{ color: 'var(--color-text-secondary)' }}>
              Detailed Description / Internal Memo Specification
            </h3>
            
            {/* Minimalist Editor Header */}
            {!isView && (
              <div className="flex flex-wrap gap-1 p-1 border rounded-xl bg-slate-50 dark:bg-slate-900/30" style={{ borderColor: 'var(--color-border)' }}>
                <button type="button" className="px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border-0">B</button>
                <button type="button" className="px-2.5 py-1 rounded-lg text-xs italic hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border-0">I</button>
                <button type="button" className="px-2.5 py-1 rounded-lg text-xs underline hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border-0">U</button>
                <div className="w-[1px] bg-slate-300 dark:bg-slate-700 my-1 mx-1.5" />
                <select className="text-xs border-0 rounded-lg px-2 py-0.5 outline-none bg-transparent">
                  <option>14px</option>
                  <option>16px</option>
                  <option>18px</option>
                </select>
                <div className="w-[1px] bg-slate-300 dark:bg-slate-700 my-1 mx-1.5" />
                <button type="button" className="px-2.5 py-1 rounded-lg text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border-0 font-medium">List</button>
                <button type="button" className="px-2.5 py-1 rounded-lg text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border-0 font-medium">&lt;&gt;</button>
              </div>
            )}

            <textarea
              className="input-base w-full h-[140px] text-xs resize-none py-3.5 px-4 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
              placeholder="Add administrative details or specs..."
              value={memoText}
              onChange={e => setMemoText(e.target.value)}
              disabled={isView}
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            />
          </div>

          {/* 4. Enhanced Material Procurement Items Grid */}
          <div className="rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all duration-300 space-y-4" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider mb-0" style={{ color: 'var(--color-text)' }}>
                  Material Procurement Items
                </h3>
              </div>
              {!isView && (
                <Button 
                  type="button" 
                  size="sm"
                  icon={<Plus className="h-3.5 w-3.5" />}
                  onClick={handleAddItemLine}
                  className="bg-primary hover:bg-primary-hover text-white text-[11px] font-bold py-1 px-3 rounded-lg border-0"
                >
                  Add Items
                </Button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-2xl" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>No items added yet. Click Add Items above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead>
                    <tr className="border-b text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)' }}>
                      <th className="py-3 px-4 w-[250px]">VENDOR</th>
                      <th className="py-3 px-4 w-[100px] text-center">RECEIPT QTY</th>
                      <th className="py-3 px-4 w-[110px]">CODE</th>
                      <th className="py-3 px-4 w-[200px]">ITEM</th>
                      <th className="py-3 px-4 w-[90px]">UOM</th>
                      <th className="py-3 px-4 w-[130px] text-right">UNIT PRICE</th>
                      <th className="py-3 px-4 w-[90px] text-center">DISC %</th>
                      <th className="py-3 px-4 w-[130px] text-right">TOTAL</th>
                      {!isView && <th className="py-3 px-4 w-[50px] text-center"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs font-semibold" style={{ borderColor: 'var(--color-border)' }}>
                    {items.map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/10 transition-colors">
                        
                        {/* Vendor Selector */}
                        <td className="py-2.5 px-3">
                          <select
                            className="input-base w-full text-xs font-semibold py-1.5 px-2 rounded-lg border outline-none bg-transparent hover:border-primary focus:border-primary"
                            value={custCode}
                            disabled
                            style={{ borderColor: 'transparent', color: 'var(--color-text)' }}
                          >
                            <option value="">{custName || 'Vendor...'}</option>
                          </select>
                        </td>

                        {/* Quantity */}
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="1"
                            className="input-base w-full text-xs font-bold font-mono py-1.5 px-2 rounded-lg text-center bg-transparent border hover:border-primary focus:border-primary focus:bg-surface focus:shadow-sm"
                            value={line.Quantity}
                            onChange={e => handleItemLineChange(idx, 'Quantity', Number(e.target.value))}
                            disabled={isView}
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                          />
                        </td>

                        {/* Item Code (Static Info) */}
                        <td className="py-2.5 px-3 font-mono text-xs text-primary font-bold">
                          {line.ItemCode || '—'}
                        </td>

                        {/* Item Selector */}
                        <td className="py-2.5 px-3">
                          <select
                            className="input-base w-full text-xs font-semibold py-1.5 px-2 rounded-lg border outline-none bg-transparent hover:border-primary focus:border-primary"
                            value={line.ItemID}
                            onChange={e => handleItemLineChange(idx, 'ItemID', e.target.value)}
                            disabled={isView}
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                          >
                            <option value="0" disabled>Select Item...</option>
                            {itemsList.map(item => (
                              <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* UOM */}
                        <td className="py-2.5 px-3 text-xs text-slate-500 font-medium">
                          {line.UoM || 'pcs'}
                        </td>

                        {/* Unit Price */}
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            className="input-base w-full text-xs font-bold font-mono py-1.5 px-2 rounded-lg text-right bg-transparent border hover:border-primary focus:border-primary focus:bg-surface focus:shadow-sm"
                            value={line.UnitPrice}
                            onChange={e => handleItemLineChange(idx, 'UnitPrice', Number(e.target.value))}
                            disabled={isView}
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                          />
                        </td>

                        {/* Discount */}
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="input-base w-full text-xs font-bold font-mono py-1.5 px-2 rounded-lg text-center bg-transparent border hover:border-primary focus:border-primary focus:bg-surface focus:shadow-sm"
                            value={line.DiscPrcnt || 0}
                            onChange={e => handleItemLineChange(idx, 'DiscPrcnt', Number(e.target.value))}
                            disabled={isView}
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                          />
                        </td>

                        {/* Total */}
                        <td className="py-2.5 px-4 text-xs font-bold font-mono text-primary text-right">
                          {Number(line.LineTotalLC || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        {/* Delete line */}
                        {!isView && (
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 hover:scale-105 active:scale-95 transition-all"
                              onClick={() => handleRemoveItemLine(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
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

          {/* 5. Advanced System Architecture Data (SAP ERP) - Collapsible Card */}
          <div className="rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <button 
              type="button"
              className="w-full flex items-center justify-between p-4 font-bold border-b text-xs uppercase tracking-wider" 
              style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)', background: 'var(--color-surface-hover)' }}
              onClick={() => setAdvancedSapOpen(!advancedSapOpen)}
            >
              <span className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Advanced System Architecture Data (SAP ERP) Financial Series, Cost Center Tokens
              </span>
              {advancedSapOpen ? <ChevronUp className="h-4.5 w-4.5 text-primary" /> : <ChevronDown className="h-4.5 w-4.5 text-primary" />}
            </button>
            
            {advancedSapOpen && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-down">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Branch Mapping</label>
                  <select
                    className="input-base w-full text-xs font-semibold py-2 px-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-primary/20"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    value={String(branchId)}
                    onChange={e => setBranchId(Number(e.target.value))}
                    disabled={isView}
                  >
                    <option value="">Select Branch...</option>
                    {branches.map(b => (
                      <option key={b.id} value={String(b.id)}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Cost Center mapping</label>
                  <select
                    className="input-base w-full text-xs font-semibold py-2 px-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-primary/20"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    value=""
                    onChange={() => {}}
                    disabled={isView}
                  >
                    <option value="">Select Cost Center...</option>
                    {costCenters.map(cc => (
                      <option key={cc.id} value={String(cc.id)}>{cc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Project mapping</label>
                  <select
                    className="input-base w-full text-xs font-semibold py-2 px-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-primary/20"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    value=""
                    onChange={() => {}}
                    disabled={isView}
                  >
                    <option value="">Select Project...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-secondary)' }}>SAP Financial Series</label>
                  <input
                    type="text"
                    className="input-base w-full text-xs font-semibold py-2 px-3 rounded-xl border outline-none bg-slate-100 dark:bg-slate-800"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    value={existingRequest?.series || 'Primary'}
                    disabled
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-secondary)' }}>SAP Reference Doc Entry</label>
                  <input
                    type="text"
                    className="input-base w-full text-xs font-semibold py-2 px-3 rounded-xl border outline-none bg-slate-100 dark:bg-slate-800"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    value={existingRequest?.SAPDocEntry ? String(existingRequest.SAPDocEntry) : '—'}
                    disabled
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Department Token</label>
                  <input
                    type="text"
                    placeholder="HR, Procurement..."
                    className="input-base w-full text-xs font-semibold py-2 px-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-primary/20"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    disabled={isView}
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Columns (Ledger & Summaries) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* A. Identity Audit Ledger */}
          <div className="bg-[#1e293b] text-white border-0 shadow-lg p-5 rounded-2xl space-y-4 hover:shadow-xl transition-all duration-300">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 m-0">
              Identity Audit Ledger
            </h3>
            <div className="space-y-3.5">
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Tracking Number</span>
                <span className="font-mono text-sm font-bold text-emerald-400">
                  {existingRequest?.RequestedNo || 'PR26/NEW'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase">SAPDOC Number</span>
                <span className="font-mono text-xs font-semibold text-slate-300">
                  {existingRequest?.SAPDocNum || 'UNSYNCHRONIZED'}
                </span>
              </div>
              <div className="pt-1.5">
                <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Approval State Tag</span>
                <Badge variant={existingRequest?.AprStatus === 'Y' ? 'success' : 'warning'}>
                  {existingRequest?.AprStatus === 'Y' ? 'APPROVED BY AUDIT' : 'NEW UNTRACKED'}
                </Badge>
              </div>
            </div>
          </div>

          {/* B. Financial Aggregation Summary */}
          <div className="rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all duration-300 space-y-4" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-[10px] font-bold uppercase tracking-wider border-b pb-2 mb-0" style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}>
              Financial Aggregation Summary
            </h3>
            
            <div className="space-y-3.5">
              <div className="flex justify-between text-xs font-semibold">
                <span style={{ color: 'var(--color-text-secondary)' }}>Totals Before Tax:</span>
                <span className="font-bold font-mono" style={{ color: 'var(--color-text)' }}>
                  {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              {/* Header Discount input */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <span style={{ color: 'var(--color-text-secondary)' }}>Discount Amount (%):</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input-base text-right font-mono font-bold py-1.5 px-3.5 w-[85px] border rounded-lg focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  value={discountPercent}
                  onChange={e => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                  disabled={isView}
                />
              </div>

              {/* Rounding Checkbox & Amount */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <label className="flex items-center gap-2 cursor-pointer mb-0" style={{ color: 'var(--color-text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={hasRounding}
                    onChange={e => setHasRounding(e.target.checked)}
                    disabled={isView}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>Rounding</span>
                </label>
                {hasRounding && (
                  <input
                    type="number"
                    step="any"
                    className="input-base text-right font-mono py-1.5 px-3 w-[100px] border rounded-lg focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    value={roundingAmount}
                    onChange={e => setRoundingAmount(Number(e.target.value))}
                    disabled={isView}
                  />
                )}
              </div>

              {/* Freight Checkbox & Amount */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <label className="flex items-center gap-2 cursor-pointer mb-0" style={{ color: 'var(--color-text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={hasFreight}
                    onChange={e => setHasFreight(e.target.checked)}
                    disabled={isView}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>Freight</span>
                </label>
                {hasFreight && (
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="input-base text-right font-mono py-1.5 px-3 w-[100px] border rounded-lg focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    value={freightAmount}
                    onChange={e => setFreightAmount(Number(e.target.value))}
                    disabled={isView}
                  />
                )}
              </div>

              <div className="flex justify-between text-xs font-semibold">
                <span style={{ color: 'var(--color-text-secondary)' }}>Tax Amount:</span>
                <span className="font-bold font-mono" style={{ color: 'var(--color-text)' }}>
                  {totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Grand Total */}
              <div className="flex flex-col border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span style={{ color: 'var(--color-text)' }}>Final Total Amount:</span>
                  <span className="text-primary font-mono text-base font-extrabold animate-pulse-soft">
                    {finalDocTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider mt-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>System Default Valuation</span>
                  <span>Currency Base: {currency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* C. Remarks */}
          <div className="rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all duration-300 space-y-2" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-[10px] font-bold uppercase tracking-wider m-0" style={{ color: 'var(--color-text-secondary)' }}>
              Remarks
            </h3>
            <textarea
              className="input-base w-full h-[70px] text-xs resize-none py-2 px-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="Add administrative scope descriptions here..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              disabled={isView}
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            />
          </div>

          {/* D. Attachments Upload */}
          <div className="rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all duration-300 space-y-3" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-[10px] font-bold uppercase tracking-wider m-0" style={{ color: 'var(--color-text-secondary)' }}>
              Attachments
            </h3>
            
            <div className="border-2 border-dashed rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-900/10 hover:border-primary transition-all cursor-pointer" style={{ borderColor: 'var(--color-border)' }}>
              <UploadCloud className="h-8 w-8 text-primary mx-auto mb-2 animate-bounce-soft" />
              <p className="text-xs font-bold m-0" style={{ color: 'var(--color-text)' }}>
                Select Files or Drag & Drop Here
              </p>
              <p className="text-[9px] uppercase tracking-wider font-bold m-0 mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                PDF, JPG, PNG files up to 10MB
              </p>
            </div>
          </div>

        </div>
        
      </div>
      
    </div>
  );
};
export default PurchaseRequestFormPage;
