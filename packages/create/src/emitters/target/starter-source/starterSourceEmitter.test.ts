import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  type Artifact,
  type Browser,
  type Router,
  type TargetId,
} from '@config/types';

import { valuesOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';
import { shippedAssetsReader } from '@disk';

import { starterSourceEmitter } from './starterSourceEmitter';

const targetsFor = (overrides: Partial<Answers> = {}): string[] => {
  return starterSourceEmitter(answersFor(overrides))
    .map(({ target }) => {
      return target;
    });
};

const artifactFor = (overrides: Partial<Answers>, target: string): Artifact | undefined => {
  return starterSourceEmitter(answersFor(overrides))
    .find((artifact) => {
      return artifact.target === target;
    });
};

const sourcesByTarget = (overrides: Partial<Answers>): Record<string, string> => {
  return Object.fromEntries(starterSourceEmitter(answersFor(overrides))
    .flatMap((artifact) => {
      return 'sources' in artifact.content
        ? artifact.content.sources
            .map((source) => {
              return [artifact.target, source];
            })
        : [];
    }));
};

describe('the asset a destination derives', () => {
  it('reads it straight off the destination where no answer gates the file', () => {
    expect(sourcesByTarget({ target: 'astro' })['src/lib/utils/currentPathUtils.ts'])
      .toBe('starter-source/astro/src/lib/utils/currentPathUtils.ts');
  });

  it.each<[TargetId, Browser]>([
    ['webextension', 'chrome'],
    ['webextension', 'firefox'],
  ])('puts the %s starter under the browser it is written for: %s', (target, browser) => {
    const source = sourcesByTarget({
      target,
      browser,
      surfaces: ['background'],
    })['src/background/index.ts'];

    expect(source).toBe(`starter-source/webextension/${browser}/src/background/index.ts`);
  });

  it.each<Router>([
    'react-router',
    'tanstack-router',
  ])('puts the react starter under the router that asked for it: %s', (router) => {
    const source = sourcesByTarget({
      target: 'react',
      router,
    })['src/App.tsx'];

    expect(source).toBe(`starter-source/react/${router}/src/App.tsx`);
  });

  it('takes the base spelling of a varying file when no answer opens a variant', () => {
    expect(sourcesByTarget({ target: 'react' })['src/App.tsx'])
      .toBe('starter-source/react/src/App.tsx');
  });

  it.each([
    'metro.config.js',
    'nativewind-env.d.ts',
  ])('writes the react native %s under tailwind alone, from the tailwind tree', (file) => {
    const withTailwind = sourcesByTarget({
      target: 'react-native',
      libraries: [],
      styling: 'tailwind',
    })[file];

    expect(withTailwind).toBe(`starter-source/react-native/tailwind/${file}`);

    const withoutTailwind = sourcesByTarget({
      target: 'react-native',
      libraries: [],
    })[file];

    expect(withoutTailwind).toBeUndefined();
  });
});

it.each(valuesOf(ANSWERS.target.values))('plants every %s starter only on a project being born', (target) => {
  const unseeded = starterSourceEmitter(answersFor({ target }))
    .filter(({ seed }) => {
      return seed !== true;
    });

  expect(unseeded).toEqual([]);
});

it('writes the angular entry with its rejection value typed', async () => {
  const entry = artifactFor({ target: 'angular' }, 'src/main.ts');

  expect(entry === undefined ? '' : await shippedAssetsReader(entry.content)).toContain('(err: unknown) =>');
});

describe('starter tests', () => {
  it.each<[TargetId, string, string]>([
    [
      'react',
      'src/App.test.tsx',
      'src/App.tsx',
    ],
    [
      'webextension',
      'src/popup/renderPopup.test.ts',
      'src/popup/renderPopup.ts',
    ],
  ])('gates the %s suite %s on the file it covers', (target, suite, covers) => {
    const artifact = artifactFor({ target }, suite);

    expect(artifact?.requires?.[0]).toBe(covers);
    const expected = { sources: [`starter-source/${target}/${suite}`] };
    expect(artifact?.content).toMatchObject(expected);
  });

  it('gates a suite that needs nothing else on the file it covers alone', () => {
    const requires = artifactFor({ target: 'webextension' }, 'src/popup/renderPopup.test.ts')?.requires;

    const expected = ['src/popup/renderPopup.ts'];
    expect(requires).toEqual(expected);
  });

  it('gates the store suite on a counter only a store writes', () => {
    const store = 'src/lib/store/counter/counterStore.ts';
    const requires = artifactFor({}, 'src/lib/store/counter/counterStore.test.ts')?.requires;

    expect(requires).toContain(store);
    const targets = targetsFor({});
    expect(targets).not.toContain(store);
    const targets2 = targetsFor({ store: 'zustand' });
    expect(targets2).toContain(store);
  });

  it('covers both the svelte page and its root layout', () => {
    const targets = targetsFor({ target: 'svelte' });

    expect(targets)
      .toEqual(expect.arrayContaining(['src/routes/page.test.ts', 'src/routes/layout.test.ts']));
  });

  it('writes none when testing is declined', () => {
    const requiring = starterSourceEmitter(answersFor({ testing: 'none' }))
      .filter(({ requires }) => {
        return requires !== undefined;
      });

    expect(requiring).toEqual([]);
  });
});

describe('starter files for a router', () => {
  it('writes the base entry and no route table without a router', () => {
    const written = targetsFor({});

    expect(written).toContain('src/main.tsx');
    expect(written).not.toContain('src/routes/router.tsx');
    expect(written).not.toContain('src/routeTree.gen.ts');
  });

  it.each<[Router, string, boolean]>([
    [
      'react-router',
      "from 'react-router'",
      true,
    ],
    [
      'tanstack-router',
      "from '@tanstack/react-router'",
      false,
    ],
  ])('writes the %s app and nothing generated beside it', async (router, imported, table) => {
    const app = artifactFor({ router }, 'src/App.tsx');

    expect(app === undefined ? '' : await shippedAssetsReader(app.content)).toContain(imported);
    const included = targetsFor({ router }).includes('src/routes/router.tsx');
    expect(included).toBe(table);
    const targets = targetsFor({ router });
    expect(targets).not.toContain('src/routeTree.gen.ts');
  });

  it('lets the stylex dev runtime disable its stylesheet link without a hydration mismatch', async () => {
    const root = artifactFor({
      router: 'react-router-framework',
      styling: 'stylex',
    }, 'src/root.tsx');
    const text = root === undefined ? '' : await shippedAssetsReader(root.content);
    const link = /<link\s+rel="stylesheet"\s+href="\/virtual:stylex\.css"[^>]*>/v.exec(text)?.[0];

    expect(link).toContain('suppressHydrationWarning');
  });

  it.each<[TargetId, string]>([
    ['svelte', 'src/routes/+layout.svelte'],
    ['astro', 'src/layouts/Layout.astro'],
  ])('links the stylex dev css from the %s document only under stylex', async (target, path) => {
    const read = async (overrides: Partial<Answers>): Promise<string> => {
      const document = artifactFor({
        target,
        ...overrides,
      }, path);

      return document === undefined ? '' : await shippedAssetsReader(document.content);
    };

    const stylex = await read({ styling: 'stylex' });
    const plain = await read({});

    expect(stylex).toContain('href="/virtual:stylex.css"');
    expect(plain).toContain('</');
    expect(plain).not.toContain('virtual:stylex');
  });

  // A `select` left out keeps the user agent's font, so the language picker renders in Arial.
  it('resets the font of every form control the starters render', async () => {
    const base = artifactFor({}, 'src/styles/base.css');
    const text = base === undefined ? '' : await shippedAssetsReader(base.content);
    const match = /@layer reset \{(?<rules>[^\}]*)\}/v.exec(text);
    const reset = match?.groups?.['rules'] ?? '';
    const flat = reset.replaceAll(/\s+/gv, ' ');

    expect(flat).toContain('button, input, select, textarea { font: inherit;');
  });

  // The babel plugin reads no tsconfig paths, so `@styles/tokens.stylex` resolves through these two alone.
  it('aliases @styles for the next babel plugin against the project root', async () => {
    const babelrc = artifactFor({
      target: 'next',
      styling: 'stylex',
    }, '.babelrc');
    const text = babelrc === undefined ? '' : await shippedAssetsReader(babelrc.content);
    const flat = text.replaceAll(/\s+/gv, ' ');

    expect(flat).toContain('"aliases": { "@styles/*": ["/ROOT/src/styles/*"] }');
    expect(flat).toContain('"unstable_moduleResolution": { "type": "commonJS", "rootDir": "." }');
  });
});

describe('the starter source', () => {
  it('writes the button under no answers, since the status page retries with it', () => {
    const targets = targetsFor({});
    expect(targets).toContain('src/components/ui/button/Button.tsx');
  });

  it.each<[TargetId, string[]]>([
    ['react', [
      'src/pages/contact/ContactPage.tsx',
      'src/components/ui/text-input/TextInput.tsx',
      'src/lib/apis/contact/contactApi.ts',
    ]],
    ['solid', [
      'src/pages/contact/ContactPage.tsx',
      'src/pages/contact/useContactForm.ts',
      'src/components/ui/text-input/TextInput.tsx',
    ]],
    ['svelte', [
      'src/routes/contact/+page.svelte',
      'src/routes/contact/useContactForm.ts',
      'src/components/ui/text-input/TextInput.svelte',
      'src/lib/apis/contact/index.ts',
    ]],
    ['next', [
      'src/app/contact/page.tsx',
      'src/app/contact/useContactForm.ts',
      'src/components/ui/text-input/TextInput.tsx',
    ]],
  ])('writes the %s page, its binding and its control only with a form', (target, files) => {
    const targets = targetsFor({
      target,
      form: 'tanstack-form',
    });

    expect(targets).toEqual(expect.arrayContaining(files));
    const targets2 = targetsFor({ target });
    expect(targets2).not.toContain(files[0]);
  });

  it.each<[TargetId, string, string]>([
    [
      'solid',
      'src/pages/routes.tsx',
      'solid',
    ],
    [
      'vue',
      'src/views/routes.ts',
      'vue',
    ],
    [
      'svelte',
      'src/config/routes.ts',
      'svelte',
    ],
    [
      'next',
      'src/config/routes.ts',
      'shared',
    ],
  ])('adds contact to the one %s route list', (target, routes, root) => {
    const source = sourcesByTarget({
      target,
      form: 'tanstack-form',
    })[routes];

    expect(source).toBe(`starter-source/${root}/with-form/${routes}`);
    expect(sourcesByTarget({ target })[routes]).toBe(`starter-source/${root}/${routes}`);
  });

  it.each<TargetId>([
    'react',
    'solid',
    'vue',
    'svelte',
    'next',
  ])('takes the zod spelling of the %s rules where zod was chosen and the plain one otherwise', (target) => {
    const schemasFor = (libraries: Answers['libraries']): string | undefined => {
      return sourcesByTarget({
        target,
        form: 'tanstack-form',
        libraries,
      })['src/lib/apis/contact/schemas.ts'];
    };

    const schemas = schemasFor(['zod']);
    expect(schemas).toBe('starter-source/shared/zod/src/lib/apis/contact/schemas.ts');
    const schemas2 = schemasFor([]);
    expect(schemas2).toBe('starter-source/shared/src/lib/apis/contact/schemas.ts');
  });

  it.each<[TargetId, string, string]>([
    [
      'react',
      'react',
      'react',
    ],
    [
      'solid',
      'shared',
      'solid',
    ],
    [
      'vue',
      'shared',
      'vue',
    ],
    [
      'svelte',
      'shared',
      'svelte',
    ],
    [
      'next',
      'react',
      'react',
    ],
  ])('takes the %s api spelling the data answer asks for', (target, root, queryRoot) => {
    const apiFor = (overrides: Partial<Answers>): string | undefined => {
      return sourcesByTarget({
        target,
        form: 'tanstack-form',
        ...overrides,
      })['src/lib/apis/contact/contactApi.ts'];
    };

    const api = apiFor({});
    expect(api).toBe(`starter-source/${root}/src/lib/apis/contact/contactApi.ts`);

    const api2 = apiFor({ data: 'tanstack-query' });

    expect(api2)
      .toBe(`starter-source/${queryRoot}/tanstack-query/src/lib/apis/contact/contactApi.ts`);
  });

  it.each<TargetId>([
    'react',
    'next',
  ])('takes the rtk-query api on %s, and the redux store that registers it', (target) => {
    const sources = sourcesByTarget({
      target,
      form: 'tanstack-form',
      store: 'redux-toolkit',
      data: 'rtk-query',
    });

    const endpoints = 'src/lib/apis/contact/contactEndpoints.ts';
    const hooks = 'src/lib/apis/contact/contactHooks.ts';
    const store = 'src/lib/store/counter/counterStore.ts';

    expect(sources[endpoints]).toBe(`starter-source/react/rtk-query/${endpoints}`);
    expect(sources[hooks]).toBe(`starter-source/react/rtk-query/${hooks}`);
    expect(sources[store]).toBe(`starter-source/react/rtk-query/${store}`);
    expect(sources['src/lib/apis/contact/contactApi.ts']).toBeUndefined();
  });

  it('writes the svelte data wrapper only for a form with a suite', () => {
    const withSuite = targetsFor({
      target: 'svelte',
      form: 'tanstack-form',
    });

    expect(withSuite).toContain('__mocks__/WithData.svelte');

    const withoutSuite = targetsFor({
      target: 'svelte',
      form: 'tanstack-form',
      testing: 'none',
    });

    expect(withoutSuite).not.toContain('__mocks__/WithData.svelte');
    const targets = targetsFor({ target: 'svelte' });
    expect(targets).not.toContain('__mocks__/WithData.svelte');
  });

  it('takes the solid barrel the answers ask for', () => {
    const barrelFor = (overrides: Partial<Answers>): string | undefined => {
      return sourcesByTarget({
        target: 'solid',
        ...overrides,
      })['src/components/ui/index.ts'];
    };

    const barrel = barrelFor({});
    expect(barrel).toBe('starter-source/shared/src/components/ui/index.ts');
    const barrel2 = barrelFor({ store: 'tanstack-store' });
    expect(barrel2).toBe('starter-source/shared/src/components/ui/index.ts');
    const barrel3 = barrelFor({ form: 'tanstack-form' });
    expect(barrel3).toBe('starter-source/shared/with-form/src/components/ui/index.ts');
  });

  describe('on next', () => {
    const sourceOf = (overrides: Partial<Answers>, wanted: string): string | undefined => {
      return sourcesByTarget({
        target: 'next',
        form: 'tanstack-form',
        ...overrides,
      })[wanted];
    };

    it('takes react\'s store in the spelling the store answer asks for', () => {
      const source = sourceOf({ store: 'zustand' }, 'src/lib/store/counter/counterStore.ts');

      expect(source)
        .toBe('starter-source/react/zustand/src/lib/store/counter/counterStore.ts');

      const source2 = sourceOf({ store: 'tanstack-store' }, 'src/lib/store/counter/counterStore.ts');

      expect(source2)
        .toBe('starter-source/react/tanstack-store/src/lib/store/counter/counterStore.ts');

      const source3 = sourceOf({ store: 'redux-toolkit' }, 'src/lib/store/counter/counterStore.ts');

      expect(source3)
        .toBe('starter-source/react/redux-toolkit/src/lib/store/counter/counterStore.ts');
    });

    it('reads both client slots from the React tree', () => {
      const source = sourceOf({}, 'src/lib/providers/store/StoreProvider.tsx');

      expect(source)
        .toBe('starter-source/react/src/lib/providers/store/StoreProvider.tsx');

      const source2 = sourceOf({ store: 'redux-toolkit' }, 'src/lib/providers/store/StoreProvider.tsx');

      expect(source2)
        .toBe('starter-source/react/redux-toolkit/src/lib/providers/store/StoreProvider.tsx');

      const source3 = sourceOf({}, 'src/lib/providers/data/DataProvider.tsx');

      expect(source3)
        .toBe('starter-source/react/src/lib/providers/data/DataProvider.tsx');

      const source4 = sourceOf({ data: 'tanstack-query' }, 'src/lib/providers/data/DataProvider.tsx');

      expect(source4)
        .toBe('starter-source/react/tanstack-query/src/lib/providers/data/DataProvider.tsx');
    });

    it('takes the shared barrel in the spelling the answers reach', () => {
      const barrel = 'src/components/ui/index.ts';

      const source2 = sourceOf({}, barrel);
      expect(source2).toBe('starter-source/shared/with-form/src/components/ui/index.ts');

      expect(sourcesByTarget({ target: 'next' })[barrel])
        .toBe('starter-source/shared/src/components/ui/index.ts');

      const source = sourcesByTarget({
        target: 'next',
        store: 'zustand',
      })[barrel];

      expect(source).toBe('starter-source/shared/src/components/ui/index.ts');
    });

    it('takes the home route the store answer asks for', () => {
      const source = sourcesByTarget({
        target: 'next',
        store: 'zustand',
      })['src/app/page.tsx'];

      expect(source).toBe('starter-source/next/with-store/src/app/page.tsx');
      const source2 = sourceOf({}, 'src/app/page.tsx');
      expect(source2).toBe('starter-source/next/src/app/page.tsx');
    });

    it('takes the styling answer\'s own token spelling', () => {
      const source = sourceOf({ styling: 'tailwind' }, 'src/styles/theme.css');

      expect(source)
        .toBe('starter-source/shared/tailwind/src/styles/theme.css');

      const source2 = sourceOf({ styling: 'stylex' }, 'src/styles/tokens.stylex.ts');

      expect(source2)
        .toBe('starter-source/shared/stylex/src/styles/tokens.stylex.ts');
    });
  });
});

describe('a shared file written under the target naming', () => {
  it.each([
    ['src/lib/utils/status-utils.spec.ts', "from './status-utils'"],
    ['src/lib/utils/fetch-extended-utils.test.ts', "from './fetch-extended-utils'"],
  ])('imports its renamed neighbour by the name the target writes: %s', async (target, imported) => {
    const suite = artifactFor({ target: 'angular' }, target);
    const text = suite === undefined ? '' : await shippedAssetsReader(suite.content);

    expect(text).toContain(imported);
  });

  it('leaves a target that renames nothing reading the shared source as written', () => {
    const suite = artifactFor({ target: 'react' }, 'src/lib/utils/statusUtils.test.ts');

    const expected = { sources: ['starter-source/shared/src/lib/utils/statusUtils.test.ts'] };
    expect(suite?.content).toEqual(expected);
  });
});

describe('a client boundary', () => {
  const textOf = async (overrides: Partial<Answers>, target: string): Promise<string> => {
    const artifact = artifactFor(overrides, target);

    return artifact === undefined ? '' : await shippedAssetsReader(artifact.content);
  };

  it.each<[string, string, Partial<Answers>]>([
    [
      'src/app/contact/useContactForm.ts',
      'src/pages/contact/useContactForm.ts',
      { form: 'react-hook-form' },
    ],
    [
      'src/app/contact/useContactForm.ts',
      'src/pages/contact/useContactForm.ts',
      { form: 'tanstack-form' },
    ],
    [
      'src/lib/providers/store/StoreProvider.tsx',
      'src/lib/providers/store/StoreProvider.tsx',
      { store: 'zustand' },
    ],
    [
      'src/lib/providers/store/StoreProvider.tsx',
      'src/lib/providers/store/StoreProvider.tsx',
      { store: 'redux-toolkit' },
    ],
    [
      'src/lib/providers/data/DataProvider.tsx',
      'src/lib/providers/data/DataProvider.tsx',
      {},
    ],
    [
      'src/lib/providers/data/DataProvider.tsx',
      'src/lib/providers/data/DataProvider.tsx',
      { data: 'tanstack-query' },
    ],
  ])('writes Next its %s as React writes %s, opened with the directive, under %o', async (next, react, overrides) => {
    const written = await textOf({
      target: 'next',
      ...overrides,
    }, next);
    const shared = await textOf({
      target: 'react',
      ...overrides,
    }, react);
    const expected = `'use client';\n\n${shared}`;

    expect(written).toBe(expected);
  });
});
