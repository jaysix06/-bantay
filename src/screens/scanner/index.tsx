import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { normalizeScannedBarcode } from '@/domain/product';
import { useAppTheme } from '@/theme/theme-provider';

export function ScannerScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isFocused, setIsFocused] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      setIsLocked(false);
      return () => setIsFocused(false);
    }, []),
  );

  const handleBarcode = ({ data }: BarcodeScanningResult) => {
    if (isLocked) return;
    const barcode = normalizeScannedBarcode(data);
    if (!barcode) return;
    setIsLocked(true);
    router.push({ pathname: '/product/[barcode]', params: { barcode } });
  };

  if (!permission) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text selectable style={[styles.stateTitle, { color: theme.colors.text }]}>
          Preparing the scanner…
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.permissionContent,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={[styles.permissionIcon, { backgroundColor: theme.colors.surfaceMuted }]}>
          <MaterialCommunityIcons name="barcode-scan" size={42} color={theme.colors.primary} />
        </View>
        <Text selectable style={[styles.stateTitle, { color: theme.colors.text }]}>
          Scan prices in seconds
        </Text>
        <Text selectable style={[styles.stateBody, { color: theme.colors.textMuted }]}>
          Bantay needs camera access only to read product barcodes. It does not take or save
          photos.
        </Text>
        <AppButton
          label={permission.canAskAgain ? 'Allow camera access' : 'Open app settings'}
          onPress={() =>
            void (permission.canAskAgain ? requestPermission() : Linking.openSettings())
          }
        />
        <AppButton
          label="Enter barcode instead"
          variant="secondary"
          onPress={() => router.push('/manual')}
        />
      </ScrollView>
    );
  }

  return (
    <View style={styles.cameraScreen}>
      {isFocused ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'itf14'],
          }}
          onBarcodeScanned={isLocked ? undefined : handleBarcode}
        />
      ) : null}

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.cameraShade, { backgroundColor: 'rgba(0, 0, 0, 0.28)' }]} />
      </View>

      <View style={[styles.brandRow, { paddingTop: insets.top + 14 }]}>
        <View style={[styles.brandMark, { backgroundColor: theme.colors.primary }]}>
          <Image source={require('../../../assets/images/icon.png')} style={styles.brandImage} />
        </View>
        <Text style={[styles.brandName, { color: theme.colors.cameraChrome }]}>BANTAY</Text>
      </View>

      <View style={styles.scannerBody}>
        <Text selectable style={[styles.scannerInstruction, { color: theme.colors.cameraChrome }]}>
          Center the barcode inside the frame
        </Text>
        <View
          accessible
          accessibilityLabel="Barcode scanning frame"
          style={styles.scanFrame}
        >
          <View style={[styles.corner, styles.topLeft, { borderColor: theme.colors.cameraChrome }]} />
          <View style={[styles.corner, styles.topRight, { borderColor: theme.colors.cameraChrome }]} />
          <View style={[styles.corner, styles.bottomLeft, { borderColor: theme.colors.cameraChrome }]} />
          <View style={[styles.corner, styles.bottomRight, { borderColor: theme.colors.cameraChrome }]} />
          <View style={[styles.scanLine, { backgroundColor: theme.colors.primary }]} />
        </View>
      </View>

      <View
        style={[
          styles.scannerFooter,
          {
            backgroundColor: theme.colors.cameraOverlay,
            borderColor: 'rgba(255, 255, 255, 0.16)',
            marginBottom: insets.bottom + 12,
          },
        ]}
      >
        <Text selectable style={[styles.footerTitle, { color: theme.colors.cameraChrome }]}>
          Scan a product barcode
        </Text>
        <Text selectable style={[styles.footerBody, { color: '#EADBC9' }]}>
          The saved store price will appear immediately.
        </Text>
        <AppButton
          label="Enter barcode manually"
          variant="secondary"
          icon={
            <MaterialCommunityIcons name="keyboard-outline" size={22} color={theme.colors.text} />
          }
          onPress={() => router.push('/manual')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cameraScreen: { flex: 1, backgroundColor: '#090603' },
  cameraShade: { flex: 1 },
  brandRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandImage: { width: 36, height: 36 },
  brandName: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 20, letterSpacing: 0.4 },
  scannerBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 28,
  },
  scannerInstruction: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 15,
    textAlign: 'center',
  },
  scanFrame: {
    aspectRatio: 1.32,
    maxHeight: 280,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.28)',
  },
  corner: { position: 'absolute', width: 48, height: 48 },
  topLeft: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 24 },
  topRight: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 24 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 24 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 24 },
  scanLine: { height: 3, borderRadius: 2, opacity: 0.92 },
  scannerFooter: {
    gap: 8,
    borderWidth: 1,
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: 20,
    marginHorizontal: 16,
  },
  footerTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 18 },
  footerBody: { fontFamily: 'Montserrat_500Medium', fontSize: 14, lineHeight: 21, paddingBottom: 8 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  permissionContent: { flexGrow: 1, justifyContent: 'center', gap: 16, padding: 24 },
  permissionIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 28, lineHeight: 34 },
  stateBody: { fontFamily: 'Montserrat_500Medium', fontSize: 16, lineHeight: 24, paddingBottom: 8 },
});
