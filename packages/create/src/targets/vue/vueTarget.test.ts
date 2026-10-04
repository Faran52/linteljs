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

import { vueTarget } from './vueTarget';

import type { Answers } from '@config/types';

const recordFor = (): ReturnType<typeof vueTarget> => {
  return vueTarget({
    ...DEFAULT_ANSWERS,
    target: 'vue',
  });
};

const destinationsFor = (overrides: Partial<Answers> = {}): string[] => {
  const answers: Answers = {
    ...DEFAULT_ANSWERS,
    target: 'vue',
    ...overrides,
  };

  return vueTarget(answers).starterFiles
    .filter((file) => {
      return file.when === undefined || file.when(answers);
    })
    .map((file) => {
      return file.target;
    });
};

describe('vueTarget', () => {
  it('routes whatever was answered', () => {
    const destinations = destinationsFor();
    expect(destinations).toContain('src/router/index.ts');

    const headers = destinationsFor({ languages: ['ar'] })
      .filter((target) => {
        return target === 'src/components/features/app-header/AppHeader.vue';
      });

    expect(headers).toHaveLength(1);
  });

  it('takes one store module per store it offers, and none without one', () => {
    const destinations = destinationsFor();
    expect(destinations).not.toContain('src/lib/store/counter/counterStore.ts');
    const withPinia = destinationsFor({ store: 'pinia' });
    expect(withPinia).toContain('src/lib/store/counter/counterStore.ts');
    const withTanstackStore = destinationsFor({ store: 'tanstack-store' });
    expect(withTanstackStore).toContain('src/lib/store/counter/counterStore.ts');
  });

  it('installs a store plugin only for the store that needs one', () => {
    const record = recordFor();

    const installs = (store: Answers['store']): string | undefined => {
      const answers: Answers = {
        ...DEFAULT_ANSWERS,
        target: 'vue',
      };

      if (store !== undefined) {
        answers.store = store;
      }

      return record.starterFiles
        .find((file) => {
          return file.target === 'src/lib/providers/store/storeProvider.ts'
            && (file.when === undefined || file.when(answers));
        })?.variant;
    };

    const actual = installs('pinia');
    expect(actual).toBe('pinia');
    const tanstackStore = installs('tanstack-store');
    expect(tanstackStore).toBeUndefined();
    const storeless = installs(undefined);
    expect(storeless).toBeUndefined();
  });

  it('ships a button under no answers, since the status page retries with it', () => {
    const destinations = destinationsFor();
    expect(destinations).toContain('src/components/ui/app-button/AppButton.vue');
  });

  it('names a single-file component by its own extension', () => {
    const record = recordFor();
    expect(record.sfcExtension).toBe('vue');
  });

  it('translates through vue-i18n, installed on every mount by the test setup', () => {
    const record = recordFor();
    const expected = {
      dependencies: ['vue-i18n'],
      testSetup: 'fragments/test-setup/setupTests.vueI18n.ts',
    };
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
  'src/config/statuses.ts',
  'src/config/standard.ts',
  'src/main.ts',
  'src/App.test.ts',
  'src/views/AboutView.vue',
  'src/views/VersionView.vue',
  'src/components/features/app-header/AppHeader.vue',
  'src/components/features/status-page/StatusPage.vue',
  'src/components/features/status-page/StatusPage.test.ts',
];

const I18N_ONLY_PATHS = [
  'src/components/features/language-select/LanguageSelect.vue',
  'src/components/features/language-select/LanguageSelect.test.ts',
  'src/components/ui/code-text/CodeText.vue',
  'src/components/ui/code-text/CodeText.test.ts',
  'src/i18n/index.ts',
  'src/i18n/index.test.ts',
  'src/i18n/locales.test.ts',
  'src/i18n/utils/languageUtils.ts',
  'src/i18n/utils/languageUtils.test.ts',
  'src/i18n/utils/cookieUtils.ts',
  'src/i18n/utils/cookieUtils.test.ts',
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
  ['src/views/ContactView.vue', FORM_ENGLISH],
  ['src/views/ContactView.vue@i18n', FORM_I18N],
  ...I18N_ONLY_PATHS
    .map((key): GateRow => {
      const row: GateRow = [`${key}@i18n`, WITH_I18N];

      return row;
    }),
];

const GATES: GateRow[] = [
  ...TRANSLATED_GATES,
  ...mswGates(true),
  ...componentStyleGates('app-mark/AppMark', 'app-button/AppButton', true),
  ...contactGates(['tanstack-query']),
  ['src/views/routes.ts', WITHOUT_FORM],
  ['src/views/routes.ts@with-form', WITH_FORM],
  ...homeGates('src/views/HomeView.vue'),
  ['src/views/useContactForm.ts', WITH_FORM],
  ['src/components/ui/text-input/TextInput.vue', WITH_FORM],
  ['src/components/ui/text-input/types.ts', WITH_FORM],
  ['src/lib/composables/use-extended-query/useExtendedQuery.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/composables/use-extended-mutation/useExtendedMutation.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/utils/queryOptionsUtils.ts', TANSTACK_QUERY],
  ['src/lib/providers/data/dataProvider.ts', NOT_TANSTACK_QUERY],
  ['src/lib/providers/data/dataProvider.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/providers/store/storeProvider.ts', [{ store: [undefined, 'tanstack-store'] }]],
  ['src/lib/providers/store/storeProvider.ts@pinia', [{ store: ['pinia'] }]],
  ['src/lib/store/counter/counterStore.ts@pinia', [{ store: ['pinia'] }]],
  ['src/lib/store/counter/counterStore.ts@tanstack-store', [{ store: ['tanstack-store'] }]],
  ['src/styles/theme.css@tailwind', TAILWIND],
  ['../components/ui/text-input/TextInput.css', WITH_FORM],
  ['src/lib/composables/use-extended-query/useExtendedQuery.test.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/composables/use-extended-mutation/useExtendedMutation.test.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/utils/queryOptionsUtils.test.ts', TANSTACK_QUERY],
];

describe('the starter gates', () => {
  it('write at most one spelling of each destination under any answer set', () => {
    const walk = walkGates(vueTarget, 'vue');
    expect(walk.twice).toEqual([]);
  });

  it('are each pinned below, and nothing else is', () => {
    const walk = walkGates(vueTarget, 'vue');
    const actual = byKey(GATES);
    expect(actual).toEqual(walk.gated);
  });

  it('each write exactly under the conditions pinned below', () => {
    const walk = walkGates(vueTarget, 'vue');
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
