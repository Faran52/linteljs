import { hasTests } from '@utils/answerUtils';

import {
  COMMON_REACT_PLUGINS,
  FOLDER_ROUTED,
  ROUTER_MOCK,
} from '../constants';
import { REACT_ACCESSORS as SOURCE_ACCESSORS } from '../react/constants';
import {
  accessorFiles,
  accessorTests,
  mockFiles,
  mockTests,
  rtkFiles,
  rtkTests,
} from '../utils/mockUtils';
import { componentNaming } from '../utils/namingUtils';

import {
  ACCESSORS,
  ALWAYS,
  SHARED,
} from './constants';

import type { Answers } from '@config/types';
import type { StarterFile, TargetRecord } from '../types';

// Metro has no Tailwind pipeline of its own, so all three ship only with the answer that brings NativeWind.
const isTailwind = (answers: Answers): boolean => {
  return answers.styling === 'tailwind';
};

// `framework: 'react'` rather than its own layer: `eslint-plugin-react-native` caps at `eslint ^9` and
// `eslint-config-expo` bundles plugins that collide with `base()`.
export const reactNativeTarget: TargetRecord = {
  id: 'react-native',
  expoProject: true,
  // expo-router owns the entry: the routes are `src/app/`, so there is no root `App.tsx` for Expo's default to find.
  packageMain: 'expo-router/entry',
  framework: 'react-native',
  // No document for the html layer; the template does ship CSS, so `lint:css` has a real glob.
  html: false,
  stores: ['zustand', 'redux-toolkit', 'tanstack-store'],
  ignores: [
    '.expo/**',
    'android/**',
    'ios/**',
    'expo-env.d.ts',
  ],
  // `src/app` stays exempt: expo-router resolves a route by its filename.
  naming: componentNaming('app'),
  folderNaming: { 'src/**/': FOLDER_ROUTED },
  hooksAlias: { '@hooks/*': './src/hooks/*' },
  // Expo's starter imports through these in seventeen files; measured, dropping them costs thirty `no-unresolved`
  // findings. `@/assets/*` is separate because the assets sit outside `src/`.
  extraAliases: {
    '@/assets/*': './assets/*',
    '@/*': './src/*',
  },
  styleEntry: 'src/global.css',
  // Metro has no Tailwind pipeline; NativeWind 5 runs Tailwind 4 through PostCSS inside `withNativewind`.
  tailwind: {
    imports: [
      '@import "tailwindcss/theme.css" layer(theme);',
      '@import "tailwindcss/preflight.css" layer(base);',
      '@import "tailwindcss/utilities.css";',
      '@import "nativewind/theme";',
    ],
    dependencies: ['nativewind', 'react-native-css'],
    devDependencies: ['postcss'],
    // NativeWind adds its declaration file to `include` itself on the first bundle, which is `check` rewriting the
    // project it checks; named here, there is nothing for it to write.
    tsconfigInclude: ['nativewind-env.d.ts'],
  },
  tsconfig: {
    jsx: 'react-jsx',
    extends: 'expo/tsconfig.base',
    include: ['.expo/types/**/*.ts', 'expo-env.d.ts'],
  },
  testSetup: 'fragments/test-setup/setupTests.reactNative.ts',
  /*
   * A runner of its own: React Native resolves a module the way Metro does and renders through a test renderer
   * rather than a DOM, so neither the transform nor the environment every other target uses applies.
   */
  testPlatforms: [{
    name: 'native',
    extensions: ['.ios.tsx', '.ios.ts', '.native.tsx', '.native.ts', '.tsx', '.ts', '.jsx', '.js', '.json'],
    include: ['src/**/*.test.{ts,tsx}'],
  }],
  /*
   * The route root is the shell, and rendering it pulls the navigator, which reaches Expo's own TypeScript source
   * inside `node_modules` that no test transform strips. What it composes is covered where each screen renders,
   * which is the same trade Next's and SvelteKit's root layouts take.
   *
   * The route list goes with it. On the other four targets that ship it `AppHeader` reads it and that component's
   * own suite covers it; here the nav is the tab bar, so the shell is its only reader and excluding one without
   * the other leaves a table nothing executes.
   */
  coverageExclude: ['src/app/_layout.tsx', 'src/config/routes.ts'],
  starterFiles: [
    // No dev server, so no browser worker: the handlers reach the test run alone.
    ...mockFiles(false, false),
    ...accessorFiles(ACCESSORS, {
      shared: 'react',
      names: SOURCE_ACCESSORS,
    }),
    ...rtkFiles(),
    ...ALWAYS
      .map((target): StarterFile => {
        return { target };
      }),
    ...SHARED
      .map((target): StarterFile => {
        return {
          target,
          shared: true,
        };
      }),
    /*
     * The root layout is the one file the styling answer changes, because it is where the stylesheet is imported
     * and Metro has no CSS pipeline without NativeWind to give it one.
     */
    {
      target: 'src/app/_layout.tsx',
      when: (answers) => {
        return !isTailwind(answers);
      },
    },
    {
      target: 'src/app/_layout.tsx',
      when: isTailwind,
      variant: 'tailwind',
    },
    {
      target: '__mocks__/renderScreen.tsx',
      // It imports `@testing-library/react-native`, which `testing: none` never installs, and the `@mocks/*` alias
      // it sits behind is not written either.
      when: hasTests,
    },
    // NativeWind wraps Metro's config; without it Expo's default serves.
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
  ],
  /*
   * Beside `src/app/`, not inside it: expo-router treats every file under the route root as a route, and measured,
   * `expo export` died on `expect is not defined` when a suite sat there.
   */
  starterTests: [
    ...mockTests(false),
    /*
     * Its own suites, where the hooks themselves are React's. Those suites import `@testing-library/react`, and
     * this target renders through a native test renderer with no DOM behind it.
     */
    ...accessorTests(ACCESSORS),
    ...rtkTests(),
    {
      target: 'src/app-index.test.tsx',
      covers: 'src/app/index.tsx',
    },
    {
      target: 'src/app-about.test.tsx',
      covers: 'src/app/about.tsx',
    },
    {
      target: 'src/app-version.test.tsx',
      covers: 'src/app/version.tsx',
    },
    {
      target: 'src/components/ui/mark/Mark.test.tsx',
      covers: 'src/components/ui/mark/Mark.tsx',
    },
  ],
  typecheck: 'tsc --noEmit',
  // `eas build` needs a remote account, so an export of every platform stands in; none needs Xcode or the Android SDK.
  build: 'expo export',
  // `expo lint` is declined, since this standard's linter is the emitted one.
  extraScripts: {
    start: 'expo start',
    android: 'expo start --android',
    ios: 'expo start --ios',
    web: 'expo start --web',
  },
  /*
   * Expo's runtime, its router and the two native modules a tab layout measures itself with. `react-native-web`
   * and `react-dom` are what the `web` script bundles against, and Expo's own types reference the first.
   * Reanimated and the gesture handler are expo-router's peers, which Expo's own template installs and yarn reports
   * missing, and `react-native-css` requires Reanimated at runtime without declaring it; worklets is Reanimated's.
   */
  dependencies: [
    'expo',
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
  // Not `COMMON_REACT_PLUGINS`: the accessibility plugin in that list cannot fire on React Native.
  devDependencies: [
    ...COMMON_REACT_PLUGINS
      .filter((name) => {
        return name !== 'eslint-plugin-jsx-a11y-x';
      }),
    '@types/react',
    '@react-native/metro-config',
  ],
  // `@srsholmes/vitest-react-native` strips the Flow types and stands in for native modules; its `esbuild` needs an
  // install script, hence `allowBuilds`.
  testDevDependencies: [
    '@srsholmes/vitest-react-native',
    '@testing-library/react-native',
    // The vitest transform only: this target owns no vite build.
    '@vitejs/plugin-react',
    'test-renderer',
  ],
  allowBuilds: ['esbuild'],
  // What Expo SDK 57's own template pins, where every other target has moved on.
  versions: {
    'react': '19.2.3',
    'react-dom': '19.2.3',
    '@types/react': '~19.2.2',
  },
  stateRules: ['react-state.md', 'hooks-order.md'],
  routerMock: ROUTER_MOCK,
};
