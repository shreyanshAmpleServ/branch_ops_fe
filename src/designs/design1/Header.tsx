import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Bell, Sun, Moon, Menu, Globe, Paintbrush, Image as ImageIcon } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { PRIMARY_COLORS } from '../../types/theme.types';
import { useLocaleStore } from '../../store/useLocaleStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Avatar, Dropdown, ThemeSettingsDropdown, HeaderPageTitle } from '../../components/ui';
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
  const isCustomBg = !!backgroundImage || !!backgroundColor;

  return (
    <header
      className={`sticky top-0 z-20 h-16 flex items-center justify-between px-6 transition-all duration-300 backdrop-blur-xl ${
        isCustomBg
          ? (resolvedMode === 'dark'
              ? 'bg-slate-900/80 border-b border-white/10 shadow-lg shadow-black/10'
              : 'bg-white/85 border-b border-white/60 shadow-xs')
          : (resolvedMode === 'dark'
              ? 'bg-surface/90 border-b border-border shadow-xs'
              : 'bg-white/90 border-b border-slate-200/80 shadow-2xs')
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
        <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/10 transition-colors lg:hidden shrink-0">
          <Menu className="h-5 w-5 text-slate-700 dark:text-slate-200" />
        </button>
        <HeaderPageTitle />
      </div>

      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <Dropdown
          trigger={
            <button className="p-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/10 transition-colors">
              <Globe className="h-5 w-5 text-slate-600 dark:text-slate-300" />
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
        <button onClick={toggleMode} className="p-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/10 transition-colors">
          {resolvedMode === 'dark' ? (
            <Sun className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          ) : (
            <Moon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          )}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/10 transition-colors">
          <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-error" />
        </button>

        {/* User Menu */}
        <Dropdown
          trigger={
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/10 transition-colors cursor-pointer">
              <Avatar name={`${user?.firstName} ${user?.lastName}`} size="sm" />
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{user?.firstName}</p>
                <p className="text-xs capitalize text-slate-500 dark:text-slate-400 mt-0.5">{user?.role}</p>
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
