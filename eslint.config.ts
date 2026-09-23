/**
 * The workspace lints itself with its own layers, imported from source rather than `dist`, so linting never
 * needs a build first; jiti loads this TypeScript config. Every exemption below names its DESIGN.md heading
 * under "Workspace lint exemptions", which holds the measurement that earned it; one without is one to delete.
 */
import {
  INNER_RINGS,
  MIDDLE_RINGS,
  OUTER_RINGS,
  RINGS,
  WORLDS,
} from './packages/create/src/rings';
import base from './packages/eslint-config/src/base';
import typescript from './packages/eslint-config/src/typescript';
import vitest from './packages/eslint-config/src/vitest';

const ring = (name: string): string => {
  return `packages/create/src/${name}`;
};

// What `packages/create/tsconfig.json` declares, so `simple-import-sort` gives the aliases a group of their own.
// `buildGroups` reads the keys and never the values. `config/` and `utils/` have no barrel, so no bare form.
const aliases = Object.fromEntries(RINGS.flatMap((name) => {
  const subpath: [string, string] = [`@${name}/*`, `${ring(name)}/*`];

  return name === 'config' || name === 'utils' ? [subpath] : [[`@${name}`, ring(name)], subpath];
}));

const config = [
  /**
   * An escape hatch this workspace does not use should not be available. Every directive is inert under this, so an
   * `eslint-disable` cannot suppress: the rule it names fires anyway and the comment is reported as having no effect.
   * The one live directive in the repo was on `execFileSync('pnpm', ...)` in maintainer tooling and is now a named
   * exemption in `@linteljs/workspace/scripts` instead, which is where this repo keeps the ones it means.
   *
   * Root, not `base`: a generated project is already held to this by `scripts/checkBannedPatterns.ts`, which refuses
   * the directive at write time and on commit, and putting it in the layer would make every existing consumer's
   * directives inert on upgrade. DESIGN.md: `noInlineConfig`
   */
  { linterOptions: { noInlineConfig: true } },

  ...base({
    // DESIGN.md: Ignores
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/.smoke/**',
      '**/.compat/**',
      '**/reports/**',
      '**/__mocks__/fixtures/**',
      'packages/create/templates/fragments/test-setup/setupTests.angular.ts',
      'packages/create/templates/fragments/test-setup/setupTests.reactNative.ts',
      'packages/create/templates/fragments/test-setup/setupTests.msw.ts',
      'packages/create/templates/starter-source/react-native/__mocks__/renderScreen.tsx',
      'packages/create/templates/starter-source/**',
    ],
    naming: {
      'packages/*/src/**/*.ts': 'CAMEL_CASE',
      // DESIGN.md: `'**/utils/*.ts': '*Utils'`
      '**/utils/*.ts': '*Utils',
    },
    folderNaming: {
      'packages/*/src/**/': 'KEBAB_CASE',
    },
    aliases,
    // DESIGN.md: `resolver: { project: 'packages/*/tsconfig.json' }`
    resolver: {
      project: 'packages/*/tsconfig.json',
      noWarnOnMultipleProjects: true,
    },
  }),
  ...typescript(),
  ...vitest(),

  // `@linteljs/create`'s direction, made mechanical. DESIGN.md: `@linteljs/workspace/create-rings`
  {
    name: '@linteljs/workspace/create-rings',
    files: ['packages/create/src/**'],
    ignores: ['**/*.test.ts'],
    rules: {
      'import-x/no-restricted-paths': ['error', {
        zones: [
          {
            target: INNER_RINGS.map(ring),
            from: [...MIDDLE_RINGS, ...OUTER_RINGS].map(ring),
            message: 'answers/, config/, targets/ and utils/ are the innermost rings. None reaches outward.',
          },
          {
            target: MIDDLE_RINGS.map(ring),
            from: OUTER_RINGS.map(ring),
            message: 'emitters/ turns answers into text. Disk, argv and terminals live outside it.',
          },
        ],
      }],
    },
  },

  /**
   * One folder per responsibility, and which one a module belongs to is decided by the world it reaches into rather
   * than by judgement: `node:fs` means `disk/`, `node:child_process` means `spawns/`, argv and the terminal mean
   * `terminal/`. Everything else goes through them, which is what makes the inner rings testable without a disk.
   * `e2e/` is the harness rather than the package, and it spawns real managers on purpose.
   *
   * The `es-toolkit/compat` pattern is repeated here rather than inherited. `base` bans it for every project and
   * for this one, and two config objects naming one rule do not merge their options: this block is the last to
   * name `no-restricted-imports` for these files, so what it replaces is the layer's own ban.
   * DESIGN.md: `@linteljs/workspace/create-worlds`
   */
  {
    name: '@linteljs/workspace/create-worlds',
    files: ['packages/create/src/**'],
    ignores: [
      // The three rings that own a world, and nothing else: `pipeline/` owns none, so only its harness is exempt.
      ...Object.keys(WORLDS).map((name) => {
        return `${ring(name)}/**`;
      }),
      'packages/create/src/pipeline/e2e/**',
      '**/*.test.ts',
    ],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['es-toolkit/compat', 'es-toolkit/compat/*'],
            message: 'The strict entry or the standard library. /compat is the lodash build.',
          },
          ...Object.values(WORLDS),
        ],
      }],
    },
  },

  /**
   * `config/` is data and only data: the types, constants and tables no ring owns. A function belongs to a `utils/`
   * at the level of its readers, which is what keeps this folder free of a suite and free of coverage.
   * DESIGN.md: `@linteljs/workspace/create-config-data`
   */
  {
    name: '@linteljs/workspace/create-config-data',
    files: ['packages/create/src/config/**'],
    rules: {
      'no-restricted-syntax': ['error', {
        selector: 'ArrowFunctionExpression, FunctionDeclaration, FunctionExpression',
        message: 'config/ holds data. A function goes to a utils/ beside the ring that reads it.',
      }],
    },
  },

  // A `utils/` module is helpers, and a long one is two categories in one drawer.
  // DESIGN.md: `@linteljs/workspace/utils-size`
  {
    name: '@linteljs/workspace/utils-size',
    files: ['packages/*/src/**/utils/*Utils.ts'],
    rules: {
      'max-lines': ['error', {
        max: 200,
        skipBlankLines: true,
        skipComments: true,
      }],
    },
  },

  // A ceiling far above anything here, so the longest function stays a fact.
  // DESIGN.md: `@linteljs/workspace/function-size`
  {
    name: '@linteljs/workspace/function-size',
    files: ['packages/*/src/**/*.ts'],
    rules: {
      'max-lines-per-function': ['error', {
        max: 500,
        skipBlankLines: true,
        skipComments: true,
      }],
    },
  },

  // The audit and smoke scripts, whose stdout is their output. DESIGN.md: `@linteljs/workspace/scripts`
  {
    name: '@linteljs/workspace/scripts',
    files: ['packages/*/scripts/**'],
    rules: {
      'no-console': 'off',
      'sonarjs/no-os-command-from-path': 'off',
    },
  },

  // The one file that has to be CommonJS. DESIGN.md: `@linteljs/workspace/old-node-runner`
  {
    name: '@linteljs/workspace/old-node-runner',
    files: ['packages/eslint-plugin/scripts/runRules.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'import-x/no-commonjs': 'off',
      'unicorn/prefer-module': 'off',
    },
  },

  // `sonarjs/different-types-comparison` cannot read an AST identity check. Named file by file, so
  // a seventh site has to be added on purpose. DESIGN.md: `@linteljs/workspace/ast-identity`
  {
    name: '@linteljs/workspace/ast-identity',
    files: [
      'packages/eslint-plugin/src/rules/prefer-arrow-functions/preferArrowFunctions.ts',
      'packages/eslint-plugin/src/rules/prefer-arrow-functions/utils/safetyUtils.ts',
      'packages/eslint-plugin/src/utils/promiseChainUtils.ts',
    ],
    rules: {
      'sonarjs/different-types-comparison': 'off',
    },
  },

  // `sonarjs/no-empty-test-file` cannot see cases `RuleTester.run()` registers at module scope.
  // Scoped to that directory alone. DESIGN.md: `@linteljs/workspace/rule-tester`
  {
    name: '@linteljs/workspace/rule-tester',
    files: ['packages/eslint-plugin/src/rules/**/*.test.ts'],
    rules: {
      'sonarjs/no-empty-test-file': 'off',
    },
  },

  // The e2e files pass `runE2eCase` by reference, out of the rule's reach. DESIGN.md: `@linteljs/workspace/e2e-test`
  {
    name: '@linteljs/workspace/e2e-test',
    files: ['packages/create/src/pipeline/e2e/targets/*.e2e.test.ts'],
    rules: { 'vitest/expect-expect': 'off' },
  },
];

export default config;
