import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SupportedLanguage, SupportedCurrency, DateFormatType } from '../types/i18n.types';
import i18n from '../i18n/i18n';

interface LocaleStore {
  language: SupportedLanguage;
  currency: SupportedCurrency;
  timezone: string;
  dateFormat: DateFormatType;
  setLanguage: (lang: SupportedLanguage) => void;
  setCurrency: (currency: SupportedCurrency) => void;
  setTimezone: (tz: string) => void;
  setDateFormat: (fmt: DateFormatType) => void;
  applyLocale: () => void;
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set, get) => ({
      language: 'en',
      currency: 'USD',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',

      setLanguage: (language) => {
        set({ language });
        i18n.changeLanguage(language);
        // Apply RTL
        const dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.setAttribute('dir', dir);
        document.documentElement.setAttribute('lang', language);
      },

      setCurrency: (currency) => set({ currency }),
      setTimezone: (timezone) => set({ timezone }),
      setDateFormat: (dateFormat) => set({ dateFormat }),

      applyLocale: () => {
        const state = get();
        i18n.changeLanguage(state.language);
        const dir = state.language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.setAttribute('dir', dir);
        document.documentElement.setAttribute('lang', state.language);
      },
    }),
    {
      name: 'salesapp-locale',
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            setTimeout(() => state.applyLocale(), 0);
          }
        };
      },
    }
  )
);
