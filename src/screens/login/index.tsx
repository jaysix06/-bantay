/*
 * THESIS: Signing in should feel like returning to a familiar store counter, not entering a generic account portal.
 * OWN-WORLD: A full Bantay-gold welcome field meets one quiet, open sign-in plane; price-tag marks stay atmospheric.
 * STORY: The mascot recognizes the user, the promise reorients them, and two unmistakable actions bring their store back.
 * FIRST VIEWPORT: Brand at the upper-left, the puppy leaning over the gold-to-surface seam, and authentication actions below.
 * FORM: Store-counter welcome, fifth grounded structure, bold split staging, seed 06ae860a.
 */
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-provider';
import { AppButton } from '@/components/app-button';
import { EmailLoginModal } from '@/components/email-login-modal';
import { GoogleAuthButton } from '@/components/google-auth-button';
import { useAppTheme } from '@/theme/theme-provider';

type LoginScreenProps = {
  animateContent?: boolean;
  onCreateAccount: () => void;
};

export function LoginScreen({ animateContent = false, onCreateAccount }: LoginScreenProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const { clearError, error, isSigningIn, signInWithGoogle } = useAuth();
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [contentProgress] = useState(() => new Animated.Value(animateContent ? 0 : 1));
  const contentWidth = Math.min(windowWidth, 520);
  const heroHeight = Math.min(360, Math.max(280, windowHeight * 0.39));
  const mascotWidth = Math.min(360, contentWidth - 24);
  const mascotHeight = mascotWidth * (408 / 555);
  const mascotTop = heroHeight - mascotHeight + 42;

  useEffect(() => {
    if (!animateContent) return;

    let active = true;

    void AccessibilityInfo.isReduceMotionEnabled()
      .then((reduceMotion) => {
        if (!active) return;
        if (reduceMotion) {
          contentProgress.setValue(1);
          return;
        }

        Animated.sequence([
          Animated.delay(70),
          Animated.timing(contentProgress, {
            duration: 360,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            toValue: 1,
            useNativeDriver: true,
          }),
        ]).start();
      })
      .catch(() => contentProgress.setValue(1));

    return () => {
      active = false;
      contentProgress.stopAnimation();
    };
  }, [animateContent, contentProgress]);

  const openEmailModal = () => {
    if (error) clearError();
    setEmailModalVisible(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar style="dark" />
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.screen, { backgroundColor: theme.colors.surface }]}>
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
              <Text style={[styles.brandPromise, { color: theme.colors.onPrimary }]}>Scan it. Know the price.</Text>
            </View>

            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
            >
              <View style={[styles.priceMark, styles.priceMarkLeft, { borderColor: theme.colors.onPrimary }]}>
                <MaterialCommunityIcons name="currency-php" size={21} color={theme.colors.onPrimary} />
              </View>
              <View style={[styles.priceMark, styles.priceMarkRight, { borderColor: theme.colors.onPrimary }]}>
                <MaterialCommunityIcons name="barcode-scan" size={23} color={theme.colors.onPrimary} />
              </View>
              <MaterialCommunityIcons
                name="tag-outline"
                size={54}
                color={theme.colors.onPrimary}
                style={styles.tagOutline}
              />
            </View>

          </View>

          <View
            style={[
              styles.mascotBridge,
              {
                width: mascotWidth,
                height: mascotHeight,
                marginLeft: -(mascotWidth / 2),
                top: mascotTop,
              },
            ]}
          >
            <Image
              accessibilityLabel="Bantay dog mascot welcoming you back"
              resizeMode="contain"
              source={require('../../../assets/images/login-mascot.png')}
              style={styles.mascot}
            />
          </View>

          <View
            style={[
              styles.signInPlane,
              {
                backgroundColor: theme.colors.surface,
                paddingBottom: insets.bottom + 28,
              },
            ]}
          >
            <Animated.View
              style={{
                opacity: contentProgress,
                transform: [
                  {
                    translateY: contentProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-14, 0],
                    }),
                  },
                ],
              }}
            >
              <View style={styles.welcome}>
                <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>Welcome back</Text>
                <Text style={[styles.body, { color: theme.colors.textMuted }]}>Your store is waiting. Sign in to keep prices and products within reach.</Text>
              </View>

              {error ? (
                <View accessibilityRole="alert" style={[styles.error, { backgroundColor: theme.colors.surfaceMuted }]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={20} color={theme.colors.error} />
                  <Text selectable style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.authChoices}>
                <GoogleAuthButton
                  disabled={isSigningIn}
                  label={isSigningIn ? 'Signing in...' : 'Continue with Google'}
                  onPress={() => void signInWithGoogle()}
                />

                <AppButton
                  accessibilityLabel="Continue with Email"
                  balancedIcon
                  disabled={isSigningIn}
                  icon={<MaterialCommunityIcons name="email-outline" size={30} color={theme.colors.text} />}
                  label="Continue with Email"
                  onPress={openEmailModal}
                  variant="secondary"
                />
              </View>

              <View style={styles.createAccountRow}>
                <Text style={[styles.createAccountPrompt, { color: theme.colors.textMuted }]}>New to Bantay?</Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={isSigningIn}
                  hitSlop={8}
                  onPress={onCreateAccount}
                  style={({ pressed }) => [styles.createAccountButton, pressed && styles.pressed]}
                >
                  <Text style={[styles.createAccountLabel, { color: theme.colors.navigationActive }]}>Create account</Text>
                </Pressable>
              </View>

              <View style={styles.trustNote}>
                <MaterialCommunityIcons name="shield-check-outline" size={18} color={theme.colors.success} />
                <Text style={[styles.trustText, { color: theme.colors.textMuted }]}>Your account information is securely protected.</Text>
              </View>
            </Animated.View>
          </View>
        </View>
      </ScrollView>

      <EmailLoginModal onClose={() => setEmailModalVisible(false)} visible={emailModalVisible} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  screen: { position: 'relative', flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center' },
  hero: { overflow: 'hidden', paddingHorizontal: 26 },
  brandCopy: { zIndex: 2, alignSelf: 'flex-start', gap: 2 },
  brandName: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 27, lineHeight: 33, letterSpacing: 1.2 },
  brandPromise: { fontFamily: 'Montserrat_600SemiBold', fontSize: 14, lineHeight: 20 },
  mascotBridge: { position: 'absolute', zIndex: 4, elevation: 4, left: '50%' },
  mascot: { width: '100%', height: '100%' },
  priceMark: { position: 'absolute', width: 60, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderRadius: 13, opacity: 0.13, transform: [{ rotate: '-10deg' }] },
  priceMarkLeft: { left: 32, bottom: 72 },
  priceMarkRight: { right: 28, top: 104, transform: [{ rotate: '9deg' }] },
  tagOutline: { position: 'absolute', right: -10, bottom: 22, opacity: 0.1, transform: [{ rotate: '-18deg' }] },
  signInPlane: { flexGrow: 1, marginTop: -1, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderCurve: 'continuous', paddingTop: 68, paddingHorizontal: 24 },
  welcome: { gap: 8 },
  title: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 32, lineHeight: 39, letterSpacing: -0.7 },
  body: { maxWidth: 420, fontFamily: 'Montserrat_500Medium', fontSize: 16, lineHeight: 24 },
  authChoices: { marginTop: 24, gap: 12 },
  error: { marginTop: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 12, padding: 12 },
  errorText: { flex: 1, fontFamily: 'Montserrat_600SemiBold', fontSize: 12, lineHeight: 18 },
  createAccountRow: { minHeight: 48, marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: 5 },
  createAccountPrompt: { fontFamily: 'Montserrat_500Medium', fontSize: 14, lineHeight: 20 },
  createAccountButton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 3 },
  createAccountLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 14, lineHeight: 20 },
  trustNote: { marginTop: 8, flexDirection: 'row', alignItems: 'flex-start', alignSelf: 'center', gap: 8, paddingHorizontal: 14 },
  trustText: { flexShrink: 1, maxWidth: 340, fontFamily: 'Montserrat_500Medium', fontSize: 12, lineHeight: 20 },
  pressed: { opacity: 0.65 },
});
