import {
  ANSWERED,
  byKey,
  type Condition,
  contactGates,
  type GateRow,
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

import { FOLDER_ROUTED } from '../constants';
import { componentNaming } from '../utils/namingUtils';

import { reactNativeTarget } from './reactNativeTarget';

const recordFor = (): ReturnType<typeof reactNativeTarget> => {
  return reactNativeTarget({
    ...DEFAULT_ANSWERS,
    target: 'react-native',
  });
};

describe('reactNativeTarget', () => {
  it('translates through i18next, its choice kept in Expo\'s AsyncStorage, every suite set up in English', () => {
    const record = recordFor();
    const expected = {
      dependencies: [
        'i18next',
        'react-i18next',
        '@react-native-async-storage/async-storage',
        'expo-localization',
      ],
      testSetup: 'fragments/test-setup/setupTests.reactNativeI18n.ts',
    };
    expect(record.i18n).toEqual(expected);
  });

  it('is the record the react-native answer names', () => {
    const record = recordFor();
    expect(record.id).toBe('react-native');
  });

  it('has its application metadata written rather than copied', () => {
    const record = recordFor();
    expect(record.expoProject).toBe(true);
    expect(record.build).toBe('expo export');
  });

  it('runs its suite on jest-expo, with no router to mock', () => {
    const record = recordFor();
    expect(record.testRunner).toBe('jest');
    expect(record.testDevDependencies).toContain('jest-expo');
    expect(record.routerMock).toBeUndefined();
  });

  it('names files the way any JSX target does, less the route root', () => {
    const record = recordFor();
    expect(record.naming).toEqual(componentNaming('app'));
    const expected = { 'src/**/': FOLDER_ROUTED };
    expect(record.folderNaming).toEqual(expected);
  });
});

const BILINGUAL_PATHS = [
  'src/config/statuses.ts',
  'src/config/standard.ts',
  'src/app/(tabs)/_layout.tsx',
  'src/app/(tabs)/index.tsx',
  'src/app/(tabs)/about.tsx',
  'src/app/(tabs)/version.tsx',
  'src/app-tabs-layout.test.tsx',
  'src/app-tabs-index.test.tsx',
  'src/app-tabs-about.test.tsx',
  'src/app-tabs-version.test.tsx',
  'src/app-not-found.test.tsx',
  'src/components/features/status-page/StatusPage.tsx',
  'src/components/features/status-page/StatusPage.test.tsx',
];

const I18N_ONLY_PATHS = [
  'src/i18n/i18n.ts',
  'src/i18n/i18n.test.ts',
  'src/i18n/locales.test.ts',
  'src/i18n/utils/languageUtils.ts',
  'src/i18n/utils/languageUtils.test.ts',
  'src/components/features/language-select/LanguageSelect.tsx',
  'src/components/features/language-select/LanguageSelect.test.tsx',
  ...LANGUAGES
    .map((language) => {
      return `src/i18n/locales/${language}/common.json`;
    }),
];

const FORM_ENGLISH: readonly Condition[] = [{
  form: ANSWERED,
  languages: [undefined],
}];
const FORM_I18N: readonly Condition[] = [{
  form: ANSWERED,
  languages: ANSWERED,
}];

const GATES: GateRow[] = [
  ...mswGates(true, false),
  ...contactGates(['tanstack-query', 'rtk-query']),
  ['src/app/(tabs)/contact.tsx', FORM_ENGLISH],
  ['src/app/(tabs)/contact.tsx@i18n', FORM_I18N],
  ['src/app-tabs-contact.test.tsx', FORM_ENGLISH],
  ['src/app-tabs-contact.test.tsx@i18n', FORM_I18N],
  ['src/config/routes.ts', WITHOUT_FORM],
  ['src/config/routes.ts@with-form', WITH_FORM],
  ['src/components/ui/index.ts@with-form', WITH_FORM],
  ['src/components/ui/text-input/TextInput.tsx', WITH_FORM],
  ['src/hooks/use-contact-form/useContactForm.ts@tanstack-form', [{ form: ['tanstack-form'] }]],
  ['src/hooks/use-contact-form/useContactForm.ts@react-hook-form', [{ form: ['react-hook-form'] }]],
  ['src/lib/providers/data/DataProvider.tsx', NOT_TANSTACK_QUERY],
  ['src/lib/providers/data/DataProvider.tsx@tanstack-query', TANSTACK_QUERY],
  ['src/lib/providers/store/StoreProvider.tsx', [{ store: [
    undefined,
    'zustand',
    'tanstack-store',
  ] }]],
  ['src/lib/providers/store/StoreProvider.tsx@redux-toolkit', [{ store: ['redux-toolkit'] }]],
  // Only Redux's provider reads the store; the other two stores have no demo here.
  ['src/lib/store/counter/counterStore.ts@redux-toolkit', [{
    store: ['redux-toolkit'],
    data: [undefined, 'tanstack-query'],
  }]],
  ['src/lib/store/counter/counterStore.ts@rtk-query', [{
    store: ['redux-toolkit'],
    data: ['rtk-query'],
  }]],
  ['__mocks__/renderScreen.tsx', [{ testing: ['vitest'] }]],
  ['metro.config.js@tailwind', TAILWIND],
  ['nativewind-env.d.ts@tailwind', TAILWIND],
  ['postcss.config.mjs@tailwind', TAILWIND],
  ['src/app/_layout.tsx', [{ styling: [undefined, 'stylex'], languages: [undefined] }]],
  ['src/app/_layout.tsx@i18n', [{ styling: [undefined, 'stylex'], languages: ANSWERED }]],
  ['src/app/_layout.tsx@tailwind', [{ styling: ['tailwind'], languages: [undefined] }]],
  ['src/app/_layout.tsx@tailwind-i18n', [{ styling: ['tailwind'], languages: ANSWERED }]],
  ['src/app-layout.test.tsx', [{ styling: [undefined, 'stylex'] }]],
  ['src/app-layout.test.tsx@tailwind', TAILWIND],
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
  ['src/hooks/use-extended-query/useExtendedQuery.ts@tanstack-query', TANSTACK_QUERY],
  ['src/hooks/use-extended-mutation/useExtendedMutation.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/utils/queryOptionsUtils.ts', TANSTACK_QUERY],
  ['src/lib/apis/base/baseApi.ts@rtk-query', RTK_QUERY],
  ['src/hooks/use-extended-query/useExtendedQuery.test.ts@tanstack-query', TANSTACK_QUERY],
  ['src/hooks/use-extended-mutation/useExtendedMutation.test.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/utils/queryOptionsUtils.test.ts', TANSTACK_QUERY],
  ['src/lib/apis/base/baseApi.test.ts@rtk-query', RTK_QUERY],
];

describe('the starter gates', () => {
  it('write at most one spelling of each destination under any answer set', () => {
    const walk = walkGates(reactNativeTarget, 'react-native');
    expect(walk.twice).toEqual([]);
  });

  it('are each pinned below, and nothing else is', () => {
    const walk = walkGates(reactNativeTarget, 'react-native');
    const actual = byKey(GATES);
    expect(actual).toEqual(walk.gated);
  });

  it('each write exactly under the conditions pinned below', () => {
    const walk = walkGates(reactNativeTarget, 'react-native');
    const mismatches = walk.mismatchesOf(GATES);
    expect(mismatches).toEqual([]);
  });
});

describe('the app icons', () => {
  it('ship from the starter tree under assets/images, as app.json names them', () => {
    const record = recordFor();
    const images = record.starterFiles
      .filter((file) => {
        return file.target.startsWith('assets/');
      });

    const expected = [
      { target: 'assets/images/adaptive-foreground.png' },
      { target: 'assets/images/icon.png' },
      { target: 'assets/images/icon-dark.png' },
      { target: 'assets/images/splash.png' },
      { target: 'assets/images/splash-dark.png' },
    ];
    expect(images).toEqual(expected);
  });
});

describe('the favicon', () => {
  it('is the shared Mark, in the public directory Expo serves on the web', () => {
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
