import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme/theme-provider';

const BAR_HEIGHT = 70;
const DOCK_HEIGHT = 94;
const MAX_WIDTH = 520;

const tabMeta = {
  index: { label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  search: { label: 'Search', icon: 'magnify', activeIcon: 'magnify' },
  scan: { label: 'Scan', icon: 'barcode-scan', activeIcon: 'barcode-scan' },
  products: { label: 'Price', icon: 'tag-outline', activeIcon: 'tag' },
  profile: {
    label: 'Profile',
    icon: 'account-circle-outline',
    activeIcon: 'account-circle',
  },
} as const;

type TabName = keyof typeof tabMeta;
type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

type TabItemProps = {
  focused: boolean;
  isCenter: boolean;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onLongPress: () => void;
  onPress: () => void;
};

function TabItem({ focused, icon, isCenter, label, onLongPress, onPress }: TabItemProps) {
  const [focus] = useState(() => new Animated.Value(focused ? 1 : 0));

  useEffect(() => {
    Animated.spring(focus, {
      toValue: focused ? 1 : 0,
      damping: 18,
      stiffness: 250,
      mass: 0.58,
      useNativeDriver: true,
    }).start();
  }, [focus, focused]);

  const scale = focus.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const translateY = focus.interpolate({ inputRange: [0, 1], outputRange: [0, -1] });

  return (
    <Pressable
      accessibilityLabel={isCenter ? 'Scan a barcode' : label}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tab,
        isCenter && styles.centerTab,
        pressed && styles.pressedTab,
      ]}
    >
      {isCenter ? (
        <Animated.View style={[styles.scanDisc, { transform: [{ scale }] }]}>
          <MaterialCommunityIcons name={icon} color="#321608" size={28} />
        </Animated.View>
      ) : (
        <Animated.View
          style={[styles.iconFrame, { transform: [{ translateY }, { scale }] }]}
        >
          <MaterialCommunityIcons
            name={icon}
            color={focused ? '#FFC269' : 'rgba(255, 243, 223, 0.70)'}
            size={23}
          />
        </Animated.View>
      )}

      <Text
        numberOfLines={1}
        style={[
          styles.label,
          isCenter && styles.centerLabel,
          focused && !isCenter && styles.activeLabel,
        ]}
      >
        {label}
      </Text>

      {!isCenter && focused ? <View style={styles.activeDot} /> : null}
    </Pressable>
  );
}

export function BantayTabBar({ navigation, state }: TabBarProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth - 24, MAX_WIDTH);
  const left = (windowWidth - width) / 2;
  const barColor = theme.isDark ? '#2A1A10' : '#4A2412';

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.dock,
        {
          bottom: insets.bottom + 8,
          left,
          width,
        },
      ]}
    >
      <View style={[styles.centerLobe, { backgroundColor: barColor }]} />
      <View style={[styles.capsule, { backgroundColor: barColor }]} />

      <View style={styles.items}>
        {state.routes.map((route, index) => {
          const name = route.name as TabName;
          const meta = tabMeta[name];

          if (!meta) {
            return null;
          }

          const focused = state.index === index;
          const isCenter = name === 'scan';

          const handlePress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const handleLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <TabItem
              key={route.key}
              focused={focused}
              icon={focused ? meta.activeIcon : meta.icon}
              isCenter={isCenter}
              label={meta.label}
              onLongPress={handleLongPress}
              onPress={handlePress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    zIndex: 50,
    height: DOCK_HEIGHT,
  },
  capsule: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    boxShadow: '0 10px 24px rgba(36, 16, 7, 0.26)',
  },
  centerLobe: {
    position: 'absolute',
    zIndex: 1,
    top: 0,
    left: '50%',
    width: 80,
    height: 80,
    marginLeft: -40,
    borderRadius: 40,
  },
  items: {
    position: 'absolute',
    zIndex: 2,
    right: 0,
    bottom: 0,
    left: 0,
    height: DOCK_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  tab: {
    height: BAR_HEIGHT,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
  },
  pressedTab: {
    opacity: 0.78,
  },
  centerTab: {
    height: DOCK_HEIGHT,
    paddingTop: 0,
  },
  iconFrame: {
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanDisc: {
    position: 'absolute',
    top: 6,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC269',
    borderWidth: 2,
    borderColor: '#FFE0AD',
  },
  label: {
    marginTop: 2,
    color: 'rgba(255, 243, 223, 0.70)',
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 9,
    lineHeight: 12,
  },
  activeLabel: {
    color: '#FFF3DF',
  },
  centerLabel: {
    position: 'absolute',
    top: 69,
    color: '#FFF3DF',
  },
  activeDot: {
    width: 3,
    height: 3,
    marginTop: 3,
    borderRadius: 2,
    backgroundColor: '#FFC269',
  },
});
