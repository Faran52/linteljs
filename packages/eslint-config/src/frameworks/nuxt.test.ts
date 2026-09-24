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

import base from '../base';
import typescript from '../typescript';

import nuxt, { nuxtGroup } from './nuxt';
import vue from './vue';

// The vue layer nests its own parser under the two beneath it, and its `projectService` wants a file on disk.
const layer = [...base(), ...typescript(), ...vue(), ...nuxt()];

describe('nuxt', () => {
  /*
   * A page's filename is its URL: `pages/index.vue` is `/` and `pages/about.vue` is `/about`. Without the
   * carve-out every route file in a Nuxt project fails its own lint for a name the router chose.
   */
  it('lets a route file be one word, and still refuses one anywhere else', async () => {
    const page = await ruleIdsForFile(layer, join(SFC_FIXTURES, 'pages/about.vue'));
    const component = await ruleIdsForFile(layer, join(SFC_FIXTURES, 'badge.vue'));

    expect(page).not.toContain(null);
    expect(page).not.toContain('vue/multi-word-component-names');
    expect(component).toContain('vue/multi-word-component-names');
  });

  // Stacked on `vue()`, so what that layer reports still reports.
  it('keeps the vue layer underneath it', async () => {
    const ruleIds = await ruleIdsForFile(layer, join(SFC_FIXTURES, 'Inaccessible.vue'));

    expect(ruleIds).not.toContain(null);
    expect(ruleIds.some(startsWith('vue'))).toBe(true);
  });

  it.each([
    'src/layouts/default.vue',
    'app.vue',
    'error.vue',
  ])('lets the route file %s be one word', async (path) => {
    const rule = 'vue/multi-word-component-names';

    await expect(enabledRuleIdsFor(layer, 'src/components/badge.vue')).resolves.toContain(rule);
    await expect(enabledRuleIdsFor(layer, path)).resolves.not.toContain(rule);
  });

  it.each([
    'nuxt',
    'nuxt/app',
    '#imports',
  ])('sorts %s into its own bucket ahead of the packages', async (specifier) => {
    await expect(sortsAheadOfPackages(base({ frameworkGroup: nuxtGroup }), specifier)).resolves.toBe(true);
  });

  // `^#` rather than a catch-all: Nuxt's `~/` alias is the project's own code and stays out of the framework bucket.
  it('leaves ~/ out of the framework bucket', async () => {
    await expect(sortsAheadOfPackages(base({ frameworkGroup: nuxtGroup }), '~/utils')).resolves.toBe(false);
  });

  it('names every block it writes', () => {
    expect(ownBlockNames(nuxt())).toEqual([
      '@linteljs/nuxt/route-files',
    ]);
  });
});
