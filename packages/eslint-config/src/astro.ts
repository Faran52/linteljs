import astroPlugin from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

import { presetOf } from './utils/presetUtils';

import type { Layer } from './types';

const ASTRO_FILES = ['**/*.astro'];

// The template and the virtual `.ts` files the plugin extracts from it, which no tsconfig can contain.
const ASTRO_TYPELESS = ['**/*.astro', '**/*.astro/*.ts', '**/*.astro/*.js'];

// A file-type layer that stacks with a framework one, since a site may host React, Vue, Svelte or Solid islands.
// Scoped, because the plugin leaves its rule entry unglobbed.
export const astro = (): Layer => {
  const recommended = presetOf(
    astroPlugin.configs['flat/recommended'],
    'astro/flat/recommended',
    ASTRO_FILES,
  );

  // The plugin re-exports jsx-a11y as `astro/jsx-a11y/*`; only that rule entry is kept, the base entries are above.
  const a11y = presetOf(
    astroPlugin.configs['flat/jsx-a11y-recommended'],
    'astro/flat/jsx-a11y-recommended',
    ASTRO_FILES,
  ).filter((entry) => {
    return Object.keys(entry.rules ?? {}).some((rule) => {
      return rule.startsWith('astro/jsx-a11y/');
    });
  });

  return [
    ...recommended,
    ...a11y,
    // After `typescript()`, which is why `defineConfig` composes this layer last.
    {
      ...tseslint.configs.disableTypeChecked,
      name: '@linteljs/astro/untyped',
      files: ASTRO_TYPELESS,
    },
  ];
};

export default astro;
