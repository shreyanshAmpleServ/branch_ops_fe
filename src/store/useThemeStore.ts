import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode, FontSize, SidebarStyle } from '../types/theme.types';
import { FONT_SIZE_MAP } from '../types/theme.types';

interface ThemeStore {
  mode: ThemeMode;
  fontSize: FontSize;
  primaryColor: string;
  backgroundImage: string | null;
  backgroundColor: string | null;
  sidebarStyle: SidebarStyle;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setFontSize: (size: FontSize) => void;
  setPrimaryColor: (color: string) => void;
  setBackgroundImage: (url: string | null) => void;
  setBackgroundColor: (color: string | null) => void;
  setSidebarStyle: (style: SidebarStyle) => void;
  getResolvedMode: () => 'light' | 'dark';
  applyTheme: () => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      fontSize: 'md',
      primaryColor: '#6366f1',
      backgroundImage: null,
      backgroundColor: null,
      sidebarStyle: 'solid',

      setMode: (mode) => {
        set({ mode });
        get().applyTheme();
      },

      toggleMode: () => {
        const current = get().mode;
        const newMode = current === 'dark' ? 'light' : current === 'light' ? 'dark' : 'light';
        set({ mode: newMode });
        get().applyTheme();
      },

      setFontSize: (fontSize) => {
        set({ fontSize });
        get().applyTheme();
      },

      setPrimaryColor: (primaryColor) => {
        set({ primaryColor });
        get().applyTheme();
      },

      setBackgroundImage: (backgroundImage) => {
        set({ backgroundImage, backgroundColor: null });
        get().applyTheme();
      },

      setBackgroundColor: (backgroundColor) => {
        set({ backgroundColor, backgroundImage: null });
        get().applyTheme();
      },

      setSidebarStyle: (sidebarStyle) => {
        set({ sidebarStyle });
      },

      getResolvedMode: () => {
        const mode = get().mode;
        if (mode === 'system') return getSystemTheme();
        return mode;
      },

      applyTheme: () => {
        const state = get();
        const resolved = state.mode === 'system' ? getSystemTheme() : state.mode;
        const root = document.documentElement;

        // Apply dark/light class
        if (resolved === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }

        // Apply background color if any
        if (state.backgroundColor) {
          root.style.setProperty('--color-background', state.backgroundColor);
        } else {
          root.style.removeProperty('--color-background');
        }

        // Toggle custom background class
        if (state.backgroundColor || state.backgroundImage) {
          root.classList.add('has-custom-bg');
        } else {
          root.classList.remove('has-custom-bg');
        }

        // Apply font sizes
        const sizes = FONT_SIZE_MAP[state.fontSize];
        root.style.setProperty('--font-size-base', sizes.base);
        root.style.setProperty('--font-size-sm', sizes.sm);
        root.style.setProperty('--font-size-lg', sizes.lg);
        root.style.setProperty('--font-size-xl', sizes.xl);
        root.style.setProperty('--font-size-2xl', sizes['2xl']);
        root.style.setProperty('--font-size-3xl', sizes['3xl']);

        // Apply primary color and derivatives
        root.style.setProperty('--color-primary', state.primaryColor);
        root.style.setProperty('--color-primary-light', adjustColor(state.primaryColor, 20));
        root.style.setProperty('--color-primary-dark', adjustColor(state.primaryColor, -20));
      },
    }),
    {
      name: 'salesapp-theme',
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            setTimeout(() => state.applyTheme(), 0);
          }
        };
      },
    }
  )
);

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
