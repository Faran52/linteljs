import jestPlugin from 'eslint-plugin-jest';

import { SCRIPT_EXTENSIONS } from '../../config/constants';
import { presetOf } from '../../utils/presetUtils';

import type { Layer } from '../../types';

const TEST_FILES = [`**/*.{test,spec}.{${SCRIPT_EXTENSIONS}}`];

// For a project on Jest, such as React Native on `jest-expo`: its suites read Jest's globals.
export const jest = (): Layer => {
  const layer = presetOf(jestPlugin.configs['flat/recommended'], 'jest/flat/recommended', TEST_FILES);

  return layer;
};

export default jest;
