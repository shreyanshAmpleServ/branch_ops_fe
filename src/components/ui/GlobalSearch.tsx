import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Target, Handshake, CheckSquare, BarChart3, Settings } from 'lucide-react';
import { useDesignStore } from '../../store/useDesignStore';

interface SearchOption {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

export const GlobalSearch: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeDesign } = useDesignStore();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const modules: SearchOption[] = [
    { id: 'customers', label: t('nav.customers', 'Customers'), path: '/customers', icon: Users },
    { id: 'leads', label: t('nav.leads', 'Leads'), path: '/leads', icon: Target },
    { id: 'deals', label: t('nav.deals', 'Deals'), path: '/deals', icon: Handshake },
    { id: 'tasks', label: t('nav.tasks', 'Tasks'), path: '/tasks', icon: CheckSquare },
    { id: 'analytics', label: t('nav.analytics', 'Analytics'), path: '/analytics', icon: BarChart3 },
    { id: 'settings', label: t('nav.settings', 'Settings'), path: '/settings/general', icon: Settings },
  ];

  const filteredOptions = modules.filter(module => 
    module.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  const isDesign1 = activeDesign === 'design1';

  return (
    <div ref={wrapperRef} className="relative hidden sm:block">
      <div 
        className={`relative flex items-center rounded-xl transition-all ${
          isOpen ? 'ring-2' : ''
        }`}
        style={{ 
          background: 'var(--color-surface-hover)', 
          '--tw-ring-color': 'rgba(99, 102, 241, 0.15)',
          border: isDesign1 ? '1.5px solid var(--color-border)' : '1px solid var(--color-border)' 
        } as React.CSSProperties}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-secondary)' }} />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={t('common.search', 'Search modules...')}
          className="bg-transparent border-none outline-none pl-10 pr-4 py-2 w-64 text-sm"
          style={{ color: 'var(--color-text)' }}
        />
      </div>

      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 w-full rounded-xl overflow-hidden shadow-lg z-50 animate-fade-in"
          style={{ 
            background: isDesign1 ? 'rgba(var(--color-surface-rgb), 0.95)' : 'var(--color-surface)',
            backdropFilter: isDesign1 ? 'blur(12px)' : 'none',
            border: '1px solid var(--color-border)',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)'
          }}
        >
          {filteredOptions.length > 0 ? (
            <div className="py-2">
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                Modules
              </div>
              {filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.path)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-left"
                >
                  <opt.icon className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                  <span style={{ color: 'var(--color-text)' }}>{opt.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              No modules found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
