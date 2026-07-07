/**
 * Central logo asset — cross-platform (iOS, Android, Web)
 *
 * Usage:
 *   import { APP_LOGO } from '@/shared/constants/logo';
 *   <Image source={APP_LOGO} ... />
 */
import type { ImageSourcePropType } from 'react-native';

// @/assets/ resolves to project-root/assets/ via metro.config.js
export const APP_LOGO: ImageSourcePropType = require('@/assets/xclnc.png');
