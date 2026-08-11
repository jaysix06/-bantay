import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/theme-provider';

export function ProductResultHeader({ onBackPress }: { onBackPress: () => void }) {
  const theme = useAppTheme();
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Return to the scanner"
        hitSlop={8}
        onPress={onBackPress}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="arrow-left" size={30} color={theme.colors.text} />
      </Pressable>
      <Image source={require('../../assets/images/mascot-transparent.png')} style={styles.mascot} />
      <View style={styles.brandCopy}>
        <Text style={[styles.brandName, { color: theme.colors.text }]}>BANTAY</Text>
        <Text style={[styles.brandSubtitle, { color: theme.colors.textMuted }]}>Barcode price lookup</Text>
      </View>
    </View>
  );
}

export function ProductResultAction({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { borderColor: theme.colors.border },
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={36} color={theme.colors.navigationActive} />
      <View style={styles.actionCopy}>
        <Text style={[styles.actionTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.actionSubtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={30} color={theme.colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  mascot: { width: 72, height: 72, resizeMode: 'contain' },
  brandCopy: { flex: 1, gap: 1 },
  brandName: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 22, letterSpacing: 0.4 },
  brandSubtitle: { fontFamily: 'Montserrat_500Medium', fontSize: 14 },
  action: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
  },
  actionCopy: { flex: 1, gap: 3 },
  actionTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 18 },
  actionSubtitle: { fontFamily: 'Montserrat_500Medium', fontSize: 13 },
  pressed: { opacity: 0.7 },
});
