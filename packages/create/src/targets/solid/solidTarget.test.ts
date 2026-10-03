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

import { DEFAULT_ANSWERS } from '@answers';

import { FOLDER_ROUTED } from '../constants';
import { componentNaming } from '../utils/namingUtils';

import { solidTarget } from './solidTarget';

const recordFor = (): ReturnType<typeof solidTarget> => {
  return solidTarget({
    ...DEFAULT_ANSWERS,
    target: 'solid',
  });
};

describe('solidTarget', () => {
  it('is the record the solid answer names', () => {
    const record = recordFor();
    expect(record.id).toBe('solid');
  });

  it('takes the solid framework layer', () => {
    const record = recordFor();
    expect(record.framework).toBe('solid');
  });

  it('names files the way any JSX target does', () => {
    const record = recordFor();
    expect(record.naming).toEqual(componentNaming());
  });

  it('admits the route segments a file-based router owns', () => {
    const record = recordFor();
    const expected = { 'src/**/': FOLDER_ROUTED };
    expect(record.folderNaming).toEqual(expected);
  });

  it('translates through the Solid primitive alone, with no compiler and no test setup', () => {
    const record = recordFor();
    const expected = { dependencies: ['@solid-primitives/i18n'] };
    expect(record.i18n).toEqual(expected);
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
  it('write at most one spelling of each destination under any answer set', () => {
    const walk = walkGates(solidTarget, 'solid');
    expect(walk.twice).toEqual([]);
  });

  it('are each pinned below, and nothing else is', () => {
    const walk = walkGates(solidTarget, 'solid');
    const actual = byKey(GATES);
    expect(actual).toEqual(walk.gated);
  });

  it('each write exactly under the conditions pinned below', () => {
    const walk = walkGates(solidTarget, 'solid');
    const mismatches = walk.mismatchesOf(GATES);
    expect(mismatches).toEqual([]);
  });
});

describe('the favicon', () => {
  it('is the shared Mark, served from where the framework serves a static icon', () => {
    const record = recordFor();
    const favicon = record.starterFiles
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
