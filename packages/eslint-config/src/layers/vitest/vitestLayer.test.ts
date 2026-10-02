import {
  frameworkRuleIdsFor,
  ownBlockNames,
  ruleIdsFor,
} from '@mocks/lintText';
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
    const ruleIds = await ruleIdsFor(layer, FOCUSED, 'src/lib/utils/sample.test.ts');
    expect(ruleIds).toContain('vitest/no-focused-tests');
  });

  it('counts a type assertion as an assertion', async () => {
    const ruleIds = await ruleIdsFor(layer, TYPED, 'src/lib/utils/sample.test.ts');
    expect(ruleIds).not.toContain('vitest/expect-expect');
  });

  it('leaves a non-test file alone', async () => {
    const ruleIds = await ruleIdsFor(layer, FOCUSED, 'src/lib/utils/sample.ts');
    expect(ruleIds).not.toContain('vitest/no-focused-tests');
  });

  it.each([
    ['expect', "import { expect, it } from 'vitest';\n\nit('adds', () => {\n  expect(1 + 1).toBe(2);\n});\n"],
    ['assertType', "import { assertType, it } from 'vitest';\n\nit('types', () => {\n  assertType<number>(1);\n});\n"],
  ])('counts %s as an assertion', async (_name, code) => {
    const ruleIds = await ruleIdsFor(layer, code, 'src/lib/utils/sample.test.ts');
    expect(ruleIds).not.toContain('vitest/expect-expect');
  });

  it('accepts the message vitest takes as a second argument to expect', async () => {
    const code = "import { expect, it } from 'vitest';\n\nit('adds', () => {\n  expect(1 + 1, 'sum').toBe(2);\n});\n";

    const ruleIds = await ruleIdsFor(layer, code, 'src/lib/utils/sample.test.ts');
    expect(ruleIds).not.toContain('vitest/valid-expect');
  });

  it('accepts a message held in a variable, which the rule forgives by default only as a literal', async () => {
    const code = "import { expect, it } from 'vitest';\n\nconst label = 'sum';\n\n"
      + "it('adds', () => {\n  expect(1 + 1, label).toBe(2);\n});\n";

    const ruleIds = await ruleIdsFor(layer, code, 'src/lib/utils/sample.test.ts');
    expect(ruleIds).not.toContain('vitest/valid-expect');
  });

  it('enables no framework rule on a suite', async () => {
    const leaked = await frameworkRuleIdsFor(layer, 'src/lib/utils/sample.test.ts');

    expect(leaked).toStrictEqual([]);
  });

  it('names every block it writes', () => {
    const actual = ownBlockNames(vitest());
    const expected = [
      '@linteljs/vitest',
    ];
    expect(actual).toEqual(expected);
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
