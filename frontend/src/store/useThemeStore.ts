import { create } from 'zustand';

interface ThemeState {
  theme: string;
  setTheme: (newTheme: string) => void;
}

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('theme-preference') || 'dark';
  }

  return 'dark';
};

const applyTheme = (theme: string) => {
  const root = document.documentElement;

  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    const systemPrefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

    root.classList.add(
      systemPrefersDark ? 'dark' : 'light'
    );
  } else {
    root.classList.add(theme);
  }
};

export const useThemeStore = create<ThemeState>((set) => {
  const initialTheme = getInitialTheme();

  // Initial theme ko immediately apply karo
  if (typeof window !== 'undefined') {
    applyTheme(initialTheme);
  }

  return {
    theme: initialTheme,

    setTheme: (newTheme: string) => {
      set({ theme: newTheme });

      localStorage.setItem(
        'theme-preference',
        newTheme
      );

      applyTheme(newTheme);
    },
  };
});