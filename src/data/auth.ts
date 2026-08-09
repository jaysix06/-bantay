type GoogleAuthEnvironment = {
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?: string;
};

type GoogleAuthConfig = {
  webClientId: string;
};

export function readGoogleAuthConfig(
  environment: GoogleAuthEnvironment,
): GoogleAuthConfig | null {
  const webClientId = environment.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  if (!webClientId?.endsWith('.apps.googleusercontent.com')) return null;
  return { webClientId };
}

export function readGoogleIdToken(response: unknown): string | null {
  if (typeof response !== 'object' || response === null) return null;
  const candidate = response as { type?: unknown; data?: unknown };
  if (candidate.type !== 'success' || typeof candidate.data !== 'object' || !candidate.data) {
    return null;
  }

  const token = (candidate.data as { idToken?: unknown }).idToken;
  if (typeof token !== 'string') return null;
  return token.trim() || null;
}
