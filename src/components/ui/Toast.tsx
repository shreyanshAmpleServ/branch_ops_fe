import React, { useEffect, useState, useRef } from 'react';
import { create } from 'zustand';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'> & { id?: string }) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = toast.id || Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts.filter((t) => t.id !== id), { ...toast, id }],
    }));
    return id;
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearAll: () => set({ toasts: [] }),
}));

// Programmatic helper API
export const toast = {
  success: (titleOrMessage: string, messageOrDesc?: string, options?: Partial<ToastItem>) => {
    const title = messageOrDesc ? titleOrMessage : 'Success';
    const message = messageOrDesc || titleOrMessage;
    return useToastStore.getState().addToast({
      type: 'success',
      title,
      message,
      duration: options?.duration ?? 4500,
      ...options,
    });
  },
  warning: (titleOrMessage: string, messageOrDesc?: string, options?: Partial<ToastItem>) => {
    const title = messageOrDesc ? titleOrMessage : 'Warning';
    const message = messageOrDesc || titleOrMessage;
    return useToastStore.getState().addToast({
      type: 'warning',
      title,
      message,
      duration: options?.duration ?? 5000,
      ...options,
    });
  },
  error: (titleOrMessage: string, messageOrDesc?: string, options?: Partial<ToastItem>) => {
    const title = messageOrDesc ? titleOrMessage : 'Error';
    const message = messageOrDesc || titleOrMessage;
    return useToastStore.getState().addToast({
      type: 'error',
      title,
      message,
      duration: options?.duration ?? 6000,
      ...options,
    });
  },
  info: (titleOrMessage: string, messageOrDesc?: string, options?: Partial<ToastItem>) => {
    const title = messageOrDesc ? titleOrMessage : 'Information';
    const message = messageOrDesc || titleOrMessage;
    return useToastStore.getState().addToast({
      type: 'info',
      title,
      message,
      duration: options?.duration ?? 4500,
      ...options,
    });
  },
  dismiss: (id: string) => useToastStore.getState().removeToast(id),
  clearAll: () => useToastStore.getState().clearAll(),
};

// Global interceptor: shim window.alert to automatically show modern toast
if (typeof window !== 'undefined') {
  // Save original in case low-level debugging is ever needed
  (window as any).__nativeAlert = window.alert;
  window.alert = (message: any) => {
    const str = String(message ?? '');
    // Choose appropriate type based on content keywords
    if (/error|failed|invalid|cannot|could not/i.test(str)) {
      toast.error('Alert', str);
    } else if (/warning|please|required|attention|select|fill/i.test(str)) {
      toast.warning('Notice', str);
    } else if (/success|completed|saved|updated/i.test(str)) {
      toast.success('Success', str);
    } else {
      toast.info('Notification', str);
    }
  };
}

const toastConfig: Record<
  ToastType,
  {
    icon: React.ElementType;
    badgeCls: string;
    borderCls: string;
    glowCls: string;
    titleCls: string;
    progressCls: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    badgeCls: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 border border-emerald-500/30',
    borderCls: 'border-emerald-500/30 dark:border-emerald-500/40',
    glowCls: 'shadow-emerald-500/10',
    titleCls: 'text-emerald-700 dark:text-emerald-400',
    progressCls: 'bg-gradient-to-r from-emerald-500 to-teal-400',
  },
  warning: {
    icon: AlertTriangle,
    badgeCls: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 border border-amber-500/30',
    borderCls: 'border-amber-500/30 dark:border-amber-500/40',
    glowCls: 'shadow-amber-500/10',
    titleCls: 'text-amber-700 dark:text-amber-400',
    progressCls: 'bg-gradient-to-r from-amber-500 to-orange-400',
  },
  error: {
    icon: AlertCircle,
    badgeCls: 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 border border-rose-500/30',
    borderCls: 'border-rose-500/30 dark:border-rose-500/40',
    glowCls: 'shadow-rose-500/10',
    titleCls: 'text-rose-700 dark:text-rose-400',
    progressCls: 'bg-gradient-to-r from-rose-500 to-red-500',
  },
  info: {
    icon: Info,
    badgeCls: 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 border border-indigo-500/30',
    borderCls: 'border-indigo-500/30 dark:border-indigo-500/40',
    glowCls: 'shadow-indigo-500/10',
    titleCls: 'text-indigo-700 dark:text-indigo-400',
    progressCls: 'bg-gradient-to-r from-indigo-500 to-primary',
  },
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({
  toast: t,
  onDismiss,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = t.duration || 4500;
  const config = toastConfig[t.type] || toastConfig.info;
  const Icon = config.icon;
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(duration);

  useEffect(() => {
    if (duration <= 0) return;

    let timer: any;
    let animFrame: any;

    if (!isPaused) {
      startTimeRef.current = Date.now();
      timer = setTimeout(() => {
        onDismiss(t.id);
      }, remainingTimeRef.current);

      const updateProgress = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const currentRemaining = Math.max(0, remainingTimeRef.current - elapsed);
        setProgress((currentRemaining / duration) * 100);

        if (currentRemaining > 0) {
          animFrame = requestAnimationFrame(updateProgress);
        }
      };

      animFrame = requestAnimationFrame(updateProgress);
    }

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animFrame);
    };
  }, [isPaused, t.id, duration, onDismiss]);

  const handleMouseEnter = () => {
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border backdrop-blur-xl shadow-2xl p-4 min-w-[320px] max-w-[420px] w-full flex items-start gap-3.5 bg-white/95 dark:bg-slate-900/95 transition-all ${config.borderCls} ${config.glowCls}`}
    >
      {/* Status Icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.badgeCls}`}>
        <Icon className="w-5 h-5 stroke-[2.2]" />
      </div>

      {/* Body Content */}
      <div className="flex-1 min-w-0 pr-1">
        {t.title && (
          <h4 className={`text-[11px] font-extrabold uppercase tracking-wider mb-0.5 ${config.titleCls}`}>
            {t.title}
          </h4>
        )}
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-snug break-words">
          {t.message}
        </p>

        {t.action && (
          <button
            type="button"
            onClick={() => {
              t.action?.onClick();
              onDismiss(t.id);
            }}
            className="mt-2 text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 active:scale-95 transition-transform"
          >
            {t.action.label}
          </button>
        )}
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={() => onDismiss(t.id)}
        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 -mr-1 -mt-1 active:scale-90"
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Duration countdown bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ease-linear ${config.progressCls}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed top-5 right-5 z-[999999] pointer-events-none flex flex-col gap-2.5 max-sm:inset-x-3 max-sm:top-3 max-sm:right-auto items-end max-sm:items-center max-h-screen overflow-hidden"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
