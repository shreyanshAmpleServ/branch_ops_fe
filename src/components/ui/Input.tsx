import React, { forwardRef } from 'react';
import { useDesignStore } from '../../store/useDesignStore';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconPosition = 'left', fullWidth = true, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
    const { activeDesign } = useDesignStore();

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">{icon}</div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              ${activeDesign === 'design1' ? 'glass-input w-full rounded-lg px-4 py-2.5 text-sm transition-all duration-200 outline-none' : 'input-base'}
              ${icon && iconPosition === 'left' ? 'pl-10' : ''}
              ${icon && iconPosition === 'right' ? 'pr-10' : ''}
              ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}
              ${className}
            `}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">{icon}</div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-text-secondary">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
