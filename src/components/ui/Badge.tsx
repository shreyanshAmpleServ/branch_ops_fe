import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary' | 'outline' | 'purple' | 'teal' | string;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<string, { bg: string; text: string; dot: string; border?: string }> = {
  default: { bg: 'rgba(100,116,139,0.12)', text: 'var(--color-text-secondary, #64748b)', dot: 'var(--color-text-secondary, #64748b)' },
  secondary: { bg: 'rgba(148,163,184,0.15)', text: '#475569', dot: '#475569' },
  success: { bg: 'rgba(16,185,129,0.12)', text: 'var(--color-success, #10b981)', dot: 'var(--color-success, #10b981)' },
  warning: { bg: 'rgba(245,158,11,0.12)', text: 'var(--color-warning, #f59e0b)', dot: 'var(--color-warning, #f59e0b)' },
  error: { bg: 'rgba(239,68,68,0.12)', text: 'var(--color-error, #ef4444)', dot: 'var(--color-error, #ef4444)' },
  danger: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', dot: '#ef4444' },
  info: { bg: 'rgba(59,130,246,0.12)', text: 'var(--color-info, #3b82f6)', dot: 'var(--color-info, #3b82f6)' },
  primary: { bg: 'rgba(99,102,241,0.12)', text: 'var(--color-primary, #6366f1)', dot: 'var(--color-primary, #6366f1)' },
  purple: { bg: 'rgba(168,85,247,0.12)', text: '#9333ea', dot: '#9333ea' },
  teal: { bg: 'rgba(20,184,166,0.12)', text: '#0d9488', dot: '#0d9488' },
  outline: { bg: 'transparent', text: '#64748b', dot: '#64748b', border: '1px solid #cbd5e1' },
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'sm', dot = false, className = '' }) => {
  const styles = (variant && variantStyles[variant]) ? variantStyles[variant] : variantStyles.default;

  return (
    <span
      className={`badge inline-flex items-center font-medium rounded-full ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
      } ${className}`}
      style={{
        background: styles.bg,
        color: styles.text,
        border: styles.border || 'none',
      }}
    >
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
          style={{ background: styles.dot }}
        />
      )}
      {children}
    </span>
  );
};
