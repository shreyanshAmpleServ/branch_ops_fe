import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronLeft, LogOut, X } from 'lucide-react';
import { NAVIGATION, type NavItem } from '../../config/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { Avatar } from '../../components/ui';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar1: React.FC<SidebarProps> = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, openLogoutModal, hasPermission } = useAuthStore();
  const { sidebarStyle, mode, backgroundImage, backgroundColor } = useThemeStore();
  const [expandedItems, setExpandedItems] = useState<string[]>(['settings']);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const filteredNav = NAVIGATION.filter((item) => !item.permission || hasPermission(item.permission));

  const resolvedMode = mode === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode;

  const isCustomBg = !!backgroundImage || !!backgroundColor;
  const activeSidebarStyle = isCustomBg ? 'transparent' : sidebarStyle;
  const isDarkSidebar = resolvedMode === 'dark' || (isCustomBg && activeSidebarStyle !== 'solid');

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

  const sidebarClasses = `
    fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300
    ${collapsed ? 'w-[72px]' : 'w-[260px]'}
    ${activeSidebarStyle === 'solid' ? '' : 'backdrop-blur-xl'}
  `;

  const renderNavItem = (item: NavItem) => {
    if (item.permission && !hasPermission(item.permission)) return null;

    if (item.isHeader) {
      if (collapsed) return <div key={item.id} className="h-4" />;
      return (
        <div key={item.id} className="mt-4 mb-2 px-3">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isDarkSidebar ? 'rgba(255, 255, 255, 0.45)' : 'var(--color-text-secondary)' }}>
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
          onClick={() => {
            if (hasChildren) {
              toggleExpand(item.id);
            } else if (item.path) {
              navigate(item.path);
              onMobileClose();
            }
          }}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
            ${active ? 'text-white' : `${textSecClass} ${hoverClass}`}
            ${collapsed ? 'justify-center' : ''}
          `}
          style={active ? { background: 'var(--color-primary)', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' } : {}}
        >
          {item.icon && <item.icon className="h-5 w-5 shrink-0" />}
          {!collapsed && (
            <>
              <span className="font-medium truncate">{t(item.translationKey, item.label)}</span>
              {hasChildren && (
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              )}
            </>
          )}
        </button>

        {/* Children */}
        {hasChildren && !collapsed && (
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden ml-4 mt-1 space-y-0.5"
              >
                {item.children!.filter((child) => !child.permission || hasPermission(child.permission)).map((child) => (
                  <Link
                    key={child.id}
                    to={child.path!}
                    onClick={onMobileClose}
                    className={`
                      flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200
                      ${isActive(child.path!)
                        ? (isDarkSidebar ? 'text-white font-medium bg-white/10' : 'text-primary font-medium bg-primary/10')
                        : `${textSecClass} ${hoverClass}`
                      }
                    `}
                    style={{ borderLeft: `2px solid ${isActive(child.path!) ? (isDarkSidebar ? 'white' : 'var(--color-primary)') : 'transparent'}` }}
                  >
                    {child.icon && <child.icon className="h-4 w-4 shrink-0 opacity-80" />}
                    <span>{t(child.translationKey, child.label)}</span>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div
      className={sidebarClasses}
      style={{
        background: activeSidebarStyle === 'gradient' ? sidebarBg.gradient : sidebarBg[activeSidebarStyle],
        borderRight: `1px solid ${borderCol}`,
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${borderCol}` }}>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: 'var(--color-primary)' }}>
              S
            </div>
            <span className={`text-lg font-bold font-display ${textClass}`}>Sales App</span>
          </motion.div>
        )}
        <button onClick={onToggle} className={`p-1.5 rounded-lg transition-colors hidden lg:block ${textSecClass} ${hoverClass}`}>
          <ChevronLeft className={`h-5 w-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
        <button onClick={onMobileClose} className={`p-1.5 rounded-lg lg:hidden ${textSecClass} ${hoverClass}`}>
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 pt-2 space-y-1 overflow-y-auto no-scrollbar">
        {filteredNav.map(renderNavItem)}
      </nav>

      {/* User Section */}
      <div className="px-3 py-2" style={{ borderTop: `1px solid ${borderCol}` }}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <Avatar name={`${user?.firstName} ${user?.lastName}`} size="sm" />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate mb-0 ${textClass}`}>{user?.firstName} {user?.lastName}</p>
              <p className={`text-xs truncate capitalize  ${textSecClass}`}>{user?.role}</p>
            </div>
            <button onClick={openLogoutModal} className={`p-1.5 rounded-lg transition-colors ${textSecClass} hover:text-red-400 hover:bg-red-500/10`}>
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button onClick={openLogoutModal} className={`p-2 rounded-lg transition-colors mx-auto block ${textSecClass} hover:text-red-400 hover:bg-red-500/10`}>
            <LogOut className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">{sidebarContent}</div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={onMobileClose}
            />
            <div className="lg:hidden">{sidebarContent}</div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
