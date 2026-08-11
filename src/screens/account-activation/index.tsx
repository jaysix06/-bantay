import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-provider';
import { AppButton } from '@/components/app-button';
import {
  watchBantayPairingClaim,
  type BantayPairingCode,
} from '@/data/bantay-pairing-repository';
import { cleanStoreName } from '@/data/account-activation';
import { useAppTheme } from '@/theme/theme-provider';

type ActivationPath = 'choose' | 'owner' | 'join';

export function AccountActivationScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const {
    clearError,
    createBantayPairingCode,
    createOwnerStore,
    error,
    isCreatingStore,
    refreshMembership,
    signOut,
    user,
  } = useAuth();
  const [path, setPath] = useState<ActivationPath>('choose');
  const [storeName, setStoreName] = useState('');
  const [pairingCode, setPairingCode] = useState<BantayPairingCode | null>(null);
  const [pairingBusy, setPairingBusy] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);

  const showPath = (nextPath: ActivationPath) => {
    clearError();
    setPairingError(null);
    setPath(nextPath);
  };

  const createPairingCode = () => {
    setPairingBusy(true);
    setPairingCode(null);
    setPairingError(null);
    void createBantayPairingCode()
      .then(setPairingCode)
      .catch(() => setPairingError('Connect to the internet and try creating a new code.'))
      .finally(() => setPairingBusy(false));
  };

  useEffect(() => {
    if (path !== 'join' || !pairingCode || !user) return;
    let active = true;
    const unsubscribe = watchBantayPairingClaim(
      pairingCode.token,
      user.uid,
      () => {
        setPairingBusy(true);
        void refreshMembership()
          .catch(() => {
            if (active) setPairingError('Linked successfully. Reconnect to finish loading the store.');
          })
          .finally(() => {
            if (active) setPairingBusy(false);
          });
      },
      () => {
        if (active) setPairingError('Bantay could not watch this code. Check your connection and try again.');
      },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [pairingCode, path, refreshMembership, user]);

  const createStore = () => {
    const cleaned = cleanStoreName(storeName);
    if (!cleaned) return;
    void createOwnerStore(cleaned).catch(() => undefined);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          {path !== 'choose' ? (
            <Pressable
              accessibilityLabel="Back to account choices"
              accessibilityRole="button"
              onPress={() => showPath('choose')}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color={theme.colors.text} />
              <Text style={[styles.backText, { color: theme.colors.text }]}>Back</Text>
            </Pressable>
          ) : <View />}
          <Pressable
            accessibilityRole="button"
            onPress={() => void signOut()}
            style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
          >
            <Text style={[styles.signOutText, { color: theme.colors.textMuted }]}>Sign out</Text>
          </Pressable>
        </View>

        {path === 'choose' ? (
          <View style={styles.section}>
            <View style={styles.heading}>
              <View style={[styles.iconFrame, { backgroundColor: theme.colors.primary }]}>
                <MaterialCommunityIcons name="store-marker-outline" size={32} color={theme.colors.onPrimary} />
              </View>
              <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
                How will you use Bantay?
              </Text>
              <Text style={[styles.body, { color: theme.colors.textMuted }]}>
                Choose what you need today. No role is assigned until you finish one of these paths.
              </Text>
            </View>

            <View style={styles.choices}>
              <Choice
                body="Add products, set trusted prices, and link the family members who watch your store."
                icon="store-plus-outline"
                label="OWNER"
                onPress={() => showPath('owner')}
                title="Set up my store"
              />
              <Choice
                body="Join an existing family store to scan products and check owner-set prices."
                icon="account-group-outline"
                label="BANTAY"
                onPress={() => {
                  showPath('join');
                  createPairingCode();
                }}
                title="Join a family store"
              />
            </View>
          </View>
        ) : null}

        {path === 'owner' ? (
          <View style={styles.section}>
            <View style={styles.heading}>
              <View style={[styles.iconFrame, { backgroundColor: theme.colors.primary }]}>
                <MaterialCommunityIcons name="store-plus-outline" size={32} color={theme.colors.onPrimary} />
              </View>
              <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>Name your store</Text>
              <Text style={[styles.body, { color: theme.colors.textMuted }]}>
                You will control its products and prices. You can link Bantays after setup.
              </Text>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Store name</Text>
              <TextInput
                accessibilityLabel="Store name"
                autoCapitalize="words"
                autoFocus
                editable={!isCreatingStore}
                maxLength={80}
                onChangeText={(value) => {
                  setStoreName(value);
                  if (error) clearError();
                }}
                onSubmitEditing={createStore}
                placeholder="e.g. Santos Sari-Sari Store"
                placeholderTextColor={theme.colors.textMuted}
                returnKeyType="done"
                style={[
                  styles.input,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text },
                ]}
                value={storeName}
              />
            </View>
            {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
            <AppButton
              disabled={!cleanStoreName(storeName) || isCreatingStore}
              label={isCreatingStore ? 'Creating store…' : 'Create my store'}
              onPress={createStore}
            />
          </View>
        ) : null}

        {path === 'join' ? (
          <View style={styles.section}>
            <View style={styles.heading}>
              <View style={[styles.iconFrame, { backgroundColor: theme.colors.primary }]}>
                <MaterialCommunityIcons name="qrcode" size={32} color={theme.colors.onPrimary} />
              </View>
              <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>Show this code to the owner</Text>
              <Text style={[styles.body, { color: theme.colors.textMuted }]}>
                On the owner’s phone, open Profile, Manage Bantays, then Scan Bantay QR.
              </Text>
            </View>
            <View accessibilityLabel="Temporary Bantay pairing QR code" style={[styles.qrSurface, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              {pairingCode ? (
                <QRCode value={pairingCode.payload} size={220} color="#1E0E06" backgroundColor="#FFFFFF" />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <MaterialCommunityIcons name={pairingError ? 'wifi-alert' : 'qrcode'} size={54} color={pairingError ? theme.colors.error : theme.colors.textMuted} />
                  <Text accessibilityRole={pairingError ? 'alert' : undefined} style={[styles.qrStatus, { color: pairingError ? theme.colors.error : theme.colors.textMuted }]}>
                    {pairingError ?? 'Creating secure code…'}
                  </Text>
                </View>
              )}
            </View>
            {pairingCode ? (
              <Text style={[styles.expiry, { color: theme.colors.textMuted }]}>
                Expires at {pairingCode.expiresAt.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}
              </Text>
            ) : null}
            <AppButton
              disabled={pairingBusy}
              label={pairingBusy ? 'Creating code…' : pairingError ? 'Try again' : 'Create a new code'}
              onPress={createPairingCode}
              variant="secondary"
            />
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Choice({ body, icon, label, onPress, title }: {
  body: string;
  icon: 'store-plus-outline' | 'account-group-outline';
  label: string;
  onPress: () => void;
  title: string;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityLabel={`${title}. ${body}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.choiceIcon, { backgroundColor: theme.colors.surfaceMuted }]}>
        <MaterialCommunityIcons name={icon} size={27} color={theme.colors.navigationActive} />
      </View>
      <View style={styles.choiceCopy}>
        <Text style={[styles.choiceLabel, { color: theme.colors.navigationActive }]}>{label}</Text>
        <Text style={[styles.choiceTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.choiceBody, { color: theme.colors.textMuted }]}>{body}</Text>
      </View>
      <MaterialCommunityIcons name="arrow-right" size={24} color={theme.colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', gap: 28, paddingHorizontal: 22 },
  topBar: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { fontFamily: 'Montserrat_700Bold', fontSize: 14 },
  signOut: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 8 },
  signOutText: { fontFamily: 'Montserrat_700Bold', fontSize: 13 },
  section: { flex: 1, justifyContent: 'center', gap: 24, paddingBottom: 36 },
  heading: { gap: 10 },
  iconFrame: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 18, marginBottom: 4 },
  title: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 29, lineHeight: 36, letterSpacing: -0.5 },
  body: { fontFamily: 'Montserrat_500Medium', fontSize: 15, lineHeight: 23 },
  choices: { gap: 14 },
  choice: { minHeight: 146, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 20, padding: 18 },
  choiceIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  choiceCopy: { flex: 1, gap: 4 },
  choiceLabel: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 10, letterSpacing: 1.1 },
  choiceTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 18, lineHeight: 23 },
  choiceBody: { fontFamily: 'Montserrat_500Medium', fontSize: 12, lineHeight: 18 },
  fieldGroup: { gap: 8 },
  label: { fontFamily: 'Montserrat_700Bold', fontSize: 13 },
  input: { minHeight: 56, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, fontFamily: 'Montserrat_500Medium', fontSize: 15 },
  error: { fontFamily: 'Montserrat_600SemiBold', fontSize: 12, lineHeight: 18 },
  qrSurface: { minHeight: 270, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 20, padding: 24 },
  qrPlaceholder: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 12 },
  qrStatus: { maxWidth: 260, fontFamily: 'Montserrat_600SemiBold', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  expiry: { fontFamily: 'Montserrat_500Medium', fontSize: 12, textAlign: 'center' },
  pressed: { opacity: 0.7 },
});
