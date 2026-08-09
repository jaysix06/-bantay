import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-provider';
import { AppButton } from '@/components/app-button';
import { useAppTheme } from '@/theme/theme-provider';

export function LoginScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { error, isSigningIn, signInWithGoogle } = useAuth();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={[
        styles.screen,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 32,
        },
      ]}
    >
      <View style={styles.brand}>
        <View
          style={[
            styles.iconFrame,
            { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
          ]}
        >
          <Image
            accessibilityLabel="Bantay dog mascot"
            source={require('../../../assets/images/icon.png')}
            resizeMode="contain"
            style={styles.icon}
          />
        </View>
        <View style={styles.copy}>
          <Text selectable style={[styles.eyebrow, { color: theme.colors.navigationActive }]}>BANTAY</Text>
          <Text selectable style={[styles.title, { color: theme.colors.text }]}>Your store price companion</Text>
          <Text selectable style={[styles.body, { color: theme.colors.textMuted }]}>Sign in with the Google account approved for this store to scan products and synchronize catalog data.</Text>
        </View>
      </View>

      <View
        style={[
          styles.signInCard,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <View style={styles.cardCopy}>
          <Text selectable style={[styles.cardTitle, { color: theme.colors.text }]}>Continue to Bantay</Text>
          <Text selectable style={[styles.cardBody, { color: theme.colors.textMuted }]}>Your Google password is handled by Google and is never shared with Bantay.</Text>
        </View>
        <AppButton
          accessibilityLabel="Continue with Google"
          label={isSigningIn ? 'Signing in…' : 'Continue with Google'}
          icon={<MaterialCommunityIcons name="google" size={21} color={theme.colors.onPrimary} />}
          disabled={isSigningIn}
          onPress={() => void signInWithGoogle()}
        />
        {error ? (
          <View accessibilityRole="alert" style={[styles.error, { backgroundColor: theme.colors.surfaceMuted }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color={theme.colors.error} />
            <Text selectable style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    justifyContent: 'space-between',
    gap: 40,
    paddingHorizontal: 24,
  },
  brand: { alignItems: 'center', gap: 26 },
  iconFrame: {
    width: 188,
    height: 188,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 44,
    borderCurve: 'continuous',
  },
  icon: { width: '100%', height: '100%' },
  copy: { alignItems: 'center', gap: 10 },
  eyebrow: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 15, letterSpacing: 3 },
  title: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 30, lineHeight: 37, textAlign: 'center' },
  body: { maxWidth: 410, fontFamily: 'Montserrat_500Medium', fontSize: 15, lineHeight: 23, textAlign: 'center' },
  signInCard: { gap: 20, borderWidth: 1, borderRadius: 22, borderCurve: 'continuous', padding: 20 },
  cardCopy: { gap: 7 },
  cardTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 19, lineHeight: 25 },
  cardBody: { fontFamily: 'Montserrat_500Medium', fontSize: 13, lineHeight: 20 },
  error: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 12, padding: 12 },
  errorText: { flex: 1, fontFamily: 'Montserrat_600SemiBold', fontSize: 12, lineHeight: 18 },
});
