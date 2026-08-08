import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { normalizeBarcode } from '@/domain/product';
import { useAppTheme } from '@/theme/theme-provider';

export default function ManualRoute() {
  const theme = useAppTheme();
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const barcode = normalizeBarcode(value);
    if (!barcode) {
      setError('Enter a barcode containing 6 to 18 digits.');
      return;
    }
    router.replace({ pathname: '/product/[barcode]', params: { barcode } });
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
    >
      <View style={[styles.icon, { backgroundColor: theme.colors.surfaceMuted }]}>
        <MaterialCommunityIcons name="barcode" size={42} color={theme.colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text selectable style={[styles.title, { color: theme.colors.text }]}>
          Type the number below the barcode
        </Text>
        <Text selectable style={[styles.body, { color: theme.colors.textMuted }]}>
          Spaces and dashes are fine. Bantay will keep only the digits.
        </Text>
      </View>
      <TextInput
        accessibilityLabel="Barcode number"
        autoFocus
        keyboardType="number-pad"
        maxLength={32}
        returnKeyType="search"
        value={value}
        onChangeText={(next) => {
          setValue(next);
          setError(null);
        }}
        onSubmitEditing={submit}
        placeholder="Example: 4801234567890"
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.error : theme.colors.border,
            color: theme.colors.text,
          },
        ]}
      />
      {error ? (
        <Text selectable accessibilityRole="alert" style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      ) : null}
      <AppButton label="Find price" onPress={submit} disabled={!value.trim()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: 20, padding: 24 },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { gap: 8 },
  title: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 26, lineHeight: 32 },
  body: { fontFamily: 'Montserrat_500Medium', fontSize: 15, lineHeight: 23 },
  input: {
    minHeight: 60,
    borderWidth: 1.5,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
  },
  error: { fontFamily: 'Montserrat_600SemiBold', fontSize: 14, lineHeight: 20 },
});
