import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { PriceLabel } from '@/components/price-label';
import { ScreenState } from '@/components/screen-state';
import { fetchProductFromOpenFoodFacts } from '@/data/open-food-facts';
import { findProductByBarcode } from '@/data/product-repository';
import { normalizeBarcode, type Product, type ProductDraft } from '@/domain/product';
import { useAppTheme } from '@/theme/theme-provider';

type LookupState =
  | { status: 'loading' }
  | { status: 'found'; product: Product }
  | { status: 'external'; product: ProductDraft }
  | { status: 'missing'; barcode: string; offline: boolean }
  | { status: 'error'; barcode: string }
  | { status: 'invalid' };

export function ProductResultScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ barcode: string }>();
  const barcode = normalizeBarcode(params.barcode ?? '');
  const [state, setState] = useState<LookupState>(
    barcode ? { status: 'loading' } : { status: 'invalid' },
  );
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!barcode) {
      return;
    }
    const validBarcode = barcode;

    const controller = new AbortController();

    async function lookup() {
      let local: Product | null;
      try {
        local = await findProductByBarcode(db, validBarcode);
      } catch {
        if (!controller.signal.aborted) setState({ status: 'error', barcode: validBarcode });
        return;
      }
      if (local) {
        setState({ status: 'found', product: local });
        return;
      }

      try {
        const external = await fetchProductFromOpenFoodFacts(validBarcode, controller.signal);
        setState(
          external
            ? { status: 'external', product: external }
            : { status: 'missing', barcode: validBarcode, offline: false },
        );
      } catch {
        if (!controller.signal.aborted) {
          setState({ status: 'missing', barcode: validBarcode, offline: true });
        }
      }
    }

    void lookup();
    return () => controller.abort();
  }, [barcode, db, retryKey]);

  const openProductForm = (product: ProductDraft, mode: 'create' | 'edit' = 'create') => {
    router.push({
      pathname: '/product/add',
      params: {
        barcode: product.barcode,
        name: product.name,
        brand: product.brand ?? '',
        quantity: product.quantity ?? '',
        imageUrl: product.imageUrl ?? '',
        source: product.source,
        price:
          product.priceCentavos === null ? '' : (product.priceCentavos / 100).toFixed(2),
        mode,
      },
    });
  };

  if (state.status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text selectable style={[styles.loadingText, { color: theme.colors.textMuted }]}>
          Checking saved prices…
        </Text>
      </View>
    );
  }

  if (state.status === 'invalid') {
    return (
      <ScreenState
        icon="barcode-off"
        title="That barcode is not valid"
        body="Try scanning again or enter the digits printed below the barcode."
      >
        <AppButton label="Enter barcode" onPress={() => router.replace('/manual')} />
      </ScreenState>
    );
  }

  if (state.status === 'error') {
    return (
      <ScreenState
        icon="database-alert-outline"
        title="Saved prices are unavailable"
        body="Bantay could not read the price book on this device. Try again."
      >
        <AppButton
          label="Try again"
          onPress={() => {
            setState({ status: 'loading' });
            setRetryKey((value) => value + 1);
          }}
        />
      </ScreenState>
    );
  }

  if (state.status === 'missing') {
    const draft: ProductDraft = {
      barcode: state.barcode,
      name: '',
      brand: null,
      quantity: null,
      imageUrl: null,
      priceCentavos: null,
      source: 'manual',
      updatedAt: new Date().toISOString(),
    };

    return (
      <ScreenState
        icon={state.offline ? 'wifi-off' : 'tag-search-outline'}
        title="Price not saved yet"
        body={
          state.offline
            ? 'Bantay could not check the online catalog. You can still save this product manually.'
            : 'This barcode is not in your store catalog or Open Food Facts.'
        }
      >
        <AppButton label="Save product and price" onPress={() => openProductForm(draft)} />
        <AppButton label="Scan another" variant="secondary" onPress={() => router.replace('/(tabs)')} />
      </ScreenState>
    );
  }

  if (state.status === 'external') {
    return (
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <View style={[styles.foundOnline, { backgroundColor: theme.colors.surfaceMuted }]}>
          <MaterialCommunityIcons name="cloud-check-outline" size={30} color={theme.colors.success} />
          <View style={styles.foundCopy}>
            <Text selectable style={[styles.foundTitle, { color: theme.colors.text }]}>
              Product found online
            </Text>
            <Text selectable style={[styles.foundBody, { color: theme.colors.textMuted }]}>
              General details came from Open Food Facts. Your store price is still yours to set.
            </Text>
          </View>
        </View>
        <View style={styles.externalProduct}>
          <Text selectable style={[styles.externalName, { color: theme.colors.text }]}>
            {state.product.name}
          </Text>
          <Text selectable style={[styles.externalMeta, { color: theme.colors.textMuted }]}>
            {[state.product.brand, state.product.quantity].filter(Boolean).join(' · ') || state.product.barcode}
          </Text>
        </View>
        <AppButton label="Set store price" onPress={() => openProductForm(state.product)} />
        <AppButton label="Scan another" variant="secondary" onPress={() => router.replace('/(tabs)')} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <PriceLabel product={state.product} />
      <View style={styles.actions}>
        <AppButton
          label="Scan another"
          icon={
            <MaterialCommunityIcons name="barcode-scan" size={22} color={theme.colors.onPrimary} />
          }
          onPress={() => router.replace('/(tabs)')}
        />
        <AppButton label="Search products" variant="secondary" onPress={() => router.replace('/search')} />
        <AppButton
          label="Edit saved price"
          variant="text"
          onPress={() =>
            openProductForm(
              { ...state.product, priceCentavos: state.product.priceCentavos },
              'edit',
            )
          }
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: 24, padding: 20 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  loadingText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 15 },
  actions: { gap: 12 },
  foundOnline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderRadius: 18,
    borderCurve: 'continuous',
    padding: 18,
  },
  foundCopy: { flex: 1, gap: 5 },
  foundTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 16 },
  foundBody: { fontFamily: 'Montserrat_500Medium', fontSize: 13, lineHeight: 20 },
  externalProduct: { flex: 1, justifyContent: 'center', gap: 8, paddingVertical: 32 },
  externalName: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 30, lineHeight: 37 },
  externalMeta: { fontFamily: 'Montserrat_500Medium', fontSize: 15, lineHeight: 22 },
});
