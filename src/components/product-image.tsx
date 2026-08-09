import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme/theme-provider';

type ProductImageProps = {
  imageUrl: string | null;
  productName: string;
  variant?: 'hero' | 'thumbnail';
};

export function ProductImage({
  imageUrl,
  productName,
  variant = 'hero',
}: ProductImageProps) {
  const theme = useAppTheme();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const hasImage = Boolean(imageUrl) && failedUrl !== imageUrl;

  return (
    <View
      style={[
        styles.frame,
        variant === 'hero' ? styles.hero : styles.thumbnail,
        {
          backgroundColor: hasImage ? '#FFFFFF' : theme.colors.surfaceMuted,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {hasImage ? (
        <Image
          accessibilityLabel={`${productName} product image`}
          source={{ uri: imageUrl! }}
          resizeMode="contain"
          onError={() => setFailedUrl(imageUrl)}
          style={variant === 'hero' ? styles.heroImage : styles.thumbnailImage}
        />
      ) : (
        <MaterialCommunityIcons
          accessibilityLabel={`No image available for ${productName}`}
          name="image-outline"
          size={variant === 'hero' ? 52 : 25}
          color={theme.colors.textMuted}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  hero: {
    width: '100%',
    height: 228,
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 18,
  },
  thumbnail: {
    width: 58,
    height: 58,
    borderRadius: 15,
    borderCurve: 'continuous',
    padding: 5,
  },
  heroImage: { width: '100%', height: '100%' },
  thumbnailImage: { width: '100%', height: '100%' },
});
