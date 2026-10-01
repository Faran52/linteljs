import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { valuesOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';
import { FOLDER_ROUTED } from '@targets';

import { emitEslintConfig, eslintConfigEmitter } from './eslintConfigEmitter';

import type {
  Answers,
  Data,
  HostedFramework,
  Library,
  Router,
  Styling,
  TargetId,
  Testing,
} from '@config/types';

interface AnswerOverrides {
  target?: TargetId;
  hostedFramework?: HostedFramework;
  testing?: Testing;
  libraries?: Library[];
  router?: Router;
  styling?: Styling;
  data?: Data;
}

const TARGET_IDS = valuesOf(ANSWERS.target.values);

const CANONICAL_REACT = `import { composeConfig } from '@linteljs/eslint-config/compose-config';

const config = await composeConfig({
  framework: 'react',
  typescript: true,
  vitest: true,
  html: true,
  ignores: [
    'dist/**',
    'coverage/**',
    '.claude/**',
    '.agents/**',
    'plugins/linteljs/**',
  ],
  aliases: {
    '@components/*': './src/components/*',
    '@components': './src/components',
    '@ui/*': './src/components/ui/*',
    '@ui': './src/components/ui',
    '@features/*': './src/components/features/*',
    '@features': './src/components/features',
    '@lib/*': './src/lib/*',
    '@lib': './src/lib',
    '@store/*': './src/lib/store/*',
    '@store': './src/lib/store',
    '@hooks/*': './src/lib/hooks/*',
    '@hooks': './src/lib/hooks',
    '@utils/*': './src/lib/utils/*',
    '@utils': './src/lib/utils',
    '@services/*': './src/lib/services/*',
    '@services': './src/lib/services',
    '@styles/*': './src/styles/*',
    '@styles': './src/styles',
    '@config/*': './src/config/*',
    '@config': './src/config',
    '@mocks/*': './__mocks__/*',
    '@mocks': './__mocks__',
  },
  naming: {
    'src/**/*.tsx': '!([a-z]*[A-Z]*)',
    'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    '**/utils/*.ts': '*Utils',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },
});

export default config;
`;

describe('emitEslintConfig', () => {
  it('reproduces the frozen contract file for default React answers', () => {
    const config = emitEslintConfig(answersFor({
      target: 'react',
      libraries: [],
    }));

    expect(config).toBe(CANONICAL_REACT);
  });

  it('imports the composer from its subpath, once, and nothing else', () => {
    const output = emitEslintConfig(answersFor({ target: 'vue' }));

    expect(output).not.toContain("from '@linteljs/eslint-config'");
    expect(output.match(/^import /gm)).toHaveLength(1);
    expect(output).toContain("import { composeConfig } from '@linteljs/eslint-config/compose-config';");
  });

  it('names next as one framework rather than composing react beneath it here', () => {
    const output = emitEslintConfig(answersFor({ target: 'next' }));

    expect(output).toContain("framework: 'next',");
    expect(output).not.toContain('react');
    expect(output).not.toContain('Group');
  });

  it('names the framework rather than an order for every target that has one', () => {
    expect(emitEslintConfig(answersFor({ target: 'svelte' }))).toContain("framework: 'svelte',");
    expect(emitEslintConfig(answersFor({ target: 'angular' }))).toContain("framework: 'angular',");
    expect(emitEslintConfig(answersFor({ target: 'solid' }))).toContain("framework: 'solid',");
  });

  it('renames the hooks alias per framework', () => {
    expect(emitEslintConfig(answersFor({ target: 'vue' }))).toContain(
      "'@composables/*': './src/lib/composables/*',",
    );

    expect(emitEslintConfig(answersFor({ target: 'vue' }))).not.toContain("'@hooks/*'");

    expect(emitEslintConfig(answersFor({ target: 'solid' }))).toContain(
      "'@primitives/*': './src/lib/primitives/*',",
    );
  });

  it('omits the hooks alias where the framework has no hook equivalent', () => {
    expect(emitEslintConfig(answersFor({ target: 'angular' }))).not.toContain('/src/lib/hooks/');
    expect(emitEslintConfig(answersFor({ target: 'webextension' }))).not.toContain('/src/lib/hooks/');
  });

  it('emits @apis only with Zod', () => {
    expect(emitEslintConfig(answersFor({}))).not.toContain("'@apis/*'");

    expect(emitEslintConfig(answersFor({ libraries: ['zod'] }))).toContain(
      "'@apis/*': './src/lib/apis/*',",
    );
  });

  it('names no framework at all for plain TypeScript', () => {
    const output = emitEslintConfig(answersFor({ target: 'webextension' }));

    expect(output).not.toContain('framework:');
    expect(output).not.toContain('Group');
  });

  it('drops the vitest layer when testing is declined', () => {
    const output = emitEslintConfig(answersFor({ testing: 'none' }));

    expect(output).not.toContain('vitest');
    expect(output).not.toContain('@mocks/*');
  });

  it('asks for the vitest layer only where a suite was chosen', () => {
    expect(emitEslintConfig(answersFor({ testing: 'vitest' }))).toContain('vitest: true');
    expect(emitEslintConfig(answersFor({ testing: 'none' }))).not.toContain('vitest');
  });

  it('keeps every emitted line inside the max-len the emitted config enforces', () => {
    for (const target of TARGET_IDS) {
      const tooLong = emitEslintConfig(answersFor({ target }))
        .split('\n')
        .filter((line) => {
          return line.length > 120;
        });

      expect({
        target,
        tooLong,
      }).toEqual({
        target,
        tooLong: [],
      });
    }
  });

  it('asks for a library layer only when its library was selected', () => {
    const withQuery = emitEslintConfig(answersFor({
      libraries: [],
      data: 'tanstack-query',
    }));

    expect(withQuery).toContain("libraries: ['tanstack-query'],");

    const withTailwind = emitEslintConfig(answersFor({
      libraries: [],
      styling: 'tailwind',
    }));

    expect(withTailwind).toContain("libraries: ['tailwind'],");

    const withBoth = emitEslintConfig(answersFor({
      libraries: [],
      styling: 'tailwind',
      data: 'tanstack-query',
    }));

    expect(withBoth).toContain("libraries: ['tanstack-query', 'tailwind'],");

    const withStylex = emitEslintConfig(answersFor({
      libraries: [],
      styling: 'stylex',
    }));

    expect(withStylex).toContain("libraries: ['stylex'],");
    expect(emitEslintConfig(answersFor({ libraries: ['zod'] }))).not.toContain('libraries:');
  });

  it('asks for no layer for the other value of the answer that gates it', () => {
    const config = emitEslintConfig(answersFor({
      libraries: [],
      data: 'rtk-query',
      router: 'react-router',
    }));

    expect(config).not.toContain('libraries:');
  });

  it.each<[TargetId, string]>([
    ['react', './src/index.css'],
    ['next', './src/app/globals.css'],
    ['vue', './src/styles/main.css'],
    ['solid', './src/index.css'],
    ['angular', './src/styles.css'],
    ['webextension', './src/style.css'],
    ['react-native', './src/global.css'],
    ['svelte', './src/app.css'],
  ])('names %s tailwind entry point as its stylesheet', (target, entry) => {
    const config = emitEslintConfig(answersFor({
      target,
      libraries: [],
      styling: 'tailwind',
    }));

    expect(config).toContain(`tailwindEntryPoint: '${entry}',`);
  });

  it('emits the resolver conditions a project recorded', () => {
    const output = emitEslintConfig({
      ...answersFor({}),
      resolveConditions: [
        'import',
        'require',
        'node',
        'default',
      ],
    });

    expect(output).toContain([
      '  resolver: {',
      '    conditionNames: [',
      "      'import',",
      "      'require',",
      "      'node',",
      "      'default',",
      '    ],',
      '  },',
    ].join('\n'));
  });

  it('breaks the resolver conditions onto their own lines once they would run past max-len', () => {
    const conditions = [
      '1',
      '2',
      '3',
      '4',
      '5',
    ]
      .map((digit) => {
        return `condition-name-${digit}`;
      });
    const output = emitEslintConfig({
      ...answersFor({}),
      resolveConditions: conditions,
    });

    expect(output).toContain([
      '  resolver: {',
      '    conditionNames: [',
      ...conditions
        .map((condition) => {
          return `      '${condition}',`;
        }),
      '    ],',
      '  },',
    ].join('\n'));
  });

  it('emits no resolver at all where none was recorded', () => {
    expect(emitEslintConfig(answersFor({}))).not.toContain('resolver');
  });

  it('names no tailwind entry point when tailwind was not selected', () => {
    const config = emitEslintConfig(answersFor({
      libraries: [],
      data: 'tanstack-query',
    }));

    expect(config).not.toContain('tailwindEntryPoint');
  });

  it('omits the html layer where there is no markup for it to lint', () => {
    expect(emitEslintConfig(answersFor({ target: 'angular' }))).not.toContain('html');
    expect(emitEslintConfig(answersFor({ target: 'next' }))).not.toContain('html');
    expect(emitEslintConfig(answersFor({ target: 'react' }))).toContain('html: true,');
  });

  it('gives Next the aliases for the directories only it has', () => {
    const next = emitEslintConfig(answersFor({ target: 'next' }));
    const react = emitEslintConfig(answersFor({ target: 'react' }));

    expect(next).toContain("'@server/*': './src/lib/server/*',");
    expect(next).toContain("'@content/*': './src/content/*',");
    expect(react).not.toContain("'@server/*'");
    expect(react).not.toContain("'@content/*'");
  });

  it('carries the target ignores on top of the shared ones', () => {
    expect(emitEslintConfig(answersFor({ target: 'next' }))).toContain(
      [
        '  ignores: [',
        "    'dist/**',",
        "    'coverage/**',",
        "    '.claude/**',",
        "    '.agents/**',",
        "    'plugins/linteljs/**',",
        "    '.next/**',",
        "    'out/**',",
        "    'next-env.d.ts',",
        '  ],',
      ].join('\n'),
    );
  });

  it('keeps a list of two that is exactly max-len long on one line', () => {
    const line = emitEslintConfig({
      ...answersFor({ target: 'react' }),
      resolveConditions: ['a'.repeat(90), 'b'],
    })
      .split('\n')
      .find((candidate) => {
        return candidate.startsWith('    conditionNames:');
      });

    expect(line).toHaveLength(120);
    expect(line?.endsWith("'b'],")).toBe(true);
  });

  it('breaks a list of two once it would run past max-len', () => {
    const output = emitEslintConfig({
      ...answersFor({ target: 'react' }),
      resolveConditions: ['a'.repeat(91), 'b'],
    });

    expect(output).toContain(`    conditionNames: [\n      '${'a'.repeat(91)}',\n      'b',\n    ],`);
  });

  it('breaks a list of three however short it is', () => {
    const output = emitEslintConfig({
      ...answersFor({ target: 'react' }),
      resolveConditions: [
        'a',
        'b',
        'c',
      ],
    });

    expect(output).toContain("    conditionNames: [\n      'a',\n      'b',\n      'c',\n    ],");
  });

  it('escapes a quote inside a value', () => {
    const config = emitEslintConfig({
      ...answersFor({}),
      ignores: ["it's/**"],
    });

    expect(config).toContain("'it\\'s/**'");
  });

  it('escapes a trailing backslash and a newline so the config still parses', () => {
    const config = emitEslintConfig({
      ...answersFor({}),
      ignores: ['build\\', 'a\nb'],
    });

    expect(config).toContain("'build\\\\'");
    expect(config).toContain("'a\\nb'");
  });

  it('asks for the astro layer on astro alone', () => {
    expect(emitEslintConfig(answersFor({ target: 'astro' }))).toContain('  astro: true,\n');
    expect(emitEslintConfig(answersFor({ target: 'react' }))).not.toContain('astro');
  });

  it('turns the typescript layer on for every target', () => {
    for (const target of TARGET_IDS) {
      expect(emitEslintConfig(answersFor({ target }))).toContain('typescript: true,');
    }
  });
});

describe('the naming policy', () => {
  it.each<[string, AnswerOverrides, string]>([
    [
      'react',
      { target: 'react' },
      `  naming: {
    'src/**/*.tsx': '!([a-z]*[A-Z]*)',
    'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    '**/utils/*.ts': '*Utils',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`,
    ],
    [
      'next',
      { target: 'next' },
      `  naming: {
    'src/**/*.tsx': '!([a-z]*[A-Z]*)',
    'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/!(app)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    '**/utils/*.ts': '*Utils',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`,
    ],
    [
      'vue',
      { target: 'vue' },
      `  naming: {
    'src/**/*.vue': '!([a-z]*[A-Z]*)',
    'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    '**/utils/*.ts': '*Utils',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': '@(+([a-z0-9])*(-+([a-z0-9]))|__tests__)',
  },`,
    ],
    [
      'nuxt',
      { target: 'nuxt' },
      `  naming: {
    'src/**/*.vue': '!([a-z]*[A-Z]*)',
    'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    '**/utils/*.ts': '*Utils',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`,
    ],
    [
      'svelte',
      { target: 'svelte' },
      `  naming: {
    'src/**/*.svelte': '!([a-z]*[A-Z]*)',
    'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/!(routes)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    '**/utils/*.ts': '*Utils',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`,
    ],
    [
      'solid',
      { target: 'solid' },
      `  naming: {
    'src/**/*.tsx': '!([a-z]*[A-Z]*)',
    'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    '**/utils/*.ts': '*Utils',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`,
    ],
    [
      'angular',
      { target: 'angular' },
      `  naming: {
    'src/**/!(*.d).ts': 'KEBAB_CASE',
    'src/**/utils/*.ts': '*-utils',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': '@(+([a-z0-9])*(-+([a-z0-9]))|__tests__)',
  },`,
    ],
    [
      'astro',
      { target: 'astro' },
      `  naming: {
    'src/**/*.astro': '!([a-z]*[A-Z]*)',
    'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/!(pages)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    '**/utils/*.ts': '*Utils',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`,
    ],
    [
      'webextension',
      { target: 'webextension' },
      `  naming: {
    'src/components/**/!(*.d|*.test|*.spec).ts': 'PASCAL_CASE',
    'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/!(components)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    '**/utils/*.ts': '*Utils',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': '@(+([a-z0-9])*(-+([a-z0-9]))|__tests__)',
  },`,
    ],
    [
      'react-native',
      { target: 'react-native' },
      `  naming: {
    'src/**/*.tsx': '!([a-z]*[A-Z]*)',
    'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/!(app)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    '**/utils/*.ts': '*Utils',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`,
    ],
    [
      'astro hosting react',
      {
        target: 'astro',
        hostedFramework: 'react',
      },
      `  naming: {
    'src/**/*.astro': '!([a-z]*[A-Z]*)',
    'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/!(pages)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    '**/utils/*.ts': '*Utils',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
    'src/**/*.tsx': '!([a-z]*[A-Z]*)',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`,
    ],
    [
      'webextension hosting react',
      {
        target: 'webextension',
        hostedFramework: 'react',
      },
      `  naming: {
    'src/**/*.tsx': '!([a-z]*[A-Z]*)',
    'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    '**/utils/*.ts': '*Utils',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': '@(+([a-z0-9])*(-+([a-z0-9]))|__tests__)',
  },`,
    ],
    [
      'astro hosting vue',
      {
        target: 'astro',
        hostedFramework: 'vue',
      },
      `  naming: {
    'src/**/*.astro': '!([a-z]*[A-Z]*)',
    'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/!(pages)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    '**/utils/*.ts': '*Utils',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
    'src/**/*.vue': '!([a-z]*[A-Z]*)',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`,
    ],
    [
      'webextension hosting vue',
      {
        target: 'webextension',
        hostedFramework: 'vue',
      },
      `  naming: {
    'src/**/*.vue': '!([a-z]*[A-Z]*)',
    'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    '**/utils/*.ts': '*Utils',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': '@(+([a-z0-9])*(-+([a-z0-9]))|__tests__)',
  },`,
    ],
    [
      'astro hosting svelte',
      {
        target: 'astro',
        hostedFramework: 'svelte',
      },
      `  naming: {
    'src/**/*.astro': '!([a-z]*[A-Z]*)',
    'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/!(pages)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    '**/utils/*.ts': '*Utils',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
    'src/**/*.svelte': '!([a-z]*[A-Z]*)',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`,
    ],
    [
      'webextension hosting svelte',
      {
        target: 'webextension',
        hostedFramework: 'svelte',
      },
      `  naming: {
    'src/**/*.svelte': '!([a-z]*[A-Z]*)',
    'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    '**/utils/*.ts': '*Utils',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': '@(+([a-z0-9])*(-+([a-z0-9]))|__tests__)',
  },`,
    ],
    [
      'astro hosting solid',
      {
        target: 'astro',
        hostedFramework: 'solid',
      },
      `  naming: {
    'src/**/*.astro': '!([a-z]*[A-Z]*)',
    'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/!(pages)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    '**/utils/*.ts': '*Utils',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
    'src/**/*.tsx': '!([a-z]*[A-Z]*)',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`,
    ],
    [
      'webextension hosting solid',
      {
        target: 'webextension',
        hostedFramework: 'solid',
      },
      `  naming: {
    'src/**/*.tsx': '!([a-z]*[A-Z]*)',
    'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    '**/utils/*.ts': '*Utils',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': '@(+([a-z0-9])*(-+([a-z0-9]))|__tests__)',
  },`,
    ],
  ])('names files and folders the %s way', (_label, overrides, block) => {
    const config = emitEslintConfig(answersFor(overrides));

    expect(config.slice(config.indexOf('  naming: {'), config.indexOf('\n});'))).toBe(block);
  });
});

describe('folderNaming', () => {
  it('emits the glob raw, so the file parses back to the pattern it declared', () => {
    const emitted = emitEslintConfig(answersFor({ target: 'react-native' }));
    const tagged = /'src\/\*\*\/': String\.raw`([^`]*)`/.exec(emitted)?.[1];

    expect(tagged).toBe(FOLDER_ROUTED);
  });
});

describe('ignores', () => {
  const ignoresOf = (answers: Answers): string[] => {
    const list = /ignores: (\[[^\]]*\])/su.exec(emitEslintConfig(answers))?.[1] ?? '[]';

    return [...list.matchAll(/'([^']+)'/gu)]
      .map(([, entry = '']) => {
        return entry;
      });
  };

  it.each<[TargetId, string[]]>([
    ['react', []],
    ['next', [
      '.next/**',
      'out/**',
      'next-env.d.ts',
    ]],
    ['vue', []],
    ['nuxt', ['.nuxt/**', '.output/**']],
    ['svelte', ['.svelte-kit/**', 'src/app.html']],
    ['solid', []],
    ['angular', ['.angular/**']],
    ['astro', ['.astro/**']],
    ['webextension', []],
    ['react-native', [
      '.expo/**',
      'android/**',
      'ios/**',
      'expo-env.d.ts',
    ]],
  ])('ignores what %s generates on top of the shared entries', (target, own) => {
    expect(ignoresOf(answersFor({ target })).slice(5)).toEqual(own);
  });

  it('holds src/routes.ts to relative imports in framework mode, and nothing else', () => {
    const framework = emitEslintConfig(answersFor({
      target: 'react',
      router: 'react-router-framework',
    }));
    const library = emitEslintConfig(answersFor({
      target: 'react',
      router: 'react-router',
    }));
    const rows = "  aliasExempt: ['src/routes.ts'],\n  enforceRelativeImports: true,\n";

    expect(framework).toContain(rows);
    expect(library).not.toContain('aliasExempt');
    expect(library).not.toContain('enforceRelativeImports');
  });

  it('ignores what React Router generates in framework mode', () => {
    expect(ignoresOf(answersFor({
      target: 'react',
      router: 'react-router-framework',
    })).slice(5)).toEqual(['.react-router/**', 'build/**']);
  });

  it('never repeats an entry for any target', () => {
    const duplicated = TARGET_IDS
      .flatMap((target) => {
        const entries = ignoresOf(answersFor({ target }));
        const seen = entries
          .filter((entry, index) => {
            return entries.indexOf(entry) !== index;
          });

        return seen
          .map((entry) => {
            return `${target}: ${entry}`;
          });
      });

    expect(duplicated).toEqual([]);
  });
});

describe('the router', () => {
  it('composes the tanstack-router layer', () => {
    const config = emitEslintConfig(answersFor({
      target: 'react',
      router: 'tanstack-router',
    }));

    expect(config).toContain("'tanstack-router'");
    expect(config).not.toContain('routeTree.gen.ts');
  });

  it('adds nothing for react-router, which ships no rules', () => {
    const config = emitEslintConfig(answersFor({
      target: 'react',
      router: 'react-router',
    }));

    expect(config).not.toContain('tanstack-router');
    expect(config).not.toContain('routeTree');
  });
});

describe('eslintConfigEmitter', () => {
  it('writes the emitted text to eslint.config.js at the lint stage', () => {
    expect(eslintConfigEmitter(answersFor({}))).toEqual([{
      stage: 'lint',
      target: 'eslint.config.js',
      content: { text: emitEslintConfig(answersFor({})) },
    }]);
  });
});
