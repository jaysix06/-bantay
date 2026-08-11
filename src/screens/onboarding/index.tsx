import { StatusBar } from 'expo-status-bar';
import LottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { useAppTheme } from '@/theme/theme-provider';

const scenes = [
  {
    title: 'Scan it. Know the price.',
    body: 'Point your camera at a product and see the price your store trusts in seconds.',
    accessibilityLabel: 'A barcode becomes a clear store price',
    animation: require('../../../assets/animations/scan-price.json'),
    reducedMotionProgress: 1,
  },
  {
    title: 'One answer for the whole family.',
    body: 'The owner sets prices. If one is missing, ask once and every linked Bantay learns the answer.',
    accessibilityLabel: 'An owner phone shares one answer with linked Bantay phones',
    animation: require('../../../assets/animations/shared-price.json'),
    reducedMotionProgress: 0.65,
  },
  {
    title: 'Ready when the signal is not.',
    body: 'Previously saved prices stay on this phone, so a weak connection does not stop the store.',
    accessibilityLabel: 'A saved price remains available while the signal fades',
    animation: require('../../../assets/animations/offline-price.json'),
    reducedMotionProgress: 1,
  },
] as const;

export function OnboardingScreen({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const scene = scenes[index];

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (index === 0) return false;
      setIndex((current) => Math.max(0, current - 1));
      return true;
    });
    return () => subscription.remove();
  }, [index]);

  const advance = () => {
    if (index === scenes.length - 1) onComplete();
    else setIndex((current) => current + 1);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <View style={styles.topBar}>
        <Text style={[styles.brand, { color: theme.colors.text }]}>BANTAY</Text>
        <Pressable accessibilityRole="button" onPress={onSkip} style={({ pressed }) => [styles.skip, pressed && styles.pressed]}>
          <Text style={[styles.skipText, { color: theme.colors.textMuted }]}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.scene}>
        <View accessible accessibilityLabel={scene.accessibilityLabel} style={[styles.animationFrame, { backgroundColor: theme.colors.surfaceMuted }]}>
          {reduceMotion === null ? null : (
            <LottieView
              key={`${index}-${reduceMotion}`}
              autoPlay={!reduceMotion}
              loop={!reduceMotion}
              progress={reduceMotion ? scene.reducedMotionProgress : undefined}
              source={scene.animation}
              style={styles.animation}
            />
          )}
        </View>
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>{scene.title}</Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>{scene.body}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View accessibilityLabel={`Step ${index + 1} of ${scenes.length}`} style={styles.progress}>
          {scenes.map((item, itemIndex) => (
            <View
              key={item.title}
              style={[
                styles.dot,
                { backgroundColor: itemIndex === index ? theme.colors.navigationActive : theme.colors.border },
                itemIndex === index && styles.activeDot,
              ]}
            />
          ))}
        </View>
        <AppButton label={index === scenes.length - 1 ? 'Get started' : 'Next'} onPress={advance} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 22 },
  topBar: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 17, letterSpacing: 1.8 },
  skip: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 8 },
  skipText: { fontFamily: 'Montserrat_700Bold', fontSize: 13 },
  scene: { flex: 1, justifyContent: 'center', gap: 28 },
  animationFrame: { aspectRatio: 1.18, width: '100%', maxHeight: 340, overflow: 'hidden', borderRadius: 24 },
  animation: { width: '100%', height: '100%' },
  copy: { gap: 12 },
  title: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 32, lineHeight: 38, letterSpacing: -0.7 },
  body: { fontFamily: 'Montserrat_500Medium', fontSize: 15, lineHeight: 23 },
  footer: { gap: 20 },
  progress: { minHeight: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  activeDot: { width: 24 },
  pressed: { opacity: 0.65 },
});
