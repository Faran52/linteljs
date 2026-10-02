import type { I18nParts } from '../types';
import type { AccessorNames } from '../utils/mockUtils';

// `app.json` carries the project's name three times, so it is emitted.
export const ALWAYS: readonly string[] = [
  'expo-env.d.ts',
  'src/typings/assets.d.ts',
  'src/app/index.tsx',
  'src/app/+not-found.tsx',
  'src/components/features/crash-page/CrashPage.tsx',
  'src/components/ui/mark/Mark.tsx',
  'src/styles/starter.ts',
];

// React Native has no CSS, so the stylesheets are not shared. Expo serves `public/` on the web.
export const SHARED: readonly string[] = [
  'src/config/routes.ts',
  'src/lib/utils/statusUtils.ts',
  'public/favicon.svg',
];

export const ACCESSORS: AccessorNames = {
  directory: 'src/hooks',
  query: 'useExtendedQuery',
  mutation: 'useExtendedMutation',
  testSuffix: '.test.ts',
};

// React's i18next, less its browser detector: Expo SDK 57's own AsyncStorage keeps the choice.
export const REACT_NATIVE_I18N: I18nParts = {
  dependencies: [
    'i18next',
    'react-i18next',
    '@react-native-async-storage/async-storage',
  ],
  testSetup: 'fragments/test-setup/setupTests.reactNativeI18n.ts',
};

const LANGUAGE_SELECT = 'src/components/features/language-select/LanguageSelect';
const STATUS_PAGE = 'src/components/features/status-page/StatusPage';

export const TRANSLATED = [
  'src/app/about.tsx',
  'src/app/version.tsx',
  `${STATUS_PAGE}.tsx`,
];

export const I18N_ONLY_FILES = ['src/i18n/index.ts', `${LANGUAGE_SELECT}.tsx`];

// Each suite, and the file it covers.
export const TRANSLATED_SUITES = [
  ['src/app-about.test.tsx', 'src/app/about.tsx'],
  ['src/app-version.test.tsx', 'src/app/version.tsx'],
  ['src/app-not-found.test.tsx', 'src/app/+not-found.tsx'],
  [`${STATUS_PAGE}.test.tsx`, `${STATUS_PAGE}.tsx`],
] as const;

export const I18N_ONLY_SUITES = [
  ['src/i18n/index.test.ts', 'src/i18n/index.ts'],
  [`${LANGUAGE_SELECT}.test.tsx`, `${LANGUAGE_SELECT}.tsx`],
] as const;
