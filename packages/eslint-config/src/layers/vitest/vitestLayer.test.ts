import { ownBlockNames, ruleIdsFor } from '@mocks/lintText';
import { layerWithoutConfig } from '@mocks/presets';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../base/baseLayer';

import vitest from './vitestLayer';

const FOCUSED = "import { it } from 'vitest';\n\nit.only('runs', () => {\n  expect(1).toBe(1);\n});\n";

const TYPED = "import { expectTypeOf, it } from 'vitest';\n\n"
  + "it('mirrors', () => {\n  expectTypeOf<string>().toEqualTypeOf<string>();\n});\n";

describe('vitest', () => {
  const layer = [...base(), ...vitest()];

  it('reports a focused test', async () => {
    await expect(ruleIdsFor(layer, FOCUSED, 'src/lib/utils/sample.test.ts'))
      .resolves.toContain('vitest/no-focused-tests');
  });

  it('counts a type assertion as an assertion', async () => {
    await expect(ruleIdsFor(layer, TYPED, 'src/lib/utils/sample.test.ts'))
      .resolves.not.toContain('vitest/expect-expect');
  });

  it('leaves a non-test file alone', async () => {
    await expect(ruleIdsFor(layer, FOCUSED, 'src/lib/utils/sample.ts'))
      .resolves.not.toContain('vitest/no-focused-tests');
  });

  it.each([
    ['expect', "import { expect, it } from 'vitest';\n\nit('adds', () => {\n  expect(1 + 1).toBe(2);\n});\n"],
    ['assertType', "import { assertType, it } from 'vitest';\n\nit('types', () => {\n  assertType<number>(1);\n});\n"],
  ])('counts %s as an assertion', async (_name, code) => {
    await expect(ruleIdsFor(layer, code, 'src/lib/utils/sample.test.ts'))
      .resolves.not.toContain('vitest/expect-expect');
  });

  it('accepts the message vitest takes as a second argument to expect', async () => {
    const code = "import { expect, it } from 'vitest';\n\nit('adds', () => {\n  expect(1 + 1, 'sum').toBe(2);\n});\n";

    await expect(ruleIdsFor(layer, code, 'src/lib/utils/sample.test.ts')).resolves.not.toContain('vitest/valid-expect');
  });

  it('names every block it writes', () => {
    expect(ownBlockNames(vitest())).toEqual([
      '@linteljs/vitest',
    ]);
  });

  it.each([
    ['recommended', 'vitest/recommended'],
  ])('names %s when @vitest/eslint-plugin stops publishing it', async (key, label) => {
    const layer = await layerWithoutConfig('@vitest/eslint-plugin', key, async () => {
      return (await import('./vitestLayer')).vitest;
    });

    expect(layer).toThrow(`${label} is not published`);
  });
});
