import { useSQLiteContext } from 'expo-sqlite';
import { createContext, type PropsWithChildren, use, useCallback, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { readThemePreference, writeThemePreference } from '@/data/settings-repository';
import { getAppTheme, type AppTheme } from '@/theme/theme';
import { resolveDarkMode, type ThemePreference } from '@/theme/theme-preference';

type ThemeContextValue = AppTheme & {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const colorScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    let active = true;
    void readThemePreference(db).then((storedPreference) => {
      if (active) setPreferenceState(storedPreference);
    });
    return () => {
      active = false;
    };
  }, [db]);

  const setPreference = useCallback(async (nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    await writeThemePreference(db, nextPreference);
  }, [db]);
  const isDark = resolveDarkMode(preference, colorScheme === 'dark');
  const value = useMemo<ThemeContextValue>(
    () => ({ ...getAppTheme(isDark), preference, setPreference }),
    [isDark, preference, setPreference],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useAppTheme(): ThemeContextValue {
  const theme = use(ThemeContext);
  if (!theme) {
    throw new Error('useAppTheme must be used inside AppThemeProvider.');
  }
  return theme;
}
