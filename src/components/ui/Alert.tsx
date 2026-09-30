import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type AlertType = 'success' | 'warning' | 'error' | 'info';

export interface AlertProps {
  type?: AlertType;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const alertConfig: Record<
  AlertType,
  {
    icon: React.ElementType;
    containerCls: string;
    iconCls: string;
    titleCls: string;
    textCls: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    containerCls:
      'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100 dark:bg-emerald-950/20',
    iconCls: 'text-emerald-500 dark:text-emerald-400',
    titleCls: 'text-emerald-900 dark:text-emerald-300',
    textCls: 'text-emerald-800 dark:text-emerald-200',
  },
  warning: {
    icon: AlertTriangle,
    containerCls:
      'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100 dark:bg-amber-950/20',
    iconCls: 'text-amber-500 dark:text-amber-400',
    titleCls: 'text-amber-900 dark:text-amber-300',
    textCls: 'text-amber-800 dark:text-amber-200',
  },
  error: {
    icon: AlertCircle,
    containerCls:
      'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100 dark:bg-rose-950/20',
    iconCls: 'text-rose-500 dark:text-rose-400',
    titleCls: 'text-rose-900 dark:text-rose-300',
    textCls: 'text-rose-800 dark:text-rose-200',
  },
  info: {
    icon: Info,
    containerCls:
      'bg-indigo-500/10 border-indigo-500/30 text-indigo-950 dark:text-indigo-100 dark:bg-indigo-950/20',
    iconCls: 'text-indigo-500 dark:text-indigo-400',
    titleCls: 'text-indigo-900 dark:text-indigo-300',
    textCls: 'text-indigo-800 dark:text-indigo-200',
  },
};

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  message,
  children,
  onClose,
  action,
  className = '',
}) => {
  const config = alertConfig[type] || alertConfig.info;
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 p-4 rounded-2xl border transition-all ${config.containerCls} ${className}`}
    >
      <div className="shrink-0 mt-0.5">
        <Icon className={`w-5 h-5 ${config.iconCls}`} />
      </div>

      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${config.titleCls}`}>
            {title}
          </h4>
        )}
        {(message || children) && (
          <div className={`text-xs font-medium leading-relaxed ${config.textCls}`}>
            {message || children}
          </div>
        )}

        {action && (
          <div className="mt-2.5">
            <button
              type="button"
              onClick={action.onClick}
              className="text-xs font-bold underline hover:opacity-80 active:scale-95 transition-transform"
            >
              {action.label}
            </button>
          </div>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 -mr-1 -mt-1 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
