import {
  describe,
  expect,
  it,
} from 'vitest';

import { angular, angularGroup } from '../../frameworks/angular/angularFramework';
import { next, nextGroup } from '../../frameworks/next/nextFramework';
import { nuxt, nuxtGroup } from '../../frameworks/nuxt/nuxtFramework';
import { react, reactGroup } from '../../frameworks/react/reactFramework';
import { reactNative, reactNativeGroup } from '../../frameworks/react-native/reactNativeFramework';
import { solid, solidGroup } from '../../frameworks/solid/solidFramework';
import { svelte, svelteGroup } from '../../frameworks/svelte/svelteFramework';
import { vue, vueGroup } from '../../frameworks/vue/vueFramework';
import { stylex } from '../../libraries/stylex/stylexLibrary';
import { tailwind } from '../../libraries/tailwind/tailwindLibrary';
import { tanstackQuery } from '../../libraries/tanstack-query/tanstackQueryLibrary';
import { tanstackRouter } from '../../libraries/tanstack-router/tanstackRouterLibrary';

import { FRAMEWORKS, LIBRARIES } from './loaderUtils';

import type { Framework, Layer } from '../../types';

// Each layer the framework spreads, in order, and its import group.
const FRAMEWORK_PARTS: [Framework, (() => Layer)[], string[]][] = [
  [
    'react',
    [react],
    reactGroup,
  ],
  [
    'next',
    [react, next],
    nextGroup,
  ],
  [
    'react-native',
    [reactNative],
    reactNativeGroup,
  ],
  [
    'vue',
    [vue],
    vueGroup,
  ],
  [
    'nuxt',
    [vue, nuxt],
    nuxtGroup,
  ],
  [
    'svelte',
    [svelte],
    svelteGroup,
  ],
  [
    'solid',
    [solid],
    solidGroup,
  ],
  [
    'angular',
    [angular],
    angularGroup,
  ],
];

describe('FRAMEWORKS', () => {
  it('loads every framework named below', () => {
    const withParts = FRAMEWORK_PARTS
      .map(([framework]) => {
        return framework;
      });

    const actual = Object.keys(FRAMEWORKS);
    expect(actual).toEqual(withParts);
  });

  it.each(FRAMEWORK_PARTS)('loads %s', async (framework, layers, group) => {
    const actual = await FRAMEWORKS[framework]();
    const layer = layers
      .flatMap((build) => {
        return build();
      });

    const expected = {
      layer,
      group,
    };
    expect(actual).toEqual(expected);
  });
});

describe('LIBRARIES', () => {
  it('loads each library layer', async () => {
    const queryLayer = await LIBRARIES['tanstack-query']({});
    expect(queryLayer).toEqual(tanstackQuery());
    const routerLayer = await LIBRARIES['tanstack-router']({});
    expect(routerLayer).toEqual(tanstackRouter());
    const stylexLayer = await LIBRARIES.stylex({});
    expect(stylexLayer).toEqual(stylex());
  });

  it('hands tailwind the entry point it was given, and none when it was given none', async () => {
    const withEntryPoint = await LIBRARIES.tailwind({ tailwindEntryPoint: 'src/styles/app.css' });
    expect(withEntryPoint).toEqual(tailwind('src/styles/app.css'));

    const withoutEntryPoint = await LIBRARIES.tailwind({});
    expect(withoutEntryPoint).toEqual(tailwind());
  });
});
