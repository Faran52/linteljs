import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { angular, angularGroup } from '../../frameworks/angular/angularFramework';
import { astro } from '../../frameworks/astro/astroFramework';
import { next, nextGroup } from '../../frameworks/next/nextFramework';
import { nuxt, nuxtGroup } from '../../frameworks/nuxt/nuxtFramework';
import { react, reactGroup } from '../../frameworks/react/reactFramework';
import { reactNative, reactNativeGroup } from '../../frameworks/react-native/reactNativeFramework';
import { solid, solidGroup } from '../../frameworks/solid/solidFramework';
import { svelte, svelteGroup } from '../../frameworks/svelte/svelteFramework';
import { vue, vueGroup } from '../../frameworks/vue/vueFramework';
import { html } from '../../layers/html/htmlLayer';
import { jest } from '../../layers/jest/jestLayer';
import { playwright } from '../../layers/playwright/playwrightLayer';
import { storybook } from '../../layers/storybook/storybookLayer';
import { vitest } from '../../layers/vitest/vitestLayer';
import { stylex } from '../../libraries/stylex/stylexLibrary';
import { tailwind } from '../../libraries/tailwind/tailwindLibrary';
import { tanstackQuery } from '../../libraries/tanstack-query/tanstackQueryLibrary';
import { tanstackRouter } from '../../libraries/tanstack-router/tanstackRouterLibrary';

import {
  FRAMEWORKS,
  LAYERS,
  withPeer,
} from './loaderUtils';

import type {
  Layer,
  LayerKey,
  UiFramework,
} from '../../types';

const EXPO_IGNORES: Layer = [
  {
    name: 'linteljs/expo/ignores',
    ignores: ['dist/*'],
  },
];

// Each layer the framework spreads, in order, and its import group.
const FRAMEWORK_PARTS: [UiFramework, (() => Layer)[], string[]][] = [
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
    'expo',
    [
      reactNative,
      () => {
        return EXPO_IGNORES;
      },
    ],
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
    'sveltekit',
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
  [
    'analog',
    [angular],
    angularGroup,
  ],
];

const LAYER_BUILDERS: [LayerKey, () => Layer][] = [
  ['tanstackQuery', tanstackQuery],
  ['tanstackRouter', tanstackRouter],
  ['stylex', stylex],
  ['vitest', vitest],
  ['jest', jest],
  ['playwright', playwright],
  ['storybook', storybook],
  ['html', html],
  ['astro', astro],
];

const notFound = (): Promise<never> => {
  const error = new Error("Cannot find package 'eslint-plugin-playwright' imported from /project/dist/playwright.mjs");

  return Promise.reject(error);
};

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

describe('LAYERS', () => {
  it.each(LAYER_BUILDERS)('loads %s', async (key, build) => {
    const actual = await LAYERS[key]({});

    const expected = build();
    expect(actual).toEqual(expected);
  });

  it('hands tailwind the entry point it was given, and none when it was given none', async () => {
    const withEntryPoint = await LAYERS.tailwind({ tailwind: { entryPoint: 'src/styles/app.css' } });
    expect(withEntryPoint).toEqual(tailwind('src/styles/app.css'));

    const withoutEntryPoint = await LAYERS.tailwind({ styling: 'tailwind' });
    expect(withoutEntryPoint).toEqual(tailwind());
  });
});

describe('withPeer', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ['pnpm/12.9.0 npm/? node/v26.0.0 darwin arm64', 'pnpm add -D eslint-plugin-playwright'],
    ['yarn/4.9.0 npm/? node/v26.0.0 darwin arm64', 'yarn add -D eslint-plugin-playwright'],
    ['bun/1.3.0 npm/? node/v26.0.0 darwin arm64', 'bun add -d eslint-plugin-playwright'],
    ['npm/11.0.0 node/v26.0.0 darwin arm64', 'npm install -D eslint-plugin-playwright'],
  ])('names the option, the peer and the command under %s', async (agent, command) => {
    vi.stubEnv('npm_config_user_agent', agent);

    const missing = withPeer('e2e: "playwright"', notFound);

    await expect(missing).rejects.toThrow(
      `@linteljs/eslint-config: e2e: "playwright" needs eslint-plugin-playwright. Install it with: ${command}`,
    );
  });

  it('falls back to npm when no package manager ran it', async () => {
    vi.stubEnv('npm_config_user_agent', undefined);

    const missing = withPeer('playwright', notFound);

    await expect(missing).rejects.toThrow(/Install it with: npm install -D eslint-plugin-playwright$/);
  });

  it('passes any other failure through untouched', async () => {
    const failing = withPeer('playwright', () => {
      const broken = new Error('broken preset');

      return Promise.reject(broken);
    });

    await expect(failing).rejects.toThrow(/^broken preset$/);
  });
});
