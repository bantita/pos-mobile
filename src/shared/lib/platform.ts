/**
 * Platform Detection Utilities
 * รองรับ iOS · Android · Web (macOS/Windows/Linux browser)
 */
import { Platform, Dimensions } from 'react-native';

export const IS_WEB     = Platform.OS === 'web';
export const IS_IOS     = Platform.OS === 'ios';
export const IS_ANDROID = Platform.OS === 'android';
export const IS_MOBILE  = IS_IOS || IS_ANDROID;

/** Web: ตรวจว่าเป็น macOS browser */
export const IS_MAC_WEB = IS_WEB &&
  typeof navigator !== 'undefined' &&
  /Mac/.test(navigator.platform ?? '');

/** Web: ตรวจว่าเป็น Windows browser */
export const IS_WIN_WEB = IS_WEB &&
  typeof navigator !== 'undefined' &&
  /Win/.test(navigator.platform ?? '');

/** Tablet detection (iOS iPad / Android tablet / wide web) */
export const isTablet = (): boolean => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = Math.max(width, height) / Math.min(width, height);
  if (IS_WEB) return width >= 768;
  return Math.min(width, height) >= 600 && aspectRatio < 1.6;
};

/** Wide screen สำหรับ Kiosk layout (width >= 1024) */
export const isWideScreen = (): boolean => {
  const { width } = Dimensions.get('window');
  return width >= 1024;
};

/** Platform label สำหรับแสดง */
export const getPlatformLabel = (): string => {
  if (IS_ANDROID) return 'Android';
  if (IS_IOS)     return 'iOS';
  if (IS_MAC_WEB) return 'macOS Web';
  if (IS_WIN_WEB) return 'Windows Web';
  if (IS_WEB)     return 'Web';
  return 'Unknown';
};

/**
 * Web Fullscreen API
 * ใช้สำหรับ Kiosk Mode บน Web (macOS / Windows)
 */
export const requestFullscreen = async (): Promise<void> => {
  if (!IS_WEB) return;
  const el = document.documentElement as any;
  if (el.requestFullscreen) await el.requestFullscreen();
  else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
  else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
  else if (el.msRequestFullscreen) await el.msRequestFullscreen();
};

export const exitFullscreen = async (): Promise<void> => {
  if (!IS_WEB) return;
  const doc = document as any;
  if (doc.exitFullscreen) await doc.exitFullscreen();
  else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
  else if (doc.mozCancelFullScreen) await doc.mozCancelFullScreen();
  else if (doc.msExitFullscreen) await doc.msExitFullscreen();
};

export const isFullscreen = (): boolean => {
  if (!IS_WEB) return false;
  const doc = document as any;
  return !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement);
};

/**
 * Android Immersive Mode (ซ่อน status/nav bar)
 * เรียกผ่าน expo-navigation-bar หรือ react-native-navigation-bar-color
 * ที่นี่ export เป็น no-op สำหรับ cross-platform
 */
export const setAndroidImmersive = (_enable: boolean): void => {
  // Android: ใช้ expo-navigation-bar ใน Android-specific code
};
