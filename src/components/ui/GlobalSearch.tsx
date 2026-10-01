import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, X, ChevronRight, CornerDownLeft, Sparkles } from 'lucide-react';
import { NAVIGATION, type NavItem } from '../../config/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useDesignStore } from '../../store/useDesignStore';

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
  const { activeDesign } = useDesignStore();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Platform detection for keyboard shortcut display
  const isMac = useMemo(() => {
    return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  }, []);

  // Theme & sidebar color resolution
  const isSystemDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolvedMode = mode === 'system' ? (isSystemDark ? 'dark' : 'light') : mode;
  const isCustomBg = !!backgroundImage || !!backgroundColor;

  // Design 3 has a dark purple/navy sidebar always.
  // In Design 1 & 2, sidebar is dark if resolvedMode is 'dark' or if custom background is active and sidebar is not solid.
  const isDarkSidebar = inSidebar
    ? activeDesign === 'design3' || resolvedMode === 'dark' || (isCustomBg && sidebarStyle !== 'solid')
    : resolvedMode === 'dark';

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

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(filteredOptions.length > 0 ? 0 : -1);
  }, [filteredOptions]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const target = e.target as HTMLElement;
        const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        if (isEditing && target === inputRef.current) return;
        
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSelect = useCallback((path: string) => {
    if (!path) return;
    navigate(path);
    setIsOpen(false);
    setIsFocused(false);
    setQuery('');
    if (onSelect) onSelect();
  }, [navigate, onSelect]);

  // Keyboard navigation inside search input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setSelectedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[selectedIndex].path);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Keep selected item scrolled into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const activeEl = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Highlight matching query text helper
  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <span
              key={i}
              className="font-bold underline decoration-primary/40 underline-offset-2"
              style={{ color: 'var(--color-primary)' }}
            >
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  // Color & design tokens matching the sidebar
  const searchColors = useMemo(() => {
    if (isDarkSidebar) {
      return {
        containerBg: isFocused ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)',
        containerHoverBg: 'rgba(255, 255, 255, 0.10)',
        containerBorder: isFocused ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.10)',
        containerShadow: isFocused ? '0 0 0 3px rgba(255, 255, 255, 0.12), 0 4px 12px rgba(0,0,0,0.2)' : 'none',
        textColor: '#ffffff',
        placeholderColor: 'rgba(255, 255, 255, 0.45)',
        iconColor: isFocused ? '#ffffff' : 'rgba(255, 255, 255, 0.60)',
        badgeBg: 'rgba(255, 255, 255, 0.10)',
        badgeText: 'rgba(255, 255, 255, 0.65)',
        badgeBorder: 'rgba(255, 255, 255, 0.15)',
        dropdownBg: 'rgba(15, 23, 42, 0.96)',
        dropdownBorder: 'rgba(255, 255, 255, 0.12)',
        dropdownShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.6)',
        itemHoverBg: 'rgba(255, 255, 255, 0.08)',
        itemActiveBg: 'rgba(255, 255, 255, 0.14)',
        itemText: 'rgba(255, 255, 255, 0.95)',
        itemTextSec: 'rgba(255, 255, 255, 0.55)',
        categoryBg: 'rgba(255, 255, 255, 0.08)',
        iconBoxBg: 'rgba(255, 255, 255, 0.10)',
        iconBoxColor: '#ffffff',
      };
    }

    // Light sidebar: Match sidebar text color (--color-text) and surface styles
    return {
      containerBg: isFocused ? 'var(--color-surface, #ffffff)' : 'rgba(0, 0, 0, 0.035)',
      containerHoverBg: 'rgba(0, 0, 0, 0.06)',
      containerBorder: isFocused ? 'var(--color-primary)' : 'rgba(0, 0, 0, 0.08)',
      containerShadow: isFocused ? '0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent), 0 2px 8px rgba(0,0,0,0.06)' : 'none',
      textColor: 'var(--color-text, #0f172a)',
      placeholderColor: 'var(--color-text-secondary, #64748b)',
      iconColor: isFocused ? 'var(--color-primary)' : 'var(--color-text-secondary, #64748b)',
      badgeBg: 'rgba(0, 0, 0, 0.05)',
      badgeText: 'var(--color-text-secondary, #64748b)',
      badgeBorder: 'rgba(0, 0, 0, 0.08)',
      dropdownBg: 'rgba(255, 255, 255, 0.98)',
      dropdownBorder: 'rgba(0, 0, 0, 0.08)',
      dropdownShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
      itemHoverBg: 'rgba(0, 0, 0, 0.04)',
      itemActiveBg: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
      itemText: 'var(--color-text, #0f172a)',
      itemTextSec: 'var(--color-text-secondary, #64748b)',
      categoryBg: 'rgba(0, 0, 0, 0.05)',
      iconBoxBg: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
      iconBoxColor: 'var(--color-primary)',
    };
  }, [isDarkSidebar, isFocused]);

  // If collapsed in sidebar, render compact, gorgeous icon button
  if (inSidebar && collapsed) {
    return (
      <div ref={wrapperRef} className="relative flex justify-center w-full">
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setTimeout(() => inputRef.current?.focus(), 80);
          }}
          title={`${t('common.search', 'Search menu...')} (${isMac ? '⌘K' : 'Ctrl+K'})`}
          className="group relative p-2.5 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
          style={{
            background: searchColors.containerBg,
            color: searchColors.iconColor,
            border: `1px solid ${searchColors.containerBorder}`,
            boxShadow: searchColors.containerShadow,
          }}
        >
          <Search className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
          <span
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
            style={{ background: 'var(--color-primary)' }}
          />
        </button>

        {isOpen && (
          <div
            className="fixed left-[78px] top-14 w-80 rounded-2xl shadow-2xl z-50 p-2.5 animate-fade-in backdrop-blur-2xl"
            style={{
              background: searchColors.dropdownBg,
              border: `1px solid ${searchColors.dropdownBorder}`,
              boxShadow: searchColors.dropdownShadow,
            }}
          >
            {/* Input in popover */}
            <div
              className="flex items-center px-3.5 py-2 rounded-full mb-2 transition-all"
              style={{
                background: searchColors.containerBg,
                border: `1px solid ${searchColors.containerBorder}`,
              }}
            >
              <Search className="h-4 w-4 shrink-0 mr-2.5" style={{ color: searchColors.iconColor }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={t('common.search', 'Search menu...')}
                className="w-full bg-transparent border-none outline-none text-xs font-medium"
                style={{ color: searchColors.textColor }}
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity"
                  style={{ color: searchColors.textColor }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Popover results */}
            <div ref={resultsRef} className="max-h-72 overflow-y-auto space-y-1 no-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const isSelected = selectedIndex === idx;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelect(opt.path)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all text-left group cursor-pointer"
                      style={{
                        background: isSelected ? searchColors.itemActiveBg : 'transparent',
                        color: searchColors.itemText,
                      }}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                          style={{
                            background: searchColors.iconBoxBg,
                            color: searchColors.iconBoxColor,
                          }}
                        >
                          {Icon ? <Icon className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
                        </div>
                        <span className="truncate font-medium">
                          {renderHighlightedText(opt.label, query)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {opt.category && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                            style={{
                              background: searchColors.categoryBg,
                              color: searchColors.itemTextSec,
                            }}
                          >
                            {opt.category}
                          </span>
                        )}
                        <ChevronRight
                          className="h-3 w-3 opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                          style={{ color: searchColors.itemTextSec }}
                        />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div
                  className="py-6 text-center text-xs flex flex-col items-center gap-1.5"
                  style={{ color: searchColors.itemTextSec }}
                >
                  <Search className="h-5 w-5 opacity-40 mb-1" />
                  <span>No results for "{query}"</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      {/* Search Input Bar */}
      <div
        className="group relative flex items-center rounded-full transition-all duration-200"
        style={{
          background: searchColors.containerBg,
          border: `1px solid ${searchColors.containerBorder}`,
          boxShadow: searchColors.containerShadow,
          backdropFilter: inSidebar ? 'blur(12px)' : undefined,
        }}
        onMouseEnter={(e) => {
          if (!isFocused) {
            e.currentTarget.style.background = searchColors.containerHoverBg;
          }
        }}
        onMouseLeave={(e) => {
          if (!isFocused) {
            e.currentTarget.style.background = searchColors.containerBg;
          }
        }}
      >
        {/* Search Icon */}
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors duration-200"
          style={{ color: searchColors.iconColor }}
        />

        {/* Input */}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => {
            setIsFocused(true);
            setIsOpen(true);
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t('common.search', 'Search menu or pages...')}
          className="bg-transparent border-none outline-none pl-10 pr-14 py-2 w-full text-xs sm:text-sm font-medium transition-colors"
          style={{
            color: searchColors.textColor,
          }}
        />

        {/* Right side controls: Clear Button or Keyboard Shortcut Badge */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(-1);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full opacity-60 hover:opacity-100 transition-all hover:scale-110 active:scale-95 cursor-pointer"
              style={{ color: searchColors.textColor }}
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div
              className="hidden sm:flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-mono tracking-tight select-none pointer-events-none opacity-80"
              style={{
                background: searchColors.badgeBg,
                color: searchColors.badgeText,
                border: `1px solid ${searchColors.badgeBorder}`,
              }}
              title="Keyboard shortcut"
            >
              <span>{isMac ? '⌘' : 'Ctrl'}</span>
              <span>K</span>
            </div>
          )}
        </div>
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1.5 w-full rounded-2xl overflow-hidden shadow-2xl z-50 animate-fade-in backdrop-blur-2xl"
          style={{
            background: searchColors.dropdownBg,
            border: `1px solid ${searchColors.dropdownBorder}`,
            boxShadow: searchColors.dropdownShadow,
          }}
        >
          {/* Section Header */}
          <div
            className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between border-b"
            style={{
              color: searchColors.itemTextSec,
              borderColor: searchColors.dropdownBorder,
            }}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" style={{ color: 'var(--color-primary)' }} />
              {query ? `Matching Menus (${filteredOptions.length})` : 'Quick Navigation'}
            </span>
            <span className="text-[9px] opacity-70 font-normal lowercase tracking-normal">
              use <kbd className="px-1 py-0.2 rounded bg-black/10 dark:bg-white/10">↑↓</kbd> to navigate
            </span>
          </div>

          {/* Results List */}
          {filteredOptions.length > 0 ? (
            <div ref={resultsRef} className="py-1.5 max-h-64 overflow-y-auto no-scrollbar">
              {filteredOptions.map((opt, idx) => {
                const isSelected = selectedIndex === idx;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.path)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs transition-all text-left group cursor-pointer"
                    style={{
                      background: isSelected ? searchColors.itemActiveBg : 'transparent',
                      color: searchColors.itemText,
                    }}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                        style={{
                          background: searchColors.iconBoxBg,
                          color: searchColors.iconBoxColor,
                        }}
                      >
                        {Icon ? <Icon className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                      </div>
                      <span className="truncate font-medium">
                        {renderHighlightedText(opt.label, query)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {opt.category && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                          style={{
                            background: searchColors.categoryBg,
                            color: searchColors.itemTextSec,
                          }}
                        >
                          {opt.category}
                        </span>
                      )}
                      {isSelected ? (
                        <CornerDownLeft
                          className="h-3 w-3 transition-opacity"
                          style={{ color: 'var(--color-primary)' }}
                        />
                      ) : (
                        <ChevronRight
                          className="h-3 w-3 opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                          style={{ color: searchColors.itemTextSec }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              className="px-4 py-8 text-center text-xs flex flex-col items-center gap-2"
              style={{ color: searchColors.itemTextSec }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
                style={{ background: searchColors.categoryBg }}
              >
                <Search className="h-5 w-5 opacity-40" />
              </div>
              <p className="font-semibold" style={{ color: searchColors.itemText }}>
                No matching menu found
              </p>
              <p className="text-[11px] opacity-75">
                No menus match "<span className="font-medium">{query}</span>".
              </p>
            </div>
          )}

          {/* Footer note */}
          <div
            className="px-3 py-1.5 text-[10px] border-t flex items-center justify-between opacity-60"
            style={{
              borderColor: searchColors.dropdownBorder,
              color: searchColors.itemTextSec,
            }}
          >
            <span>Select to jump to page</span>
            <span><kbd className="px-1 py-0.2 rounded bg-black/10 dark:bg-white/10">esc</kbd> to close</span>
          </div>
        </div>
      )}
    </div>
  );
};

