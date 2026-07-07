/**
 * animations — Reusable Reanimated presets for micro-interactions
 * Works on iOS, Android, and Web (with react-native-reanimated 4.x)
 */
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  FadeOut,
  FadeOutDown,
  FadeOutUp,
  Layout,
  SlideInDown,
  SlideInUp,
  SlideOutDown,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export { Animated, Layout };

export const Enter = {
  fade: FadeIn.duration(250).easing(Easing.out(Easing.ease)),
  fadeUp: FadeInUp.duration(300).easing(Easing.out(Easing.cubic)),
  fadeDown: FadeInDown.duration(300).easing(Easing.out(Easing.cubic)),
  fadeLeft: FadeInLeft.duration(300).easing(Easing.out(Easing.cubic)),
  fadeRight: FadeInRight.duration(300).easing(Easing.out(Easing.cubic)),
  slideUp: SlideInUp.duration(350).easing(Easing.out(Easing.cubic)),
  slideDown: SlideInDown.duration(350).easing(Easing.out(Easing.cubic)),
};

export const Exit = {
  fade: FadeOut.duration(200).easing(Easing.in(Easing.ease)),
  fadeUp: FadeOutUp.duration(250).easing(Easing.in(Easing.cubic)),
  fadeDown: FadeOutDown.duration(250).easing(Easing.in(Easing.cubic)),
  slideDown: SlideOutDown.duration(300).easing(Easing.in(Easing.cubic)),
};

export const springConfig = {
  soft: { damping: 20, stiffness: 200, mass: 0.8 },
  bouncy: { damping: 12, stiffness: 220, mass: 0.8 },
  stiff: { damping: 25, stiffness: 300, mass: 0.8 },
} as const;

export const timingConfig = {
  fast: { duration: 150, easing: Easing.out(Easing.ease) },
  normal: { duration: 250, easing: Easing.out(Easing.cubic) },
  slow: { duration: 400, easing: Easing.out(Easing.cubic) },
} as const;

export const withSpringSoft = (value: number) => withSpring(value, springConfig.soft);
export const withSpringBouncy = (value: number) => withSpring(value, springConfig.bouncy);
export const withTimingFast = (value: number) => withTiming(value, timingConfig.fast);
export const withTimingNormal = (value: number) => withTiming(value, timingConfig.normal);

/** Stagger delay for list items */
export const staggerDelay = (index: number, base = 50, max = 500) =>
  Math.min(index * base, max);

/** Card hover elevation / scale helper values */
export const Hover = {
  scale: 1.015,
  pressed: 0.98,
  duration: 150,
};
