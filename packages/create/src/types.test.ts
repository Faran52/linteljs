import {
  type AliasMap as UpstreamAliasMap,
  angularGroup,
  type ComposeConfigOptions as UpstreamComposeConfigOptions,
  type Framework as UpstreamFramework,
  type LibraryLayer as UpstreamLibraryLayer,
  type NamingMap as UpstreamNamingMap,
  nextGroup,
  nuxtGroup,
  reactGroup,
  reactNativeGroup,
  solidGroup,
  svelteGroup,
  vueGroup,
} from '@linteljs/eslint-config';
import {
  expect,
  expectTypeOf,
  it,
} from 'vitest';

import { FRAMEWORK_GROUPS } from '@config/constants';

import { LIBRARY_LAYERS } from '@emitters/always/eslint-config/constants';

import type {
  AliasMap,
  ComposeConfigOptions,
  Framework,
  LibraryLayer,
  NamingMap,
} from '@config/types';

it('mirrors eslint-config exactly', () => {
  expectTypeOf<AliasMap>().toEqualTypeOf<UpstreamAliasMap>();
  expectTypeOf<NamingMap>().toEqualTypeOf<UpstreamNamingMap>();
  expectTypeOf<Framework>().toEqualTypeOf<UpstreamFramework>();
  expectTypeOf<LibraryLayer>().toEqualTypeOf<UpstreamLibraryLayer>();
  expectTypeOf<ComposeConfigOptions>().toEqualTypeOf<UpstreamComposeConfigOptions>();
  expectTypeOf<(typeof LIBRARY_LAYERS)[number]>().toEqualTypeOf<LibraryLayer>();
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
