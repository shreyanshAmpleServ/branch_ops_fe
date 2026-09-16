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
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    if (value === undefined || value === null || value === '') return null;
    return options.find((opt) => String(opt.value) === String(value)) || null;
  }, [value, options]);

  // Keep search query in sync with selected option when dropdown is closed
  useEffect(() => {
    if (!isOpen) {
      if (selectedOption) {
        setSearchQuery(selectedOption.label);
      } else {
        setSearchQuery('');
      }
    }
  }, [isOpen, selectedOption]);

  // Update floating portal coordinates relative to viewport & scroll
  const updateCoords = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 240),
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

  const handleFocus = () => {
    if (disabled) return;
    updateCoords();
    setIsOpen(true);
    setFocusedIndex(-1);
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
    sm: 'py-1 px-2 text-xs rounded-lg',
    md: 'py-2 px-3 text-xs rounded-xl',
    lg: 'py-2.5 px-4 text-sm rounded-xl',
  };

  return (
    <div ref={containerRef} className={`relative ${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block text-slate-500 dark:text-slate-400">
          {label}
        </label>
      )}

      {/* Autocomplete Input Container */}
      <div className="relative flex items-center">
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
            w-full pr-16 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100
            border border-slate-300 dark:border-slate-600 font-medium
            focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500
            disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm
            ${sizeClasses[size]}
            ${inputClassName}
          `}
        />

        {/* Action icons right end */}
        <div className="absolute right-2 flex items-center gap-1 text-slate-400">
          {clearable && (value !== undefined && value !== null && value !== '') && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
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
            className="p-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Portal-rendered Floating Options Dropdown Menu */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 9999,
            }}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 animate-in fade-in duration-100"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isFocused = idx === focusedIndex;

                if (renderOption) {
                  return (
                    <div
                      key={String(opt.value)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectOption(opt);
                      }}
                      onMouseEnter={() => setFocusedIndex(idx)}
                      className="cursor-pointer"
                    >
                      {renderOption(opt, isSelected)}
                    </div>
                  );
                }

                return (
                  <div
                    key={String(opt.value)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectOption(opt);
                    }}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    className={`
                      py-2.5 px-3 flex items-center justify-between cursor-pointer transition-colors duration-100
                      ${
                        isSelected
                          ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold'
                          : isFocused
                          ? 'bg-slate-100 dark:bg-slate-700/70 text-slate-900 dark:text-slate-100'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-200'
                      }
                    `}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold truncate">{opt.label}</span>
                        {opt.badge && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.subtext && (
                        <div className="text-[10px] text-slate-400 dark:text-slate-400 truncate mt-0.5">
                          {opt.subtext}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {opt.extra && <div className="text-right text-xs font-bold">{opt.extra}</div>}
                      {isSelected && <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-4 px-3 text-center text-xs text-slate-400 dark:text-slate-500">
                No matching options
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
