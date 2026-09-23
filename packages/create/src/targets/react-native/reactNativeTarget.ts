import { hasTests } from '@answers/utils/answerUtils';

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
  isTailwind,
  SHARED,
} from './constants';

import type { StarterFile, TargetRecord } from '../types';

// `framework: 'react'` rather than its own layer: `eslint-plugin-react-native` caps at `eslint ^9` and
// `eslint-config-expo` bundles plugins that collide with `base()`.
export const reactNativeTarget: TargetRecord = {
  id: 'react-native',
  recordModule: 'src/config/linteljs.ts',
  expoProject: true,
  // expo-router owns the entry: the routes are `src/app/`, so there is no root `App.tsx` for Expo's default to find.
  packageMain: 'expo-router/entry',
  framework: 'react-native',
  // No document for the html layer; the template does ship CSS, so `lint:css` has a real glob.
  html: false,
  vite: false,
  routeUnit: 'src/app/',
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
  },
  vitePlugin: {
    imports: [],
    calls: [],
  },
  tsconfig: {
    jsx: 'react-jsx',
    extends: 'expo/tsconfig.base',
    include: ['.expo/types/**/*.ts', 'expo-env.d.ts'],
    /*
     * The legacy surface, not the Strict TypeScript API 0.87 serves by default. Expo's own
     * `types/react-native-web.d.ts` augments `react-native` with `interface TextStyle` and `interface ViewStyle`,
     * which merged while those were interfaces. The strict types declare them as aliases, so the augmentation
     * shadows each one with a web-only interface instead of merging: every React Native style property then reads
     * as unknown, and `<Text style={{ fontSize: 28 }} />` fails while `<Text style={{}} />` passes. Expo's base
     * sets `["react-native"]` and an extending config replaces the array, so both are named here. Drop this the
     * release Expo declares those as aliases too.
     */
    customConditions: ['react-native-legacy-deep-imports', 'react-native'],
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
    ...mockFiles(false),
    ...accessorFiles(ACCESSORS, {
      shared: 'react',
      names: SOURCE_ACCESSORS,
    }),
    ...rtkFiles(),
    ...ALWAYS.map((target): StarterFile => {
      return { target };
    }),
    ...SHARED.map((target): StarterFile => {
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
    /*
     * Two spellings of one file: the Tailwind one wraps the config in NativeWind's own, and both carry the
     * `getPolyfills` override this SDK and this react-native need between them.
     */
    {
      target: 'metro.config.js',
      when: isTailwind,
      variant: 'tailwind',
    },
    {
      target: 'metro.config.js',
      when: (answers): boolean => {
        return !isTailwind(answers);
      },
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
    ...mockTests(),
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
  /*
   * `eas build` needs a remote account, so an export stands in. The two native platforms rather than web: Expo SDK
   * 57 bundles web through a code path that asks react-native for the `rn-get-polyfills` 0.87 deleted, and unlike
   * the native one it does not read the override `metro.config.js` carries. Both of these produce a real bundle
   * and neither needs Xcode or the Android SDK, so this is the heavier check besides.
   */
  build: 'expo export --platform ios --platform android',
  // The four a scaffolder used to write; `expo lint` is declined, since this standard's linter is the emitted one.
  extraScripts: {
    start: 'expo start',
    android: 'expo start --android',
    ios: 'expo start --ios',
    web: 'expo start --web',
  },
  /*
   * Expo's runtime, its router and the two native modules a tab layout measures itself with. `react-native-web`
   * and `react-dom` are what the `web` script bundles against, and Expo's own types reference the first.
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
    'react-native-safe-area-context',
    'react-native-screens',
    'react-native-web',
  ],
  // Not `COMMON_REACT_PLUGINS`: the accessibility plugin in that list cannot fire on React Native.
  devDependencies: [
    ...COMMON_REACT_PLUGINS.filter((name) => {
      return name !== 'eslint-plugin-jsx-a11y-x';
    }),
    '@types/react',
    // Named because `metro.config.js` imports it, which a transitive copy does not entitle it to do.
    '@react-native/js-polyfills',
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
  /*
   * Inside react-native's own tree: the community CLI plugin peers the exact metro-config of its own release and
   * pnpm resolves a newer one. Nothing here declares either.
   */
  peerAllowances: { '@react-native/community-cli-plugin>@react-native/metro-config': '0.87.1' },
  // Hard peers of two packages this target's own template declares, which no manifest here answers.
  peerExtensions: {
    'react-native-css': {
      'lightningcss': '>=1.27.0',
      '@expo/metro-config': '>=54',
    },
    'react-native-worklets': {
      '@babel/core': '^7',
      '@react-native/metro-config': '0.87.1',
    },
  },
  stateRules: ['react-state.md', 'hooks-order.md'],
  routerMock: ROUTER_MOCK,
};
