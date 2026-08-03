import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Modal, Button } from '../../components/ui';
import { useAuthStore } from '../../store/useAuthStore';

export const LogoutModal: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLogoutModalOpen, closeLogoutModal, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!isLogoutModalOpen) return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Modal
      isOpen={isLogoutModalOpen}
      onClose={closeLogoutModal}
      title={t('common.logout')}
      size="sm"
    >
      <div className="text-center py-4">
        <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <LogOut className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          {t('common.confirmLogout', 'Are you sure you want to log out?')}
        </h3>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          {t('common.logoutWarning', 'You will need to login again to access your dashboard.')}
        </p>
        
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={closeLogoutModal}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleLogout} isLoading={isLoggingOut}>
            {t('common.logout', 'Logout')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
