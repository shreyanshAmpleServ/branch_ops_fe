import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, X, ChevronRight } from 'lucide-react';
import { NAVIGATION, type NavItem } from '../../config/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';

interface FlatSearchItem {
  id: string;
  label: string;
  category?: string;
  path: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  permission?: string;
}

interface GlobalSearchProps {
  inSidebar?: boolean;
  collapsed?: boolean;
  className?: string;
  onSelect?: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  inSidebar = false,
  collapsed = false,
  className = '',
  onSelect,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const { mode, backgroundImage, backgroundColor, sidebarStyle } = useThemeStore();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten all navigation items
  const allSearchItems = useMemo((): FlatSearchItem[] => {
    const items: FlatSearchItem[] = [];

    NAVIGATION.forEach((navItem) => {
      if (navItem.isHeader) return;
      if (navItem.permission && !hasPermission(navItem.permission)) return;

      const parentLabel = t(navItem.translationKey, navItem.label);

      if (navItem.path) {
        items.push({
          id: navItem.id,
          label: parentLabel,
          path: navItem.path,
          icon: navItem.icon,
          permission: navItem.permission,
        });
      }

      if (navItem.children && navItem.children.length > 0) {
        navItem.children.forEach((child) => {
          if (child.permission && !hasPermission(child.permission)) return;
          items.push({
            id: child.id,
            label: t(child.translationKey, child.label),
            category: parentLabel,
            path: child.path || '',
            icon: child.icon || navItem.icon,
            permission: child.permission,
          });
        });
      }
    });

    return items;
  }, [t, hasPermission]);

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return allSearchItems.slice(0, 8);
    const q = query.toLowerCase();
    return allSearchItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q))
    );
  }, [allSearchItems, query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (path: string) => {
    if (!path) return;
    navigate(path);
    setIsOpen(false);
    setQuery('');
    if (onSelect) onSelect();
  };

  const resolvedMode = mode === 'system' ? 'dark' : mode;
  const isCustomBg = !!backgroundImage || !!backgroundColor;
  const isDarkSidebar = resolvedMode === 'dark' || (isCustomBg && sidebarStyle !== 'solid');

  // If collapsed in sidebar, render compact icon button
  if (inSidebar && collapsed) {
    return (
      <div ref={wrapperRef} className="relative flex justify-center w-full">
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          title={t('common.search', 'Search...')}
          className="p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
          style={{
            background: isDarkSidebar ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            color: isDarkSidebar ? 'rgba(255, 255, 255, 0.8)' : 'var(--color-text-secondary)',
            border: isDarkSidebar ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <Search className="h-4 w-4" />
        </button>

        {isOpen && (
          <div
            className="fixed left-[78px] top-16 w-72 rounded-2xl shadow-2xl z-50 p-2 animate-fade-in backdrop-blur-2xl"
            style={{
              background: isDarkSidebar ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              border: isDarkSidebar ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            }}
          >
            <div
              className="flex items-center px-3 py-2 rounded-xl mb-2"
              style={{
                background: isDarkSidebar ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                border: isDarkSidebar ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
              }}
            >
              <Search className="h-4 w-4 shrink-0 opacity-60 mr-2" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('common.search', 'Search menu...')}
                className="w-full bg-transparent border-none outline-none text-xs"
                style={{ color: isDarkSidebar ? '#fff' : 'var(--color-text)' }}
                autoFocus
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-0.5 opacity-60 hover:opacity-100">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.path)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left"
                    style={{
                      color: isDarkSidebar ? 'rgba(255,255,255,0.9)' : 'var(--color-text)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isDarkSidebar
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {opt.icon && <opt.icon className="h-3.5 w-3.5 shrink-0 text-primary opacity-80" />}
                      <span className="truncate font-medium">{opt.label}</span>
                    </div>
                    {opt.category && (
                      <span className="text-[10px] opacity-50 shrink-0 ml-2">{opt.category}</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="py-4 text-center text-xs opacity-50">No results found</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <div
        className={`relative flex items-center rounded-xl transition-all duration-200 ${
          isOpen ? 'ring-2 ring-white/30' : ''
        }`}
        style={{
          background: inSidebar
            ? 'rgba(255, 255, 255, 0.12)'
            : 'var(--color-surface-hover)',
          border: inSidebar
            ? '1px solid rgba(255, 255, 255, 0.2)'
            : '1px solid var(--color-border)',
          backdropFilter: inSidebar ? 'blur(10px)' : undefined,
        }}
      >
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
          style={{
            color: inSidebar
              ? 'rgba(255, 255, 255, 0.75)'
              : 'var(--color-text-secondary)',
          }}
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={t('common.search', 'Search...')}
          className={`bg-transparent border-none outline-none pl-9 pr-8 py-2 w-full text-xs sm:text-sm font-medium transition-all ${
            inSidebar ? 'placeholder:text-white/60 text-white' : ''
          }`}
          style={{
            color: inSidebar ? '#ffffff' : 'var(--color-text)',
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/20 transition-colors"
            style={{ color: inSidebar ? 'rgba(255, 255, 255, 0.75)' : 'var(--color-text-secondary)' }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1.5 w-full rounded-xl overflow-hidden shadow-2xl z-50 animate-fade-in backdrop-blur-xl"
          style={{
            background: isDarkSidebar
              ? 'rgba(15, 23, 42, 0.96)'
              : 'rgba(255, 255, 255, 0.96)',
            border: isDarkSidebar
              ? '1px solid rgba(255, 255, 255, 0.15)'
              : '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 15px 35px -5px rgba(0,0,0,0.25)',
          }}
        >
          {filteredOptions.length > 0 ? (
            <div className="py-1.5 max-h-60 overflow-y-auto no-scrollbar">
              <div
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider opacity-60"
                style={{ color: isDarkSidebar ? 'rgba(255,255,255,0.6)' : 'var(--color-text-secondary)' }}
              >
                {query ? 'Search Results' : 'Quick Navigation'}
              </div>
              {filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.path)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left group hover:bg-primary/10"
                  style={{
                    color: isDarkSidebar ? 'rgba(255, 255, 255, 0.9)' : 'var(--color-text)',
                  }}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {opt.icon && (
                      <opt.icon
                        className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110"
                        style={{ color: 'var(--color-primary)' }}
                      />
                    )}
                    <span className="truncate font-medium">{opt.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {opt.category && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                        style={{
                          background: isDarkSidebar ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                          color: isDarkSidebar ? 'rgba(255,255,255,0.7)' : 'var(--color-text-secondary)',
                        }}
                      >
                        {opt.category}
                      </span>
                    )}
                    <ChevronRight className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div
              className="px-4 py-6 text-center text-xs"
              style={{ color: isDarkSidebar ? 'rgba(255,255,255,0.5)' : 'var(--color-text-secondary)' }}
            >
              No matching modules for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
