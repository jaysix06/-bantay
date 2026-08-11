import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { useAuth } from '@/auth/auth-provider';
import { AppButton } from '@/components/app-button';
import { AppModal } from '@/components/app-modal';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { PairingSuccess } from '@/components/pairing-success';
import { SlideConfirmationModal } from '@/components/slide-confirmation-modal';
import {
  watchBantayPairingClaim,
  type BantayPairingCode,
} from '@/data/bantay-pairing-repository';
import { useAppTheme } from '@/theme/theme-provider';
import type { ThemePreference } from '@/theme/theme-preference';

const APPEARANCE_OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: 'theme-light-dark' | 'white-balance-sunny' | 'moon-waning-crescent';
}[] = [
  { value: 'system', label: 'System', icon: 'theme-light-dark' },
  { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
  { value: 'dark', label: 'Dark', icon: 'moon-waning-crescent' },
];

type OpenDialog = 'accountQr' | 'bantays' | 'delete' | 'signOut' | null;

export function ProfileScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const {
    bantayUids,
    createBantayPairingCode,
    deleteAccount,
    error,
    isDeletingAccount,
    membership,
    pendingSyncCount,
    refreshMembership,
    removeBantay,
    signOut,
    syncNow,
    syncStatus,
    user,
  } = useAuth();
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<BantayPairingCode | null>(null);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [pairingBusy, setPairingBusy] = useState(false);
  const [linkedStoreName, setLinkedStoreName] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberBusy, setMemberBusy] = useState(false);
  const photoUrl = user?.photoURL ?? null;
  const showGooglePhoto = Boolean(photoUrl && failedPhotoUrl !== photoUrl);
  const accountName = user?.displayName?.trim() || user?.email?.split('@')[0] || 'Bantay account';
  const accountInitial = (accountName[0] ?? user?.email?.[0] ?? 'B').toLocaleUpperCase('en-PH');

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
      setOpenDialog(null);
    }
  };

  const openPairingQr = () => {
    setPairingBusy(true);
    setPairingCode(null);
    setPairingError(null);
    setLinkedStoreName(null);
    setOpenDialog('accountQr');
    void createBantayPairingCode()
      .then(setPairingCode)
      .catch(() => setPairingError('Connect to the internet and try creating a new pairing code.'))
      .finally(() => setPairingBusy(false));
  };

  useEffect(() => {
    if (openDialog !== 'accountQr' || !pairingCode || !user) return;
    let active = true;
    const unsubscribe = watchBantayPairingClaim(
      pairingCode.token,
      user.uid,
      () => {
        setPairingBusy(true);
        void refreshMembership()
          .then((nextMembership) => {
            if (!active) return;
            if (nextMembership?.role !== 'bantay') {
              throw new Error('The linked store is not available yet.');
            }
            setLinkedStoreName(nextMembership.name);
            setPairingCode(null);
            setPairingError(null);
          })
          .catch(() => {
            if (active) setPairingError('Linked successfully, but this phone could not refresh the store yet.');
          })
          .finally(() => {
            if (active) setPairingBusy(false);
          });
      },
      () => {
        if (active) setPairingError('Could not watch this pairing code. Check your connection and try again.');
      },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [openDialog, pairingCode, refreshMembership, user]);

  const handleRemoveBantay = async (uid: string) => {
    setMemberBusy(true);
    setMemberError(null);
    try {
      await removeBantay(uid);
    } catch {
      setMemberError('Bantay could not remove that account. Try again.');
    } finally {
      setMemberBusy(false);
    }
  };

  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <View
          style={[
            styles.accountCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            {showGooglePhoto && photoUrl ? (
              <Image
                accessibilityLabel={`${accountName}'s Google profile photo`}
                onError={() => setFailedPhotoUrl(photoUrl)}
                source={{ uri: photoUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={[styles.avatarText, { color: theme.colors.onPrimary }]}>{accountInitial}</Text>
            )}
          </View>
          <View style={styles.accountCopy}>
            <Text numberOfLines={1} style={[styles.accountName, { color: theme.colors.text }]}>
              {accountName}
            </Text>
            {user?.email ? (
              <Text numberOfLines={1} style={[styles.accountEmail, { color: theme.colors.textMuted }]}>
                {user.email}
              </Text>
            ) : null}
            <Text style={[styles.role, { color: theme.colors.navigationActive }]}>
              {membership?.role === 'owner' ? 'STORE OWNER' : 'BANTAY'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Synchronization</Text>
            <Text style={[styles.sectionBody, { color: theme.colors.textMuted }]}>
              {syncStatus === 'syncing'
                ? 'Syncing local and cloud prices…'
                : syncStatus === 'offline'
                  ? `${pendingSyncCount} local change${pendingSyncCount === 1 ? '' : 's'} waiting for internet.`
                  : syncStatus === 'error'
                    ? 'Store synchronization needs attention.'
                    : pendingSyncCount > 0
                      ? `${pendingSyncCount} change${pendingSyncCount === 1 ? '' : 's'} waiting to sync.`
                      : 'Phone storage and Firestore are up to date.'}
            </Text>
          </View>
          {syncStatus === 'error' ? (
            <AppButton
              label="Retry synchronization"
              onPress={() => void syncNow()}
              variant="secondary"
            />
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Appearance</Text>
            <Text style={[styles.sectionBody, { color: theme.colors.textMuted }]}>
              Choose how Bantay looks on this device.
            </Text>
          </View>
          <View style={[styles.appearancePicker, { backgroundColor: theme.colors.surfaceMuted }]}>
            {APPEARANCE_OPTIONS.map((option) => {
              const selected = theme.preference === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => void theme.setPreference(option.value)}
                  style={[
                    styles.appearanceOption,
                    selected && {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={option.icon}
                    size={22}
                    color={selected ? theme.colors.navigationActive : theme.colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.appearanceLabel,
                      { color: selected ? theme.colors.text : theme.colors.textMuted },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Bantay pairing</Text>
            <Text style={[styles.sectionBody, { color: theme.colors.textMuted }]}>
              {"Show this account's temporary QR to the store owner. No account ID needs to be copied."}
            </Text>
          </View>
          <AppButton
            icon={<MaterialCommunityIcons name="qrcode" size={22} color={theme.colors.text} />}
            label="Show my Bantay QR"
            onPress={openPairingQr}
            variant="secondary"
          />
        </View>

        {membership?.role === 'owner' ? <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your Bantays</Text>
            <Text style={[styles.sectionBody, { color: theme.colors.textMuted }]}>
              {bantayUids.length === 0
                ? 'Invite sellers who can look up prices for this store.'
                : `${bantayUids.length} linked bantay${bantayUids.length === 1 ? '' : 's'} can look up this store's prices.`}
            </Text>
          </View>
          <AppButton
            icon={
              <MaterialCommunityIcons
                name="account-multiple-plus-outline"
                size={22}
                color={theme.colors.text}
              />
            }
            label={bantayUids.length > 0 ? `Manage Bantays (${bantayUids.length})` : 'Manage Bantays'}
            onPress={() => setOpenDialog('bantays')}
            variant="secondary"
          />
        </View> : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account</Text>
          <AppButton label="Sign out" onPress={() => setOpenDialog('signOut')} variant="secondary" />
          <Pressable
            accessibilityRole="button"
            disabled={isDeletingAccount}
            onPress={() => setOpenDialog('delete')}
            style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="delete-outline" size={21} color={theme.colors.error} />
            <Text style={[styles.deleteText, { color: theme.colors.error }]}>Delete account</Text>
          </Pressable>
          {error && openDialog !== 'delete' ? (
            <View accessibilityRole="alert" style={[styles.error, { backgroundColor: theme.colors.surfaceMuted }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color={theme.colors.error} />
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <ConfirmationModal
        confirmLabel="Sign out"
        description="You'll need your approved store account to access Bantay again."
        isConfirming={isSigningOut}
        onCancel={() => setOpenDialog(null)}
        onConfirm={() => void handleSignOut()}
        title="Sign out of Bantay?"
        visible={openDialog === 'signOut'}
      />

      <SlideConfirmationModal
        description="Your sign-in account will be permanently removed from Bantay. Prices saved on this device will remain here."
        error={error}
        isConfirming={isDeletingAccount}
        onCancel={() => setOpenDialog(null)}
        onConfirm={() => void deleteAccount()}
        slideLabel="Slide to delete"
        title="Delete Bantay account?"
        visible={openDialog === 'delete'}
        warning="This cannot be undone."
      />

      <AppModal
        description="Scan the temporary QR shown on the bantay's phone. Linked accounts can read this store's prices but cannot change them."
        icon={
          <MaterialCommunityIcons
            name="account-group-outline"
            size={25}
            color={theme.colors.navigationActive}
          />
        }
        onRequestClose={() => setOpenDialog(null)}
        title="Manage Bantays"
        visible={openDialog === 'bantays' && membership?.role === 'owner'}
      >
        <AppButton
          icon={<MaterialCommunityIcons name="qrcode-scan" size={22} color={theme.colors.onPrimary} />}
          label="Scan Bantay QR"
          onPress={() => {
            setOpenDialog(null);
            router.push('/pair-bantay');
          }}
        />
        {memberError ? (
          <Text accessibilityRole="alert" style={[styles.memberError, { color: theme.colors.error }]}>
            {memberError}
          </Text>
        ) : null}
        {bantayUids.length > 0 ? (
          <View style={styles.memberList}>
            {bantayUids.map((uid, index) => (
              <View key={uid} style={[styles.memberRow, { borderColor: theme.colors.border }]}>
                <View style={[styles.memberAvatar, { backgroundColor: theme.colors.surfaceMuted }]}>
                  <MaterialCommunityIcons name="account-outline" size={20} color={theme.colors.textMuted} />
                </View>
                <Text numberOfLines={1} style={[styles.memberUid, { color: theme.colors.text }]}>
                  Bantay {index + 1}
                </Text>
                <Pressable
                  accessibilityLabel={`Remove Bantay ${index + 1}`}
                  accessibilityRole="button"
                  disabled={memberBusy}
                  onPress={() => void handleRemoveBantay(uid)}
                  style={({ pressed }) => [styles.removeMember, pressed && styles.pressed]}
                >
                  <MaterialCommunityIcons name="account-minus-outline" size={21} color={theme.colors.error} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.sectionBody, { color: theme.colors.textMuted }]}>No bantay accounts linked yet.</Text>
        )}
      </AppModal>

      <AppModal
        description={linkedStoreName
          ? 'Your role and local store data have been updated automatically.'
          : 'Ask the store owner to scan this code. It expires after five minutes and can be used only once.'}
        icon={<MaterialCommunityIcons name="qrcode" size={25} color={theme.colors.navigationActive} />}
        onRequestClose={() => setOpenDialog(null)}
        title="My Bantay QR"
        visible={openDialog === 'accountQr'}
      >
        {linkedStoreName ? (
          <PairingSuccess
            body={`You can now view ${linkedStoreName}'s products and prices on this phone.`}
            compact
            title="You're linked"
          >
            <AppButton label="Continue as Bantay" onPress={() => setOpenDialog(null)} />
          </PairingSuccess>
        ) : (
          <>
        <View style={styles.qrArea} accessibilityLabel="Temporary Bantay pairing QR code">
          {pairingCode ? (
            <QRCode value={pairingCode.payload} size={220} color="#1E0E06" backgroundColor="#FFFFFF" />
          ) : (
            <View style={[styles.qrPlaceholder, { backgroundColor: theme.colors.surfaceMuted }]}>
              <MaterialCommunityIcons
                name={pairingError ? 'wifi-alert' : 'qrcode'}
                size={52}
                color={pairingError ? theme.colors.error : theme.colors.textMuted}
              />
              <Text
                accessibilityRole={pairingError ? 'alert' : undefined}
                style={[styles.qrStatus, { color: pairingError ? theme.colors.error : theme.colors.textMuted }]}
              >
                {pairingError ?? (pairingBusy ? 'Creating secure code…' : 'Preparing code…')}
              </Text>
            </View>
          )}
        </View>
        {pairingCode ? (
          <Text style={[styles.qrExpiry, { color: theme.colors.textMuted }]}>
            Expires at{' '}
            {pairingCode.expiresAt.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}
          </Text>
        ) : null}
        {pairingCode ? <AppButton label="Create a new code" variant="secondary" onPress={openPairingQr} /> : null}
        {pairingError ? (
          <AppButton
            label="Try again"
            onPress={openPairingQr}
          />
        ) : null}
          </>
        )}
      </AppModal>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    gap: 30,
    padding: 20,
    paddingBottom: 140,
  },
  accountCard: {
    minHeight: 94,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: 16,
  },
  avatar: {
    width: 58,
    height: 58,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarText: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 21 },
  accountCopy: { flex: 1, gap: 4 },
  accountName: { fontFamily: 'Montserrat_700Bold', fontSize: 15 },
  accountEmail: { fontFamily: 'Montserrat_500Medium', fontSize: 12 },
  role: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 10, letterSpacing: 1.1 },
  section: { gap: 14 },
  sectionHeading: { gap: 5 },
  sectionTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 19 },
  sectionBody: { fontFamily: 'Montserrat_500Medium', fontSize: 13, lineHeight: 20 },
  appearancePicker: { flexDirection: 'row', gap: 6, borderRadius: 18, padding: 5 },
  appearanceOption: {
    flex: 1,
    minHeight: 66,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 14,
  },
  appearanceLabel: { fontFamily: 'Montserrat_600SemiBold', fontSize: 11 },
  deleteButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteText: { fontFamily: 'Montserrat_700Bold', fontSize: 14 },
  error: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, padding: 12 },
  errorText: { flex: 1, fontFamily: 'Montserrat_600SemiBold', fontSize: 12, lineHeight: 18 },
  memberError: { fontFamily: 'Montserrat_600SemiBold', fontSize: 12, lineHeight: 18 },
  memberList: { gap: 8, paddingTop: 4 },
  memberRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingLeft: 14, paddingRight: 6 },
  memberUid: { flex: 1, fontFamily: 'Montserrat_500Medium', fontSize: 12 },
  memberAvatar: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  removeMember: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  qrArea: { alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#FFFFFF', padding: 18 },
  qrPlaceholder: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 12, padding: 20 },
  qrStatus: { fontFamily: 'Montserrat_600SemiBold', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  qrExpiry: { fontFamily: 'Montserrat_600SemiBold', fontSize: 12, textAlign: 'center' },
  pressed: { opacity: 0.7 },
});
