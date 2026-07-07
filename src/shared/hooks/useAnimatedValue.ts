/**
 * useAnimatedValue — Animate a number from start to end (count-up / count-down)
 */
import { useEffect, useRef } from 'react';
import { useSharedValue, withTiming, runOnJS, Easing } from 'react-native-reanimated';

interface Options {
  duration?: number;
  delay?: number;
  formatter?: (value: number) => string;
  onDone?: () => void;
}

export function useAnimatedNumber(
  end: number,
  options: Options = {}
) {
  const { duration = 900, delay = 100, onDone } = options;
  const value = useSharedValue(0);
  const endRef = useRef(end);

  useEffect(() => {
    endRef.current = end;
    const timeout = setTimeout(() => {
      value.value = withTiming(endRef.current, { duration, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished && onDone) {
          runOnJS(onDone)();
        }
      });
    }, delay);

    return () => clearTimeout(timeout);
  }, [end, duration, delay, onDone, value]);

  return value;
}

