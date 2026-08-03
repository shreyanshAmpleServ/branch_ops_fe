import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base', xl: 'h-16 w-16 text-lg' };

const getInitials = (name: string): string => {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

const getColorFromName = (name: string): string => {
  const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#14b8a6', '#f43f5e'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export const Avatar: React.FC<AvatarProps> = ({ src, alt, name, size = 'md', className = '' }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={`${sizeMap[size]} rounded-full object-cover ring-2 ring-white/20 ${className}`}
      />
    );
  }

  if (name) {
    return (
      <div
        className={`${sizeMap[size]} rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-white/20 ${className}`}
        style={{ background: getColorFromName(name) }}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center ring-2 ring-white/20 ${className}`}
      style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)' }}
    >
      <User className="h-1/2 w-1/2" />
    </div>
  );
};
