import {
  ANSWERED,
  byKey,
  componentStyleGates,
  contactCopyGates,
  contactGates,
  type GateRow,
  mswGates,
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

import { nuxtTarget } from './nuxtTarget';

const recordFor = (): ReturnType<typeof nuxtTarget> => {
  return nuxtTarget({
    ...DEFAULT_ANSWERS,
    target: 'nuxt',
  });
};

describe('nuxtTarget', () => {
  it('is the record the nuxt answer names', () => {
    const record = recordFor();
    expect(record.id).toBe('nuxt');
  });

  it('writes no document and no vite config of its own', () => {
    const record = recordFor();
    expect(record.html).toBe(false);
    expect(record.vitePlugin).toBeUndefined();
  });

  it('translates through vue-i18n, as Vue does', () => {
    const record = recordFor();
    const expected = {
      dependencies: ['vue-i18n'],
      testSetup: 'fragments/test-setup/setupTests.vueI18n.ts',
    };
    expect(record.i18n).toEqual(expected);
  });
});

const BILINGUAL_PATHS = [
  'src/config/statuses.ts',
  'src/config/standard.ts',
  'src/error.test.ts',
  'src/views/home/HomeView.vue',
  'src/views/home/HomeView.test.ts',
  'src/views/about/AboutView.vue',
  'src/views/version/VersionView.vue',
  'src/components/features/app-header/AppHeader.vue',
  'src/components/features/app-header/AppHeader.test.ts',
  'src/components/features/status-page/StatusPage.vue',
  'src/components/features/status-page/StatusPage.test.ts',
];

const I18N_ONLY_PATHS = [
  'src/components/features/language-select/LanguageSelect.vue',
  'src/components/features/language-select/LanguageSelect.test.ts',
  'src/components/ui/code-text/CodeText.vue',
  'src/components/ui/code-text/CodeText.test.ts',
  'src/i18n/i18n.ts',
  'src/i18n/i18n.test.ts',
  'src/i18n/locales.test.ts',
  'src/i18n/utils/languageUtils.ts',
  'src/i18n/utils/languageUtils.test.ts',
  'src/i18n/utils/cookieUtils.ts',
  'src/i18n/utils/cookieUtils.test.ts',
  'src/plugins/i18n.ts',
  'src/plugins/i18n.test.ts',
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
  ...I18N_ONLY_PATHS
    .map((key): GateRow => {
      const row: GateRow = [`${key}@i18n`, WITH_I18N];

      return row;
    }),
];

const GATES: GateRow[] = [
  ...TRANSLATED_GATES,
  ...contactCopyGates('src/views/contact/ContactView.vue'),
  ...mswGates(true),
  ['src/plugins/msw.client.ts', [{ mocking: ['msw'] }]],
  ...componentStyleGates([
    'app-mark/AppMark',
    'app-button/AppButton',
    'text-input/TextInput',
  ]),
  ...contactGates(['tanstack-query']),
  ['src/config/routes.ts', WITHOUT_FORM],
  ['src/config/routes.ts@with-form', WITH_FORM],
  ['src/pages/contact.vue', WITH_FORM],
  ['src/plugins/data.ts', WITH_FORM],
  ['src/views/contact/use-contact-form/useContactForm.ts', WITH_FORM],
  ['src/components/ui/text-input/TextInput.vue', WITH_FORM],
  ['src/components/ui/text-input/types.ts', WITH_FORM],
  ['src/lib/providers/data/dataProvider.ts', [{
    form: ANSWERED,
    data: [undefined, 'rtk-query'],
  }]],
  ['src/lib/providers/data/dataProvider.ts@tanstack-query', [{
    form: ANSWERED,
    data: ['tanstack-query'],
  }]],
  ['../components/ui/text-input/TextInput.css', WITH_FORM],
  ['src/lib/composables/use-extended-query/useExtendedQuery.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/composables/use-extended-mutation/useExtendedMutation.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/utils/queryOptionsUtils.ts', TANSTACK_QUERY],
  ['src/styles/theme.css@tailwind', TAILWIND],
  ['src/lib/composables/use-extended-query/useExtendedQuery.test.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/composables/use-extended-mutation/useExtendedMutation.test.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/utils/queryOptionsUtils.test.ts', TANSTACK_QUERY],
];

describe('the starter gates', () => {
  it('write at most one spelling of each destination under any answer set', () => {
    const walk = walkGates(nuxtTarget, 'nuxt');
    expect(walk.twice).toEqual([]);
  });

  it('are each pinned below, and nothing else is', () => {
    const walk = walkGates(nuxtTarget, 'nuxt');
    const actual = byKey(GATES);
    expect(actual).toEqual(walk.gated);
  });

  it('each write exactly under the conditions pinned below', () => {
    const walk = walkGates(nuxtTarget, 'nuxt');
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
