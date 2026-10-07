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

import { keysOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';
import { shippedAssetsReader } from '@disk';

import { starterSourceEmitter } from './starterSourceEmitter';

type Schemes = Record<string, readonly [string, string]>;

const targetsFor = (overrides: Partial<Answers> = {}): string[] => {
  const artifacts = starterSourceEmitter(answersFor(overrides));

  return artifacts
    .map(({ target }) => {
      return target;
    });
};

const artifactFor = (overrides: Partial<Answers>, target: string): Artifact | undefined => {
  const artifacts = starterSourceEmitter(answersFor(overrides));

  return artifacts
    .find((artifact) => {
      return artifact.target === target;
    });
};

const sourcesByTarget = (overrides: Partial<Answers>): Record<string, string> => {
  const artifacts = starterSourceEmitter(answersFor(overrides));
  const entries = artifacts
    .flatMap((artifact) => {
      return 'sources' in artifact.content
        ? artifact.content.sources
            .map((source) => {
              const entry: [string, string] = [artifact.target, source];

              return entry;
            })
        : [];
    });

  return Object.fromEntries(entries);
};

const textOf = async (overrides: Partial<Answers>, target: string): Promise<string> => {
  const artifact = artifactFor(overrides, target);

  if (artifact === undefined) {
    return '';
  }

  return shippedAssetsReader(artifact.content);
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
    })['src/background/background.ts'];

    expect(source).toBe(`starter-source/webextension/${browser}/src/background/background.ts`);
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

const targetIds = keysOf(ANSWERS.target.values);

it.each(targetIds)('plants every %s starter only on a project being born', (target) => {
  const artifacts = starterSourceEmitter(answersFor({ target }));
  const unseeded = artifacts
    .filter(({ seed }) => {
      return seed !== true;
    });

  expect(unseeded).toEqual([]);
});

it('writes the angular entry with its rejection value typed', async () => {
  const entry = await textOf({ target: 'angular' }, 'src/main.ts');

  expect(entry).toContain('(err: unknown) =>');
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
    const bare = targetsFor({});
    expect(bare).not.toContain(store);
    const withZustand = targetsFor({ store: 'zustand' });
    expect(withZustand).toContain(store);
  });

  it('covers both the svelte page and its root layout', () => {
    const targets = targetsFor({ target: 'svelte' });

    expect(targets)
      .toEqual(expect.arrayContaining(['src/routes/page.test.ts', 'src/routes/layout.test.ts']));
  });

  it('writes none when testing is declined', () => {
    const artifacts = starterSourceEmitter(answersFor({ testing: 'none' }));
    const requiring = artifacts
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
    expect(written).not.toContain('src/routeTree.gen.ts');
  });

  it.each<[Router, string]>([
    ['react-router', "from 'react-router'"],
    ['tanstack-router', "from '@tanstack/react-router'"],
  ])('writes the %s app and nothing generated beside it', async (router, imported) => {
    const app = await textOf({ router }, 'src/App.tsx');

    expect(app).toContain(imported);
    const targets = targetsFor({ router });
    expect(targets).not.toContain('src/routeTree.gen.ts');
  });

  it('lets the stylex dev runtime disable its stylesheet link without a hydration mismatch', async () => {
    const text = await textOf({
      router: 'react-router-framework',
      styling: 'stylex',
    }, 'src/root.tsx');
    const link = /<link\s+rel="stylesheet"\s+href="\/virtual:stylex\.css"[^>]*>/v.exec(text)?.[0];

    expect(link).toContain('suppressHydrationWarning');
  });

  it.each<[TargetId, string]>([
    ['svelte', 'src/routes/+layout.svelte'],
    ['astro', 'src/layouts/Layout.astro'],
  ])('links the stylex dev css from the %s document only under stylex', async (target, path) => {
    const read = async (overrides: Partial<Answers>): Promise<string> => {
      return textOf({
        target,
        ...overrides,
      }, path);
    };

    const stylex = await read({ styling: 'stylex' });
    const plain = await read({});

    expect(stylex).toContain('href="/virtual:stylex.css"');
    expect(plain).toContain('</');
    expect(plain).not.toContain('virtual:stylex');
  });

  // A `select` left out keeps the user agent's font, so the language picker renders in Arial.
  it('resets the font of every form control the starters render', async () => {
    const text = await textOf({}, 'src/styles/base.css');
    const match = /@layer reset \{(?<rules>[^\}]*)\}/v.exec(text);
    const reset = match?.groups?.['rules'] ?? '';
    const flat = reset.replaceAll(/\s+/gv, ' ');

    expect(flat).toContain('button, input, select, textarea { font: inherit;');
  });

  // The babel plugin reads no tsconfig paths, so `@styles/tokens.stylex` resolves through these two alone.
  it('aliases @styles for the next babel plugin against the project root', async () => {
    const text = await textOf({
      target: 'next',
      styling: 'stylex',
    }, '.babelrc');
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
    ['react-native', [
      'src/app/(tabs)/contact.tsx',
      'src/hooks/use-contact-form/useContactForm.ts',
      'src/hooks/use-contact-form/useContactForm.test.ts',
    ]],
    ['react', [
      'src/pages/contact/ContactPage.tsx',
      'src/components/ui/text-input/TextInput.tsx',
      'src/lib/apis/contact/contactApi.ts',
    ]],
    ['solid', [
      'src/pages/contact/ContactPage.tsx',
      'src/pages/contact/create-contact-form/createContactForm.ts',
      'src/components/ui/text-input/TextInput.tsx',
    ]],
    ['svelte', [
      'src/routes/contact/+page.svelte',
      'src/routes/contact/use-contact-form/useContactForm.ts',
      'src/routes/contact/use-contact-form/useContactForm.test.ts',
      'src/components/ui/text-input/TextInput.svelte',
      'src/lib/apis/contact/index.ts',
    ]],
    ['next', [
      'src/app/contact/page.tsx',
      'src/app/contact/use-contact-form/useContactForm.ts',
      'src/app/contact/use-contact-form/useContactForm.test.ts',
      'src/components/ui/text-input/TextInput.tsx',
    ]],
  ])('writes the %s page, its binding and its control only with a form', (target, files) => {
    const withForm = targetsFor({
      target,
      form: 'tanstack-form',
    });

    expect(withForm).toEqual(expect.arrayContaining(files));
    const withoutForm = targetsFor({ target });
    expect(withoutForm).not.toContain(files[0]);
  });

  it.each<[TargetId, string, string]>([
    [
      'solid',
      'src/router/router.tsx',
      'solid',
    ],
    [
      'vue',
      'src/router/constants.ts',
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
      })['src/lib/services/contact-form/contactFormService.ts'];
    };

    const zodSchemas = schemasFor(['zod']);
    expect(zodSchemas).toBe('starter-source/shared/zod/src/lib/services/contact-form/contactFormService.ts');
    const plainSchemas = schemasFor([]);
    expect(plainSchemas).toBe('starter-source/shared/src/lib/services/contact-form/contactFormService.ts');
  });

  it.each<[TargetId, string, string]>([
    [
      'react',
      'react',
      'react',
    ],
    [
      'solid',
      'solid',
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

    const plainApi = apiFor({});
    expect(plainApi).toBe(`starter-source/${root}/src/lib/apis/contact/contactApi.ts`);

    const queryApi = apiFor({ data: 'tanstack-query' });

    expect(queryApi)
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
    const withoutForm = targetsFor({ target: 'svelte' });
    expect(withoutForm).not.toContain('__mocks__/WithData.svelte');
  });

  it('takes the solid barrel the answers ask for', () => {
    const barrelFor = (overrides: Partial<Answers>): string | undefined => {
      return sourcesByTarget({
        target: 'solid',
        ...overrides,
      })['src/components/ui/index.ts'];
    };

    const bareBarrel = barrelFor({});
    expect(bareBarrel).toBe('starter-source/shared/src/components/ui/index.ts');
    const storeBarrel = barrelFor({ store: 'tanstack-store' });
    expect(storeBarrel).toBe('starter-source/shared/src/components/ui/index.ts');
    const formBarrel = barrelFor({ form: 'tanstack-form' });
    expect(formBarrel).toBe('starter-source/shared/with-form/src/components/ui/index.ts');
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
      const zustandStore = sourceOf({ store: 'zustand' }, 'src/lib/store/counter/counterStore.ts');

      expect(zustandStore)
        .toBe('starter-source/react/zustand/src/lib/store/counter/counterStore.ts');

      const tanstackStore = sourceOf({ store: 'tanstack-store' }, 'src/lib/store/counter/counterStore.ts');

      expect(tanstackStore)
        .toBe('starter-source/react/tanstack-store/src/lib/store/counter/counterStore.ts');

      const reduxStore = sourceOf({ store: 'redux-toolkit' }, 'src/lib/store/counter/counterStore.ts');

      expect(reduxStore)
        .toBe('starter-source/react/redux-toolkit/src/lib/store/counter/counterStore.ts');
    });

    it('reads both client slots from the React tree', () => {
      const plainStoreProvider = sourceOf({}, 'src/lib/providers/store/StoreProvider.tsx');

      expect(plainStoreProvider)
        .toBe('starter-source/react/src/lib/providers/store/StoreProvider.tsx');

      const reduxStoreProvider = sourceOf({ store: 'redux-toolkit' }, 'src/lib/providers/store/StoreProvider.tsx');

      expect(reduxStoreProvider)
        .toBe('starter-source/react/redux-toolkit/src/lib/providers/store/StoreProvider.tsx');

      const plainDataProvider = sourceOf({}, 'src/lib/providers/data/DataProvider.tsx');

      expect(plainDataProvider)
        .toBe('starter-source/react/src/lib/providers/data/DataProvider.tsx');

      const queryDataProvider = sourceOf({ data: 'tanstack-query' }, 'src/lib/providers/data/DataProvider.tsx');

      expect(queryDataProvider)
        .toBe('starter-source/react/tanstack-query/src/lib/providers/data/DataProvider.tsx');
    });

    it('takes the shared barrel in the spelling the answers reach', () => {
      const barrel = 'src/components/ui/index.ts';

      const formBarrel = sourceOf({}, barrel);
      expect(formBarrel).toBe('starter-source/shared/with-form/src/components/ui/index.ts');

      expect(sourcesByTarget({ target: 'next' })[barrel])
        .toBe('starter-source/shared/src/components/ui/index.ts');

      const storeBarrel = sourcesByTarget({
        target: 'next',
        store: 'zustand',
      })[barrel];

      expect(storeBarrel).toBe('starter-source/shared/src/components/ui/index.ts');
    });

    it('takes the home route the store answer asks for', () => {
      const storeHome = sourcesByTarget({
        target: 'next',
        store: 'zustand',
      })['src/app/page.tsx'];

      expect(storeHome).toBe('starter-source/next/with-store/src/app/page.tsx');
      const plainHome = sourceOf({}, 'src/app/page.tsx');
      expect(plainHome).toBe('starter-source/next/src/app/page.tsx');
    });

    it('takes the styling answer\'s own token spelling', () => {
      const tailwindTheme = sourceOf({ styling: 'tailwind' }, 'src/styles/theme.css');

      expect(tailwindTheme)
        .toBe('starter-source/shared/tailwind/src/styles/theme.css');

      const stylexTokens = sourceOf({ styling: 'stylex' }, 'src/styles/tokens.stylex.ts');

      expect(stylexTokens)
        .toBe('starter-source/shared/stylex/src/styles/tokens.stylex.ts');
    });
  });
});

describe('a locale file', () => {
  it.each<[Partial<Answers>, boolean]>([
    [{ target: 'react', form: 'tanstack-form' }, true],
    [{ target: 'react' }, false],
    [{ target: 'angular' }, true],
    [{ target: 'astro' }, false],
    [{ target: 'react-native' }, false],
    [{ target: 'nuxt' }, false],
    [{ target: 'webextension' }, false],
  ])('carries the contact keys under %o only where a contact page is written: %s', async (overrides, carried) => {
    const text = await textOf({
      ...overrides,
      languages: ['ar'],
    }, 'src/i18n/locales/ar/common.json');

    const keys = Object.keys(JSON.parse(text) as Record<string, string>);
    expect(keys).toContain('home');
    const contact = keys.includes('contactEmail');
    expect(contact).toBe(carried);
  });
});

describe('a shared file written under the target naming', () => {
  it.each([
    ['src/lib/utils/status-utils.spec.ts', "from './status-utils'"],
    ['src/lib/utils/fetch-extended-utils.spec.ts', "from './fetch-extended-utils'"],
  ])('imports its renamed neighbour by the name the target writes: %s', async (target, imported) => {
    const text = await textOf({ target: 'angular' }, target);

    expect(text).toContain(imported);
  });

  it('leaves a target that renames nothing reading the shared source as written', () => {
    const suite = artifactFor({ target: 'react' }, 'src/lib/utils/statusUtils.test.ts');

    const expected = { sources: ['starter-source/shared/src/lib/utils/statusUtils.test.ts'] };
    expect(suite?.content).toEqual(expected);
  });
});

describe('an image', () => {
  it('copies its bytes with no rewrite', () => {
    const icon = artifactFor({ target: 'react-native' }, 'assets/images/icon.png');

    const expected = {
      stage: 'standard',
      target: 'assets/images/icon.png',
      content: { bytes: 'starter-source/react-native/assets/images/icon.png' },
      seed: true,
    };
    expect(icon).toEqual(expected);
  });
});

describe('a client boundary', () => {
  it.each<[string, string, Partial<Answers>]>([
    [
      'src/app/contact/use-contact-form/useContactForm.ts',
      'src/pages/contact/use-contact-form/useContactForm.ts',
      { form: 'react-hook-form' },
    ],
    [
      'src/app/contact/use-contact-form/useContactForm.ts',
      'src/pages/contact/use-contact-form/useContactForm.ts',
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

describe('a StyleX sheet', () => {
  const stylex: Partial<Answers> = {
    styling: 'stylex',
    form: 'tanstack-form',
  };

  it.each<[TargetId, string, string]>([
    [
      'solid',
      'src/components/ui/button/buttonStyles.ts',
      'src/components/ui/button/buttonStyles.ts',
    ],
    [
      'svelte',
      'src/components/ui/mark/markStyles.ts',
      'src/components/ui/mark/markStyles.ts',
    ],
    [
      'astro',
      'src/components/features/app-header/appHeaderStyles.ts',
      'src/components/features/app-header/appHeaderStyles.ts',
    ],
    [
      'vue',
      'src/components/ui/app-button/appButtonStyles.ts',
      'src/components/ui/button/buttonStyles.ts',
    ],
    [
      'nuxt',
      'src/components/ui/app-mark/appMarkStyles.ts',
      'src/components/ui/mark/markStyles.ts',
    ],
  ])('writes %s its %s as React writes %s, spread with attrs', async (target, written, react) => {
    const text = await textOf({
      target,
      ...stylex,
    }, written);
    const shared = await textOf({
      target: 'react',
      ...stylex,
    }, react);
    const expected = shared.replaceAll('stylex.props', 'stylex.attrs');

    expect(text).toBe(expected);
    expect(text).not.toBe(shared);
  });

  it.each<TargetId>(['react', 'next'])('leaves %s spreading props', async (target) => {
    const text = await textOf({
      target,
      ...stylex,
    }, 'src/components/ui/button/buttonStyles.ts');

    expect(text).toContain('button: stylex.props(sheet.button),');
  });

  it('writes the button sheet as Solid spreads it', async () => {
    const text = await textOf({
      target: 'solid',
      ...stylex,
    }, 'src/components/ui/button/buttonStyles.ts');

    expect(text).toContain('button: stylex.attrs(sheet.button),');
  });
});

// WCAG 2 relative luminance, so the shared palette is held to AA rather than to an eye.
const luminanceOf = (hex: string): number => {
  const full = hex.length === 4 ? hex.replaceAll(/[\da-f]/gv, '$&$&') : hex;
  const [
    red = 0,
    green = 0,
    blue = 0,
  ] = [
    1,
    3,
    5,
  ]
    .map((start) => {
      const pair = full.slice(start, start + 2);
      const channel = Number.parseInt(pair, 16) / 255;

      return channel <= 0.040_45 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });

  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
};

const contrastOf = (first: string, second: string): number => {
  const [lighter = 0, darker = 0] = [luminanceOf(first), luminanceOf(second)]
    .toSorted((left, right) => {
      return right - left;
    });

  return (lighter + 0.05) / (darker + 0.05);
};

const schemesOf = async (): Promise<Schemes> => {
  const text = await textOf({}, 'src/styles/tokens.css');
  const tokenLine = /--(?<name>[a-z\d\-]{1,40}): light-dark\((?<light>#[\da-f]{3,6}), (?<dark>#[\da-f]{3,6})\)/gv;
  const pairs = [...text.matchAll(tokenLine)]
    .map(({ groups }) => {
      const entry: [string, readonly [string, string]] = [
        groups?.['name'] ?? '',
        [groups?.['light'] ?? '', groups?.['dark'] ?? ''],
      ];

      return entry;
    });

  return Object.fromEntries(pairs);
};

const shortfallsOf = (schemes: Schemes, foregrounds: string[], backgrounds: string[], floor: number): string[] => {
  const indices = [0, 1];

  return indices
    .flatMap((scheme) => {
      return foregrounds
        .flatMap((foreground) => {
          return backgrounds
            .filter((background) => {
              const fore = schemes[foreground]?.[scheme] ?? '';
              const back = schemes[background]?.[scheme] ?? '';

              return contrastOf(fore, back) < floor;
            })
            .map((background) => {
              return `${String(scheme)} ${foreground} on ${background}`;
            });
        });
    });
};

describe('the shared palette', () => {
  it('reads every text token at 4.5:1 on every surface in both schemes', async () => {
    const schemes = await schemesOf();
    const texts = [
      'foreground',
      'foreground-2',
      'muted-foreground',
      'faint',
      'primary',
      'ok',
      'destructive',
    ];
    const shortfalls = shortfallsOf(schemes, texts, [
      'background',
      'card',
      'muted',
    ], 4.5);
    const onPrimary = shortfallsOf(schemes, ['primary-foreground'], ['primary'], 4.5);

    const names = Object.keys(schemes);

    expect(names).toEqual(expect.arrayContaining([
      ...texts,
      'background',
      'card',
      'muted',
    ]));

    expect(shortfalls).toStrictEqual([]);
    expect(onPrimary).toStrictEqual([]);
  });

  // A field sits on a card in the card's own colour, so its border is all that marks it out.
  it('draws every control edge at 3:1 on the surfaces it sits on', async () => {
    const schemes = await schemesOf();
    const shortfalls = shortfallsOf(schemes, [
      'input',
      'primary',
      'destructive',
    ], ['background', 'card'], 3);

    expect(shortfalls).toStrictEqual([]);
  });
});

// The name is whatever was typed: at a 360px popup it wraps rather than hiding behind an ellipsis.
describe('the header brand', () => {
  it('wraps the name in the plain sheet and in StyleX', async () => {
    const sheet = await textOf({}, 'src/components/features/app-header/AppHeader.css');
    const stylex = await textOf({ styling: 'stylex' }, 'src/components/features/app-header/appHeaderStyles.ts');
    const plainBrand = /\.brand \{[^\}]*\}/v.exec(sheet)?.[0] ?? '';
    const stylexBrand = /brand: \{[^\}]*\}/v.exec(stylex)?.[0] ?? '';

    expect(plainBrand).toContain('overflow-wrap: anywhere;');
    expect(plainBrand).not.toMatch(/nowrap|ellipsis/v);
    expect(stylexBrand).toContain("overflowWrap: 'anywhere',");
    expect(stylexBrand).not.toMatch(/nowrap|ellipsis/v);
  });
});
