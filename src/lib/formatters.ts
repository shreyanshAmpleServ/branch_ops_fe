import { format, parseISO } from 'date-fns';
import type { DateFormatType, SupportedCurrency } from '../types/i18n.types';
import { CURRENCIES } from '../types/i18n.types';

const DATE_FORMAT_MAP: Record<DateFormatType, string> = {
  'DD/MM/YYYY': 'dd/MM/yyyy',
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'YYYY-MM-DD': 'yyyy-MM-dd',
};

export const formatDate = (date: string | Date, dateFormat: DateFormatType): string => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, DATE_FORMAT_MAP[dateFormat]);
  } catch {
    return String(date);
  }
};

export const formatDateTime = (date: string | Date, dateFormat: DateFormatType): string => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, `${DATE_FORMAT_MAP[dateFormat]} HH:mm`);
  } catch {
    return String(date);
  }
};

export const formatCurrency = (amount: number, currencyCode: SupportedCurrency): string => {
  const config = CURRENCIES.find((c) => c.code === currencyCode);
  if (!config) return `${amount}`;

  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${config.symbol}${amount.toLocaleString()}`;
  }
};

export const formatNumber = (num: number): string => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const getRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return format(d, 'MMM dd, yyyy');
};
