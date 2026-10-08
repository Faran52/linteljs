import stylistic from '@stylistic/eslint-plugin';
import astroPlugin from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

import { JSX_LAYOUT_RULES } from '../../config/constants';
import { presetOf } from '../../utils/presetUtils';

import type { Layer } from '../../types';

const ASTRO_FILES = ['**/*.astro'];

// No tsconfig can contain these; `.js` virtual files are already type-free under `typescript()`.
const ASTRO_TYPELESS = ['**/*.astro', '**/*.astro/*.ts'];

const VIRTUAL_MODULES = ['^astro:'];

export const astro = (): Layer => {
  // Scoped, because the plugin leaves its rule entry unglobbed.
  const recommended = presetOf(
    astroPlugin.configs['flat/recommended'],
    'astro/flat/recommended',
    ASTRO_FILES,
  );

  // Only the plugin's `astro/jsx-a11y/*` entry; the base entries are above.
  const a11y = presetOf(
    astroPlugin.configs['flat/jsx-a11y-recommended'],
    'astro/flat/jsx-a11y-recommended',
    ASTRO_FILES,
  )
    .filter((entry) => {
      return Object.keys(entry.rules ?? {})
        .some((rule) => {
          return rule.startsWith('astro/jsx-a11y/');
        });
    });

  const layer: Layer = [
    ...recommended,
    ...a11y,
    {
      name: '@linteljs/astro/framework-specifiers',
      rules: {
        'import-x/no-unresolved': ['error', { ignore: VIRTUAL_MODULES }],
      },
    },
    // The plugin looks for typescript-eslint from `process.cwd()` and falls back to espree when that fails.
    {
      name: '@linteljs/astro/typescript',
      files: ASTRO_FILES,
      languageOptions: { parserOptions: { parser: tseslint.parser } },
      processor: 'astro/client-side-ts',
    },
    {
      name: '@linteljs/astro/jsx-layout',
      files: ASTRO_FILES,
      plugins: { '@stylistic': stylistic },
      rules: JSX_LAYOUT_RULES,
    },
    // Astro keeps a text node's line break as a space, so splitting `<code>x</code>, which` renders ` , which`.
    {
      name: '@linteljs/astro/text-whitespace',
      files: ASTRO_FILES,
      rules: { '@stylistic/jsx-one-expression-per-line': 'off' },
    },
    {
      name: '@linteljs/astro/typescript-scripts',
      files: ['**/*.astro/*.ts'],
      languageOptions: { parser: tseslint.parser },
    },
    // After `typescript()`, which is why `composeConfig` composes this last.
    {
      ...tseslint.configs.disableTypeChecked,
      name: '@linteljs/astro/untyped',
      files: ASTRO_TYPELESS,
    },
  ];

  return layer;
};

export default astro;
