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

import {
  type FrameworkParts,
  FRAMEWORKS,
  LIBRARIES,
} from './loaderUtils';

import type { Framework } from '../../types';

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
    const withParts = FRAMEWORK_PARTS
      .map(([framework]) => {
        return framework;
      });

    const actual = Object.keys(FRAMEWORKS);
    expect(actual).toEqual(withParts);
  });

  it.each(FRAMEWORK_PARTS)('loads %s', async (framework, parts) => {
    const actual = await FRAMEWORKS[framework]();
    expect(actual).toEqual(parts());
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
    const tailwindOptions = { tailwindEntryPoint: 'src/styles/app.css' } as const;
    const withEntryPoint = await LIBRARIES.tailwind(tailwindOptions);
    expect(withEntryPoint).toEqual(tailwind('src/styles/app.css'));

    const withoutEntryPoint = await LIBRARIES.tailwind({});
    expect(withoutEntryPoint).toEqual(tailwind());
  });
});
