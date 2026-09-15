import tseslint from 'typescript-eslint';

import type { Layer } from './types';

// `projectService` types config files outside every tsconfig `include`.
export const typescript = (): Layer => {
  return [
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,

    {
      name: '@linteljs/typescript',
      files: ['**/*.{ts,tsx,mts,cts}'],
      languageOptions: {
        parserOptions: { projectService: true },
      },
    },

    // `strictTypeChecked` has no files glob; config files stay untyped.
    {
      ...tseslint.configs.disableTypeChecked,
      name: '@linteljs/typescript/untyped',
      files: ['**/*.{js,jsx,mjs,cjs}', '**/*.html'],
    },

    // `strictTypeChecked` re-enables what `base` handed to `unused-imports`.
    {
      name: '@linteljs/typescript/unused-vars-handover',
      rules: { '@typescript-eslint/no-unused-vars': 'off' },
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
};

export default typescript;
