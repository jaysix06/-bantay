/*
 * THESIS: Creating a Bantay identity should feel like stepping up to the same familiar counter as sign-in, not opening a separate form portal.
 * OWN-WORLD: Bantay gold establishes the welcome; the peeking mascot bridges into one open, quiet registration plane.
 * STORY: The user recognizes Bantay, chooses Google or email, and creates only an identity before deciding how to join a store.
 * FIRST VIEWPORT: The brand stays fixed at the upper-left, the mascot owns the seam, and the account heading leads directly to the choices.
 * FORM: Store-counter registration, inherited from the approved login direction with a compressed task-first hero.
 */
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-provider';
import { AppButton } from '@/components/app-button';
import { GoogleAuthButton } from '@/components/google-auth-button';
import { type CreateAccountErrors, validateCreateAccount } from '@/data/auth';
import { useAppTheme } from '@/theme/theme-provider';

type FieldName = 'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword';

export function CreateAccountScreen({ onBackToSignIn }: { onBackToSignIn: () => void }) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const scrollView = useRef<ScrollView>(null);
  const firstNameInput = useRef<TextInput>(null);
  const lastNameInput = useRef<TextInput>(null);
  const emailInput = useRef<TextInput>(null);
  const passwordInput = useRef<TextInput>(null);
  const confirmPasswordInput = useRef<TextInput>(null);
  const {
    clearError,
    createAccount,
    error,
    isCreatingAccount,
    isSigningIn,
    signInWithGoogle,
  } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<FieldName | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CreateAccountErrors>({});
  const [isLeaving, setIsLeaving] = useState(false);
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const [promiseLeadWidth, setPromiseLeadWidth] = useState(0);
  const [counterProgress] = useState(() => new Animated.Value(0));
  const [contentProgress] = useState(() => new Animated.Value(0));

  const busy = isCreatingAccount || isSigningIn;
  const interactionDisabled = busy || isLeaving;
  const contentWidth = Math.min(windowWidth, 520);
  const heroHeight = 230;
  const mascotWidth = Math.min(300, contentWidth - 64);
  const mascotHeight = mascotWidth * (408 / 555);
  const mascotTop = heroHeight - mascotHeight + 36;
  const loginHeroHeight = Math.min(360, Math.max(280, windowHeight * 0.39));
  const loginMascotWidth = Math.min(360, contentWidth - 24);
  const loginMascotFrameHeight = loginMascotWidth * (408 / 555);
  const loginMascotTop = loginHeroHeight - loginMascotFrameHeight + 42;
  const mascotScaleFromLogin = loginMascotWidth / mascotWidth;
  const loginMascotVisibleTop = loginMascotTop
    + (loginMascotFrameHeight - loginMascotWidth * (408 / 555)) / 2;
  const scaledMascotTop = mascotTop
    - (mascotHeight * mascotScaleFromLogin - mascotHeight) / 2;
  const mascotTravelFromLogin = loginMascotVisibleTop - scaledMascotTop;
  const panelTravelFromLogin = loginHeroHeight - heroHeight;

  useEffect(() => {
    let active = true;

    void AccessibilityInfo.isReduceMotionEnabled()
      .then((reduceMotion) => {
        if (!active) return;
        setReduceMotionEnabled(reduceMotion);
        if (reduceMotion) {
          counterProgress.setValue(1);
          contentProgress.setValue(1);
          return;
        }

        Animated.parallel([
          Animated.timing(counterProgress, {
            duration: 560,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(240),
            Animated.timing(contentProgress, {
              duration: 320,
              easing: Easing.out(Easing.cubic),
              toValue: 1,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      })
      .catch(() => {
        counterProgress.setValue(1);
        contentProgress.setValue(1);
      });

    return () => {
      active = false;
      counterProgress.stopAnimation();
      contentProgress.stopAnimation();
    };
  }, [contentProgress, counterProgress]);

  const returnToSignIn = useCallback(() => {
    if (interactionDisabled) return;
    if (reduceMotionEnabled) {
      onBackToSignIn();
      return;
    }

    setIsLeaving(true);
    Animated.parallel([
      Animated.timing(contentProgress, {
        duration: 160,
        easing: Easing.in(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(70),
        Animated.timing(counterProgress, {
          duration: 360,
          easing: Easing.inOut(Easing.cubic),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) onBackToSignIn();
      else setIsLeaving(false);
    });
  }, [contentProgress, counterProgress, interactionDisabled, onBackToSignIn, reduceMotionEnabled]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      returnToSignIn();
      return true;
    });

    return () => subscription.remove();
  }, [returnToSignIn]);

  const updateField = (field: FieldName, value: string) => {
    if (field === 'firstName') setFirstName(value);
    if (field === 'lastName') setLastName(value);
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    if (field === 'confirmPassword') setConfirmPassword(value);
    if (fieldErrors[field]) setFieldErrors((current) => ({ ...current, [field]: undefined }));
    if (error) clearError();
  };

  const handleCreateAccount = () => {
    const validation = validateCreateAccount(firstName, lastName, email, password, confirmPassword);
    setFieldErrors(validation.errors);
    if (!validation.account) return;
    void createAccount(
      validation.account.displayName,
      validation.account.email,
      validation.account.password,
    );
  };

  const focusField = (field: FieldName, input: TextInput | null) => {
    setFocusedField(field);
    if (input) {
      scrollView.current?.scrollResponderScrollNativeHandleToKeyboard(input, 24, true);
    }
  };

  const fieldStyle = (field: FieldName) => [
    styles.inputFrame,
    {
      backgroundColor: theme.colors.background,
      borderColor: fieldErrors[field]
        ? theme.colors.error
        : focusedField === field
          ? theme.colors.navigationActive
          : theme.colors.border,
    },
  ];

  const fieldError = (field: FieldName) =>
    fieldErrors[field] ? (
      <Text
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={[styles.fieldError, { color: theme.colors.error }]}
      >
        {fieldErrors[field]}
      </Text>
    ) : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar style="dark" />
      <ScrollView
        ref={scrollView}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.screen, { backgroundColor: theme.colors.primary }]}>
          <View
            style={[
              styles.hero,
              {
                backgroundColor: theme.colors.primary,
                height: heroHeight,
                paddingTop: insets.top + 24,
              },
            ]}
          >
            <View style={styles.brandCopy}>
              <Text style={[styles.brandName, { color: theme.colors.onPrimary }]}>BANTAY</Text>
              <View
                accessible
                accessibilityLabel="Scan it. Know the price."
                style={styles.brandPromiseMotion}
              >
                <Text
                  onLayout={(event) => setPromiseLeadWidth(event.nativeEvent.layout.width)}
                  style={[styles.brandPromise, styles.brandPromiseLead, { color: theme.colors.onPrimary }]}
                >
                  Scan it. Know
                </Text>
                <Animated.Text
                  style={[
                    styles.brandPromise,
                    styles.brandPromiseTail,
                    {
                      color: theme.colors.onPrimary,
                      transform: [
                        {
                          translateX: counterProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [promiseLeadWidth + 4, 0],
                          }),
                        },
                        {
                          translateY: counterProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-20, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  the price.
                </Animated.Text>
              </View>
            </View>

          </View>

          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.decorativeLayer]}
          >
            <View
              style={[
                styles.priceMark,
                styles.priceMarkLeft,
                {
                  borderColor: theme.colors.onPrimary,
                  top: loginHeroHeight - 120,
                },
              ]}
            >
              <MaterialCommunityIcons name="currency-php" size={21} color={theme.colors.onPrimary} />
            </View>
            <View style={[styles.priceMark, styles.priceMarkRight, { borderColor: theme.colors.onPrimary }]}>
              <MaterialCommunityIcons name="barcode-scan" size={23} color={theme.colors.onPrimary} />
            </View>
            <MaterialCommunityIcons
              name="tag-outline"
              size={54}
              color={theme.colors.onPrimary}
              style={[styles.tagOutline, { top: loginHeroHeight - 76 }]}
            />
          </View>

          <Animated.View
            style={[
              styles.mascotBridge,
              {
                width: mascotWidth,
                height: mascotHeight,
                marginLeft: -(mascotWidth / 2),
                top: mascotTop,
                transform: [
                  {
                    translateY: counterProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [mascotTravelFromLogin, 0],
                    }),
                  },
                  {
                    scale: counterProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [mascotScaleFromLogin, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image
              accessibilityLabel="Bantay dog mascot welcoming a new account"
              resizeMode="contain"
              source={require('../../../assets/images/login-mascot.png')}
              style={styles.mascot}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.formPlane,
              {
                backgroundColor: theme.colors.surface,
                paddingBottom: insets.bottom + 28,
                transform: [
                  {
                    translateY: counterProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [panelTravelFromLogin, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable
              accessibilityLabel="Return to sign in"
              accessibilityRole="button"
              disabled={interactionDisabled}
              onPress={returnToSignIn}
              style={({ pressed }) => [
                styles.panelBackButton,
                { backgroundColor: theme.colors.surfaceMuted },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.backLabel, { color: theme.colors.text }]}>Sign in</Text>
              <MaterialCommunityIcons name="arrow-down" size={21} color={theme.colors.text} />
            </Pressable>

            <Animated.View
              style={[
                styles.formContent,
                {
                  opacity: contentProgress,
                  transform: [
                    {
                      translateY: contentProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [18, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.heading}>
                <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>Create your account</Text>
                <Text style={[styles.body, { color: theme.colors.textMuted }]}>Set up your Bantay identity. You can invite or join your store team after signing in.</Text>
              </View>

              <GoogleAuthButton
                disabled={interactionDisabled}
                label={isSigningIn ? 'Signing in...' : 'Continue with Google'}
                onPress={() => void signInWithGoogle()}
              />

              <View accessibilityElementsHidden style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
                <Text style={[styles.dividerLabel, { color: theme.colors.textMuted }]}>OR CREATE WITH EMAIL</Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
              </View>

              <View style={styles.fields}>
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>First name</Text>
                <View style={fieldStyle('firstName')}>
                  <MaterialCommunityIcons name="account-outline" size={20} color={theme.colors.textMuted} />
                  <TextInput
                    ref={firstNameInput}
                    accessibilityHint={fieldErrors.firstName ?? 'Enter your first name'}
                    accessibilityLabel="First name"
                    autoCapitalize="words"
                    autoComplete="given-name"
                    editable={!interactionDisabled}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(value) => updateField('firstName', value)}
                    onFocus={() => focusField('firstName', firstNameInput.current)}
                    onSubmitEditing={() => lastNameInput.current?.focus()}
                    placeholder="e.g. Ana"
                    placeholderTextColor={theme.colors.textMuted}
                    returnKeyType="next"
                    selectionColor={theme.colors.navigationActive}
                    style={[styles.input, { color: theme.colors.text }]}
                    textContentType="givenName"
                    value={firstName}
                  />
                </View>
                {fieldError('firstName')}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Last name</Text>
                <View style={fieldStyle('lastName')}>
                  <MaterialCommunityIcons name="account-outline" size={20} color={theme.colors.textMuted} />
                  <TextInput
                    ref={lastNameInput}
                    accessibilityHint={fieldErrors.lastName ?? 'Enter your last name'}
                    accessibilityLabel="Last name"
                    autoCapitalize="words"
                    autoComplete="family-name"
                    editable={!interactionDisabled}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(value) => updateField('lastName', value)}
                    onFocus={() => focusField('lastName', lastNameInput.current)}
                    onSubmitEditing={() => emailInput.current?.focus()}
                    placeholder="e.g. Santos"
                    placeholderTextColor={theme.colors.textMuted}
                    returnKeyType="next"
                    selectionColor={theme.colors.navigationActive}
                    style={[styles.input, { color: theme.colors.text }]}
                    textContentType="familyName"
                    value={lastName}
                  />
                </View>
                {fieldError('lastName')}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Email</Text>
                <View style={fieldStyle('email')}>
                  <MaterialCommunityIcons name="email-outline" size={20} color={theme.colors.textMuted} />
                  <TextInput
                    ref={emailInput}
                    accessibilityHint={fieldErrors.email ?? 'Enter your email address'}
                    accessibilityLabel="Email"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!interactionDisabled}
                    keyboardType="email-address"
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(value) => updateField('email', value)}
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
                {fieldError('email')}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Password</Text>
                <View style={fieldStyle('password')}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color={theme.colors.textMuted} />
                  <TextInput
                    ref={passwordInput}
                    accessibilityHint={fieldErrors.password ?? 'Use at least 8 characters'}
                    accessibilityLabel="Password"
                    autoCapitalize="none"
                    autoComplete="new-password"
                    editable={!interactionDisabled}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(value) => updateField('password', value)}
                    onFocus={() => focusField('password', passwordInput.current)}
                    onSubmitEditing={() => confirmPasswordInput.current?.focus()}
                    placeholder="At least 8 characters"
                    placeholderTextColor={theme.colors.textMuted}
                    returnKeyType="next"
                    secureTextEntry={!showPassword}
                    selectionColor={theme.colors.navigationActive}
                    style={[styles.input, { color: theme.colors.text }]}
                    textContentType="newPassword"
                    value={password}
                  />
                  <Pressable
                    accessibilityLabel={showPassword ? 'Hide passwords' : 'Show passwords'}
                    accessibilityRole="button"
                    disabled={interactionDisabled}
                    hitSlop={8}
                    onPress={() => setShowPassword((current) => !current)}
                    style={({ pressed }) => [styles.visibilityButton, pressed && styles.pressed]}
                  >
                    <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color={theme.colors.textMuted} />
                  </Pressable>
                </View>
                {fieldError('password')}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Confirm password</Text>
                <View style={fieldStyle('confirmPassword')}>
                  <MaterialCommunityIcons name="lock-check-outline" size={20} color={theme.colors.textMuted} />
                  <TextInput
                    ref={confirmPasswordInput}
                    accessibilityHint={fieldErrors.confirmPassword ?? 'Enter the same password again'}
                    accessibilityLabel="Confirm password"
                    autoCapitalize="none"
                    autoComplete="new-password"
                    editable={!interactionDisabled}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(value) => updateField('confirmPassword', value)}
                    onFocus={() => focusField('confirmPassword', confirmPasswordInput.current)}
                    onSubmitEditing={handleCreateAccount}
                    placeholder="Enter your password again"
                    placeholderTextColor={theme.colors.textMuted}
                    returnKeyType="done"
                    secureTextEntry={!showPassword}
                    selectionColor={theme.colors.navigationActive}
                    style={[styles.input, { color: theme.colors.text }]}
                    textContentType="newPassword"
                    value={confirmPassword}
                  />
                </View>
                {fieldError('confirmPassword')}
              </View>
              </View>

              {error ? (
                <View accessibilityRole="alert" style={[styles.error, { backgroundColor: theme.colors.surfaceMuted }]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={20} color={theme.colors.error} />
                  <Text selectable style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
                </View>
              ) : null}

              <AppButton
                accessibilityLabel="Create account with email and password"
                disabled={interactionDisabled}
                icon={<MaterialCommunityIcons name="account-plus-outline" size={21} color={theme.colors.onPrimary} />}
                label={isCreatingAccount ? 'Creating account...' : 'Create account'}
                onPress={handleCreateAccount}
              />

              <View style={styles.signInRow}>
                <Text style={[styles.signInPrompt, { color: theme.colors.textMuted }]}>Already have an account?</Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={interactionDisabled}
                  hitSlop={8}
                  onPress={returnToSignIn}
                  style={({ pressed }) => [styles.signInButton, pressed && styles.pressed]}
                >
                  <Text style={[styles.signInLabel, { color: theme.colors.navigationActive }]}>Sign in</Text>
                </Pressable>
              </View>
            </Animated.View>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  screen: { position: 'relative', flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center' },
  hero: { overflow: 'hidden', paddingHorizontal: 26 },
  brandCopy: { zIndex: 2, alignSelf: 'flex-start', gap: 2 },
  backLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 14 },
  brandName: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 27, lineHeight: 33, letterSpacing: 1.2 },
  brandPromise: { fontFamily: 'Montserrat_600SemiBold', fontSize: 14, lineHeight: 20 },
  brandPromiseMotion: { position: 'relative', width: 220, height: 40 },
  brandPromiseLead: { position: 'absolute', left: 0, top: 0 },
  brandPromiseTail: { position: 'absolute', left: 0, top: 20 },
  mascotBridge: { position: 'absolute', zIndex: 4, elevation: 4, left: '50%' },
  mascot: { width: '100%', height: '100%' },
  decorativeLayer: { overflow: 'hidden' },
  priceMark: { position: 'absolute', width: 60, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderRadius: 13, opacity: 0.13, transform: [{ rotate: '-10deg' }] },
  priceMarkLeft: { left: 32 },
  priceMarkRight: { right: 28, top: 104, transform: [{ rotate: '9deg' }] },
  tagOutline: { position: 'absolute', right: -10, opacity: 0.1, transform: [{ rotate: '-18deg' }] },
  formPlane: { flexGrow: 1, marginTop: -1, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderCurve: 'continuous', paddingTop: 78, paddingHorizontal: 24 },
  panelBackButton: { position: 'absolute', zIndex: 2, top: 14, right: 20, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 14, paddingHorizontal: 13 },
  formContent: { gap: 20 },
  heading: { gap: 8 },
  title: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 30, lineHeight: 37, letterSpacing: -0.6 },
  body: { maxWidth: 430, fontFamily: 'Montserrat_500Medium', fontSize: 16, lineHeight: 24 },
  divider: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 10, lineHeight: 14, letterSpacing: 0.7 },
  fields: { gap: 16 },
  fieldGroup: { gap: 7 },
  fieldLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 14, lineHeight: 20 },
  inputFrame: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 14, paddingLeft: 15, paddingRight: 8 },
  input: { flex: 1, minHeight: 54, paddingVertical: 0, fontFamily: 'Montserrat_500Medium', fontSize: 16 },
  visibilityButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  fieldError: { fontFamily: 'Montserrat_600SemiBold', fontSize: 12, lineHeight: 18 },
  error: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 12, padding: 12 },
  errorText: { flex: 1, fontFamily: 'Montserrat_600SemiBold', fontSize: 12, lineHeight: 18 },
  signInRow: { minHeight: 48, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: 5 },
  signInPrompt: { fontFamily: 'Montserrat_500Medium', fontSize: 14, lineHeight: 20 },
  signInButton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 3 },
  signInLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 14, lineHeight: 20 },
  pressed: { opacity: 0.68 },
});
