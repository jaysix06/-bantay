import type { SQLiteDatabase } from 'expo-sqlite';

import {
  sanitizeOnboardingPreference,
  type OnboardingPreference,
} from '@/data/onboarding-preference';
import { sanitizeThemePreference, type ThemePreference } from '@/theme/theme-preference';

const THEME_KEY = 'theme_preference';
const ONBOARDING_KEY = 'onboarding_preference';

export async function readOnboardingPreference(
  db: SQLiteDatabase,
): Promise<OnboardingPreference> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    ONBOARDING_KEY,
  );
  return sanitizeOnboardingPreference(row?.value ?? null);
}

export async function writeOnboardingPreference(
  db: SQLiteDatabase,
  preference: Exclude<OnboardingPreference, 'pending'>,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ONBOARDING_KEY,
    preference,
  );
}

export async function readThemePreference(db: SQLiteDatabase): Promise<ThemePreference> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    THEME_KEY,
  );
  return sanitizeThemePreference(row?.value ?? null);
}

export async function writeThemePreference(
  db: SQLiteDatabase,
  preference: ThemePreference,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    THEME_KEY,
    preference,
  );
}
