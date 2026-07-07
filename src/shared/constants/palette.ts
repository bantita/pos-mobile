import colors from 'tailwindcss/colors';
import { Colors } from '@/shared/ui/tokens';

export const Palette = {
  primary: Colors.primary,
  primaryDark: Colors.primaryDark,
  primaryLight: Colors.primaryLight,
  primaryHover: Colors.primaryHover,

  sidebar: Colors.sidebar,
  sidebarActive: Colors.sidebarActive,
  sidebarHover: Colors.sidebarHover,
  sidebarIcon: Colors.sidebarText,
  sidebarIconActive: Colors.sidebarTextActive,

  topbar: Colors.surface,
  topbarBorder: Colors.border,
  loadingGradientStart: Colors.primary,
  loadingGradientEnd: Colors.primaryHover,

  contentBg: Colors.background,
  cardBg: Colors.surface,
  cardBorder: Colors.border,

  silver: colors.gray[300],
  gray50: colors.gray[50],
  gray100: colors.gray[100],
  gray300: colors.gray[300],
  grayMedium: Colors.textSecondary,
  grayDark: colors.slate[700],

  success: Colors.success,
  successLight: Colors.successLight,
  warning: Colors.warning,
  warningLight: Colors.warningLight,
  danger: Colors.danger,
  dangerLight: Colors.dangerLight,
  info: Colors.info,
  infoLight: Colors.infoLight,

  text: Colors.text,
  textSecondary: Colors.textSecondary,
  textDisabled: Colors.textMuted,

  border: Colors.border,

  white: Colors.white,
  purple: colors.violet[600],
  purpleLight: colors.violet[50],
};
