import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type ReactNode, type RefObject, useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme/theme-provider';

type AppModalProps = {
  animationType?: 'none' | 'slide' | 'fade';
  bodyScrollRef?: RefObject<ScrollView | null>;
  children: ReactNode;
  description?: string;
  dismissible?: boolean;
  icon?: ReactNode;
  onRequestClose: () => void;
  title: string;
  visible: boolean;
};

export function AppModal({
  animationType = 'fade',
  bodyScrollRef,
  children,
  description,
  dismissible = true,
  icon,
  onRequestClose,
  title,
  visible,
}: AppModalProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const isWide = width >= 600;
  const maxSheetHeight = height - insets.top - Math.max(insets.bottom, 12) - 12;
  const usesSheetTransition = animationType === 'slide';
  const [transition] = useState(() => new Animated.Value(0));
  const [renderedVisible, setRenderedVisible] = useState(visible);

  useEffect(() => {
    if (!usesSheetTransition) {
      return;
    }

    transition.stopAnimation();
    if (visible) {
      requestAnimationFrame(() => {
        setRenderedVisible(true);
        transition.setValue(0);
        requestAnimationFrame(() => {
          Animated.timing(transition, {
            toValue: 1,
            duration: 340,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        });
      });
    } else {
      Animated.timing(transition, {
        toValue: 0,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setRenderedVisible(false);
      });
    }
  }, [transition, usesSheetTransition, visible]);

  const backdropAnimation = usesSheetTransition ? { opacity: transition } : undefined;
  const sheetAnimation = usesSheetTransition
    ? {
        transform: [{
          translateY: transition.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }),
        }],
      }
    : undefined;

  return (
    <Modal
      animationType={usesSheetTransition ? 'none' : animationType}
      navigationBarTranslucent
      onRequestClose={() => {
        if (dismissible) onRequestClose();
      }}
      statusBarTranslucent
      transparent
      visible={usesSheetTransition ? renderedVisible : visible}
    >
      <View style={styles.overlay}>
        <Animated.View pointerEvents="box-none" style={[styles.backdrop, backdropAnimation]}>
          <Pressable
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onPress={dismissible ? onRequestClose : undefined}
            style={[styles.backdropPressable, { backgroundColor: theme.colors.cameraOverlay }]}
          />
        </Animated.View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
          style={[styles.positioner, isWide ? styles.centered : styles.bottom]}
        >
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              isWide ? styles.wideSheet : styles.bottomSheet,
              {
                maxHeight: maxSheetHeight,
                paddingBottom: Math.max(isWide ? 24 : insets.bottom + 16, 24),
                backgroundColor: theme.colors.surfaceRaised,
                borderColor: theme.colors.border,
              },
              sheetAnimation,
            ]}
          >
            <View style={styles.header}>
              {icon ? <View style={[styles.icon, { backgroundColor: theme.colors.surfaceMuted }]}>{icon}</View> : null}
              <View style={styles.heading}>
                <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
                  {title}
                </Text>
                {description ? (
                  <Text style={[styles.description, { color: theme.colors.textMuted }]}>
                    {description}
                  </Text>
                ) : null}
              </View>
              {dismissible ? (
                <Pressable
                  accessibilityLabel="Close dialog"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={onRequestClose}
                  style={({ pressed }) => [styles.close, pressed && styles.pressed]}
                >
                  <MaterialCommunityIcons name="close" size={23} color={theme.colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
            <ScrollView
              ref={bodyScrollRef}
              bounces={false}
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.bodyScroller}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  backdropPressable: { flex: 1 },
  positioner: { flex: 1, paddingHorizontal: 12 },
  bottom: { justifyContent: 'flex-end' },
  centered: { alignItems: 'center', justifyContent: 'center' },
  sheet: {
    width: '100%',
    borderWidth: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    boxShadow: '0 18px 42px rgba(32, 14, 6, 0.28)',
  },
  bottomSheet: {
    maxWidth: 520,
    alignSelf: 'center',
    borderBottomWidth: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  wideSheet: { maxWidth: 440, borderRadius: 24, borderCurve: 'continuous' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  heading: { flex: 1, gap: 6, paddingTop: 1 },
  title: { fontFamily: 'Montserrat_800ExtraBold', fontSize: 20, lineHeight: 26 },
  description: { fontFamily: 'Montserrat_500Medium', fontSize: 13, lineHeight: 20 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: -5, marginRight: -8 },
  bodyScroller: { flexShrink: 1 },
  body: { flexGrow: 1, gap: 12, paddingTop: 20 },
  pressed: { opacity: 0.65 },
});
