import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-provider';
import { AppButton } from '@/components/app-button';
import { PriceLabel } from '@/components/price-label';
import { ProductResultAction, ProductResultHeader } from '@/components/product-result-chrome';
import { ScreenState } from '@/components/screen-state';
import { cacheCatalogProduct } from '@/data/catalog-repository';
import { fetchCloudProduct, saveCloudProductLocally } from '@/data/cloud-product-repository';
import { fetchProductFromOpenFoodFacts } from '@/data/open-food-facts';
import { findCatalogProductByBarcode, findProductByBarcode } from '@/data/product-repository';
import { submitPriceRequest } from '@/data/price-request-repository';
import { normalizeBarcode, type Product, type ProductDraft } from '@/domain/product';
import { useAppTheme } from '@/theme/theme-provider';

import { returnFromProductResult } from './navigation';

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
  const { membership, syncRevision, user } = useAuth();
  const params = useLocalSearchParams<{ barcode: string }>();
  const barcode = normalizeBarcode(params.barcode ?? '');
  const [state, setState] = useState<LookupState>(
    barcode ? { status: 'loading' } : { status: 'invalid' },
  );
  const [retryKey, setRetryKey] = useState(0);
  const [requestState, setRequestState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const returnToPreviousScreen = () => returnFromProductResult(router);

  useEffect(() => {
    void syncRevision;
    if (!barcode) {
      return;
    }
    const validBarcode = barcode;

    const controller = new AbortController();

    async function lookup() {
      if (!membership) return;
      let local: Product | null;
      try {
        local = await findProductByBarcode(db, membership.storeId, validBarcode);
      } catch {
        if (!controller.signal.aborted) setState({ status: 'error', barcode: validBarcode });
        return;
      }
      if (local) {
        setState({ status: 'found', product: local });
        return;
      }

      const localCatalog = await findCatalogProductByBarcode(db, validBarcode).catch(() => null);

      try {
        const cloud = await fetchCloudProduct(membership.storeId, validBarcode);
        if (cloud.catalog) await saveCloudProductLocally(db, membership.storeId, cloud);
        if (cloud.product) {
          setState({ status: 'found', product: cloud.product });
          return;
        }
        if (cloud.catalog) {
          setState({ status: 'external', product: cloud.catalog });
          return;
        }
      } catch {
        if (localCatalog) {
          setState({ status: 'external', product: localCatalog });
          return;
        }
      }

      if (localCatalog) {
        setState({ status: 'external', product: localCatalog });
        return;
      }

      try {
        const lookup = await fetchProductFromOpenFoodFacts(validBarcode, controller.signal);
        if (lookup) {
          setState({ status: 'external', product: lookup.product });
          if (user) void cacheCatalogProduct(db, lookup, user.uid).catch(() => undefined);
        } else {
          setState({ status: 'missing', barcode: validBarcode, offline: false });
        }
      } catch {
        if (!controller.signal.aborted) {
          setState({ status: 'missing', barcode: validBarcode, offline: true });
        }
      }
    }

    void lookup();
    return () => controller.abort();
  }, [barcode, db, membership, retryKey, syncRevision, user]);

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

  const askOwner = async (product: ProductDraft) => {
    if (!user || membership?.role !== 'bantay') return;
    setRequestState('sending');
    try {
      await submitPriceRequest(membership.storeId, user.uid, product);
      setRequestState('sent');
    } catch {
      setRequestState('error');
    }
  };

  const requestAction = (product: ProductDraft) => {
    if (membership?.role !== 'bantay') return null;
    if (requestState === 'sent') {
      return (
        <View accessibilityLiveRegion="polite" style={[styles.requestStatus, { backgroundColor: theme.colors.surfaceMuted }]}>
          <Text style={[styles.requestTitle, { color: theme.colors.text }]}>Request sent</Text>
          <Text style={[styles.requestBody, { color: theme.colors.textMuted }]}>The owner only needs to answer once. This price will update for every linked Bantay.</Text>
        </View>
      );
    }
    return (
      <View style={styles.requestAction}>
        <AppButton
          disabled={requestState === 'sending'}
          label={requestState === 'sending' ? 'Sending request…' : requestState === 'error' ? 'Try asking again' : 'Ask the owner'}
          onPress={() => void askOwner(product)}
        />
        {requestState === 'error' ? (
          <Text accessibilityRole="alert" style={[styles.requestError, { color: theme.colors.error }]}>Connect to the internet and try again. Saved prices still work offline.</Text>
        ) : null}
      </View>
    );
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
        {membership?.role === 'owner' ? (
          <AppButton label="Save product and price" onPress={() => openProductForm(draft)} />
        ) : null}
        {requestAction(draft)}
        <AppButton label="Scan another" variant="secondary" onPress={() => router.replace('/scan')} />
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
          <ProductResultHeader onBackPress={returnToPreviousScreen} />
          <PriceLabel product={state.product} />
          {membership?.role === 'owner' ? (
            <AppButton label="Set store price" onPress={() => openProductForm(state.product)} />
          ) : null}
          {requestAction(state.product)}
          <ProductResultAction
            icon="barcode-scan"
            title="Scan another"
            subtitle="Use the camera to scan a barcode"
            onPress={() => router.replace('/scan')}
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
        <ProductResultHeader onBackPress={returnToPreviousScreen} />
        <PriceLabel product={state.product} />
        <View style={styles.actions}>
        <ProductResultAction
          icon="barcode-scan"
          title="Scan another"
          subtitle="Use the camera to scan a barcode"
          onPress={() => router.replace('/scan')}
        />
        <ProductResultAction
          icon="magnify"
          title="Search products"
          subtitle="Find products by name"
          onPress={() => router.replace('/search')}
        />
        {membership?.role === 'owner' ? (
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
        ) : null}
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
  requestAction: { gap: 10 },
  requestStatus: { gap: 5, borderRadius: 14, padding: 16 },
  requestTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 15 },
  requestBody: { fontFamily: 'Montserrat_500Medium', fontSize: 12, lineHeight: 18 },
  requestError: { fontFamily: 'Montserrat_600SemiBold', fontSize: 12, lineHeight: 18 },
});
