import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Info, FileText, CheckCircle2, AlertTriangle, 
  MapPin, Eye, Plus, Trash2, Edit3, Save, User, Building2
} from 'lucide-react';
import { 
  useRetailer, useUpdateRetailer, useApproveRetailer,
  useRetailerOrders, useRetailerNotes, useRetailerComplaints,
  type Retailer
} from '../api/useRetailers';
import { Button, Badge, LocationMapPicker } from '../../../components/ui';
import { useDesignStore } from '../../../store/useDesignStore';

interface RetailerDetailCanvasProps {
  retailerId: number;
  onClose: () => void;
}

type TabType = 'info' | 'orders' | 'notes' | 'complaints' | 'gps';

export const RetailerDetailCanvas: React.FC<RetailerDetailCanvasProps> = ({
  retailerId,
  onClose,
}) => {
  const { activeDesign } = useDesignStore();
  const isGlass = activeDesign === 'design1';

  const { data: retailer, isLoading, isError } = useRetailer(retailerId);
  const updateRetailer = useUpdateRetailer();
  const approveRetailer = useApproveRetailer();

  // Sub-tab query hooks
  const { data: orders = [], isLoading: isLoadingOrders } = useRetailerOrders(retailer?.Code || null);
  const { data: notes = [], isLoading: isLoadingNotes } = useRetailerNotes(retailer?.Code || null);
  const { data: complaints = [], isLoading: isLoadingComplaints } = useRetailerComplaints(retailer?.Code || null);

  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [remark, setRemark] = useState('');
  
  // Local Form state
  const [form, setForm] = useState<Partial<Retailer>>({});
  // Geolocation states
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsSuccess, setGpsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (retailer) {
      setForm({
        Name: retailer.Name || '',
        Address: retailer.Address || '',
        Email: retailer.Email || '',
        Owner: retailer.Owner || '',
        OwnerMobileNo: retailer.OwnerMobileNo || '',
        OwnerEmail: retailer.OwnerEmail || '',
        AlternateOwnerMobileNo: retailer.AlternateOwnerMobileNo || '',
        TIN: retailer.TIN || '',
        VAT: retailer.VAT || '',
        PaymentTerms: retailer.PaymentTerms || '',
        CrLimit: retailer.CrLimit || 0,
        CreditDays: retailer.CreditDays || 0,
        Route: retailer.Route || '',
        Latitude: retailer.Latitude || null,
        Longitude: retailer.Longitude || null,
      });
      setLat(retailer.Latitude ? String(retailer.Latitude) : '');
      setLng(retailer.Longitude ? String(retailer.Longitude) : '');
    }
  }, [retailer]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative w-full max-w-5xl h-full shadow-2xl flex items-center justify-center z-10 ${isGlass ? 'glass-card border-l backdrop-blur-2xl' : ''}`} style={!isGlass ? { background: 'var(--color-background)' } : { borderLeftColor: 'var(--color-border)' }}>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (isError || !retailer) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative w-full max-w-5xl h-full shadow-2xl flex flex-col justify-center items-center z-10 p-6 ${isGlass ? 'glass-card border-l backdrop-blur-2xl' : ''}`} style={!isGlass ? { background: 'var(--color-background)' } : { borderLeftColor: 'var(--color-border)' }}>
          <AlertTriangle className="h-12 w-12 text-error mb-4" />
          <p className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Error loading customer details.</p>
          <Button className="mt-4" onClick={onClose}>Close Panel</Button>
        </div>
      </div>
    );
  }

  const handleUpdateField = (key: keyof Retailer, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveInfo = async () => {
    await updateRetailer.mutateAsync({
      id: retailer.ID,
      data: form
    });
  };

  const handleApproveReject = async (status: 'Y' | 'N') => {
    await approveRetailer.mutateAsync({
      id: retailer.ID,
      aprStatus: status,
      remark: remark
    });
    setRemark('');
  };

  const handleFetchGPS = () => {
    setGpsError(null);
    setGpsSuccess(false);
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setLat(String(latitude));
        setLng(String(longitude));
        setForm(prev => ({ ...prev, Latitude: latitude, Longitude: longitude }));
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              setForm(prev => ({ ...prev, Address: data.display_name }));
            }
          }
        } catch {
          // ignore network failure for reverse geocoding
        }

        setGpsSuccess(true);
      },
      (error) => {
        setGpsError(error.message || 'Unable to retrieve location');
      }
    );
  };

  const handleLocationMapSelect = (newLat: number, newLng: number, address?: string) => {
    setLat(String(newLat));
    setLng(String(newLng));
    setForm(prev => ({
      ...prev,
      Latitude: newLat,
      Longitude: newLng,
      ...(address ? { Address: address } : {})
    }));
  };

  const handleSaveGPS = async () => {
    await updateRetailer.mutateAsync({
      id: retailer.ID,
      data: {
        Address: form.Address || null,
        Latitude: lat ? Number(lat) : null,
        Longitude: lng ? Number(lng) : null,
      }
    });
  };

  const inputCls = isGlass
    ? 'glass-input w-full px-3.5 py-2 rounded-xl text-sm outline-none transition-all duration-200'
    : 'w-full px-3.5 py-2 rounded-xl text-sm outline-none transition-all duration-200 border focus:ring-2 focus:ring-primary/20 focus:border-primary';

  const inputStyle = isGlass ? undefined : {
    background: 'var(--color-surface)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text)',
  };

  const labelCls = 'block text-[11px] font-bold uppercase tracking-wider mb-1.5 opacity-70';

  const cardCls = isGlass ? 'glass-card p-5 rounded-2xl' : 'rounded-2xl p-5';
  const resolvedCardStyle = isGlass ? undefined : {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
  };

  const isCustomer = retailer.CardType === 'C';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Slide-out Offcanvas */}
      <motion.div
        className={`relative w-full max-w-5xl h-full shadow-2xl flex flex-col z-10 ${isGlass ? 'glass-card border-l backdrop-blur-2xl' : ''}`}
        style={!isGlass ? { background: 'var(--color-background)' } : { borderLeftColor: 'var(--color-border)' }}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Canvas Header */}
        <div className={`px-6 py-5 border-b flex flex-col gap-4 ${isGlass ? 'bg-slate-950/20' : ''}`} style={{ borderColor: 'var(--color-border)', background: !isGlass ? 'var(--color-surface)' : undefined }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {retailer.Name}
                </h2>
                <Badge variant={retailer.AprStatus === 'Y' ? 'success' : 'warning'}>
                  {retailer.AprStatus === 'Y' ? 'Approved' : 'Pending Approval'}
                </Badge>
              </div>
              <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Code: <span className="font-mono text-primary font-bold">{retailer.Code}</span> | Type: {isCustomer ? 'Customer' : 'Supplier'}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-lg hover:bg-black/10 transition-colors" 
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Dynamic Approval Workflow Panel (Only shown if pending approval) */}
          {retailer.AprStatus !== 'Y' && (
            <div className={`rounded-xl p-4 border flex flex-col md:flex-row md:items-center justify-between gap-4 ${isGlass ? 'bg-slate-950/40' : ''}`} style={{ borderColor: 'var(--color-border)', background: !isGlass ? 'var(--color-background)' : undefined }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Approval Status Workflow
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  This record is currently pending system authorization.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input 
                  type="text" 
                  placeholder="Enter remarks..." 
                  className="px-3 py-1.5 rounded-lg text-xs border outline-none"
                  style={inputStyle}
                  value={remark}
                  onChange={e => setRemark(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => handleApproveReject('N')} 
                    isLoading={approveRetailer.isPending}
                  >
                    Reject
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => handleApproveReject('Y')} 
                    isLoading={approveRetailer.isPending}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Premium Styled Sub-Tabs Header */}
        <div className={`px-6 flex gap-2 border-b overflow-x-auto scrollbar-none ${isGlass ? 'bg-slate-950/10' : ''}`} style={{ borderColor: 'var(--color-border)', background: !isGlass ? 'var(--color-surface)' : undefined }}>
          {([
            { id: 'info', label: 'Info', icon: Info },
            { id: 'orders', label: 'Open Orders', icon: FileText },
            { id: 'notes', label: 'Notes', icon: Edit3 },
            { id: 'complaints', label: 'Complaints', icon: AlertTriangle },
            { id: 'gps', label: 'Latitude & Longitude', icon: MapPin },
          ] as const).map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap
                  ${active ? 'border-primary text-primary' : 'border-transparent hover:text-primary'}
                `}
                style={!active ? { color: 'var(--color-text-secondary)' } : undefined}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {/* INFO TAB */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  {/* Grid forms */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Card 1: Details */}
                    <div className={cardCls} style={resolvedCardStyle}>
                      <h3 className="text-sm font-bold flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                        <Building2 className="h-4.5 w-4.5 text-primary" /> {isCustomer ? 'Customer' : 'Supplier'} Details
                      </h3>
                      <div className="space-y-3.5">
                        <div>
                          <label className={labelCls}>Name</label>
                          <input className={inputCls} style={inputStyle} value={form.Name || ''} onChange={e => handleUpdateField('Name', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Email Address</label>
                          <input className={inputCls} style={inputStyle} value={form.Email || ''} onChange={e => handleUpdateField('Email', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Route / Region</label>
                          <input className={inputCls} style={inputStyle} value={form.Route || ''} onChange={e => handleUpdateField('Route', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Address</label>
                          <textarea className={inputCls} style={inputStyle} rows={2} value={form.Address || ''} onChange={e => handleUpdateField('Address', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls}>TIN</label>
                            <input className={inputCls} style={inputStyle} value={form.TIN || ''} onChange={e => handleUpdateField('TIN', e.target.value)} />
                          </div>
                          <div>
                            <label className={labelCls}>VAT</label>
                            <input className={inputCls} style={inputStyle} value={form.VAT || ''} onChange={e => handleUpdateField('VAT', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Owners & Financials */}
                    <div className="space-y-6">
                      <div className={cardCls} style={resolvedCardStyle}>
                        <h3 className="text-sm font-bold flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                          <User className="h-4.5 w-4.5 text-primary" /> Owner Details
                        </h3>
                        <div className="space-y-3.5">
                          <div>
                            <label className={labelCls}>Owner Name</label>
                            <input className={inputCls} style={inputStyle} value={form.Owner || ''} onChange={e => handleUpdateField('Owner', e.target.value)} />
                          </div>
                          <div>
                            <label className={labelCls}>Owner Mobile No</label>
                            <input className={inputCls} style={inputStyle} value={form.OwnerMobileNo || ''} onChange={e => handleUpdateField('OwnerMobileNo', e.target.value)} />
                          </div>
                          <div>
                            <label className={labelCls}>Owner Email</label>
                            <input className={inputCls} style={inputStyle} value={form.OwnerEmail || ''} onChange={e => handleUpdateField('OwnerEmail', e.target.value)} />
                          </div>
                        </div>
                      </div>

                      <div className={cardCls} style={resolvedCardStyle}>
                        <h3 className="text-sm font-bold flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                          <FileText className="h-4.5 w-4.5 text-primary" /> Finance details
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls}>Credit Limit</label>
                            <input type="number" className={inputCls} style={inputStyle} value={form.CrLimit || 0} onChange={e => handleUpdateField('CrLimit', Number(e.target.value))} />
                          </div>
                          <div>
                            <label className={labelCls}>Credit Days</label>
                            <input type="number" className={inputCls} style={inputStyle} value={form.CreditDays || 0} onChange={e => handleUpdateField('CreditDays', Number(e.target.value))} />
                          </div>
                          <div className="col-span-2">
                            <label className={labelCls}>Payment Terms</label>
                            <input className={inputCls} style={inputStyle} value={form.PaymentTerms || ''} onChange={e => handleUpdateField('PaymentTerms', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Contact Persons Sub-table */}
                  <div className={cardCls} style={resolvedCardStyle}>
                    <div className="flex justify-between items-center mb-4 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                        <User className="h-4.5 w-4.5 text-primary" /> Contact Persons
                      </h3>
                      <Button size="sm" variant="ghost" className="flex items-center gap-1">
                        <Plus className="h-3.5 w-3.5" /> Add Contact
                      </Button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className={`text-xs font-bold uppercase tracking-wider ${isGlass ? 'bg-slate-900/50 text-gray-400' : 'bg-black/5 text-gray-500 dark:bg-white/5 dark:text-gray-400'}`}>
                            <th className="py-2.5 px-4">Name</th>
                            <th className="py-2.5 px-4">Position</th>
                            <th className="py-2.5 px-4">Phone 1</th>
                            <th className="py-2.5 px-4">Email</th>
                            <th className="py-2.5 px-4 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                          {retailer.contacts && retailer.contacts.length > 0 ? (
                            retailer.contacts.map((c: any) => (
                              <tr key={c.ID} className={isGlass ? 'hover:bg-slate-900/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}>
                                <td className="py-2.5 px-4 font-semibold">{c.FirstName} {c.LastName}</td>
                                <td className="py-2.5 px-4 text-xs">{c.Position || '-'}</td>
                                <td className="py-2.5 px-4 text-xs font-mono">{c.Phone1 || '-'}</td>
                                <td className="py-2.5 px-4 text-xs">{c.E_Mail || '-'}</td>
                                <td className="py-2.5 px-4 text-center">
                                  <button className="text-error hover:text-error-hover p-1">
                                    <Trash2 className="h-4.5 w-4.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-xs opacity-60">No contact persons mapped to this BP.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Card 4: Customer Address Sub-table */}
                  <div className={cardCls} style={resolvedCardStyle}>
                    <div className="flex justify-between items-center mb-4 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                        <MapPin className="h-4.5 w-4.5 text-primary" /> Registered Locations / Addresses
                      </h3>
                      <Button size="sm" variant="ghost" className="flex items-center gap-1">
                        <Plus className="h-3.5 w-3.5" /> Create Location
                      </Button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className={`text-xs font-bold uppercase tracking-wider ${isGlass ? 'bg-slate-900/50 text-gray-400' : 'bg-black/5 text-gray-500 dark:bg-white/5 dark:text-gray-400'}`}>
                            <th className="py-2.5 px-4">Contact Person Name</th>
                            <th className="py-2.5 px-4">Address</th>
                            <th className="py-2.5 px-4">Street Address</th>
                            <th className="py-2.5 px-4">Pin Code</th>
                            <th className="py-2.5 px-4 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                          {retailer.addresses && retailer.addresses.length > 0 ? (
                            retailer.addresses.map((addr: any) => (
                              <tr key={addr.ID} className={isGlass ? 'hover:bg-slate-900/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}>
                                <td className="py-2.5 px-4 font-semibold">{addr.ContactPersonName || '-'}</td>
                                <td className="py-2.5 px-4 text-xs">{addr.Building || '-'}</td>
                                <td className="py-2.5 px-4 text-xs">{addr.Street || '-'}</td>
                                <td className="py-2.5 px-4 text-xs font-mono">{addr.ZipCode || '-'}</td>
                                <td className="py-2.5 px-4 text-center">
                                  <button className="text-error hover:text-error-hover p-1">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-xs opacity-60">No location addresses mapped to this BP.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="flex justify-end pt-4">
                    <Button 
                      variant="primary" 
                      icon={<Save className="h-4.5 w-4.5" />} 
                      onClick={handleSaveInfo}
                      isLoading={updateRetailer.isPending}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}

              {/* OPEN ORDERS TAB */}
              {activeTab === 'orders' && (
                <div className={`space-y-4 ${cardCls}`} style={resolvedCardStyle}>
                  <h3 className="text-sm font-bold mb-4 pb-2 border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                    Active Sales & Purchase Orders
                  </h3>

                  <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`text-xs font-bold uppercase tracking-wider ${isGlass ? 'bg-slate-900/50 text-gray-400' : 'bg-black/5 text-gray-500 dark:bg-white/5 dark:text-gray-400'}`}>
                          <th className="py-3 px-4">Order ID</th>
                          <th className="py-3 px-4">Cust. Name</th>
                          <th className="py-3 px-4">Due Date</th>
                          <th className="py-3 px-4">Cust. Ref. No.</th>
                          <th className="py-3 px-4 text-right">Total Amount</th>
                          <th className="py-3 px-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                        {isLoadingOrders ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                            </td>
                          </tr>
                        ) : orders.length > 0 ? (
                          orders.map((o: any) => (
                            <tr key={o.ID} className={isGlass ? 'hover:bg-slate-900/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}>
                              <td className="py-3 px-4 font-mono font-bold text-primary">#{o.ID}</td>
                              <td className="py-3 px-4">{o.CustName}</td>
                              <td className="py-3 px-4 text-xs opacity-80">{o.DueDate ? new Date(o.DueDate).toLocaleDateString() : '-'}</td>
                              <td className="py-3 px-4 text-xs font-mono">{o.CustRefNo || '-'}</td>
                              <td className="py-3 px-4 text-right font-bold text-success">
                                {o.DocTotal ? Number(o.DocTotal).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button className="p-1 rounded hover:bg-black/10 text-primary">
                                  <Eye className="h-4.5 w-4.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-xs opacity-60">No open orders found for this Business Partner.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* NOTES TAB */}
              {activeTab === 'notes' && (
                <div className={`space-y-4 ${cardCls}`} style={resolvedCardStyle}>
                  <h3 className="text-sm font-bold mb-4 pb-2 border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                    Notes & Action Items Log
                  </h3>

                  <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`text-xs font-bold uppercase tracking-wider ${isGlass ? 'bg-slate-900/50 text-gray-400' : 'bg-black/5 text-gray-500 dark:bg-white/5 dark:text-gray-400'}`}>
                          <th className="py-3 px-4">Customer/Subject</th>
                          <th className="py-3 px-4">Start Date</th>
                          <th className="py-3 px-4">End Date</th>
                          <th className="py-3 px-4">Priority</th>
                          <th className="py-3 px-4">Detail</th>
                          <th className="py-3 px-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                        {isLoadingNotes ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                            </td>
                          </tr>
                        ) : notes.length > 0 ? (
                          notes.map((n: any) => (
                            <tr key={n.ID} className={isGlass ? 'hover:bg-slate-900/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}>
                              <td className="py-3 px-4 font-semibold">{n.BPName}</td>
                              <td className="py-3 px-4 text-xs opacity-80">{n.StartDate ? new Date(n.StartDate).toLocaleDateString() : '-'}</td>
                              <td className="py-3 px-4 text-xs opacity-80">{n.EndDate ? new Date(n.EndDate).toLocaleDateString() : '-'}</td>
                              <td className="py-3 px-4">
                                <Badge variant={n.Priority === 'H' ? 'error' : n.Priority === 'M' ? 'warning' : 'success'}>
                                  {n.Priority === 'H' ? 'High' : n.Priority === 'M' ? 'Medium' : 'Low'}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-xs opacity-90 max-w-xs truncate">{n.Details || '-'}</td>
                              <td className="py-3 px-4 text-center">
                                <button className="p-1 rounded hover:bg-black/10 text-primary">
                                  <Eye className="h-4.5 w-4.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-xs opacity-60">No notes or activities mapped to this Business Partner.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* COMPLAINTS TAB */}
              {activeTab === 'complaints' && (
                <div className={`space-y-4 ${cardCls}`} style={resolvedCardStyle}>
                  <h3 className="text-sm font-bold mb-4 pb-2 border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                    Customer Complaints Log
                  </h3>

                  <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`text-xs font-bold uppercase tracking-wider ${isGlass ? 'bg-slate-900/50 text-gray-400' : 'bg-black/5 text-gray-500 dark:bg-white/5 dark:text-gray-400'}`}>
                          <th className="py-3 px-4">Product/Brand</th>
                          <th className="py-3 px-4">Complaint Log</th>
                          <th className="py-3 px-4">Order ID</th>
                          <th className="py-3 px-4">Logged Date</th>
                          <th className="py-3 px-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                        {isLoadingComplaints ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                            </td>
                          </tr>
                        ) : complaints.length > 0 ? (
                          complaints.map((c: any) => (
                            <tr key={c.ID} className={isGlass ? 'hover:bg-slate-900/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}>
                              <td className="py-3 px-4 font-semibold">{c.BrandCode || '-'}</td>
                              <td className="py-3 px-4 text-xs opacity-90 max-w-sm truncate">{c.Complaint || '-'}</td>
                              <td className="py-3 px-4 font-mono text-xs text-primary">#{c.OrderId || '-'}</td>
                              <td className="py-3 px-4 text-xs opacity-80">{c.CreatedDate ? new Date(c.CreatedDate).toLocaleDateString() : '-'}</td>
                              <td className="py-3 px-4 text-center">
                                <button className="p-1 rounded hover:bg-black/10 text-primary">
                                  <Eye className="h-4.5 w-4.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-xs opacity-60">No complaints registered for this Business Partner.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* LATITUDE & LONGITUDE TAB */}
              {activeTab === 'gps' && (
                <div className={`space-y-6 ${cardCls}`} style={resolvedCardStyle}>
                  <div className="pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                      <MapPin className="h-4.5 w-4.5 text-primary" /> Physical Address Registry & GPS Location
                    </h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Update physical address and retrieve precise GPS coordinates with interactive map location.
                    </p>
                  </div>

                  {/* Physical Address Text Input */}
                  <div>
                    <label className={labelCls}>Physical Address Registry</label>
                    <textarea 
                      rows={2} 
                      placeholder="e.g. Plot 42, Commercial Avenue, Dar es Salaam" 
                      className={inputCls} 
                      style={inputStyle}
                      value={form.Address || ''}
                      onChange={e => handleUpdateField('Address', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelCls}>Latitude Coordinate</label>
                      <input 
                        type="text" 
                        placeholder="e.g. -6.7924" 
                        className={inputCls} 
                        style={inputStyle}
                        value={lat}
                        onChange={e => {
                          setLat(e.target.value);
                          setForm(prev => ({ ...prev, Latitude: Number(e.target.value) || null }));
                        }}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Longitude Coordinate</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 39.2083" 
                        className={inputCls} 
                        style={inputStyle}
                        value={lng}
                        onChange={e => {
                          setLng(e.target.value);
                          setForm(prev => ({ ...prev, Longitude: Number(e.target.value) || null }));
                        }}
                      />
                    </div>
                  </div>

                  {gpsError && (
                    <div className="rounded-xl p-4 bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2">
                      <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                      {gpsError}
                    </div>
                  )}

                  {gpsSuccess && (
                    <div className="rounded-xl p-4 bg-success/10 border border-success/20 text-success text-xs flex items-center gap-2">
                      <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                      Successfully retrieved location coordinates and auto-filled physical address!
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                    <Button variant="secondary" onClick={handleFetchGPS} className="w-full sm:w-auto">
                      Fetch Current GPS & Address
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={handleSaveGPS} 
                      isLoading={updateRetailer.isPending}
                      className="w-full sm:w-auto"
                    >
                      Submit Changes
                    </Button>
                  </div>

                  {/* Interactive Map View with Click & Drag Selection + Fullscreen */}
                  <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-3 opacity-70" style={{ color: 'var(--color-text)' }}>
                      Interactive Location Map Registry (Click Map or Drag Pin to Pick Location)
                    </h4>
                    <LocationMapPicker
                      lat={lat}
                      lng={lng}
                      onLocationSelect={handleLocationMapSelect}
                    />
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
