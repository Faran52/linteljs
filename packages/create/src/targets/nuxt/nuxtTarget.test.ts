import {
  byKey,
  componentStyleGates,
  type GateRow,
  mswGates,
  TAILWIND,
  TANSTACK_QUERY,
  walkGates,
  WITH_FORM,
  WITH_I18N,
  WITHOUT_I18N,
} from '@mocks/starterGates';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { LANGUAGES } from '@config/constants';

import { nuxtTarget } from './nuxtTarget';

describe('nuxtTarget', () => {
  it('is the record the nuxt answer names', () => {
    expect(nuxtTarget.id).toBe('nuxt');
  });

  it('writes no document and no vite config of its own', () => {
    expect(nuxtTarget.html).toBe(false);
    expect(nuxtTarget.vitePlugin).toBeUndefined();
  });

  it('translates through vue-i18n, as Vue does', () => {
    expect(nuxtTarget.i18n).toEqual({
      dependencies: ['vue-i18n'],
      testSetup: 'fragments/test-setup/setupTests.vueI18n.ts',
    });
  });
});

const TRANSLATED_GATES: GateRow[] = [
  ...[
    'src/config/statuses.ts',
    'src/config/standard.ts',
    'src/error.test.ts',
    'src/views/AboutView.vue',
    'src/views/VersionView.vue',
    'src/components/features/app-header/AppHeader.vue',
    'src/components/features/app-header/AppHeader.test.ts',
    'src/components/features/status-page/StatusPage.vue',
    'src/components/features/status-page/StatusPage.test.ts',
  ]
    .flatMap((key): GateRow[] => {
      return [[key, WITHOUT_I18N], [`${key}@i18n`, WITH_I18N]];
    }),
  ...[
    'src/components/features/language-select/LanguageSelect.vue',
    'src/components/features/language-select/LanguageSelect.test.ts',
    'src/components/ui/code-text/CodeText.vue',
    'src/components/ui/code-text/CodeText.test.ts',
    'src/i18n/index.ts',
    'src/i18n/index.test.ts',
    'src/i18n/locales.test.ts',
    'src/plugins/i18n.ts',
    'src/plugins/i18n.test.ts',
    ...LANGUAGES
      .map((language) => {
        return `src/i18n/locales/${language}/common.json`;
      }),
  ]
    .map((key): GateRow => {
      return [`${key}@i18n`, WITH_I18N];
    }),
];

const GATES: GateRow[] = [
  ...TRANSLATED_GATES,
  ...mswGates(false),
  ...componentStyleGates('app-mark/AppMark', 'app-button/AppButton', true),
  ['src/lib/composables/use-extended-query/useExtendedQuery.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/composables/use-extended-mutation/useExtendedMutation.ts@tanstack-query', TANSTACK_QUERY],
  ['src/styles/theme.css@tailwind', TAILWIND],
  ['../components/ui/text-input/TextInput.css', WITH_FORM],
  ['src/lib/composables/use-extended-query/useExtendedQuery.test.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/composables/use-extended-mutation/useExtendedMutation.test.ts@tanstack-query', TANSTACK_QUERY],
];

describe('the starter gates', () => {
  const walk = walkGates(() => {
    return nuxtTarget;
  }, 'nuxt');

  it('write at most one spelling of each destination under any answer set', () => {
    expect(walk.twice).toEqual([]);
  });

  it('are each pinned below, and nothing else is', () => {
    expect(byKey(GATES)).toEqual(walk.gated);
  });

  it.each(GATES)('%s', (key, conditions) => {
    expect(walk.mismatchOf(key, conditions)).toBeUndefined();
  });
});

describe('the favicon', () => {
  it('is the shared Mark, served from where the framework serves a static icon', () => {
    const favicon = nuxtTarget.starterFiles.find((file) => {
      return file.target === 'public/favicon.svg';
    });

    expect(favicon).toEqual({
      target: 'public/favicon.svg',
      shared: true,
    });
  });
});
