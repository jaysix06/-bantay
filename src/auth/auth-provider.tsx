import {
  GoogleSignin,
  isCancelledResponse,
} from '@react-native-google-signin/google-signin';
import {
  GoogleAuthProvider,
  inMemoryPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithCredential,
  signOut as signOutFirebase,
  type User,
} from 'firebase/auth';
import Constants from 'expo-constants';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { readGoogleAuthConfig, readGoogleIdToken } from '@/data/auth';
import { firebaseAuth } from '@/data/firebase';

const googleAuthConfig = readGoogleAuthConfig({
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
    (typeof Constants.expoConfig?.extra?.googleWebClientId === 'string'
      ? Constants.expoConfig.extra.googleWebClientId
      : undefined),
});

type AuthContextValue = {
  user: User | null;
  isReady: boolean;
  isSigningIn: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(firebaseAuth?.currentUser ?? null);
  const [isReady, setIsReady] = useState(firebaseAuth === null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseAuth) return;
    return onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setIsReady(true);
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    if (!firebaseAuth) {
      setError('Firebase is not configured for this build.');
      return;
    }
    if (!googleAuthConfig) {
      setError('Google sign-in is not configured for this build.');
      return;
    }

    setIsSigningIn(true);
    try {
      GoogleSignin.configure({
        webClientId: googleAuthConfig.webClientId,
        offlineAccess: false,
      });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (isCancelledResponse(response)) return;

      const idToken = readGoogleIdToken(response);
      if (!idToken) {
        setError('Google did not return a valid sign-in token.');
        return;
      }

      await setPersistence(firebaseAuth, inMemoryPersistence);
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(firebaseAuth, credential);
    } catch {
      setError('Google sign-in could not be completed. Check your connection and try again.');
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    if (!firebaseAuth) return;
    await signOutFirebase(firebaseAuth);
    await GoogleSignin.signOut().catch(() => null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isReady, isSigningIn, error, signInWithGoogle, signOut }),
    [error, isReady, isSigningIn, signInWithGoogle, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
