import React, { useState, useEffect } from 'react';
import { 
  Building2, Save, DollarSign, RefreshCw, Palette, Info, Server,
  ShieldCheck, MailCheck, CreditCard, Layout
} from 'lucide-react';
import { useCompanyDetails, useUpdateCompanyDetails } from './api/useCompany';
import type { CompanyDetail } from './api/useCompany';

export const CompanyDetails: React.FC = () => {
  const { data: response, isLoading, isError, refetch } = useCompanyDetails();
  const updateMutation = useUpdateCompanyDetails();

  const [form, setForm] = useState<Partial<CompanyDetail>>({
    companyName: '',
    companyAddr: '',
    printHeader: '',
    phone1: '',
    phone2: '',
    fax: '',
    email: '',
    localCur: '',
    systemCur: '',
    tin: '',
    vrn: '',
    smtpEmail: '',
    smtpPassword: '',
    smtpServer: '',
    smtpPort: '',
    smtpType: '',
    headerColor: '#676455',
    leftMenuColor: '#b09b7c',
    compUrl: '',
    compLogo: '',
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'smtp' | 'branding'>('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (response?.data) {
      setForm(response.data);
    }
  }, [response]);

  const handleChange = (key: keyof CompanyDetail, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync(form);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <span className="animate-spin text-4xl text-primary font-bold">↻</span>
        <span className="text-sm opacity-60 font-semibold">Retrieving company config details...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <Building2 className="h-12 w-12 text-rose-500 opacity-80" />
        <h3 className="text-base font-bold">Failed to load company config</h3>
        <button onClick={() => refetch()} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5" /> Try Again
        </button>
      </div>
    );
  }

  const cardStyle = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '24px',
    padding: '32px',
    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.08)',
  };

  const inputCls = `
    w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200
    border focus:ring-2 focus:ring-primary/20 focus:border-primary
  `;

  const inputStyle = {
    background: 'var(--color-background)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text)',
  };

  const labelCls = 'block text-[11px] font-extrabold uppercase tracking-wider mb-2 opacity-60';

  const tabItems = [
    { id: 'profile', label: 'Identity', icon: Building2, desc: 'Address & corporate contacts' },
    { id: 'billing', label: 'Tax & Currency', icon: CreditCard, desc: 'TIN, VRN, accounting currency' },
    { id: 'smtp', label: 'SMTP Mailer', icon: MailCheck, desc: 'Mailer gateway settings' },
    { id: 'branding', label: 'Branding Theme', icon: Palette, desc: 'CRM colors & customization' },
  ];

  return (
    <div className="page-container p-6 space-y-8 max-w-6xl mx-auto">
      
      {/* Title & Top Save Row */}
      <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-primary px-2.5 py-1 rounded-md bg-primary/10">Configuration</span>
          <h1 className="text-3xl font-black mt-2 flex items-center gap-2.5" style={{ color: 'var(--color-text)' }}>
            <Building2 className="h-8 w-8 text-primary" /> Corporate Account
          </h1>
          <p className="text-sm opacity-70 mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Configure global corporate identity settings, tax records, SMTP gateways, and CRM menu layouts.
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 bg-primary hover:bg-primary-hover"
        >
          {updateMutation.isPending ? <span className="animate-spin">↻</span> : <Save className="h-4.5 w-4.5" />}
          Apply Modifications
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" /> Settings updated successfully!
        </div>
      )}

      {/* Styled Grid tabs / Sections selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tabItems.map(item => {
          const Icon = item.icon;
          const isSelected = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between h-28 ${
                isSelected ? 'shadow-md border-primary' : 'hover:bg-surface-hover hover:border-gray-300'
              }`}
              style={{
                background: 'var(--color-surface)',
                borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
              }}
            >
              <div className={`p-2 rounded-xl w-10 h-10 flex items-center justify-center ${isSelected ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black" style={{ color: 'var(--color-text)' }}>{item.label}</h4>
                <p className="text-[10px] opacity-60 mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{item.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Layout containing form options & theme previews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Active configuration panel */}
        <div className="lg:col-span-2" style={cardStyle}>
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="border-b pb-4 mb-4" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="text-base font-black flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                  <Building2 className="w-5 h-5 text-primary" /> Corporate Identity Profile
                </h3>
                <p className="text-xs opacity-60 mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Registered legal name and regional contact details.</p>
              </div>

              <div>
                <label className={labelCls}>Legal Company Name</label>
                <input 
                  className={`${inputCls} bg-gray-100 opacity-60 cursor-not-allowed`} 
                  style={inputStyle} 
                  type="text" 
                  readOnly 
                  value={form.companyName ?? ''} 
                />
              </div>

              <div>
                <label className={labelCls}>Registered Office Address</label>
                <textarea 
                  className={inputCls} 
                  style={inputStyle} 
                  rows={4} 
                  placeholder="Street, City, P.O. Box..."
                  value={form.companyAddr ?? ''} 
                  onChange={e => handleChange('companyAddr', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Primary Telephone</label>
                  <input 
                    className={inputCls} 
                    style={inputStyle} 
                    type="text" 
                    placeholder="Telephone 1"
                    value={form.phone1 ?? ''} 
                    onChange={e => handleChange('phone1', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Alternative Telephone</label>
                  <input 
                    className={inputCls} 
                    style={inputStyle} 
                    type="text" 
                    placeholder="Telephone 2"
                    value={form.phone2 ?? ''} 
                    onChange={e => handleChange('phone2', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Fax Gateway</label>
                  <input 
                    className={inputCls} 
                    style={inputStyle} 
                    type="text" 
                    placeholder="Fax number..."
                    value={form.fax ?? ''} 
                    onChange={e => handleChange('fax', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Official E-Mail Support</label>
                  <input 
                    className={inputCls} 
                    style={inputStyle} 
                    type="email" 
                    placeholder="support@company.com"
                    value={form.email ?? ''} 
                    onChange={e => handleChange('email', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="border-b pb-4 mb-4" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="text-base font-black flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                  <DollarSign className="w-5 h-5 text-primary" /> Tax Records & System Currencies
                </h3>
                <p className="text-xs opacity-60 mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Accounting currencies and tax registry numbers.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>TIN (Tax Identification Number)</label>
                  <input 
                    className={inputCls} 
                    style={inputStyle} 
                    type="text" 
                    placeholder="Tax ID..."
                    value={form.tin ?? ''} 
                    onChange={e => handleChange('tin', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>VRN (Value Registration Number)</label>
                  <input 
                    className={inputCls} 
                    style={inputStyle} 
                    type="text" 
                    placeholder="VAT Registration..."
                    value={form.vrn ?? ''} 
                    onChange={e => handleChange('vrn', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Local Base Currency</label>
                  <input 
                    className={inputCls} 
                    style={inputStyle} 
                    type="text" 
                    placeholder="TZS / KES"
                    value={form.localCur ?? ''} 
                    onChange={e => handleChange('localCur', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Global System Currency</label>
                  <input 
                    className={inputCls} 
                    style={inputStyle} 
                    type="text" 
                    placeholder="USD / EUR"
                    value={form.systemCur ?? ''} 
                    onChange={e => handleChange('systemCur', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Invoice Print Header Subtitle</label>
                <input 
                  className={inputCls} 
                  style={inputStyle} 
                  type="text" 
                  placeholder="Text on invoice PDF print outs..."
                  value={form.printHeader ?? ''} 
                  onChange={e => handleChange('printHeader', e.target.value)}
                />
              </div>
            </div>
          )}

          {activeTab === 'smtp' && (
            <div className="space-y-6">
              <div className="border-b pb-4 mb-4" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="text-base font-black flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                  <Server className="w-5 h-5 text-primary" /> Outgoing SMTP Mail Settings
                </h3>
                <p className="text-xs opacity-60 mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>SMTP servers are used to send transaction notifications & invoice PDFs.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className={labelCls}>SMTP Host Server</label>
                  <input 
                    className={inputCls} 
                    style={inputStyle} 
                    type="text" 
                    placeholder="smtp.domain.com"
                    value={form.smtpServer ?? ''} 
                    onChange={e => handleChange('smtpServer', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Host Port</label>
                  <input 
                    className={inputCls} 
                    style={inputStyle} 
                    type="text" 
                    placeholder="587 / 465"
                    value={form.smtpPort ?? ''} 
                    onChange={e => handleChange('smtpPort', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>SMTP Username</label>
                  <input 
                    className={inputCls} 
                    style={inputStyle} 
                    type="text" 
                    placeholder="email@company.com"
                    value={form.smtpEmail ?? ''} 
                    onChange={e => handleChange('smtpEmail', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>SMTP Password</label>
                  <input 
                    className={inputCls} 
                    style={inputStyle} 
                    type="password" 
                    placeholder="••••••••••••"
                    value={form.smtpPassword ?? ''} 
                    onChange={e => handleChange('smtpPassword', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>SMTP Email Delivery System</label>
                <select 
                  className={inputCls} 
                  style={inputStyle} 
                  value={form.smtpType ?? ''} 
                  onChange={e => handleChange('smtpType', e.target.value)}
                >
                  <option value="">Choose Service</option>
                  <option value="SendGrid">SendGrid Direct Integration</option>
                  <option value="SmtpServer">SMTP Relay Server</option>
                  <option value="Gmail">Google Workspace SMTP</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div className="border-b pb-4 mb-4" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="text-base font-black flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                  <Palette className="w-5 h-5 text-primary" /> Application UI Branding
                </h3>
                <p className="text-xs opacity-60 mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Brand colors and domain paths for customization.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Header Color Accent</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      className="w-12 h-12 border rounded-xl cursor-pointer" 
                      value={form.headerColor ?? '#676455'} 
                      onChange={e => handleChange('headerColor', e.target.value)} 
                    />
                    <input 
                      type="text" 
                      className={inputCls} 
                      style={inputStyle} 
                      value={form.headerColor ?? ''} 
                      onChange={e => handleChange('headerColor', e.target.value)} 
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Sidebar Menu Color</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      className="w-12 h-12 border rounded-xl cursor-pointer" 
                      value={form.leftMenuColor ?? '#b09b7c'} 
                      onChange={e => handleChange('leftMenuColor', e.target.value)} 
                    />
                    <input 
                      type="text" 
                      className={inputCls} 
                      style={inputStyle} 
                      value={form.leftMenuColor ?? ''} 
                      onChange={e => handleChange('leftMenuColor', e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Unique Company URL Domain</label>
                  <input 
                    className={inputCls} 
                    style={inputStyle} 
                    type="text" 
                    placeholder="subdomain.dccsales.com"
                    value={form.compUrl ?? ''} 
                    onChange={e => handleChange('compUrl', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Theme Logo Filename</label>
                  <input 
                    className={inputCls} 
                    style={inputStyle} 
                    type="text" 
                    placeholder="logo.png"
                    value={form.compLogo ?? ''} 
                    onChange={e => handleChange('compLogo', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Mockup UI Preview */}
        <div className="space-y-6">
          <div style={{ ...cardStyle, padding: '24px' }} className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 opacity-70" style={{ color: 'var(--color-text)' }}>
              <Layout className="w-4 h-4 text-primary" /> Live Branding Mock
            </h4>
            <p className="text-[10px] opacity-60 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              A preview of the CRM interface showing the chosen header and left menu colors in real-time.
            </p>

            <div className="border rounded-2xl overflow-hidden shadow-inner flex h-48 bg-slate-100" style={{ borderColor: 'var(--color-border)' }}>
              {/* Mock Sidebar */}
              <div 
                className="w-1/3 p-3 flex flex-col justify-between transition-colors duration-300"
                style={{ backgroundColor: form.leftMenuColor || '#b09b7c' }}
              >
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black text-white">Logo</div>
                  <div className="h-2 w-12 rounded bg-white/30" />
                  <div className="h-2 w-14 rounded bg-white/20" />
                  <div className="h-2 w-10 rounded bg-white/20" />
                </div>
                <div className="h-3 w-12 rounded bg-white/10" />
              </div>

              {/* Mock Content */}
              <div className="flex-1 flex flex-col">
                {/* Mock Header */}
                <div 
                  className="h-10 px-3 flex items-center justify-between transition-colors duration-300"
                  style={{ backgroundColor: form.headerColor || '#676455' }}
                >
                  <div className="h-2.5 w-16 rounded bg-white/30" />
                  <div className="w-5 h-5 rounded-full bg-white/20" />
                </div>

                {/* Mock Page Content */}
                <div className="flex-1 p-3 space-y-2 bg-white">
                  <div className="h-3 w-20 rounded bg-slate-200" />
                  <div className="h-2 w-full rounded bg-slate-100" />
                  <div className="h-2 w-5/6 rounded bg-slate-100" />
                  <div className="h-2.5 w-12 rounded bg-slate-200" />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 items-start p-3 bg-primary/5 rounded-xl border border-primary/10">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] opacity-70 leading-normal" style={{ color: 'var(--color-text-secondary)' }}>
                Colors defined here affect menu backgrounds, header badges, email logos, and PDF layouts globally.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
export default CompanyDetails;
