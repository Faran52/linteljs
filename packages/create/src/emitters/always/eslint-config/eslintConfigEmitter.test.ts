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
    '@pages/*': './src/pages/*',
    '@pages': './src/pages',
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
    const actual = output.match(/^import /gm);
    expect(actual).toHaveLength(1);
    expect(output).toContain("import { composeConfig } from '@linteljs/eslint-config/compose-config';");
  });

  it('names next as one framework rather than composing react beneath it here', () => {
    const output = emitEslintConfig(answersFor({ target: 'next' }));

    expect(output).toContain("framework: 'next',");
    expect(output).not.toContain('react');
    expect(output).not.toContain('Group');
  });

  it('names the framework rather than an order for every target that has one', () => {
    const svelteConfig = emitEslintConfig(answersFor({ target: 'svelte' }));
    expect(svelteConfig).toContain("framework: 'svelte',");
    const angularConfig = emitEslintConfig(answersFor({ target: 'angular' }));
    expect(angularConfig).toContain("framework: 'angular',");
    const solidConfig = emitEslintConfig(answersFor({ target: 'solid' }));
    expect(solidConfig).toContain("framework: 'solid',");
  });

  it('renames the hooks alias per framework', () => {
    const vueConfig = emitEslintConfig(answersFor({ target: 'vue' }));

    expect(vueConfig).toContain(
      "'@composables/*': './src/lib/composables/*',",
    );

    expect(vueConfig).not.toContain("'@hooks/*'");

    const solidConfig = emitEslintConfig(answersFor({ target: 'solid' }));

    expect(solidConfig).toContain(
      "'@primitives/*': './src/lib/primitives/*',",
    );
  });

  it('omits the hooks alias where the framework has no hook equivalent', () => {
    const angularConfig = emitEslintConfig(answersFor({ target: 'angular' }));
    expect(angularConfig).not.toContain('/src/lib/hooks/');
    const webextensionConfig = emitEslintConfig(answersFor({ target: 'webextension' }));
    expect(webextensionConfig).not.toContain('/src/lib/hooks/');
  });

  it('emits @apis only with Zod', () => {
    const withoutZod = emitEslintConfig(answersFor({}));
    expect(withoutZod).not.toContain("'@apis/*'");

    const withZod = emitEslintConfig(answersFor({ libraries: ['zod'] }));

    expect(withZod).toContain(
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
    expect(output).not.toContain('undefined');
  });

  it('asks for the vitest layer only where a suite was chosen', () => {
    const withVitest = emitEslintConfig(answersFor({ testing: 'vitest' }));
    expect(withVitest).toContain('vitest: true');
    const withoutTesting = emitEslintConfig(answersFor({ testing: 'none' }));
    expect(withoutTesting).not.toContain('vitest');
  });

  it('keeps every emitted line inside the max-len the emitted config enforces', () => {
    for (const target of TARGET_IDS) {
      const output = emitEslintConfig(answersFor({ target }));
      const tooLong = output
        .split('\n')
        .filter((line) => {
          return line.length > 120;
        });

      const actual = {
        target,
        tooLong,
      };
      const expected = {
        target,
        tooLong: [],
      };
      expect(actual).toEqual(expected);
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
    const eslintConfig = emitEslintConfig(answersFor({ libraries: ['zod'] }));
    expect(eslintConfig).not.toContain('libraries:');
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

    const lines = [
      '  resolver: {',
      '    conditionNames: [',
      "      'import',",
      "      'require',",
      "      'node',",
      "      'default',",
      '    ],',
      '  },',
    ];
    const resolver = lines.join('\n');

    expect(output).toContain(resolver);
  });

  it('breaks the resolver conditions onto their own lines once they would run past max-len', () => {
    const digits = [
      '1',
      '2',
      '3',
      '4',
      '5',
    ];
    const conditions = digits
      .map((digit) => {
        return `condition-name-${digit}`;
      });
    const output = emitEslintConfig({
      ...answersFor({}),
      resolveConditions: conditions,
    });

    const lines = [
      '  resolver: {',
      '    conditionNames: [',
      ...conditions
        .map((condition) => {
          return `      '${condition}',`;
        }),
      '    ],',
      '  },',
    ];
    const resolver = lines.join('\n');

    expect(output).toContain(resolver);
  });

  it('emits no resolver at all where none was recorded', () => {
    const eslintConfig = emitEslintConfig(answersFor({}));
    expect(eslintConfig).not.toContain('resolver');
  });

  it('names no tailwind entry point when tailwind was not selected', () => {
    const config = emitEslintConfig(answersFor({
      libraries: [],
      data: 'tanstack-query',
    }));

    expect(config).not.toContain('tailwindEntryPoint');
  });

  it('omits the html layer where there is no markup for it to lint', () => {
    const angularConfig = emitEslintConfig(answersFor({ target: 'angular' }));
    expect(angularConfig).not.toContain('html');
    const nextConfig = emitEslintConfig(answersFor({ target: 'next' }));
    expect(nextConfig).not.toContain('html');
    const reactConfig = emitEslintConfig(answersFor({ target: 'react' }));
    expect(reactConfig).toContain('html: true,');
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
    const eslintConfig = emitEslintConfig(answersFor({ target: 'next' }));

    const lines = [
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
    ];
    const ignores = lines.join('\n');

    expect(eslintConfig).toContain(ignores);
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
    const bEndsWith = line?.endsWith("'b'],");
    expect(bEndsWith).toBe(true);
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
    const astroConfig = emitEslintConfig(answersFor({ target: 'astro' }));
    expect(astroConfig).toContain('  astro: true,\n');
    const reactConfig = emitEslintConfig(answersFor({ target: 'react' }));
    expect(reactConfig).not.toContain('astro');
  });

  it('turns the typescript layer on for every target', () => {
    for (const target of TARGET_IDS) {
      const eslintConfig = emitEslintConfig(answersFor({ target }));
      expect(eslintConfig).toContain('typescript: true,');
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

    const sliced = config.slice(config.indexOf('  naming: {'), config.indexOf('\n});'));
    expect(sliced).toBe(block);
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
    const config = emitEslintConfig(answers);
    const list = /ignores: (\[[^\]]*\])/su.exec(config)?.[1] ?? '[]';
    const quoted = [...list.matchAll(/'([^']+)'/gu)];

    return quoted
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
    const entries = ignoresOf(answersFor({ target }));
    const generated = entries.slice(5);
    expect(generated).toEqual(own);
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
    const entries = ignoresOf(answersFor({
      target: 'react',
      router: 'react-router-framework',
    }));
    const generated = entries.slice(5);
    const expected = ['.react-router/**', 'build/**'];
    expect(generated).toEqual(expected);
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
    const artifacts = eslintConfigEmitter(answersFor({}));
    const text = emitEslintConfig(answersFor({}));
    const expected = [{
      stage: 'lint',
      target: 'eslint.config.js',
      content: { text },
    }];
    expect(artifacts).toEqual(expected);
  });
});
