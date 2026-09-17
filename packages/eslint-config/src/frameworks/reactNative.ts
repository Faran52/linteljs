import lintel from '@linteljs/eslint-plugin';

import { presetOf } from '../utils/presetUtils';

import {
  REACT_FILES,
  reactCore,
  reactGroup,
} from './reactCore';

import type { Layer } from '../types';

// `^react-` already covers `react-native`, so the import group is React's.
export const reactNativeGroup: string[] = reactGroup;

/**
 * React without the web accessibility preset, and with this plugin's own in its place. `jsx-a11y-x` keys on lowercase
 * DOM element names, and React Native renders `<Image>`, `<Text>` and `<Pressable>`, which it reads as unknown custom
 * components and skips: measured, the same defect reports four findings as web markup and none as React Native
 * markup. The replacement reads the props React Native actually announces with, `accessibilityLabel` and its family,
 * and is scoped here rather than shared because `Button`, `Switch` and `TextInput` mean something else on the web.
 */
export const reactNative = (): Layer => {
  return [
    ...reactCore(),
    ...presetOf(lintel.configs['flat/accessibility'][0], '@linteljs/accessibility', REACT_FILES),
  ];
};

export default reactNative;
