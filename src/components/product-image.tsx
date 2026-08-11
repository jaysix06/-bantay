import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme/theme-provider';

type ProductImageProps = {
  imageUrl: string | null;
  productName: string;
  variant?: 'tag' | 'thumbnail';
};

export function ProductImage({
  imageUrl,
  productName,
  variant = 'tag',
}: ProductImageProps) {
  const theme = useAppTheme();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const hasImage = Boolean(imageUrl) && failedUrl !== imageUrl;

  return (
    <View
      style={[
        styles.frame,
        variant === 'tag' ? styles.tag : styles.thumbnail,
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
          style={variant === 'tag' ? styles.tagImage : styles.thumbnailImage}
        />
      ) : (
        <MaterialCommunityIcons
          accessibilityLabel={`No image available for ${productName}`}
          name="image-outline"
          size={variant === 'tag' ? 34 : 25}
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
  tag: {
    width: 96,
    height: 128,
    borderRadius: 14,
    borderCurve: 'continuous',
    padding: 6,
  },
  thumbnail: {
    width: 58,
    height: 58,
    borderRadius: 15,
    borderCurve: 'continuous',
    padding: 5,
  },
  tagImage: { width: '100%', height: '100%' },
  thumbnailImage: { width: '100%', height: '100%' },
});
