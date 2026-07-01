/**
 * Xcellence ERP — Design System Tokens (Web)
 * Theme: Warm Pastel Coral/Orange
 */

export const Colors = {
  primary:        '#FF8A75',
  primaryDark:    '#D85A30',
  primaryLight:   '#FFE9DD',
  primaryHover:   '#FF9E8C',

  background:     '#FFF9F4',
  surface:        '#FFFFFF',
  surfaceHover:   '#FFFCFA',

  text:           '#3D2E2B',
  textSecondary:  '#5B4A46',
  textMuted:      '#6B5B57',
  textOnPrimary:  '#FFFFFF',

  border:         '#F0E2DA',
  borderFocus:    '#FF8A75',

  success:        '#1F7A5C',
  successLight:   '#C9F1E1',
  warning:        '#92660B',
  warningLight:   '#FFE8A3',
  danger:         '#D85A30',
  dangerLight:    '#FAECE7',
  info:           '#5B3FA0',
  infoLight:      '#E6DBFB',

  sidebar:        '#FFE9DD',
  sidebarHover:   '#FFD6C4',
  sidebarActive:  '#FF8A75',
  sidebarText:    '#5B4A46',
  sidebarTextActive: '#FFFFFF',

  white:          '#FFFFFF',
  black:          '#000000',
  overlay:        'rgba(0,0,0,0.4)',
} as const;

export const Space = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 40, '4xl': 48, '5xl': 56, '6xl': 64,
} as const;

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, full: 9999,
} as const;

export const Shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 6 },
  xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 10 },
} as const;

export const Font = {
  h1: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  h3: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  h4: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyLg: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySm: { fontSize: 13, fontWeight: '400' as const, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
  button: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  buttonSm: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  badge: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
  stat: { fontSize: 24, fontWeight: '800' as const, lineHeight: 32 },
  statSm: { fontSize: 16, fontWeight: '700' as const, lineHeight: 24 },
  th: { fontSize: 12, fontWeight: '600' as const, lineHeight: 18 },
  td: { fontSize: 14, fontWeight: '400' as const, lineHeight: 22 },
} as const;

export const Breakpoint = { mobile: 0, tablet: 768, laptop: 1024, desktop: 1280, ultraWide: 1536 } as const;
export const ZIndex = { base: 0, dropdown: 100, sticky: 200, modal: 300, overlay: 400, toast: 500 } as const;
export const Duration = { fast: 150, normal: 250, slow: 400 } as const;
