import astroPlugin from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

import { presetOf } from '../../utils/presetUtils';

import type { Layer } from '../../types';

const ASTRO_FILES = ['**/*.astro'];

// No tsconfig can contain these; `.js` virtual files are already type-free under `typescript()`.
const ASTRO_TYPELESS = ['**/*.astro', '**/*.astro/*.ts'];

// Scoped, because the plugin leaves its rule entry unglobbed.
export const astro = (): Layer => {
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

  return [
    ...recommended,
    ...a11y,
    // The plugin looks for typescript-eslint from `process.cwd()` and falls back to espree when that fails.
    {
      name: '@linteljs/astro/typescript',
      files: ASTRO_FILES,
      languageOptions: { parserOptions: { parser: tseslint.parser } },
      processor: 'astro/client-side-ts',
    },
    // `base()` holds the same limits on the files it reaches, and `.astro` is not one of them.
    {
      name: '@linteljs/astro/component-size',
      files: ASTRO_FILES,
      rules: {
        'max-lines': ['error', {
          max: 350,
          skipBlankLines: true,
          skipComments: true,
        }],
        'max-lines-per-function': ['error', {
          max: 350,
          skipBlankLines: true,
          skipComments: true,
          // Stryker disable next-line BooleanLiteral: restates the plugin default, pinned across its majors
          IIFEs: false,
        }],
      },
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
};

export default astro;
