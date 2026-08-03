export type ThemeMode = 'light' | 'dark' | 'system';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';
export type DesignId = 'design1' | 'design2' | 'design3';
export type SidebarStyle = 'solid' | 'transparent' | 'gradient';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
}

export interface ThemeState {
  mode: ThemeMode;
  fontSize: FontSize;
  primaryColor: string;
  backgroundImage: string | null;
  sidebarStyle: SidebarStyle;
  resolvedMode: 'light' | 'dark';
}

export interface DesignState {
  activeDesign: DesignId;
  tableDesign: 'modern' | 'striped' | 'card';
}

export const FONT_SIZE_MAP: Record<FontSize, { base: string; sm: string; lg: string; xl: string; '2xl': string; '3xl': string }> = {
  sm: { base: '13px', sm: '12px', lg: '15px', xl: '17px', '2xl': '20px', '3xl': '24px' },
  md: { base: '14px', sm: '12px', lg: '16px', xl: '18px', '2xl': '22px', '3xl': '28px' },
  lg: { base: '16px', sm: '14px', lg: '18px', xl: '20px', '2xl': '26px', '3xl': '32px' },
  xl: { base: '18px', sm: '15px', lg: '20px', xl: '24px', '2xl': '30px', '3xl': '38px' },
};

export const PRIMARY_COLORS = [
  { id: 'blue', label: 'Ocean Blue', value: '#3b82f6' },
  { id: 'violet', label: 'Royal Violet', value: '#8b5cf6' },
  { id: 'emerald', label: 'Emerald', value: '#10b981' },
  { id: 'rose', label: 'Rose', value: '#f43f5e' },
  { id: 'amber', label: 'Amber', value: '#f59e0b' },
  { id: 'cyan', label: 'Cyan', value: '#06b6d4' },
  { id: 'indigo', label: 'Indigo', value: '#6366f1' },
  { id: 'teal', label: 'Teal', value: '#14b8a6' },
];
