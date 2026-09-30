// Layers imported from source, so linting needs no build. Exemptions: docs/DESIGN.md "Workspace lint exemptions".
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

interface Zone {
  target: string;
  from: string[];
  except?: string[];
  message: string;
}

const ring = (name: string): string => {
  return `packages/create/src/${name}`;
};

// `buildGroups` reads the keys only; `config/` and `utils/` have no barrel, so no bare form.
const aliases = Object.fromEntries(RINGS
  .flatMap((name) => {
    const subpath: [string, string] = [`@${name}/*`, `${ring(name)}/*`];

    return name === 'config' || name === 'utils' ? [subpath] : [[`@${name}`, ring(name)], subpath];
  }));

const innerZones = (exceptBarrel: boolean): Zone[] => {
  return INNER_RINGS
    .slice(1)
    .map((name, index) => {
      const before = INNER_RINGS.slice(0, index + 1);

      return {
        target: ring(name),
        from: before.map(ring),
        ...(exceptBarrel && name === 'targets' ? { except: ['./index.ts'] } : {}),
        message: `The inner rings point answers/, targets/, utils/, config/. ${name}/ reads only those after it.`,
      };
    });
};

const config = [
  // Root, not `base`: in the layer it would make every consumer's directives inert on upgrade.
  // docs/DESIGN.md: `noInlineConfig`
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
      'packages/create/templates/starter-source/**',
    ],
    naming: {
      'packages/*/src/**/*.ts': 'CAMEL_CASE',
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

  // docs/DESIGN.md: `@linteljs/workspace/create-rings`
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
          ...innerZones(false),
        ],
      }],
    },
  },

  // docs/DESIGN.md: `@linteljs/workspace/create-rings`
  {
    name: '@linteljs/workspace/create-rings-tests',
    files: ['packages/create/src/**/*.test.ts'],
    rules: { 'import-x/no-restricted-paths': ['error', { zones: innerZones(true) }] },
  },

  // `es-toolkit/compat` restated: two config objects naming one rule do not merge their options.
  // docs/DESIGN.md: `@linteljs/workspace/create-worlds`
  {
    name: '@linteljs/workspace/create-worlds',
    files: ['packages/create/src/**'],
    ignores: [
      ...Object.keys(WORLDS)
        .map((name) => {
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

  // docs/DESIGN.md: `@linteljs/workspace/create-config-data`
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

  // Options given, since severity alone inherits the layer's `allow`. docs/DESIGN.md: `@linteljs/workspace/scripts`
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
    files: ['packages/create/templates/project/scripts/utils/loggerUtils.ts'],
    rules: { 'no-console': 'off' },
  },

  // sonarjs cannot read an AST identity check. docs/DESIGN.md: `@linteljs/workspace/ast-identity`
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

  // sonarjs cannot see cases `RuleTester.run()` registers. docs/DESIGN.md: `@linteljs/workspace/rule-tester`
  {
    name: '@linteljs/workspace/rule-tester',
    files: ['packages/eslint-plugin/src/rules/**/*.test.ts'],
    rules: {
      'sonarjs/no-empty-test-file': 'off',
    },
  },

  // `runE2eCase` is passed by reference, out of the rule's reach. docs/DESIGN.md: `@linteljs/workspace/e2e-test`
  {
    name: '@linteljs/workspace/e2e-test',
    files: ['packages/create/src/pipeline/e2e/targets/*.e2e.test.ts'],
    rules: { 'vitest/expect-expect': 'off' },
  },

  // Off until the reformat commit lands. docs/DESIGN.md: `@linteljs/workspace/pending-list-reformat`
  {
    name: '@linteljs/workspace/pending-list-reformat',
    rules: {
      '@linteljs/array-newline': 'off',
      '@linteljs/member-newline': ['error', { maxProperties: 2 }],
      '@linteljs/import-newlines': ['error', { maxItems: 2 }],
    },
  },
];

export default config;
