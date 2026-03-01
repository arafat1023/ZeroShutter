import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.classList.toggle('light', resolved === 'light');
  localStorage.setItem('zeroshutter-theme', theme);
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem('zeroshutter-theme') as Theme) || 'dark',
  setTheme: (theme) => {
    set({ theme });
    applyTheme(theme);
  },
}));

export function initTheme() {
  const store = useThemeStore.getState();
  applyTheme(store.theme);

  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', () => {
    const { theme } = useThemeStore.getState();
    if (theme === 'system') applyTheme('system');
  });
}
