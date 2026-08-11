import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/auth-provider';
import { AppButton } from '@/components/app-button';
import { PairingSuccess } from '@/components/pairing-success';
import { ScreenState } from '@/components/screen-state';
import { BantayPairingError } from '@/data/bantay-pairing-repository';
import { useAppTheme } from '@/theme/theme-provider';

export function BantayPairingScannerScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { claimBantayPairingCode, membership } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [isFocused, setIsFocused] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  const handleQrCode = async ({ data }: BarcodeScanningResult) => {
    if (isLocked) return;
    setIsLocked(true);
    setScanError(null);
    try {
      await claimBantayPairingCode(data);
      setIsLinked(true);
    } catch (error) {
      setScanError(
        error instanceof BantayPairingError
          ? error.message
          : 'Bantay could not link this account. Check your connection and try again.',
      );
    }
  };

  if (membership?.role !== 'owner') {
    return (
      <ScreenState
        icon="shield-account-outline"
        title="Owner access required"
        body="Only the store owner can scan and link a bantay account."
      >
        <AppButton label="Go back" variant="secondary" onPress={() => router.back()} />
      </ScreenState>
    );
  }

  if (isLinked) {
    return (
      <PairingSuccess body="Both phones are updating now. This bantay can scan products and view your store's saved prices.">
        <AppButton label="Done" onPress={() => router.back()} />
      </PairingSuccess>
    );
  }

  if (!permission) {
    return <View style={[styles.fill, { backgroundColor: theme.colors.background }]} />;
  }

  if (!permission.granted) {
    return (
      <ScrollView contentContainerStyle={[styles.permission, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.permissionIcon, { backgroundColor: theme.colors.surfaceMuted }]}>
          <MaterialCommunityIcons name="qrcode-scan" size={42} color={theme.colors.primary} />
        </View>
        <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>Scan a Bantay QR</Text>
        <Text style={[styles.permissionBody, { color: theme.colors.textMuted }]}>
          Camera access is used only to read the temporary pairing code shown on the other phone.
        </Text>
        <AppButton
          label={permission.canAskAgain ? 'Allow camera access' : 'Open app settings'}
          onPress={() => void (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
        />
      </ScrollView>
    );
  }

  return (
    <View style={styles.cameraScreen}>
      {isFocused ? (
        <CameraView
          active={!isLocked}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          facing="back"
          onBarcodeScanned={isLocked ? undefined : (result) => void handleQrCode(result)}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.shade]} />
      <View style={styles.scanContent}>
        <Text style={styles.instruction}>{"Center the bantay's QR inside the frame"}</Text>
        <View accessible accessibilityLabel="Bantay QR scanning frame" style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>
      <View style={[styles.footer, { backgroundColor: theme.colors.cameraOverlay }]}>
        {scanError ? (
          <>
            <Text accessibilityRole="alert" style={[styles.error, { color: '#FFD6D0' }]}>{scanError}</Text>
            <AppButton label="Scan another code" onPress={() => setIsLocked(false)} />
          </>
        ) : (
          <>
            <Text style={styles.footerTitle}>{isLocked ? 'Linking account…' : 'Ready to pair'}</Text>
            <Text style={styles.footerBody}>The code expires after five minutes and works only once.</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  cameraScreen: { flex: 1, backgroundColor: '#090603' },
  shade: { backgroundColor: 'rgba(0, 0, 0, 0.26)' },
  scanContent: { flex: 1, justifyContent: 'center', gap: 20, paddingHorizontal: 30 },
  instruction: { color: '#FFFFFF', fontFamily: 'Montserrat_600SemiBold', fontSize: 15, textAlign: 'center' },
  scanFrame: { width: '100%', maxWidth: 340, aspectRatio: 1, alignSelf: 'center' },
  corner: { position: 'absolute', width: 54, height: 54, borderColor: '#FFFFFF' },
  topLeft: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 24 },
  topRight: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 24 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 24 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 24 },
  footer: { gap: 10, borderRadius: 24, padding: 20, margin: 16 },
  footerTitle: { color: '#FFFFFF', fontFamily: 'Montserrat_700Bold', fontSize: 18 },
  footerBody: { color: '#EADBC9', fontFamily: 'Montserrat_500Medium', fontSize: 13, lineHeight: 20 },
  error: { fontFamily: 'Montserrat_600SemiBold', fontSize: 13, lineHeight: 20 },
  permission: { flexGrow: 1, justifyContent: 'center', gap: 16, padding: 24 },
  permissionIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  permissionTitle: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 28, lineHeight: 34 },
  permissionBody: { fontFamily: 'Montserrat_500Medium', fontSize: 15, lineHeight: 23, paddingBottom: 8 },
});
