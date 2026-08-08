import { createContext, type PropsWithChildren, use } from 'react';

import { useSystemTheme, type AppTheme } from '@/theme/theme';

const ThemeContext = createContext<AppTheme | null>(null);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const theme = useSystemTheme();
  return <ThemeContext value={theme}>{children}</ThemeContext>;
}

export function useAppTheme(): AppTheme {
  const theme = use(ThemeContext);
  if (!theme) {
    throw new Error('useAppTheme must be used inside AppThemeProvider.');
  }
  return theme;
}
