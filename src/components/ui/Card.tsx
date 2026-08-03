import React from 'react';
import { motion } from 'framer-motion';

import { useDesignStore } from '../../store/useDesignStore';
import { useThemeStore } from '../../store/useThemeStore';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  glass?: boolean;
  onClick?: () => void;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

export const Card: React.FC<CardProps> = ({ children, className = '', padding = 'md', hover = false, glass = false, onClick }) => {
  const { activeDesign } = useDesignStore();
  const { backgroundImage, backgroundColor } = useThemeStore();
  const resolvedGlass = glass || activeDesign === 'design1';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -2, boxShadow: '0 12px 40px rgba(0,0,0,0.1)' } : undefined}
      onClick={onClick}
      className={`
        rounded-2xl transition-all duration-300
        ${resolvedGlass ? 'glass-card' : ''}
        ${paddingClasses[padding]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={!resolvedGlass ? {
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      } : undefined}
    >
      {children}
    </motion.div>
  );
};
