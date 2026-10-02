import { join } from 'node:path';

import {
  enabledRuleIdsFor,
  messagesForFile,
  NEXT_PROJECT,
  ruleIdsFor,
  ruleIdsForFile,
} from '@mocks/lintText';
import { Linter } from 'eslint';
import {
  describe,
  expect,
  it,
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

import { composeConfig } from './composeConfig';

import type {
  ComposeConfigOptions,
  Framework,
  Layer,
} from '../types';

const SFC_FIXTURES = join(import.meta.dirname, '../../__mocks__/fixtures/sfc');

const TYPED_FILE = join(import.meta.dirname, '../../__mocks__/fixtures/typed/floating.ts');

const sortedFor = (specifier: string): string => {
  return [
    `import framework from '${specifier}';`,
    '',
    "import { z } from 'zod';",
    '',
    'export const value = [framework, z];',
    '',
  ].join('\n');
};

const FRAMEWORK_PACKAGES: [Framework, string][] = [
  ['react', 'react'],
  ['next', 'next'],
  ['vue', 'vue'],
  ['nuxt', 'nuxt'],
  ['svelte', 'svelte'],
  ['solid', 'solid-js'],
  ['angular', '@angular/core'],
];

const SORT_RULE = 'simple-import-sort/imports';

describe('composeConfig', () => {
  it('returns base alone when asked for nothing, rather than a default nobody wrote', async () => {
    const baseOnly = await composeConfig();

    const ruleIds = await ruleIdsFor(baseOnly, 'export const value = "x";\n', 'src/lib/utils/sample.ts');
    expect(ruleIds).toContain('@stylistic/quotes');

    const actual = await ruleIdsForFile(baseOnly, TYPED_FILE);
    expect(actual).not.toContain('@typescript-eslint/no-floating-promises');
  });

  it('composes the type-aware layer on request', async () => {
    const ruleIds = await ruleIdsForFile(await composeConfig({ typescript: true }), TYPED_FILE);

    expect(ruleIds).toContain('@typescript-eslint/no-floating-promises');
  });

  it.each(FRAMEWORK_PACKAGES)('gives base the sort bucket %s owns', async (framework, specifier) => {
    const code = sortedFor(specifier);

    const own = await ruleIdsFor([...await composeConfig({ framework }), ...NEXT_PROJECT], code, 'src/app/entry.ts');
    const none = await ruleIdsFor(await composeConfig(), code, 'src/app/entry.ts');

    expect(own).not.toContain(SORT_RULE);
    expect(none).toContain(SORT_RULE);
  });

  it.each([
    [
      'vue',
      'Home.vue',
      'vue/',
    ],
    [
      'svelte',
      'Page.svelte',
      'svelte/',
    ],
  ])('orders %s after typescript, so its component still parses', async (framework, fixture, prefix) => {
    const config = await composeConfig({
      framework: framework === 'vue' ? 'vue' : 'svelte',
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

  it('puts react underneath next rather than beside it', async () => {
    const code = [
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
    ].join('\n');

    const ruleIds = await ruleIdsFor(await composeConfig({ framework: 'next' }), code, 'src/app/page.tsx');

    expect(ruleIds).toContain('@next/next/no-img-element');
    expect(ruleIds).toContain('@linteljs/sort-hook-dependencies');
  });

  it('composes react-native as react without the accessibility preset', async () => {
    const code = 'export const Logo = () => {\n  return <img src="/a.png" src="/b.png" />;\n};\n';
    const native = await ruleIdsFor(await composeConfig({ framework: 'react-native' }), code, 'src/Logo.tsx');
    const web = await ruleIdsFor(await composeConfig({ framework: 'react' }), code, 'src/Logo.tsx');

    expect(web).toContain('jsx-a11y-x/alt-text');
    expect(native).not.toContain('jsx-a11y-x/alt-text');
    expect(native).toContain('@linteljs/no-duplicate-jsx-props');
  });

  it('composes the library layers on top of the framework', async () => {
    const code = [
      "import { useQuery } from '@tanstack/react-query';",
      '',
      'export const useThing = (id) => {',
      "  return useQuery({ queryKey: ['thing'], queryFn: () => fetch(`/thing/${id}`) });",
      '};',
      '',
    ].join('\n');

    const config = await composeConfig({
      framework: 'react',
      libraries: ['tanstack-query'],
    });

    const ruleIds = await ruleIdsFor(config, code, 'src/lib/hooks/useThing.ts');
    expect(ruleIds).toContain('@tanstack/query/exhaustive-deps');
  });

  it('composes the tanstack-router layer through the same door', async () => {
    const code = [
      "import { createFileRoute } from '@tanstack/react-router';",
      '',
      "export const Route = createFileRoute('/')({",
      '  loader: () => 1,',
      '  beforeLoad: () => 1,',
      '});',
      '',
    ].join('\n');
    const config = await composeConfig({
      framework: 'react',
      libraries: ['tanstack-router'],
    });

    const ruleIds = await ruleIdsFor(config, code, 'src/routes/index.tsx');
    expect(ruleIds).toContain('@tanstack/router/create-route-property-order');
  });

  it('composes the tailwind layer through the same door', async () => {
    const code = 'export const Card = () => {\n  return <div className="p-2 p-2">x</div>;\n};\n';
    const config = await composeConfig({
      framework: 'react',
      libraries: ['tailwind'],
    });
    const pinned = [...config, {
      settings: { 'better-tailwindcss': { cwd: join(import.meta.dirname, '../..') } },
    }];

    const ruleIds = await ruleIdsFor(pinned, code, 'src/components/Card.tsx');
    expect(ruleIds).toContain('better-tailwindcss/no-duplicate-classes');
  });

  it('hands the alias options to the typescript layer', async () => {
    const config = await composeConfig({
      typescript: true,
      aliasExempt: ['src/routes.ts'],
      enforceRelativeImports: true,
    });
    const block = config
      .find(({ name }) => {
        return name === '@linteljs/typescript/prefer-alias';
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
    const config = await composeConfig({
      libraries: ['tailwind'],
      tailwindEntryPoint: './src/app/globals.css',
    });
    const block = config
      .find(({ name }) => {
        return name === '@linteljs/tailwind';
      });

    const expected = { 'better-tailwindcss': { entryPoint: './src/app/globals.css' } };
    expect(block?.settings).toEqual(expected);
  });

  it('composes the stylex layer through the same door', async () => {
    const code = [
      "import * as stylex from '@stylexjs/stylex';",
      '',
      "const sheet = stylex.create({ card: { background: 'var(--card)' } });",
      '',
      'export const styles = { card: stylex.props(sheet.card) };',
      '',
    ].join('\n');
    const config = await composeConfig({
      framework: 'react',
      libraries: ['stylex'],
    });

    const ruleIds = await ruleIdsFor(config, code, 'src/components/card/styles.ts');
    expect(ruleIds).toContain('@stylexjs/valid-styles');
  });

  it('puts vue underneath nuxt rather than beside it', async () => {
    const config = await composeConfig({ framework: 'nuxt' });

    const enabledRuleIds = await enabledRuleIdsFor(config, 'src/components/badge.vue');
    expect(enabledRuleIds).toContain('vue/multi-word-component-names');

    const configEnabledRuleIds = await enabledRuleIdsFor(config, 'src/pages/about.vue');
    expect(configEnabledRuleIds).not.toContain('vue/multi-word-component-names');
  });

  it('composes the vitest layer on request and not otherwise', async () => {
    const code = "import { it } from 'vitest';\n\nit.only('runs', () => {\n  expect(1).toBe(1);\n});\n";
    const path = 'src/lib/utils/sample.test.ts';

    const ruleIds = await ruleIdsFor(await composeConfig({ vitest: true }), code, path);
    expect(ruleIds).toContain('vitest/no-focused-tests');

    const ruleIds2 = await ruleIdsFor(await composeConfig(), code, path);
    expect(ruleIds2).not.toContain('vitest/no-focused-tests');
  });

  it('composes the html layer on request and not otherwise', async () => {
    const code = '<!doctype html>\n<html lang="en">\n  <body><img src="a.png"></body>\n</html>\n';

    const ruleIds = ruleIdsFor(await composeConfig({
      html: true,
      typescript: true,
    }), code, 'index.html');

    await expect(ruleIds).resolves.toContain('@html-eslint/require-img-alt');

    const ruleIds2 = await ruleIdsFor(await composeConfig({ typescript: true }), code, 'index.html');
    expect(ruleIds2).not.toContain('@html-eslint/require-img-alt');
  });

  it('composes the astro layer on request and not otherwise', async () => {
    const page = "---\nconst title = 'Home';\n---\n\n<img src='/a.png' />\n";

    const ruleIds = ruleIdsFor(await composeConfig({
      astro: true,
      typescript: true,
    }), page, 'src/pages/index.astro');

    await expect(ruleIds).resolves.toContain('astro/jsx-a11y/alt-text');

    const ruleIds2 = await ruleIdsFor(await composeConfig({ typescript: true }), page, 'src/pages/index.astro');
    expect(ruleIds2).not.toContain('astro/jsx-a11y/alt-text');
  });

  it('widens base to the frontmatter when astro is asked for', async () => {
    const page = '---\nfunction title() {\n  return 1;\n}\n---\n\n<h1>{title()}</h1>\n';
    const config = await composeConfig({
      astro: true,
      typescript: true,
    });
    const ruleIds = await ruleIdsFor(config, page, 'src/pages/index.astro');

    expect(ruleIds).toContain('func-style');
  });

  it('composes the astro layer beside a hosted framework rather than instead of one', async () => {
    const config = await composeConfig({
      astro: true,
      framework: 'solid',
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

  it('passes the base options through under the names base already uses', async () => {
    const config = await composeConfig({
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
});

const namesUnderTwoIds = (ruleIds: string[]): string[] => {
  const idsByName = new Map<string, string[]>();

  for (const ruleId of ruleIds) {
    const name = ruleId.slice(ruleId.lastIndexOf('/') + 1);

    idsByName.set(name, [...idsByName.get(name) ?? [], ruleId]);
  }

  return [...idsByName.values()]
    .filter((ids) => {
      return ids.length > 1;
    })
    .map((ids) => {
      return [...ids]
        .sort((left, right) => {
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

const WIDEST: ComposeConfigOptions = {
  typescript: true,
  vitest: true,
  html: true,
  astro: true,
  libraries: [
    'tanstack-query',
    'tanstack-router',
    'tailwind',
    'stylex',
  ],
};

const DUPLICATE_CASES: [string, Framework | undefined, string][] = [
  [
    'no framework',
    undefined,
    'src/lib/utils/sample.ts',
  ],
  [
    'a test file',
    undefined,
    'src/lib/utils/sample.test.ts',
  ],
  [
    'react',
    'react',
    'src/components/ui/Widget.tsx',
  ],
  [
    'next',
    'next',
    'src/app/page.tsx',
  ],
  [
    'react-native',
    'react-native',
    'src/components/ui/Widget.tsx',
  ],
  [
    'vue',
    'vue',
    'src/components/ui/Card.vue',
  ],
  [
    'nuxt',
    'nuxt',
    'src/components/ui/Card.vue',
  ],
  [
    'svelte',
    'svelte',
    'src/components/ui/Card.svelte',
  ],
  [
    'solid',
    'solid',
    'src/components/ui/Widget.tsx',
  ],
  [
    'angular',
    'angular',
    'src/app/app.component.ts',
  ],
];

describe('one owner per rule name', () => {
  it.each(DUPLICATE_CASES)('enables no rule name under two ids: %s', async (_label, framework, filePath) => {
    const config = await composeConfig({
      ...WIDEST,
      framework,
    });

    const duplicated = namesUnderTwoIds(await enabledRuleIdsFor(config, filePath))
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
      composes([
        ...base(),
        ...typescript(),
        ...layer(),
      ]);
    }).not.toThrow();
  });

  it('composes next on top of react, in that order', () => {
    expect(() => {
      composes([
        ...base(),
        ...typescript(),
        ...react(),
        ...next(),
      ]);
    }).not.toThrow();
  });

  it('composes the library and file-type layers alongside a framework', () => {
    expect(() => {
      composes([
        ...base(),
        ...typescript(),
        ...react(),
        ...tanstackQuery(),
        ...vitest(),
        ...html(),
      ]);
    }).not.toThrow();
  });

  it('composes every framework layer at once, which is what proves the plugin identities are shared', () => {
    const everything = LAYERS
      .flatMap(([, layer]) => {
        return layer();
      });

    expect(() => {
      composes([
        ...base(),
        ...typescript(),
        ...everything,
        ...next(),
        ...tanstackQuery(),
        ...vitest(),
        ...html(),
      ]);
    }).not.toThrow();
  });
});

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

      const correct = await messagesForFile([
        ...base(),
        ...typescript(),
        ...layer(),
      ], file);
      const wrong = await messagesForFile([
        ...base(),
        ...layer(),
        ...typescript(),
      ], file);

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
