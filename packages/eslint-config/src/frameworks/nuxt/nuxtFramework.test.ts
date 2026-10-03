import { join } from 'node:path';

import {
  enabledRuleIdsFor,
  ownBlockNames,
  ruleIdsForFile,
  SFC_FIXTURES,
  sortsAheadOfPackages,
  startsWith,
} from '@mocks/lintText';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../../layers/base/baseLayer';
import typescript from '../../layers/typescript/typescriptLayer';
import vue from '../vue/vueFramework';

import nuxt, { nuxtGroup } from './nuxtFramework';

import type { Layer } from '../../types';

const layer = (): Layer => {
  const built = [
    ...base(),
    ...typescript(),
    ...vue(),
    ...nuxt(),
  ];

  return built;
};

describe('nuxt', () => {
  it('lets a route file be one word, and still refuses one anywhere else', async () => {
    const page = await ruleIdsForFile(layer(), join(SFC_FIXTURES, 'pages/about.vue'));
    const component = await ruleIdsForFile(layer(), join(SFC_FIXTURES, 'badge.vue'));

    expect(page).not.toContain(null);
    expect(page).not.toContain('vue/multi-word-component-names');
    expect(component).toContain('vue/multi-word-component-names');
  });

  it('keeps the vue layer underneath it', async () => {
    const ruleIds = await ruleIdsForFile(layer(), join(SFC_FIXTURES, 'Inaccessible.vue'));

    expect(ruleIds).not.toContain(null);
    const pluginReported = ruleIds.some(startsWith('vue'));
    expect(pluginReported).toBe(true);
  });

  it.each([
    'src/layouts/default.vue',
    'app.vue',
    'error.vue',
  ])('lets the route file %s be one word', async (path) => {
    const rule = 'vue/multi-word-component-names';

    const enabledRuleIds = await enabledRuleIdsFor(layer(), 'src/components/badge.vue');
    expect(enabledRuleIds).toContain(rule);
    const layerEnabledRuleIds = await enabledRuleIdsFor(layer(), path);
    expect(layerEnabledRuleIds).not.toContain(rule);
  });

  it.each([
    'nuxt',
    'nuxt/app',
    '#imports',
  ])('sorts %s into its own bucket ahead of the packages', async (specifier) => {
    const config = base({ frameworkGroup: nuxtGroup });
    const actual = await sortsAheadOfPackages(config, specifier);
    expect(actual).toBe(true);
  });

  it('leaves ~/ out of the framework bucket', async () => {
    const config = base({ frameworkGroup: nuxtGroup });
    const actual = await sortsAheadOfPackages(config, '~/utils');
    expect(actual).toBe(false);
  });

  it('names every block it writes', () => {
    const actual = ownBlockNames(nuxt());
    const expected = [
      '@linteljs/nuxt/route-files',
    ];
    expect(actual).toEqual(expected);
  });
});
