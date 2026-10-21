/**
 * Design Tokens — Color System
 * Brand: Xcellence ERP · POS Mobile
 * Theme: Modern Minimal Red
 */

// ─── Brand ───────────────────────────────────────────────────────────────────
const PRIMARY = '#B91C2C';
const PRIMARY_DARK = '#991B1B';
const PRIMARY_LIGHT = '#FBE3E5';
const PRIMARY_HOVER = '#D32030';

// ─── Background & Surface ────────────────────────────────────────────────────
const BG_PRIMARY = '#FFFFFF';
const BG_SECONDARY = '#FBE3E5';
const SURFACE = '#FFFFFF';
const SURFACE_HOVER = '#FEF6F7';

// ─── Text ────────────────────────────────────────────────────────────────────
const TEXT_PRIMARY = '#1F2328';
const TEXT_SECONDARY = '#4A5058';
const TEXT_MUTED = '#8A9099';
const TEXT_ON_PRIMARY = '#FFFFFF';

// ─── Borders ─────────────────────────────────────────────────────────────────
const BORDER = '#ECEEF1';
const BORDER_FOCUS = PRIMARY;
const BORDER_LIGHT = '#F3F4F6';

// ─── Semantic / Status ───────────────────────────────────────────────────────
const SUCCESS = '#15934B';
const SUCCESS_LIGHT = '#DCF5E6';
const WARNING = '#B4690E';
const WARNING_LIGHT = '#FCEFD3';
const DANGER = '#D32030';
const DANGER_LIGHT = '#FBE3E5';
const INFO = '#2563EB';
const INFO_LIGHT = '#DCE8FD';

// ─── Named Status ────────────────────────────────────────────────────────────
const SUCCESS_BG = '#DCF5E6';
const SUCCESS_TEXT = '#0F7038';
const WARNING_BG = '#FCEFD3';
const WARNING_TEXT = '#8A5208';
const DANGER_BG = '#FBE3E5';
const DANGER_TEXT = '#B91C2C';

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const SIDEBAR = '#FFFFFF';
const SIDEBAR_HOVER = '#FBE3E5';
const SIDEBAR_ACTIVE = PRIMARY;
const SIDEBAR_TEXT = '#4A5058';
const SIDEBAR_TEXT_ACTIVE = '#FFFFFF';

// ─── Misc ────────────────────────────────────────────────────────────────────
const OVERLAY = 'rgba(0, 0, 0, 0.4)';
const SHADOW = '#000000';

// ═══════════════════════════════════════════════════════════════════════════════
export const Colors = {
  // Brand
  primary: PRIMARY,
  primaryDark: PRIMARY_DARK,
  primaryLight: PRIMARY_LIGHT,
  primaryHover: PRIMARY_HOVER,

  // Background
  background: BG_PRIMARY,
  backgroundSecondary: BG_SECONDARY,

  // Surface
  surface: SURFACE,
  surfaceHover: SURFACE_HOVER,
  surfaceLight: SURFACE,
  surfaceLightCard: '#FAFAFA',

  // Text
  text: TEXT_PRIMARY,
  textSecondary: TEXT_SECONDARY,
  textDisabled: TEXT_MUTED,
  textOnPrimary: TEXT_ON_PRIMARY,
  textOnSecondary: TEXT_PRIMARY,

  // Borders
  border: BORDER,
  borderFocus: BORDER_FOCUS,
  borderLight: BORDER_LIGHT,
  divider: BORDER_LIGHT,

  // Semantic
  success: SUCCESS,
  successLight: SUCCESS_LIGHT,
  warning: WARNING,
  warningLight: WARNING_LIGHT,
  danger: DANGER,
  dangerLight: DANGER_LIGHT,
  info: INFO,
  infoLight: INFO_LIGHT,

  // Named status (for badges)
  successBg: SUCCESS_BG,
  successText: SUCCESS_TEXT,
  warningBg: WARNING_BG,
  warningText: WARNING_TEXT,
  dangerBg: DANGER_BG,
  dangerText: DANGER_TEXT,

  // Stock status
  stockOk: SUCCESS_BG,
  stockOkText: SUCCESS_TEXT,
  stockLow: WARNING_BG,
  stockLowText: WARNING_TEXT,
  stockOut: DANGER_BG,
  stockOutText: DANGER_TEXT,

  // Accent pastel colors
  mint: '#C9F1E1',
  mintDark: '#1F7A5C',
  amber: '#FFE8A3',
  amberDark: '#92660B',
  lavender: '#E6DBFB',
  lavenderDark: '#5B3FA0',

  // Sidebar
  sidebar: SIDEBAR,
  sidebarHover: SIDEBAR_HOVER,
  sidebarActive: SIDEBAR_ACTIVE,
  sidebarText: SIDEBAR_TEXT,
  sidebarTextActive: SIDEBAR_TEXT_ACTIVE,

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',

  // Misc
  overlay: OVERLAY,
  shadow: SHADOW,
  infoSurface: INFO_LIGHT,
  surfaceWarm: WARNING_LIGHT,
  surfaceSky: INFO_LIGHT,

  // ─── Backward Compat Aliases ───────────────────────────────────────────────
  accent: '#0EA5E9',
  accentDark: '#0284C7',
  accentLight: '#E0F2FE',
  secondary: SURFACE,
  secondaryDark: BORDER,
  secondaryLight: BG_SECONDARY,
  primaryMid: PRIMARY_HOVER,
  primaryLight_compat: PRIMARY_LIGHT,
  successDark: '#15803D',
  successOnLight: SUCCESS,
  successLightBg: SUCCESS_LIGHT,
  warningDark: '#78550A',
  warningOnLight: WARNING,
  warningLightBg: WARNING_LIGHT,
  dangerDark: '#991B1B',
  dangerOnLight: DANGER,
  dangerLightBg: DANGER_LIGHT,
  infoOnLight: INFO,
  infoLightBg: INFO_LIGHT,
  textOnLight: TEXT_PRIMARY,
  textOnLightSecondary: TEXT_SECONDARY,
  textOnLightDisabled: TEXT_MUTED,
  gray0: BG_PRIMARY,
  gray8: TEXT_PRIMARY,

  // Category colors
  category1: '#B91C2C',
  category2: '#2563EB',
  category3: '#15934B',
  category4: '#B4690E',
  category5: '#0EA5E9',
  category6: '#EC4899',
};

// ─── Member Level Colors ─────────────────────────────────────────────────────
export const MemberLevelColors = {
  member:   { color: '#8A9099', bgColor: '#F3F4F6' },
  silver:   { color: '#6B7280', bgColor: '#F3F4F6' },
  gold:     { color: '#B4690E', bgColor: '#FCEFD3' },
  platinum: { color: '#2563EB', bgColor: '#DCE8FD' },
  vip:      { color: '#D32030', bgColor: '#FBE3E5' },
} as const;

// ─── Category Array ──────────────────────────────────────────────────────────
export const CategoryColors = [
  '#B91C2C', '#2563EB', '#15934B', '#B4690E', '#0EA5E9', '#EC4899',
];

// ─── Gradient Presets ────────────────────────────────────────────────────────
export const Gradients = {
  primary: ['#B91C2C', '#D32030'] as [string, string],
  primaryReverse: ['#D32030', '#B91C2C'] as [string, string],
  warm: ['#FFFFFF', '#FBE3E5'] as [string, string],
};
