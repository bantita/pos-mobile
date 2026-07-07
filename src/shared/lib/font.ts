/**
 * font.ts — Sarabun font family setup for React Native / Web
 *
 * Problem: React Native does not synthesize font weights from a single TTF.
 * If we set fontFamily='Sarabun-Regular' and fontWeight='700', the OS will
 * either faux-bold or fall back to system font.
 *
 * Solution:
 *   1. Load every weight as a separate font family (Sarabun-Regular, Sarabun-Bold, ...).
 *   2. Route application Text/TextInput through @/shared/tw.
 *   3. Provide mapStyleToSarabun() so those wrappers map fontWeight to the
 *      exact font file for perfect weight rendering.
 */
import { Platform, TextStyle } from 'react-native';

export const FontFamilies = {
  regular: 'Sarabun-Regular',
  medium: 'Sarabun-Medium',
  semibold: 'Sarabun-SemiBold',
  bold: 'Sarabun-Bold',
  extrabold: 'Sarabun-ExtraBold',
} as const;

export const fontAssets = {
  'Sarabun-Regular': require('@/assets/fonts/Sarabun-Regular.ttf'),
  'Sarabun-Medium': require('@/assets/fonts/Sarabun-Medium.ttf'),
  'Sarabun-SemiBold': require('@/assets/fonts/Sarabun-SemiBold.ttf'),
  'Sarabun-Bold': require('@/assets/fonts/Sarabun-Bold.ttf'),
  'Sarabun-ExtraBold': require('@/assets/fonts/Sarabun-ExtraBold.ttf'),
};

export function getFontFamilyFromWeight(weight?: string | number): string {
  if (Platform.OS === 'web') return 'Sarabun';
  const w = typeof weight === 'string' ? parseInt(weight, 10) : weight;
  if (w == null || Number.isNaN(w)) return FontFamilies.regular;
  if (w >= 800) return FontFamilies.extrabold;
  if (w >= 700) return FontFamilies.bold;
  if (w >= 600) return FontFamilies.semibold;
  if (w >= 500) return FontFamilies.medium;
  return FontFamilies.regular;
}

export type StyleLike = TextStyle | TextStyle[] | undefined | null;

function flattenStyle(style: StyleLike): TextStyle {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce<TextStyle>((acc, s) => ({ ...acc, ...flattenStyle(s) }), {});
  }
  return style;
}

/**
 * Map a style (or array of styles) to the correct Sarabun font family.
 * Returns a new style object where fontFamily is set based on fontWeight.
 */
export function mapStyleToSarabun(style?: StyleLike): TextStyle {
  const flat = flattenStyle(style);
  if (flat.fontFamily && !String(flat.fontFamily).startsWith('Sarabun')) return flat;
  const weight = flat.fontWeight as string | number | undefined;
  return {
    ...flat,
    fontFamily: getFontFamilyFromWeight(weight),
  };
}
