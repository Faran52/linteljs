import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  DEFAULT_ANSWERS,
  type Library,
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
}

const answersFor = (overrides: AnswerOverrides): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
};

/**
 * The emitted config, character for character: the README.md of both this package and the workspace quote it, so an
 * edit here is a documentation change too.
 * An ordinary template literal, not `String.raw`: the emitted file now carries a `String.raw` of its own, and a raw
 * fixture cannot hold the backticks that tag needs. So the escapes are spelled here instead, where `\\[` is the
 * literal `\[` the emitter writes and `` \` `` is the backtick it wraps the glob in.
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
    expect(emitEslintConfig(answersFor({ target: 'react' }))).toBe(CANONICAL_REACT);
  });

  // The composer subpath, never the barrel: the barrel pulls in all six framework layers, five unneeded by any one
  // project.
  it('imports the composer from its subpath, once, and nothing else', () => {
    const output = emitEslintConfig(answersFor({ target: 'vue' }));

    expect(output).not.toContain("from '@linteljs/eslint-config'");
    expect(output.match(/^import /gm)).toHaveLength(1);
    expect(output).toContain("import { defineConfig } from '@linteljs/eslint-config/define-config';");
  });

  // `next` names one framework, not two layers in an order: the composer puts react underneath it and reads the
  // ordering off the layer itself.
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

  // The layer imports @vitest/eslint-plugin, which only a project with a suite installs; asked for without one, eslint
  // . dies on ERR_MODULE_NOT_FOUND.
  it('asks for the vitest layer only where a suite was chosen', () => {
    expect(emitEslintConfig(answersFor({ testing: 'vitest' }))).toContain('vitest: true');
    expect(emitEslintConfig(answersFor({ testing: 'none' }))).not.toContain('vitest');
  });

  // The emitted file is linted by the config it emits; React Native's eight ignores on one line came to 133 characters
  // and self-reported a finding.
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
    // Emit order is fixed by LIBRARY_LAYERS, not by the order the libraries were picked in.
    expect(emitEslintConfig(answersFor({ libraries: ['tailwind', 'tanstack-query'] })))
      .toContain("libraries: ['tanstack-query', 'tailwind'],");
    expect(emitEslintConfig(answersFor({ libraries: ['zod'] }))).not.toContain('libraries:');
  });

  /**
   * The path is the scaffolder's, verified per target, and it is what lets the plugin read the project's own theme
   * rather than Tailwind's defaults.
   */
  it.each<[TargetId, string]>([
    ['react', './src/index.css'],
    ['next', './src/app/globals.css'],
    ['vue', './src/assets/main.css'],
    ['solid', './src/index.css'],
    ['angular', './src/styles.css'],
    ['webextension', './src/style.css'],
    ['react-native', './src/global.css'],
    // The one path this CLI creates rather than finds: `sv create --template minimal` ships no stylesheet.
    ['svelte', './src/app.css'],
  ])('names %s tailwind entry point as its stylesheet', (target, entry) => {
    expect(emitEslintConfig(answersFor({
      target,
      libraries: ['tailwind'],
    })))
      .toContain(`tailwindEntryPoint: '${entry}',`);
  });

  /**
   * Recorded rather than asked: a dependency publishing subpaths through a wildcard `exports` map is a fact about the
   * project, and this is what keeps needing it from costing an override block.
   */
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

  // Next's list is the one that runs past `max-len`, so this covers the wrapped form as well as the order.
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

  // The published `defineConfig` option is consumer API and still takes a boolean; what this CLI emits is always true.
  it('turns the typescript layer on for every target', () => {
    for (const target of TARGET_IDS) {
      expect(emitEslintConfig(answersFor({ target }))).toContain('typescript: true,');
    }
  });

  // A test/spec mirrors its subject's name and carries no key of its own: check-file applies every matching key, so
  // App.test.ts beside App.vue could satisfy the camelCase rule and the subject's PascalCase both, which is impossible.
  it('excludes tests, specs and declarations from the script convention', () => {
    const vue = emitEslintConfig(answersFor({ target: 'vue' }));

    expect(vue).toContain("'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',");
    expect(vue).toContain("'src/**/*.d.ts':");
  });

  // A router that names routes by filename owns the spelling, so its directory is exempt from the script convention:
  // `+page.server.ts` is the framework's name, not camelCase.
  it('exempts a route directory the framework names, and only where there is one', () => {
    expect(emitEslintConfig(answersFor({ target: 'next' })))
      .toContain("'src/!(app)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',");

    expect(emitEslintConfig(answersFor({ target: 'svelte' })))
      .toContain("'src/!(routes)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',");

    // React has no route directory, so the two-key split never appears.
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

  // A router segment (`[slug]`, `(tabs)`) is not kebab-case, so the React family, Solid and Svelte permit both via a
  // raw glob rather than an exclusion by path.
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

  /**
   * A backslash in an ordinary string literal parses back as an escape, so the glob has to reach the file intact.
   * `String.raw` carries it verbatim, which is why the emitted text equals the pattern rather than a doubled copy of
   * it: read the tagged literal back and it is the glob the policy declared.
   */
  it('emits the glob raw, so the file parses back to the pattern it declared', () => {
    const emitted = emitEslintConfig(answersFor({ target: 'react-native' }));
    const tagged = /'src\/\*\*\/': String\.raw`([^`]*)`/.exec(emitted)?.[1];

    expect(tagged).toBe(FOLDER_ROUTED);
  });
});

/**
 * The emitted list is `BASE_IGNORES` plus the target's own, concatenated without deduplication, so a target repeating
 * a shared entry writes it twice into a published config. Astro and the extension target both did.
 */
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
