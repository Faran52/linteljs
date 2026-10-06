import { type PackageJson } from '../../utils/packageJsonUtils';

// Superseded by @linteljs/eslint-config.
export const SUPERSEDED = [
  'prettier',
  'eslint-config-prettier',
  'eslint-plugin-prettier',
  '@eslint/js',
  'globals',
  'typescript-eslint',
  'eslint-plugin-react-refresh',
  'oxlint',
  // The devtools plugin is only called from the replaced vite.config.ts; jsdom is not the chosen environment.
  'vite-plugin-vue-devtools',
  'jsdom',
];

// `pack` refuses a package.json without a version.
export const LIBRARY_FIELDS = {
  version: '0.0.0',
  types: './dist/index.d.ts',
  exports: {
    '.': {
      types: './dist/index.d.ts',
      default: './dist/index.js',
    },
    './package.json': './package.json',
  },
  files: ['dist'],
} as const satisfies PackageJson;
