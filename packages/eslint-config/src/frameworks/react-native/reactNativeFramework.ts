import { SCRIPT_FILES } from '../../config/constants';
import { reactCore, reactGroup } from '../utils/reactCoreUtils';

import type { Layer } from '../../types';

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
    {
      name: '@linteljs/react-native/accessibility',
      // `reactCore()` above registers the plugin over the same files.
      files: SCRIPT_FILES,
      // Named rather than taken as a preset: each is an opt-out, so `recommended` does not carry them, and this
      // layer is the only one that wants the group.
      rules: {
        '@linteljs/native-accessible-name': 'error',
        '@linteljs/native-no-nested-touchables': 'error',
        '@linteljs/native-valid-accessibility-actions': 'error',
        '@linteljs/native-valid-accessibility-role': 'error',
        '@linteljs/native-valid-accessibility-state': 'error',
      },
    },
  ];
};

export default reactNative;
