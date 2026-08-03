import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Bell, Sun, Moon, Menu, Globe, Paintbrush, Image as ImageIcon } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { PRIMARY_COLORS } from '../../types/theme.types';
import { useLocaleStore } from '../../store/useLocaleStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Avatar, Dropdown, ThemeSettingsDropdown } from '../../components/ui';
import { GlobalSearch } from '../../components/ui';
import { LANGUAGES } from '../../types/i18n.types';

import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
  collapsed: boolean;
}

export const Header1: React.FC<HeaderProps> = ({ onMenuClick, collapsed }) => {
  const t = useTranslation().t;
  const navigate = useNavigate();
  const { toggleMode, mode, setPrimaryColor, setBackgroundColor, setBackgroundImage, backgroundColor, backgroundImage } = useThemeStore();
  const { language, setLanguage } = useLocaleStore();
  const { user, openLogoutModal } = useAuthStore();

  const resolvedMode = mode === 'system' ? 'dark' : mode;

  return (
    <header
      className="sticky top-0 z-20 h-16 flex items-center justify-between px-6 transition-all duration-300 glass-light"
      style={{
        borderBottom: 'none',
      }}
    >
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-surface-hover transition-colors lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <Dropdown
          trigger={
            <button className="p-2 rounded-lg hover:bg-surface-hover transition-colors">
              <Globe className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          }
          items={LANGUAGES.map((lang) => ({
            id: lang.code,
            label: `${lang.flag} ${lang.nativeName}`,
            onClick: () => setLanguage(lang.code),
          }))}
        />

        {/* Theme Settings (Combined Color & Background) */}
        <ThemeSettingsDropdown />

        {/* Theme Toggle */}
        <button onClick={toggleMode} className="p-2 rounded-lg hover:bg-surface-hover transition-colors">
          {resolvedMode === 'dark' ? (
            <Sun className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} />
          ) : (
            <Moon className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} />
          )}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-surface-hover transition-colors">
          <Bell className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-error" />
        </button>

        {/* User Menu */}
        <Dropdown
          trigger={
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-surface-hover transition-colors cursor-pointer">
              <Avatar name={`${user?.firstName} ${user?.lastName}`} size="sm" />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{user?.firstName}</p>
                <p className="text-xs capitalize" style={{ color: 'var(--color-text-secondary)' }}>{user?.role}</p>
              </div>
            </div>
          }
          items={[
            { id: 'profile', label: t('common.profile'), onClick: () => navigate('/profile') },
            { id: 'settings', label: t('common.settings'), onClick: () => navigate('/settings') },
            { id: 'divider', label: '', divider: true },
            { id: 'logout', label: t('common.logout'), danger: true, onClick: openLogoutModal },
          ]}
        />
      </div>
    </header>
  );
};
