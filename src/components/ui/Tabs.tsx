import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'line' | 'pill';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, defaultTab, onChange, variant = 'line', className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleChange = (id: string) => {
    setActiveTab(id);
    onChange?.(id);
  };

  return (
    <div className={className}>
      <div
        className={`flex gap-1 ${variant === 'pill' ? 'p-1 rounded-xl' : 'border-b'}`}
        style={variant === 'pill' ? { background: 'var(--color-surface-hover)' } : { borderColor: 'var(--color-border)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleChange(tab.id)}
            className={`
              relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200
              ${variant === 'pill' ? 'rounded-lg' : '-mb-px'}
              ${activeTab === tab.id ? '' : 'hover:opacity-80'}
            `}
            style={{
              color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              ...(variant === 'pill' && activeTab === tab.id ? { background: 'var(--color-surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : {}),
            }}
          >
            {tab.icon}
            {tab.label}
            {variant === 'line' && activeTab === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: 'var(--color-primary)' }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <AnimatePresence mode="wait">
          {tabs.map(
            (tab) =>
              tab.id === activeTab && (
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab.content}
                </motion.div>
              )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
