import { Montserrat_500Medium } from '@expo-google-fonts/montserrat/500Medium';
import { Montserrat_600SemiBold } from '@expo-google-fonts/montserrat/600SemiBold';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat/700Bold';
import { Montserrat_800ExtraBold } from '@expo-google-fonts/montserrat/800ExtraBold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AuthProvider, useAuth } from '@/auth/auth-provider';
import { resolveAccountGate } from '@/data/account-activation';
import { AppButton } from '@/components/app-button';
import { ScreenState } from '@/components/screen-state';
import '@/data/firebase';
import { initializeDatabase } from '@/data/database';
import { hasCompletedOnboarding, type OnboardingPreference } from '@/data/onboarding-preference';
import { readOnboardingPreference, writeOnboardingPreference } from '@/data/settings-repository';
import { AccountActivationScreen } from '@/screens/account-activation';
import { CreateAccountScreen } from '@/screens/create-account';
import { LoginScreen } from '@/screens/login';
import { OnboardingScreen } from '@/screens/onboarding';
import { AppThemeProvider, useAppTheme } from '@/theme/theme-provider';

void SplashScreen.preventAutoHideAsync();

function Navigation() {
  const theme = useAppTheme();
  const navigationTheme = theme.isDark ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider
      value={{
        ...navigationTheme,
        colors: {
          ...navigationTheme.colors,
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
        },
      }}
    >
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontFamily: 'Montserrat_700Bold' },
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="manual" options={{ title: 'Enter barcode', presentation: 'modal' }} />
        <Stack.Screen name="pair-bantay" options={{ title: 'Scan Bantay QR', presentation: 'modal' }} />
        <Stack.Screen name="price-requests" options={{ title: 'Price requests' }} />
        <Stack.Screen name="product/[barcode]" options={{ title: 'Product price' }} />
        <Stack.Screen name="product/add" options={{ title: 'Save product', presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

function AuthGate() {
  const db = useSQLiteContext();
  const { isReady, isStoreReady, membership, retryStoreLookup, signOut, storeLookupError, user } = useAuth();
  const [onboarding, setOnboarding] = useState<OnboardingPreference | null>(null);

  useEffect(() => {
    let active = true;
    void readOnboardingPreference(db)
      .then((preference) => {
        if (active) setOnboarding(preference);
      })
      .catch(() => {
        if (active) setOnboarding('pending');
      });
    return () => { active = false; };
  }, [db]);

  const finishOnboarding = (preference: 'skipped' | 'completed') => {
    setOnboarding(preference);
    void writeOnboardingPreference(db, preference).catch(() => undefined);
  };

  if (onboarding === null) {
    return <LoadingScreen />;
  }

  if (!hasCompletedOnboarding(onboarding)) {
    return <OnboardingScreen onComplete={() => finishOnboarding('completed')} onSkip={() => finishOnboarding('skipped')} />;
  }

  const gate = resolveAccountGate({
    isReady,
    isStoreReady,
    signedIn: Boolean(user),
    hasMembership: Boolean(membership),
    hasStoreError: storeLookupError,
  });

  if (gate === 'loading') return <LoadingScreen />;
  if (gate === 'auth') return <UnauthenticatedGate />;
  if (gate === 'store-error') return (
    <ScreenState
      icon="wifi-alert"
      title="Store access could not be checked"
      body="Connect to the internet and try again. Bantay will not assign a role while your membership is uncertain."
    >
      <AppButton label="Try again" onPress={() => void retryStoreLookup().catch(() => undefined)} />
      <AppButton label="Sign out" variant="secondary" onPress={() => void signOut()} />
    </ScreenState>
  );
  if (gate === 'activation') return <AccountActivationScreen />;
  return <Navigation />;
}

function LoadingScreen() {
  const theme = useAppTheme();
  return (
    <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

function UnauthenticatedGate() {
  const { clearError } = useAuth();
  const [screen, setScreen] = useState<'login' | 'create-account'>('login');
  const [animateLoginContent, setAnimateLoginContent] = useState(false);

  const showScreen = (nextScreen: 'login' | 'create-account') => {
    clearError();
    if (screen === 'create-account' && nextScreen === 'login') {
      setAnimateLoginContent(true);
    }
    setScreen(nextScreen);
  };

  if (screen === 'create-account') {
    return <CreateAccountScreen onBackToSignIn={() => showScreen('login')} />;
  }

  return (
    <LoginScreen
      animateContent={animateLoginContent}
      onCreateAccount={() => showScreen('create-account')}
    />
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SQLiteProvider databaseName="bantay.db" onInit={initializeDatabase}>
      <AppThemeProvider>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </AppThemeProvider>
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
