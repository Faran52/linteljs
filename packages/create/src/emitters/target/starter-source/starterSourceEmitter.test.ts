import {
  describe,
  expect,
  it,
} from 'vitest';

import { valuesOf } from '@utils/objectUtils';

import {
  ANSWERS,
  type Answers,
  type Browser,
  DEFAULT_ANSWERS,
  type Router,
  type TargetId,
} from '@answers';
import { shippedAssetsReader } from '@disk';

import { starterSourceEmitter } from './starterSourceEmitter';

import type { Artifact } from '@config/types';

const answersFor = (overrides: Partial<Answers> = {}): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
};

const targetsFor = (overrides: Partial<Answers> = {}): string[] => {
  return starterSourceEmitter(answersFor(overrides)).map(({ target }) => {
    return target;
  });
};

const artifactFor = (overrides: Partial<Answers>, target: string): Artifact | undefined => {
  return starterSourceEmitter(answersFor(overrides)).find((artifact) => {
    return artifact.target === target;
  });
};

// `<destination> -> <asset>`, which is the whole of what this emitter decides.
const sourcesByTarget = (overrides: Partial<Answers>): Record<string, string> => {
  return Object.fromEntries(starterSourceEmitter(answersFor(overrides)).flatMap((artifact) => {
    return 'sources' in artifact.content
      ? artifact.content.sources.map((source) => {
          return [artifact.target, source];
        })
      : [];
  }));
};

/**
 * A record names the destination and this derives the asset from it, so these are the cases where the derivation
 * has to add something: an answer that picks one of several spellings filling one path. `registry.test.ts` holds
 * every derived path against what is on disk; this holds which one is derived.
 */
describe('the asset a destination derives', () => {
  it('reads it straight off the destination where no answer gates the file', () => {
    expect(sourcesByTarget({ target: 'astro' })['src/lib/utils/currentPath.ts'])
      .toBe('starter-source/astro/src/lib/utils/currentPath.ts');
  });

  // Found end to end: the Firefox project shipped Chrome's entry against types declaring `browser.*` alone.
  it.each<[TargetId, Browser]>([
    ['webextension', 'chrome'],
    ['webextension', 'firefox'],
  ])('puts the %s starter under the browser it is written for: %s', (target, browser) => {
    expect(sourcesByTarget({
      target,
      browser,
      surfaces: ['background'],
    })['src/background/index.ts'])
      .toBe(`starter-source/webextension/${browser}/src/background/index.ts`);
  });

  // Three spellings of `App` fill one destination, so the destination alone cannot say which file to copy.
  it.each<Router>([
    'react-router',
    'tanstack-router',
  ])('puts the react starter under the router that asked for it: %s', (router) => {
    expect(sourcesByTarget({
      target: 'react',
      router,
    })['src/App.tsx'])
      .toBe(`starter-source/react/${router}/src/App.tsx`);
  });

  it('takes the base spelling of a varying file when no answer opens a variant', () => {
    expect(sourcesByTarget({ target: 'react' })['src/App.tsx'])
      .toBe('starter-source/react/src/App.tsx');
  });

  // Expo's default Metro config serves a project without NativeWind, which is the one thing that wraps it.
  it.each([
    'metro.config.js',
    'nativewind-env.d.ts',
  ])('writes the react native %s under tailwind alone, from the tailwind tree', (file) => {
    expect(sourcesByTarget({
      target: 'react-native',
      libraries: [],
      styling: 'tailwind',
    })[file])
      .toBe(`starter-source/react-native/tailwind/${file}`);
    expect(sourcesByTarget({
      target: 'react-native',
      libraries: [],
    })[file])
      .toBeUndefined();
  });
});

// Birth only: a project owns its own source from its first run, so `--existing` without `--seed` plants none of it.
it.each(valuesOf(ANSWERS.target.values))('plants every %s starter only on a project being born', (target) => {
  expect(starterSourceEmitter(answersFor({ target })).filter(({ seed }) => {
    return seed !== true;
  })).toEqual([]);
});

// `ng new` leaves the rejection value implicitly `any`, which plain TypeScript refuses.
it('writes the angular entry with its rejection value typed', async () => {
  const entry = artifactFor({ target: 'angular' }, 'src/main.ts');

  expect(entry === undefined ? '' : await shippedAssetsReader(entry.content)).toContain('(err: unknown) =>');
});

describe('starter tests', () => {
  // Skipped rather than failed: a rearranged starter costs the example, not a broken import.
  it.each<[TargetId, string, string]>([
    ['react', 'src/App.test.tsx', 'src/App.tsx'],
    ['webextension', 'src/counter.test.ts', 'src/counter.ts'],
  ])('gates the %s suite %s on the file it covers', (target, suite, covers) => {
    expect(artifactFor({ target }, suite)?.requires?.[0]).toBe(covers);
  });

  // With no store there is no counter, so the gate is what keeps its suite from covering nothing.
  it('gates the store suite on a counter only a store writes', () => {
    expect(artifactFor({}, 'src/lib/store/counter.test.tsx')?.requires).toContain('src/lib/store/counter.ts');
    expect(targetsFor({})).not.toContain('src/lib/store/counter.ts');
    expect(targetsFor({ store: 'zustand' })).toContain('src/lib/store/counter.ts');
  });

  // Both land, since this repository writes both: the layout is the shell and the page is what it wraps.
  it('covers both the svelte page and its root layout', () => {
    expect(targetsFor({ target: 'svelte' }))
      .toEqual(expect.arrayContaining(['src/routes/page.test.ts', 'src/routes/layout.test.ts']));
  });

  it('writes none when testing is declined', () => {
    expect(starterSourceEmitter(answersFor({ testing: 'none' })).filter(({ requires }) => {
      return requires !== undefined;
    })).toEqual([]);
  });
});

describe('starter files for a router', () => {
  // The entry is written either way; without a router it is the base copy, and no route table joins it.
  it('writes the base entry and no route table without a router', () => {
    const written = targetsFor({});

    expect(written).toContain('src/main.tsx');
    expect(written).not.toContain('src/routes/router.tsx');
    expect(written).not.toContain('src/routeTree.gen.ts');
  });

  /*
   * The entry is the same file whatever was answered; `App` is what the router replaces. TanStack has no `routes/`
   * directory and no generated tree: the tree is built from the one route list, in the entry.
   */
  it.each<[Router, string, boolean]>([
    ['react-router', "from 'react-router'", true],
    ['tanstack-router', "from '@tanstack/react-router'", false],
  ])('writes the %s app and nothing generated beside it', async (router, imported, table) => {
    const app = artifactFor({ router }, 'src/App.tsx');

    expect(app === undefined ? '' : await shippedAssetsReader(app.content)).toContain(imported);
    expect(targetsFor({ router }).includes('src/routes/router.tsx')).toBe(table);
    expect(targetsFor({ router })).not.toContain('src/routeTree.gen.ts');
  });
});

/*
 * The contact demo, on every target that ported it. The gates are per record rather than shared, so each target is
 * its own row: each offers one form library and one data layer, and each spells its pages and its control its own
 * way. Next takes React's primitives, api and store to the byte, so its rows name React's tree as the root.
 */
describe('the starter source', () => {
  // A button is what a store or a form gives the page to press; neither, and nothing presses anything.
  it('writes the button for a store or a form, and for neither writes none', () => {
    expect(targetsFor({})).not.toContain('src/components/ui/button/Button.tsx');
    expect(targetsFor({ store: 'zustand' })).toContain('src/components/ui/button/Button.tsx');
    expect(targetsFor({ form: 'tanstack-form' })).toContain('src/components/ui/button/Button.tsx');
  });

  // Vue's row is left out: mutation testing found nothing it killed that another row here does not.
  it.each<[TargetId, string[]]>([
    ['react', [
      'src/pages/contact/ContactPage.tsx',
      'src/components/ui/text-input/TextInput.tsx',
      'src/lib/apis/contact/api.ts',
    ]],
    ['solid', [
      'src/pages/contact/ContactPage.tsx',
      'src/pages/contact/useContactForm.ts',
      'src/components/ui/text-input/TextInput.tsx',
      'src/components/ui/button/Button.tsx',
      'src/components/ui/index.ts',
    ]],
    ['svelte', [
      'src/routes/contact/+page.svelte',
      'src/routes/contact/useContactForm.ts',
      'src/components/ui/text-input/TextInput.svelte',
      'src/components/ui/button/Button.svelte',
      'src/lib/apis/contact/index.ts',
    ]],
    ['next', [
      'src/app/contact/page.tsx',
      'src/app/contact/useContactForm.ts',
      'src/components/ui/text-input/TextInput.tsx',
      'src/components/ui/button/Button.tsx',
    ]],
  ])('writes the %s page, its binding, its control and its button only with a form', (target, files) => {
    expect(targetsFor({
      target,
      form: 'tanstack-form',
    })).toEqual(expect.arrayContaining(files));
    expect(targetsFor({ target })).not.toContain(files[0]);
  });

  // One route list, in the spelling the form answer asks for, so the header and the router follow it together.
  it.each<[TargetId, string, string]>([
    ['solid', 'src/pages/routes.tsx', 'solid'],
    ['vue', 'src/views/routes.ts', 'vue'],
    ['svelte', 'src/config/routes.ts', 'svelte'],
    // The nav list has no framework in it, so it is the shared copy in both spellings.
    ['next', 'src/config/routes.ts', 'shared'],
  ])('adds contact to the one %s route list', (target, routes, root) => {
    expect(sourcesByTarget({
      target,
      form: 'tanstack-form',
    })[routes]).toBe(`starter-source/${root}/with-form/${routes}`);
    expect(sourcesByTarget({ target })[routes]).toBe(`starter-source/${root}/${routes}`);
  });

  // The rules are one file, read by the form that binds them and the api that refuses on them: zod replaces it.
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

    expect(schemasFor(['zod'])).toBe('starter-source/shared/zod/src/lib/apis/contact/schemas.ts');
    expect(schemasFor([])).toBe('starter-source/shared/src/lib/apis/contact/schemas.ts');
  });

  /*
   * One file per answer rather than one per combination: the page and its hook are the same in every data layer,
   * and the api is what varies. Asserting the asset rather than the destination is what says which spelling won.
   */
  it.each<[TargetId, string]>([
    ['react', 'react'],
    ['solid', 'solid'],
    ['vue', 'vue'],
    ['svelte', 'svelte'],
    ['next', 'react'],
  ])('takes the %s api spelling the data answer asks for', (target, root) => {
    const apiFor = (overrides: Partial<Answers>): string | undefined => {
      return sourcesByTarget({
        target,
        form: 'tanstack-form',
        ...overrides,
      })['src/lib/apis/contact/api.ts'];
    };

    expect(apiFor({})).toBe(`starter-source/${root}/src/lib/apis/contact/api.ts`);
    expect(apiFor({ data: 'tanstack-query' }))
      .toBe(`starter-source/${root}/tanstack-query/src/lib/apis/contact/api.ts`);
  });

  // RTK Query's middleware is what gives an endpoint its cache, so the store it rides has to register it.
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

    expect(sources['src/lib/apis/contact/api.ts']).toBe('starter-source/react/rtk-query/src/lib/apis/contact/api.ts');
    expect(sources['src/lib/store/counter.ts']).toBe('starter-source/react/rtk-query/src/lib/store/counter.ts');
  });

  /*
   * SvelteKit's data slot is a component rather than a plugin or a JSX element, so a suite that needs it around
   * its subject needs one of its own. It is a test helper, so a project that declined tests receives none.
   */
  it('writes the svelte data wrapper only for a form with a suite', () => {
    expect(targetsFor({
      target: 'svelte',
      form: 'tanstack-form',
    })).toContain('__mocks__/WithData.svelte');
    expect(targetsFor({
      target: 'svelte',
      form: 'tanstack-form',
      testing: 'none',
    })).not.toContain('__mocks__/WithData.svelte');
    expect(targetsFor({ target: 'svelte' })).not.toContain('__mocks__/WithData.svelte');
  });

  // The barrel a form and a store each add to, on the target whose barrel is a component list.
  it('takes the solid barrel the answers ask for', () => {
    const barrelFor = (overrides: Partial<Answers>): string | undefined => {
      return sourcesByTarget({
        target: 'solid',
        ...overrides,
      })['src/components/ui/index.ts'];
    };

    expect(barrelFor({})).toBe('starter-source/solid/src/components/ui/index.ts');
    expect(barrelFor({ store: 'tanstack-store' })).toBe('starter-source/solid/with-store/src/components/ui/index.ts');
    expect(barrelFor({ form: 'tanstack-form' })).toBe('starter-source/solid/with-form/src/components/ui/index.ts');
  });

  /*
   * Next's own block, because what varies is not only the destination but which tree each file comes from: the
   * document and the routing are Next's, the primitives and the store are React's to the byte, and the rule tables
   * have no framework in them at all.
   */
  describe('on next', () => {
    const sourceOf = (overrides: Partial<Answers>, wanted: string): string | undefined => {
      return sourcesByTarget({
        target: 'next',
        form: 'tanstack-form',
        ...overrides,
      })[wanted];
    };

    it('takes react\'s store in the spelling the store answer asks for', () => {
      expect(sourceOf({ store: 'zustand' }, 'src/lib/store/counter.ts'))
        .toBe('starter-source/react/zustand/src/lib/store/counter.ts');
      expect(sourceOf({ store: 'tanstack-store' }, 'src/lib/store/counter.ts'))
        .toBe('starter-source/react/tanstack-store/src/lib/store/counter.ts');
      expect(sourceOf({ store: 'redux-toolkit' }, 'src/lib/store/counter.ts'))
        .toBe('starter-source/react/redux-toolkit/src/lib/store/counter.ts');
    });

    // Both slots are Next's own, because the directive on them is what makes them the client boundary.
    it('keeps both client slots in its own tree', () => {
      expect(sourceOf({}, 'src/lib/providers/StoreProvider.tsx'))
        .toBe('starter-source/next/src/lib/providers/StoreProvider.tsx');
      expect(sourceOf({ store: 'redux-toolkit' }, 'src/lib/providers/StoreProvider.tsx'))
        .toBe('starter-source/next/redux-toolkit/src/lib/providers/StoreProvider.tsx');
      expect(sourceOf({}, 'src/lib/providers/DataProvider.tsx'))
        .toBe('starter-source/next/src/lib/providers/DataProvider.tsx');
      expect(sourceOf({ data: 'tanstack-query' }, 'src/lib/providers/DataProvider.tsx'))
        .toBe('starter-source/next/tanstack-query/src/lib/providers/DataProvider.tsx');
    });

    it('takes react\'s barrel in the spelling the answers reach', () => {
      const barrel = 'src/components/ui/index.ts';

      expect(sourceOf({}, barrel)).toBe('starter-source/react/with-form/src/components/ui/index.ts');
      expect(sourcesByTarget({ target: 'next' })[barrel])
        .toBe('starter-source/react/src/components/ui/index.ts');
      expect(sourcesByTarget({
        target: 'next',
        store: 'zustand',
      })[barrel])
        .toBe('starter-source/react/with-store/src/components/ui/index.ts');
    });

    // A store makes the home route a client component, which is a different file rather than a directive added.
    it('takes the home route the store answer asks for', () => {
      expect(sourcesByTarget({
        target: 'next',
        store: 'zustand',
      })['src/app/page.tsx'])
        .toBe('starter-source/next/with-store/src/app/page.tsx');
      expect(sourceOf({}, 'src/app/page.tsx')).toBe('starter-source/next/src/app/page.tsx');
    });

    it('takes the styling answer\'s own token spelling', () => {
      expect(sourceOf({ styling: 'tailwind' }, 'src/styles/theme.css'))
        .toBe('starter-source/shared/tailwind/src/styles/theme.css');
      expect(sourceOf({ styling: 'stylex' }, 'src/styles/tokens.stylex.ts'))
        .toBe('starter-source/shared/stylex/src/styles/tokens.stylex.ts');
    });
  });
});
