import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { formatPrice, parseProductTimestamp, type ProductDraft } from '@/domain/product';
import { useAppTheme } from '@/theme/theme-provider';

export function PriceLabel({ product }: { product: ProductDraft }) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const priceSize = width < 360 ? 58 : 72;
  const priceCentavos = product.priceCentavos;
  const hasPrice = priceCentavos !== null;
  const displayedPrice = priceCentavos === null ? 'NOT SET' : formatPrice(priceCentavos);
  const timestamp = parseProductTimestamp(product.updatedAt);
  const updated = timestamp
    ? timestamp.toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'recently';
  const detailColor = '#5B3318';
  const stripBackground = theme.isDark ? '#17120E' : 'rgba(255, 255, 255, 0.84)';
  const stripText = theme.isDark ? '#FFF1D9' : '#3F1D0D';
  const usesOpenFoodFacts = product.source === 'open_food_facts';

  return (
    <View
      accessible
      accessibilityLabel={`${product.name}, ${hasPrice ? `store price ${displayedPrice}` : 'store price not set'}`}
      style={[
        styles.tag,
        {
          backgroundColor: theme.colors.priceLabel,
          borderColor: theme.colors.priceLabelBorder,
          boxShadow: theme.isDark
            ? '0 16px 32px rgba(0, 0, 0, 0.42)'
            : '0 16px 32px rgba(92, 48, 13, 0.18)',
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[styles.cornerCut, styles.cornerCutLeft, { backgroundColor: theme.colors.background }]}
      />
      <View
        pointerEvents="none"
        style={[styles.cornerCut, styles.cornerCutRight, { backgroundColor: theme.colors.background }]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.tagHole,
          { backgroundColor: theme.colors.background, borderColor: theme.colors.priceLabelBorder },
        ]}
      />

      <View style={styles.productBlock}>
        {product.brand ? (
          <Text selectable numberOfLines={2} style={[styles.brand, { color: theme.colors.onPrimary }]}>
            {product.brand.toLocaleUpperCase('en-PH')}
          </Text>
        ) : null}
        <Text selectable numberOfLines={2} style={[styles.name, { color: theme.colors.onPrimary }]}>
          {product.name}
        </Text>
        {product.quantity ? (
          <Text selectable style={[styles.quantity, { color: detailColor }]}>
            {product.quantity}
          </Text>
        ) : null}
      </View>

      <View style={[styles.divider, { borderColor: 'rgba(91, 51, 24, 0.34)' }]} />

      <Text style={[styles.priceLabel, { color: detailColor }]}>PRICE</Text>
      <Text
        selectable
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.58}
        style={[styles.price, { color: theme.colors.onPrimary, fontSize: priceSize }]}
      >
        {displayedPrice}
      </Text>

      <View style={styles.priceContext}>
        <View style={[styles.storeBadge, { borderColor: detailColor }]}>
          <Text style={[styles.storeBadgeText, { color: detailColor }]}>{hasPrice ? 'STORE' : 'NEW'}</Text>
        </View>
        <Text selectable style={[styles.priceContextText, { color: detailColor }]}>
          {hasPrice ? 'Owner-set price' : 'Store price required'}
        </Text>
      </View>

      <View style={[styles.sourcePanel, { backgroundColor: stripBackground }]}>
        <View style={styles.sourceRow}>
          <MaterialCommunityIcons name="barcode" size={28} color={stripText} />
          <Text selectable numberOfLines={1} style={[styles.barcode, { color: stripText }]}>
            {product.barcode}
          </Text>
          <View style={[styles.sourceDivider, { backgroundColor: theme.colors.border }]} />
          <Text selectable numberOfLines={1} style={[styles.source, { color: stripText }]}>
            {hasPrice ? 'Price: Store owner' : 'Data: Open Food Facts'}
          </Text>
        </View>
        <View style={[styles.timestampDivider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.updatedRow}>
          <MaterialCommunityIcons name="clock-outline" size={17} color={stripText} />
          <Text selectable style={[styles.updated, { color: stripText }]}>
            {hasPrice ? 'Price updated' : 'Catalog checked'} {updated}
            {usesOpenFoodFacts && hasPrice ? ' · Data: Open Food Facts' : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    position: 'relative',
    gap: 12,
    borderWidth: 2,
    borderRadius: 24,
    borderCurve: 'continuous',
    paddingHorizontal: 24,
    paddingTop: 88,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  cornerCut: { position: 'absolute', top: -26, width: 58, height: 58, transform: [{ rotate: '45deg' }] },
  cornerCutLeft: { left: -30 },
  cornerCutRight: { right: -30 },
  tagHole: {
    position: 'absolute',
    top: 22,
    left: '50%',
    width: 38,
    height: 38,
    marginLeft: -19,
    borderWidth: 1.5,
    borderRadius: 19,
  },
  productBlock: { gap: 2 },
  brand: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 22, lineHeight: 27 },
  name: { fontFamily: 'Montserrat_700Bold', fontSize: 18, lineHeight: 24 },
  quantity: { fontFamily: 'Montserrat_500Medium', fontSize: 17, lineHeight: 24 },
  divider: { height: 1, marginVertical: 8, borderTopWidth: 1.5, borderStyle: 'dashed' },
  priceLabel: { fontFamily: 'Montserrat_600SemiBold', fontSize: 13 },
  price: {
    fontFamily: 'Montserrat_800ExtraBold',
    lineHeight: 82,
    letterSpacing: -2.5,
    fontVariant: ['tabular-nums'],
  },
  priceContext: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -2, marginBottom: 10 },
  storeBadge: { borderWidth: 1.5, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  storeBadgeText: { fontFamily: 'Montserrat_700Bold', fontSize: 11 },
  priceContextText: { fontFamily: 'Montserrat_500Medium', fontSize: 14 },
  sourcePanel: { borderRadius: 12, overflow: 'hidden' },
  sourceRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 },
  barcode: { flexShrink: 1, fontFamily: 'Montserrat_600SemiBold', fontSize: 12 },
  sourceDivider: { width: 1, height: 28, marginHorizontal: 4 },
  source: { flexShrink: 1, fontFamily: 'Montserrat_500Medium', fontSize: 11 },
  timestampDivider: { height: StyleSheet.hairlineWidth },
  updatedRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 10 },
  updated: { fontFamily: 'Montserrat_500Medium', fontSize: 11, textAlign: 'center' },
});
