import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/auth/auth-provider';
import { AppButton } from '@/components/app-button';
import { ScreenState } from '@/components/screen-state';
import {
  createProductWithPrice,
  DuplicateBarcodeError,
  updateProductWithPrice,
} from '@/data/product-repository';
import { markPriceRequestAnswered } from '@/data/price-request-repository';
import { normalizeBarcode, parsePriceInput, type ProductSource } from '@/domain/product';
import { useAppTheme } from '@/theme/theme-provider';

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  maxLength,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  maxLength?: number;
  editable?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        keyboardType={keyboardType}
        maxLength={maxLength}
        editable={editable}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            color: theme.colors.text,
            opacity: editable ? 1 : 0.62,
          },
        ]}
      />
    </View>
  );
}

export function ProductFormScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const db = useSQLiteContext();
  const { membership, syncNow, user } = useAuth();
  const params = useLocalSearchParams<{
    barcode?: string;
    name?: string;
    brand?: string;
    quantity?: string;
    imageUrl?: string;
    source?: string;
    price?: string;
    mode?: 'create' | 'edit';
    requestBarcode?: string;
  }>();
  const isEditing = params.mode === 'edit';
  const isAnsweringRequest = Boolean(params.requestBarcode);
  const [barcode, setBarcode] = useState(params.barcode ?? '');
  const [name, setName] = useState(params.name ?? '');
  const [brand, setBrand] = useState(params.brand ?? '');
  const [quantity, setQuantity] = useState(params.quantity ?? '');
  const [price, setPrice] = useState(params.price ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user || membership?.role !== 'owner') {
      setError('Only the store owner can save products and prices.');
      return;
    }
    const normalizedBarcode = normalizeBarcode(barcode);
    const priceCentavos = parsePriceInput(price);

    if (!normalizedBarcode) {
      setError('Enter a valid barcode containing 6 to 18 digits.');
      return;
    }
    if (!name.trim()) {
      setError('Enter the product name.');
      return;
    }
    if (priceCentavos === null) {
      setError('Enter a valid store price, such as 18.50.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const source: ProductSource =
        params.source === 'open_food_facts' ? 'open_food_facts' : 'manual';
      const writeProduct = isEditing || isAnsweringRequest ? updateProductWithPrice : createProductWithPrice;
      await writeProduct(
        db,
        membership.storeId,
        user.uid,
        {
          barcode: normalizedBarcode,
          name: name.trim(),
          brand: brand.trim() || null,
          quantity: quantity.trim() || null,
          imageUrl: params.imageUrl || null,
          priceCentavos,
          source,
          updatedAt: new Date().toISOString(),
        },
        priceCentavos,
      );
      await syncNow();
      if (params.requestBarcode) {
        await markPriceRequestAnswered(membership.storeId, params.requestBarcode).catch(() => undefined);
      }
      router.replace({ pathname: '/product/[barcode]', params: { barcode: normalizedBarcode } });
    } catch (saveError) {
      setError(
        saveError instanceof DuplicateBarcodeError
          ? 'A saved product already uses this barcode. Open it from Prices to edit it.'
          : 'Bantay could not save this price. Try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (membership?.role !== 'owner') {
    return (
      <ScreenState
        icon="shield-lock-outline"
        title="Owner access required"
        body="Bantay accounts can look up prices but cannot create products or change store prices."
      >
        <AppButton label="Go back" variant="secondary" onPress={() => router.back()} />
      </ScreenState>
    );
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
    >
      <View style={styles.intro}>
        <Text selectable style={[styles.title, { color: theme.colors.text }]}>
          {isAnsweringRequest ? 'Answer this price request' : isEditing ? 'Edit the saved price' : "Save the owner's price"}
        </Text>
        <Text selectable style={[styles.body, { color: theme.colors.textMuted }]}>
          Product details help identify the item. The store price is always set here, never by an
          external catalog.
        </Text>
      </View>
      <FormField
        label="Barcode"
        value={barcode}
        onChangeText={setBarcode}
        placeholder="4801234567890"
        keyboardType="number-pad"
        maxLength={32}
        editable={!isEditing && !isAnsweringRequest}
      />
      <FormField
        label="Product name"
        value={name}
        onChangeText={setName}
        placeholder="Product name"
        maxLength={120}
      />
      <FormField
        label="Brand (optional)"
        value={brand}
        onChangeText={setBrand}
        placeholder="Brand"
        maxLength={80}
      />
      <FormField
        label="Size (optional)"
        value={quantity}
        onChangeText={setQuantity}
        placeholder="Example: 300 ml"
        maxLength={40}
      />
      <FormField
        label="Store price"
        value={price}
        onChangeText={setPrice}
        placeholder="₱ 0.00"
        keyboardType="decimal-pad"
        maxLength={14}
      />
      {error ? (
        <Text selectable accessibilityRole="alert" style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      ) : null}
      <AppButton
        label={saving ? 'Saving…' : isAnsweringRequest ? 'Save answer' : isEditing ? 'Save changes' : 'Save product'}
        disabled={saving}
        onPress={() => void save()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18, padding: 20, paddingBottom: 40 },
  intro: { gap: 8, paddingBottom: 8 },
  title: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 26, lineHeight: 32 },
  body: { fontFamily: 'Montserrat_500Medium', fontSize: 14, lineHeight: 22 },
  field: { gap: 8 },
  label: { fontFamily: 'Montserrat_700Bold', fontSize: 14 },
  input: {
    minHeight: 56,
    borderWidth: 1.5,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    fontFamily: 'Montserrat_500Medium',
    fontSize: 16,
  },
  error: { fontFamily: 'Montserrat_600SemiBold', fontSize: 14, lineHeight: 21 },
});
