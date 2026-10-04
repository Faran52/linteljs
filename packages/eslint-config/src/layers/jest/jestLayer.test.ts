import {
  frameworkRuleIdsFor,
  ruleIdsFor,
} from '@mocks/lintText';
import { layerWithoutConfig } from '@mocks/presets';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../base/baseLayer';

import jest from './jestLayer';

import type { Layer } from '../../types';

// The plugin reads the installed Jest's major, and this workspace installs none.
const JEST_VERSION: Layer = [{ settings: { jest: { version: 29 } } }];

const FOCUSED = "describe('sum', () => {\n  it.only('adds', () => {\n    expect(1 + 1).toBe(2);\n  });\n});\n";

const MOCKED = "jest.mock('./sum');\n\n"
  + "it('mocks', () => {\n  const mocked = jest.fn();\n\n  expect(mocked).toHaveBeenCalledTimes(0);\n});\n";

describe('jest', () => {
  const layer = (): Layer => {
    const built = [
      ...base(),
      ...jest(),
      ...JEST_VERSION,
    ];

    return built;
  };

  it('reports a focused test', async () => {
    const ruleIds = await ruleIdsFor(layer(), FOCUSED, 'src/lib/utils/sample.test.ts');
    expect(ruleIds).toContain('jest/no-focused-tests');
  });

  it('passes a clean suite written against the jest global', async () => {
    const ruleIds = await ruleIdsFor(layer(), MOCKED, 'src/lib/utils/sample.test.ts');
    expect(ruleIds).toStrictEqual([]);
  });

  it('leaves a non-test file alone', async () => {
    const ruleIds = await ruleIdsFor(layer(), FOCUSED, 'src/lib/utils/sample.ts');
    expect(ruleIds).not.toContain('jest/no-focused-tests');
  });

  it('enables no framework rule on a suite', async () => {
    const leaked = await frameworkRuleIdsFor(layer(), 'src/lib/utils/sample.test.ts');

    expect(leaked).toStrictEqual([]);
  });

  it('names flat/recommended when eslint-plugin-jest stops publishing it', async () => {
    const stripped = await layerWithoutConfig('eslint-plugin-jest', 'flat/recommended', async () => {
      const jestLayer = await import('./jestLayer');
      return jestLayer.jest;
    });

    expect(stripped).toThrow('jest/flat/recommended is not published');
  });
});
