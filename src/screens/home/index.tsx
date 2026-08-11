import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-provider';
import { subscribeToPendingPriceRequests } from '@/data/price-request-repository';
import { useAppTheme } from '@/theme/theme-provider';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type LookupRowProps = {
  body: string;
  icon: IconName;
  onPress: () => void;
  title: string;
};

function LookupRow({ body, icon, onPress, title }: LookupRowProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityLabel={`${title}. ${body}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.lookupRow, pressed && styles.pressed]}
    >
      <View style={[styles.lookupIcon, { backgroundColor: theme.colors.surfaceMuted }]}>
        <MaterialCommunityIcons name={icon} size={24} color={theme.colors.navigationActive} />
      </View>
      <View style={styles.lookupCopy}>
        <Text style={[styles.lookupTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text numberOfLines={2} style={[styles.lookupBody, { color: theme.colors.textMuted }]}>
          {body}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={23} color={theme.colors.textMuted} />
    </Pressable>
  );
}

export function HomeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { membership, user } = useAuth();
  const accountName = user?.displayName?.trim() || user?.email || 'Store account';
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  useEffect(() => {
    if (membership?.role !== 'owner') return;
    return subscribeToPendingPriceRequests(
      membership.storeId,
      (requests) => setPendingRequestCount(requests.length),
      () => setPendingRequestCount(0),
    );
  }, [membership]);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 130 },
      ]}
    >
      <View style={styles.brandRow}>
        <View style={[styles.mascotFrame, { backgroundColor: theme.colors.surfaceMuted }]}>
          <Image
            accessibilityLabel="Bantay mascot"
            source={require('../../../assets/images/mascot-transparent.png')}
            style={styles.mascot}
          />
        </View>
        <View style={styles.brandCopy}>
          <Text style={[styles.brand, { color: theme.colors.text }]}>BANTAY</Text>
          <Text numberOfLines={1} style={[styles.account, { color: theme.colors.textMuted }]}>
            {accountName}
          </Text>
        </View>
      </View>

      <View style={styles.intro}>
        <Text style={[styles.greeting, { color: theme.colors.text }]}>Ready to check a price?</Text>
        <Text style={[styles.introBody, { color: theme.colors.textMuted }]}>
          Scan a product or look through the prices saved for your store.
        </Text>
      </View>

      <Pressable
        accessibilityHint="Opens the barcode camera"
        accessibilityLabel="Scan a product barcode"
        accessibilityRole="button"
        onPress={() => router.push('/scan')}
        style={({ pressed }) => [
          styles.scanHero,
          { backgroundColor: theme.colors.primary },
          pressed && styles.pressedHero,
        ]}
      >
        <View style={styles.scanCopy}>
          <Text style={[styles.scanKicker, { color: theme.colors.onPrimary }]}>FASTEST LOOKUP</Text>
          <Text style={[styles.scanTitle, { color: theme.colors.onPrimary }]}>Scan a barcode</Text>
          <Text style={[styles.scanBody, { color: theme.colors.onPrimary }]}>
            Point, scan, and see the saved store price.
          </Text>
          <View style={[styles.scanAction, { backgroundColor: theme.colors.onPrimary }]}>
            <Text style={[styles.scanActionText, { color: theme.colors.primary }]}>Open camera</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color={theme.colors.primary} />
          </View>
        </View>
        <View style={[styles.scanVisual, { borderColor: theme.colors.onPrimary }]}>
          <MaterialCommunityIcons name="barcode-scan" size={58} color={theme.colors.onPrimary} />
        </View>
      </Pressable>

      <View style={styles.lookupSection}>
        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Find a price</Text>
          <Text style={[styles.sectionBody, { color: theme.colors.textMuted }]}>
            Choose the method that fits what you have in hand.
          </Text>
        </View>
        <View
          style={[
            styles.lookupPanel,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          {membership?.role === 'owner' ? (
            <>
              <LookupRow
                body={pendingRequestCount > 0
                  ? `${pendingRequestCount} price ${pendingRequestCount === 1 ? 'needs' : 'prices need'} your answer.`
                  : 'Questions from linked Bantays will appear here.'}
                icon="tag-search-outline"
                onPress={() => router.push('/price-requests')}
                title={pendingRequestCount > 0 ? `Price requests (${pendingRequestCount})` : 'Price requests'}
              />
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            </>
          ) : null}
          <LookupRow
            body="Find a product by name, brand, or barcode."
            icon="magnify"
            onPress={() => router.push('/search')}
            title="Search saved prices"
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <LookupRow
            body={
              membership?.role === 'owner'
                ? 'Review and update the products saved by this store.'
                : 'Review the prices saved by the store owner.'
            }
            icon="tag-multiple-outline"
            onPress={() => router.push('/products')}
            title="Open price book"
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <LookupRow
            body="Type the digits when the barcode cannot be scanned."
            icon="keyboard-outline"
            onPress={() => router.push('/manual')}
            title="Enter barcode manually"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    gap: 26,
    paddingHorizontal: 20,
  },
  brandRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 11 },
  mascotFrame: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 15 },
  mascot: { width: 43, height: 43, resizeMode: 'contain' },
  brandCopy: { flex: 1, gap: 1 },
  brand: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 17, letterSpacing: 1.8 },
  account: { fontFamily: 'Montserrat_500Medium', fontSize: 12 },
  intro: { gap: 7 },
  greeting: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  introBody: { maxWidth: 430, fontFamily: 'Montserrat_500Medium', fontSize: 14, lineHeight: 21 },
  scanHero: {
    minHeight: 190,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    gap: 12,
    borderRadius: 26,
    borderCurve: 'continuous',
    padding: 22,
    boxShadow: '0 14px 30px rgba(92, 48, 13, 0.18)',
  },
  scanCopy: { zIndex: 1, flex: 1, alignItems: 'flex-start', gap: 7 },
  scanKicker: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 10, letterSpacing: 1.35, opacity: 0.7 },
  scanTitle: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 23, lineHeight: 29 },
  scanBody: { maxWidth: 260, fontFamily: 'Montserrat_500Medium', fontSize: 13, lineHeight: 19, opacity: 0.78 },
  scanAction: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 5,
    borderRadius: 19,
    paddingHorizontal: 14,
  },
  scanActionText: { fontFamily: 'Montserrat_700Bold', fontSize: 12 },
  scanVisual: {
    width: 96,
    height: 118,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 24,
    borderCurve: 'continuous',
    opacity: 0.88,
  },
  lookupSection: { gap: 13 },
  sectionHeading: { gap: 5 },
  sectionTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 19 },
  sectionBody: { fontFamily: 'Montserrat_500Medium', fontSize: 13, lineHeight: 19 },
  lookupPanel: { overflow: 'hidden', borderWidth: 1, borderRadius: 22, borderCurve: 'continuous' },
  lookupRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14 },
  lookupIcon: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 15 },
  lookupCopy: { flex: 1, gap: 3 },
  lookupTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 15 },
  lookupBody: { fontFamily: 'Montserrat_500Medium', fontSize: 12, lineHeight: 17 },
  divider: { height: 1, marginLeft: 73 },
  pressed: { opacity: 0.68 },
  pressedHero: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
