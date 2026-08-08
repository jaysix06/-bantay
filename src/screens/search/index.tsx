import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

import { ProductRow } from '@/components/product-row';
import { AppButton } from '@/components/app-button';
import { searchStoredProducts } from '@/data/product-repository';
import type { Product } from '@/domain/product';
import { useAppTheme } from '@/theme/theme-provider';

export function SearchScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const db = useSQLiteContext();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((current) => current + 1);
    }, []),
  );

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      setLoading(true);
      setError(false);
      void searchStoredProducts(db, query)
        .then((results) => {
          if (!cancelled) setProducts(results);
        })
        .catch(() => {
          if (!cancelled) setError(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [db, query, refreshKey]);

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      data={products}
      keyExtractor={(product) => product.barcode}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <ProductRow
          product={item}
          onPress={() =>
            router.push({ pathname: '/product/[barcode]', params: { barcode: item.barcode } })
          }
        />
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <MaterialCommunityIcons name="magnify" size={24} color={theme.colors.textMuted} />
            <TextInput
              accessibilityLabel="Search saved products"
              value={query}
              onChangeText={setQuery}
              placeholder="Search product, brand, or barcode"
              placeholderTextColor={theme.colors.textMuted}
              returnKeyType="search"
              maxLength={120}
              style={[styles.searchInput, { color: theme.colors.text }]}
            />
          </View>
          <Text selectable style={[styles.helper, { color: theme.colors.textMuted }]}>
            Search only checks prices already saved by your store.
          </Text>
        </View>
      }
      ListEmptyComponent={
        loading ? null : error ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="database-alert-outline" size={42} color={theme.colors.error} />
            <Text selectable style={[styles.emptyTitle, { color: theme.colors.text }]}>Search unavailable</Text>
            <Text selectable style={[styles.emptyBody, { color: theme.colors.textMuted }]}>Bantay could not search the saved price book.</Text>
            <AppButton label="Try again" variant="secondary" onPress={() => setRefreshKey((value) => value + 1)} />
          </View>
        ) : (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="tag-search-outline" size={42} color={theme.colors.primary} />
            <Text selectable style={[styles.emptyTitle, { color: theme.colors.text }]}>
              {query ? 'No saved price matches' : 'No prices saved yet'}
            </Text>
            <Text selectable style={[styles.emptyBody, { color: theme.colors.textMuted }]}>
              {query
                ? 'Try another product name, brand, or barcode.'
                : 'Add a product from the Prices tab or scan its barcode.'}
            </Text>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 32 },
  header: { gap: 10, paddingTop: 12, paddingBottom: 16 },
  searchBox: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
  },
  searchInput: { flex: 1, fontFamily: 'Montserrat_500Medium', fontSize: 15 },
  helper: { fontFamily: 'Montserrat_500Medium', fontSize: 12, lineHeight: 18 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 28 },
  emptyTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 19, textAlign: 'center' },
  emptyBody: { fontFamily: 'Montserrat_500Medium', fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
