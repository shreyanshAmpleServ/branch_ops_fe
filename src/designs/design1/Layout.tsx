import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar1 } from './Sidebar';
import { Header1 } from './Header';
import { useThemeStore } from '../../store/useThemeStore';
import { useIdleTimeout } from '../../hooks/useIdleTimeout';
import { Modal, Button } from '../../components/ui';
import { useTranslation } from 'react-i18next';

export const Layout1: React.FC = () => {
  const { t } = useTranslation();
  const { backgroundImage, mode } = useThemeStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { showWarning, secondsLeft, stayActive } = useIdleTimeout();

  const resolvedMode = mode === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode;

  return (
    <div 
      className="min-h-screen gradient-mesh"
      style={backgroundImage ? {
        background: resolvedMode === 'dark'
          ? `linear-gradient(rgba(10, 14, 26, 0.5), rgba(10, 14, 26, 0.5)), url(${backgroundImage})`
          : `linear-gradient(rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.15)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : undefined}
    >

      <Sidebar1
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'}`}>
        <Header1 onMenuClick={() => setMobileOpen(true)} collapsed={sidebarCollapsed} />
        <main className="min-h-[calc(100vh-64px)]">
          <Outlet />
        </main>
      </div>

      {/* Idle Warning Modal */}
      <Modal isOpen={showWarning} onClose={stayActive} title={t('auth.sessionExpired')} size="sm">
        <div className="text-center py-4">
          <div className="text-4xl font-bold mb-3" style={{ color: 'var(--color-error)' }}>{secondsLeft}</div>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            {t('auth.idleWarning', { seconds: secondsLeft })}
          </p>
          <Button onClick={stayActive} variant="primary" fullWidth>
            {t('auth.stayLoggedIn')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
