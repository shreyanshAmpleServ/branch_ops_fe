import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X, RotateCcw, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value = { startDate: '', endDate: '' },
  onChange,
  placeholder = 'Select Date Range',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(value.startDate || '');
  const [endDate, setEndDate] = useState(value.endDate || '');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const initialDate = value.startDate ? new Date(value.startDate) : new Date();
    return isNaN(initialDate.getTime()) ? new Date() : initialDate;
  });

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStartDate(value.startDate || '');
    setEndDate(value.endDate || '');
    if (value.startDate) {
      const d = new Date(value.startDate);
      if (!isNaN(d.getTime())) {
        setCurrentMonth(d);
      }
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getDisplayText = () => {
    if (startDate && endDate) {
      if (startDate === endDate) return formatDate(startDate);
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    if (startDate) return `From ${formatDate(startDate)}`;
    if (endDate) return `Until ${formatDate(endDate)}`;
    return placeholder;
  };

  const applyPreset = (presetName: string, getDates: () => { start: string; end: string }) => {
    const { start, end } = getDates();
    setStartDate(start);
    setEndDate(end);
    setActivePreset(presetName);
    onChange({ startDate: start, endDate: end });
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStartDate('');
    setEndDate('');
    setActivePreset(null);
    onChange({ startDate: '', endDate: '' });
  };

  const handleApplyCustom = () => {
    setActivePreset('custom');
    onChange({ startDate, endDate });
    setIsOpen(false);
  };

  const presets = [
    {
      name: 'Today',
      getDates: () => {
        const today = new Date().toISOString().split('T')[0];
        return { start: today, end: today };
      },
    },
    {
      name: 'Yesterday',
      getDates: () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const yest = d.toISOString().split('T')[0];
        return { start: yest, end: yest };
      },
    },
    {
      name: 'Last 7 Days',
      getDates: () => {
        const end = new Date().toISOString().split('T')[0];
        const d = new Date();
        d.setDate(d.getDate() - 6);
        const start = d.toISOString().split('T')[0];
        return { start, end };
      },
    },
    {
      name: 'Last 30 Days',
      getDates: () => {
        const end = new Date().toISOString().split('T')[0];
        const d = new Date();
        d.setDate(d.getDate() - 29);
        const start = d.toISOString().split('T')[0];
        return { start, end };
      },
    },
    {
      name: 'This Month',
      getDates: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        return { start, end };
      },
    },
  ];

  const hasValue = Boolean(startDate || endDate);

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDayClick = (year: number, month: number, day: number) => {
    const targetDate = new Date(year, month, day);

    // Format local date correctly as YYYY-MM-DD
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    if (!startDate || (startDate && endDate)) {
      setStartDate(dateStr);
      setEndDate('');
      setActivePreset(null);
    } else {
      if (dateStr < startDate) {
        setStartDate(dateStr);
        setEndDate('');
      } else {
        setEndDate(dateStr);
        setActivePreset('custom');
      }
    }
  };

  const isInRange = (dateStr: string) => {
    if (!startDate || !endDate) return false;
    return dateStr > startDate && dateStr < endDate;
  };

  // Generate days array for a given year & month (only current month, pads with empty/null)
  const generateCalendarDays = (y: number, m: number) => {
    const dayCells: { day: number | null; dateStr: string; type: 'prev' | 'curr' | 'next' }[] = [];
    const getDaysInMonth = (yearVal: number, monthVal: number) => new Date(yearVal, monthVal + 1, 0).getDate();
    const getFirstDayOfMonth = (yearVal: number, monthVal: number) => new Date(yearVal, monthVal, 1).getDay();

    const daysInMonth = getDaysInMonth(y, m);
    const firstDayIndex = getFirstDayOfMonth(y, m);

    // Prev month padding (empty cells)
    for (let i = 0; i < firstDayIndex; i++) {
      dayCells.push({ day: null, dateStr: '', type: 'prev' });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(y, m, i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dayCells.push({ day: i, dateStr: ds, type: 'curr' });
    }

    // Next month padding to complete the 6 rows of 7 days (42 cells)
    const remainingCells = 42 - dayCells.length;
    for (let i = 0; i < remainingCells; i++) {
      dayCells.push({ day: null, dateStr: '', type: 'next' });
    }

    return dayCells;
  };

  // Right calendar month is next month
  const nextMonthYear = currentMonth.getMonth() === 11 ? currentMonth.getFullYear() + 1 : currentMonth.getFullYear();
  const nextMonthIndex = currentMonth.getMonth() === 11 ? 0 : currentMonth.getMonth() + 1;

  const leftDays = generateCalendarDays(currentMonth.getFullYear(), currentMonth.getMonth());
  const rightDays = generateCalendarDays(nextMonthYear, nextMonthIndex);
  
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Helper to render one calendar month view
  const renderMonthView = (
    days: typeof leftDays, 
    currentMIndex: number, 
    currentY: number,
    navButton: React.ReactNode
  ) => {
    return (
      <div className="space-y-2 flex-1 min-w-[210px]">
        <div className="flex items-center justify-between px-1 h-8">
          {navButton}
        </div>

        {/* Grid Header */}
        <div className="grid grid-cols-7 gap-x-0 text-center">
          {weekDays.map((d) => (
            <span key={d} className="text-[10px] font-bold uppercase text-gray-400 py-1">
              {d}
            </span>
          ))}
        </div>

        {/* Grid Days */}
        <div className="grid grid-cols-7 gap-y-1 gap-x-0">
          {days.map(({ day, dateStr, type }, index) => {
            if (type !== 'curr' || day === null) {
              return <div key={`empty-${index}`} className="h-7 w-full" />;
            }

            const isStart = dateStr === startDate;
            const isEnd = dateStr === endDate;
            const active = isStart || isEnd;
            const inRange = isInRange(dateStr);

            let dayClass = 'text-text-primary hover:bg-primary/10 rounded-full font-medium';
            let styles: React.CSSProperties = {};

            if (active) {
              dayClass = 'bg-primary text-white font-bold shadow-xs';
              if (isStart && endDate && startDate !== endDate) {
                dayClass += ' rounded-l-full rounded-r-none';
              } else if (isEnd && startDate && startDate !== endDate) {
                dayClass += ' rounded-r-full rounded-l-none';
              } else {
                dayClass += ' rounded-full';
              }
            } else if (inRange) {
              dayClass = 'text-primary font-semibold rounded-none';
              styles.backgroundColor = 'rgba(99, 102, 241, 0.15)';
            }

            return (
              <button
                key={`${dateStr}-${index}`}
                type="button"
                onClick={() => handleDayClick(currentY, currentMIndex, day)}
                className={`h-7 w-full text-xs flex items-center justify-center transition-all ${dayClass}`}
                style={styles}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const leftMonthLabel = currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const rightMonthLabel = new Date(nextMonthYear, nextMonthIndex, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border outline-none transition-all shadow-xs ${hasValue ? 'bg-primary text-white border-primary' : ''}`}
        style={hasValue ? {} : {
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text)',
        }}
      >
        <Calendar className={`h-4 w-4 shrink-0 ${hasValue ? 'text-white' : 'text-primary'}`} />
        <span className="truncate max-w-[180px]">{getDisplayText()}</span>
        {hasValue ? (
          <span
            onClick={handleClear}
            className="p-0.5 rounded-full transition-colors ml-1 hover:bg-white/20 text-white/80 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        ) : (
          <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-1" />
        )}
      </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 w-[290px] sm:w-[500px] rounded-2xl border shadow-2xl p-3.5 flex flex-col gap-2.5"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex items-center justify-between pb-1.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Select Date Range
              </span>
              {hasValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[10px] font-semibold text-rose-500 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              )}
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1">
              {presets.map((preset) => {
                const selected = activePreset === preset.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset.name, preset.getDates)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all flex items-center gap-1 ${selected
                      ? 'bg-primary text-white border-primary'
                      : 'border-transparent hover:border-border hover:bg-black/5 text-text-secondary'
                      }`}
                    style={!selected ? { color: 'var(--color-text-secondary)' } : undefined}
                  >
                    {preset.name}
                    {selected && <Check className="h-2.5 w-2.5" />}
                  </button>
                );
              })}
            </div>

            {/* 2 Month Interactive Calendars Container */}
            <div className="pt-1.5 border-t" style={{ borderColor: 'var(--color-border)' }}>
              {/* Side by side calendars */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Left Calendar (currentMonth) */}
                {renderMonthView(
                  leftDays, 
                  currentMonth.getMonth(), 
                  currentMonth.getFullYear(),
                  <>
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 border border-border/40 text-text-secondary transition-colors"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs font-bold text-text-primary capitalize flex-1 text-center">
                      {leftMonthLabel}
                    </span>
                    <div className="w-6" />
                  </>
                )}

                {/* Right Calendar (nextMonth) */}
                {renderMonthView(
                  rightDays,
                  nextMonthIndex,
                  nextMonthYear,
                  <>
                    <div className="w-6" />
                    <span className="text-xs font-bold text-text-primary capitalize flex-1 text-center">
                      {rightMonthLabel}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 border border-border/40 text-text-secondary transition-colors"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-1.5 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCustom}
                className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-primary hover:bg-primary-dark transition-colors"
              >
                Apply Range
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
