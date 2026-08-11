export type AccountGate = 'loading' | 'auth' | 'activation' | 'store-error' | 'app';

export function resolveAccountGate(state: {
  isReady: boolean;
  isStoreReady: boolean;
  signedIn: boolean;
  hasMembership: boolean;
  hasStoreError?: boolean;
}): AccountGate {
  if (!state.isReady || (state.signedIn && !state.isStoreReady)) return 'loading';
  if (!state.signedIn) return 'auth';
  if (state.hasStoreError && !state.hasMembership) return 'store-error';
  return state.hasMembership ? 'app' : 'activation';
}

export function cleanStoreName(value: string): string | null {
  const cleaned = value.trim().slice(0, 80);
  return cleaned || null;
}
