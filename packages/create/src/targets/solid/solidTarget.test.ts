import {
  ANSWERED,
  byKey,
  componentStyleGates,
  type Condition,
  contactGates,
  type GateRow,
  mswGates,
  NOT_TANSTACK_QUERY,
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

import { solidTarget } from './solidTarget';

describe('solidTarget', () => {
  it('is the record the solid answer names', () => {
    expect(solidTarget.id).toBe('solid');
  });

  it('takes the solid framework layer', () => {
    expect(solidTarget.framework).toBe('solid');
  });

  it('names files the way any JSX target does', () => {
    expect(solidTarget.naming).toEqual(componentNaming());
  });

  it('admits the route segments a file-based router owns', () => {
    const expected = { 'src/**/': FOLDER_ROUTED };
    expect(solidTarget.folderNaming).toEqual(expected);
  });

  it('translates through the Solid primitive alone, with no compiler and no test setup', () => {
    const expected = { dependencies: ['@solid-primitives/i18n'] };
    expect(solidTarget.i18n).toEqual(expected);
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
  'src/index.tsx',
  'src/config/statuses.ts',
  'src/config/standard.ts',
  'src/pages/about/AboutPage.tsx',
  'src/pages/version/VersionPage.tsx',
  'src/components/features/app-header/AppHeader.tsx',
  'src/components/features/status-page/StatusPage.tsx',
];

const I18N_ONLY_PATHS = [
  'src/components/features/app-header/AppHeader.test.tsx',
  'src/components/features/language-select/LanguageSelect.tsx',
  'src/components/features/language-select/LanguageSelect.test.tsx',
  'src/components/ui/code-text/CodeText.tsx',
  'src/components/ui/code-text/CodeText.test.tsx',
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
  ['src/pages/contact/ContactPage.tsx', FORM_ENGLISH],
  ['src/pages/contact/ContactPage.tsx@i18n', FORM_I18N],
  ...I18N_ONLY_PATHS
    .map((key): GateRow => {
      const row: GateRow = [`${key}@i18n`, WITH_I18N];

      return row;
    }),
];

const GATES: GateRow[] = [
  ...mswGates(true),
  ...componentStyleGates('mark/Mark', 'button/Button', true),
  ...contactGates(['tanstack-query']),
  ...TRANSLATED_GATES,
  ['src/pages/routes.tsx', WITHOUT_FORM],
  ['src/pages/routes.tsx@with-form', WITH_FORM],
  ['src/pages/home/HomePage.tsx', WITHOUT_STORE],
  ['src/pages/home/HomePage.tsx@with-store', WITH_STORE],
  ['src/pages/contact/useContactForm.ts', WITH_FORM],
  ['src/components/ui/index.ts', WITHOUT_FORM],
  ['src/components/ui/index.ts@with-form', WITH_FORM],
  ['src/components/ui/text-input/TextInput.tsx', WITH_FORM],
  ['src/lib/primitives/create-extended-query/createExtendedQuery.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/primitives/create-extended-mutation/createExtendedMutation.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/providers/data/DataProvider.tsx', NOT_TANSTACK_QUERY],
  ['src/lib/providers/data/DataProvider.tsx@tanstack-query', TANSTACK_QUERY],
  ['src/lib/store/counter/counterStore.ts@tanstack-store', [{ store: ['tanstack-store'] }]],
  ['src/styles/theme.css@tailwind', TAILWIND],
  ['./components/ui/text-input/TextInput.css', WITH_FORM],
  ['src/pages/home/HomePage.test.tsx', WITHOUT_STORE],
  ['src/pages/home/HomePage.test.tsx@with-store', WITH_STORE],
  ['src/lib/primitives/create-extended-query/createExtendedQuery.test.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/primitives/create-extended-mutation/createExtendedMutation.test.ts@tanstack-query', TANSTACK_QUERY],
];

describe('the starter gates', () => {
  const walk = walkGates(() => {
    return solidTarget;
  }, 'solid');

  it('write at most one spelling of each destination under any answer set', () => {
    expect(walk.twice).toEqual([]);
  });

  it('are each pinned below, and nothing else is', () => {
    const actual = byKey(GATES);
    expect(actual).toEqual(walk.gated);
  });

  it.each(GATES)('%s', (key, conditions) => {
    const mismatch = walk.mismatchOf(key, conditions);
    expect(mismatch).toBeUndefined();
  });
});

describe('the favicon', () => {
  it('is the shared Mark, served from where the framework serves a static icon', () => {
    const favicon = solidTarget.starterFiles.find((file) => {
      return file.target === 'public/favicon.svg';
    });

    const expected = {
      target: 'public/favicon.svg',
      shared: true,
    };
    expect(favicon).toEqual(expected);
  });
});
