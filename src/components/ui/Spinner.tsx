import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <Loader2 className={`${sizeMap[size]} animate-spin`} style={{ color: 'var(--color-primary)' }} />
  </div>
);

export const PageSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" style={{ color: 'var(--color-primary)' }} />
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
    </div>
  </div>
);
