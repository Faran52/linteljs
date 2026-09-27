import { View } from 'react-native';

import { layout } from '../../../styles/starter';

import type { ReactNode } from 'react';

// Views rather than SVG: React Native has no SVG without a dependency and no CSS animation.
const LINES = [72, 88, 56];

export const Mark = (): ReactNode => {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="linteljs"
      style={layout.mark}
    >
      <View style={layout.beam} />
      {LINES
        .map((width) => {
          return <View key={width} style={[layout.line, { width }]} />;
        })}
    </View>
  );
};
