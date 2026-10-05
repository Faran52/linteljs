import { hasTests } from '@utils/answerUtils';

import {
  COMMON_REACT_PLUGINS,
  CONTACT_HOOK_FORMS,
  FOLDER_ROUTED,
  STATUS_UTILS_TEST,
} from '../constants';
import { REACT_ACCESSORS as SOURCE_ACCESSORS } from '../react/constants';
import { hasForm } from '../utils/gateUtils';
import {
  languageUtilsFile,
  languageUtilsTest,
  localeFiles,
  LOCALES_TEST,
} from '../utils/i18nUtils';
import {
  accessorFiles,
  accessorTests,
  mockFiles,
  mockTests,
  rtkContactFiles,
  rtkFiles,
  rtkTests,
} from '../utils/mockUtils';
import { componentNaming } from '../utils/namingUtils';
import {
  contactApiFiles,
  contactSchemaFiles,
  filesAt,
  formValidatorTest,
  submissionTest,
} from '../utils/starterUtils';

import {
  ACCESSORS,
  ALWAYS,
  REACT_NATIVE_I18N,
  SHARED,
} from './constants';
import { reactNativeI18nFiles, reactNativeI18nTests } from './utils/translatedFileUtils';

import type { Answers } from '@config/types';
import type { TargetBuilder } from '../registry';
import type { StarterFile, TargetRecord } from '../types';

// Metro has no Tailwind pipeline of its own.
const isTailwind = (answers: Answers): boolean => {
  return answers.styling === 'tailwind';
};

const isRedux = (answers: Answers): boolean => {
  return answers.store === 'redux-toolkit';
};

// Not its own layer: `eslint-plugin-react-native` caps at `eslint ^9`, and `eslint-config-expo` collides with `base()`.
export const reactNativeTarget: TargetBuilder = () => {
  const record: TargetRecord = {
    id: 'react-native',
    expoProject: true,
    // expo-router owns the entry, so there is no root `App.tsx` for Expo's default to find.
    packageMain: 'expo-router/entry',
    framework: 'react-native',
    html: false,
    stores: [
      'zustand',
      'redux-toolkit',
      'tanstack-store',
    ],
    ignores: [
      '.expo/**',
      'android/**',
      'ios/**',
      'expo-env.d.ts',
    ],
    // Less `expo-env.d.ts`, which the starter ships.
    gitignore: [
      '.expo/',
      'dist/',
      'web-build/',
      '.kotlin/',
      '*.orig.*',
      '*.jks',
      '*.p8',
      '*.p12',
      '*.key',
      '*.mobileprovision',
      '.metro-health-check*',
      '*.pem',
      '/ios',
      '/android',
    ],
    // expo-router resolves a route by its filename.
    naming: componentNaming('app'),
    folderNaming: { 'src/**/': FOLDER_ROUTED },
    hooksAlias: { '@hooks/*': './src/hooks/*' },
    // Measured: dropping them costs thirty `no-unresolved` findings; the assets sit outside `src/`.
    extraAliases: {
      '@/assets/*': './assets/*',
      '@/*': './src/*',
    },
    styleEntry: 'src/global.css',
    // NativeWind 5 runs Tailwind 4 through PostCSS inside `withNativewind`.
    tailwind: {
      imports: [
        '@import "tailwindcss/theme.css" layer(theme);',
        '@import "tailwindcss/preflight.css" layer(base);',
        '@import "tailwindcss/utilities.css";',
        '@import "nativewind/theme";',
      ],
      dependencies: ['nativewind', 'react-native-css'],
      devDependencies: ['postcss'],
      // NativeWind otherwise adds this to `include` on the first bundle, which is `check` rewriting what it checks.
      tsconfigInclude: ['nativewind-env.d.ts'],
      // react-native-css loads the copy `@expo/metro-config` resolves, falling back to its own.
      overrides: [
        {
          parent: '@expo/metro-config',
          name: 'lightningcss',
        },
        {
          parent: 'react-native-css',
          name: 'lightningcss',
        },
      ],
    },
    tsconfig: {
      jsx: 'react-jsx',
      extends: 'expo/tsconfig.base',
      include: ['.expo/types/**/*.ts', 'expo-env.d.ts'],
    },
    testSetup: 'fragments/test-setup/setupTests.reactNative.ts',
    // jest-expo resolves as Metro does and renders through a test renderer, not a DOM.
    testRunner: 'jest',
    starterFiles: [
      // No dev server, so no browser worker.
      ...mockFiles(true, false),
      ...accessorFiles(ACCESSORS, {
        shared: 'react',
        names: SOURCE_ACCESSORS,
      }),
      ...rtkFiles(),
      ...filesAt(ALWAYS),
      ...filesAt(SHARED, {
        shared: true,
      }),
      ...reactNativeI18nFiles(),
      ...localeFiles(hasForm),
      {
        target: 'src/config/routes.ts',
        when: (answers) => {
          return !hasForm(answers);
        },
        shared: true,
      },
      {
        target: 'src/config/routes.ts',
        when: hasForm,
        variant: 'with-form',
        shared: true,
      },
      {
        target: 'src/components/ui/index.ts',
        when: hasForm,
        variant: 'with-form',
      },
      {
        target: 'src/components/ui/text-input/TextInput.tsx',
        when: hasForm,
      },
      ...CONTACT_HOOK_FORMS
        .map((form): StarterFile => {
          const file: StarterFile = {
            target: 'src/hooks/use-contact-form/useContactForm.ts',
            when: (answers) => {
              return answers.form === form;
            },
            variant: form,
            shared: 'react',
            source: 'src/pages/contact/useContactForm.ts',
          };

          return file;
        }),
      ...contactApiFiles({ shared: 'react' }),
      ...rtkContactFiles(),
      ...contactSchemaFiles(),
      // TanStack Query needs an ancestor; RTK Query rides the Redux provider, whose store registers its middleware.
      {
        target: 'src/lib/providers/data/DataProvider.tsx',
        when: (answers) => {
          return answers.data !== 'tanstack-query';
        },
        shared: 'react',
      },
      {
        target: 'src/lib/providers/data/DataProvider.tsx',
        when: (answers) => {
          return answers.data === 'tanstack-query';
        },
        variant: 'tanstack-query',
        shared: 'react',
      },
      {
        target: 'src/lib/providers/store/StoreProvider.tsx',
        when: (answers) => {
          return answers.store !== 'redux-toolkit';
        },
        shared: 'react',
      },
      {
        target: 'src/lib/providers/store/StoreProvider.tsx',
        when: isRedux,
        variant: 'redux-toolkit',
        shared: 'react',
      },
      {
        target: 'src/lib/store/counter/counterStore.ts',
        when: (answers) => {
          return isRedux(answers) && answers.data !== 'rtk-query';
        },
        variant: 'redux-toolkit',
        shared: 'react',
      },
      {
        target: 'src/lib/store/counter/counterStore.ts',
        when: (answers) => {
          return isRedux(answers) && answers.data === 'rtk-query';
        },
        variant: 'rtk-query',
        shared: 'react',
      },
      languageUtilsFile(),
      {
        target: '__mocks__/renderScreen.tsx',
        // `testing: none` never installs `@testing-library/react-native` or writes `@mocks/*`.
        when: hasTests,
      },
      {
        target: 'metro.config.js',
        when: isTailwind,
        variant: 'tailwind',
      },
      {
        target: 'nativewind-env.d.ts',
        when: isTailwind,
        variant: 'tailwind',
      },
      {
        target: 'postcss.config.mjs',
        when: isTailwind,
        variant: 'tailwind',
      },
    ],
    // expo-router treats every file under the route root as a route; `expo export` fails on a suite there.
    starterTests: [
      ...mockTests(true),
      STATUS_UTILS_TEST,
      // React's hook suites import `@testing-library/react`, and this target has no DOM.
      ...accessorTests(ACCESSORS),
      ...rtkTests(),
      {
        target: 'src/app-layout.test.tsx',
        covers: 'src/app/_layout.tsx',
        when: (answers) => {
          return !isTailwind(answers);
        },
      },
      {
        target: 'src/app-layout.test.tsx',
        covers: 'src/app/_layout.tsx',
        when: isTailwind,
        variant: 'tailwind',
      },
      {
        target: 'src/app-tabs-layout.test.tsx',
        covers: 'src/app/(tabs)/_layout.tsx',
      },
      {
        target: 'src/components/features/crash-page/CrashPage.test.tsx',
        covers: 'src/components/features/crash-page/CrashPage.tsx',
      },
      {
        target: 'src/components/features/document-head/DocumentHead.test.tsx',
        covers: 'src/components/features/document-head/DocumentHead.tsx',
      },
      {
        target: 'src/components/ui/mark/Mark.test.tsx',
        covers: 'src/components/ui/mark/Mark.tsx',
      },
      {
        target: 'src/config-plugins/with-gradle-daemon-jvm/withGradleDaemonJvm.test.ts',
        covers: 'src/config-plugins/with-gradle-daemon-jvm/withGradleDaemonJvm.ts',
      },
      {
        target: 'src/styles/starter.test.ts',
        covers: 'src/styles/starter.ts',
      },
      {
        target: 'src/components/ui/text-input/TextInput.test.tsx',
        covers: 'src/components/ui/text-input/TextInput.tsx',
      },
      // React's own suites for these render through a DOM.
      {
        target: 'src/lib/providers/data/DataProvider.test.tsx',
        covers: 'src/lib/providers/data/DataProvider.tsx',
      },
      {
        target: 'src/lib/providers/store/StoreProvider.test.tsx',
        covers: 'src/lib/providers/store/StoreProvider.tsx',
      },
      {
        target: 'src/lib/store/counter/counterStore.test.ts',
        covers: 'src/lib/store/counter/counterStore.ts',
      },
      {
        target: 'src/lib/apis/contact/contactApi.test.ts',
        covers: 'src/lib/apis/contact/contactApi.ts',
      },
      {
        target: 'src/lib/apis/contact/contactEndpoints.test.ts',
        covers: 'src/lib/apis/contact/contactEndpoints.ts',
        variant: 'rtk-query',
        shared: 'react',
      },
      {
        target: 'src/lib/apis/contact/contactHooks.test.ts',
        covers: 'src/lib/apis/contact/contactHooks.ts',
        variant: 'rtk-query',
      },
      submissionTest(),
      formValidatorTest(),
      ...reactNativeI18nTests(),
      LOCALES_TEST,
      languageUtilsTest(),
    ],
    typecheck: 'tsc --noEmit',
    // `eas build` needs a remote account; an export of every platform needs no Xcode or Android SDK.
    build: 'expo export',
    // `expo lint` is declined: this standard's linter is the emitted one.
    extraScripts: {
      start: 'expo start',
      android: 'expo start --android',
      ios: 'expo start --ios',
      web: 'expo start --web',
    },
    // Reanimated and the gesture handler are expo-router's peers; `react-native-css` requires Reanimated undeclared.
    dependencies: [
      'expo',
      'expo-build-properties',
      'expo-router',
      'expo-constants',
      'expo-linking',
      'expo-status-bar',
      'react',
      'react-dom',
      'react-native',
      'react-native-gesture-handler',
      'react-native-reanimated',
      'react-native-safe-area-context',
      'react-native-screens',
      'react-native-web',
      'react-native-worklets',
    ],
    // Not `COMMON_REACT_PLUGINS`: its accessibility plugin cannot fire on React Native.
    devDependencies: [
      ...COMMON_REACT_PLUGINS
        .filter((name) => {
          return name !== 'eslint-plugin-jsx-a11y-x';
        }),
      '@types/react',
      '@react-native/metro-config',
    ],
    // jest-expo requires the preset as a peer.
    testDevDependencies: [
      '@react-native/jest-preset',
      '@testing-library/react-native',
      'jest-expo',
      'test-renderer',
    ],
    allowBuilds: [],
    // What Expo SDK 57's own template pins.
    versions: {
      'react': '19.2.3',
      'react-dom': '19.2.3',
      '@types/react': '~19.2.2',
    },
    i18n: REACT_NATIVE_I18N,
    stateRules: ['react-state.md', 'hooks-order.md'],
  };

  return record;
};
