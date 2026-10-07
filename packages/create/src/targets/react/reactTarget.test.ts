import {
  ANSWERED,
  byKey,
  componentStyleGates,
  type Condition,
  contactGates,
  type GateRow,
  homeGates,
  mswGates,
  NOT_TANSTACK_QUERY,
  RTK_QUERY,
  TAILWIND,
  TANSTACK_QUERY,
  walkGates,
  WITH_FORM,
  WITH_I18N,
  WITHOUT_FORM,
  WITHOUT_I18N,
} from '@mocks/starterGates';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { LANGUAGES } from '@config/constants';

import { DEFAULT_ANSWERS } from '@answers';

import { COMPONENT } from '../constants';

import { reactTarget } from './reactTarget';

import type { Answers } from '@config/types';

const recordFor = (overrides: Partial<Answers> = {}): ReturnType<typeof reactTarget> => {
  return reactTarget({
    ...DEFAULT_ANSWERS,
    target: 'react',
    ...overrides,
  });
};

describe('reactTarget', () => {
  it('is the record the react answer names', () => {
    expect(recordFor().id).toBe('react');
  });

  it('hands framework mode the build, and takes its document away', () => {
    const framework = recordFor({ router: 'react-router-framework' });

    expect(framework.build).toBe('react-router build');
    expect(framework.typecheck).toBe('react-router typegen && tsc --noEmit');
    expect(framework.htmlEntry).toBeUndefined();
    expect(recordFor({ router: 'react-router' }).htmlEntry).toBe('src/main.tsx');
  });

  it('answers the /.well-known/ probes Chrome DevTools sends in framework mode with an empty 404', () => {
    const [probes = ''] = recordFor({ router: 'react-router-framework' }).vitePlugin?.calls ?? [];

    expect(probes).toContain("request.url?.startsWith('/.well-known/') === true");
    expect(probes).toContain('response.statusCode = 404;');
  });

  it.each([
    'react-router',
    'react-router-framework',
    'tanstack-router',
  ] as const)('aliases the route table, then the pages it imports, for %s', (router) => {
    const expected = { '@router/*': './src/router/*', '@pages/*': './src/pages/*' };
    const { routeAlias } = recordFor({ router });

    expect(routeAlias).toEqual(expected);
  });

  it('installs the compiler only where react() builds', () => {
    expect(recordFor().devDependencies).toContain('oxc-transform-react');
    expect(recordFor({ router: 'react-router-framework' }).devDependencies).not.toContain('oxc-transform-react');
    expect(recordFor({ router: 'react-router-framework' }).devDependencies).toContain('@vitejs/plugin-react');
  });

  it('translates every mode, through i18next', () => {
    const expected = {
      dependencies: [
        'i18next',
        'react-i18next',
      ],
      testSetup: 'fragments/test-setup/setupTests.i18n.ts',
    };
    expect(recordFor().i18n).toEqual(expected);

    expect(recordFor({ router: 'tanstack-router' }).i18n).toEqual(recordFor().i18n);
    expect(recordFor({ router: 'react-router-framework' }).i18n).toEqual(recordFor().i18n);
  });

  it('ships one entry and its translated twin, and an App per router it offers plus one for no router', () => {
    const mains = recordFor().starterFiles
      .filter((file) => {
        return file.target === 'src/main.tsx';
      })
      .map(({ variant }) => {
        return variant;
      });

    const expected = [undefined, 'i18n'];
    expect(mains).toEqual(expected);

    const appVariants = recordFor().starterFiles
      .filter((file) => {
        return file.target === 'src/App.tsx';
      })
      .map((file) => {
        return file.variant;
      });

    const routerVariants = [
      undefined,
      'react-router',
      'tanstack-router',
    ];
    expect(appVariants).toEqual(routerVariants);
  });

  it('ships the mocking layer only when msw was answered, and picks the handlers by whether a form was', () => {
    const sourcesFor = (overrides: Partial<Answers>): Record<string, string | undefined> => {
      const answers: Answers = {
        ...DEFAULT_ANSWERS,
        target: 'react',
        ...overrides,
      };

      const entries = recordFor(overrides).starterFiles
        .filter((file) => {
          return file.when === undefined || file.when(answers);
        })
        .map((file) => {
          const entry: [string, string | undefined] = [file.target, file.variant];
          return entry;
        });
      const variantByTarget = Object.fromEntries(entries);
      return variantByTarget;
    };

    const sources = sourcesFor({});
    expect(sources).not.toHaveProperty('__mocks__/msw/handlers.ts');
    const mswSources = sourcesFor({ mocking: 'msw' });
    expect(mswSources).toHaveProperty('src/lib/utils/fetchExtendedUtils.ts');
    expect(mswSources['__mocks__/msw/handlers.ts']).toBeUndefined();

    const source = sourcesFor({
      mocking: 'msw',
      form: 'tanstack-form',
    })['__mocks__/msw/handlers.ts'];

    expect(source).toBe('with-form');
  });

  it('picks the handler suite the same way the handlers are picked', () => {
    const suitesFor = (overrides: Partial<Answers>): Record<string, string | undefined> => {
      const answers: Answers = {
        ...DEFAULT_ANSWERS,
        target: 'react',
        ...overrides,
      };

      const entries = recordFor(overrides).starterTests
        .filter((test) => {
          return test.when === undefined || test.when(answers);
        })
        .map((test) => {
          const entry: [string, string | undefined] = [test.target, test.variant];
          return entry;
        });
      const variantByTarget = Object.fromEntries(entries);
      return variantByTarget;
    };

    const suites = suitesFor({});
    expect(suites).not.toHaveProperty('__mocks__/msw/handlers.test.ts');
    const mswSuites = suitesFor({ mocking: 'msw' });
    expect(mswSuites['__mocks__/msw/handlers.test.ts']).toBeUndefined();
    expect(mswSuites).toHaveProperty('src/lib/utils/fetchExtendedUtils.test.ts');

    const suite = suitesFor({
      mocking: 'msw',
      form: 'tanstack-form',
    })['__mocks__/msw/handlers.test.ts'];

    expect(suite).toBe('with-form');
  });

  it('marks a .tsx file a component wherever it sits', () => {
    expect(recordFor().naming['src/**/*.tsx']).toBe(COMPONENT);
  });
});

const NO_ROUTER: readonly Condition[] = [{ router: [undefined] }];
const ROUTERLESS_ENGLISH: readonly Condition[] = [{
  router: [undefined],
  languages: [undefined],
}];
const ROUTERLESS_I18N: readonly Condition[] = [{
  router: [undefined],
  languages: ANSWERED,
}];
const FRAMEWORK_MODE: readonly Condition[] = [{ router: ['react-router-framework'] }];
const FRAMEWORK_WITHOUT_FORM: readonly Condition[] = [{
  router: ['react-router-framework'],
  form: [undefined],
}];
const FRAMEWORK_WITH_FORM: readonly Condition[] = [{
  router: ['react-router-framework'],
  form: ANSWERED,
}];

const FORM_ENGLISH: readonly Condition[] = [{
  form: ANSWERED,
  languages: [undefined],
}];
const FORM_I18N: readonly Condition[] = [{
  form: ANSWERED,
  languages: ANSWERED,
}];

const PAGES = ['about/AboutPage', 'version/VersionPage'];

const DATA_ROUTER: readonly Condition[] = [{ router: ['react-router', 'react-router-framework'] }];

const GATES: GateRow[] = [
  ...mswGates(true),
  ...componentStyleGates([
    'mark/Mark',
    'button/Button',
    'text-input/TextInput',
  ]),
  ['src/main.tsx', [{
    router: [
      undefined,
      'react-router',
      'tanstack-router',
    ],
    languages: [undefined],
  }]],
  ['src/main.tsx@i18n', [{
    router: [
      undefined,
      'react-router',
      'tanstack-router',
    ],
    languages: ANSWERED,
  }]],
  ['src/config/statuses.ts', WITHOUT_I18N],
  ['src/config/statuses.ts@i18n', WITH_I18N],
  ['src/config/standard.ts', WITHOUT_I18N],
  ['src/config/standard.ts@i18n', WITH_I18N],
  ...PAGES
    .flatMap((page): GateRow[] => {
      const rows: GateRow[] = [
        [`src/pages/${page}.tsx`, WITHOUT_I18N],
        [`src/pages/${page}.tsx@i18n`, WITH_I18N],
        [`src/pages/${page}.test.tsx`, WITHOUT_I18N],
        [`src/pages/${page}.test.tsx@i18n`, WITH_I18N],
      ];
      return rows;
    }),
  ['src/components/features/status-page/StatusPage.tsx', WITHOUT_I18N],
  ['src/components/features/status-page/StatusPage.tsx@i18n', WITH_I18N],
  ['src/components/features/status-page/StatusPage.test.tsx', WITHOUT_I18N],
  ['src/components/features/status-page/StatusPage.test.tsx@i18n', WITH_I18N],
  ['src/components/features/app-header/AppHeader.tsx@i18n', ROUTERLESS_I18N],
  ['src/components/features/app-header/AppHeader.test.tsx@i18n', ROUTERLESS_I18N],
  ['src/i18n/i18n.ts@i18n', WITH_I18N],
  ['src/i18n/i18n.test.ts@i18n', WITH_I18N],
  ['src/i18n/locales.test.ts@i18n', WITH_I18N],
  ['src/i18n/utils/languageUtils.ts@i18n', WITH_I18N],
  ['src/i18n/utils/languageUtils.test.ts@i18n', WITH_I18N],
  ['src/i18n/utils/cookieUtils.ts@i18n', WITH_I18N],
  ['src/i18n/utils/cookieUtils.test.ts@i18n', WITH_I18N],
  ...LANGUAGES
    .map((language): GateRow => {
      const row: GateRow = [`src/i18n/locales/${language}/common.json@i18n`, WITH_I18N];
      return row;
    }),
  ['src/App.tsx', NO_ROUTER],
  ['src/App.tsx@react-router', [{ router: ['react-router'] }]],
  ['src/App.tsx@tanstack-router', [{ router: ['tanstack-router'] }]],
  ['src/components/features/app-header/AppHeader.tsx', ROUTERLESS_ENGLISH],
  ['src/components/features/error-boundary/ErrorBoundary.tsx', NO_ROUTER],
  ['src/components/features/route-error/RouteError.tsx@react-router', DATA_ROUTER],
  ['src/components/features/route-error/RouteError.tsx@tanstack-router', [{ router: ['tanstack-router'] }]],
  ['src/components/features/route-error/RouteError.test.tsx@react-router', DATA_ROUTER],
  ['src/components/features/route-error/RouteError.test.tsx@tanstack-router', [{ router: ['tanstack-router'] }]],
  ['src/components/features/app-header/AppHeader.tsx@react-router', [{
    router: ['react-router', 'react-router-framework'],
    languages: [undefined],
  }]],
  ['src/components/features/app-header/AppHeader.tsx@react-router-i18n', [{
    router: ['react-router', 'react-router-framework'],
    languages: ANSWERED,
  }]],
  ['src/components/features/app-header/AppHeader.tsx@tanstack-router', [{
    router: ['tanstack-router'],
    languages: [undefined],
  }]],
  ['src/components/features/app-header/AppHeader.tsx@tanstack-router-i18n', [{
    router: ['tanstack-router'],
    languages: ANSWERED,
  }]],
  ['src/components/features/language-select/LanguageSelect.tsx@i18n', WITH_I18N],
  ['src/components/features/language-select/LanguageSelect.test.tsx@i18n', WITH_I18N],
  ['src/root.tsx@react-router-framework', [{
    router: ['react-router-framework'],
    styling: [undefined, 'tailwind'],
    languages: [undefined],
  }]],
  ['src/root.tsx@react-router-framework-i18n', [{
    router: ['react-router-framework'],
    styling: [undefined, 'tailwind'],
    languages: ANSWERED,
  }]],
  ['src/root.tsx@stylex', [{
    router: ['react-router-framework'],
    styling: ['stylex'],
    languages: [undefined],
  }]],
  ['src/root.tsx@stylex-i18n', [{
    router: ['react-router-framework'],
    styling: ['stylex'],
    languages: ANSWERED,
  }]],
  ['src/routes.ts@react-router-framework', FRAMEWORK_WITHOUT_FORM],
  ['src/routes.ts@with-form', FRAMEWORK_WITH_FORM],
  ['src/routes/contact/ContactRoute.tsx@react-router-framework', FRAMEWORK_WITH_FORM],
  ['src/routes/home/HomeRoute.tsx@react-router-framework', FRAMEWORK_MODE],
  ['src/routes/about/AboutRoute.tsx@react-router-framework', FRAMEWORK_MODE],
  ['src/routes/version/VersionRoute.tsx@react-router-framework', FRAMEWORK_MODE],
  ['src/routes/not-found/NotFoundRoute.tsx@react-router-framework', FRAMEWORK_MODE],
  ['src/router/router.tsx', WITHOUT_FORM],
  ['src/router/router.tsx@with-form', WITH_FORM],
  ...homeGates('src/pages/home/HomePage.tsx'),
  ['src/pages/home/HomePage.test.tsx', WITHOUT_I18N],
  ['src/pages/home/HomePage.test.tsx@i18n', WITH_I18N],
  ['src/components/ui/index.ts', WITHOUT_FORM],
  ['src/components/ui/index.ts@with-form', WITH_FORM],
  ['src/components/ui/text-input/TextInput.tsx', WITH_FORM],
  ['src/pages/contact/ContactPage.tsx', FORM_ENGLISH],
  ['src/pages/contact/ContactPage.tsx@i18n', FORM_I18N],
  ['src/pages/contact/ContactPage.test.tsx', FORM_ENGLISH],
  ['src/pages/contact/ContactPage.test.tsx@i18n', FORM_I18N],
  ['src/pages/contact/use-contact-form/useContactForm.ts@tanstack-form', [{ form: ['tanstack-form'] }]],
  ['src/pages/contact/use-contact-form/useContactForm.ts@react-hook-form', [{ form: ['react-hook-form'] }]],
  ...contactGates(['tanstack-query', 'rtk-query']),
  ['src/lib/apis/base/baseApi.ts@rtk-query', RTK_QUERY],
  ['src/lib/hooks/use-extended-query/useExtendedQuery.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/hooks/use-extended-mutation/useExtendedMutation.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/utils/queryOptionsUtils.ts', TANSTACK_QUERY],
  ['src/lib/providers/data/DataProvider.tsx', NOT_TANSTACK_QUERY],
  ['src/lib/providers/data/DataProvider.tsx@tanstack-query', TANSTACK_QUERY],
  ['src/lib/providers/store/StoreProvider.tsx', [{ store: [
    undefined,
    'zustand',
    'tanstack-store',
  ] }]],
  ['src/lib/providers/store/StoreProvider.tsx@redux-toolkit', [{ store: ['redux-toolkit'] }]],
  ['src/lib/store/counter/counterStore.ts@zustand', [{ store: ['zustand'] }]],
  ['src/lib/store/counter/counterStore.ts@tanstack-store', [{ store: ['tanstack-store'] }]],
  ['src/lib/store/counter/counterStore.ts@redux-toolkit', [{
    store: ['redux-toolkit'],
    data: [undefined, 'tanstack-query'],
  }]],
  ['src/lib/store/counter/counterStore.ts@rtk-query', [{
    store: ['redux-toolkit'],
    data: ['rtk-query'],
  }]],
  ['src/styles/theme.css@tailwind', TAILWIND],
  ['./components/ui/text-input/TextInput.css', WITH_FORM],
  ['src/App.test.tsx', NO_ROUTER],
  ['src/App.test.tsx@with-router', [{ router: ['react-router', 'tanstack-router'] }]],
  ['src/components/features/app-header/AppHeader.test.tsx', ROUTERLESS_ENGLISH],
  ['src/components/features/app-header/AppHeader.test.tsx@react-router-framework', FRAMEWORK_MODE],
  ['src/routes.test.ts@react-router-framework', FRAMEWORK_WITHOUT_FORM],
  ['src/routes.test.ts@with-form', FRAMEWORK_WITH_FORM],
  ['src/routes/contact/ContactRoute.test.tsx@react-router-framework', FRAMEWORK_WITH_FORM],
  ['src/routes/home/HomeRoute.test.tsx@react-router-framework', FRAMEWORK_MODE],
  ['src/routes/about/AboutRoute.test.tsx@react-router-framework', FRAMEWORK_MODE],
  ['src/routes/version/VersionRoute.test.tsx@react-router-framework', FRAMEWORK_MODE],
  ['src/routes/not-found/NotFoundRoute.test.tsx@react-router-framework', FRAMEWORK_MODE],
  ['src/lib/apis/base/baseApi.test.ts@rtk-query', RTK_QUERY],
  ['src/lib/hooks/use-extended-query/useExtendedQuery.test.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/hooks/use-extended-mutation/useExtendedMutation.test.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/utils/queryOptionsUtils.test.ts', TANSTACK_QUERY],
];

describe('the starter gates', () => {
  it('write at most one spelling of each destination under any answer set', () => {
    const walk = walkGates(reactTarget, 'react');
    expect(walk.twice).toEqual([]);
  });

  it('are each pinned below, and nothing else is', () => {
    const walk = walkGates(reactTarget, 'react');
    const actual = byKey(GATES);
    expect(actual).toEqual(walk.gated);
  });

  it('each write exactly under the conditions pinned below', () => {
    const walk = walkGates(reactTarget, 'react');
    const mismatches = walk.mismatchesOf(GATES);
    expect(mismatches).toEqual([]);
  });
});

describe('the favicon', () => {
  it('is the shared Mark, served from where the framework serves a static icon', () => {
    const { starterFiles } = recordFor({ router: 'react-router-framework' });
    const favicon = starterFiles
      .find((file) => {
        return file.target === 'public/favicon.svg';
      });

    const expected = {
      target: 'public/favicon.svg',
      shared: true,
    };
    expect(favicon).toEqual(expected);
  });
});
