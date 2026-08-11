export type OnboardingPreference = 'pending' | 'skipped' | 'completed';

export function sanitizeOnboardingPreference(value: unknown): OnboardingPreference {
  return value === 'skipped' || value === 'completed' ? value : 'pending';
}

export function hasCompletedOnboarding(preference: OnboardingPreference): boolean {
  return preference !== 'pending';
}
