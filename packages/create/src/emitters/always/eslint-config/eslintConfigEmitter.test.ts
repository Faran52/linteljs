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

/**
 * Character for character: both READMEs quote it. An ordinary literal, not `String.raw`, since the emitted file
 * carries a `String.raw` of its own and a raw fixture cannot hold the backticks that tag needs.
 */
const CANONICAL_REACT = `import { composeConfig } from '@linteljs/eslint-config/compose-config';

const config = await composeConfig({
  framework: 'react',
  typescript: true,
  vitest: true,
  html: true,
  ignores: ['dist/**', 'coverage/**', '.claude/**', '.agents/**', 'plugins/linteljs/**'],
  aliases: {
    '@components/*': './src/components/*',
    '@ui/*': './src/components/ui/*',
    '@features/*': './src/components/features/*',
    '@lib/*': './src/lib/*',
    '@store/*': './src/lib/store/*',
    '@hooks/*': './src/lib/hooks/*',
    '@utils/*': './src/lib/utils/*',
    '@services/*': './src/lib/services/*',
    '@config/*': './src/config/*',
    '@mocks/*': './__mocks__/*',
  },
  naming: {
    'src/**/*.tsx': '!([a-z]*[A-Z]*)',
    'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
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
    expect(emitEslintConfig(answersFor({
      target: 'react',
      libraries: [],
    }))).toBe(CANONICAL_REACT);
  });

  // The barrel pulls in all six framework layers.
  it('imports the composer from its subpath, once, and nothing else', () => {
    const output = emitEslintConfig(answersFor({ target: 'vue' }));

    expect(output).not.toContain("from '@linteljs/eslint-config'");
    expect(output.match(/^import /gm)).toHaveLength(1);
    expect(output).toContain("import { composeConfig } from '@linteljs/eslint-config/compose-config';");
  });

  // The composer puts react underneath next and reads the order off the layer.
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

  // The layer imports @vitest/eslint-plugin, which only a project with a suite installs.
  it('asks for the vitest layer only where a suite was chosen', () => {
    expect(emitEslintConfig(answersFor({ testing: 'vitest' }))).toContain('vitest: true');
    expect(emitEslintConfig(answersFor({ testing: 'none' }))).not.toContain('vitest');
  });

  // React Native's eight ignores on one line came to 133 characters and self-reported a finding.
  it('keeps every emitted line inside the max-len the emitted config enforces', () => {
    for (const target of TARGET_IDS) {
      const tooLong = emitEslintConfig(answersFor({ target })).split('\n').filter((line) => {
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
    expect(emitEslintConfig(answersFor({
      libraries: [],
      data: 'tanstack-query',
    })))
      .toContain("libraries: ['tanstack-query'],");
    expect(emitEslintConfig(answersFor({
      libraries: [],
      styling: 'tailwind',
    })))
      .toContain("libraries: ['tailwind'],");
    expect(emitEslintConfig(answersFor({
      libraries: [],
      styling: 'tailwind',
      data: 'tanstack-query',
    })))
      .toContain("libraries: ['tanstack-query', 'tailwind'],");
    expect(emitEslintConfig(answersFor({
      libraries: [],
      styling: 'stylex',
    })))
      .toContain("libraries: ['stylex'],");
    expect(emitEslintConfig(answersFor({ libraries: ['zod'] }))).not.toContain('libraries:');
  });

  // Each layer is its one answer value: the other value of the same answer installs a package with no layer behind it.
  it('asks for no layer for the other value of the answer that gates it', () => {
    expect(emitEslintConfig(answersFor({
      libraries: [],
      data: 'rtk-query',
      router: 'react-router',
    }))).not.toContain('libraries:');
  });

  // The scaffolder's own path lets the plugin read the project's theme rather than Tailwind's defaults.
  it.each<[TargetId, string]>([
    ['react', './src/index.css'],
    ['next', './src/app/globals.css'],
    ['vue', './src/styles/main.css'],
    ['solid', './src/index.css'],
    ['angular', './src/styles.css'],
    ['webextension', './src/style.css'],
    ['react-native', './src/global.css'],
    // `sv create --template minimal` ships no stylesheet.
    ['svelte', './src/app.css'],
  ])('names %s tailwind entry point as its stylesheet', (target, entry) => {
    expect(emitEslintConfig(answersFor({
      target,
      libraries: [],
      styling: 'tailwind',
    })))
      .toContain(`tailwindEntryPoint: '${entry}',`);
  });

  // Recorded rather than asked, so needing it costs a line rather than an override block.
  it('emits the resolver conditions a project recorded', () => {
    const output = emitEslintConfig({
      ...answersFor({}),
      resolveConditions: ['import', 'require', 'node', 'default'],
    });

    expect(output).toContain("  resolver: {\n    conditionNames: ['import', 'require', 'node', 'default'],\n  },");
  });

  // 121 characters inline, one past `max-len`, so the list breaks: measured on the line it is written on.
  it('breaks the resolver conditions onto their own lines once they would run past max-len', () => {
    const conditions = ['1', '2', '3', '4', '5'].map((digit) => {
      return `condition-name-${digit}`;
    });
    const output = emitEslintConfig({
      ...answersFor({}),
      resolveConditions: conditions,
    });

    expect(output).toContain([
      '  resolver: {',
      '    conditionNames: [',
      ...conditions.map((condition) => {
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
    expect(emitEslintConfig(answersFor({
      libraries: [],
      data: 'tanstack-query',
    }))).not.toContain('tailwindEntryPoint');
  });

  it('omits the html layer where there is no markup for it to lint', () => {
    // angular-eslint processes templates itself; Next's App Router owns the document.
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

  // Next's list runs past `max-len`, so this covers the wrapped form.
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

  // A list exactly as long as `max-len` allows stays on its line.
  it('keeps a list that is exactly max-len long on one line', () => {
    const line = emitEslintConfig({
      ...answersFor({ target: 'react' }),
      ignores: ['generated/very-long-name/**'],
    }).split('\n').find((candidate) => {
      return candidate.startsWith('  ignores:');
    });

    expect(line).toHaveLength(120);
    expect(line?.endsWith("'generated/very-long-name/**'],")).toBe(true);
  });

  // A project's own ignore is text a user typed, so a quote in it is escaped rather than ending the string.
  it('escapes a quote inside a value', () => {
    expect(emitEslintConfig({
      ...answersFor({}),
      ignores: ["it's/**"],
    })).toContain("'it\\'s/**'");
  });

  // A file type rather than a framework, so the layer is asked for beside the hosted one.
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

/*
 * Every target's naming policy as its config writes it, hosted frameworks included: which file kinds take which case,
 * where a framework's own route spelling is exempt, and which folders a router's `[slug]` and `(group)` may name.
 * Nothing but a badly named file can tell one policy from another, and the starters are named well, so the policy is
 * held here as written.
 */
describe('the naming policy', () => {
  it.each<[string, AnswerOverrides, string]>([
    ['react', { target: 'react' }, `  naming: {
    'src/**/*.tsx': '!([a-z]*[A-Z]*)',
    'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`],
    ['next', { target: 'next' }, `  naming: {
    'src/**/*.tsx': '!([a-z]*[A-Z]*)',
    'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/!(app)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`],
    ['vue', { target: 'vue' }, `  naming: {
    'src/**/*.vue': '!([a-z]*[A-Z]*)',
    'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': '@(+([a-z0-9])*(-+([a-z0-9]))|__tests__)',
  },`],
    ['nuxt', { target: 'nuxt' }, `  naming: {
    'src/**/*.vue': '!([a-z]*[A-Z]*)',
    'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`],
    ['svelte', { target: 'svelte' }, `  naming: {
    'src/**/*.svelte': '!([a-z]*[A-Z]*)',
    'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/!(routes)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`],
    ['solid', { target: 'solid' }, `  naming: {
    'src/**/*.tsx': '!([a-z]*[A-Z]*)',
    'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`],
    ['angular', { target: 'angular' }, `  naming: {
    'src/**/!(*.d).ts': 'KEBAB_CASE',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': '@(+([a-z0-9])*(-+([a-z0-9]))|__tests__)',
  },`],
    ['astro', { target: 'astro' }, `  naming: {
    'src/**/*.astro': '!([a-z]*[A-Z]*)',
    'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/!(pages)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`],
    ['webextension', { target: 'webextension' }, `  naming: {
    'src/components/**/!(*.d|*.test|*.spec).ts': 'PASCAL_CASE',
    'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/!(components)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': '@(+([a-z0-9])*(-+([a-z0-9]))|__tests__)',
  },`],
    ['react-native', { target: 'react-native' }, `  naming: {
    'src/**/*.tsx': '!([a-z]*[A-Z]*)',
    'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/!(app)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`],
    ['astro hosting react', {
      target: 'astro',
      hostedFramework: 'react',
    }, `  naming: {
    'src/**/*.astro': '!([a-z]*[A-Z]*)',
    'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/!(pages)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
    'src/**/*.tsx': '!([a-z]*[A-Z]*)',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`],
    ['webextension hosting react', {
      target: 'webextension',
      hostedFramework: 'react',
    }, `  naming: {
    'src/**/*.tsx': '!([a-z]*[A-Z]*)',
    'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': '@(+([a-z0-9])*(-+([a-z0-9]))|__tests__)',
  },`],
    ['astro hosting vue', {
      target: 'astro',
      hostedFramework: 'vue',
    }, `  naming: {
    'src/**/*.astro': '!([a-z]*[A-Z]*)',
    'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/!(pages)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
    'src/**/*.vue': '!([a-z]*[A-Z]*)',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`],
    ['webextension hosting vue', {
      target: 'webextension',
      hostedFramework: 'vue',
    }, `  naming: {
    'src/**/*.vue': '!([a-z]*[A-Z]*)',
    'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': '@(+([a-z0-9])*(-+([a-z0-9]))|__tests__)',
  },`],
    ['astro hosting svelte', {
      target: 'astro',
      hostedFramework: 'svelte',
    }, `  naming: {
    'src/**/*.astro': '!([a-z]*[A-Z]*)',
    'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/!(pages)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
    'src/**/*.svelte': '!([a-z]*[A-Z]*)',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`],
    ['webextension hosting svelte', {
      target: 'webextension',
      hostedFramework: 'svelte',
    }, `  naming: {
    'src/**/*.svelte': '!([a-z]*[A-Z]*)',
    'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': '@(+([a-z0-9])*(-+([a-z0-9]))|__tests__)',
  },`],
    ['astro hosting solid', {
      target: 'astro',
      hostedFramework: 'solid',
    }, `  naming: {
    'src/**/*.astro': '!([a-z]*[A-Z]*)',
    'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/!(pages)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
    'src/**/*.tsx': '!([a-z]*[A-Z]*)',
  },
  folderNaming: {
    'src/**/': String.raw\`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\\[*\\]|\\(*\\)|{*})\`,
  },`],
    ['webextension hosting solid', {
      target: 'webextension',
      hostedFramework: 'solid',
    }, `  naming: {
    'src/**/*.tsx': '!([a-z]*[A-Z]*)',
    'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
  },
  folderNaming: {
    'src/**/': '@(+([a-z0-9])*(-+([a-z0-9]))|__tests__)',
  },`],
  ])('names files and folders the %s way', (_label, overrides, block) => {
    const config = emitEslintConfig(answersFor(overrides));

    expect(config.slice(config.indexOf('  naming: {'), config.indexOf('\n});'))).toBe(block);
  });
});

describe('folderNaming', () => {
  // `String.raw` carries a backslash verbatim, so the emitted text equals the glob the policy declared.
  it('emits the glob raw, so the file parses back to the pattern it declared', () => {
    const emitted = emitEslintConfig(answersFor({ target: 'react-native' }));
    const tagged = /'src\/\*\*\/': String\.raw`([^`]*)`/.exec(emitted)?.[1];

    expect(tagged).toBe(FOLDER_ROUTED);
  });
});

// A target repeating a shared entry must not publish it twice.
describe('ignores', () => {
  const ignoresOf = (answers: Answers): string[] => {
    const list = /ignores: (\[[^\]]*\])/su.exec(emitEslintConfig(answers))?.[1] ?? '[]';

    return [...list.matchAll(/'([^']+)'/gu)].map(([, entry = '']) => {
      return entry;
    });
  };

  // What each framework generates or owns and nothing of its own should lint: build output, caches, native shells.
  it.each<[TargetId, string[]]>([
    ['react', []],
    ['next', ['.next/**', 'out/**', 'next-env.d.ts']],
    ['vue', []],
    ['nuxt', ['.nuxt/**', '.output/**']],
    ['svelte', ['.svelte-kit/**', 'src/app.html']],
    ['solid', []],
    ['angular', ['.angular/**']],
    ['astro', ['.astro/**']],
    ['webextension', []],
    ['react-native', ['.expo/**', 'android/**', 'ios/**', 'expo-env.d.ts']],
  ])('ignores what %s generates on top of the shared entries', (target, own) => {
    expect(ignoresOf(answersFor({ target })).slice(5)).toEqual(own);
  });

  it('ignores what React Router generates in framework mode', () => {
    expect(ignoresOf(answersFor({
      target: 'react',
      router: 'react-router-framework',
    })).slice(5)).toEqual(['.react-router/**', 'build/**']);
  });

  it('never repeats an entry for any target', () => {
    const duplicated = TARGET_IDS.flatMap((target) => {
      const entries = ignoresOf(answersFor({ target }));
      const seen = entries.filter((entry, index) => {
        return entries.indexOf(entry) !== index;
      });

      return seen.map((entry) => {
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
    // Nothing generated to ignore: the route tree is built from the one route list.
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
