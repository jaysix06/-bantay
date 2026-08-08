import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/theme-provider';

type AppButtonProps = ComponentProps<typeof Pressable> & {
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'text';
};

export function AppButton({
  label,
  icon,
  variant = 'primary',
  disabled,
  ...pressableProps
}: AppButtonProps) {
  const theme = useAppTheme();
  const isPrimary = variant === 'primary';
  const isText = variant === 'text';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...pressableProps}
      style={({ pressed }) => [
        styles.button,
        isPrimary && { backgroundColor: theme.colors.primary },
        !isPrimary && !isText && {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.border,
          borderWidth: 1,
        },
        isText && styles.textButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {icon}
        <Text
          style={[
            styles.label,
            { color: isPrimary ? theme.colors.onPrimary : theme.colors.text },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
  },
  textButton: {
    minHeight: 48,
    paddingHorizontal: 12,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
