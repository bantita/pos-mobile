import colors from 'tailwindcss/colors';

// ═══════════════════════════════════════════════════════════════════════════
// COLORS — Single source of truth
// ═══════════════════════════════════════════════════════════════════════════

export const Colors = {
  // ── Brand (Rose) ──
  primary:        colors.rose[500],
  primaryDark:    colors.rose[600],
  primaryDarker:  colors.rose[700],
  primaryLight:   colors.rose[50],
  primaryHover:   colors.rose[400],
  primaryMuted:   colors.rose[100],
  primaryAccent:  colors.rose[300],

  // ── Background & Surface ──
  background:     '#f6f7fb',
  backgroundSecondary: colors.rose[50],
  surface:        colors.white,
  surfaceHover:   colors.slate[50],
  surfaceAlt:     colors.slate[100],
  surfaceLight:   colors.white,
  surfaceLightCard: colors.neutral[50],

  // ── Text — bolder defaults ──
  text:           colors.slate[950],
  textSecondary:  colors.slate[600],
  textMuted:      colors.slate[400],
  textOnPrimary:  colors.white,
  textDisabled:   colors.slate[400],

  // ── Borders ──
  border:         colors.slate[200],
  borderLight:    colors.slate[100],
  borderFocus:    colors.rose[500],
  divider:        colors.slate[100],

  // ── Semantic ──
  success:        colors.emerald[600],
  successLight:   colors.emerald[50],
  successMuted:   colors.emerald[100],
  successBg:      colors.emerald[50],
  successText:    colors.emerald[700],
  warning:        colors.amber[600],
  warningLight:   colors.amber[50],
  warningMuted:   colors.amber[100],
  warningBg:      colors.amber[50],
  warningText:    colors.amber[700],
  danger:         colors.red[500],
  dangerLight:    colors.red[50],
  dangerMuted:    colors.red[100],
  dangerBg:       colors.red[50],
  dangerText:     colors.red[600],
  info:           colors.violet[600],
  infoLight:      colors.violet[50],
  infoMuted:      colors.violet[100],

  // ── Stock Status ──
  stockOk:        colors.emerald[50],
  stockOkText:    colors.emerald[700],
  stockLow:       colors.amber[50],
  stockLowText:   colors.amber[700],
  stockOut:       colors.red[50],
  stockOutText:   colors.red[600],

  // ── Accent Pastels ──
  mint:           colors.emerald[50],
  mintDark:       colors.emerald[600],
  amber:          colors.amber[50],
  amberDark:      colors.amber[600],
  lavender:       colors.violet[50],
  lavenderDark:   colors.violet[600],

  // ── Sidebar ──
  sidebar:        colors.white,
  sidebarHover:   colors.rose[50],
  sidebarActive:  colors.rose[500],
  sidebarText:    colors.slate[600],
  sidebarTextActive: colors.white,

  // ── Category ──
  category1: colors.rose[500],
  category2: colors.violet[600],
  category3: colors.emerald[600],
  category4: colors.amber[600],
  category5: colors.sky[500],
  category6: colors.pink[500],

  // ── Neutrals ──
  gray50:         colors.gray[50],
  gray100:        colors.gray[100],
  gray200:        colors.gray[200],
  gray300:        colors.gray[300],
  gray400:        colors.gray[400],
  gray500:        colors.gray[500],
  gray600:        colors.gray[600],
  gray700:        colors.gray[700],
  gray800:        colors.gray[800],

  // ── Utility ──
  white:          colors.white,
  black:          colors.black,
  overlay:        'rgba(0,0,0,0.45)',
  overlayLight:   'rgba(0,0,0,0.25)',
  shadow:         colors.black,
} as const;

export const CategoryColors = [
  colors.rose[500], colors.violet[600], colors.emerald[600],
  colors.amber[600], colors.sky[500], colors.pink[500],
] as const;

export const Gradients = {
  primary: [colors.rose[500], colors.rose[300]] as [string, string],
  primaryReverse: [colors.rose[300], colors.rose[500]] as [string, string],
  warm: [colors.slate[50], colors.rose[50]] as [string, string],
} as const;

export const MemberLevelColors = {
  member:   { color: colors.slate[500], bgColor: colors.slate[100] },
  silver:   { color: colors.gray[500], bgColor: colors.gray[100] },
  gold:     { color: colors.amber[700], bgColor: colors.amber[100] },
  platinum: { color: colors.violet[600], bgColor: colors.violet[100] },
  vip:      { color: colors.rose[600], bgColor: colors.rose[50] },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════════════════

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const FontSize = {
  micro: 9,
  xxs: 10,
  xs: 11,
  caption: 13,
  sm: 13,
  body: 15,
  bodyLg: 16,
  subtitle: 17,
  subtitleLg: 18,
  title: 20,
  titleLg: 22,
  heading: 26,
  headingLg: 30,
  display: 34,
  displayLg: 42,
} as const;

export const LineHeight = {
  tight: 18,
  normal: 22,
  relaxed: 26,
  loose: 30,
  heading: 34,
  display: 42,
  displayLg: 50,
} as const;

export const Font = {
  h1:       { fontSize: FontSize.heading, fontWeight: '700' as const, lineHeight: LineHeight.heading },
  h2:       { fontSize: FontSize.titleLg, fontWeight: '700' as const, lineHeight: LineHeight.loose },
  h3:       { fontSize: FontSize.title, fontWeight: '600' as const, lineHeight: LineHeight.relaxed },
  h4:       { fontSize: FontSize.subtitle, fontWeight: '600' as const, lineHeight: LineHeight.relaxed },
  body:     { fontSize: FontSize.body, fontWeight: '500' as const, lineHeight: LineHeight.relaxed },
  bodyLg:   { fontSize: FontSize.bodyLg, fontWeight: '500' as const, lineHeight: LineHeight.relaxed },
  bodySm:   { fontSize: FontSize.sm, fontWeight: '500' as const, lineHeight: LineHeight.tight },
  label:    { fontSize: FontSize.caption, fontWeight: '600' as const, lineHeight: LineHeight.tight },
  labelSm:  { fontSize: FontSize.xs, fontWeight: '600' as const, lineHeight: LineHeight.tight },
  button:   { fontSize: FontSize.body, fontWeight: '600' as const, lineHeight: LineHeight.normal },
  buttonSm: { fontSize: FontSize.sm, fontWeight: '600' as const, lineHeight: LineHeight.tight },
  buttonLg: { fontSize: FontSize.bodyLg, fontWeight: '700' as const, lineHeight: LineHeight.normal },
  caption:  { fontSize: FontSize.caption, fontWeight: '500' as const, lineHeight: LineHeight.tight },
  badge:    { fontSize: FontSize.xs, fontWeight: '700' as const, lineHeight: LineHeight.tight },
  stat:     { fontSize: FontSize.headingLg, fontWeight: '800' as const, lineHeight: LineHeight.heading },
  statSm:   { fontSize: FontSize.titleLg, fontWeight: '700' as const, lineHeight: LineHeight.loose },
  th:       { fontSize: FontSize.xs, fontWeight: '600' as const, lineHeight: LineHeight.tight },
  td:       { fontSize: FontSize.sm, fontWeight: '500' as const, lineHeight: LineHeight.normal },
  price:    { fontSize: FontSize.titleLg, fontWeight: '700' as const, lineHeight: LineHeight.loose },
  kpiValue: { fontSize: FontSize.heading, fontWeight: '800' as const, lineHeight: LineHeight.heading },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SPACING & LAYOUT
// ═══════════════════════════════════════════════════════════════════════════

export const Space = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20,
  '2xl': 24, '3xl': 32, '4xl': 40, '5xl': 48, '6xl': 64,
} as const;

export const Padding = {
  screen: 16, card: 16, cardLg: 20, input: 12,
} as const;

export const Margin = {
  section: 24, cardGap: 12, inputGap: 16,
} as const;

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 20,
  '2xl': 24, '3xl': 28, full: 9999,
} as const;

export const BorderWidth = {
  thin: 1, medium: 1.5, thick: 2,
} as const;

export const Shadow = {
  sm: { boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)' },
  md: { boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' },
  lg: { boxShadow: '0 16px 40px rgba(15, 23, 42, 0.10)' },
  xl: { boxShadow: '0 24px 64px rgba(15, 23, 42, 0.14)' },
  glow: { boxShadow: '0 12px 28px rgba(244, 63, 94, 0.24)' },
} as const;

export const ComponentSize = {
  button: { sm: 36, md: 44, lg: 52 },
  input: { sm: 36, md: 44, lg: 52 },
  icon: { sm: 16, md: 20, lg: 24, xl: 32 },
  avatar: { sm: 32, md: 40, lg: 56, xl: 72 },
} as const;

export const Layout = {
  sidebarWidth: 252,
  sidebarCollapsed: 68,
  topBarHeight: 68,
  bottomTabHeight: 68,
  maxContentWidth: 1680,
} as const;

export const Opacity = {
  disabled: 0.4,
  hover: 0.8,
  pressed: 0.7,
} as const;

export const Container = {
  full: { flex: 1 as const },
  center: { flex: 1 as const, alignItems: 'center' as const, justifyContent: 'center' as const },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// BREAKPOINTS
// ═══════════════════════════════════════════════════════════════════════════

export const Breakpoint = {
  mobile: 0,
  tablet: 768,
  laptop: 1024,
  desktop: 1280,
  ultraWide: 1536,
} as const;

export const ZIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  overlay: 400,
  toast: 500,
} as const;

export const Duration = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;
