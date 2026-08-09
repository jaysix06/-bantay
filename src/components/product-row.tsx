import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProductImage } from '@/components/product-image';
import { formatPrice, type Product } from '@/domain/product';
import { useAppTheme } from '@/theme/theme-provider';

export function ProductRow({ product, onPress }: { product: Product; onPress: () => void }) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatPrice(product.priceCentavos)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.colors.border },
        pressed && { backgroundColor: theme.colors.surfaceMuted },
      ]}
    >
      <ProductImage
        imageUrl={product.imageUrl}
        productName={product.name}
        variant="thumbnail"
      />
      <View style={styles.copy}>
        <Text selectable numberOfLines={2} style={[styles.name, { color: theme.colors.text }]}>
          {product.name}
        </Text>
        <Text selectable numberOfLines={1} style={[styles.meta, { color: theme.colors.textMuted }]}>
          {[product.brand, product.quantity].filter(Boolean).join(' · ') || product.barcode}
        </Text>
      </View>
      <View style={[styles.priceChip, { backgroundColor: theme.colors.priceLabel }]}>
        <Text selectable style={[styles.price, { color: theme.colors.onPrimary }]}>
          {formatPrice(product.priceCentavos)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  copy: { flex: 1, gap: 4 },
  name: { fontFamily: 'Montserrat_700Bold', fontSize: 15, lineHeight: 20 },
  meta: { fontFamily: 'Montserrat_500Medium', fontSize: 12, lineHeight: 17 },
  priceChip: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  price: { fontFamily: 'Montserrat_700Bold', fontSize: 14, fontVariant: ['tabular-nums'] },
});
