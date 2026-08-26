import { join } from 'node:path';

import {
  messagesForFile,
  ruleIdsFor,
  ruleIdsForFile,
} from '@mocks/lintText';
import { Linter } from 'eslint';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from './base';
import { defineConfig } from './defineConfig';
import angular from './frameworks/angular';
import next from './frameworks/next';
import react from './frameworks/react';
import solid from './frameworks/solid';
import svelte from './frameworks/svelte';
import vue from './frameworks/vue';
import html from './html';
import tanstackQuery from './libraries/tanstackQuery';
import typescript from './typescript';
import vitest from './vitest';

import type { Framework, Layer } from './types';

const SFC_FIXTURES = join(import.meta.dirname, '../__mocks__/fixtures/sfc');

const TYPED_FILE = join(import.meta.dirname, '../__mocks__/fixtures/typed/floating.ts');

// Sorted only when the config's framework bucket owns the specifier; otherwise both imports
// fall into the package bucket and the blank line between them is reported.
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
  ['svelte', 'svelte'],
  ['solid', 'solid-js'],
  ['angular', '@angular/core'],
];

const SORT_RULE = 'simple-import-sort/imports';

describe('defineConfig', () => {
  it('returns base alone when asked for nothing, rather than a default nobody wrote', async () => {
    const baseOnly = await defineConfig();

    await expect(ruleIdsFor(baseOnly, 'export const value = "x";\n', 'src/lib/utils/sample.ts'))
      .resolves.toContain('@stylistic/quotes');
    await expect(ruleIdsForFile(baseOnly, TYPED_FILE))
      .resolves.not.toContain('@typescript-eslint/no-floating-promises');
  });

  it('composes the type-aware layer on request', async () => {
    const ruleIds = await ruleIdsForFile(await defineConfig({ typescript: true }), TYPED_FILE);

    expect(ruleIds).toContain('@typescript-eslint/no-floating-promises');
  });

  // The composer gets the sort bucket from the framework it just loaded, not from a caller.
  it.each(FRAMEWORK_PACKAGES)('gives base the sort bucket %s owns', async (framework, specifier) => {
    const code = sortedFor(specifier);

    const own = await ruleIdsFor(await defineConfig({ framework }), code, 'src/app/entry.ts');
    const none = await ruleIdsFor(await defineConfig(), code, 'src/app/entry.ts');

    expect(own).not.toContain(SORT_RULE);
    expect(none).toContain(SORT_RULE);
  });

  // `vue()`/`svelte()` own the top-level parser for their component, so `typescript()` composed after them
  // would take it away. `layer order` below lints that failure directly; this asserts the composer cannot make it.
  it.each([
    ['vue', 'Home.vue', 'vue/'],
    ['svelte', 'Page.svelte', 'svelte/'],
  ])('orders %s after typescript, so its component still parses', async (framework, fixture, prefix) => {
    const config = await defineConfig({
      framework: framework === 'vue' ? 'vue' : 'svelte',
      typescript: true,
    });
    const messages = await messagesForFile(config, join(SFC_FIXTURES, fixture));

    expect(messages.filter((message) => {
      return message.fatal === true;
    })).toEqual([]);

    expect(messages.some((message) => {
      return message.ruleId?.startsWith(prefix) ?? false;
    })).toBe(true);
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

    const ruleIds = await ruleIdsFor(await defineConfig({ framework: 'next' }), code, 'src/app/page.tsx');

    expect(ruleIds).toContain('@next/next/no-img-element');
    expect(ruleIds).toContain('@linteljs/sort-hook-dependencies');
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

    const config = await defineConfig({
      framework: 'react',
      libraries: ['tanstack-query'],
    });

    await expect(ruleIdsFor(config, code, 'src/lib/hooks/useThing.ts'))
      .resolves.toContain('@tanstack/query/exhaustive-deps');
  });

  it('composes the tailwind layer through the same door', async () => {
    const code = 'export const Card = () => {\n  return <div className="p-2 p-2">x</div>;\n};\n';
    const config = await defineConfig({
      framework: 'react',
      libraries: ['tailwind'],
    });
    // The plugin resolves `tailwindcss` from cwd, pinned here to the package that declares it.
    const pinned = [...config, {
      settings: { 'better-tailwindcss': { cwd: join(import.meta.dirname, '..') } },
    }];

    await expect(ruleIdsFor(pinned, code, 'src/components/Card.tsx'))
      .resolves.toContain('better-tailwindcss/no-duplicate-classes');
  });

  it('composes the vitest layer on request and not otherwise', async () => {
    const code = "import { it } from 'vitest';\n\nit.only('runs', () => {\n  expect(1).toBe(1);\n});\n";
    const path = 'src/lib/utils/sample.test.ts';

    await expect(ruleIdsFor(await defineConfig({ vitest: true }), code, path))
      .resolves.toContain('vitest/no-focused-tests');
    await expect(ruleIdsFor(await defineConfig(), code, path))
      .resolves.not.toContain('vitest/no-focused-tests');
  });

  it('composes the html layer on request and not otherwise', async () => {
    const code = '<!doctype html>\n<html lang="en">\n  <body><img src="a.png"></body>\n</html>\n';

    await expect(ruleIdsFor(await defineConfig({
      html: true,
      typescript: true,
    }), code, 'index.html'))
      .resolves.toContain('@html-eslint/require-img-alt');
    await expect(ruleIdsFor(await defineConfig({ typescript: true }), code, 'index.html'))
      .resolves.not.toContain('@html-eslint/require-img-alt');
  });

  /**
   * A file type, not a framework, so it composes *alongside* one: an Astro site hosting Solid islands needs the solid
   * layer for its `.tsx` and this layer for its `.astro`, which is why it is a boolean beside `html` rather than a
   * `framework` value.
   */
  it('composes the astro layer on request and not otherwise', async () => {
    const page = "---\nconst title = 'Home';\n---\n\n<img src='/a.png' />\n";

    await expect(ruleIdsFor(await defineConfig({
      astro: true,
      typescript: true,
    }), page, 'src/pages/index.astro'))
      .resolves.toContain('astro/jsx-a11y/alt-text');
    await expect(ruleIdsFor(await defineConfig({ typescript: true }), page, 'src/pages/index.astro'))
      .resolves.not.toContain('astro/jsx-a11y/alt-text');
  });

  it('composes the astro layer beside a hosted framework rather than instead of one', async () => {
    const config = await defineConfig({
      astro: true,
      framework: 'solid',
      typescript: true,
    });
    const rules = config.flatMap((entry) => {
      return Object.keys(entry.rules ?? {});
    });

    // Both sets are present: the site's templates and its islands are judged by their own rules.
    expect(rules.some((rule) => {
      return rule.startsWith('astro/');
    })).toBe(true);
    expect(rules.some((rule) => {
      return rule.startsWith('solid/');
    })).toBe(true);
  });

  it('passes the base options through under the names base already uses', async () => {
    const config = await defineConfig({
      framework: 'react',
      ignores: ['generated/**'],
      naming: { 'src/**/*.ts': 'CAMEL_CASE' },
    });

    await expect(ruleIdsFor(config, 'export const value = 1;\n', 'src/lib/utils/Bad-Name.ts'))
      .resolves.toContain('check-file/filename-naming-convention');

    const ignored = await ruleIdsFor(config, 'export const value = 1;\n', 'generated/Bad-Name.ts');

    expect(ignored.filter(Boolean)).toEqual([]);
  });
});

// ESLint compares plugins by identity, so one spread into a fresh object registers again under the same name
// and the config is rejected with "Cannot redefine plugin". `Linter.verify` normalises as a real run does.
const composes = (config: Layer): void => {
  new Linter().verify('const value = 1;\n', config, 'src/lib/utils/sample.ts');
};

const LAYERS: [string, () => Layer][] = [
  ['react', react],
  ['vue', vue],
  ['svelte', svelte],
  ['solid', solid],
  ['angular', angular],
];

describe('composition', () => {
  it.each(LAYERS)('composes base + typescript + %s', (_name, layer) => {
    expect(() => {
      composes([...base(), ...typescript(), ...layer()]);
    }).not.toThrow();
  });

  it('composes next on top of react, in that order', () => {
    expect(() => {
      composes([...base(), ...typescript(), ...react(), ...next()]);
    }).not.toThrow();
  });

  it('composes the library and file-type layers alongside a framework', () => {
    expect(() => {
      composes([...base(), ...typescript(), ...react(), ...tanstackQuery(), ...vitest(), ...html()]);
    }).not.toThrow();
  });

  it('composes every framework layer at once, which is what proves the plugin identities are shared', () => {
    const everything = LAYERS.flatMap(([, layer]) => {
      return layer();
    });

    expect(() => {
      composes([...base(), ...typescript(), ...everything, ...next(), ...tanstackQuery(), ...vitest(), ...html()]);
    }).not.toThrow();
  });
});

// Both SFC layers set `projectService: true`, so their files must exist inside a real tsconfig.
const SFC_ORDER: [string, () => Layer, string, string][] = [
  ['vue', vue, 'Home.vue', 'vue/'],
  ['svelte', svelte, 'Page.svelte', 'svelte/'],
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

/**
 * `vue-eslint-parser`/`svelte-eslint-parser` are the top-level parser for their component, nesting
 * `typescript-eslint` under `parserOptions.parser`. `typescript()`'s `strictTypeChecked` sets
 * `languageOptions.parser` with no `files` glob, so placed after the framework layer it wins there too and the
 * component fails to parse, the error naming the component, not the config. `react()` before `next()` is not
 * tested: `calculateConfigForFile` shows both orders resolve identically, differing only in `settings`
 * key-insertion order, which no rule reads.
 */
describe('layer order', () => {
  it.each(SFC_ORDER)(
    '%s after typescript parses a component; before it, the component does not parse at all',
    async (_name, layer, fixture, prefix) => {
      const file = join(SFC_FIXTURES, fixture);

      const correct = await messagesForFile([...base(), ...typescript(), ...layer()], file);
      const wrong = await messagesForFile([...base(), ...layer(), ...typescript()], file);

      expect(fatalsIn(correct)).toEqual([]);
      expect(reportsFrom(correct, prefix).length).toBeGreaterThan(0);

      expect(fatalsIn(wrong)).toHaveLength(1);
      expect(fatalsIn(wrong)[0]).toMatch(/^Parsing error: /);
      expect(reportsFrom(wrong, prefix)).toEqual([]);
    },
  );
});
