import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sun, Moon, Monitor, Paintbrush, Type, Image as ImageIcon, Layout, Table,
  Globe, DollarSign, Clock, Calendar, Shield, Key, Smartphone
} from 'lucide-react';
import { Card, Toggle, Button, Input, Select } from '../../components/ui';

import { useThemeStore } from '../../store/useThemeStore';
import { useDesignStore } from '../../store/useDesignStore';
import { useLocaleStore } from '../../store/useLocaleStore';
import { useAuthStore } from '../../store/useAuthStore';

import { PRIMARY_COLORS } from '../../types/theme.types';
import type { ThemeMode, FontSize, SidebarStyle, DesignId } from '../../types/theme.types';
import type { TableDesignVariant, TableLibrary } from '../../types/table.types';
import { LANGUAGES, CURRENCIES, TIMEZONES, DATE_FORMATS } from '../../types/i18n.types';
import type { SupportedLanguage, SupportedCurrency, DateFormatType } from '../../types/i18n.types';

export const GeneralSettings: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'appearance' | 'locale' | 'security'>('appearance');

  // Appearance
  const { mode, setMode, fontSize, setFontSize, primaryColor, setPrimaryColor, backgroundImage, setBackgroundImage, backgroundColor, setBackgroundColor, sidebarStyle, setSidebarStyle } = useThemeStore();
  const { activeDesign, setActiveDesign, tableDesign, setTableDesign, tableLibrary, setTableLibrary } = useDesignStore();

  // Locale
  const { language, setLanguage, currency, setCurrency, timezone, setTimezone, dateFormat, setDateFormat } = useLocaleStore();

  // Security
  const { sessionTimeout, setSessionTimeout } = useAuthStore();

  const themes: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { id: 'light', label: t('settings.lightMode'), icon: <Sun className="h-5 w-5" /> },
    { id: 'dark', label: t('settings.darkMode'), icon: <Moon className="h-5 w-5" /> },
    { id: 'system', label: t('settings.systemMode'), icon: <Monitor className="h-5 w-5" /> },
  ];

  const fontSizes: { id: FontSize; label: string }[] = [
    { id: 'sm', label: t('settings.small') },
    { id: 'md', label: t('settings.medium') },
    { id: 'lg', label: t('settings.large') },
    { id: 'xl', label: t('settings.extraLarge') },
  ];

  const designs: { id: DesignId; label: string; desc: string }[] = [
    { id: 'design1', label: t('settings.design1'), desc: 'Modern glass effect with gradient backgrounds' },
    { id: 'design2', label: t('settings.design2'), desc: 'Clean and simple with minimal shadows' },
    { id: 'design3', label: t('settings.design3'), desc: 'Professional look with accent sidebar' },
  ];

  const tableDesigns: { id: TableDesignVariant; label: string }[] = [
    { id: 'modern', label: t('settings.modern') },
    { id: 'striped', label: t('settings.striped') },
    { id: 'card', label: t('settings.card') },
  ];

  const sidebarStyles: { id: SidebarStyle; label: string }[] = [
    { id: 'solid', label: t('settings.solid') },
    { id: 'transparent', label: t('settings.transparent') },
    { id: 'gradient', label: t('settings.gradient') },
  ];

  const tableLibraries: { id: TableLibrary; label: string }[] = [
    { id: 'antd', label: 'Ant Design' },
    { id: 'primereact', label: 'PrimeReact' },
    { id: 'bootstrap', label: 'Bootstrap' },
    { id: 'mui', label: 'MUI DataGrid' },
    { id: 'aggrid', label: 'AG Grid' },
  ];

  return (
    <div className="page-container max-w-4xl">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>{t('nav.general')}</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {[
          { id: 'appearance', label: t('settings.appearance'), icon: <Paintbrush className="h-4 w-4" /> },
          { id: 'locale', label: t('settings.locale'), icon: <Globe className="h-4 w-4" /> },
          { id: 'security', label: t('nav.security'), icon: <Shield className="h-4 w-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-primary text-primary' 
                : 'border-transparent text-text-secondary hover:text-text hover:border-border'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'appearance' && (
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <Paintbrush className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> {t('settings.theme')}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {themes.map(th => (
                <button key={th.id} onClick={() => setMode(th.id)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
                  style={{ background: mode === th.id ? 'rgba(99,102,241,0.1)' : 'var(--color-surface-hover)', border: `2px solid ${mode === th.id ? 'var(--color-primary)' : 'transparent'}` }}>
                  <span style={{ color: mode === th.id ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>{th.icon}</span>
                  <span className="text-xs font-medium" style={{ color: mode === th.id ? 'var(--color-primary)' : 'var(--color-text)' }}>{th.label}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>{t('settings.primaryColor')}</h3>
            <div className="flex flex-wrap gap-3">
              {PRIMARY_COLORS.map(color => (
                <button key={color.id} onClick={() => setPrimaryColor(color.value)}
                  className="h-10 w-10 rounded-full transition-transform hover:scale-110 ring-2 ring-offset-2"
                  style={{ 
                    background: color.value, 
                    '--tw-ring-color': primaryColor === color.value ? color.value : 'transparent', 
                    '--tw-ring-offset-color': 'var(--color-surface)' 
                  } as React.CSSProperties}
                  title={color.label} />
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <Type className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> {t('settings.fontSize')}
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {fontSizes.map(fs => (
                <button key={fs.id} onClick={() => setFontSize(fs.id)}
                  className="py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{ background: fontSize === fs.id ? 'var(--color-primary)' : 'var(--color-surface-hover)', color: fontSize === fs.id ? 'white' : 'var(--color-text)' }}>
                  {fs.label}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <ImageIcon className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> Background Configuration
            </h3>
            
            {/* Background Color Presets */}
            <div className="mb-4">
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Background Colors</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Default', value: null },
                  { label: 'Midnight Slate', value: '#0f172a' },
                  { label: 'Deep Charcoal', value: '#1e1b4b' },
                  { label: 'Emerald Forest', value: '#022c22' },
                  { label: 'Royal Burgundy', value: '#31102f' },
                ].map(bg => (
                  <button
                    key={bg.label}
                    onClick={() => setBackgroundColor(bg.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                    style={{
                      background: bg.value || 'var(--color-surface-hover)',
                      color: bg.value ? 'white' : 'var(--color-text)',
                      borderColor: backgroundColor === bg.value ? 'var(--color-primary)' : 'transparent',
                      borderWidth: '2px'
                    }}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Image Presets */}
            <div className="mb-4">
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Default Images</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Aurora Glow', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80' },
                  { label: 'Sunset Wave', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80' },
                  { label: 'Cyberpunk', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80' },
                ].map(img => (
                  <button
                    key={img.label}
                    onClick={() => setBackgroundImage(img.url)}
                    className="group relative h-16 rounded-xl overflow-hidden border transition-all"
                    style={{
                      borderColor: backgroundImage === img.url ? 'var(--color-primary)' : 'transparent',
                      borderWidth: '2px'
                    }}
                  >
                    <div className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105" style={{ backgroundImage: `url(${img.url})` }} />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-[10px] font-semibold text-white">{img.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Background Image */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Background Image URL</p>
              <div className="flex gap-3">
                <Input
                  value={backgroundImage || ''}
                  onChange={(e) => setBackgroundImage(e.target.value || null)}
                  placeholder={t('settings.enterUrl')}
                  className="flex-1"
                />
                {backgroundImage && (
                  <Button variant="danger" size="sm" onClick={() => setBackgroundImage(null)}>{t('settings.removeBackground')}</Button>
                )}
              </div>
              {backgroundImage && (
                <div className="mt-3 h-32 rounded-xl overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImage})` }} />
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <Layout className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> {t('settings.dashboardDesign')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {designs.map(d => (
                <button key={d.id} onClick={() => setActiveDesign(d.id)}
                  className="p-4 rounded-xl text-left transition-all"
                  style={{ background: activeDesign === d.id ? 'rgba(99,102,241,0.1)' : 'var(--color-surface-hover)', border: `2px solid ${activeDesign === d.id ? 'var(--color-primary)' : 'transparent'}` }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: activeDesign === d.id ? 'var(--color-primary)' : 'var(--color-text)' }}>{d.label}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{d.desc}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <Table className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> {t('settings.tableDesign')}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {tableDesigns.map(td => (
                <button key={td.id} onClick={() => setTableDesign(td.id)}
                  className="py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{ background: tableDesign === td.id ? 'var(--color-primary)' : 'var(--color-surface-hover)', color: tableDesign === td.id ? 'white' : 'var(--color-text)' }}>
                  {td.label}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <Table className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> Table Library (Experimental)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {tableLibraries.map(tl => (
                <button key={tl.id} onClick={() => setTableLibrary(tl.id)}
                  className="py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{ background: tableLibrary === tl.id ? 'var(--color-primary)' : 'var(--color-surface-hover)', color: tableLibrary === tl.id ? 'white' : 'var(--color-text)' }}>
                  {tl.label}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>{t('settings.sidebarStyle')}</h3>
            <div className="grid grid-cols-3 gap-3">
              {sidebarStyles.map(ss => (
                <button key={ss.id} onClick={() => setSidebarStyle(ss.id)}
                  className="py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{ background: sidebarStyle === ss.id ? 'var(--color-primary)' : 'var(--color-surface-hover)', color: sidebarStyle === ss.id ? 'white' : 'var(--color-text)' }}>
                  {ss.label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'locale' && (
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <Globe className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> {t('settings.language')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LANGUAGES.map(lang => (
                <button key={lang.code} onClick={() => setLanguage(lang.code)}
                  className="flex items-center gap-3 p-4 rounded-xl transition-all"
                  style={{ background: language === lang.code ? 'rgba(99,102,241,0.1)' : 'var(--color-surface-hover)', border: `2px solid ${language === lang.code ? 'var(--color-primary)' : 'transparent'}` }}>
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="text-left">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{lang.nativeName}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{lang.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <DollarSign className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> {t('settings.currency')}
            </h3>
            <Select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
              options={CURRENCIES.map(c => ({ value: c.code, label: `${c.symbol} ${c.name} (${c.code})` }))}
            />
          </Card>

          <Card>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <Clock className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> {t('settings.timezone')}
            </h3>
            <Select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              options={TIMEZONES.map(tz => ({ value: tz.value, label: tz.label }))}
            />
          </Card>

          <Card>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <Calendar className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> {t('settings.dateFormat')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DATE_FORMATS.map(df => (
                <button key={df.value} onClick={() => setDateFormat(df.value)}
                  className="p-3 rounded-xl text-center transition-all"
                  style={{ background: dateFormat === df.value ? 'rgba(99,102,241,0.1)' : 'var(--color-surface-hover)', border: `2px solid ${dateFormat === df.value ? 'var(--color-primary)' : 'transparent'}` }}>
                  <p className="text-sm font-medium" style={{ color: dateFormat === df.value ? 'var(--color-primary)' : 'var(--color-text)' }}>{df.label}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{df.example}</p>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <Key className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> {t('settings.changePassword')}
            </h3>
            <div className="space-y-4 max-w-md">
              <Input label={t('settings.currentPassword')} type="password" />
              <Input label={t('settings.newPassword')} type="password" />
              <Input label={t('auth.confirmPassword')} type="password" />
              <Button>{t('settings.changePassword')}</Button>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{t('settings.twoFactor')}</h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Add an extra layer of security to your account</p>
                </div>
              </div>
              <Toggle checked={false} onChange={() => {}} />
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <Clock className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> {t('settings.sessionTimeout')}
            </h3>
            <div className="flex items-center gap-3 max-w-md">
              <input
                type="range"
                min={1}
                max={30}
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="text-sm font-semibold min-w-[80px]" style={{ color: 'var(--color-text)' }}>
                {sessionTimeout} {t('settings.minutes')}
              </span>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              You'll be automatically logged out after {sessionTimeout} minutes of inactivity
            </p>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <Shield className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> {t('settings.activeSessions')}
            </h3>
            <div className="space-y-3">
              {[
                { device: 'Windows PC - Chrome', location: 'Mumbai, India', active: true, time: 'Active now' },
                { device: 'iPhone - Safari', location: 'Delhi, India', active: false, time: '2 hours ago' },
              ].map((session, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--color-surface-hover)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{session.device}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{session.location} · {session.time}</p>
                  </div>
                  {session.active ? (
                    <span className="text-xs font-medium text-success flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-success" /> Active
                    </span>
                  ) : (
                    <Button variant="ghost" size="sm">Revoke</Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
