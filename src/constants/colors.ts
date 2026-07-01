/**
 * Design Tokens — Color System
 * Brand: Xcellence ERP · POS Mobile
 * Theme: Warm Pastel Coral/Orange
 */

// ─── Brand ───────────────────────────────────────────────────────────────────
const PRIMARY = '#FF8A75';
const PRIMARY_DARK = '#D85A30';
const PRIMARY_LIGHT = '#FFE9DD';
const PRIMARY_HOVER = '#FF9E8C';

// ─── Background & Surface ────────────────────────────────────────────────────
const BG_PRIMARY = '#FFF9F4';
const BG_SECONDARY = '#FFE9DD';
const SURFACE = '#FFFFFF';
const SURFACE_HOVER = '#FFFCFA';

// ─── Text ────────────────────────────────────────────────────────────────────
const TEXT_PRIMARY = '#3D2E2B';
const TEXT_SECONDARY = '#5B4A46';
const TEXT_MUTED = '#6B5B57';
const TEXT_ON_PRIMARY = '#FFFFFF';

// ─── Borders ─────────────────────────────────────────────────────────────────
const BORDER = '#F0E2DA';
const BORDER_FOCUS = PRIMARY;
const BORDER_LIGHT = '#F5EDE8';

// ─── Semantic / Status ───────────────────────────────────────────────────────
const SUCCESS = '#1F7A5C';
const SUCCESS_LIGHT = '#C9F1E1';
const WARNING = '#92660B';
const WARNING_LIGHT = '#FFE8A3';
const DANGER = '#D85A30';
const DANGER_LIGHT = '#FAECE7';
const INFO = '#5B3FA0';
const INFO_LIGHT = '#E6DBFB';

// ─── Named Status ────────────────────────────────────────────────────────────
const SUCCESS_BG = '#EAF3DE';
const SUCCESS_TEXT = '#3B6D11';
const WARNING_BG = '#FAEEDA';
const WARNING_TEXT = '#854F0B';
const DANGER_BG = '#FAECE7';
const DANGER_TEXT = '#D85A30';

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const SIDEBAR = '#FFE9DD';
const SIDEBAR_HOVER = '#FFD6C4';
const SIDEBAR_ACTIVE = PRIMARY;
const SIDEBAR_TEXT = '#5B4A46';
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
  category1: '#FF8A75',
  category2: '#5B3FA0',
  category3: '#1F7A5C',
  category4: '#92660B',
  category5: '#0EA5E9',
  category6: '#EC4899',
};

// ─── Member Level Colors ─────────────────────────────────────────────────────
export const MemberLevelColors = {
  member:   { color: '#8A7672', bgColor: '#F5EDE8' },
  silver:   { color: '#6B7280', bgColor: '#F3F4F6' },
  gold:     { color: '#92660B', bgColor: '#FFE8A3' },
  platinum: { color: '#5B3FA0', bgColor: '#E6DBFB' },
  vip:      { color: '#D85A30', bgColor: '#FAECE7' },
} as const;

// ─── Category Array ──────────────────────────────────────────────────────────
export const CategoryColors = [
  '#FF8A75', '#5B3FA0', '#1F7A5C', '#92660B', '#0EA5E9', '#EC4899',
];

// ─── Gradient Presets ────────────────────────────────────────────────────────
export const Gradients = {
  primary: ['#FF8A75', '#FFB89A'] as [string, string],
  primaryReverse: ['#FFB89A', '#FF8A75'] as [string, string],
  warm: ['#FFF9F4', '#FFE9DD'] as [string, string],
};
