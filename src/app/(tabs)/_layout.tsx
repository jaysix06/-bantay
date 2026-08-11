import { Tabs } from 'expo-router';

import { BantayTabBar } from '@/components/bantay-tab-bar';
import { useAppTheme } from '@/theme/theme-provider';

export default function TabsLayout() {
  const theme = useAppTheme();

  return (
    <Tabs
      tabBar={(props) => <BantayTabBar {...props} />}
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.colors.background },
        headerTitleStyle: { fontFamily: 'Montserrat_700Bold' },
        headerTintColor: theme.colors.text,
        sceneStyle: { backgroundColor: theme.colors.background },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          headerShown: false,
          tabBarAccessibilityLabel: 'Scan a barcode',
        }}
      />
      <Tabs.Screen
        name="products"
        options={{ title: 'Price', headerTitle: 'Saved prices' }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', headerTitle: 'Profile' }} />
    </Tabs>
  );
}
