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

import type { Linter } from 'eslint';

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

    const barrel: [string, string] = [`@${name}`, ring(name)];

    const entries = name === 'config' || name === 'utils' ? [subpath] : [barrel, subpath];

    return entries;
  }));

// `base` exempts every `e2e/` as a suite; this one is the create harness, so only its suites keep the exemption.
// docs/DESIGN.md: `@linteljs/workspace/e2e-source`
const E2E_GLOB = '**/e2e/**';

const withoutE2e = <Glob>(globs: Glob[] | undefined): Glob[] | undefined => {
  return globs
    ?.filter((glob) => {
      return glob !== E2E_GLOB;
    });
};

const e2eAsSource = (block: Linter.Config): Linter.Config => {
  const files = withoutE2e(block.files);
  const ignores = withoutE2e(block.ignores);

  const sourceBlock = {
    ...block,
    ...(files && { files }),
    ...(ignores && { ignores }),
  };

  return sourceBlock;
};

const innerZones = (exceptBarrel: boolean): Zone[] => {
  return INNER_RINGS
    .slice(1)
    .map((name, index) => {
      const before = INNER_RINGS.slice(0, index + 1);

      const zone = {
        target: ring(name),
        from: before.map(ring),
        ...(exceptBarrel && name === 'targets' ? { except: ['./index.ts'] } : {}),
        message: `The inner rings point answers/, targets/, utils/, config/. ${name}/ reads only those after it.`,
      };

      return zone;
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
      'packages/create/templates/fragments/test-setup/setupTests.mswJest.ts',
      'packages/create/templates/fragments/test-setup/setupTests.i18n.ts',
      'packages/create/templates/fragments/test-setup/setupTests.reactNativeI18n.ts',
      'packages/create/templates/fragments/test-setup/setupTests.vueI18n.ts',
      'packages/create/templates/starter-source/**',
      // docs/DESIGN.md: Ignores, the check band
      'packages/create/templates/project/plugins/**/*.tsx',
      // docs/DESIGN.md: Ignores, the repo mod
      '.claude/skills/linteljs/**',
    ],
    naming: {
      'packages/*/src/**/*.ts': 'CAMEL_CASE',
      'packages/create/e2e/**/*.ts': 'CAMEL_CASE',
      'packages/create/templates/project/{scripts,plugins}/**/*.ts': 'CAMEL_CASE',
      // docs/DESIGN.md: `'**/utils/*.ts': '*Utils'`
      '**/utils/*.ts': '*Utils',
    },
    folderNaming: {
      'packages/*/src/**/': 'KEBAB_CASE',
      'packages/create/e2e/**/': 'KEBAB_CASE',
    },
    aliases: {
      ...aliases,
      '@e2e/*': 'packages/create/e2e/*',
    },
    // docs/DESIGN.md: `resolver: { project: 'packages/*/tsconfig.json' }`
    resolver: {
      project: 'packages/*/tsconfig.json',
      noWarnOnMultipleProjects: true,
    },
  })
    .map(e2eAsSource),
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
    },
  },
  // docs/DESIGN.md: `@linteljs/workspace/scripts`
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
    files: ['packages/create/e2e/targets/*.e2e.test.ts'],
    rules: { 'vitest/expect-expect': 'off' },
  },

  // Plugin state is read from an inline shape. docs/DESIGN.md: `@linteljs/workspace/band-types`
  {
    name: '@linteljs/workspace/band-types',
    files: ['packages/create/templates/project/plugins/linteljs/types/index.d.ts'],
    rules: { '@linteljs/no-inline-object-types': 'off' },
  },
];

export default config;
