import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/auth/auth-provider';
import { validateEmailSignIn } from '@/data/auth';
import { useAppTheme } from '@/theme/theme-provider';
import { AppButton } from './app-button';
import { AppModal } from './app-modal';

type FocusedField = 'email' | 'password' | null;
type FieldErrors = { email?: string; password?: string };

export function EmailLoginModal({ onClose, visible }: { onClose: () => void; visible: boolean }) {
  const theme = useAppTheme();
  const scrollView = useRef<ScrollView>(null);
  const emailInput = useRef<TextInput>(null);
  const passwordInput = useRef<TextInput>(null);
  const { clearError, error, isSigningIn, signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const updateEmail = (value: string) => {
    setEmail(value);
    if (fieldErrors.email) setFieldErrors((current) => ({ ...current, email: undefined }));
    if (error) clearError();
  };

  const updatePassword = (value: string) => {
    setPassword(value);
    if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: undefined }));
    if (error) clearError();
  };

  const handleSignIn = () => {
    const validation = validateEmailSignIn(email, password);
    setFieldErrors(validation.errors);
    if (!validation.credentials) return;
    void signInWithEmail(validation.credentials.email, validation.credentials.password);
  };

  const close = () => {
    if (isSigningIn) return;
    if (error) clearError();
    setFieldErrors({});
    setFocusedField(null);
    setPassword('');
    setShowPassword(false);
    onClose();
  };

  const focusField = (field: Exclude<FocusedField, null>, input: TextInput | null) => {
    setFocusedField(field);
    if (input) {
      scrollView.current?.scrollResponderScrollNativeHandleToKeyboard(input, 24, true);
    }
  };

  const fieldStyle = (field: Exclude<FocusedField, null>, hasError: boolean) => [
    styles.inputFrame,
    {
      backgroundColor: theme.colors.background,
      borderColor: hasError
        ? theme.colors.error
        : focusedField === field
          ? theme.colors.navigationActive
          : theme.colors.border,
    },
  ];

  return (
    <AppModal
      animationType="slide"
      bodyScrollRef={scrollView}
      description="Use the email and password connected to your store."
      dismissible={!isSigningIn}
      icon={<MaterialCommunityIcons name="email-outline" size={25} color={theme.colors.navigationActive} />}
      onRequestClose={close}
      title="Sign in with email"
      visible={visible}
    >
      <View style={styles.fields}>
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Email</Text>
          <View style={fieldStyle('email', Boolean(fieldErrors.email))}>
            <MaterialCommunityIcons name="email-outline" size={20} color={theme.colors.textMuted} />
            <TextInput
              ref={emailInput}
              accessibilityHint={fieldErrors.email ?? 'Enter your store account email address'}
              accessibilityLabel="Email"
              autoCapitalize="none"
              autoComplete="email"
              autoFocus={visible}
              editable={!isSigningIn}
              keyboardType="email-address"
              onBlur={() => setFocusedField(null)}
              onChangeText={updateEmail}
              onFocus={() => focusField('email', emailInput.current)}
              onSubmitEditing={() => passwordInput.current?.focus()}
              placeholder="you@example.com"
              placeholderTextColor={theme.colors.textMuted}
              returnKeyType="next"
              selectionColor={theme.colors.navigationActive}
              style={[styles.input, { color: theme.colors.text }]}
              textContentType="emailAddress"
              value={email}
            />
          </View>
          {fieldErrors.email ? (
            <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={[styles.fieldError, { color: theme.colors.error }]}>
              {fieldErrors.email}
            </Text>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Password</Text>
          <View style={fieldStyle('password', Boolean(fieldErrors.password))}>
            <MaterialCommunityIcons name="lock-outline" size={20} color={theme.colors.textMuted} />
            <TextInput
              ref={passwordInput}
              accessibilityHint={fieldErrors.password ?? 'Enter your store account password'}
              accessibilityLabel="Password"
              autoCapitalize="none"
              autoComplete="current-password"
              editable={!isSigningIn}
              onBlur={() => setFocusedField(null)}
              onChangeText={updatePassword}
              onFocus={() => focusField('password', passwordInput.current)}
              onSubmitEditing={handleSignIn}
              placeholder="Enter your password"
              placeholderTextColor={theme.colors.textMuted}
              returnKeyType="done"
              secureTextEntry={!showPassword}
              selectionColor={theme.colors.navigationActive}
              style={[styles.input, { color: theme.colors.text }]}
              textContentType="password"
              value={password}
            />
            <Pressable
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setShowPassword((current) => !current)}
              style={({ pressed }) => [styles.visibilityButton, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={21}
                color={theme.colors.textMuted}
              />
            </Pressable>
          </View>
          {fieldErrors.password ? (
            <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={[styles.fieldError, { color: theme.colors.error }]}>
              {fieldErrors.password}
            </Text>
          ) : null}
        </View>
      </View>

      {error ? (
        <View accessibilityRole="alert" style={[styles.error, { backgroundColor: theme.colors.surfaceMuted }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color={theme.colors.error} />
          <Text selectable style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        </View>
      ) : null}

      <AppButton
        accessibilityLabel="Sign in with email and password"
        disabled={isSigningIn}
        icon={<MaterialCommunityIcons name="login" size={21} color={theme.colors.onPrimary} />}
        label={isSigningIn ? 'Signing in...' : 'Sign in'}
        onPress={handleSignIn}
      />
    </AppModal>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 14 },
  fieldGroup: { gap: 7 },
  fieldLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 13 },
  inputFrame: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 14, paddingLeft: 15, paddingRight: 8 },
  input: { flex: 1, minHeight: 52, paddingVertical: 0, fontFamily: 'Montserrat_500Medium', fontSize: 14 },
  visibilityButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  fieldError: { fontFamily: 'Montserrat_600SemiBold', fontSize: 11, lineHeight: 16 },
  error: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 12, padding: 12 },
  errorText: { flex: 1, fontFamily: 'Montserrat_600SemiBold', fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.65 },
});
