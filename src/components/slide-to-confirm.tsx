import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  type LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppTheme } from '@/theme/theme-provider';
import {
  clampSlideOffset,
  getSlideTravel,
  isSlideConfirmed,
} from './slide-to-confirm-logic';

const THUMB_SIZE = 56;
const TRACK_GUTTER = 4;

type SlideToConfirmProps = {
  disabled?: boolean;
  label: string;
  loadingLabel?: string;
  onConfirm: () => void;
  resetKey?: string | number | boolean;
};

export function SlideToConfirm({
  disabled = false,
  label,
  loadingLabel = 'Deleting account…',
  onConfirm,
  resetKey,
}: SlideToConfirmProps) {
  const theme = useAppTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const [thumbX] = useState(() => new Animated.Value(0));
  const startOffset = useRef(0);
  const hasConfirmed = useRef(false);
  const maxTravel = getSlideTravel(trackWidth, THUMB_SIZE, TRACK_GUTTER);

  const reset = () => {
    hasConfirmed.current = false;
    startOffset.current = 0;
    Animated.spring(thumbX, {
      toValue: 0,
      damping: 20,
      stiffness: 250,
      mass: 0.65,
      useNativeDriver: true,
    }).start();
  };

  const complete = () => {
    if (disabled || hasConfirmed.current || maxTravel <= 0) return;
    hasConfirmed.current = true;
    Animated.spring(thumbX, {
      toValue: maxTravel,
      damping: 20,
      stiffness: 220,
      mass: 0.65,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onConfirm();
    });
  };

  useEffect(() => {
    reset();
    // The changing key intentionally resets a completed or interrupted gesture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const panResponder = useMemo(
    () =>
      // Gesture callbacks read refs after render; PanResponder itself is only constructed here.
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          !disabled &&
          maxTravel > 0 &&
          Math.abs(gesture.dx) > 4 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderGrant: () => {
          thumbX.stopAnimation((value) => {
            startOffset.current = value;
          });
        },
        onPanResponderMove: (_, gesture) => {
          thumbX.setValue(clampSlideOffset(startOffset.current + gesture.dx, maxTravel));
        },
        onPanResponderRelease: (_, gesture) => {
          const releasedAt = clampSlideOffset(startOffset.current + gesture.dx, maxTravel);
          if (isSlideConfirmed(releasedAt, maxTravel)) {
            complete();
          } else {
            reset();
          }
        },
        onPanResponderTerminate: reset,
      }),
    // Stable Animated values and refs are safe gesture dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled, maxTravel, onConfirm],
  );

  const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    setTrackWidth(nativeEvent.layout.width);
  };

  return (
    <View
      accessibilityActions={[{ name: 'activate', label }]}
      accessibilityHint="Swipe the handle all the way to the right to confirm"
      accessibilityLabel={label}
      accessibilityRole="adjustable"
      accessibilityState={{ disabled, busy: disabled }}
      onAccessibilityAction={({ nativeEvent }) => {
        if (nativeEvent.actionName === 'activate') complete();
      }}
      onLayout={handleLayout}
      style={[
        styles.track,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[styles.label, { color: disabled ? theme.colors.textMuted : theme.colors.error }]}
      >
        {disabled ? loadingLabel : label}
      </Text>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.thumb,
          {
            backgroundColor: theme.colors.error,
            transform: [{ translateX: thumbX }],
          },
        ]}
      >
        <MaterialCommunityIcons name="chevron-double-right" size={26} color={theme.colors.onError} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 64,
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 20,
    borderCurve: 'continuous',
  },
  label: {
    paddingHorizontal: 68,
    textAlign: 'center',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
  },
  thumb: {
    position: 'absolute',
    left: TRACK_GUTTER,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },
});
