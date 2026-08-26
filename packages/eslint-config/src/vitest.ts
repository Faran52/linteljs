import vitestPlugin from '@vitest/eslint-plugin';

import { SCRIPT_EXTENSIONS } from './utils/globUtils';
import { presetOf } from './utils/presetUtils';

import type { Layer } from './types';

const TEST_FILES = [`**/*.{test,spec}.{${SCRIPT_EXTENSIONS}}`];

// Scoped to the test glob rather than a `__tests__` folder: colocated tests are the standard.
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
        /**
         * Vitest's `expect(actual, message)` takes a second argument naming what the assertion means, which Jest has
         * no equivalent for and which the rule's default of one argument reports. Raised rather than turned off, so a
         * third argument is still a mistake. This is the runner's own documented signature, not a project's licence.
         */
        'vitest/valid-expect': ['error', { maxArgs: 2 }],
      },
    },
  ];
};

export default vitest;
