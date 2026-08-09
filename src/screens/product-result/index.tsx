import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { PriceLabel } from '@/components/price-label';
import { ProductImage } from '@/components/product-image';
import { ProductResultAction, ProductResultHeader } from '@/components/product-result-chrome';
import { ScreenState } from '@/components/screen-state';
import { cacheCatalogProduct, findCachedCatalogProduct } from '@/data/catalog-repository';
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
  const insets = useSafeAreaInsets();
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
      let hasStaleCachedProduct = false;
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
        const cached = await findCachedCatalogProduct(validBarcode);
        if (cached) {
          setState({ status: 'external', product: cached.product });
          if (!cached.isStale) return;
          hasStaleCachedProduct = true;
        }
      } catch {
        // A cloud cache miss must never block the direct catalog fallback.
      }

      try {
        const lookup = await fetchProductFromOpenFoodFacts(validBarcode, controller.signal);
        if (lookup) {
          setState({ status: 'external', product: lookup.product });
          void cacheCatalogProduct(lookup).catch(() => undefined);
        } else {
          if (!hasStaleCachedProduct) {
            setState({ status: 'missing', barcode: validBarcode, offline: false });
          }
        }
      } catch {
        if (!controller.signal.aborted && !hasStaleCachedProduct) {
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
      <>
        <ScrollView
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={[
            styles.resultContent,
            { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
          ]}
        >
          <ProductResultHeader onMenuPress={() => router.replace('/(tabs)')} />
          <ProductImage imageUrl={state.product.imageUrl} productName={state.product.name} />
          <PriceLabel product={state.product} />
          <AppButton label="Set store price" onPress={() => openProductForm(state.product)} />
          <ProductResultAction
            icon="barcode-scan"
            title="Scan another"
            subtitle="Use the camera to scan a barcode"
            onPress={() => router.replace('/(tabs)')}
          />
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[
          styles.resultContent,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <ProductResultHeader onMenuPress={() => router.replace('/(tabs)')} />
        <ProductImage imageUrl={state.product.imageUrl} productName={state.product.name} />
        <PriceLabel product={state.product} />
        <View style={styles.actions}>
        <ProductResultAction
          icon="barcode-scan"
          title="Scan another"
          subtitle="Use the camera to scan a barcode"
          onPress={() => router.replace('/(tabs)')}
        />
        <ProductResultAction
          icon="magnify"
          title="Search products"
          subtitle="Find products by name"
          onPress={() => router.replace('/search')}
        />
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
    </>
  );
}

const styles = StyleSheet.create({
  resultContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    gap: 16,
    paddingHorizontal: 18,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  loadingText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 15 },
  actions: { gap: 0 },
});
