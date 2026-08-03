import React from 'react';
import { motion } from 'framer-motion';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, disabled = false, size = 'md' }) => {
  const trackSize = size === 'sm' ? 'w-8 h-4' : 'w-11 h-6';
  const thumbSize = size === 'sm' ? 'h-3 w-3' : 'h-5 w-5';
  const translateX = size === 'sm' ? 16 : 20;

  return (
    <label className={`inline-flex items-center gap-2.5 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex shrink-0 ${trackSize} rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2`}
        style={{
          background: checked ? 'var(--color-primary)' : 'var(--color-border)',
          '--tw-ring-color': 'var(--color-primary)',
        } as React.CSSProperties}
      >
        <motion.span
          className={`${thumbSize} rounded-full bg-white shadow-sm`}
          animate={{ x: checked ? translateX : 2, y: size === 'sm' ? 2 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
      {label && <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{label}</span>}
    </label>
  );
};
