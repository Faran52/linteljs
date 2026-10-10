import {
  E2E_FILES,
  JS_MARKUP_FILES,
  MARKUP_SIZE_RULES,
  MOCK_FILES,
  SCRIPT_FILES,
  STORY_FILES,
  TEST_FILES,
} from '../../config/constants';
import { reactCore, reactGroup } from '../utils/reactCoreUtils';

import type { Layer } from '../../types';

export const reactNativeGroup: string[] = reactGroup;

// `jsx-a11y-x` keys on lowercase DOM names, so it reads React Native markup as custom components and skips it.
export const reactNative = (): Layer => {
  const layer: Layer = [
    ...reactCore(),
    {
      name: '@linteljs/react-native/accessibility',
      // `reactCore()` above registers the plugin over the same files.
      files: SCRIPT_FILES,
      // Each is an opt-out, so `recommended` does not carry them.
      rules: {
        '@linteljs/native-accessible-name': 'error',
        '@linteljs/native-no-nested-touchables': 'error',
        '@linteljs/native-valid-accessibility-actions': 'error',
        '@linteljs/native-valid-accessibility-role': 'error',
        '@linteljs/native-valid-accessibility-state': 'error',
      },
    },
    // After `base`, so it restates the exemptions `base` grants after its own markup cap.
    {
      name: '@linteljs/react-native/markup-size',
      files: JS_MARKUP_FILES,
      ignores: [
        ...TEST_FILES,
        ...E2E_FILES,
        ...MOCK_FILES,
        ...STORY_FILES,
        '**/utils/**',
      ],
      rules: MARKUP_SIZE_RULES,
    },
  ];

  return layer;
};

export default reactNative;
