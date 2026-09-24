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
import { tailwind } from '../../libraries/tailwind/tailwindLibrary';
import { tanstackQuery } from '../../libraries/tanstack-query/tanstackQueryLibrary';
import { tanstackRouter } from '../../libraries/tanstack-router/tanstackRouterLibrary';

import { FRAMEWORKS, LIBRARIES } from './loaderUtils';

import type { Framework } from '../../types';
import type { FrameworkParts } from './loaderUtils';

// What each framework loads: its own layer and import group, with the framework a meta-framework sits on underneath.
const FRAMEWORK_PARTS: [Framework, () => FrameworkParts][] = [
  ['react', () => {
    return {
      layer: react(),
      group: reactGroup,
    };
  }],
  ['next', () => {
    return {
      layer: [...react(), ...next()],
      group: nextGroup,
    };
  }],
  ['react-native', () => {
    return {
      layer: reactNative(),
      group: reactNativeGroup,
    };
  }],
  ['vue', () => {
    return {
      layer: vue(),
      group: vueGroup,
    };
  }],
  ['nuxt', () => {
    return {
      layer: [...vue(), ...nuxt()],
      group: nuxtGroup,
    };
  }],
  ['svelte', () => {
    return {
      layer: svelte(),
      group: svelteGroup,
    };
  }],
  ['solid', () => {
    return {
      layer: solid(),
      group: solidGroup,
    };
  }],
  ['angular', () => {
    return {
      layer: angular(),
      group: angularGroup,
    };
  }],
];

describe('FRAMEWORKS', () => {
  it('loads every framework named below', () => {
    expect(Object.keys(FRAMEWORKS)).toEqual(FRAMEWORK_PARTS.map(([framework]) => {
      return framework;
    }));
  });

  it.each(FRAMEWORK_PARTS)('loads %s', async (framework, parts) => {
    await expect(FRAMEWORKS[framework]()).resolves.toEqual(parts());
  });
});

describe('LIBRARIES', () => {
  it('loads each library layer', async () => {
    await expect(LIBRARIES['tanstack-query']({})).resolves.toEqual(tanstackQuery());
    await expect(LIBRARIES['tanstack-router']({})).resolves.toEqual(tanstackRouter());
  });

  // The entry point is the one option a loader passes on, and without it the plugin guesses at the stylesheet.
  it('hands tailwind the entry point it was given, and none when it was given none', async () => {
    await expect(LIBRARIES.tailwind({ tailwindEntryPoint: 'src/styles/app.css' }))
      .resolves.toEqual(tailwind('src/styles/app.css'));
    await expect(LIBRARIES.tailwind({})).resolves.toEqual(tailwind());
  });
});
