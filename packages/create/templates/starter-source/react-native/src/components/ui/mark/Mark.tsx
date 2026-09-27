import { View } from 'react-native';

import { layout } from '../../../styles/starter';

import type { ReactNode } from 'react';

/*
 * A beam, and three lines that come into line with it. The beam never moves: it is the standard, and the lines are
 * the files.
 *
 * Four views rather than the SVG every other target draws, and static rather than animated. React Native has no
 * SVG without a dependency and no CSS animation at all, and a mark is not worth either; the shape is the same.
 */
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
