import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/auth-provider';
import { AppButton } from '@/components/app-button';
import { ScreenState } from '@/components/screen-state';
import type { PriceRequest } from '@/data/price-request';
import { subscribeToPendingPriceRequests } from '@/data/price-request-repository';
import { useAppTheme } from '@/theme/theme-provider';

export function PriceRequestsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { membership } = useAuth();
  const [requests, setRequests] = useState<PriceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (membership?.role !== 'owner') return;
    return subscribeToPendingPriceRequests(
      membership.storeId,
      (items) => { setRequests(items); setLoading(false); },
      () => { setError(true); setLoading(false); },
    );
  }, [membership, retryKey]);

  if (membership?.role !== 'owner') {
    return <ScreenState icon="shield-lock-outline" title="Owner access required" body="Only the store owner can answer price requests." />;
  }

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={requests}
      keyExtractor={(item) => item.barcode}
      ListHeaderComponent={<View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>Price requests</Text>
        <Text style={[styles.body, { color: theme.colors.textMuted }]}>Answer once, then every linked Bantay will see the same owner-set price.</Text>
      </View>}
      ListEmptyComponent={loading ? null : error ? <View style={styles.empty}>
        <MaterialCommunityIcons name="wifi-alert" size={42} color={theme.colors.error} />
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Requests unavailable</Text>
        <Text style={[styles.emptyBody, { color: theme.colors.textMuted }]}>Connect to the internet and try again.</Text>
        <AppButton label="Try again" variant="secondary" onPress={() => {
          setLoading(true);
          setError(false);
          setRetryKey((current) => current + 1);
        }} />
      </View> : <View style={styles.empty}>
        <View style={[styles.emptyIcon, { backgroundColor: theme.colors.surfaceMuted }]}><MaterialCommunityIcons name="check-all" size={40} color={theme.colors.success} /></View>
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No prices waiting</Text>
        <Text style={[styles.emptyBody, { color: theme.colors.textMuted }]}>Your Bantays have answers for everything they scanned.</Text>
      </View>}
      renderItem={({ item }) => <Pressable
        accessibilityLabel={`Answer price request for ${item.name ?? item.barcode}`}
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/product/add', params: {
          barcode: item.barcode, name: item.name ?? '', brand: item.brand ?? '', quantity: item.quantity ?? '',
          imageUrl: item.imageUrl ?? '', source: item.source, requestBarcode: item.barcode,
        } })}
        style={({ pressed }) => [styles.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, pressed && styles.pressed]}
      >
        <View style={[styles.rowIcon, { backgroundColor: theme.colors.surfaceMuted }]}><MaterialCommunityIcons name="tag-search-outline" size={25} color={theme.colors.navigationActive} /></View>
        <View style={styles.rowCopy}>
          <Text numberOfLines={2} style={[styles.rowTitle, { color: theme.colors.text }]}>{item.name ?? 'Unknown product'}</Text>
          <Text numberOfLines={1} style={[styles.barcode, { color: theme.colors.textMuted }]}>{item.barcode}</Text>
          <Text style={[styles.time, { color: theme.colors.textMuted }]}>{item.requestedAt.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</Text>
        </View>
        <MaterialCommunityIcons name="arrow-right" size={23} color={theme.colors.textMuted} />
      </Pressable>}
    />
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', gap: 12, padding: 20, paddingBottom: 40 },
  header: { gap: 8, paddingBottom: 12 },
  title: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 28, lineHeight: 35 },
  body: { fontFamily: 'Montserrat_500Medium', fontSize: 14, lineHeight: 22 },
  row: { minHeight: 104, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 18, padding: 16 },
  rowIcon: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  rowCopy: { flex: 1, gap: 3 },
  rowTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 15, lineHeight: 20 },
  barcode: { fontFamily: 'Montserrat_600SemiBold', fontSize: 11 },
  time: { fontFamily: 'Montserrat_500Medium', fontSize: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 30 },
  emptyIcon: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  emptyTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 20, textAlign: 'center' },
  emptyBody: { fontFamily: 'Montserrat_500Medium', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  pressed: { opacity: 0.7 },
});
