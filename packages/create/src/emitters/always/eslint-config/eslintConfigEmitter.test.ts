import { answersFor } from '@mocks/answersFor';
import { everyTarget } from '@mocks/everyTarget';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { keysOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';
import { FOLDER_ROUTED } from '@targets';

import {
  emitEslintConfig,
  eslintConfigEmitter,
  objectLiteral,
} from './eslintConfigEmitter';

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

const TARGET_IDS = keysOf(ANSWERS.target.values);

const CANONICAL_REACT = `import { linteljs } from '@linteljs/eslint-config';

const config = await linteljs({
  root: import.meta.dirname,
  framework: 'react',
  typescript: true,
  html: true,
  testing: 'vitest',
  ignores: [
    'dist/**',
    'coverage/**',
    '.claude/**',
    '.agents/**',
    'plugins/linteljs/**',
  ],
  naming: {
    'src/**/*.tsx': '!([a-z]*[A-Z]*)',
    'src/**/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/**/*.styles.ts': '!([a-z]*[A-Z]*)',
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

  it('imports the composer from the root, once, and nothing else', () => {
    const output = emitEslintConfig(answersFor({ target: 'vue' }));

    expect(output).not.toContain("from '@linteljs/eslint-config/");
    const actual = output.match(/^import /gm);
    expect(actual).toHaveLength(1);
    expect(output).toContain("import { linteljs } from '@linteljs/eslint-config';");
  });

  it('names next as one framework rather than composing react beneath it here', () => {
    const output = emitEslintConfig(answersFor({ target: 'next' }));

    expect(output).toContain("framework: 'next',");
    expect(output).not.toContain('react');
    expect(output).not.toContain('Group');
  });

  it.each<[TargetId, string]>([
    ['svelte', 'sveltekit'],
    ['angular', 'angular'],
    ['solid', 'solid'],
    ['vue', 'vue'],
    ['nuxt', 'nuxt'],
    ['react-native', 'expo'],
  ])('names the %s target as framework %s', (target, framework) => {
    const config = emitEslintConfig(answersFor({ target }));

    expect(config).toContain(`  framework: '${framework}',\n`);
    expect(config).not.toContain('islands');
  });

  it.each<[TargetId, HostedFramework, string]>([
    [
      'astro',
      'svelte',
      'astro',
    ],
    [
      'webextension',
      'vue',
      'wxt',
    ],
  ])('names the %s target as its host with %s as the island', (target, hostedFramework, framework) => {
    const config = emitEslintConfig(answersFor({
      target,
      hostedFramework,
    }));

    expect(config).toContain(`  framework: '${framework}',\n  islands: ['${hostedFramework}'],\n`);
  });

  it('names a host with no island when none is hosted', () => {
    const config = emitEslintConfig(answersFor({ target: 'webextension' }));

    expect(config).toContain("  framework: 'wxt',\n  typescript: true,\n");
  });

  it('names no framework at all for plain TypeScript', () => {
    const output = emitEslintConfig(answersFor({ target: 'typescript' }));

    expect(output).not.toContain('framework');
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
    expect(withVitest).toContain("testing: 'vitest',");
    const withoutTesting = emitEslintConfig(answersFor({ testing: 'none' }));
    expect(withoutTesting).not.toContain('vitest');
  });

  it('names expo and jest on react-native', () => {
    const output = emitEslintConfig(answersFor({
      target: 'react-native',
      testing: 'jest',
    }));

    expect(output).toContain("framework: 'expo',");
    expect(output).toContain("testing: 'jest',");
  });

  it('asks for no layer for maestro, whose flows are YAML', () => {
    const output = emitEslintConfig(answersFor({
      target: 'react-native',
      e2e: 'maestro',
    }));

    expect(output).not.toContain('maestro');
    expect(output).not.toContain('playwright');
  });

  it('names the e2e runner and the story workshop only when they were answered', () => {
    const answered = emitEslintConfig(answersFor({
      e2e: 'playwright',
      stories: 'storybook',
    }));
    expect(answered).toContain("e2e: 'playwright',");
    expect(answered).toContain("stories: 'storybook',");
    const unanswered = emitEslintConfig(answersFor({}));
    expect(unanswered).not.toContain('playwright');
    expect(unanswered).not.toContain('storybook');
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

    expect(withQuery).toContain("data: 'tanstack-query',");

    const withRouter = emitEslintConfig(answersFor({
      libraries: [],
      router: 'tanstack-router',
    }));

    expect(withRouter).toContain("router: 'tanstack-router',");

    const withStylex = emitEslintConfig(answersFor({
      libraries: [],
      styling: 'stylex',
    }));

    expect(withStylex).toContain("styling: 'stylex',");
    const eslintConfig = emitEslintConfig(answersFor({ libraries: ['zod'] }));
    expect(eslintConfig).not.toMatch(/tanstack|tailwind|stylex/u);
  });

  it('asks for no layer for the other value of the answer that gates it', () => {
    const config = emitEslintConfig(answersFor({
      libraries: [],
      data: 'rtk-query',
      router: 'react-router',
    }));

    expect(config).not.toContain('tanstack');
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

    expect(config).toContain(`  styling: 'tailwind',\n  tailwind: {\n    entryPoint: '${entry}',\n  },`);
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

  it('asks for no tailwind layer when tailwind was not selected', () => {
    const config = emitEslintConfig(answersFor({
      libraries: [],
      data: 'tanstack-query',
    }));

    expect(config).not.toContain('tailwind');
  });

  it('names tailwind with no entry point for a target with no stylesheet', () => {
    const config = emitEslintConfig(answersFor({
      target: 'typescript',
      styling: 'tailwind',
    }));

    expect(config).toContain("  styling: 'tailwind',\n");
    expect(config).not.toContain('tailwind:');
  });

  it('omits the html layer where there is no markup for it to lint', () => {
    const angularConfig = emitEslintConfig(answersFor({ target: 'angular' }));
    expect(angularConfig).not.toContain('html');
    const nextConfig = emitEslintConfig(answersFor({ target: 'next' }));
    expect(nextConfig).not.toContain('html');
    const reactConfig = emitEslintConfig(answersFor({ target: 'react' }));
    expect(reactConfig).toContain('html: true,');
  });

  it('carries the target ignores on top of the shared ones', () => {
    const eslintConfig = emitEslintConfig(answersFor({ target: 'svelte' }));

    const lines = [
      '  ignores: [',
      "    'dist/**',",
      "    'coverage/**',",
      "    '.claude/**',",
      "    '.agents/**',",
      "    'plugins/linteljs/**',",
      "    '.svelte-kit/**',",
      "    'src/app.html',",
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
    'src/**/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/**/*.styles.ts': '!([a-z]*[A-Z]*)',
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
    'src/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/!(app)/**/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/**/*.styles.ts': '!([a-z]*[A-Z]*)',
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
    'src/**/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/**/*.styles.ts': '!([a-z]*[A-Z]*)',
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
    'src/**/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/**/*.styles.ts': '!([a-z]*[A-Z]*)',
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
    'src/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/!(routes)/**/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/**/*.styles.ts': '!([a-z]*[A-Z]*)',
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
    'src/**/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/**/*.styles.ts': '!([a-z]*[A-Z]*)',
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
    'src/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/!(pages)/**/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/**/*.styles.ts': '!([a-z]*[A-Z]*)',
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
    'src/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/!(components)/**/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/**/*.styles.ts': '!([a-z]*[A-Z]*)',
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
    'src/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/!(app)/**/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/**/*.styles.ts': '!([a-z]*[A-Z]*)',
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
    'src/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/!(pages)/**/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/**/*.styles.ts': '!([a-z]*[A-Z]*)',
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
    'src/**/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/**/*.styles.ts': '!([a-z]*[A-Z]*)',
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
    'src/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/!(pages)/**/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/**/*.styles.ts': '!([a-z]*[A-Z]*)',
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
    'src/**/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/**/*.styles.ts': '!([a-z]*[A-Z]*)',
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
    'src/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/!(pages)/**/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/**/*.styles.ts': '!([a-z]*[A-Z]*)',
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
    'src/**/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/**/*.styles.ts': '!([a-z]*[A-Z]*)',
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
    'src/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/!(pages)/**/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/**/*.styles.ts': '!([a-z]*[A-Z]*)',
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
    'src/**/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
    'src/**/*.styles.ts': '!([a-z]*[A-Z]*)',
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

describe('objectLiteral', () => {
  it('leaves identifier keys bare', () => {
    const literal = objectLiteral([['entryPoint', './a.css']], 0);

    expect(literal).toBe("{\n  entryPoint: './a.css',\n}");
  });

  it('quotes every key once one is not an identifier', () => {
    const literal = objectLiteral([['entryPoint', 'a'], ['src/**', 'b']], 0);

    expect(literal).toBe("{\n  'entryPoint': 'a',\n  'src/**': 'b',\n}");
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
    ['next', []],
    ['vue', []],
    ['nuxt', []],
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

  it('ignores the vendored plugin on every target and hosted framework', () => {
    const missing = everyTarget()
      .filter(([, answers]) => {
        return !ignoresOf(answers).includes('plugins/linteljs/**');
      })
      .map(([label]) => {
        return label;
      });

    expect(missing).toEqual([]);
  });
});

describe('the router', () => {
  it('composes the tanstack-router layer', () => {
    const config = emitEslintConfig(answersFor({
      target: 'react',
      router: 'tanstack-router',
    }));

    expect(config).toContain("router: 'tanstack-router',");
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
  it('writes the emitted text to eslint.config.ts at the lint stage', () => {
    const artifacts = eslintConfigEmitter(answersFor({}));
    const text = emitEslintConfig(answersFor({}));
    const expected = [{
      stage: 'lint',
      target: 'eslint.config.ts',
      content: { text },
    }];
    expect(artifacts).toEqual(expected);
  });
});
