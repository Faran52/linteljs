import {
  type Framework as UpstreamFramework,
  type Island as UpstreamIsland,
  type LinteljsOptions as UpstreamLinteljsOptions,
  type NamingMap as UpstreamNamingMap,
} from '@linteljs/eslint-config';
import { angularGroup } from '@linteljs/eslint-config/angular';
import { nextGroup } from '@linteljs/eslint-config/next';
import { nuxtGroup } from '@linteljs/eslint-config/nuxt';
import { reactGroup } from '@linteljs/eslint-config/react';
import { reactNativeGroup } from '@linteljs/eslint-config/react-native';
import { solidGroup } from '@linteljs/eslint-config/solid';
import { svelteGroup } from '@linteljs/eslint-config/svelte';
import { vueGroup } from '@linteljs/eslint-config/vue';
import {
  expect,
  expectTypeOf,
  it,
} from 'vitest';

import { FRAMEWORK_GROUPS } from '@config/constants';

import type {
  LinteljsFramework,
  LinteljsIsland,
  LinteljsOptions,
  NamingMap,
} from '@config/types';

it('mirrors eslint-config exactly', () => {
  expectTypeOf<NamingMap>().toEqualTypeOf<UpstreamNamingMap>();
  expectTypeOf<LinteljsFramework>().toEqualTypeOf<UpstreamFramework>();
  expectTypeOf<LinteljsIsland>().toEqualTypeOf<UpstreamIsland>();
  expectTypeOf<LinteljsOptions>().toEqualTypeOf<UpstreamLinteljsOptions>();
});

it('sorts each framework group first as eslint-config does', () => {
  const upstream = {
    'react': reactGroup,
    'next': nextGroup,
    'react-native': reactNativeGroup,
    'vue': vueGroup,
    'nuxt': nuxtGroup,
    'svelte': svelteGroup,
    'solid': solidGroup,
    'angular': angularGroup,
  };

  expect(FRAMEWORK_GROUPS).toEqual(upstream);
});
