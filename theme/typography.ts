import { Platform } from 'react-native';

export const fontFamily = {
  mono: Platform.select({
    ios: 'JetBrainsMono-Regular',
    android: 'JetBrainsMono-Regular',
    default: 'JetBrains Mono',
  }),
  monoMedium: Platform.select({
    ios: 'JetBrainsMono-Medium',
    android: 'JetBrainsMono-Medium',
    default: 'JetBrains Mono',
  }),
  monoBold: Platform.select({
    ios: 'JetBrainsMono-Bold',
    android: 'JetBrainsMono-Bold',
    default: 'JetBrains Mono',
  }),
  sans: Platform.select({
    ios: 'DMSans-Regular',
    android: 'DMSans-Regular',
    default: 'DM Sans',
  }),
  sansMedium: Platform.select({
    ios: 'DMSans-Medium',
    android: 'DMSans-Medium',
    default: 'DM Sans',
  }),
  sansBold: Platform.select({
    ios: 'DMSans-Bold',
    android: 'DMSans-Bold',
    default: 'DM Sans',
  }),
} as const;

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  '2xl': 22,
  '3xl': 28,
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
} as const;

export const letterSpacing = {
  tight: -0.03,
  normal: 0,
  wide: 0.04,
} as const;
