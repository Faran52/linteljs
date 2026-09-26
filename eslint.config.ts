/**
 * The workspace lints itself with its own layers, imported from source rather than `dist`, so linting never
 * needs a build first; jiti loads this TypeScript config. Every exemption below names its docs/DESIGN.md heading
 * under "Workspace lint exemptions", which holds the measurement that earned it; one without is one to delete.
 */
import {
  INNER_RINGS,
  MIDDLE_RINGS,
  OUTER_RINGS,
  RINGS,
  WORLDS,
} from './packages/create/src/rings';
import base from './packages/eslint-config/src/layers/base/baseLayer';
import typescript from './packages/eslint-config/src/layers/typescript/typescriptLayer';
import vitest from './packages/eslint-config/src/layers/vitest/vitestLayer';

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
   * An escape hatch this workspace does not use should not be available: every directive is inert, so an
   * `eslint-disable` is reported as having no effect. The exemptions this repo means are named blocks below.
   *
   * Root, not `base`: a generated project is held to this by `scripts/checkBannedPatterns.ts`, and in the layer it
   * would make every existing consumer's directives inert on upgrade. docs/DESIGN.md: `noInlineConfig`
   */
  { linterOptions: { noInlineConfig: true } },

  ...base({
    // docs/DESIGN.md: Ignores
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
      // The TypeScript a generated project receives, the plugin's hooks included.
      'packages/create/templates/project/{scripts,plugins}/**/*.ts': 'CAMEL_CASE',
      // docs/DESIGN.md: `'**/utils/*.ts': '*Utils'`
      '**/utils/*.ts': '*Utils',
    },
    folderNaming: {
      'packages/*/src/**/': 'KEBAB_CASE',
    },
    aliases,
    // docs/DESIGN.md: `resolver: { project: 'packages/*/tsconfig.json' }`
    resolver: {
      project: 'packages/*/tsconfig.json',
      noWarnOnMultipleProjects: true,
    },
  }),
  ...typescript(),
  ...vitest(),

  // `@linteljs/create`'s direction, made mechanical. docs/DESIGN.md: `@linteljs/workspace/create-rings`
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
   * docs/DESIGN.md: `@linteljs/workspace/create-worlds`
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
   * docs/DESIGN.md: `@linteljs/workspace/create-config-data`
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
  // docs/DESIGN.md: `@linteljs/workspace/utils-size`
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
  // docs/DESIGN.md: `@linteljs/workspace/function-size`
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

  // Every script reports through `loggerUtils.ts`. Options given, since severity alone inherits the layer's `allow`.
  // docs/DESIGN.md: `@linteljs/workspace/scripts`
  {
    name: '@linteljs/workspace/scripts',
    files: ['scripts/**', 'packages/*/scripts/**'],
    rules: {
      'no-console': ['error', {}],
      'sonarjs/no-os-command-from-path': 'off',
    },
  },
  {
    name: '@linteljs/workspace/scripts-logger',
    files: ['scripts/utils/loggerUtils.ts', 'packages/create/templates/project/scripts/utils/loggerUtils.ts'],
    rules: { 'no-console': 'off' },
  },

  // `sonarjs/different-types-comparison` cannot read an AST identity check. Named file by file, so
  // another site has to be added on purpose. docs/DESIGN.md: `@linteljs/workspace/ast-identity`
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
  // Scoped to that directory alone. docs/DESIGN.md: `@linteljs/workspace/rule-tester`
  {
    name: '@linteljs/workspace/rule-tester',
    files: ['packages/eslint-plugin/src/rules/**/*.test.ts'],
    rules: {
      'sonarjs/no-empty-test-file': 'off',
    },
  },

  // The e2e files pass `runE2eCase` by reference, out of the rule's reach.
  // docs/DESIGN.md: `@linteljs/workspace/e2e-test`
  {
    name: '@linteljs/workspace/e2e-test',
    files: ['packages/create/src/pipeline/e2e/targets/*.e2e.test.ts'],
    rules: { 'vitest/expect-expect': 'off' },
  },
];

export default config;
