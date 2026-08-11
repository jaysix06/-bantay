import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/auth-provider';
import { AppButton } from '@/components/app-button';
import { ProductRow } from '@/components/product-row';
import { listProducts } from '@/data/product-repository';
import type { Product } from '@/domain/product';
import { useAppTheme } from '@/theme/theme-provider';

export function PricesScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const db = useSQLiteContext();
  const { membership, syncRevision } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      void retryKey;
      void syncRevision;
      let active = true;
      setLoading(true);
      setError(false);
      if (!membership) return;
      void listProducts(db, membership.storeId)
        .then((items) => {
          if (active) setProducts(items);
        })
        .catch(() => {
          if (active) setError(true);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [db, membership, retryKey, syncRevision]),
  );

  const editProduct = (product: Product) => {
    router.push({
      pathname: '/product/add',
      params: {
        barcode: product.barcode,
        name: product.name,
        brand: product.brand ?? '',
        quantity: product.quantity ?? '',
        imageUrl: product.imageUrl ?? '',
        source: product.source,
        price: (product.priceCentavos / 100).toFixed(2),
        mode: 'edit',
      },
    });
  };

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      data={products}
      keyExtractor={(product) => product.barcode}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <ProductRow
          product={item}
          onPress={() =>
            membership?.role === 'owner'
              ? editProduct(item)
              : router.push({ pathname: '/product/[barcode]', params: { barcode: item.barcode } })
          }
        />
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.copy}>
            <Text selectable style={[styles.title, { color: theme.colors.text }]}>
              Store price book
            </Text>
            <Text selectable style={[styles.body, { color: theme.colors.textMuted }]}>
              These are the prices saved by the store owner and available offline.
            </Text>
          </View>
          {membership?.role === 'owner' ? (
            <AppButton
              label="Add product"
              icon={
                <MaterialCommunityIcons name="plus" size={22} color={theme.colors.onPrimary} />
              }
              onPress={() => router.push('/product/add')}
            />
          ) : null}
        </View>
      }
      ListEmptyComponent={
        loading ? null : error ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="database-alert-outline" size={42} color={theme.colors.error} />
            <Text selectable style={[styles.emptyTitle, { color: theme.colors.text }]}>Price book unavailable</Text>
            <Text selectable style={[styles.emptyBody, { color: theme.colors.textMuted }]}>Bantay could not load saved prices from this device.</Text>
            <AppButton label="Try again" variant="secondary" onPress={() => setRetryKey((value) => value + 1)} />
          </View>
        ) : (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.colors.surfaceMuted }]}>
              <MaterialCommunityIcons name="tag-plus-outline" size={40} color={theme.colors.primary} />
            </View>
            <Text selectable style={[styles.emptyTitle, { color: theme.colors.text }]}>
              Start your price book
            </Text>
            <Text selectable style={[styles.emptyBody, { color: theme.colors.textMuted }]}>
              Save a product once, then anyone can identify its price by scanning or searching.
            </Text>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 32 },
  header: { gap: 20, paddingTop: 16, paddingBottom: 20 },
  copy: { gap: 8 },
  title: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 27, lineHeight: 34 },
  body: { fontFamily: 'Montserrat_500Medium', fontSize: 14, lineHeight: 22 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 },
  emptyIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 20, textAlign: 'center' },
  emptyBody: { fontFamily: 'Montserrat_500Medium', fontSize: 14, lineHeight: 22, textAlign: 'center' },
});
