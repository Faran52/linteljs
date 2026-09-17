/**
 * The workspace lints itself with its own layers, imported from source rather than `dist`, so linting never
 * needs a build first; jiti loads this TypeScript config. Every exemption below names its DESIGN.md heading
 * under "Workspace lint exemptions", which holds the measurement that earned it; one without is one to delete.
 */
import base from './packages/eslint-config/src/base';
import typescript from './packages/eslint-config/src/typescript';
import vitest from './packages/eslint-config/src/vitest';

const config = [
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

  // `@linteljs/create`'s three rings, made mechanical. DESIGN.md: `@linteljs/workspace/create-rings`
  {
    name: '@linteljs/workspace/create-rings',
    files: ['packages/create/src/**'],
    ignores: ['**/*.test.ts'],
    rules: {
      'import-x/no-restricted-paths': ['error', {
        zones: [
          {
            target: 'packages/create/src/model',
            from: ['packages/create/src/artifacts', 'packages/create/src/run'],
            message: 'model/ is the answers and the target records. It reaches nothing outward.',
          },
          {
            target: 'packages/create/src/artifacts',
            from: 'packages/create/src/run',
            message: 'artifacts/ turns answers into text. Disk, argv and terminals live in run/.',
          },
        ],
      }],
    },
  },

  // The audit and smoke scripts, whose stdout is their output. DESIGN.md: `@linteljs/workspace/scripts`
  {
    name: '@linteljs/workspace/scripts',
    files: ['packages/*/scripts/**'],
    rules: { 'no-console': 'off' },
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
    files: ['packages/create/src/run/pipeline/e2e/*.e2e.test.ts'],
    rules: { 'vitest/expect-expect': 'off' },
  },
];

export default config;
