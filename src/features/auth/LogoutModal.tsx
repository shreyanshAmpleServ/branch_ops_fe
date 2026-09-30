import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X, ShieldAlert, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const LogoutModal: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLogoutModalOpen, closeLogoutModal, logout, user } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Always reset logging out state whenever modal opens or closes
  useEffect(() => {
    setIsLoggingOut(false);
  }, [isLogoutModalOpen]);

  // Lock body scroll while modal is active
  useEffect(() => {
    if (isLogoutModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLogoutModalOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLogoutModalOpen) {
        closeLogoutModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isLogoutModalOpen, closeLogoutModal]);

  if (!isLogoutModalOpen) return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  const fullName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
    : null;

  return (
    <AnimatePresence>
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          {/* Glassify Dark Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-md"
            onClick={closeLogoutModal}
          />

          {/* Glassmorphic Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-6 bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/40 dark:border-white/10"
            style={{
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4), 0 0 40px -10px rgba(244, 63, 94, 0.15)',
            }}
          >
            {/* Ambient Radial Glow */}
            <div
              className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none opacity-40 dark:opacity-30"
              style={{
                background: 'radial-gradient(circle, rgba(244, 63, 94, 0.4) 0%, transparent 70%)',
                filter: 'blur(30px)',
              }}
            />

            {/* Top Close Button */}
            <button
              onClick={closeLogoutModal}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative text-center pt-2">
              {/* Center Glowing Icon */}
              <div className="relative mx-auto w-16 h-16 mb-4 flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-rose-500/15 dark:bg-rose-500/20 blur-md animate-pulse" />
                <div className="relative w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50 flex items-center justify-center shadow-inner">
                  <LogOut className="w-6 h-6 text-rose-500 dark:text-rose-400 stroke-[2.2] translate-x-0.5" />
                </div>
              </div>

              {/* Title & Warning */}
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-1">
                {t('common.confirmLogout', 'Log out of your account?')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                {t('common.logoutWarning', 'You will need to sign in again to access your dashboard and branch data.')}
              </p>

              {/* User Account Info Snippet */}
              {user && (
                <div className="mb-5 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-white/5 flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs shrink-0">
                    <UserIcon className="w-5 h-5 text-white/95" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {fullName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </div>
                  </div>
                  {user.role && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60">
                      {user.role}
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={closeLogoutModal}
                  disabled={isLoggingOut}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {t('common.cancel', 'Cancel')}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-md shadow-rose-500/25 transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('common.logout', 'Log Out')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LogoutModal;
