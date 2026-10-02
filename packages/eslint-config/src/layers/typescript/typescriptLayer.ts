import tseslint from 'typescript-eslint';

import type { Layer, TypescriptOptions } from '../../types';

// `projectService` types config files outside every tsconfig `include`.
export const typescript = ({ aliasExempt = [], enforceRelativeImports = false }: TypescriptOptions = {}): Layer => {
  const layer: Layer = [
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,

    {
      name: '@linteljs/typescript',
      files: ['**/*.{ts,tsx,mts,cts}'],
      languageOptions: {
        parserOptions: { projectService: true },
      },
      rules: {
        '@typescript-eslint/parameter-properties': ['error', {
          allow: [],
          prefer: 'class-property',
        }],
      },
    },

    // `strictTypeChecked` has no files glob; config files stay untyped.
    {
      ...tseslint.configs.disableTypeChecked,
      name: '@linteljs/typescript/untyped',
      files: ['**/*.{js,jsx,mjs,cjs}', '**/*.html'],
    },

    {
      name: '@linteljs/typescript/prefer-destructuring',
      files: ['**/*.{ts,tsx,mts,cts}'],
      rules: {
        'prefer-destructuring': 'off',
        '@typescript-eslint/prefer-destructuring': [
          'error',
          {
            VariableDeclarator: {
              array: false,
              object: true,
            },
            AssignmentExpression: {
              array: false,
              object: false,
            },
          },
          {
            enforceForRenamedProperties: false,
            enforceForDeclarationWithTypeAnnotation: false,
          },
        ],
      },
    },

    // `strictTypeChecked` re-enables what `base` handed to `unused-imports`.
    {
      name: '@linteljs/typescript/unused-vars-handover',
      rules: { '@typescript-eslint/no-unused-vars': 'off' },
    },

    // The SFC parsers nest typescript-eslint with `projectService`, so `.vue` and `.svelte` get a program too.
    {
      name: '@linteljs/typescript/prefer-alias',
      files: ['**/*.{ts,tsx,mts,cts,vue,svelte}'],
      rules: {
        '@linteljs/prefer-alias': ['error', {
          aliasExempt,
          enforceRelativeImports,
        }],
      },
    },

    // Metro assets need `require`; a package import is still reported.
    {
      name: '@linteljs/typescript/asset-requires',
      rules: {
        '@typescript-eslint/no-require-imports': ['error', {
          allow: ['\\.(png|jpe?g|gif|webp|avif|bmp|svg|ttf|otf|woff2?|mp[34]|wav|aac|m4a|mov|webm)$'],
        }],
      },
    },
  ];

  return layer;
};

export default typescript;
