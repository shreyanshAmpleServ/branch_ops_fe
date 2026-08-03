import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', delay = 200 }) => {
  const [show, setShow] = useState(false);
  let timer: ReturnType<typeof setTimeout>;

  const positionStyles: Record<string, React.CSSProperties> = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' },
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => { timer = setTimeout(() => setShow(true), delay); }}
      onMouseLeave={() => { clearTimeout(timer); setShow(false); }}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute z-50 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-white shadow-lg pointer-events-none"
            style={{ ...positionStyles[position], background: '#1e293b' }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
