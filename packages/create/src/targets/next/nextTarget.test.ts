import {
  ANSWERED,
  byKey,
  componentStyleGates,
  type Condition,
  contactGates,
  type GateRow,
  mswGates,
  NOT_TANSTACK_QUERY,
  RTK_QUERY,
  STYLEX,
  TAILWIND,
  TANSTACK_QUERY,
  walkGates,
  WITH_FORM,
  WITH_I18N,
  WITH_STORE,
  WITHOUT_FORM,
  WITHOUT_I18N,
  WITHOUT_STORE,
} from '@mocks/starterGates';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { LANGUAGES } from '@config/constants';

import { FOLDER_ROUTED } from '../constants';
import { componentNaming } from '../utils/namingUtils';

import { nextTarget } from './nextTarget';

describe('nextTarget', () => {
  it('is the record the next answer names', () => {
    expect(nextTarget.id).toBe('next');
  });

  it('owns its document rather than writing one', () => {
    expect(nextTarget.html).toBe(false);
    expect(nextTarget.htmlEntry).toBeUndefined();
  });

  it('carries no vite build', () => {
    expect(nextTarget.vitePlugin).toBeUndefined();
    expect(nextTarget.build).toBe('next build');
  });

  it('names files the way any JSX target does', () => {
    expect(nextTarget.naming).toEqual(componentNaming('app'));
  });

  it('translates through next-intl, with no setup file: each suite wraps its own provider', () => {
    const expected = { dependencies: ['next-intl'] };
    expect(nextTarget.i18n).toEqual(expected);
  });

  it('admits the route segments a file-based router owns', () => {
    const expected = { 'src/**/': FOLDER_ROUTED };
    expect(nextTarget.folderNaming).toEqual(expected);
  });
});

const FORM_ENGLISH: readonly Condition[] = [{
  form: ANSWERED,
  languages: [undefined],
}];
const FORM_I18N: readonly Condition[] = [{
  form: ANSWERED,
  languages: ANSWERED,
}];

const BILINGUAL_PATHS = [
  'src/config/statuses.ts',
  'src/config/standard.ts',
  'src/app/layout.tsx',
  'src/app/global-error.tsx',
  'src/app/about/page.tsx',
  'src/app/about/page.test.tsx',
  'src/app/version/page.tsx',
  'src/app/version/page.test.tsx',
  'src/app/contact/page.test.tsx',
  'src/app/not-found.test.tsx',
  'src/app/error.test.tsx',
  'src/components/features/status-page/StatusPage.tsx',
  'src/components/features/status-page/StatusPage.test.tsx',
  'src/components/features/app-header/AppHeader.tsx',
  'src/components/features/app-header/AppHeader.test.tsx',
];

const I18N_ONLY_PATHS = [
  'src/components/features/language-select/LanguageSelect.tsx',
  'src/components/features/language-select/LanguageSelect.test.tsx',
  'src/lib/providers/i18n/I18nProvider.tsx',
  'src/lib/providers/i18n/I18nProvider.test.tsx',
  'src/i18n/index.ts',
  'src/i18n/index.test.ts',
  'src/i18n/locales.test.ts',
  ...LANGUAGES
    .map((language) => {
      return `src/i18n/locales/${language}/common.json`;
    }),
];

const TRANSLATED_GATES: GateRow[] = [
  ...BILINGUAL_PATHS
    .flatMap((key): GateRow[] => {
      const rows: GateRow[] = [[key, WITHOUT_I18N], [`${key}@i18n`, WITH_I18N]];

      return rows;
    }),
  ['src/app/contact/page.tsx', FORM_ENGLISH],
  ['src/app/contact/page.tsx@i18n', FORM_I18N],
  ...I18N_ONLY_PATHS
    .map((key): GateRow => {
      const row: GateRow = [`${key}@i18n`, WITH_I18N];

      return row;
    }),
];

const GATES: GateRow[] = [
  ...TRANSLATED_GATES,
  ...mswGates(true),
  ...componentStyleGates('mark/Mark', 'button/Button', true),
  ...contactGates(['tanstack-query', 'rtk-query']),
  ['.babelrc@stylex', STYLEX],
  ['postcss.config.mjs@stylex', STYLEX],
  ['postcss.config.mjs@tailwind', TAILWIND],
  ['src/config/routes.ts', WITHOUT_FORM],
  ['src/config/routes.ts@with-form', WITH_FORM],
  ['src/app/page.tsx', WITHOUT_STORE],
  ['src/app/page.tsx@with-store', WITH_STORE],
  ['src/app/contact/useContactForm.ts@tanstack-form', [{ form: ['tanstack-form'] }]],
  ['src/app/contact/useContactForm.ts@react-hook-form', [{ form: ['react-hook-form'] }]],
  ['src/components/ui/index.ts', WITHOUT_FORM],
  ['src/components/ui/index.ts@with-form', WITH_FORM],
  ['src/components/ui/text-input/TextInput.tsx', WITH_FORM],
  ['src/lib/apis/base/baseApi.ts@rtk-query', RTK_QUERY],
  ['src/lib/hooks/use-extended-query/useExtendedQuery.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/hooks/use-extended-mutation/useExtendedMutation.ts@tanstack-query', TANSTACK_QUERY],
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
  ['../components/ui/text-input/TextInput.css', WITH_FORM],
  ['src/app/page.test.tsx', WITHOUT_STORE],
  ['src/app/page.test.tsx@with-store', WITH_STORE],
  ['src/lib/apis/base/baseApi.test.ts@rtk-query', RTK_QUERY],
  ['src/lib/hooks/use-extended-query/useExtendedQuery.test.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/hooks/use-extended-mutation/useExtendedMutation.test.ts@tanstack-query', TANSTACK_QUERY],
];

describe('the starter gates', () => {
  it('write at most one spelling of each destination under any answer set', () => {
    const walk = walkGates(() => {
      return nextTarget;
    }, 'next');
    expect(walk.twice).toEqual([]);
  });

  it('are each pinned below, and nothing else is', () => {
    const walk = walkGates(() => {
      return nextTarget;
    }, 'next');
    const actual = byKey(GATES);
    expect(actual).toEqual(walk.gated);
  });

  it('each write exactly under the conditions pinned below', () => {
    const walk = walkGates(() => {
      return nextTarget;
    }, 'next');
    const mismatches = walk.mismatchesOf(GATES);
    expect(mismatches).toEqual([]);
  });
});

describe('the favicon', () => {
  it('is the shared Mark, served from where the framework serves a static icon', () => {
    const favicon = nextTarget.starterFiles.find((file) => {
      return file.target === 'src/app/icon.svg';
    });

    const expected = {
      target: 'src/app/icon.svg',
      shared: true,
      source: 'public/favicon.svg',
    };
    expect(favicon).toEqual(expected);
  });
});
