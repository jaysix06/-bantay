import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/theme-provider';

export function ScreenState({
  icon,
  title,
  body,
  children,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.icon, { backgroundColor: theme.colors.surfaceMuted }]}>
        <MaterialCommunityIcons name={icon} size={38} color={theme.colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text selectable style={[styles.title, { color: theme.colors.text }]}>
          {title}
        </Text>
        <Text selectable style={[styles.body, { color: theme.colors.textMuted }]}>
          {body}
        </Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: 20, padding: 24 },
  icon: { width: 68, height: 68, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  copy: { gap: 8 },
  title: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 26, lineHeight: 32 },
  body: { fontFamily: 'Montserrat_500Medium', fontSize: 15, lineHeight: 23 },
});
