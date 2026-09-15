import { existsSync } from 'node:fs';
import { join } from 'node:path';

import lintel from '@linteljs/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import { includeIgnoreFile } from 'eslint/config';
import checkFile from 'eslint-plugin-check-file';
import importX from 'eslint-plugin-import-x';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sonarjs from 'eslint-plugin-sonarjs';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

import { buildNaming } from './utils/checkFileUtils';
import { SCRIPT_EXTENSIONS } from './utils/globUtils';
import { buildGroups } from './utils/importSortUtils';
import { presetOf } from './utils/presetUtils';

import type { Linter } from 'eslint';
import type { BaseOptions, Layer } from './types';

// Limit presets to script parsers: Angular markup crashes `@stylistic/indent` and is owned by `angular()`.
const SCRIPT_FILES = [`**/*.{${SCRIPT_EXTENSIONS},vue,svelte}`];

// What git ignores, ESLint ignores: a hardcoded list only ever covers the outputs it can guess. `process.cwd()` off
// the global so a test can replace it; this file resolves from inside `node_modules`.
const gitignored = (): Layer => {
  const path = join(process.cwd(), '.gitignore');

  return existsSync(path) ? [includeIgnoreFile(path, '@linteljs/base/gitignore')] : [];
};

// Nothing here is type-aware, so `base` alone works on a plain JavaScript repository.
export const base = (options: BaseOptions = {}): Layer => {
  const {
    ignores,
    naming,
    folderNaming,
    aliases,
    frameworkGroup,
    resolver,
  } = options;

  // No default `conditionNames`: `import` ahead of `types` makes `react-native` resolve to its Flow `index.js`, which
  // import-x cannot parse. Measured: 127 findings on a clean React Native project, 111 of them left unfixed.
  const importSettings: Linter.Config['settings'] = {
    ...importX.flatConfigs.typescript.settings,
    'import-x/resolver': {
      typescript: {
        alwaysTryTypes: true,
        ...(resolver?.project === undefined ? {} : { project: resolver.project }),
        ...(resolver?.conditionNames === undefined ? {} : { conditionNames: resolver.conditionNames }),
        ...(resolver?.noWarnOnMultipleProjects === true ? { noWarnOnMultipleProjects: true } : {}),
      },
    },
  };

  return [
    ...gitignored(),
    ...(ignores
      ? [{
          name: '@linteljs/base/ignores',
          ignores,
        }]
      : []),

    {
      ...presetOf(importX.flatConfigs.typescript, 'import-x/typescript')[0],
      settings: importSettings,
    },

    {
      name: '@linteljs/base/typescript-syntax',
      files: ['**/*.{ts,tsx,mts,cts}'],
      languageOptions: { parser: tseslint.parser },
    },

    ...presetOf(sonarjs.configs?.['recommended'], 'sonarjs/recommended', SCRIPT_FILES),
    ...presetOf(stylistic.configs.recommended, 'stylistic/recommended', SCRIPT_FILES),
    ...presetOf(lintel.configs['flat/recommended'], '@linteljs/flat/recommended', SCRIPT_FILES),

    {
      name: '@linteljs/base',
      files: SCRIPT_FILES,

      plugins: {
        'check-file': checkFile,
        'simple-import-sort': simpleImportSort,
        'unused-imports': unusedImports,
      },

      rules: {
        // Exempts a line that is one long attribute, not every line with a template literal.
        '@stylistic/max-len': ['error', {
          code: 120,
          ignoreUrls: true,
          ignorePattern: String.raw`^[ \t]*(?:<[\w.-]+[ \t]+)?[\w:@.-]+="[^"]*"[ \t]*/?>?[ \t]*$`,
        }],
        '@stylistic/semi': ['error', 'always'],
        '@stylistic/brace-style': ['error', 'stroustrup', { allowSingleLine: false }],
        'curly': ['error', 'all'],
        // Paired with `semi`: the preset ships `semi: never` and `member-delimiter-style: none` together.
        '@stylistic/member-delimiter-style': ['error', {
          multiline: {
            delimiter: 'semi',
            requireLast: true,
          },
          singleline: {
            delimiter: 'semi',
            requireLast: false,
          },
        }],
        '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
        // One property per line; `object-curly-newline` alone leaves the braces on the first and last property lines.
        '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: false }],
        '@stylistic/object-curly-newline': ['error', {
          ObjectExpression: {
            multiline: true,
            consistent: true,
          },
        }],

        // `union-newline` is in `recommended` but scoped to `.ts`; restated here so an SFC script block gets it too.
        '@linteljs/union-newline': 'error',
        '@linteljs/interface-order': 'error',

        'import-x/no-unresolved': 'error',
        'import-x/no-duplicates': 'error',
        'import-x/first': 'error',
        'import-x/newline-after-import': 'error',
        'import-x/no-cycle': 'error',
        'import-x/no-anonymous-default-export': 'error',

        'simple-import-sort/imports': ['error', { groups: buildGroups(aliases, frameworkGroup) }],
        'simple-import-sort/exports': 'error',

        // `unused-imports` owns unused reporting; the other three would double-report.
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'sonarjs/unused-import': 'off',
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': ['error', {
          vars: 'all',
          args: 'after-used',
        }],

        // Catches what `@linteljs/prefer-arrow-functions` declines to rewrite.
        'func-style': ['error', 'expression'],
        'prefer-arrow-callback': 'error',

        'sonarjs/cognitive-complexity': ['error', 15],

        'no-console': ['error', { allow: ['warn', 'error'] }],
      },
    },

    // A script's stdout is its output. Without this every reference repo turned `no-console` off for `**/*.js`.
    {
      name: '@linteljs/base/scripts',
      files: [`scripts/**/*.{${SCRIPT_EXTENSIONS}}`],
      rules: { 'no-console': 'off' },
    },

    // `code-eval` is a hotspot with no clean state, and a fake of `inspectedWindow.eval` has to execute a string.
    // Fixtures only; `no-implied-eval` stays on even there.
    {
      name: '@linteljs/base/fixtures',
      files: [`__mocks__/**/*.{${SCRIPT_EXTENSIONS}}`],
      rules: { 'sonarjs/code-eval': 'off' },
    },

    ...buildNaming(naming, folderNaming),

  ];
};

export default base;
