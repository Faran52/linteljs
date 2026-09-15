import vitestPlugin from '@vitest/eslint-plugin';

import { SCRIPT_EXTENSIONS } from './utils/globUtils';
import { presetOf } from './utils/presetUtils';

import type { Layer } from './types';

const TEST_FILES = [`**/*.{test,spec}.{${SCRIPT_EXTENSIONS}}`];

export const vitest = (): Layer => {
  return [
    {
      ...presetOf(vitestPlugin.configs.recommended, 'vitest/recommended')[0],
      files: TEST_FILES,
    },
    {
      name: '@linteljs/vitest',
      files: TEST_FILES,
      rules: {
        // Vitest's `expect(actual, message)` takes two arguments; the rule defaults to Jest's one.
        'vitest/valid-expect': ['error', { maxArgs: 2 }],
      },
    },
  ];
};

export default vitest;
