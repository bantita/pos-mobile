/**
 * Design Tokens — Spacing & Layout
 * Brand: Xcellence ERP
 * Based on 4px grid
 */

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const Padding = {
  screen: 16,
  card: 16,
  cardLg: 20,
  input: 12,
};

export const Margin = {
  section: 24,
  cardGap: 12,
  inputGap: 16,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const BorderWidth = {
  thin: 1,
  medium: 1.5,
  thick: 2,
};

export const Shadow = {
  none: {},
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: {
    shadowColor: '#E2231A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const ComponentSize = {
  button: { sm: 36, md: 44, lg: 52 },
  input: { sm: 36, md: 44, lg: 52 },
  icon: { sm: 16, md: 20, lg: 24, xl: 32 },
  avatar: { sm: 32, md: 40, lg: 56, xl: 72 },
};

export const Layout = {
  sidebarWidth: 240,
  sidebarCollapsed: 64,
  topBarHeight: 56,
  bottomTabHeight: 60,
  maxContentWidth: 1200,
};

export const Gap = Spacing;

export const Duration = {
  fast: 150,
  normal: 250,
  slow: 400,
};

export const Opacity = {
  disabled: 0.4,
  hover: 0.8,
  pressed: 0.7,
};

export const Container = {
  full: { flex: 1 },
  center: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
};
