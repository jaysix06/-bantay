import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/theme-provider';

type AppButtonProps = ComponentProps<typeof Pressable> & {
  label: string;
  icon?: React.ReactNode;
  balancedIcon?: boolean;
  variant?: 'primary' | 'secondary' | 'text';
};

export function AppButton({
  label,
  icon,
  balancedIcon = false,
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
        balancedIcon && styles.balancedButton,
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
      <View style={[styles.content, balancedIcon && styles.balancedContent]}>
        {balancedIcon ? <View style={styles.iconSlot}>{icon}</View> : icon}
        <Text
          style={[
            styles.label,
            balancedIcon && styles.balancedLabel,
            { color: isPrimary ? theme.colors.onPrimary : theme.colors.text },
          ]}
        >
          {label}
        </Text>
        {balancedIcon ? <View aria-hidden style={styles.iconSlot} /> : null}
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
  balancedButton: {
    paddingHorizontal: 12,
  },
  balancedContent: {
    width: '100%',
    gap: 0,
  },
  balancedLabel: {
    flex: 1,
    textAlign: 'center',
  },
  iconSlot: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
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
