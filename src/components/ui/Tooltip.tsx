import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'center' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  align = 'center',
  delay = 150,
  className = '',
}) => {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    const tooltipEl = tooltipRef.current;
    const tooltipWidth = tooltipEl ? tooltipEl.offsetWidth : 120;
    const tooltipHeight = tooltipEl ? tooltipEl.offsetHeight : 28;

    let pos = position;
    let top = 0;
    let left = 0;

    // Flip vertically if tight on space
    if (pos === 'top' && rect.top - tooltipHeight - 8 < 0) {
      pos = 'bottom';
    } else if (pos === 'bottom' && rect.bottom + tooltipHeight + 8 > window.innerHeight) {
      pos = 'top';
    }

    if (pos === 'top') {
      top = rect.top - tooltipHeight - 6;
    } else if (pos === 'bottom') {
      top = rect.bottom + 6;
    } else if (pos === 'left') {
      top = rect.top + (rect.height - tooltipHeight) / 2;
      left = rect.left - tooltipWidth - 6;
    } else if (pos === 'right') {
      top = rect.top + (rect.height - tooltipHeight) / 2;
      left = rect.right + 6;
    }

    if (pos === 'top' || pos === 'bottom') {
      if (align === 'left') {
        left = rect.left;
      } else if (align === 'right') {
        left = rect.right - tooltipWidth;
      } else {
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
      }
    }

    // Viewport collision clamping (never cut off on left, right, top, bottom)
    const padding = 10;
    const maxLeft = Math.max(padding, window.innerWidth - tooltipWidth - padding);
    left = Math.max(padding, Math.min(left, maxLeft));

    const maxTop = Math.max(padding, window.innerHeight - tooltipHeight - padding);
    top = Math.max(padding, Math.min(top, maxTop));

    setCoords({ top, left });
  }, [position, align]);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShow(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShow(false);
  };

  useLayoutEffect(() => {
    if (show) {
      calculatePosition();
    } else {
      setCoords(null);
    }
  }, [show, calculatePosition]);

  useEffect(() => {
    if (!show) return;

    const handleScrollOrResize = () => {
      calculatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [show, calculatePosition]);

  if (!content) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        ref={triggerRef}
        className={`relative inline-flex items-center ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {show && (
              <motion.div
                ref={tooltipRef}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{
                  opacity: coords ? 1 : 0,
                  scale: coords ? 1 : 0.94,
                }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.12 }}
                className="fixed z-[999999] pointer-events-none whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xl bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-sm border border-slate-700/80"
                style={{
                  top: coords ? `${coords.top}px` : '-9999px',
                  left: coords ? `${coords.left}px` : '-9999px',
                }}
              >
                {content}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};

export default Tooltip;
