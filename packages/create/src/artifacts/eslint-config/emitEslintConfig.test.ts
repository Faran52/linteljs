import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  DEFAULT_ANSWERS,
  type Library,
  type Router,
  TARGET_IDS,
  type TargetId,
  type Testing,
} from '../../model/answers/answers';
import { FOLDER_ROUTED } from '../../model/naming/naming';

import { emitEslintConfig } from './emitEslintConfig';

interface AnswerOverrides {
  target?: TargetId;
  testing?: Testing;
  libraries?: Library[];
  router?: Router;
}

const answersFor = (overrides: AnswerOverrides): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
};

/**
 * Character for character: both READMEs quote it. An ordinary literal, not `String.raw`, since the emitted file now
 * carries a `String.raw` of its own and a raw fixture cannot hold the backticks that tag needs.
 */
const CANONICAL_REACT = `import { defineConfig } from '@linteljs/eslint-config/define-config';

const config = await defineConfig({
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
    expect(output).toContain("import { defineConfig } from '@linteljs/eslint-config/define-config';");
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
    expect(emitEslintConfig(answersFor({ libraries: ['tanstack-query'] })))
      .toContain("libraries: ['tanstack-query'],");
    expect(emitEslintConfig(answersFor({ libraries: ['tailwind'] })))
      .toContain("libraries: ['tailwind'],");
    expect(emitEslintConfig(answersFor({ libraries: ['tailwind', 'tanstack-query'] })))
      .toContain("libraries: ['tanstack-query', 'tailwind'],");
    expect(emitEslintConfig(answersFor({ libraries: ['zod'] }))).not.toContain('libraries:');
  });

  // The scaffolder's own path lets the plugin read the project's theme rather than Tailwind's defaults.
  it.each<[TargetId, string]>([
    ['react', './src/index.css'],
    ['next', './src/app/globals.css'],
    ['vue', './src/assets/main.css'],
    ['solid', './src/index.css'],
    ['angular', './src/styles.css'],
    ['webextension', './src/style.css'],
    ['react-native', './src/global.css'],
    // `sv create --template minimal` ships no stylesheet.
    ['svelte', './src/app.css'],
  ])('names %s tailwind entry point as its stylesheet', (target, entry) => {
    expect(emitEslintConfig(answersFor({
      target,
      libraries: ['tailwind'],
    })))
      .toContain(`tailwindEntryPoint: '${entry}',`);
  });

  // Recorded rather than asked, so needing it costs a line rather than an override block.
  it('emits the resolver conditions a project recorded', () => {
    const output = emitEslintConfig({
      ...answersFor({}),
      resolveConditions: ['import', 'require', 'node', 'default'],
    });

    expect(output).toContain("resolver: { conditionNames: ['import', 'require', 'node', 'default'] },");
  });

  it('emits no resolver at all where none was recorded', () => {
    expect(emitEslintConfig(answersFor({}))).not.toContain('resolver');
  });

  it('names no tailwind entry point when tailwind was not selected', () => {
    expect(emitEslintConfig(answersFor({ libraries: ['tanstack-query'] }))).not.toContain('tailwindEntryPoint');
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

  it('turns the typescript layer on for every target', () => {
    for (const target of TARGET_IDS) {
      expect(emitEslintConfig(answersFor({ target }))).toContain('typescript: true,');
    }
  });

  // check-file applies every matching key, so App.test.ts beside App.vue could satisfy camelCase and PascalCase both.
  it('excludes tests, specs and declarations from the script convention', () => {
    const vue = emitEslintConfig(answersFor({ target: 'vue' }));

    expect(vue).toContain("'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',");
    expect(vue).toContain("'src/**/*.d.ts':");
  });

  // `+page.server.ts` is the framework's spelling, not camelCase.
  it('exempts a route directory the framework names, and only where there is one', () => {
    expect(emitEslintConfig(answersFor({ target: 'next' })))
      .toContain("'src/!(app)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',");

    expect(emitEslintConfig(answersFor({ target: 'svelte' })))
      .toContain("'src/!(routes)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',");

    expect(emitEslintConfig(answersFor({ target: 'react' })))
      .not.toContain("'src/!(");
  });
});

describe('folderNaming', () => {
  it('asks for kebab-case folders on every target', () => {
    for (const target of TARGET_IDS) {
      expect(emitEslintConfig(answersFor({ target }))).toContain('folderNaming: {');
    }
  });

  // `[slug]` and `(tabs)` are not kebab-case; the React family, Solid and Svelte admit them via a raw glob.
  it('permits a router segment only where a router names one', () => {
    const routed = ['react', 'next', 'solid', 'react-native', 'svelte'] as const;
    const plain = ['vue', 'angular', 'webextension'] as const;

    for (const target of routed) {
      expect(emitEslintConfig(answersFor({ target }))).toContain(String.raw`|__tests__|\[*\]|`);
    }
    for (const target of plain) {
      const emitted = emitEslintConfig(answersFor({ target }));

      expect(emitted).toContain("'src/**/': '@(+([a-z0-9])*(-+([a-z0-9]))|__tests__)'");
      expect(emitted).not.toContain(String.raw`\\[`);
    }
  });

  // `String.raw` carries a backslash verbatim, so the emitted text equals the glob the policy declared.
  it('emits the glob raw, so the file parses back to the pattern it declared', () => {
    const emitted = emitEslintConfig(answersFor({ target: 'react-native' }));
    const tagged = /'src\/\*\*\/': String\.raw`([^`]*)`/.exec(emitted)?.[1];

    expect(tagged).toBe(FOLDER_ROUTED);
  });
});

// Concatenated without deduplication, so a target repeating a shared entry published it twice. Astro and the
// extension both did.
describe('ignores', () => {
  it('never repeats an entry for any target', () => {
    const duplicated = TARGET_IDS.flatMap((target) => {
      const emitted = emitEslintConfig(answersFor({ target }));
      const list = /ignores: (\[[^\]]*\])/s.exec(emitted)?.[1] ?? '[]';
      const entries = [...list.matchAll(/'([^']+)'/g)].map(([, entry]) => {
        return entry ?? '';
      });
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
  it('composes the tanstack-router layer and ignores the generated tree', () => {
    const config = emitEslintConfig(answersFor({
      target: 'react',
      router: 'tanstack-router',
    }));

    expect(config).toContain("'tanstack-router'");
    expect(config).toContain("'src/routeTree.gen.ts'");
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
