import {
  GoogleSignin,
  isCancelledResponse,
} from '@react-native-google-signin/google-signin';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut as signOutFirebase,
  updateProfile,
  type User,
} from 'firebase/auth';
import Constants from 'expo-constants';
import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import {
  getCreateAccountErrorMessage,
  getEmailSignInErrorMessage,
  readAuthErrorCode,
  readGoogleAuthConfig,
  readGoogleIdToken,
} from '@/data/auth';
import {
  claimBantayPairingCode as claimStoreBantayPairingCode,
  createBantayPairingCode as createStoreBantayPairingCode,
  type BantayPairingCode,
} from '@/data/bantay-pairing-repository';
import { firebaseAuth } from '@/data/firebase';
import {
  hydrateStoreProducts,
  pushPendingSyncMutations,
  subscribeToStoreProducts,
} from '@/data/cloud-product-repository';
import {
  countPendingSyncMutations,
  markStoreHydrated,
  migrateLegacyStorePrices,
  readStoreContext,
  saveStoreContext,
} from '@/data/local-sync-repository';
import {
  createStoreForOwner,
  findStoreForUser,
  removeBantay as removeStoreBantay,
  subscribeToStoreRecord,
} from '@/data/store-repository';
import type { StoreMembership } from '@/data/store-sync';

const googleAuthConfig = readGoogleAuthConfig({
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
    (typeof Constants.expoConfig?.extra?.googleWebClientId === 'string'
      ? Constants.expoConfig.extra.googleWebClientId
      : undefined),
});

type AuthContextValue = {
  user: User | null;
  membership: StoreMembership | null;
  bantayUids: string[];
  isReady: boolean;
  isStoreReady: boolean;
  isCreatingAccount: boolean;
  isCreatingStore: boolean;
  isSigningIn: boolean;
  isDeletingAccount: boolean;
  syncStatus: 'idle' | 'syncing' | 'offline' | 'error';
  pendingSyncCount: number;
  syncRevision: number;
  storeLookupError: boolean;
  error: string | null;
  clearError: () => void;
  createAccount: (displayName: string, email: string, password: string) => Promise<void>;
  createOwnerStore: (storeName: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  syncNow: () => Promise<void>;
  createBantayPairingCode: () => Promise<BantayPairingCode>;
  claimBantayPairingCode: (payload: string) => Promise<void>;
  refreshMembership: () => Promise<StoreMembership | null>;
  retryStoreLookup: () => Promise<void>;
  removeBantay: (userId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [user, setUser] = useState<User | null>(firebaseAuth?.currentUser ?? null);
  const [membership, setMembership] = useState<StoreMembership | null>(null);
  const [bantayUids, setBantayUids] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(firebaseAuth === null);
  const [isStoreReady, setIsStoreReady] = useState(firebaseAuth === null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [syncStatus, setSyncStatus] = useState<AuthContextValue['syncStatus']>('idle');
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncRevision, setSyncRevision] = useState(0);
  const [storeLookupError, setStoreLookupError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncing = useRef(false);

  useEffect(() => {
    if (!firebaseAuth) return;
    return onAuthStateChanged(firebaseAuth, (nextUser) => {
      if (nextUser) {
        setIsStoreReady(false);
      } else {
        setMembership(null);
        setBantayUids([]);
        setPendingSyncCount(0);
        setSyncStatus('idle');
        setStoreLookupError(false);
        setIsStoreReady(true);
      }
      setUser(nextUser);
      setIsReady(true);
    });
  }, []);

  const syncNow = useCallback(async () => {
    if (!user || !membership || syncing.current) return;
    syncing.current = true;
    setSyncStatus('syncing');
    try {
      const currentStore = await findStoreForUser(user.uid);
      if (!currentStore) {
        setMembership(null);
        setBantayUids([]);
        setSyncStatus('error');
        return;
      }
      await saveStoreContext(db, user.uid, currentStore.membership);
      setMembership((current) =>
        current?.storeId === currentStore.membership.storeId
        && current.role === currentStore.membership.role
        && current.name === currentStore.membership.name
          ? current
          : currentStore.membership,
      );
      setBantayUids(currentStore.bantayUids);
      const activeStoreId = currentStore.membership.storeId;
      await pushPendingSyncMutations(db, activeStoreId);
      await hydrateStoreProducts(db, activeStoreId);
      await markStoreHydrated(db, user.uid);
      setPendingSyncCount(await countPendingSyncMutations(db, activeStoreId));
      setSyncRevision((current) => current + 1);
      setSyncStatus('idle');
    } catch {
      setPendingSyncCount(await countPendingSyncMutations(db, membership.storeId));
      setSyncStatus('offline');
    } finally {
      syncing.current = false;
    }
  }, [db, membership, user]);

  useEffect(() => {
    let active = true;
    if (!user) return;

    void (async () => {
      setStoreLookupError(false);
      const localMembership = await readStoreContext(db, user.uid).catch(() => null);
      if (active && localMembership) {
        setMembership(localMembership);
        setPendingSyncCount(await countPendingSyncMutations(db, localMembership.storeId));
        setIsStoreReady(true);
      }

      try {
        const record = await findStoreForUser(user.uid);
        if (!active) return;
        if (!record) {
          if (!localMembership) {
            setMembership(null);
            setBantayUids([]);
            setSyncStatus('idle');
          }
          setIsStoreReady(true);
          return;
        }
        await saveStoreContext(db, user.uid, record.membership);
        if (record.membership.role === 'owner') {
          await migrateLegacyStorePrices(db, record.membership.storeId, user.uid);
        }
        setMembership(record.membership);
        setBantayUids(record.bantayUids);
        setIsStoreReady(true);
      } catch {
        if (!active) return;
        setStoreLookupError(!localMembership);
        setSyncStatus(localMembership ? 'offline' : 'error');
        setIsStoreReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [db, user]);

  useEffect(() => {
    if (!membership || !user) return;
    let active = true;
    const storeId = membership.storeId;

    const unsubscribeStore = subscribeToStoreRecord(
      storeId,
      user.uid,
      (source) => {
        if (active && source === 'sqlite' && !syncing.current) setSyncStatus('offline');
      },
      (record) => {
        if (!active) return;
        if (!record) {
          setSyncStatus('error');
          return;
        }
        void saveStoreContext(db, user.uid, record.membership).then(() => {
          if (!active) return;
          setMembership((current) =>
            current?.storeId === record.membership.storeId
            && current.role === record.membership.role
            && current.name === record.membership.name
              ? current
              : record.membership,
          );
          setBantayUids(record.bantayUids);
        });
      },
      () => {
        if (active) setSyncStatus('error');
      },
    );

    const unsubscribeProducts = subscribeToStoreProducts(db, storeId, {
      onError: () => {
        if (active) setSyncStatus('error');
      },
      onSnapshotSource: (source) => {
        if (!active) return;
        if (source === 'sqlite' && !syncing.current) setSyncStatus('offline');
        if (source === 'pending' || source === 'server') setSyncStatus('syncing');
      },
      onSynchronized: async () => {
        if (!active) return;
        setSyncRevision((current) => current + 1);
        if (syncing.current) return;
        syncing.current = true;
        setSyncStatus('syncing');
        try {
          await pushPendingSyncMutations(db, storeId);
          await markStoreHydrated(db, user.uid);
          if (!active) return;
          setPendingSyncCount(await countPendingSyncMutations(db, storeId));
          setSyncRevision((current) => current + 1);
          setSyncStatus('idle');
        } catch {
          if (active) setSyncStatus('offline');
        } finally {
          syncing.current = false;
        }
      },
    });

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncNow();
    });
    return () => {
      active = false;
      unsubscribeStore();
      unsubscribeProducts();
      subscription.remove();
    };
  }, [db, membership, syncNow, user]);

  const clearError = useCallback(() => setError(null), []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    if (!firebaseAuth) {
      setError('Firebase is not configured for this build.');
      return;
    }

    setIsSigningIn(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (signInError) {
      setError(getEmailSignInErrorMessage(signInError));
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const createAccount = useCallback(
    async (displayName: string, email: string, password: string) => {
      setError(null);
      if (!firebaseAuth) {
        setError('Firebase is not configured for this build.');
        return;
      }

      setIsCreatingAccount(true);
      try {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        await updateProfile(credential.user, { displayName }).catch(() => null);
      } catch (createError) {
        setError(getCreateAccountErrorMessage(createError));
      } finally {
        setIsCreatingAccount(false);
      }
    },
    [],
  );

  const createOwnerStore = useCallback(async (storeName: string) => {
    if (!user) throw new Error('Sign in before creating a store.');
    setError(null);
    setIsCreatingStore(true);
    try {
      const record = await createStoreForOwner(user.uid, storeName);
      await saveStoreContext(db, user.uid, record.membership);
      await migrateLegacyStorePrices(db, record.membership.storeId, user.uid);
      setMembership(record.membership);
      setBantayUids(record.bantayUids);
      setStoreLookupError(false);
      setSyncStatus('idle');
    } catch (storeError) {
      const message = storeError instanceof Error ? storeError.message : '';
      setError(message || 'Bantay could not create your store. Try again.');
      throw storeError;
    } finally {
      setIsCreatingStore(false);
    }
  }, [db, user]);

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

  const deleteAccount = useCallback(async () => {
    setError(null);
    const currentUser = firebaseAuth?.currentUser;
    if (!currentUser) {
      setError('No signed-in account is available to delete.');
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteUser(currentUser);
      await GoogleSignin.signOut().catch(() => null);
    } catch (deleteError) {
      setError(
        readAuthErrorCode(deleteError) === 'auth/requires-recent-login'
          ? 'For security, sign out and sign in again before deleting this account.'
          : 'Bantay could not delete this account. Try again.',
      );
    } finally {
      setIsDeletingAccount(false);
    }
  }, []);

  const refreshMembership = useCallback(async () => {
    if (!user) return null;
    const record = await findStoreForUser(user.uid);
    if (!record) throw new Error('Store access is no longer available.');
    await saveStoreContext(db, user.uid, record.membership);
    setMembership(record.membership);
    setBantayUids(record.bantayUids);
    setStoreLookupError(false);
    return record.membership;
  }, [db, user]);

  const retryStoreLookup = useCallback(async () => {
    if (!user) return;
    setStoreLookupError(false);
    setIsStoreReady(false);
    try {
      const record = await findStoreForUser(user.uid);
      if (!record) {
        setMembership(null);
        setBantayUids([]);
        return;
      }
      await saveStoreContext(db, user.uid, record.membership);
      setMembership(record.membership);
      setBantayUids(record.bantayUids);
    } catch (lookupError) {
      setStoreLookupError(true);
      throw lookupError;
    } finally {
      setIsStoreReady(true);
    }
  }, [db, user]);

  const createBantayPairingCode = useCallback(async () => {
    if (!user) throw new Error('Sign in before creating a pairing code.');
    return createStoreBantayPairingCode(user.uid);
  }, [user]);

  const claimBantayPairingCode = useCallback(async (payload: string) => {
    if (!user || membership?.role !== 'owner') {
      throw new Error('Only the store owner can link bantays.');
    }
    await claimStoreBantayPairingCode(membership.storeId, user.uid, payload);
    await refreshMembership();
  }, [membership, refreshMembership, user]);

  const removeBantay = useCallback(async (userId: string) => {
    if (membership?.role !== 'owner') throw new Error('Only the store owner can remove bantays.');
    await removeStoreBantay(membership.storeId, userId);
    await refreshMembership();
  }, [membership, refreshMembership]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      membership,
      bantayUids,
      isReady,
      isStoreReady,
      isCreatingAccount,
      isCreatingStore,
      isSigningIn,
      isDeletingAccount,
      syncStatus,
      pendingSyncCount,
      syncRevision,
      storeLookupError,
      error,
      clearError,
      createAccount,
      createOwnerStore,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      deleteAccount,
      syncNow,
      createBantayPairingCode,
      claimBantayPairingCode,
      refreshMembership,
      retryStoreLookup,
      removeBantay,
    }),
    [
      bantayUids,
      claimBantayPairingCode,
      clearError,
      createAccount,
      createOwnerStore,
      createBantayPairingCode,
      deleteAccount,
      error,
      isDeletingAccount,
      isCreatingAccount,
      isCreatingStore,
      isReady,
      isStoreReady,
      isSigningIn,
      membership,
      pendingSyncCount,
      refreshMembership,
      retryStoreLookup,
      removeBantay,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      syncNow,
      syncRevision,
      syncStatus,
      storeLookupError,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
