import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useThemeStore } from '../../store/useThemeStore';
import { useDesignStore } from '../../store/useDesignStore';

interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  divider?: boolean;
  isHeader?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items?: DropdownItem[];
  children?: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, items = [], children, align = 'right', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { backgroundImage, backgroundColor } = useThemeStore();
  const { activeDesign } = useDesignStore();

  const isGlass = false;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full mt-2 ${align === 'right' ? 'right-0' : 'left-0'} z-50 min-w-[180px] rounded-xl py-1.5 shadow-xl ${isGlass ? 'glass-card backdrop-blur-xl' : ''}`}
            style={!isGlass ? { background: 'var(--color-surface)', border: '1px solid var(--color-border)' } : undefined}
          >
            {children ? children : items.map((item) =>
              item.divider ? (
                <div key={item.id} className="my-1.5 h-px" style={{ background: 'var(--color-border)' }} />
              ) : item.isHeader ? (
                <div key={item.id} className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-text-secondary select-none opacity-60">
                  {item.label}
                </div>
              ) : (
                <button
                  key={item.id}
                  onClick={() => {
                    item.onClick?.();
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-surface-hover"
                  style={{ color: item.danger ? 'var(--color-error)' : 'var(--color-text)' }}
                >
                  {item.icon}
                  {item.label}
                </button>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
