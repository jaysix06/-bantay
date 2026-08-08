import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { formatPrice, type Product } from '@/domain/product';
import { useAppTheme } from '@/theme/theme-provider';

export function PriceLabel({ product }: { product: Product }) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const priceSize = width < 360 ? 48 : 58;
  const updated = new Date(product.updatedAt).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View
      accessible
      accessibilityLabel={`${product.name}, ${formatPrice(product.priceCentavos)}`}
      style={[
        styles.label,
        {
          backgroundColor: theme.colors.priceLabel,
          borderColor: theme.colors.priceLabelBorder,
          boxShadow: theme.isDark
            ? '0 12px 28px rgba(0, 0, 0, 0.36)'
            : '0 12px 28px rgba(92, 48, 13, 0.14)',
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.notch,
          styles.notchLeft,
          { backgroundColor: theme.colors.background, borderColor: theme.colors.priceLabelBorder },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.notch,
          styles.notchRight,
          { backgroundColor: theme.colors.background, borderColor: theme.colors.priceLabelBorder },
        ]}
      />
      <View style={styles.heading}>
        <View style={styles.productCopy}>
          <Text selectable style={[styles.name, { color: theme.colors.onPrimary }]}>
            {product.name}
          </Text>
          {product.brand || product.quantity ? (
            <Text selectable style={[styles.meta, { color: '#68401F' }]}>
              {[product.brand, product.quantity].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </View>
        <MaterialCommunityIcons name="tag" size={28} color="#68401F" />
      </View>

      <View style={[styles.divider, { backgroundColor: 'rgba(104, 64, 31, 0.26)' }]} />

      <Text style={[styles.priceLabel, { color: '#3A1909' }]}>STORE PRICE</Text>
      <Text
        selectable
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.68}
        style={[styles.price, { color: '#2C1206', fontSize: priceSize }]}
      >
        {formatPrice(product.priceCentavos)}
      </Text>

      <View style={[styles.sourceRow, { backgroundColor: 'rgba(255, 255, 255, 0.48)' }]}>
        <MaterialCommunityIcons name="barcode" size={24} color="#4A2814" />
        <Text selectable numberOfLines={1} style={[styles.barcode, { color: '#4A2814' }]}>
          {product.barcode}
        </Text>
      </View>

      <Text selectable style={[styles.updated, { color: '#68401F' }]}>
        Updated {updated}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    gap: 12,
    borderWidth: 2,
    borderRadius: 26,
    borderCurve: 'continuous',
    padding: 24,
    overflow: 'visible',
  },
  notch: {
    position: 'absolute',
    top: 96,
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 12,
    zIndex: 2,
  },
  notchLeft: { left: -14 },
  notchRight: { right: -14 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  productCopy: { flex: 1, gap: 4 },
  name: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 22, lineHeight: 28 },
  meta: { fontFamily: 'Montserrat_600SemiBold', fontSize: 14, lineHeight: 20 },
  divider: { height: 1 },
  priceLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 12, letterSpacing: 0.8 },
  price: {
    fontFamily: 'Montserrat_800ExtraBold',
    lineHeight: 68,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  sourceRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  barcode: { flex: 1, fontFamily: 'Montserrat_600SemiBold', fontSize: 13 },
  updated: { fontFamily: 'Montserrat_500Medium', fontSize: 12, textAlign: 'center' },
});
