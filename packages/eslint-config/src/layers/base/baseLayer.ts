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

// `<script lang="ts">` blocks in SFCs are TypeScript the TypeScript globs miss.
const TYPED_FILES = [`**/*.{${TYPESCRIPT_EXTENSIONS},vue,svelte}`];

const COMPONENT_FILES = ['**/*.{tsx,jsx,vue,svelte}'];

// Only on request: naming `.astro` would pull it into a project that has no parser for it.
const ASTRO_FILES = ['**/*.astro'];

const TEST_FILES = [
  '**/*.{test,spec}.*',
  '**/__mocks__/**',
  '**/e2e/**',
];

// A config states its numbers as options; a `constants.ts` already names every number it holds.
const NUMBER_EXEMPT_FILES = ['**/*.config.*', '**/constants.ts'];

const MAX_COGNITIVE_COMPLEXITY = 15;

// `process.cwd()` off the global so a test can replace it; this file resolves from `node_modules`.
const gitignored = (): Layer => {
  const path = join(process.cwd(), '.gitignore');

  if (!existsSync(path)) {
    return [];
  }

  const gitignoreLayer = [includeIgnoreFile(path, '@linteljs/base/gitignore')];

  return gitignoreLayer;
};

// Nothing here is type-aware, so `base` alone works on plain JavaScript.
export const base = (options: BaseOptions = {}): Layer => {
  const {
    ignores,
    naming,
    folderNaming,
    aliases,
    frameworkGroup,
    resolver,
    astro = false,
  } = options;

  const reaching = (files: string[]): string[] => {
    if (!astro) {
      return files;
    }

    const withAstro = [...files, ...ASTRO_FILES];

    return withAstro;
  };

  const scriptFiles = reaching(SCRIPT_AND_SFC_FILES);
  const stylisticPreset = stylistic.configs.customize({ jsx: false });

  // No default `conditionNames`: `import` ahead of `types` sends `react-native` to its Flow `index.js`.
  // Measured: 127 findings on a clean React Native project.
  const importResolver: Linter.Config['settings'] = {
    typescript: {
      alwaysTryTypes: true,
      ...(resolver?.project === undefined ? {} : { project: resolver.project }),
      ...(resolver?.conditionNames === undefined ? {} : { conditionNames: resolver.conditionNames }),
      ...(resolver?.noWarnOnMultipleProjects === true ? { noWarnOnMultipleProjects: true } : {}),
    },
  };

  const layer: Layer = [
    ...gitignored(),
    ...(ignores
      ? [{
          name: '@linteljs/base/ignores',
          ignores,
        }]
      : []),

    // Read once, through `presetOf`, so a release without the preset fails with its name rather than a TypeError.
    ...presetOf(importX.flatConfigs.typescript, 'import-x/typescript')
      .map((preset) => {
        const resolving = {
          ...preset,
          settings: {
            ...preset.settings,
            'import-x/resolver': importResolver,
          },
        };

        return resolving;
      }),

    {
      name: '@linteljs/base/typescript-syntax',
      files: ['**/*.{ts,tsx,mts,cts}'],
      languageOptions: { parser: tseslint.parser },
    },

    // Script parsers only: Angular markup crashes `@stylistic/indent`.
    ...presetOf(sonarjs.configs?.['recommended'], 'sonarjs/recommended', scriptFiles),
    // `recommended` with its JSX rules left to the JSX frameworks: a `.ts` or `.vue` file holds no JSX.
    ...presetOf(stylisticPreset, 'stylistic/customize', scriptFiles),
    ...presetOf(linteljs.configs['flat/recommended'], '@linteljs/flat/recommended', scriptFiles),

    {
      name: '@linteljs/base',
      files: scriptFiles,

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
        '@stylistic/brace-style': ['error', 'stroustrup'],
        'curly': ['error', 'all'],
        '@stylistic/function-call-argument-newline': ['error', 'consistent'],
        '@stylistic/function-paren-newline': ['error', 'multiline-arguments'],
        '@stylistic/padding-line-between-statements': [
          'error',
          {
            blankLine: 'always',
            prev: '*',
            next: [
              'function',
              'block-like',
              'multiline-expression',
            ],
          },
          {
            blankLine: 'always',
            prev: [
              'function',
              'block-like',
              'multiline-expression',
            ],
            next: '*',
          },
        ],
        '@stylistic/semi-style': ['error', 'last'],
        '@stylistic/no-extra-semi': 'error',
        '@stylistic/switch-colon-spacing': ['error', {
          after: true,
          before: false,
        }],
        '@stylistic/function-call-spacing': ['error', 'never'],
        '@stylistic/linebreak-style': ['error', 'unix'],
        'no-debugger': 'error',
        // The preset ships `semi: never` and `member-delimiter-style: none` together; `{}` is the plugin's own default.
        '@stylistic/member-delimiter-style': ['error', {}],
        '@stylistic/quotes': [
          'error',
          'single',
          { avoidEscape: true },
        ],
        // `@linteljs/member-newline` owns a list of two or more members; `object-property-newline` splits at two.
        '@stylistic/object-property-newline': 'off',
        // Braces only, for the one-member list `member-newline` leaves alone. `multiline` would split a pair.
        '@stylistic/object-curly-newline': ['error', {
          ObjectExpression: { consistent: true },
          TSTypeLiteral: { consistent: true },
          TSInterfaceBody: { consistent: true },
        }],

        'import-x/no-unresolved': 'error',
        'import-x/no-duplicates': ['error', { 'prefer-inline': true }],
        'import-x/first': 'error',
        'import-x/newline-after-import': 'error',
        'import-x/no-cycle': 'error',
        'import-x/no-anonymous-default-export': 'error',
        'import-x/no-self-import': 'error',
        'import-x/no-useless-path-segments': ['error', { noUselessIndex: false }],
        'import-x/no-absolute-path': 'error',
        'import-x/no-mutable-exports': 'error',
        // `@typescript-eslint/no-require-imports` owns `require`, with its asset allowance.
        'import-x/no-commonjs': ['error', {
          allowRequire: true,
          allowPrimitiveModules: false,
        }],
        'import-x/no-amd': 'error',

        // `/compat`'s looser signatures let a call typecheck that the strict entry refuses.
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
        'unused-imports/no-unused-vars': 'error',

        // `typescript-eslint` owns both; sonarjs's copies report the same defect twice once `typescript()` is composed.
        'sonarjs/no-array-delete': 'off',
        'sonarjs/prefer-regexp-exec': 'off',

        // Framework rules in a framework-blind preset; the React core, `vue()` and `angular()` turn them back on.
        'sonarjs/jsx-no-leaked-render': 'off',
        'sonarjs/no-hook-setter-in-body': 'off',
        'sonarjs/no-useless-react-setstate': 'off',
        'sonarjs/no-uniq-key': 'off',
        'sonarjs/prefer-read-only-props': 'off',
        'sonarjs/no-debounce-throttle-in-render': 'off',
        'sonarjs/no-vue-class-component': 'off',
        'sonarjs/no-vue-mixins': 'off',
        'sonarjs/no-mutate-reactive-state-in-updated-hook': 'off',
        'sonarjs/no-angular-bypass-sanitization': 'off',

        // Catches what `@linteljs/prefer-arrow-functions` declines to rewrite.
        'func-style': ['error', 'expression'],
        'prefer-arrow-callback': 'error',
        // `avoidQuotes`: the preset's `quote-props` quotes every key once one needs it, so `'id': id` stays.
        'object-shorthand': [
          'error',
          'always',
          {
            avoidQuotes: true,
            ignoreConstructors: false,
            avoidExplicitReturnArrows: false,
          },
        ],

        // Declarations only: see "Destructuring in declarations only" in docs/DESIGN.md.
        'prefer-destructuring': [
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
          { enforceForRenamedProperties: false },
        ],

        'sonarjs/cognitive-complexity': ['error', MAX_COGNITIVE_COMPLEXITY],

        // Counted as code: blank lines and comments are free.
        'max-lines': ['error', {
          max: 500,
          skipBlankLines: true,
          skipComments: true,
        }],
        'max-lines-per-function': ['error', {
          max: 350,
          skipBlankLines: true,
          skipComments: true,
        }],

        'no-console': ['error', { allow: ['warn', 'error'] }],
      },
    },

    // Restated over the SFC extensions the plugin's own preset cannot reach.
    {
      name: '@linteljs/base/typescript-rules',
      files: reaching(TYPED_FILES),
      rules: {
        '@linteljs/union-newline': 'error',
        '@linteljs/interface-order': 'error',
        '@linteljs/no-inline-object-types': 'error',
        '@linteljs/no-duplicate-interface': 'error',
        '@linteljs/prefer-alias': 'error',
      },
    },

    // A script's stdout is its output.
    {
      name: '@linteljs/base/scripts',
      files: [`scripts/**/*.{${SCRIPT_EXTENSIONS}}`],
      rules: { 'no-console': 'off' },
    },

    // A fake of `inspectedWindow.eval` has to execute a string; `no-implied-eval` stays on.
    {
      name: '@linteljs/base/fixtures',
      files: [`**/__mocks__/**/*.{${SCRIPT_EXTENSIONS}}`],
      rules: { 'sonarjs/code-eval': 'off' },
    },

    {
      name: '@linteljs/base/component-size',
      files: reaching(COMPONENT_FILES),
      rules: {
        'max-lines': ['error', {
          max: 350,
          skipBlankLines: true,
          skipComments: true,
        }],
      },
    },

    // A `utils/` module is a drawer of small helpers, so it may run longer than a subject's entry.
    {
      name: '@linteljs/base/utils-size',
      files: [`**/utils/**/*.{${SCRIPT_EXTENSIONS}}`],
      rules: {
        'max-lines': ['error', {
          max: 800,
          skipBlankLines: true,
          skipComments: true,
        }],
      },
    },

    // A suite is a list of cases rather than a function.
    {
      name: '@linteljs/base/test-size',
      files: TEST_FILES,
      rules: {
        'max-lines': 'off',
        'max-lines-per-function': 'off',
      },
    },

    // The typescript-eslint copy, which knows enums and literal types, on plain JavaScript as well.
    {
      name: '@linteljs/base/magic-numbers',
      files: scriptFiles,
      ignores: [...TEST_FILES, ...NUMBER_EXEMPT_FILES],
      plugins: { '@typescript-eslint': tseslint.plugin },
      rules: {
        'no-magic-numbers': 'off',
        '@typescript-eslint/no-magic-numbers': ['error', {
          ignore: [
            -1,
            0,
            1,
            2,
          ],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          ignoreClassFieldInitialValues: true,
          enforceConst: true,
          detectObjects: false,
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        }],
      },
    },

    // Outside the plugin's `recommended`, so restated here; suites included.
    {
      name: '@linteljs/base/name-before-use',
      files: scriptFiles,
      rules: {
        '@linteljs/name-before-use': ['error', {
          ignoreEmptyLiterals: true,
          ignoreLiteralArguments: true,
        }],
      },
    },

    ...buildNaming(naming, folderNaming),

  ];

  return layer;
};

export default base;
