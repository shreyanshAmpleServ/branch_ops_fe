import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User as UserIcon, Shield, Lock, Save, 
  X, CreditCard, Mail, MapPin, 
  Layers, Settings, Trash2, DollarSign as DollarSignIcon
} from 'lucide-react';
import { 
  type ApiUser, 
  type UpdateUserPayload, 
  type CreateUserPayload,
  useCreateUser, 
  useUpdateUser 
} from './api/useUsers';
import { 
  useAreas, useWarehouses, useProjects, useBranches, 
  useCostCentersMain, useAccounts 
} from './api/useMasterData';
import { useDesignStore } from '../../store/useDesignStore';
import { 
  WarehouseSelect, 
  ProjectSelect, 
  BranchSelect, 
  GLAccountSelect, 
  StageSelect,
  SearchableSelect
} from '../../components/ui';

interface UserEditCanvasProps {
  user?: ApiUser | null;
  onClose: () => void;
  onSave?: (id: number, payload: UpdateUserPayload) => Promise<void>;
  onCreate?: (payload: CreateUserPayload) => Promise<void>;
  isSaving?: boolean;
  isCurrentUserAdmin: boolean;
}

const MODULES = [
  'User Management',
  'Approval',
  'Customer',
  'Approve Customer',
  'Projects',
  'Banking',
  'Supplier',
  'Stock at Warehouse'
];

type Permissions = Record<string, { view: boolean; write: boolean; drop: boolean }>;
type TabType = 'identity' | 'financials' | 'erp';

export const UserEditCanvas: React.FC<UserEditCanvasProps> = ({ 
  user, onClose, onSave, onCreate, isSaving, isCurrentUserAdmin 
}) => {
  const { activeDesign } = useDesignStore();
  const isGlass = activeDesign === 'design1';

  const isCreateMode = !user || !user.id;
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const { data: areasData } = useAreas();
  const { data: warehousesData } = useWarehouses();
  const { data: projectsData } = useProjects();
  const { data: branchesData } = useBranches();
  const { data: costCentersMainData } = useCostCentersMain();
  const { data: accountsData } = useAccounts();
  
  const [activeTab, setActiveTab] = useState<TabType>('identity');
  const [password, setPassword] = useState('');
  const [userCode, setUserCode] = useState('');

  const [form, setForm] = useState<UpdateUserPayload>({
    firstName: user?.firstName ?? '',
    middleName: user?.middleName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    mobileNo: user?.mobileNo ?? '',
    gender: user?.gender ?? 'Male',
    dob: user?.dob ? user.dob.substring(0, 10) : '',
    address: user?.address ?? '',
    department: user?.department ?? '',
    active: user?.active ?? true,
    isAdmin: user?.isAdmin ?? false,
    branchId: user?.branchId ?? null,
    project: user?.project ?? '',
    dfltWhsId: user?.dfltWhsId ?? null,
    route: user?.route ?? '',
    maxDiscount: user?.maxDiscount ?? 0,
    isPriceEdit: user?.isPriceEdit ?? false,
    isAllowLineDiscount: user?.isAllowLineDiscount ?? false,
    isFrieghtAdd: user?.isFrieghtAdd ?? false,
    dim1: user?.dim1 ?? '',
    dim2: user?.dim2 ?? '',
    dim3: user?.dim3 ?? '',
    dim4: user?.dim4 ?? '',
    cashAcct: user?.cashAcct ?? '',
    checkAcct: user?.checkAcct ?? '',
    tigoPesa: user?.tigoPesa ?? '',
    mpesa: user?.mpesa ?? '',
    airtelMoney: user?.airtelMoney ?? '',
    bankDeposit: user?.bankDeposit ?? '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName ?? '',
        middleName: user.middleName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
        mobileNo: user.mobileNo ?? '',
        gender: user.gender ?? 'Male',
        dob: user.dob ? user.dob.substring(0, 10) : '',
        address: user.address ?? '',
        department: user.department ?? '',
        active: user.active ?? true,
        isAdmin: user.isAdmin ?? false,
        branchId: user.branchId ?? null,
        project: user.project ?? '',
        dfltWhsId: user.dfltWhsId ?? null,
        route: user.route ?? '',
        maxDiscount: user.maxDiscount ?? 0,
        isPriceEdit: user.isPriceEdit ?? false,
        isAllowLineDiscount: user.isAllowLineDiscount ?? false,
        isFrieghtAdd: user.isFrieghtAdd ?? false,
        dim1: user.dim1 ?? '',
        dim2: user.dim2 ?? '',
        dim3: user.dim3 ?? '',
        dim4: user.dim4 ?? '',
        cashAcct: user.cashAcct ?? '',
        checkAcct: user.checkAcct ?? '',
        tigoPesa: user.tigoPesa ?? '',
        mpesa: user.mpesa ?? '',
        airtelMoney: user.airtelMoney ?? '',
        bankDeposit: user.bankDeposit ?? '',
      });
      setUserCode(user.code || '');
    } else {
      setForm({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        mobileNo: '',
        gender: 'Male',
        dob: '',
        address: '',
        department: '',
        active: true,
        isAdmin: false,
        branchId: null,
        project: '',
        dfltWhsId: null,
        route: '',
        maxDiscount: 0,
        isPriceEdit: false,
        isAllowLineDiscount: false,
        isFrieghtAdd: false,
        dim1: '',
        dim2: '',
        dim3: '',
        dim4: '',
        cashAcct: '',
        checkAcct: '',
        tigoPesa: '',
        mpesa: '',
        airtelMoney: '',
        bankDeposit: '',
      });
      setPassword('');
      setUserCode('');
    }
  }, [user]);

  const [permissions, setPermissions] = useState<Permissions>({});
  const [accounts, setAccounts] = useState<any[]>([]);

  // Product Cost Centers (Dimension 1)
  const productsList = React.useMemo(() => {
    const list = costCentersMainData?.data?.filter(cc => cc.dimCode === 1) || [];
    return list.length > 0 ? list : [
      { code: 'PRD001', name: 'LPG Gas 15Kg' },
      { code: 'PRD002', name: 'LPG Gas 38Kg' },
      { code: 'PRD003', name: 'Gas Stove Double' },
    ];
  }, [costCentersMainData?.data]);

  // Location Cost Centers (Dimension 3)
  const locationsList = React.useMemo(() => {
    const list = costCentersMainData?.data?.filter(cc => cc.dimCode === 3) || [];
    return list.length > 0 ? list : [
      { code: 'LOC001', name: 'HQ Warehouse' },
      { code: 'LOC002', name: 'Dar es Salaam Shop' },
      { code: 'LOC003', name: 'Arusha Hub' },
    ];
  }, [costCentersMainData?.data]);

  // Asset Cost Centers (Dimension 4)
  const assetsList = React.useMemo(() => {
    const list = costCentersMainData?.data?.filter(cc => cc.dimCode === 4) || [];
    return list.length > 0 ? list : [
      { code: 'AST001', name: 'Delivery Truck T123' },
      { code: 'AST002', name: 'Office Computers' },
      { code: 'AST003', name: 'Warehouse Forklift' },
    ];
  }, [costCentersMainData?.data]);

  useEffect(() => {
    try {
      if (user?.userPermission) {
        const parsed = JSON.parse(user.userPermission);
        if (parsed && (parsed.permissions || parsed.accounts)) {
          setPermissions(parsed.permissions || {});
          setAccounts(parsed.accounts || []);
        } else {
          setPermissions(parsed || {});
          // fallback to load from individual fields
          setAccounts([
            { name: 'Cash Account', accountNumber: user.cashAcct || '', accountType: 'Cash Account' },
            { name: 'Check Account', accountNumber: user.checkAcct || '', accountType: 'Check Account' },
            { name: 'Tigo Pesa', accountNumber: user.tigoPesa || '', accountType: 'Mobile Money' },
            { name: 'M-Pesa', accountNumber: user.mpesa || '', accountType: 'Mobile Money' },
            { name: 'Airtel Money', accountNumber: user.airtelMoney || '', accountType: 'Mobile Money' },
            { name: 'Bank Deposit', accountNumber: user.bankDeposit || '', accountType: 'Bank Deposit' },
          ].filter(a => a.accountNumber));
        }
      } else {
        const initialPerms: Permissions = {};
        MODULES.forEach(m => initialPerms[m] = { view: false, write: false, drop: false });
        setPermissions(initialPerms);
        // fallback to load from individual fields
        setAccounts([
          { name: 'Cash Account', accountNumber: user?.cashAcct || '', accountType: 'Cash Account' },
          { name: 'Check Account', accountNumber: user?.checkAcct || '', accountType: 'Check Account' },
          { name: 'Tigo Pesa', accountNumber: user?.tigoPesa || '', accountType: 'Mobile Money' },
          { name: 'M-Pesa', accountNumber: user?.mpesa || '', accountType: 'Mobile Money' },
          { name: 'Airtel Money', accountNumber: user?.airtelMoney || '', accountType: 'Mobile Money' },
          { name: 'Bank Deposit', accountNumber: user?.bankDeposit || '', accountType: 'Bank Deposit' },
        ].filter(a => a.accountNumber));
      }
    } catch {
      const initialPerms: Permissions = {};
      MODULES.forEach(m => initialPerms[m] = { view: false, write: false, drop: false });
      setPermissions(initialPerms);
      setAccounts([]);
    }
  }, [user?.userPermission, user?.cashAcct, user?.checkAcct, user?.tigoPesa, user?.mpesa, user?.airtelMoney, user?.bankDeposit]);

  const set = (key: keyof UpdateUserPayload, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleGlobalSync = (type: 'view' | 'write' | 'drop', value: boolean) => {
    const newPerms = { ...permissions };
    Object.keys(newPerms).forEach(k => {
      newPerms[k] = { ...newPerms[k], [type]: value };
    });
    setPermissions(newPerms);
  };

  const handlePermissionChange = (module: string, type: 'view' | 'write' | 'drop', value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...(prev[module] || { view: false, write: false, drop: false }),
        [type]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName || !form.firstName.trim()) {
      alert('First name is required.');
      return;
    }

    const cash = accounts.find(a => a.accountType === 'Cash Account' || a.name.toLowerCase().includes('cash'));
    const check = accounts.find(a => a.accountType === 'Check Account' || a.name.toLowerCase().includes('check'));
    const tigo = accounts.find(a => a.name.toLowerCase().includes('tigo'));
    const mpesaAcc = accounts.find(a => a.name.toLowerCase().includes('mpesa') || a.name.toLowerCase().includes('m-pesa'));
    const airtel = accounts.find(a => a.name.toLowerCase().includes('airtel'));
    const bank = accounts.find(a => a.accountType === 'Bank Deposit' || a.name.toLowerCase().includes('bank') || a.name.toLowerCase().includes('deposit'));

    const payload: any = {
      ...form,
      cashAcct: cash ? cash.accountNumber : (form.cashAcct || ''),
      checkAcct: check ? check.accountNumber : (form.checkAcct || ''),
      tigoPesa: tigo ? tigo.accountNumber : (form.tigoPesa || ''),
      mpesa: mpesaAcc ? mpesaAcc.accountNumber : (form.mpesa || ''),
      airtelMoney: airtel ? airtel.accountNumber : (form.airtelMoney || ''),
      bankDeposit: bank ? bank.accountNumber : (form.bankDeposit || ''),
      userPermission: JSON.stringify({ permissions, accounts })
    };

    if (isCreateMode) {
      const createPayload: CreateUserPayload = {
        ...payload,
        password: password || undefined,
        code: userCode || undefined,
      };
      if (onCreate) {
        await onCreate(createPayload);
      } else {
        await createUser.mutateAsync(createPayload);
        onClose();
      }
    } else if (user?.id) {
      if (onSave) {
        await onSave(user.id, payload);
      } else {
        await updateUser.mutateAsync({ id: user.id, payload });
        onClose();
      }
    }
  };

  const inputCls = isGlass
    ? 'glass-input w-full px-3 py-1.5 rounded-lg text-xs outline-none transition-all duration-200'
    : 'w-full px-3 py-1.5 rounded-lg text-xs outline-none transition-all duration-200 border focus:ring-2 focus:ring-primary/20 focus:border-primary';

  const inputStyle = isGlass ? undefined : {
    background: 'var(--color-surface)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text)',
  };

  const labelCls = 'block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-70';

  const cardCls = isGlass ? 'glass-card p-4 rounded-xl' : 'rounded-xl p-4';
  const resolvedCardStyle = isGlass ? undefined : {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
  };

  const getInitials = () => {
    const f = form.firstName?.[0] || '';
    const l = form.lastName?.[0] || '';
    return (f + l).toUpperCase() || (isCreateMode ? 'NU' : 'U');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Premium Backdrop */}
      <motion.div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Slide-out Offcanvas Panel */}
      <motion.div
        className={`relative w-full max-w-5xl h-full shadow-2xl flex flex-col z-10 ${isGlass ? 'glass-card border-l backdrop-blur-2xl' : ''}`}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 180 }}
        style={!isGlass ? { background: 'var(--color-background)', borderLeft: '1px solid var(--color-border)' } : { borderLeftColor: 'var(--color-border)' }}
      >
        
        {/* Canvas Header */}
        <div className="px-5 py-3.5 border-b flex flex-col gap-3 shrink-0" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Profile Ring */}
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold text-white shadow-inner bg-gradient-to-tr from-primary to-blue-400 shrink-0">
                {getInitials()}
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white flex items-center justify-center ${form.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              </div>
              
              <div>
                <h1 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                  {isCreateMode ? 'Create New User Account' : `User Profile: ${form.firstName} ${form.lastName}`}
                </h1>
                <p className="text-xs opacity-60 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5" /> {form.email || (isCreateMode ? 'Enter credentials and configuration' : 'No email provided')} &middot; Role: {form.isAdmin ? 'Admin' : 'User'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmit}
                disabled={isSaving || createUser.isPending || updateUser.isPending}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs transition-all hover:opacity-95 active:scale-98 disabled:opacity-60 cursor-pointer"
                style={{ background: 'var(--color-primary)' }}
              >
                {isSaving || createUser.isPending || updateUser.isPending ? (
                  <span className="animate-spin text-sm">↻</span>
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {isCreateMode ? 'Create User' : 'Save Details'}
              </button>
              
              <button 
                onClick={onClose} 
                className="p-1.5 rounded-lg hover:bg-black/10 transition-colors cursor-pointer"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Premium Tab Bar */}
          <div className="flex gap-1 border-b -mb-3.5 pt-1" style={{ borderColor: 'var(--color-border)' }}>
            {[
              { id: 'identity', label: 'Identity Dossier', icon: UserIcon },
              { id: 'financials', label: 'Financials & Accounts', icon: DollarSignIcon },
              { id: 'erp', label: 'ERP & Controls', icon: Layers },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold transition-all relative border-b-2 -mb-[2px] cursor-pointer ${
                    isActive 
                      ? 'text-primary border-primary font-bold' 
                      : 'text-gray-400 hover:text-gray-600 border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-3.5 space-y-3.5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              
              {/* TAB 1: IDENTITY DOSSIER */}
              {activeTab === 'identity' && (
                <div className="space-y-3.5">
                  <div className={cardCls} style={resolvedCardStyle}>
                    <h2 className="text-xs font-bold flex items-center gap-1.5 mb-3 pb-1.5 border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                      <UserIcon className="h-4 w-4 text-primary" /> Basic User Profile
                    </h2>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className={labelCls}>First Name *</label>
                          <input className={inputCls} style={inputStyle} value={form.firstName} onChange={e => set('firstName', e.target.value)} required />
                        </div>
                        <div>
                          <label className={labelCls}>Middle Name</label>
                          <input className={inputCls} style={inputStyle} value={form.middleName ?? ''} onChange={e => set('middleName', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Last Name</label>
                          <input className={inputCls} style={inputStyle} value={form.lastName ?? ''} onChange={e => set('lastName', e.target.value)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Email Address</label>
                          <input type="email" className={inputCls} style={inputStyle} value={form.email ?? ''} onChange={e => set('email', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Mobile No</label>
                          <input className={inputCls} style={inputStyle} value={form.mobileNo ?? ''} onChange={e => set('mobileNo', e.target.value)} />
                        </div>
                      </div>

                      {isCreateMode && (
                        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border bg-black/5 dark:bg-white/5" style={{ borderColor: 'var(--color-border)' }}>
                          <div>
                            <label className={labelCls}>User Code (Optional)</label>
                            <input 
                              className={inputCls} 
                              style={inputStyle} 
                              placeholder="e.g. EMP0001 (auto-generated if blank)" 
                              value={userCode} 
                              onChange={e => setUserCode(e.target.value)} 
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Password (Default: 123456)</label>
                            <input 
                              type="password" 
                              className={inputCls} 
                              style={inputStyle} 
                              placeholder="Enter initial password" 
                              value={password} 
                              onChange={e => setPassword(e.target.value)} 
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Date of Birth</label>
                          <input type="date" className={inputCls} style={inputStyle} value={form.dob ?? ''} onChange={e => set('dob', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Gender</label>
                          <div className="flex gap-3 mt-1">
                            {['M', 'F'].map(g => (
                              <label key={g} className="flex-1 flex items-center justify-center py-1.5 border rounded-lg cursor-pointer hover:bg-black/5 transition-all gap-2" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                                <input 
                                  type="radio" 
                                  name="gender" 
                                  value={g} 
                                  checked={form.gender === g || (g === 'M' && form.gender === 'Male') || (g === 'F' && form.gender === 'Female')} 
                                  onChange={() => set('gender', g)} 
                                  className="w-3.5 h-3.5 text-primary" 
                                />
                                <span className="text-xs font-medium">{g === 'M' ? 'Male' : 'Female'}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={cardCls} style={resolvedCardStyle}>
                    <h2 className="text-xs font-bold flex items-center gap-1.5 mb-3 pb-1.5 border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                      <MapPin className="h-4 w-4 text-primary" /> Region & Structural Setup
                    </h2>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Area Location</label>
                          <SearchableSelect
                            options={[
                              { value: '', label: 'Select Area' },
                              ...(areasData?.data || []).map(a => ({
                                value: a.code,
                                label: a.name,
                              })),
                            ]}
                            value={form.route ?? ''}
                            onChange={val => set('route', val)}
                            placeholder="Select Area"
                          />
                        </div>
                        <div>
                          <WarehouseSelect
                            label="GIT Warehouse"
                            value={form.dfltWhsId}
                            data={warehousesData?.data}
                            onChange={val => set('dfltWhsId', val ? Number(val) : null)}
                            placeholder="Select Warehouse"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <ProjectSelect
                            label="Primary Project"
                            value={form.project}
                            data={projectsData?.data}
                            onChange={val => set('project', val)}
                            placeholder="Select Project"
                          />
                        </div>
                        <div>
                          <BranchSelect
                            label="Assigned Branch"
                            value={form.branchId}
                            data={branchesData?.data}
                            onChange={val => set('branchId', val ? Number(val) : null)}
                            placeholder="Select Branch"
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelCls}>Physical Address</label>
                        <textarea rows={2} className={inputCls} style={inputStyle} value={form.address ?? ''} onChange={e => set('address', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {isCurrentUserAdmin && (
                    <div className={cardCls} style={resolvedCardStyle}>
                      <h2 className="text-xs font-bold flex items-center gap-1.5 mb-2.5" style={{ color: 'var(--color-text)' }}>
                        <Settings className="w-4 h-4 text-primary" /> Admin Controls
                      </h2>
                      <div className="flex gap-4 bg-black/5 p-3 rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary" checked={form.active} onChange={e => set('active', e.target.checked)} />
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold">Active User Status</span>
                            <span className="text-[11px] text-gray-500">Allow user to authenticate and login to systems</span>
                          </div>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer border-l pl-4" style={{ borderColor: 'var(--color-border)' }}>
                          <input type="checkbox" className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary" checked={form.isAdmin} onChange={e => set('isAdmin', e.target.checked)} />
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold">Administrator Privileges</span>
                            <span className="text-[11px] text-gray-500">Grants full superuser access to ERP modules</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: FINANCIAL RISK & ACCOUNTS MAPPING */}
              {activeTab === 'financials' && (
                <div className="space-y-3.5">
                  
                  <div className={cardCls} style={resolvedCardStyle}>
                    <h2 className="text-xs font-bold flex items-center gap-1.5 mb-3 pb-1.5 border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                      <Shield className="h-4 w-4 text-primary" /> Risk Limits & Threshold Controls
                    </h2>
                    
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                        <div>
                          <h3 className="text-xs font-semibold">Max Discount Allowed (%)</h3>
                          <p className="text-[11px] text-gray-500">Maximum discount percentage the user can apply on document lines</p>
                        </div>
                        <input type="number" className={inputCls} style={{ ...inputStyle, width: '100px', textAlign: 'right' }} value={form.maxDiscount ?? ''} onChange={e => set('maxDiscount', parseFloat(e.target.value))} />
                      </div>

                      <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                        <div>
                          <h3 className="text-xs font-semibold">Allow Price Editing</h3>
                          <p className="text-[11px] text-gray-500">Allow user to manually overwrite unit prices on item sales</p>
                        </div>
                        <input type="checkbox" className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary" checked={form.isPriceEdit} onChange={e => set('isPriceEdit', e.target.checked)} />
                      </div>

                      <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                        <div>
                          <h3 className="text-xs font-semibold">Allow Line Level Discount Editing</h3>
                          <p className="text-[11px] text-gray-500">Enable manually adjusting discounts on item lines</p>
                        </div>
                        <input type="checkbox" className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary" checked={form.isAllowLineDiscount} onChange={e => set('isAllowLineDiscount', e.target.checked)} />
                      </div>

                      <div className="flex items-center justify-between py-2" style={{ borderColor: 'var(--color-border)' }}>
                        <div>
                          <h3 className="text-xs font-semibold">Allow Freight Adding</h3>
                          <p className="text-[11px] text-gray-500">Allow user to append freight/shipping charges to transactions</p>
                        </div>
                        <input type="checkbox" className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary" checked={form.isFrieghtAdd} onChange={e => set('isFrieghtAdd', e.target.checked)} />
                      </div>
                    </div>
                  </div>

                  <div className={cardCls} style={resolvedCardStyle}>
                    <div className="flex items-center justify-between mb-3 pb-1.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <h2 className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                        <CreditCard className="h-4 w-4 text-primary" /> Accounts Mapping Matrix
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setAccounts(prev => [...prev, { name: '', accountNumber: '', accountType: 'Cash Account' }]);
                        }}
                        className="btn-primary text-xs py-1 px-2.5 rounded-lg"
                      >
                        + Add Account
                      </button>
                    </div>
                    
                    <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-black/5">
                            <th className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-gray-500">Name</th>
                            <th className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-gray-500">Account Number / G/L Account</th>
                            <th className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-gray-500">Account Type</th>
                            <th className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-gray-500 text-center w-16">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-xs" style={{ borderColor: 'var(--color-border)' }}>
                          {accounts.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-xs text-gray-400">
                                No mapped accounts. Click "+ Add Account" to map one.
                              </td>
                            </tr>
                          ) : (
                            accounts.map((acc, index) => (
                              <tr key={index} className="hover:bg-black/5">
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={acc.name}
                                    onChange={e => {
                                      const updated = [...accounts];
                                      updated[index] = { ...updated[index], name: e.target.value };
                                      setAccounts(updated);
                                    }}
                                    placeholder="e.g. Cash Account"
                                    className="w-full px-2 py-1 rounded-lg text-xs border focus:ring-1 focus:ring-primary/20 focus:border-primary outline-none"
                                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                  />
                                </td>
                                <td className="py-2 px-3">
                                    <GLAccountSelect
                                      size="sm"
                                      value={acc.accountNumber}
                                      data={accountsData?.data}
                                      onChange={val => {
                                        const updated = [...accounts];
                                        updated[index] = { ...updated[index], accountNumber: String(val || '') };
                                        setAccounts(updated);
                                      }}
                                      placeholder="Select Account"
                                    />
                                  </td>
                                  <td className="py-2 px-3 min-w-[150px]">
                                    <SearchableSelect
                                      size="sm"
                                      options={[
                                        { value: 'Cash Account', label: 'Cash Account' },
                                        { value: 'Check Account', label: 'Check Account' },
                                        { value: 'Mobile Money', label: 'Mobile Money' },
                                        { value: 'Bank Deposit', label: 'Bank Deposit' },
                                        { value: 'Other', label: 'Other' },
                                      ]}
                                      value={acc.accountType}
                                      onChange={val => {
                                        const updated = [...accounts];
                                        updated[index] = { ...updated[index], accountType: val };
                                        setAccounts(updated);
                                      }}
                                    />
                                  </td>
                                <td className="py-2 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAccounts(prev => prev.filter((_, i) => i !== index));
                                    }}
                                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: ERP MATRIX & FINANCIAL DIMENSIONS */}
              {activeTab === 'erp' && (
                <div className="space-y-3.5">
                  
                  <div className={cardCls} style={resolvedCardStyle}>
                    <h2 className="text-xs font-bold flex items-center gap-1.5 mb-3 pb-1.5 border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                      <Layers className="h-4 w-4 text-primary" /> ERP Structure Dimension Category & Financial Center Vectors
                    </h2>

                    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                      <div className="bg-black/5 px-3 py-2 border-b font-bold text-xs uppercase tracking-wider text-gray-500" style={{ borderColor: 'var(--color-border)' }}>
                        COST CENTER
                      </div>
                      
                      <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                        {/* PRODUCT (dim1) */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3">
                          <label className="text-xs font-bold uppercase tracking-wider w-36 text-gray-600">PRODUCT</label>
                          <div className="flex-1 max-w-xl">
                            <StageSelect
                              dimCode={1}
                              data={productsList}
                              value={form.dim1}
                              onChange={val => set('dim1', val)}
                              placeholder="Please Select"
                            />
                          </div>
                        </div>

                        {/* LOCATION (dim3) */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3">
                          <label className="text-xs font-bold uppercase tracking-wider w-36 text-gray-600">LOCATION</label>
                          <div className="flex-1 max-w-xl">
                            <StageSelect
                              dimCode={3}
                              data={locationsList}
                              value={form.dim3}
                              onChange={val => set('dim3', val)}
                              placeholder="Please Select"
                            />
                          </div>
                        </div>

                        {/* ASSET (dim4) */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3">
                          <label className="text-xs font-bold uppercase tracking-wider w-36 text-gray-600">ASSET</label>
                          <div className="flex-1 max-w-xl">
                            <StageSelect
                              dimCode={4}
                              data={assetsList}
                              value={form.dim4}
                              onChange={val => set('dim4', val)}
                              placeholder="Please Select"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={cardCls} style={resolvedCardStyle}>
                    <div className="flex items-center justify-between mb-3 pb-1.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <h2 className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                        <Lock className="h-4 w-4 text-primary" /> ERP Module Permissions Matrix
                      </h2>
                      <div className="flex gap-3 text-xs font-semibold">
                        <span className="text-gray-400">Global Sync:</span>
                        <button type="button" onClick={() => handleGlobalSync('view', true)} className="text-primary hover:underline">VIEW</button>
                        <button type="button" onClick={() => handleGlobalSync('write', true)} className="text-primary hover:underline">WRITE</button>
                        <button type="button" onClick={() => handleGlobalSync('drop', true)} className="text-primary hover:underline">DROP</button>
                      </div>
                    </div>
                    
                    <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-black/5">
                            <th className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-gray-500">Module Name</th>
                            <th className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">View</th>
                            <th className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">Edit / Write</th>
                            <th className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">Drop / Delete</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-xs" style={{ borderColor: 'var(--color-border)' }}>
                          {MODULES.map((mod) => (
                            <tr key={mod} className="hover:bg-black/5">
                              <td className="py-2 px-3 font-medium">{mod}</td>
                              <td className="py-2 px-3 text-center">
                                <input type="checkbox" className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary" checked={permissions[mod]?.view || false} onChange={e => handlePermissionChange(mod, 'view', e.target.checked)} />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input type="checkbox" className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary" checked={permissions[mod]?.write || false} onChange={e => handlePermissionChange(mod, 'write', e.target.checked)} />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input type="checkbox" className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary" checked={permissions[mod]?.drop || false} onChange={e => handlePermissionChange(mod, 'drop', e.target.checked)} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </motion.div>
    </div>
  );
};

