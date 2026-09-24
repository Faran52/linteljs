import { existsSync } from 'node:fs';
import { join } from 'node:path';

import linteljs from '@linteljs/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import { includeIgnoreFile } from 'eslint/config';
import checkFile from 'eslint-plugin-check-file';
import importX from 'eslint-plugin-import-x';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sonarjs from 'eslint-plugin-sonarjs';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

import {
  SCRIPT_AND_SFC_FILES,
  SCRIPT_EXTENSIONS,
  TYPESCRIPT_EXTENSIONS,
} from '../../config/constants';
import { presetOf } from '../../utils/presetUtils';

import { buildNaming } from './utils/checkFileUtils';
import { buildGroups } from './utils/importSortUtils';

import type { Linter } from 'eslint';
import type { BaseOptions, Layer } from '../../types';

/**
 * TypeScript, plus the two single-file component extensions whose `<script lang="ts">` block is TypeScript in a file
 * the TypeScript globs do not match. A TypeScript-only rule is restated over this when the plugin's own preset,
 * which scopes itself to the four TypeScript extensions, would miss the SFC half.
 */
const TYPED_FILES = [`**/*.{${TYPESCRIPT_EXTENSIONS},vue,svelte}`];

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
  const importResolver: Linter.Config['settings'] = {
    typescript: {
      alwaysTryTypes: true,
      ...(resolver?.project === undefined ? {} : { project: resolver.project }),
      ...(resolver?.conditionNames === undefined ? {} : { conditionNames: resolver.conditionNames }),
      ...(resolver?.noWarnOnMultipleProjects === true ? { noWarnOnMultipleProjects: true } : {}),
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

    // Read once, through `presetOf`, so a release without the preset fails with its name rather than a TypeError.
    ...presetOf(importX.flatConfigs.typescript, 'import-x/typescript').map((preset) => {
      return {
        ...preset,
        settings: {
          ...preset.settings,
          'import-x/resolver': importResolver,
        },
      };
    }),

    {
      name: '@linteljs/base/typescript-syntax',
      files: ['**/*.{ts,tsx,mts,cts}'],
      languageOptions: { parser: tseslint.parser },
    },

    // Limit presets to script parsers: Angular markup crashes `@stylistic/indent` and is owned by `angular()`.
    ...presetOf(sonarjs.configs?.['recommended'], 'sonarjs/recommended', SCRIPT_AND_SFC_FILES),
    ...presetOf(stylistic.configs.recommended, 'stylistic/recommended', SCRIPT_AND_SFC_FILES),
    ...presetOf(linteljs.configs['flat/recommended'], '@linteljs/flat/recommended', SCRIPT_AND_SFC_FILES),

    {
      name: '@linteljs/base',
      files: SCRIPT_AND_SFC_FILES,

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
        // The preset's `when: 'multiline'` caps nothing on a one-line element, so a tag grew props until `max-len`
        // broke it and only then had to wrap. Two is the width a one-line tag stays readable at.
        '@stylistic/jsx-max-props-per-line': ['error', {
          maximum: {
            single: 2,
            multi: 1,
          },
        }],
        // One property per line; `object-curly-newline` alone leaves the braces on the first and last property lines.
        '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: false }],
        '@stylistic/object-curly-newline': ['error', {
          ObjectExpression: {
            multiline: true,
            consistent: true,
          },
        }],

        'import-x/no-unresolved': 'error',
        'import-x/no-duplicates': 'error',
        'import-x/first': 'error',
        'import-x/newline-after-import': 'error',
        'import-x/no-cycle': 'error',
        'import-x/no-anonymous-default-export': 'error',

        /**
         * `/compat` is the lodash-compatibility build, and a project scaffolded today has no lodash to migrate from.
         * Its looser signatures are the whole temptation: they let a call typecheck that the strict entry refuses,
         * and the strict entry refusing it is usually the standard library answering instead.
         */
        'no-restricted-imports': ['error', {
          patterns: [
            {
              // Gitignore syntax, so the entry covers its subpaths too.
              group: ['es-toolkit/compat'],
              message: 'Use the core es-toolkit entry. Compat is the lodash migration path.',
            },
          ],
        }],

        'simple-import-sort/imports': ['error', { groups: buildGroups(aliases, frameworkGroup) }],
        'simple-import-sort/exports': 'error',

        // `unused-imports` owns unused reporting; the other four would double-report.
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'sonarjs/unused-import': 'off',
        'sonarjs/no-unused-vars': 'off',
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': ['error', {
          vars: 'all',
          args: 'after-used',
        }],

        /**
         * `typescript-eslint` owns both, and sonarjs's copies report the same defect a second time once
         * `typescript()` is composed. Off here rather than there because both need type information to fire
         * (`requiresTypeChecking`), so on a JavaScript-only stack where `base` runs alone they see nothing either way.
         */
        'sonarjs/no-array-delete': 'off',
        'sonarjs/prefer-regexp-exec': 'off',

        // Catches what `@linteljs/prefer-arrow-functions` declines to rewrite.
        'func-style': ['error', 'expression'],
        'prefer-arrow-callback': 'error',

        'sonarjs/cognitive-complexity': ['error', 15],

        'no-console': ['error', { allow: ['warn', 'error'] }],
      },
    },

    /**
     * Every `language: 'typescript'` rule the plugin publishes, restated over the SFC extensions its own preset
     * cannot reach: that preset scopes itself to the four TypeScript extensions, so a `<script lang="ts">` block
     * never saw one. Over `TYPED_FILES` rather than the script globs: on a `.js` file they match nothing and were
     * listed as enabled anyway, which contradicts the language scoping every other TypeScript rule here gets.
     * `base.test.ts` derives the list from the registry, so a fourth cannot be missed the way the third was.
     */
    {
      name: '@linteljs/base/typescript-rules',
      files: TYPED_FILES,
      rules: {
        '@linteljs/union-newline': 'error',
        '@linteljs/interface-order': 'error',
        '@linteljs/no-inline-object-types': 'error',
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
