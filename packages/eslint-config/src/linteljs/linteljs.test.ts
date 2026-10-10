import {
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  enabledRuleIdsFor,
  frameworkRuleIdsFor,
  messagesForFile,
  NEXT_PROJECT,
  ruleIdsFor,
  ruleIdsForFile,
} from '@mocks/lintText';
import { Linter } from 'eslint';
import {
  describe,
  expect,
  expectTypeOf,
  it,
  onTestFinished,
  vi,
} from 'vitest';

import angular from '../frameworks/angular/angularFramework';
import next from '../frameworks/next/nextFramework';
import react from '../frameworks/react/reactFramework';
import reactNative from '../frameworks/react-native/reactNativeFramework';
import solid from '../frameworks/solid/solidFramework';
import svelte from '../frameworks/svelte/svelteFramework';
import vue from '../frameworks/vue/vueFramework';
import base from '../layers/base/baseLayer';
import html from '../layers/html/htmlLayer';
import typescript from '../layers/typescript/typescriptLayer';
import vitest from '../layers/vitest/vitestLayer';
import tanstackQuery from '../libraries/tanstack-query/tanstackQueryLibrary';

import { linteljs } from './linteljs';

import type {
  Framework,
  Layer,
  LinteljsOptions,
  Rules,
} from '../types';

const SFC_FIXTURES = join(import.meta.dirname, '../../__mocks__/fixtures/sfc');

const TYPED_FILE = join(import.meta.dirname, '../../__mocks__/fixtures/typed/floating.ts');

const sortedFor = (specifier: string): string => {
  const lines = [
    `import framework from '${specifier}';`,
    '',
    "import { z } from 'zod';",
    '',
    'export const value = [framework, z];',
    '',
  ];
  return lines.join('\n');
};

const only = (framework: Framework): LinteljsOptions => {
  const options: LinteljsOptions = { framework };

  return options;
};

const FRAMEWORK_PACKAGES: [Framework, string][] = [
  ['react', 'react'],
  ['next', 'next'],
  ['expo', 'react'],
  ['vue', 'vue'],
  ['nuxt', 'nuxt'],
  ['svelte', 'svelte'],
  ['sveltekit', 'svelte'],
  ['solid', 'solid-js'],
  ['angular', '@angular/core'],
  ['analog', '@angular/core'],
];

// Each framework, and the one whose UI rules it brings unchanged.
const SAME_RULES: [Framework, Framework][] = [
  ['sveltekit', 'svelte'],
  ['analog', 'angular'],
];

// A framework and a layer, each loaded through its own door.
const MISSING_PEERS: [string, LinteljsOptions, string, string, string][] = [
  [
    'solid',
    { framework: 'solid' },
    '../frameworks/solid/solidFramework',
    'eslint-plugin-solid',
    'framework: "solid"',
  ],
  [
    'storybook',
    { stories: 'storybook' },
    '../layers/storybook/storybookLayer',
    'eslint-plugin-storybook',
    'stories: "storybook"',
  ],
];

describe('a missing peer', () => {
  it.each(MISSING_PEERS)('names the command that installs the %s peer', async (key, options, path, peer, label) => {
    vi.doMock(path, () => {
      const missing = (): never => {
        throw new Error(`Cannot find package '${peer}' imported from /project`);
      };

      const mocked = {
        [key]: missing,
        [`${key}Group`]: [],
      };

      return mocked;
    });

    vi.stubEnv('npm_config_user_agent', 'pnpm/12.9.0');

    onTestFinished(() => {
      vi.doUnmock(path);
      vi.unstubAllEnvs();
    });

    const loading = linteljs(options);

    await expect(loading).rejects.toThrow(`${label} needs ${peer}. Install it with: pnpm add -D ${peer}`);
  });
});

const SORT_RULE = 'simple-import-sort/imports';

// The SFC cases run first, one extension after another: each switch of `extraFileExtensions` reloads
// every open project, and the .ts cases further down open this package's.
const SFC_ORDER: [string, () => Layer, string, string][] = [
  [
    'vue',
    vue,
    'Home.vue',
    'vue/',
  ],
  [
    'svelte',
    svelte,
    'Page.svelte',
    'svelte/',
  ],
];

const fatalsIn = (messages: Linter.LintMessage[]): string[] => {
  return messages
    .filter((message) => {
      return message.fatal === true;
    })
    .map((message) => {
      return message.message;
    });
};

const reportsFrom = (messages: Linter.LintMessage[], prefix: string): (string | null)[] => {
  return messages
    .map((message) => {
      return message.ruleId;
    })
    .filter((ruleId) => {
      return ruleId?.startsWith(prefix) ?? false;
    });
};

describe('layer order', () => {
  it.each(SFC_ORDER)(
    '%s after typescript parses a component; before it, the component does not parse at all',
    async (_name, layer, fixture, prefix) => {
      const file = join(SFC_FIXTURES, fixture);

      const config = [
        ...base(),
        ...typescript(),
        ...layer(),
      ];
      const correct = await messagesForFile(config, file);
      const misordered = [
        ...base(),
        ...layer(),
        ...typescript(),
      ];
      const wrong = await messagesForFile(misordered, file);

      const fatals = fatalsIn(correct);
      expect(fatals).toEqual([]);
      expect(reportsFrom(correct, prefix).length).toBeGreaterThan(0);

      const wrongFatals = fatalsIn(wrong);
      expect(wrongFatals).toHaveLength(1);
      expect(fatalsIn(wrong)[0]).toMatch(/^Parsing error: /);
      const reports = reportsFrom(wrong, prefix);
      expect(reports).toEqual([]);
    },
  );
});

describe('linteljs', () => {
  it.each([
    [
      'svelte',
      'Page.svelte',
      'svelte/',
    ],
    [
      'vue',
      'Home.vue',
      'vue/',
    ],
  ])('orders %s after typescript, so its component still parses', async (framework, fixture, prefix) => {
    const config = await linteljs({
      ...only(framework === 'vue' ? 'vue' : 'svelte'),
      typescript: true,
    });
    const messages = await messagesForFile(config, join(SFC_FIXTURES, fixture));

    const fatal = messages
      .filter((message) => {
        return message.fatal === true;
      });

    expect(fatal).toEqual([]);

    const reported = messages
      .some((message) => {
        return message.ruleId?.startsWith(prefix) ?? false;
      });

    expect(reported).toBe(true);
  });

  it('returns base alone with typescript turned off, for a JavaScript project', async () => {
    const baseOnly = await linteljs({ typescript: false });

    const ruleIds = await ruleIdsFor(baseOnly, 'export const value = "x";\n', 'src/lib/utils/sample.ts');
    expect(ruleIds).toContain('@stylistic/quotes');

    const actual = await ruleIdsForFile(baseOnly, TYPED_FILE);
    expect(actual).not.toContain('@typescript-eslint/no-floating-promises');
  });

  it('composes the type-aware layer unless typescript is false', async () => {
    const config = await linteljs();
    const ruleIds = await ruleIdsForFile(config, TYPED_FILE);

    expect(ruleIds).toContain('@typescript-eslint/no-floating-promises');
  });

  it('composes a target with no framework from typescript and vitest, with no framework rule', async () => {
    const config = await linteljs({
      typescript: true,
      testing: 'vitest',
    });

    const typed = await ruleIdsForFile(config, TYPED_FILE);
    expect(typed).toContain('@typescript-eslint/no-floating-promises');
    const enabled = await enabledRuleIdsFor(config, 'src/model/greeting/greetingModel.test.ts');
    expect(enabled).toContain('vitest/no-focused-tests');
    const leaked = await frameworkRuleIdsFor(config, 'src/model/greeting/greetingModel.test.ts');
    expect(leaked).toStrictEqual([]);
  });

  it.each(FRAMEWORK_PACKAGES)('gives base the sort bucket %s owns', async (framework, specifier) => {
    const code = sortedFor(specifier);

    const composed = await linteljs({ ...only(framework), typescript: false });
    const config = [...composed, ...NEXT_PROJECT];
    const own = await ruleIdsFor(config, code, 'src/app/entry.ts');
    const defaults = await linteljs({ typescript: false });
    const none = await ruleIdsFor(defaults, code, 'src/app/entry.ts');

    expect(own).not.toContain(SORT_RULE);
    expect(none).toContain(SORT_RULE);
  });

  it('puts react underneath next rather than beside it', async () => {
    const lines = [
      "import { useEffect } from 'react';",
      '',
      'export const Page = ({ a, b }) => {',
      '  useEffect(() => {',
      '    console.warn(a, b);',
      '  }, [b, a]);',
      '',
      '  return <img src="/a.png" alt="a" />;',
      '};',
      '',
    ];
    const code = lines.join('\n');

    const config = await linteljs({ framework: 'next', typescript: false });
    const ruleIds = await ruleIdsFor(config, code, 'src/app/page.tsx');

    expect(ruleIds).toContain('@next/next/no-img-element');
    expect(ruleIds).toContain('@linteljs/sort-hook-dependencies');
  });

  it('composes react-native as react without the accessibility preset', async () => {
    const code = 'export const Logo = () => {\n  return <img src="/a.png" src="/b.png" />;\n};\n';
    const nativeConfig = await linteljs({ framework: 'expo', typescript: false });
    const native = await ruleIdsFor(nativeConfig, code, 'src/Logo.tsx');
    const webConfig = await linteljs({ framework: 'react', typescript: false });
    const web = await ruleIdsFor(webConfig, code, 'src/Logo.tsx');

    expect(web).toContain('jsx-a11y-x/alt-text');
    expect(native).not.toContain('jsx-a11y-x/alt-text');
    const nativeScript = await ruleIdsFor(nativeConfig, code, 'src/Logo.jsx');
    expect(nativeScript).toContain('@linteljs/no-duplicate-jsx-props');
  });

  it('composes the library layers on top of the framework', async () => {
    const lines = [
      "import { useQuery } from '@tanstack/react-query';",
      '',
      'export const useThing = (id) => {',
      "  return useQuery({ queryKey: ['thing'], queryFn: () => fetch(`/thing/${id}`) });",
      '};',
      '',
    ];
    const code = lines.join('\n');

    const config = await linteljs({
      typescript: false,
      framework: 'react',
      data: 'tanstack-query',
    });

    const ruleIds = await ruleIdsFor(config, code, 'src/lib/hooks/useThing.ts');
    expect(ruleIds).toContain('@tanstack/query/exhaustive-deps');
  });

  it('composes the tanstack-router layer through the same door', async () => {
    const lines = [
      "import { createFileRoute } from '@tanstack/react-router';",
      '',
      "export const Route = createFileRoute('/')({",
      '  loader: () => 1,',
      '  beforeLoad: () => 1,',
      '});',
      '',
    ];
    const code = lines.join('\n');
    const config = await linteljs({
      typescript: false,
      framework: 'react',
      router: 'tanstack-router',
    });

    const ruleIds = await ruleIdsFor(config, code, 'src/routes/index.tsx');
    expect(ruleIds).toContain('@tanstack/router/create-route-property-order');
  });

  it('composes the tailwind layer through the same door', async () => {
    const code = 'export const Card = () => {\n  return <div className="p-2 p-2">x</div>;\n};\n';
    const config = await linteljs({
      typescript: false,
      framework: 'react',
      styling: 'tailwind',
    });
    const pinned = [...config, {
      settings: { 'better-tailwindcss': { cwd: join(import.meta.dirname, '../..') } },
    }];

    const ruleIds = await ruleIdsFor(pinned, code, 'src/components/Card.tsx');
    expect(ruleIds).toContain('better-tailwindcss/no-duplicate-classes');
  });

  it('hands the alias options to the typescript layer', async () => {
    const config = await linteljs({
      typescript: true,
      aliasExempt: ['src/routes.ts'],
      enforceRelativeImports: true,
    });
    const block = config
      .find(({ name }) => {
        return name === 'linteljs/typescript/prefer-alias';
      });

    const expected = {
      '@linteljs/prefer-alias': ['error', {
        aliasExempt: ['src/routes.ts'],
        enforceRelativeImports: true,
      }],
    };
    expect(block?.rules).toEqual(expected);
  });

  it('hands the tailwind entry point to the tailwind layer', async () => {
    const config = await linteljs({
      styling: 'tailwind',
      tailwind: { entryPoint: './src/app/globals.css' },
    });
    const block = config
      .find(({ name }) => {
        return name === 'linteljs/tailwind/rules';
      });

    const expected = { 'better-tailwindcss': { entryPoint: './src/app/globals.css' } };
    expect(block?.settings).toEqual(expected);
  });

  it('composes the stylex layer through the same door', async () => {
    const lines = [
      "import * as stylex from '@stylexjs/stylex';",
      '',
      "const sheet = stylex.create({ card: { background: 'var(--card)' } });",
      '',
      'export const styles = { card: stylex.props(sheet.card) };',
      '',
    ];
    const code = lines.join('\n');
    const config = await linteljs({
      typescript: false,
      framework: 'react',
      styling: 'stylex',
    });

    const ruleIds = await ruleIdsFor(config, code, 'src/components/card/styles.ts');
    expect(ruleIds).toContain('@stylexjs/valid-styles');
  });

  it('puts vue underneath nuxt rather than beside it', async () => {
    const config = await linteljs({ framework: 'nuxt', typescript: false });

    const enabledRuleIds = await enabledRuleIdsFor(config, 'src/components/badge.vue');
    expect(enabledRuleIds).toContain('vue/multi-word-component-names');

    const configEnabledRuleIds = await enabledRuleIdsFor(config, 'src/pages/about.vue');
    expect(configEnabledRuleIds).not.toContain('vue/multi-word-component-names');
  });

  it('composes the vitest layer on request and not otherwise', async () => {
    const code = "import { it } from 'vitest';\n\nit.only('runs', () => {\n  expect(1).toBe(1);\n});\n";
    const path = 'src/lib/utils/sample.test.ts';

    const vitestConfig = await linteljs({ testing: 'vitest', typescript: false });
    const vitestRuleIds = await ruleIdsFor(vitestConfig, code, path);
    expect(vitestRuleIds).toContain('vitest/no-focused-tests');

    const plainConfig = await linteljs({ typescript: false });
    const plainRuleIds = await ruleIdsFor(plainConfig, code, path);
    expect(plainRuleIds).not.toContain('vitest/no-focused-tests');
  });

  it('composes the jest layer on request and not otherwise', async () => {
    const code = "it.only('runs', () => {\n  expect(1).toBe(1);\n});\n";
    const path = 'src/lib/utils/sample.test.ts';
    // The plugin reads the installed Jest's major, and this workspace installs none.
    const jestVersion = { settings: { jest: { version: 29 } } };

    const jestConfig = await linteljs({ testing: 'jest', typescript: false });
    const jestRuleIds = await ruleIdsFor([...jestConfig, jestVersion], code, path);
    expect(jestRuleIds).toContain('jest/no-focused-tests');

    const plainConfig = await linteljs({ typescript: false });
    const plainRuleIds = await ruleIdsFor(plainConfig, code, path);
    expect(plainRuleIds).not.toContain('jest/no-focused-tests');
  });

  it('composes the playwright layer on request and not otherwise', async () => {
    const code = "test.only('opens', async () => {\n  await Promise.resolve();\n});\n";
    const path = 'src/flows/checkout/checkout.e2e.ts';

    const playwrightConfig = await linteljs({ e2e: 'playwright', typescript: false });
    const playwrightRuleIds = await ruleIdsFor(playwrightConfig, code, path);
    expect(playwrightRuleIds).toContain('playwright/no-focused-test');

    const plainConfig = await linteljs({ typescript: false });
    const plainRuleIds = await ruleIdsFor(plainConfig, code, path);
    expect(plainRuleIds).not.toContain('playwright/no-focused-test');
  });

  it('composes the storybook layer on request and not otherwise', async () => {
    const code = 'export const Primary = {};\n';
    const path = 'src/components/button/Button.stories.ts';

    const storybookConfig = await linteljs({ stories: 'storybook', typescript: false });
    const storybookRuleIds = await ruleIdsFor(storybookConfig, code, path);
    expect(storybookRuleIds).toContain('storybook/default-exports');

    const plainConfig = await linteljs({ typescript: false });
    const plainRuleIds = await ruleIdsFor(plainConfig, code, path);
    expect(plainRuleIds).not.toContain('storybook/default-exports');
  });

  it('composes the html layer on request and not otherwise', async () => {
    const code = '<!doctype html>\n<html lang="en">\n  <body><img src="a.png"></body>\n</html>\n';

    const htmlConfig = await linteljs({
      html: true,
      typescript: true,
    });
    const ruleIds = ruleIdsFor(htmlConfig, code, 'index.html');

    await expect(ruleIds).resolves.toContain('@html-eslint/require-img-alt');

    const typescriptConfig = await linteljs({ typescript: true });
    const typescriptRuleIds = await ruleIdsFor(typescriptConfig, code, 'index.html');
    expect(typescriptRuleIds).not.toContain('@html-eslint/require-img-alt');
  });

  it('composes the astro layer on request and not otherwise', async () => {
    const page = "---\nconst title = 'Home';\n---\n\n<img src='/a.png' />\n";

    const astroConfig = await linteljs({
      framework: 'astro',
      typescript: true,
    });
    const ruleIds = ruleIdsFor(astroConfig, page, 'src/pages/index.astro');

    await expect(ruleIds).resolves.toContain('astro/jsx-a11y/alt-text');

    const typescriptConfig = await linteljs({ typescript: true });
    const typescriptRuleIds = await ruleIdsFor(typescriptConfig, page, 'src/pages/index.astro');
    expect(typescriptRuleIds).not.toContain('astro/jsx-a11y/alt-text');
  });

  it('widens base to the frontmatter when astro is asked for', async () => {
    const page = '---\nfunction title() {\n  return 1;\n}\n---\n\n<h1>{title()}</h1>\n';
    const config = await linteljs({
      framework: 'astro',
      typescript: true,
    });
    const ruleIds = await ruleIdsFor(config, page, 'src/pages/index.astro');

    expect(ruleIds).toContain('func-style');
  });

  it('composes the astro layer beside a hosted framework rather than instead of one', async () => {
    const config = await linteljs({
      framework: 'astro',
      islands: ['solid'],
      typescript: true,
    });
    const rules = config
      .flatMap((entry) => {
        return Object.keys(entry.rules ?? {});
      });

    const hasAstro = rules
      .some((rule) => {
        return rule.startsWith('astro/');
      });

    expect(hasAstro).toBe(true);

    const hasSolid = rules
      .some((rule) => {
        return rule.startsWith('solid/');
      });

    expect(hasSolid).toBe(true);
  });

  it('composes the one island wxt hosts and its ignores, and no framework without one', async () => {
    const wxtIgnores = {
      name: 'linteljs/wxt/ignores',
      ignores: ['.output/**', '.wxt/**'],
    };
    const hosted = await linteljs({
      framework: 'wxt',
      islands: ['solid'],
      typescript: false,
    });
    const solidAlone = await linteljs({ framework: 'solid', typescript: false });
    expect(hosted).toEqual([...solidAlone, wxtIgnores]);

    const bare = await linteljs({ framework: 'wxt', typescript: false });
    const plain = await linteljs({ typescript: false });
    expect(bare).toEqual([...plain, wxtIgnores]);
  });

  it('checks its options before it loads anything', async () => {
    const loading = linteljs({ framework: 'next', islands: ['react'] });

    await expect(loading).rejects.toThrow("islands needs framework 'astro' or 'wxt'");
  });

  it('passes the base options through under the names base already uses', async () => {
    const config = await linteljs({
      typescript: false,
      framework: 'react',
      ignores: ['generated/**'],
      naming: {
        'src/**/*.ts': 'CAMEL_CASE',
        'generated/**/*.ts': 'CAMEL_CASE',
      },
    });

    const ruleIds = await ruleIdsFor(config, 'export const value = 1;\n', 'src/lib/utils/Bad-Name.ts');
    expect(ruleIds).toContain('check-file/filename-naming-convention');

    const ignored = await ruleIdsFor(config, 'export const value = 1;\n', 'generated/Bad-Name.ts');

    const filtered = ignored.filter(Boolean);
    expect(filtered).toEqual([]);
  });

  it('passes the tsconfig option through to base', async () => {
    const prefix = join(tmpdir(), 'linteljs-tsconfig-');
    const root = await mkdtemp(prefix);
    const paths = { compilerOptions: { paths: { '@widgets/*': ['./src/widgets/*'] } } };
    await writeFile(join(root, 'tsconfig.app.json'), JSON.stringify(paths));
    const config = await linteljs({
      typescript: false,
      root,
      tsconfig: 'tsconfig.app.json',
    });
    const code = "import { b } from 'zod';\n\nimport { a } from '@widgets/card';\n\nexport const value = [a, b];\n";

    const ruleIds = await ruleIdsFor(config, code, 'src/lib/sample.ts');
    await rm(root, { recursive: true, force: true });
    expect(ruleIds).not.toContain(SORT_RULE);
  });

  it.each(SAME_RULES)('composes %s as %s', async (framework, same) => {
    const composed = await linteljs({ ...only(framework), typescript: false });
    const expected = await linteljs({ ...only(same), typescript: false });

    expect(composed).toEqual(expected);
  });

  it('gives base the sort bucket of every framework asked for', async () => {
    const config = await linteljs({
      typescript: false,
      framework: 'astro',
      islands: ['react', 'vue'],
    });

    const reactRuleIds = await ruleIdsFor(config, sortedFor('react'), 'src/app/entry.ts');
    expect(reactRuleIds).not.toContain(SORT_RULE);
    const vueRuleIds = await ruleIdsFor(config, sortedFor('vue'), 'src/app/entry.ts');
    expect(vueRuleIds).not.toContain(SORT_RULE);
  });

  it('appends the configs it is handed after its own', async () => {
    const code = 'export const value = "x";\n';
    const own = await linteljs({ typescript: false });
    const ownRuleIds = await ruleIdsFor(own, code, 'src/lib/utils/sample.ts');
    expect(ownRuleIds).toContain('@stylistic/quotes');

    const extended = await linteljs({ typescript: false }, { rules: { '@stylistic/quotes': 'off' } });
    const extendedRuleIds = await ruleIdsFor(extended, code, 'src/lib/utils/sample.ts');
    expect(extendedRuleIds).not.toContain('@stylistic/quotes');
  });

  it('types the rules of the configs it is handed from each rule schema', () => {
    type Extra = Parameters<typeof linteljs>[1];
    type Quotes = NonNullable<NonNullable<Extra['rules']>['@stylistic/quotes']>;

    expectTypeOf<['error', 'single']>().toExtend<Quotes>();
    expectTypeOf<['error', 'backtick-ish']>().not.toExtend<Quotes>();
    interface NumericAllow {
      allow: number;
    }
    interface TextSingleline {
      singleline: string;
    }

    expectTypeOf<['error', NumericAllow]>().not.toExtend<NonNullable<Rules['no-console']>>();
    expectTypeOf<['error', TextSingleline]>().not.toExtend<NonNullable<Rules['vue/max-attributes-per-line']>>();
  });
});

const namesUnderTwoIds = (ruleIds: string[]): string[] => {
  const idsByName = Map.groupBy(ruleIds, (ruleId) => {
    return ruleId.slice(ruleId.lastIndexOf('/') + 1);
  });

  const idGroups = [...idsByName.values()];
  return idGroups
    .filter((ids) => {
      return ids.length > 1;
    })
    .map((ids) => {
      return ids
        .toSorted((left, right) => {
          return left.localeCompare(right);
        })
        .join(' + ');
    });
};

const LOOKALIKES = [
  '@tanstack/query/exhaustive-deps + react-hooks/exhaustive-deps',
  'unused-imports/no-unused-vars + vue/no-unused-vars',
  '@stylistic/no-multi-spaces + vue/no-multi-spaces',
  'simple-import-sort/imports + solid/imports',
];

const WIDEST: Omit<LinteljsOptions, 'framework' | 'islands'> = {
  typescript: true,
  testing: 'vitest',
  html: true,
  data: 'tanstack-query',
  router: 'tanstack-router',
  styling: 'tailwind',
};

const DUPLICATE_CASES: [string, LinteljsOptions, string][] = [
  [
    'no framework',
    {},
    'src/lib/utils/sample.ts',
  ],
  [
    'a test file',
    {},
    'src/lib/utils/sample.test.ts',
  ],
  [
    'react',
    { framework: 'react' },
    'src/components/ui/Widget.tsx',
  ],
  [
    'next',
    { framework: 'next' },
    'src/app/page.tsx',
  ],
  [
    'expo',
    { framework: 'expo' },
    'src/components/ui/Widget.tsx',
  ],
  [
    'vue',
    { framework: 'vue' },
    'src/components/ui/Card.vue',
  ],
  [
    'nuxt',
    { framework: 'nuxt' },
    'src/components/ui/Card.vue',
  ],
  [
    'svelte',
    { framework: 'svelte' },
    'src/components/ui/Card.svelte',
  ],
  [
    'sveltekit',
    { framework: 'sveltekit' },
    'src/components/ui/Card.svelte',
  ],
  [
    'solid',
    { framework: 'solid' },
    'src/components/ui/Widget.tsx',
  ],
  [
    'angular',
    { framework: 'angular' },
    'src/app/app.component.ts',
  ],
  [
    'stylex',
    {
      framework: 'react',
      styling: 'stylex',
    },
    'src/components/ui/Widget.tsx',
  ],
  [
    'astro with every island',
    {
      framework: 'astro',
      islands: [
        'react',
        'vue',
        'solid',
        'svelte',
        'angular',
      ],
    },
    'src/components/ui/Widget.tsx',
  ],
];

describe('one owner per rule name', () => {
  it.each(DUPLICATE_CASES)('enables no rule name under two ids: %s', async (_label, framework, filePath) => {
    const config = await linteljs({
      ...WIDEST,
      ...framework,
    });

    const enabled = await enabledRuleIdsFor(config, filePath);
    const duplicated = namesUnderTwoIds(enabled)
      .filter((pair) => {
        return !LOOKALIKES.includes(pair);
      });

    expect(duplicated).toEqual([]);
  });
});

const composes = (config: Layer): void => {
  new Linter().verify('const value = 1;\n', config, 'src/lib/utils/sample.ts');
};

const LAYERS: [string, () => Layer][] = [
  ['react', react],
  ['react-native', reactNative],
  ['vue', vue],
  ['svelte', svelte],
  ['solid', solid],
  ['angular', angular],
];

describe('composition', () => {
  it.each(LAYERS)('composes base + typescript + %s', (_name, layer) => {
    expect(() => {
      const config = [
        ...base(),
        ...typescript(),
        ...layer(),
      ];
      composes(config);
    }).not.toThrow();
  });

  it('composes next on top of react, in that order', () => {
    expect(() => {
      const config = [
        ...base(),
        ...typescript(),
        ...react(),
        ...next(),
      ];
      composes(config);
    }).not.toThrow();
  });

  it('composes the library and file-type layers alongside a framework', () => {
    expect(() => {
      const config = [
        ...base(),
        ...typescript(),
        ...react(),
        ...tanstackQuery(),
        ...vitest(),
        ...html(),
      ];
      composes(config);
    }).not.toThrow();
  });

  it('composes every framework layer at once, which is what proves the plugin identities are shared', () => {
    const everything = LAYERS
      .flatMap(([, layer]) => {
        return layer();
      });

    expect(() => {
      const config = [
        ...base(),
        ...typescript(),
        ...everything,
        ...next(),
        ...tanstackQuery(),
        ...vitest(),
        ...html(),
      ];
      composes(config);
    }).not.toThrow();
  });
});
