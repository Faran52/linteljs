import { View } from 'react-native';
import Animated, {
  type CSSAnimationKeyframes,
  cubicBezier,
  useReducedMotion,
} from 'react-native-reanimated';

import { useStarterStyles } from '@styles/starterStyles';

import type { ReactNode } from 'react';

// Views rather than SVG: React Native has no SVG without a dependency.
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

// Control points of the easing back from the drift, which swings past rest before it settles.
const OVERSHOOT_START = 0.3;
const OVERSHOOT_PEAK = 1.6;
const OVERSHOOT_SETTLE = 0.5;

const cascade = (drift: number): CSSAnimationKeyframes => {
  const keyframes: CSSAnimationKeyframes = {
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
      animationTimingFunction: cubicBezier(OVERSHOOT_START, OVERSHOOT_PEAK, OVERSHOOT_SETTLE, 1),
    },
    '82%': { transform: [{ translateX: 0 }] },
    '100%': { transform: [{ translateX: 0 }] },
  };

  return keyframes;
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
          const animation = still
            ? {}
            : {
                animationName: cascade(drift),
                animationDuration: '5s',
                animationDelay: delay,
                animationIterationCount: 'infinite',
              } as const;
          const lineStyle = [
            layout.line,
            { width },
            animation,
          ];

          return (
            <Animated.View
              key={width}
              style={lineStyle}
            />
          );
        })}
    </View>
  );
};
