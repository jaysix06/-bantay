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
  const { user, signOut } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      void retryKey;
      let active = true;
      setLoading(true);
      setError(false);
      void listProducts(db)
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
    }, [db, retryKey]),
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
      renderItem={({ item }) => <ProductRow product={item} onPress={() => editProduct(item)} />}
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
          <View
            style={[
              styles.account,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.accountCopy}>
              <Text selectable numberOfLines={1} style={[styles.accountLabel, { color: theme.colors.textMuted }]}>SIGNED IN</Text>
              <Text selectable numberOfLines={1} style={[styles.accountEmail, { color: theme.colors.text }]}>{user?.email ?? 'Google account'}</Text>
            </View>
            <AppButton label="Sign out" variant="text" onPress={() => void signOut()} />
          </View>
          <AppButton
            label="Add product"
            icon={
              <MaterialCommunityIcons name="plus" size={22} color={theme.colors.onPrimary} />
            }
            onPress={() => router.push('/product/add')}
          />
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
  account: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 16, borderCurve: 'continuous', paddingLeft: 16, paddingRight: 4 },
  accountCopy: { flex: 1, gap: 3 },
  accountLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 10, letterSpacing: 1.1 },
  accountEmail: { fontFamily: 'Montserrat_600SemiBold', fontSize: 13 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 },
  emptyIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 20, textAlign: 'center' },
  emptyBody: { fontFamily: 'Montserrat_500Medium', fontSize: 14, lineHeight: 22, textAlign: 'center' },
});
