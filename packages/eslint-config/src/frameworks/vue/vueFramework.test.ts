import { join } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../../layers/base/baseLayer';
import typescript from '../../layers/typescript/typescriptLayer';

import vue, { vueGroup } from './vueFramework';

import {
  messagesForFile,
  ownBlockNames,
  ruleIdsForFile,
  SFC_FIXTURES,
  sortsAheadOfPackages,
  startsWith,
} from '#mocks/lintText';
import { layerWithoutConfig } from '#mocks/presets';

describe('vue', () => {
  it('parses a single-file component and reports on its template', async () => {
    const ruleIds = await ruleIdsForFile(vue(), join(SFC_FIXTURES, 'Home.vue'));

    expect(ruleIds).not.toContain(null);
    expect(ruleIds.some(startsWith('vue/'))).toBe(true);
  });

  // Real findings, not config: the a11y preset brings its own parser, and ours has to win with both reporting.
  it('reports accessibility findings on a template', async () => {
    const layer = [...base(), ...typescript(), ...vue()];
    const ruleIds = await ruleIdsForFile(layer, join(SFC_FIXTURES, 'Inaccessible.vue'));

    expect(ruleIds).toContain('vuejs-accessibility/alt-text');
    expect(ruleIds).toContain('vuejs-accessibility/click-events-have-key-events');
  });

  /*
   * `for` is the documented way to bind a label to a control, and the rule's default demands the control sit
   * inside the label as well. A label bound to nothing is still reported, which is the half worth keeping.
   */
  it('accepts a label bound by for, and still reports one bound to nothing', async () => {
    const layer = [...base(), ...typescript(), ...vue()];
    const messages = await messagesForFile(layer, join(SFC_FIXTURES, 'LabelledField.vue'));
    const labels = messages.filter((message) => {
      return message.ruleId === 'vuejs-accessibility/label-has-for';
    });

    expect(labels).toHaveLength(1);
    expect(labels[0]?.line).toBe(5);
  });

  // A parse error carries no rule id.
  it('still types a script block with the a11y preset in the layer', async () => {
    const layer = [...base(), ...typescript(), ...vue()];
    const messages = await messagesForFile(layer, join(SFC_FIXTURES, 'Inaccessible.vue'));

    expect(messages.filter((message) => {
      return message.fatal === true;
    })).toEqual([]);
  });

  /**
   * The plugin's presets scope a `language: 'typescript'` rule to the four TypeScript extensions, so `base`
   * restates every one of them to reach a script block. `no-inline-object-types` was the one the restatement
   * missed: the fixture's `{ a: string } | { b: string }` trips both, and only `union-newline` reported.
   */
  it('reaches TypeScript inside a script block with the base rules the preset scopes to .ts', async () => {
    const layer = [...base(), ...typescript(), ...vue()];
    const ruleIds = await ruleIdsForFile(layer, join(SFC_FIXTURES, 'ScriptUnion.vue'));

    expect(ruleIds).toContain('@linteljs/union-newline');
    expect(ruleIds).toContain('@linteljs/no-inline-object-types');
  });

  // An SFC import is typed as nothing, so the two rules that follow a value out of it are handed to `vue-tsc`.
  it('lets a .ts file pass an imported component along', async () => {
    const file = join(SFC_FIXTURES, 'registerHome.ts');
    const plain = await ruleIdsForFile([...base(), ...typescript()], file);
    const composed = await ruleIdsForFile([...base(), ...typescript(), ...vue()], file);

    expect(plain).toContain('@typescript-eslint/no-unsafe-argument');
    expect(plain).toContain('@typescript-eslint/no-unsafe-assignment');
    expect(composed).not.toContain('@typescript-eslint/no-unsafe-argument');
    expect(composed).not.toContain('@typescript-eslint/no-unsafe-assignment');
  });

  it.each([
    'vue',
    'vue-router',
    'pinia',
    '@vue/test-utils',
  ])('sorts %s into its own bucket ahead of the packages', async (specifier) => {
    await expect(sortsAheadOfPackages(base({ frameworkGroup: vueGroup }), specifier)).resolves.toBe(true);
  });

  it('names every block it writes', () => {
    expect(ownBlockNames(vue())).toEqual([
      '@linteljs/vue',
      '@linteljs/vue/sfc-import-seam',
    ]);
  });

  it.each([
    ['flat/recommended', 'vue/flat/recommended'],
  ])('names %s when eslint-plugin-vue stops publishing it', async (key, label) => {
    const layer = await layerWithoutConfig('eslint-plugin-vue', key, async () => {
      return (await import('./vueFramework')).vue;
    });

    expect(layer).toThrow(`${label} is not published`);
  });

  it.each([
    ['flat/recommended', 'vuejs-accessibility/flat/recommended'],
  ])('names %s when eslint-plugin-vuejs-accessibility stops publishing it', async (key, label) => {
    const layer = await layerWithoutConfig('eslint-plugin-vuejs-accessibility', key, async () => {
      return (await import('./vueFramework')).vue;
    });

    expect(layer).toThrow(`${label} is not published`);
  });
});
