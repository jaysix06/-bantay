import LottieView from 'lottie-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/theme/theme-provider';

export function PairingSuccess({
  body,
  children,
  compact = false,
  style,
  title = 'Bantay linked',
}: {
  body: string;
  children?: React.ReactNode;
  compact?: boolean;
  style?: ViewStyle;
  title?: string;
}) {
  const theme = useAppTheme();
  const animationRef = useRef<LottieView>(null);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.announceForAccessibility(`${title}. ${body}`);
    void AccessibilityInfo.isReduceMotionEnabled().then((shouldReduceMotion) => {
      if (!active) return;
      setReduceMotion(shouldReduceMotion);
      if (!shouldReduceMotion) {
        animationRef.current?.play();
      }
    });
    return () => {
      active = false;
    };
  }, [body, title]);

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.container, compact && styles.compactContainer, style]}
    >
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <LottieView
          ref={animationRef}
          autoPlay={false}
          loop={false}
          progress={reduceMotion ? 1 : undefined}
          resizeMode="cover"
          source={require('../../assets/animations/bantay-linked-success.json')}
          style={[styles.animation, compact && styles.compactAnimation]}
        />
      </View>
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={[styles.title, compact && styles.compactTitle, { color: theme.colors.text }]}> 
          {title}
        </Text>
        <Text style={[styles.body, compact && styles.compactBody, { color: theme.colors.textMuted }]}> 
          {body}
        </Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: 20, padding: 24 },
  compactContainer: { flex: 0, alignItems: 'center', padding: 8 },
  animation: { width: 220, height: 150, alignSelf: 'center' },
  compactAnimation: { width: 170, height: 112 },
  copy: { gap: 8 },
  title: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 26, lineHeight: 32 },
  compactTitle: { fontSize: 21, lineHeight: 27, textAlign: 'center' },
  body: { fontFamily: 'Montserrat_500Medium', fontSize: 15, lineHeight: 23 },
  compactBody: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
