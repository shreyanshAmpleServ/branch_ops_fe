import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronLeft, LogOut, X, Bell, Sun, Moon, Menu, Globe, Home, Paintbrush, Image as ImageIcon } from 'lucide-react';
import { PRIMARY_COLORS } from '../../types/theme.types';
import { NAVIGATION } from '../../config/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useLocaleStore } from '../../store/useLocaleStore';
import { Avatar, Dropdown, ThemeSettingsDropdown } from '../../components/ui';
import { LANGUAGES } from '../../types/i18n.types';
import { useIdleTimeout } from '../../hooks/useIdleTimeout';
import { Modal, Button } from '../../components/ui';
import { Users, Target, Handshake, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from '../../components/ui';
import { BarChartWidget, PieChartWidget } from '../../components/charts';
import { MOCK_DASHBOARD_STATS } from '../../config/constants';
import { formatCurrency, formatNumber } from '../../lib/formatters';

/* ========= Sidebar ========= */
const Sidebar2: React.FC<{ collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onMobileClose: () => void }> = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, openLogoutModal, hasPermission } = useAuthStore();
  const { backgroundImage, backgroundColor, mode, sidebarStyle } = useThemeStore();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const filteredNav = NAVIGATION.filter((item) => !item.permission || hasPermission(item.permission));

  const resolvedMode = mode === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode;
  const isCustomBg = !!backgroundImage || !!backgroundColor;

  const isTransparent = sidebarStyle === 'transparent';
  const isGradient = sidebarStyle === 'gradient';

  // A sidebar is considered dark if it is in dark mode or if a custom background is active and the sidebar is not solid (transparent/gradient)
  const isDarkSidebar = resolvedMode === 'dark' || (isCustomBg && sidebarStyle !== 'solid');

  const textClass = isDarkSidebar ? 'text-white' : 'text-gray-800';
  const textSecClass = isDarkSidebar ? 'text-gray-300' : 'text-gray-600';
  const hoverClass = isDarkSidebar ? 'hover:text-white hover:bg-white/10' : 'hover:text-gray-900 hover:bg-black/5';
  const borderCol = isDarkSidebar ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  const sidebarBg = {
    solid: 'var(--color-surface)',
    transparent: (resolvedMode === 'dark' || isCustomBg) ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.45)',
    gradient: resolvedMode === 'dark'
      ? 'linear-gradient(180deg, rgba(99, 102, 241, 0.15) 0%, rgba(17, 24, 39, 0.95) 100%)'
      : 'linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, rgba(255, 255, 255, 0.9) 100%)',
  };

  const sidebarContent = (
    <div className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[240px]'} ${isTransparent ? 'backdrop-blur-xl' : ''}`}
      style={{
        background: sidebarBg[sidebarStyle] || sidebarBg.solid,
        borderRight: `1px solid ${borderCol}`
      }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16" style={{ borderBottom: `1px solid ${borderCol}` }}>
        {!collapsed && <span className={`text-lg font-bold font-display ${textClass}`}>Sales App</span>}
        {collapsed && <span className="text-lg font-bold mx-auto" style={{ color: 'var(--color-primary)' }}>S</span>}
        <button onClick={onToggle} className={`p-1 rounded-md transition-colors hidden lg:block ${hoverClass}`} style={{ color: isDarkSidebar ? 'white' : 'var(--color-text-secondary)' }}><ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} /></button>
        <button onClick={onMobileClose} className={`p-1 rounded-md transition-colors lg:hidden ${hoverClass}`}><X className="h-4 w-4" style={{ color: isDarkSidebar ? 'white' : 'inherit' }} /></button>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {filteredNav.map((item) => {
          if (item.isHeader) {
            if (collapsed) return <div key={item.id} className="h-4" />;
            return (
              <div key={item.id} className="mt-5 mb-1 px-3">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isDarkSidebar ? 'rgba(255,255,255,0.4)' : 'var(--color-text-secondary)' }}>
                  {t(item.translationKey, item.label)}
                </p>
              </div>
            );
          }
          const active = item.path ? isActive(item.path) : false;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.includes(item.id);
          return (
            <div key={item.id}>
              <button
                onClick={() => hasChildren ? setExpandedItems(p => p.includes(item.id) ? p.filter(i => i !== item.id) : [...p, item.id]) : (item.path && navigate(item.path), onMobileClose())}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${hoverClass} ${active ? 'font-semibold' : ''} ${collapsed ? 'justify-center' : ''}`}
                style={active ? {
                  color: 'white',
                  background: 'var(--color-primary)',
                  boxShadow: '0 4px 15px rgba(99,102,241,0.3)'
                } : {
                  color: isDarkSidebar ? 'rgba(255,255,255,0.8)' : 'var(--color-text-secondary)'
                }}
              >
                {item.icon && <item.icon className="h-[18px] w-[18px] shrink-0" style={active ? { color: 'white' } : {}} />}
                {!collapsed && <><span className="flex-1 text-left">{t(item.translationKey, item.label)}</span>{hasChildren && <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} style={active ? { color: 'white' } : {}} />}</>}
              </button>
              {hasChildren && !collapsed && isExpanded && (
                <div className="ml-8 mt-0.5 space-y-0.5">
                  {item.children!.filter(c => !c.permission || hasPermission(c.permission)).map(child => {
                    const childActive = isActive(child.path);
                    return (
                      <Link key={child.id} to={child.path!} onClick={onMobileClose}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${hoverClass} ${childActive ? 'font-semibold' : ''}`}
                        style={childActive ? {
                          color: isDarkSidebar ? 'white' : 'var(--color-primary)',
                          background: isDarkSidebar ? 'rgba(255, 255, 255, 0.1)' : 'color-mix(in srgb, var(--color-primary) 6%, transparent)',
                        } : {
                          color: isDarkSidebar ? 'rgba(255,255,255,0.6)' : 'var(--color-text-secondary)'
                        }}>
                        {child.icon && <child.icon className="h-4 w-4 shrink-0 opacity-80" />}
                        <span>{t(child.translationKey, child.label)}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-3 py-3" style={{ borderTop: `1px solid ${borderCol}` }}>
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <Avatar name={`${user?.firstName} ${user?.lastName}`} size="sm" />
            <div className="flex-1 min-w-0"><p className={`text-xs font-medium truncate ${textClass}`}>{user?.firstName}</p></div>
            <button onClick={openLogoutModal} className={`p-1 rounded transition-colors ${hoverClass}`}><LogOut className="h-4 w-4" style={{ color: isDarkSidebar ? 'white' : 'var(--color-text-secondary)' }} /></button>
          </div>
        ) : (
          <button onClick={openLogoutModal} className={`p-2 mx-auto block rounded transition-colors ${hoverClass}`}><LogOut className="h-4 w-4" style={{ color: isDarkSidebar ? 'white' : 'var(--color-text-secondary)' }} /></button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">{sidebarContent}</div>
      <AnimatePresence>
        {mobileOpen && (<><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onMobileClose} /><div className="lg:hidden">{sidebarContent}</div></>)}
      </AnimatePresence>
    </>
  );
};

/* ========= Header ========= */
const Header2: React.FC<{ onMenuClick: () => void; collapsed: boolean }> = ({ onMenuClick }) => {
  const { t } = useTranslation();
  const { toggleMode, mode, backgroundImage, backgroundColor, setPrimaryColor, setBackgroundColor, setBackgroundImage } = useThemeStore();
  const { setLanguage } = useLocaleStore();
  const { user, openLogoutModal } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const resolvedMode = mode === 'system' ? 'dark' : mode;
  const breadcrumb = location.pathname.split('/').filter(Boolean);

  return (
    <header
      className="sticky top-0 z-20 h-14 flex items-center justify-between px-5"
      style={(backgroundImage || backgroundColor) ? {
        background: resolvedMode === 'dark' ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--color-border)'
      } : {
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)'
      }}
    >
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="p-1.5 rounded-md hover:bg-surface-hover lg:hidden"><Menu className="h-5 w-5" /></button>
        <div className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          <Home className="h-3.5 w-3.5" />
          {breadcrumb.map((crumb, i) => (
            <React.Fragment key={crumb}>
              <span>/</span>
              <span className={`capitalize ${i === breadcrumb.length - 1 ? 'font-medium' : ''}`} style={i === breadcrumb.length - 1 ? { color: 'var(--color-text)' } : {}}>{crumb}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Dropdown trigger={<button className="p-1.5 rounded-md hover:bg-surface-hover"><Globe className="h-4 w-4" style={{ color: 'var(--color-text-secondary)' }} /></button>}
          items={LANGUAGES.map(l => ({ id: l.code, label: `${l.flag} ${l.nativeName}`, onClick: () => setLanguage(l.code) }))} />

        {/* Theme Settings (Combined Color & Background) */}
        <ThemeSettingsDropdown />
        <button onClick={toggleMode} className="p-1.5 rounded-md hover:bg-surface-hover">{resolvedMode === 'dark' ? <Sun className="h-4 w-4" style={{ color: 'var(--color-text-secondary)' }} /> : <Moon className="h-4 w-4" style={{ color: 'var(--color-text-secondary)' }} />}</button>
        <button className="relative p-1.5 rounded-md hover:bg-surface-hover"><Bell className="h-4 w-4" style={{ color: 'var(--color-text-secondary)' }} /><span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-error" /></button>
        <Dropdown trigger={<div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface-hover cursor-pointer"><Avatar name={`${user?.firstName} ${user?.lastName}`} size="sm" /></div>}
          items={[{ id: 'profile', label: t('common.profile'), onClick: () => navigate('/profile') }, { id: 'settings', label: t('common.settings'), onClick: () => navigate('/settings') }, { id: 'divider', label: '', divider: true }, { id: 'logout', label: t('common.logout'), danger: true, onClick: openLogoutModal }]} />
      </div>
    </header>
  );
};

/* ========= Dashboard Home ========= */
export const DashboardHome2: React.FC = () => {
  const { t } = useTranslation();
  const { currency } = useLocaleStore();
  const stats = MOCK_DASHBOARD_STATS;

  const statCards = [
    { title: t('dashboard.totalContacts'), value: formatNumber(stats.totalContacts), change: '+12.5%', up: true, icon: Users },
    { title: t('dashboard.totalLeads'), value: formatNumber(stats.totalLeads), change: '+8.2%', up: true, icon: Target },
    { title: t('dashboard.totalDeals'), value: formatNumber(stats.totalDeals), change: '+15.3%', up: true, icon: Handshake },
    { title: t('dashboard.totalRevenue'), value: formatCurrency(stats.totalRevenue, currency), change: '+22.4%', up: true, icon: DollarSign },
  ];

  return (
    <div className="page-container">
      <h1 className="text-xl font-semibold mb-5" style={{ color: 'var(--color-text)' }}>{t('dashboard.title')}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {statCards.map((stat) => (
          <Card key={stat.title} padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{stat.title}</p>
                <p className="text-xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{stat.value}</p>
              </div>
              <stat.icon className="h-8 w-8 opacity-20" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className={`flex items-center gap-1 mt-2 text-xs ${stat.up ? 'text-success' : 'text-error'}`}>
              {stat.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />} {stat.change}
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <Card><h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>{t('dashboard.revenueOverview')}</h3><BarChartWidget data={stats.revenueByMonth} dataKey="revenue" xKey="month" height={260} /></Card>
        <Card><h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>{t('dashboard.leadsPipeline')}</h3><PieChartWidget data={stats.leadsByStage.map(s => ({ name: s.stage, value: s.count }))} height={260} /></Card>
      </div>
      <Card>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>{t('dashboard.topPerformers')}</h3>
        <div className="space-y-2">
          {stats.topPerformers.map((p, i) => (
            <div key={p.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-hover transition-colors">
              <span className="text-xs font-bold w-5 text-center" style={{ color: 'var(--color-primary)' }}>#{i + 1}</span>
              <Avatar name={p.name} size="sm" />
              <div className="flex-1"><p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{p.name}</p></div>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{formatCurrency(p.revenue, currency)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

/* ========= Layout ========= */
export const Layout2: React.FC = () => {
  const { t } = useTranslation();
  const { backgroundImage, mode } = useThemeStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { showWarning, secondsLeft, stayActive } = useIdleTimeout();

  const resolvedMode = mode === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode;

  return (
    <div
      className="min-h-screen"
      style={backgroundImage ? {
        background: resolvedMode === 'dark'
          ? `linear-gradient(rgba(10, 14, 26, 0.5), rgba(10, 14, 26, 0.5)), url(${backgroundImage})`
          : `linear-gradient(rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.15)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : { background: 'var(--color-background)' }}
    >
      <Sidebar2 collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'}`}>
        <Header2 onMenuClick={() => setMobileOpen(true)} collapsed={sidebarCollapsed} />
        <main className="min-h-[calc(100vh-56px)]"><Outlet /></main>
      </div>
      <Modal isOpen={showWarning} onClose={stayActive} title={t('auth.sessionExpired')} size="sm">
        <div className="text-center py-4">
          <div className="text-4xl font-bold mb-3" style={{ color: 'var(--color-error)' }}>{secondsLeft}</div>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>{t('auth.idleWarning', { seconds: secondsLeft })}</p>
          <Button onClick={stayActive} variant="primary" fullWidth>{t('auth.stayLoggedIn')}</Button>
        </div>
      </Modal>
    </div>
  );
};

export { Sidebar2, Header2 };
