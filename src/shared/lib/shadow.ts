/**
 * Cross-platform shadow utility
 * On web: uses boxShadow (no deprecated shadow* props)
 * On native: uses traditional shadow* props + elevation
 */
import { Platform, ViewStyle } from 'react-native';

interface ShadowOptions {
  color?: string;
  offsetX?: number;
  offsetY?: number;
  opacity?: number;
  radius?: number;
  elevation?: number;
}

/**
 * Returns platform-appropriate shadow style.
 * Web uses `boxShadow`, native uses shadow* + elevation.
 */
export function shadow(options: ShadowOptions = {}): ViewStyle {
  const {
    color = '#09090b',
    offsetX = 0,
    offsetY = 2,
    opacity = 0.12,
    radius = 8,
    elevation = 3,
  } = options;

  if (Platform.OS === 'web') {
    // Parse hex color and apply opacity for rgba
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px rgba(${r}, ${g}, ${b}, ${opacity})`,
    } as ViewStyle;
  }

  return {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}

/** Common presets */
export const shadowSm = shadow({ offsetY: 1, opacity: 0.08, radius: 4, elevation: 2 });
export const shadowMd = shadow({ offsetY: 2, opacity: 0.12, radius: 8, elevation: 3 });
export const shadowLg = shadow({ offsetY: 4, opacity: 0.10, radius: 10, elevation: 5 });
