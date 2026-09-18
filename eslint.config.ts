/**
 * The workspace lints itself with its own layers, imported from source rather than `dist`, so linting never
 * needs a build first; jiti loads this TypeScript config. Every exemption below names its DESIGN.md heading
 * under "Workspace lint exemptions", which holds the measurement that earned it; one without is one to delete.
 */
import base from './packages/eslint-config/src/base';
import typescript from './packages/eslint-config/src/typescript';
import vitest from './packages/eslint-config/src/vitest';

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
      'packages/create/assets/mocks/setupTests.angular.ts',
      'packages/create/assets/mocks/setupTests.reactNative.ts',
      'packages/create/assets/mocks/renderScreen.tsx',
      'packages/create/assets/starter/**',
    ],
    naming: {
      'packages/*/src/**/*.ts': 'CAMEL_CASE',
      // DESIGN.md: `'**/utils/*.ts': '*Utils'`
      '**/utils/*.ts': '*Utils',
    },
    folderNaming: {
      'packages/*/src/**/': 'KEBAB_CASE',
    },
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
            target: ['packages/create/src/answers', 'packages/create/src/targets'],
            from: [
              'packages/create/src/emitters',
              'packages/create/src/files',
              'packages/create/src/pipeline',
              'packages/create/src/process',
              'packages/create/src/terminal',
            ],
            message: 'answers/ is what the user chose, targets/ what lintel knows. Neither reaches outward.',
          },
          {
            target: 'packages/create/src/emitters',
            from: [
              'packages/create/src/files',
              'packages/create/src/pipeline',
              'packages/create/src/process',
              'packages/create/src/terminal',
            ],
            message: 'emitters/ turns answers into text. Disk, argv and terminals live outside it.',
          },
        ],
      }],
    },
  },

  /**
   * One folder per responsibility, and which one a module belongs to is decided by the world it reaches into rather
   * than by judgement: `node:fs` means `files/`, `node:child_process` means `process/`, argv and the terminal mean
   * `terminal/`. Everything else goes through them, which is what makes the inner rings testable without a disk.
   * `e2e/` is the harness rather than the package, and it spawns real managers on purpose.
   * DESIGN.md: `@linteljs/workspace/create-worlds`
   */
  {
    name: '@linteljs/workspace/create-worlds',
    files: ['packages/create/src/**'],
    ignores: [
      'packages/create/src/terminal/**',
      'packages/create/src/files/**',
      'packages/create/src/process/**',
      'packages/create/src/pipeline/e2e/**',
      '**/*.test.ts',
    ],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['node:fs', 'node:fs/*'],
            message: 'The filesystem lives in files/. Reach it through files/utils/fsUtils.',
          },
          {
            group: ['node:child_process'],
            message: 'Spawning lives in process/.',
          },
          {
            group: ['node:process', '@clack/*'],
            message: 'argv and the terminal live in terminal/.',
          },
        ],
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
    files: ['packages/create/src/pipeline/e2e/*.e2e.test.ts'],
    rules: { 'vitest/expect-expect': 'off' },
  },
];

export default config;
