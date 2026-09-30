import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ChevronDown, Check } from 'lucide-react';

export interface SearchableSelectOption {
  value: string | number;
  label: string;
  subtext?: string;
  badge?: string;
  extra?: React.ReactNode;
  raw?: any;
}

export interface SearchableSelectProps {
  label?: string;
  value: string | number | undefined | null;
  onChange: (value: any, option?: SearchableSelectOption | null) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  clearable?: boolean;
  onSearchChange?: (query: string) => void;
  renderOption?: (option: SearchableSelectOption, isSelected: boolean) => React.ReactNode;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Search & select...',
  disabled = false,
  className = '',
  inputClassName = '',
  size = 'md',
  fullWidth = true,
  clearable = true,
  onSearchChange,
  renderOption,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  }>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 280,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    if (value === undefined || value === null || value === '' || value === 0 || value === '0') {
      const exactZero = options.find((opt) => opt.value === 0 || opt.value === '0');
      if (exactZero && (value === 0 || value === '0')) return exactZero;
      return null;
    }
    return options.find((opt) => String(opt.value) === String(value)) || null;
  }, [value, options]);

  // Keep search query in sync with selected option when dropdown is closed
  useEffect(() => {
    if (!isOpen) {
      if (selectedOption) {
        setSearchQuery(selectedOption.label);
      } else if (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        value !== 0 &&
        value !== '0'
      ) {
        setSearchQuery(String(value));
      } else {
        setSearchQuery('');
      }
    }
  }, [isOpen, selectedOption, value]);

  // Update floating portal coordinates with viewport boundary detection
  const updateCoords = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const targetWidth = Math.min(Math.max(rect.width, 280), window.innerWidth - 24);
      const spaceBelow = window.innerHeight - rect.bottom - 16;
      const spaceAbove = rect.top - 16;
      const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(160, Math.min(openUp ? spaceAbove : spaceBelow, 320));

      const top = openUp
        ? rect.top - maxHeight - 6
        : rect.bottom + 6;

      const maxLeft = window.innerWidth - targetWidth - 12;
      const left = Math.max(12, Math.min(rect.left, maxLeft));

      setCoords({
        top,
        left,
        width: targetWidth,
        maxHeight,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  // Filter options in real-time as user types
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim() || (selectedOption && searchQuery === selectedOption.label)) {
      return options;
    }
    const q = searchQuery.toLowerCase();
    return options.filter((opt) => {
      const labelMatch = (opt.label || '').toLowerCase().includes(q);
      const subtextMatch = (opt.subtext || '').toLowerCase().includes(q);
      const valueMatch = String(opt.value || '').toLowerCase().includes(q);
      return labelMatch || subtextMatch || valueMatch;
    });
  }, [options, searchQuery, selectedOption]);

  // Scroll focused item into view during keyboard navigation
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [focusedIndex, isOpen]);

  // Handle click outside to close dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        if (selectedOption) {
          setSearchQuery(selectedOption.label);
        } else {
          setSearchQuery('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (disabled) return;
    updateCoords();
    setIsOpen(true);
    setFocusedIndex(-1);
    e.target.select();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    updateCoords();
    setIsOpen(true);
    setFocusedIndex(-1);
    if (onSearchChange) {
      onSearchChange(val);
    }
    if (!val.trim()) {
      onChange('', null);
    }
  };

  const handleSelectOption = (opt: SearchableSelectOption) => {
    onChange(opt.value, opt);
    setSearchQuery(opt.label);
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', null);
    setSearchQuery('');
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      updateCoords();
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
        handleSelectOption(filteredOptions[focusedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      if (selectedOption) {
        setSearchQuery(selectedOption.label);
      } else {
        setSearchQuery('');
      }
    }
  };

  const sizeClasses = {
    sm: 'py-1 pl-7 pr-9 text-xs rounded-lg',
    md: 'py-2 pl-9 pr-14 text-xs rounded-xl',
    lg: 'py-2.5 pl-10 pr-16 text-sm rounded-xl',
  };

  const isSmall = size === 'sm';

  return (
    <div ref={containerRef} className={`relative ${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block text-slate-500 dark:text-slate-400">
          {label}
        </label>
      )}

      {/* Autocomplete Input Container */}
      <div className="relative flex items-center group">
        {/* Left Search Icon */}
        <div className={`absolute flex items-center pointer-events-none text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400 transition-colors ${
          isSmall ? 'left-2' : 'left-3'
        }`}>
          <Search className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full bg-slate-50/70 hover:bg-white focus:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900 dark:focus:bg-slate-900
            text-slate-900 dark:text-slate-100 font-medium
            border border-slate-200 dark:border-slate-700/80
            focus:border-teal-500 dark:focus:border-teal-400
            focus:outline-none focus:ring-4 focus:ring-teal-500/10 dark:focus:ring-teal-400/10
            shadow-xs transition-all duration-150 placeholder:text-slate-400 dark:placeholder:text-slate-500
            disabled:opacity-60 disabled:cursor-not-allowed
            ${sizeClasses[size]}
            ${inputClassName}
          `}
        />

        {/* Action icons right end */}
        <div className={`absolute flex items-center gap-0.5 text-slate-400 ${
          isSmall ? 'right-1.5' : 'right-2.5'
        }`}>
          {clearable &&
            value !== undefined &&
            value !== null &&
            value !== '' &&
            (selectedOption !== null || (value !== 0 && value !== '0')) &&
            !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              title="Clear selection"
            >
              <X className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (!disabled) {
                if (!isOpen) updateCoords();
                setIsOpen(!isOpen);
                if (!isOpen && inputRef.current) inputRef.current.focus();
              }
            }}
            disabled={disabled}
            className="p-0.5 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
          >
            <ChevronDown
              className={`transition-transform duration-200 ${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${
                isOpen ? 'rotate-180 text-teal-600 dark:text-teal-400' : 'text-slate-400'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Portal-rendered Floating Options Dropdown Menu */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: `${coords.maxHeight}px`,
              zIndex: 9999,
            }}
            className="bg-white/98 dark:bg-slate-900/98 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-700/90 shadow-[0_20px_40px_-8px_rgba(0,0,0,0.18),0_6px_16px_-4px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-150"
          >
            {/* Meta bar */}
            {filteredOptions.length > 0 && (
              <div className="px-3.5 py-1.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-medium select-none">
                <span>
                  {filteredOptions.length} {filteredOptions.length === 1 ? 'option' : 'options'}
                </span>
                <span className="hidden sm:inline">Use ↑↓ keys to navigate</span>
              </div>
            )}

            {/* Scrollable list */}
            <div className="overflow-y-auto p-1.5 space-y-0.5 divide-y-0 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const isSelected = String(opt.value) === String(value);
                  const isFocused = idx === focusedIndex;

                  if (renderOption) {
                    return (
                      <div
                        key={String(opt.value)}
                        ref={(el) => {
                          itemRefs.current[idx] = el;
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectOption(opt);
                        }}
                        onMouseEnter={() => setFocusedIndex(idx)}
                        className={`rounded-xl transition-all duration-100 overflow-hidden ${
                          isFocused ? 'ring-2 ring-teal-500/30' : ''
                        }`}
                      >
                        {renderOption(opt, isSelected)}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={String(opt.value)}
                      ref={(el) => {
                        itemRefs.current[idx] = el;
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectOption(opt);
                      }}
                      onMouseEnter={() => setFocusedIndex(idx)}
                      className={`
                        py-2.5 px-3 rounded-xl flex items-center justify-between cursor-pointer transition-all duration-100
                        ${
                          isSelected
                            ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-950 dark:text-teal-100 font-semibold ring-1 ring-teal-500/40 shadow-xs'
                            : isFocused
                            ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200'
                        }
                      `}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold truncate">{opt.label}</span>
                          {opt.badge && (
                            <span className="text-[9px] font-extrabold tracking-wide uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.subtext && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-400 truncate mt-0.5 font-normal">
                            {opt.subtext}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {opt.extra && (
                          <div className="text-right text-xs font-bold text-teal-600 dark:text-teal-400">
                            {opt.extra}
                          </div>
                        )}
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                    <Search className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No matches found
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Try searching with a different keyword or code
                  </p>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
