import { describe, expect, it } from 'vitest';

import { resolveDarkMode, sanitizeThemePreference } from '@/theme/theme-preference';

describe('resolveDarkMode', () => {
  it('uses the selected appearance instead of the system setting', () => {
    expect(resolveDarkMode('light', true)).toBe(false);
    expect(resolveDarkMode('dark', false)).toBe(true);
    expect(resolveDarkMode('system', true)).toBe(true);
  });
});

describe('sanitizeThemePreference', () => {
  it('falls back to system for unknown stored values', () => {
    expect(sanitizeThemePreference('dark')).toBe('dark');
    expect(sanitizeThemePreference('unexpected')).toBe('system');
    expect(sanitizeThemePreference(null)).toBe('system');
  });
});
