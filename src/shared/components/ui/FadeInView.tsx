/**
 * FadeInView — Wrapper that fades + slides its children in on mount
 */
import React from 'react';
import { ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { Enter } from '@/shared/lib/animations';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface Props {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
  className?: string;
}

export const FadeInView: React.FC<Props> = ({
  children,
  direction = 'up',
  delay = 0,
  duration,
  style,
  className,
}) => {
  const base =
    direction === 'none'
      ? Enter.fade
      : direction === 'up'
      ? Enter.fadeUp
      : direction === 'down'
      ? Enter.fadeDown
      : direction === 'left'
      ? Enter.fadeLeft
      : Enter.fadeRight;

  const entering = duration ? base.duration(duration).delay(delay) : base.delay(delay);

  return (
    <Animated.View entering={entering} style={style} className={className}>
      {children}
    </Animated.View>
  );
};

interface StaggerProps {
  children: React.ReactNode[];
  direction?: Direction;
  stagger?: number;
  initialDelay?: number;
  className?: string;
}

export const FadeInStagger: React.FC<StaggerProps> = ({
  children,
  direction = 'up',
  stagger = 50,
  initialDelay = 0,
  className,
}) => (
  <>
    {React.Children.map(children, (child, index) =>
      child ? (
        <FadeInView
          key={index}
          direction={direction}
          delay={initialDelay + index * stagger}
          className={className}
        >
          {child}
        </FadeInView>
      ) : null
    )}
  </>
);
