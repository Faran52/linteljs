import { expectTypeOf, it } from 'vitest';

import { LIBRARY_LAYERS } from '@emitters/always/eslint-config/constants';

import type {
  AliasMap,
  ComposeConfigOptions,
  Framework,
  LibraryLayer,
  NamingMap,
} from '@config/types';
import type {
  AliasMap as UpstreamAliasMap,
  ComposeConfigOptions as UpstreamComposeConfigOptions,
  Framework as UpstreamFramework,
  LibraryLayer as UpstreamLibraryLayer,
  NamingMap as UpstreamNamingMap,
} from '@linteljs/eslint-config';

// Declared twice on purpose, so this package installs before eslint-config publishes; this is what keeps them equal.
it('mirrors eslint-config exactly', () => {
  expectTypeOf<AliasMap>().toEqualTypeOf<UpstreamAliasMap>();
  expectTypeOf<NamingMap>().toEqualTypeOf<UpstreamNamingMap>();
  expectTypeOf<Framework>().toEqualTypeOf<UpstreamFramework>();
  expectTypeOf<LibraryLayer>().toEqualTypeOf<UpstreamLibraryLayer>();
  expectTypeOf<ComposeConfigOptions>().toEqualTypeOf<UpstreamComposeConfigOptions>();
  expectTypeOf<(typeof LIBRARY_LAYERS)[number]>().toEqualTypeOf<LibraryLayer>();
});
