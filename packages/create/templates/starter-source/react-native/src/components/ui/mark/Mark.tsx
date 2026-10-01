import { View } from 'react-native';
import Animated, {
  type CSSAnimationKeyframes,
  cubicBezier,
  useReducedMotion,
} from 'react-native-reanimated';

import { useStarterStyles } from '@styles/starter';

import type { ReactNode } from 'react';

// Views rather than SVG: React Native has no SVG without a dependency. The web's `cascade` keyframes, in Reanimated.
const LINES = [
  {
    width: 72,
    drift: 22,
    delay: '0s',
  },
  {
    width: 88,
    drift: 9,
    delay: '0.1s',
  },
  {
    width: 56,
    drift: 32,
    delay: '0.2s',
  },
] as const;

const cascade = (drift: number): CSSAnimationKeyframes => {
  return {
    '0%': {
      transform: [{ translateX: 0 }],
      animationTimingFunction: 'ease-in-out',
    },
    '32%': {
      transform: [{ translateX: 0 }],
      animationTimingFunction: 'ease-in-out',
    },
    '58%': { transform: [{ translateX: drift }] },
    '70%': {
      transform: [{ translateX: drift }],
      animationTimingFunction: cubicBezier(0.3, 1.6, 0.5, 1),
    },
    '82%': { transform: [{ translateX: 0 }] },
    '100%': { transform: [{ translateX: 0 }] },
  };
};

export const Mark = (): ReactNode => {
  const { layout } = useStarterStyles();
  const still = useReducedMotion();

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="linteljs"
      style={layout.mark}
    >
      <View style={layout.beam} />
      {LINES
        .map(({
          width,
          drift,
          delay,
        }) => {
          return (
            <Animated.View
              key={width}
              style={[
                layout.line,
                { width },
                still
                  ? {}
                  : {
                      animationName: cascade(drift),
                      animationDuration: '5s',
                      animationDelay: delay,
                      animationIterationCount: 'infinite',
                    },
              ]}
            />
          );
        })}
    </View>
  );
};
