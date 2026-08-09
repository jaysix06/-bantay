import { Stack } from 'expo-router';

import { ProductResultScreen } from '@/screens/product-result';

export default function ProductRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ProductResultScreen />
    </>
  );
}
