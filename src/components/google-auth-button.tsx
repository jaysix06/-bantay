import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

type GoogleAuthButtonProps = {
  disabled?: boolean;
  label?: string;
  onPress: () => void;
};

export function GoogleAuthButton({
  disabled = false,
  label = 'Continue with Google',
  onPress,
}: GoogleAuthButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={require('../../assets/images/google-g.png')}
        style={styles.logo}
      />
      <View pointerEvents="none" style={styles.labelFrame}>
        <Text numberOfLines={1} style={styles.label}>{label}</Text>
      </View>
      <View aria-hidden style={styles.balance} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#747775',
    borderWidth: 1,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: 12,
  },
  logo: { width: 30, height: 30 },
  labelFrame: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  label: {
    color: '#1F1F1F',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    lineHeight: 20,
  },
  balance: { width: 20, height: 20 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.45 },
});
