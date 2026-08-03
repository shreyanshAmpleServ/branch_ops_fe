import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, DollarSign, Clock, Calendar } from 'lucide-react';
import { Card, Select } from '../../components/ui';
import { useLocaleStore } from '../../store/useLocaleStore';
import { LANGUAGES, CURRENCIES, TIMEZONES, DATE_FORMATS } from '../../types/i18n.types';
import type { SupportedLanguage, SupportedCurrency, DateFormatType } from '../../types/i18n.types';

export const LocaleSettings: React.FC = () => {
  const { t } = useTranslation();
  const { language, setLanguage, currency, setCurrency, timezone, setTimezone, dateFormat, setDateFormat } = useLocaleStore();

  return (
    <div className="page-container max-w-3xl">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>{t('settings.locale')}</h1>

      <Card className="mb-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          <Globe className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> {t('settings.language')}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {LANGUAGES.map(lang => (
            <button key={lang.code} onClick={() => setLanguage(lang.code)}
              className="flex items-center gap-3 p-4 rounded-xl transition-all"
              style={{ background: language === lang.code ? 'rgba(99,102,241,0.1)' : 'var(--color-surface-hover)', border: `2px solid ${language === lang.code ? 'var(--color-primary)' : 'transparent'}` }}>
              <span className="text-2xl">{lang.flag}</span>
              <div className="text-left">
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{lang.nativeName}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{lang.name}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          <DollarSign className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> {t('settings.currency')}
        </h3>
        <Select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
          options={CURRENCIES.map(c => ({ value: c.code, label: `${c.symbol} ${c.name} (${c.code})` }))}
        />
      </Card>

      <Card className="mb-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          <Clock className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> {t('settings.timezone')}
        </h3>
        <Select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          options={TIMEZONES.map(tz => ({ value: tz.value, label: tz.label }))}
        />
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          <Calendar className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> {t('settings.dateFormat')}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {DATE_FORMATS.map(df => (
            <button key={df.value} onClick={() => setDateFormat(df.value)}
              className="p-3 rounded-xl text-center transition-all"
              style={{ background: dateFormat === df.value ? 'rgba(99,102,241,0.1)' : 'var(--color-surface-hover)', border: `2px solid ${dateFormat === df.value ? 'var(--color-primary)' : 'transparent'}` }}>
              <p className="text-sm font-medium" style={{ color: dateFormat === df.value ? 'var(--color-primary)' : 'var(--color-text)' }}>{df.label}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{df.example}</p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};
