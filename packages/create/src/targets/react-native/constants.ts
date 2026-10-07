import type { I18nParts } from '../types';
import type { AccessorNames } from '../utils/mockUtils';

// `app.json` carries the project's name three times, so it is emitted.
export const ALWAYS: readonly string[] = [
  'assets/images/adaptive-foreground.png',
  'assets/images/icon.png',
  'assets/images/icon-dark.png',
  'assets/images/splash.png',
  'assets/images/splash-dark.png',
  'expo-env.d.ts',
  'src/typings/assets.d.ts',
  'src/app/+not-found.tsx',
  'src/components/features/crash-page/CrashPage.tsx',
  'src/components/features/document-head/DocumentHead.tsx',
  'src/components/ui/mark/Mark.tsx',
  'src/config-plugins/with-gradle-daemon-jvm/withGradleDaemonJvm.ts',
  'src/styles/starterStyles.ts',
];

// React Native has no CSS, so the stylesheets are not shared. Expo serves `public/` on the web.
export const SHARED: readonly string[] = [
  'src/lib/utils/statusUtils.ts',
  'public/favicon.svg',
];

export const ACCESSORS: AccessorNames = {
  directory: 'src/hooks',
  query: 'useExtendedQuery',
  mutation: 'useExtendedMutation',
  testSuffix: '.test.ts',
};

// React's i18next, less its browser detector: Expo SDK 57's own AsyncStorage keeps the choice, and expo-localization
// reads the device's languages.
export const REACT_NATIVE_I18N: I18nParts = {
  dependencies: [
    'i18next',
    'react-i18next',
    '@react-native-async-storage/async-storage',
    'expo-localization',
  ],
  testSetup: 'fragments/test-setup/setupTests.reactNativeI18n.ts',
};

const LANGUAGE_SELECT = 'src/components/features/language-select/LanguageSelect';
const STATUS_PAGE = 'src/components/features/status-page/StatusPage';

export const TRANSLATED = [
  'src/app/(tabs)/_layout.tsx',
  'src/app/(tabs)/index.tsx',
  'src/app/(tabs)/about.tsx',
  'src/app/(tabs)/version.tsx',
  `${STATUS_PAGE}.tsx`,
];

export const I18N_ONLY_FILES = ['src/i18n/i18n.ts', `${LANGUAGE_SELECT}.tsx`];

// Each suite, and the file it covers.
export const TRANSLATED_SUITES = [
  ['src/app-tabs-layout.test.tsx', 'src/app/(tabs)/_layout.tsx'],
  ['src/app-tabs-index.test.tsx', 'src/app/(tabs)/index.tsx'],
  ['src/app-tabs-about.test.tsx', 'src/app/(tabs)/about.tsx'],
  ['src/app-tabs-version.test.tsx', 'src/app/(tabs)/version.tsx'],
  ['src/app-not-found.test.tsx', 'src/app/+not-found.tsx'],
  [`${STATUS_PAGE}.test.tsx`, `${STATUS_PAGE}.tsx`],
] as const;

export const I18N_ONLY_SUITES = [
  ['src/i18n/i18n.test.ts', 'src/i18n/i18n.ts'],
  [`${LANGUAGE_SELECT}.test.tsx`, `${LANGUAGE_SELECT}.tsx`],
] as const;
