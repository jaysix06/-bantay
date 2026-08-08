import { useColorScheme } from 'react-native';

export type AppTheme = {
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceRaised: string;
    surfaceMuted: string;
    text: string;
    textMuted: string;
    primary: string;
    navigationActive: string;
    onPrimary: string;
    priceLabel: string;
    priceLabelBorder: string;
    border: string;
    cameraChrome: string;
    cameraOverlay: string;
    error: string;
    onError: string;
    success: string;
  };
};

const lightTheme: AppTheme = {
  isDark: false,
  colors: {
    background: '#FFFDF8',
    surface: '#FFFFFF',
    surfaceRaised: '#FFFFFF',
    surfaceMuted: '#FFF3DF',
    text: '#3F1D0D',
    textMuted: '#765B4B',
    primary: '#FFC269',
    navigationActive: '#7A4100',
    onPrimary: '#321608',
    priceLabel: '#FFE7BE',
    priceLabelBorder: '#E69729',
    border: '#E8D5BD',
    cameraChrome: '#FFF7E8',
    cameraOverlay: 'rgba(22, 11, 5, 0.72)',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    success: '#256B3A',
  },
};

const darkTheme: AppTheme = {
  isDark: true,
  colors: {
    background: '#120D08',
    surface: '#1D150E',
    surfaceRaised: '#281C12',
    surfaceMuted: '#332315',
    text: '#FFF1D9',
    textMuted: '#D9BFA3',
    primary: '#FFC269',
    navigationActive: '#FFC269',
    onPrimary: '#321608',
    priceLabel: '#FFC45F',
    priceLabelBorder: '#FFDDA5',
    border: '#4D3827',
    cameraChrome: '#FFF7E8',
    cameraOverlay: 'rgba(10, 6, 3, 0.76)',
    error: '#FFB4AB',
    onError: '#690005',
    success: '#8CD69E',
  },
};

export function useSystemTheme(): AppTheme {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
}
