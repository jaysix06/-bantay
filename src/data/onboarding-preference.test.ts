import { describe, expect, it } from 'vitest';

import { hasCompletedOnboarding, sanitizeOnboardingPreference } from './onboarding-preference';

describe('onboarding preference', () => {
  it('treats a missing or malformed preference as a fresh launch', () => {
    expect(sanitizeOnboardingPreference(null)).toBe('pending');
    expect(sanitizeOnboardingPreference('unknown')).toBe('pending');
    expect(hasCompletedOnboarding('pending')).toBe(false);
  });

  it('remembers both skipped and completed onboarding', () => {
    expect(sanitizeOnboardingPreference('skipped')).toBe('skipped');
    expect(sanitizeOnboardingPreference('completed')).toBe('completed');
    expect(hasCompletedOnboarding('skipped')).toBe(true);
    expect(hasCompletedOnboarding('completed')).toBe(true);
  });
});
