export type SupportedLanguage = 'en' | 'hi' | 'ar';
export type SupportedCurrency = 'USD' | 'INR' | 'AED' | 'EUR' | 'GBP';
export type DateFormatType = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

export interface LocaleState {
  language: SupportedLanguage;
  currency: SupportedCurrency;
  timezone: string;
  dateFormat: DateFormatType;
}

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  locale: string;
  position: 'before' | 'after';
}

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  flag: string;
}

export const LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', dir: 'ltr', flag: '🇮🇳' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦' },
];

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', position: 'before' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', position: 'before' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE', position: 'before' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', position: 'before' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', position: 'before' },
];

export const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
];

export const DATE_FORMATS: { value: DateFormatType; label: string; example: string }[] = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '25/12/2026' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '12/25/2026' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2026-12-25' },
];
