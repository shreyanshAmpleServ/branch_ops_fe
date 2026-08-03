import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronLeft, LogOut, X, Search, Bell, Sun, Moon, Menu, Globe, Paintbrush } from 'lucide-react';
import { NAVIGATION } from '../../config/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { PRIMARY_COLORS } from '../../types/theme.types';
import { useLocaleStore } from '../../store/useLocaleStore';
import { Avatar, Dropdown, Card, Button, Modal, GlobalSearch, ThemeSettingsDropdown } from '../../components/ui';
import { LANGUAGES } from '../../types/i18n.types';
import { useIdleTimeout } from '../../hooks/useIdleTimeout';
import { Users, Target, DollarSign, ArrowUpRight, ArrowDownRight, CheckSquare } from 'lucide-react';
import { AreaChartWidget, BarChartWidget, PieChartWidget } from '../../components/charts';
import { MOCK_DASHBOARD_STATS } from '../../config/constants';
import { formatCurrency, formatNumber, getRelativeTime } from '../../lib/formatters';

/* ========= Sidebar ========= */
const Sidebar3: React.FC<{ collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onMobileClose: () => void }> = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, openLogoutModal, hasPermission } = useAuthStore();
  const { backgroundImage, backgroundColor, mode, sidebarStyle } = useThemeStore();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const filteredNav = NAVIGATION.filter(item => !item.permission || hasPermission(item.permission));

  const resolvedMode = mode === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode;
  const isCustomBg = !!backgroundImage || !!backgroundColor;

  const isTransparent = sidebarStyle === 'transparent';
  const isGradient = sidebarStyle === 'gradient';

  const sidebarBg = {
    solid: 'var(--color-primary-dark, #1e1b4b)',
    transparent: 'rgba(30, 27, 75, 0.65)',
    gradient: 'linear-gradient(180deg, #1e1b4b 0%, #31102f 100%)',
  };

  const borderCol = 'rgba(255, 255, 255, 0.1)';

  const sidebarContent = (
    <div className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[250px]'} ${isTransparent ? 'backdrop-blur-xl' : ''}`}
      style={{
        background: sidebarBg[sidebarStyle] || sidebarBg.solid,
        borderRight: `1px solid ${borderCol}`,
        color: 'white'
      }}>
      <div className="flex items-center justify-between px-4 h-16" style={{ borderBottom: `1px solid ${borderCol}` }}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">S</div>
            <span className="text-base font-bold font-display">Sales App</span>
          </div>
        )}
        {collapsed && <div className="h-8 w-8 mx-auto rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">S</div>}
        <button onClick={onToggle} className="p-1 rounded-md hover:bg-white/10 hidden lg:block"><ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} /></button>
        <button onClick={onMobileClose} className="p-1 rounded-md hover:bg-white/10 lg:hidden"><X className="h-4 w-4" /></button>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto no-scrollbar">
        {filteredNav.map(item => {
          if (item.isHeader) {
            if (collapsed) return <div key={item.id} className="h-4" />;
            return (
              <div key={item.id} className="mt-5 mb-1 px-3">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
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
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all hover:bg-white/5 hover:text-white"
                style={{ background: active ? 'rgba(255,255,255,0.15)' : 'transparent', color: active ? 'white' : 'rgba(255,255,255,0.65)' }}
              >
                {item.icon && <item.icon className="h-[18px] w-[18px] shrink-0" />}
                {!collapsed && <><span className="flex-1 text-left">{t(item.translationKey, item.label)}</span>{hasChildren && <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}</>}
              </button>
              {hasChildren && !collapsed && isExpanded && (
                <div className="ml-8 mt-0.5 space-y-0.5">
                  {item.children!.filter(c => !c.permission || hasPermission(c.permission)).map(child => (
                    <Link key={child.id} to={child.path!} onClick={onMobileClose}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all hover:bg-white/5 hover:text-white"
                      style={{ color: isActive(child.path!) ? 'white' : 'rgba(255,255,255,0.5)', background: isActive(child.path!) ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                      {child.icon && <child.icon className="h-4 w-4 shrink-0 opacity-80" />}
                      <span>{t(child.translationKey, child.label)}</span>
                    </Link>
                  ))}
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
            <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{user?.firstName} {user?.lastName}</p><p className="text-xs truncate capitalize" style={{ color: 'rgba(255,255,255,0.5)' }}>{user?.role}</p></div>
            <button onClick={openLogoutModal} className="p-1 rounded hover:bg-white/10"><LogOut className="h-4 w-4" /></button>
          </div>
        ) : (<button onClick={openLogoutModal} className="p-2 mx-auto block rounded hover:bg-white/10"><LogOut className="h-4 w-4" /></button>)}
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
const Header3: React.FC<{ onMenuClick: () => void; collapsed: boolean }> = ({ onMenuClick }) => {
  const { t } = useTranslation();
  const { toggleMode, mode, backgroundImage, setPrimaryColor, setBackgroundColor, setBackgroundImage, backgroundColor } = useThemeStore();
  const { setLanguage } = useLocaleStore();
  const { user, openLogoutModal } = useAuthStore();
  const navigate = useNavigate();
  const resolvedMode = mode === 'system' ? 'dark' : mode;

  return (
    <header
      className="sticky top-0 z-20 h-16 flex items-center justify-between px-6 shadow-sm"
      style={backgroundImage ? {
        background: resolvedMode === 'dark' ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--color-border)'
      } : {
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)'
      }}
    >
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-surface-hover lg:hidden"><Menu className="h-5 w-5" /></button>
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-2">
        <Dropdown trigger={<button className="p-2 rounded-lg hover:bg-surface-hover"><Globe className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} /></button>}
          items={LANGUAGES.map(l => ({ id: l.code, label: `${l.flag} ${l.nativeName}`, onClick: () => setLanguage(l.code) }))} />

        {/* Theme Settings (Combined Color & Background) */}
        <ThemeSettingsDropdown />
        <button onClick={toggleMode} className="p-2 rounded-lg hover:bg-surface-hover">{resolvedMode === 'dark' ? <Sun className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} /> : <Moon className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} />}</button>
        <button className="relative p-2 rounded-lg hover:bg-surface-hover"><Bell className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} /><span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-error border-2" style={{ borderColor: 'var(--color-surface)' }} /></button>
        <div className="h-8 w-px mx-1" style={{ background: 'var(--color-border)' }} />
        <Dropdown trigger={<div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface-hover cursor-pointer"><Avatar name={`${user?.firstName} ${user?.lastName}`} size="sm" /><div className="hidden md:block text-left"><p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{user?.firstName} {user?.lastName}</p></div></div>}
          items={[{ id: 'profile', label: t('common.profile'), onClick: () => navigate('/profile') }, { id: 'settings', label: t('common.settings'), onClick: () => navigate('/settings') }, { id: 'divider', label: '', divider: true }, { id: 'logout', label: t('common.logout'), danger: true, onClick: openLogoutModal }]} />
      </div>
    </header>
  );
};

/* ========= Layout ========= */
export const Layout3: React.FC = () => {
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
      <Sidebar3 collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[250px]'}`}>
        <Header3 onMenuClick={() => setMobileOpen(true)} collapsed={sidebarCollapsed} />
        <main className="min-h-[calc(100vh-64px)]"><Outlet /></main>
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

/* ========= Dashboard ========= */
export const DashboardHome3: React.FC = () => {
  const { t } = useTranslation();
  const { currency } = useLocaleStore();
  const stats = MOCK_DASHBOARD_STATS;
  const statCards = [
    { title: t('dashboard.totalContacts'), value: formatNumber(stats.totalContacts), icon: Users, change: '+12.5%', up: true, border: 'var(--color-primary)' },
    { title: t('dashboard.totalLeads'), value: formatNumber(stats.totalLeads), icon: Target, change: '+8.2%', up: true, border: '#ec4899' },
    { title: t('dashboard.totalRevenue'), value: formatCurrency(stats.totalRevenue, currency), icon: DollarSign, change: '+22.4%', up: true, border: '#10b981' },
    { title: t('dashboard.openTasks'), value: stats.openTasks.toString(), icon: CheckSquare, change: '+5', up: false, border: '#f59e0b' },
  ];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-0.5">
        <div><h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{t('dashboard.title')}</h1><p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{t('common.welcome')}</p></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(stat => (
          <Card key={stat.title} padding="md" className="relative overflow-hidden" hover>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: stat.border }} />
            <div className="flex items-start justify-between">
              <div><p className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>{stat.title}</p><p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{stat.value}</p></div>
              <stat.icon className="h-6 w-6 opacity-30" style={{ color: stat.border }} />
            </div>
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${stat.up ? 'text-success' : 'text-error'}`}>
              {stat.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />} {stat.change}
              <span className="ml-1" style={{ color: 'var(--color-text-secondary)' }}>vs last month</span>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <Card className="lg:col-span-3"><h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>{t('dashboard.revenueOverview')}</h3><AreaChartWidget data={stats.revenueByMonth} dataKey="revenue" xKey="month" height={280} /></Card>
        <Card className="lg:col-span-2"><h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>{t('dashboard.dealsPipeline')}</h3><BarChartWidget data={stats.dealsByStage} dataKey="value" xKey="stage" height={280} color="#10b981" /></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>{t('dashboard.leadsPipeline')}</h3><PieChartWidget data={stats.leadsByStage.map(s => ({ name: s.stage, value: s.count }))} height={240} /></Card>
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>{t('dashboard.recentActivity')}</h3>
          <div className="space-y-2">
            {stats.recentActivities.map(activity => (
              <div key={activity.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-hover transition-colors" style={{ borderLeft: '3px solid var(--color-primary)' }}>
                <div className="flex-1"><p className="text-sm" style={{ color: 'var(--color-text)' }}>{activity.title}</p></div>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{getRelativeTime(activity.date)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export { Sidebar3, Header3 };
