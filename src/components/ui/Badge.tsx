import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<string, { bg: string; text: string; dot: string }> = {
  default: { bg: 'rgba(100,116,139,0.12)', text: 'var(--color-text-secondary)', dot: 'var(--color-text-secondary)' },
  success: { bg: 'rgba(16,185,129,0.12)', text: 'var(--color-success)', dot: 'var(--color-success)' },
  warning: { bg: 'rgba(245,158,11,0.12)', text: 'var(--color-warning)', dot: 'var(--color-warning)' },
  error: { bg: 'rgba(239,68,68,0.12)', text: 'var(--color-error)', dot: 'var(--color-error)' },
  info: { bg: 'rgba(59,130,246,0.12)', text: 'var(--color-info)', dot: 'var(--color-info)' },
  primary: { bg: 'rgba(99,102,241,0.12)', text: 'var(--color-primary)', dot: 'var(--color-primary)' },
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'sm', dot = false, className = '' }) => {
  const styles = variantStyles[variant];

  return (
    <span
      className={`badge ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'} ${className}`}
      style={{ background: styles.bg, color: styles.text }}
    >
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
          style={{ background: styles.dot }}
        />
      )}
      {children}
    </span>
  );
};
