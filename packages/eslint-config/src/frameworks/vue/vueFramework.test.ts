import { join } from 'node:path';

import {
  codeLines,
  functionOf,
  messagesForFile,
  ownBlockNames,
  ruleIdsFor,
  ruleIdsForFile,
  ruleIdsForSfc,
  SFC_FIXTURES,
  sortsAheadOfPackages,
  startsWith,
} from '@mocks/lintText';
import { layerWithoutConfig } from '@mocks/presets';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../../layers/base/baseLayer';
import typescript from '../../layers/typescript/typescriptLayer';

import vue, { vueGroup } from './vueFramework';

describe('vue', () => {
  it('parses a single-file component and reports on its template', async () => {
    const ruleIds = await ruleIdsForFile(vue(), join(SFC_FIXTURES, 'Home.vue'));

    expect(ruleIds).not.toContain(null);
    expect(ruleIds.some(startsWith('vue/'))).toBe(true);
  });

  it('reports accessibility findings on a template', async () => {
    const layer = [...base(), ...typescript(), ...vue()];
    const ruleIds = await ruleIdsForFile(layer, join(SFC_FIXTURES, 'Inaccessible.vue'));

    expect(ruleIds).toContain('vuejs-accessibility/alt-text');
    expect(ruleIds).toContain('vuejs-accessibility/click-events-have-key-events');
  });

  it('accepts a label bound by for, and still reports one bound to nothing', async () => {
    const layer = [...base(), ...typescript(), ...vue()];
    const messages = await messagesForFile(layer, join(SFC_FIXTURES, 'LabelledField.vue'));
    const labels = messages
      .filter((message) => {
        return message.ruleId === 'vuejs-accessibility/label-has-for';
      });

    expect(labels).toHaveLength(1);
    expect(labels[0]?.line).toBe(5);
  });

  it('still types a script block with the a11y preset in the layer', async () => {
    const layer = [...base(), ...typescript(), ...vue()];
    const messages = await messagesForFile(layer, join(SFC_FIXTURES, 'Inaccessible.vue'));

    const fatal = messages
      .filter((message) => {
        return message.fatal === true;
      });

    expect(fatal).toEqual([]);
  });

  it('reaches TypeScript inside a script block with the base rules the preset scopes to .ts', async () => {
    const layer = [...base(), ...typescript(), ...vue()];
    const ruleIds = await ruleIdsForFile(layer, join(SFC_FIXTURES, 'ScriptUnion.vue'));

    expect(ruleIds).toContain('@linteljs/union-newline');
    expect(ruleIds).toContain('@linteljs/no-inline-object-types');
  });

  it('leaves a plain .js file to parse untyped', async () => {
    const layer = [...base(), ...typescript(), ...vue()];
    const ruleIds = await ruleIdsFor(layer, 'export const value = 1;\n', 'src/lib/value.js');

    expect(ruleIds).not.toContain(null);
  });

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

  it('caps a component file at 350 lines of code, template and script together', async () => {
    const component = (lines: number): string => {
      return `<template>\n  <main />\n</template>\n\n<script setup>\n${codeLines(lines - 5)}</script>\n`;
    };
    const atLimit = await ruleIdsForSfc([...base(), ...vue()], component(350), 'Big.vue');
    const overLimit = await ruleIdsForSfc([...base(), ...vue()], component(351), 'Big.vue');

    expect(atLimit).not.toContain(null);
    expect(atLimit).not.toContain('max-lines');
    expect(overLimit).toContain('max-lines');
  });

  it('caps a function in a component script at 350 lines', async () => {
    const component = (lines: number): string => {
      return `<script>\n${functionOf(lines)}</script>\n`;
    };
    const atLimit = await ruleIdsForSfc([...base(), ...vue()], component(350), 'Big.vue');
    const overLimit = await ruleIdsForSfc([...base(), ...vue()], component(351), 'Big.vue');

    expect(atLimit).not.toContain('max-lines-per-function');
    expect(overLimit).toContain('max-lines-per-function');
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
