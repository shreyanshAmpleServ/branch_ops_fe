import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Clock, Key, Smartphone } from 'lucide-react';
import { Card, Button, Input, Toggle } from '../../components/ui';
import { useAuthStore } from '../../store/useAuthStore';

export const SecuritySettings: React.FC = () => {
  const { t } = useTranslation();
  const { sessionTimeout, setSessionTimeout } = useAuthStore();

  return (
    <div className="page-container max-w-3xl">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>{t('nav.security')}</h1>

      {/* Change Password */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          <Key className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> {t('settings.changePassword')}
        </h3>
        <div className="space-y-4 max-w-md">
          <Input label={t('settings.currentPassword')} type="password" />
          <Input label={t('settings.newPassword')} type="password" />
          <Input label={t('auth.confirmPassword')} type="password" />
          <Button>{t('settings.changePassword')}</Button>
        </div>
      </Card>

      {/* 2FA */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{t('settings.twoFactor')}</h3>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Add an extra layer of security to your account</p>
            </div>
          </div>
          <Toggle checked={false} onChange={() => {}} />
        </div>
      </Card>

      {/* Session Timeout */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          <Clock className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> {t('settings.sessionTimeout')}
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={30}
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-sm font-semibold min-w-[60px]" style={{ color: 'var(--color-text)' }}>
            {sessionTimeout} {t('settings.minutes')}
          </span>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          You'll be automatically logged out after {sessionTimeout} minutes of inactivity
        </p>
      </Card>

      {/* Active Sessions */}
      <Card>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          <Shield className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> {t('settings.activeSessions')}
        </h3>
        <div className="space-y-3">
          {[
            { device: 'Windows PC - Chrome', location: 'Mumbai, India', active: true, time: 'Active now' },
            { device: 'iPhone - Safari', location: 'Delhi, India', active: false, time: '2 hours ago' },
          ].map((session, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--color-surface-hover)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{session.device}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{session.location} · {session.time}</p>
              </div>
              {session.active ? (
                <span className="text-xs font-medium text-success flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-success" /> Active
                </span>
              ) : (
                <Button variant="ghost" size="sm">Revoke</Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
