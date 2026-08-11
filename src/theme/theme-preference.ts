export type ThemePreference = 'system' | 'light' | 'dark';

export function sanitizeThemePreference(value: string | null): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function resolveDarkMode(preference: ThemePreference, systemIsDark: boolean): boolean {
  if (preference === 'dark') return true;
  if (preference === 'light') return false;
  return systemIsDark;
}
