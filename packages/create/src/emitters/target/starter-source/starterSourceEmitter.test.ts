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
    expect(sourcesByTarget({ target: 'astro' })['src/lib/utils/currentPath.ts'])
      .toBe('starter-source/astro/src/lib/utils/currentPath.ts');
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
    ['react', 'src/App.test.tsx', 'src/App.tsx'],
    ['webextension', 'src/popup/renderPopup.test.ts', 'src/popup/renderPopup.ts'],
  ])('gates the %s suite %s on the file it covers', (target, suite, covers) => {
    const artifact = artifactFor({ target }, suite);

    expect(artifact?.requires?.[0]).toBe(covers);
    expect(artifact?.content).toEqual({ sources: [`starter-source/${target}/${suite}`] });
  });

  it('gates a suite that needs nothing else on the file it covers alone', () => {
    const requires = artifactFor({ target: 'webextension' }, 'src/popup/renderPopup.test.ts')?.requires;

    expect(requires).toEqual(['src/popup/renderPopup.ts']);
  });

  it('gates the store suite on a counter only a store writes', () => {
    expect(artifactFor({}, 'src/lib/store/counter.test.tsx')?.requires).toContain('src/lib/store/counter.ts');
    expect(targetsFor({})).not.toContain('src/lib/store/counter.ts');
    expect(targetsFor({ store: 'zustand' })).toContain('src/lib/store/counter.ts');
  });

  it('covers both the svelte page and its root layout', () => {
    expect(targetsFor({ target: 'svelte' }))
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
    ['react-router', "from 'react-router'", true],
    ['tanstack-router', "from '@tanstack/react-router'", false],
  ])('writes the %s app and nothing generated beside it', async (router, imported, table) => {
    const app = artifactFor({ router }, 'src/App.tsx');

    expect(app === undefined ? '' : await shippedAssetsReader(app.content)).toContain(imported);
    expect(targetsFor({ router }).includes('src/routes/router.tsx')).toBe(table);
    expect(targetsFor({ router })).not.toContain('src/routeTree.gen.ts');
  });
});

describe('the starter source', () => {
  it('writes the button for a store or a form, and for neither writes none', () => {
    expect(targetsFor({})).not.toContain('src/components/ui/button/Button.tsx');
    expect(targetsFor({ store: 'zustand' })).toContain('src/components/ui/button/Button.tsx');
    expect(targetsFor({ form: 'tanstack-form' })).toContain('src/components/ui/button/Button.tsx');
  });

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
    const targets = targetsFor({
      target,
      form: 'tanstack-form',
    });

    expect(targets).toEqual(expect.arrayContaining(files));
    expect(targetsFor({ target })).not.toContain(files[0]);
  });

  it.each<[TargetId, string, string]>([
    ['solid', 'src/pages/routes.tsx', 'solid'],
    ['vue', 'src/views/routes.ts', 'vue'],
    ['svelte', 'src/config/routes.ts', 'svelte'],
    ['next', 'src/config/routes.ts', 'shared'],
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

    expect(schemasFor(['zod'])).toBe('starter-source/shared/zod/src/lib/apis/contact/schemas.ts');
    expect(schemasFor([])).toBe('starter-source/shared/src/lib/apis/contact/schemas.ts');
  });

  it.each<[TargetId, string, string]>([
    ['react', 'react', 'react'],
    ['solid', 'shared', 'solid'],
    ['vue', 'shared', 'vue'],
    ['svelte', 'shared', 'svelte'],
    ['next', 'react', 'react'],
  ])('takes the %s api spelling the data answer asks for', (target, root, queryRoot) => {
    const apiFor = (overrides: Partial<Answers>): string | undefined => {
      return sourcesByTarget({
        target,
        form: 'tanstack-form',
        ...overrides,
      })['src/lib/apis/contact/api.ts'];
    };

    expect(apiFor({})).toBe(`starter-source/${root}/src/lib/apis/contact/api.ts`);
    expect(apiFor({ data: 'tanstack-query' }))
      .toBe(`starter-source/${queryRoot}/tanstack-query/src/lib/apis/contact/api.ts`);
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

    expect(sources['src/lib/apis/contact/api.ts']).toBe('starter-source/react/rtk-query/src/lib/apis/contact/api.ts');
    expect(sources['src/lib/store/counter.ts']).toBe('starter-source/react/rtk-query/src/lib/store/counter.ts');
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
    expect(targetsFor({ target: 'svelte' })).not.toContain('__mocks__/WithData.svelte');
  });

  it('takes the solid barrel the answers ask for', () => {
    const barrelFor = (overrides: Partial<Answers>): string | undefined => {
      return sourcesByTarget({
        target: 'solid',
        ...overrides,
      })['src/components/ui/index.ts'];
    };

    expect(barrelFor({})).toBe('starter-source/shared/src/components/ui/index.ts');
    expect(barrelFor({ store: 'tanstack-store' })).toBe('starter-source/shared/with-store/src/components/ui/index.ts');
    expect(barrelFor({ form: 'tanstack-form' })).toBe('starter-source/shared/with-form/src/components/ui/index.ts');
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
      expect(sourceOf({ store: 'zustand' }, 'src/lib/store/counter.ts'))
        .toBe('starter-source/react/zustand/src/lib/store/counter.ts');
      expect(sourceOf({ store: 'tanstack-store' }, 'src/lib/store/counter.ts'))
        .toBe('starter-source/react/tanstack-store/src/lib/store/counter.ts');
      expect(sourceOf({ store: 'redux-toolkit' }, 'src/lib/store/counter.ts'))
        .toBe('starter-source/react/redux-toolkit/src/lib/store/counter.ts');
    });

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

    it('takes the shared barrel in the spelling the answers reach', () => {
      const barrel = 'src/components/ui/index.ts';

      expect(sourceOf({}, barrel)).toBe('starter-source/shared/with-form/src/components/ui/index.ts');
      expect(sourcesByTarget({ target: 'next' })[barrel])
        .toBe('starter-source/shared/src/components/ui/index.ts');
      const source = sourcesByTarget({
        target: 'next',
        store: 'zustand',
      })[barrel];

      expect(source).toBe('starter-source/shared/with-store/src/components/ui/index.ts');
    });

    it('takes the home route the store answer asks for', () => {
      const source = sourcesByTarget({
        target: 'next',
        store: 'zustand',
      })['src/app/page.tsx'];

      expect(source).toBe('starter-source/next/with-store/src/app/page.tsx');
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
