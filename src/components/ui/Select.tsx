import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useDesignStore } from '../../store/useDesignStore';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, fullWidth = true, className = '', id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s/g, '-');
    const { activeDesign } = useDesignStore();

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`
              ${activeDesign === 'design1' ? 'glass-input w-full rounded-lg px-4 py-2.5 text-sm transition-all duration-200 outline-none' : 'input-base'} appearance-none pr-10 cursor-pointer
              ${error ? 'border-error' : ''}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--color-text-secondary)' }} />
        </div>
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
