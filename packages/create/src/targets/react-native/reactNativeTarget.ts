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

// Metro has no Tailwind pipeline of its own.
const isTailwind = (answers: Answers): boolean => {
  return answers.styling === 'tailwind';
};

// Not its own layer: `eslint-plugin-react-native` caps at `eslint ^9`, and `eslint-config-expo` collides with `base()`.
export const reactNativeTarget: TargetRecord = {
  id: 'react-native',
  expoProject: true,
  // expo-router owns the entry, so there is no root `App.tsx` for Expo's default to find.
  packageMain: 'expo-router/entry',
  framework: 'react-native',
  html: false,
  stores: ['zustand', 'redux-toolkit', 'tanstack-store'],
  ignores: [
    '.expo/**',
    'android/**',
    'ios/**',
    'expo-env.d.ts',
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
    overrides: ['lightningcss'],
  },
  tsconfig: {
    jsx: 'react-jsx',
    extends: 'expo/tsconfig.base',
    include: ['.expo/types/**/*.ts', 'expo-env.d.ts'],
  },
  testSetup: 'fragments/test-setup/setupTests.reactNative.ts',
  // React Native resolves as Metro does and renders through a test renderer, not a DOM.
  testPlatforms: [{
    name: 'native',
    extensions: ['.ios.tsx', '.ios.ts', '.native.tsx', '.native.ts', '.tsx', '.ts', '.jsx', '.js', '.json'],
    include: ['src/**/*.test.{ts,tsx}'],
  }],
  // The shell reaches Expo's TypeScript source in `node_modules`, which no test transform strips.
  // The route list goes with it: the tab bar is its only reader.
  coverageExclude: ['src/app/_layout.tsx', 'src/config/routes.ts'],
  starterFiles: [
    // No dev server, so no browser worker.
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
    // The root layout imports the stylesheet, which Metro reads only through NativeWind.
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
  // expo-router treats every file under the route root as a route; `expo export` died on a suite there.
  starterTests: [
    ...mockTests(false),
    // React's hook suites import `@testing-library/react`, and this target has no DOM.
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
    {
      target: 'src/styles/starter.test.ts',
      covers: 'src/styles/starter.ts',
    },
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
  // Its `esbuild` needs an install script, hence `allowBuilds`.
  testDevDependencies: [
    '@srsholmes/vitest-react-native',
    '@testing-library/react-native',
    // The vitest transform only: this target owns no vite build.
    '@vitejs/plugin-react',
    'test-renderer',
  ],
  allowBuilds: ['esbuild'],
  // What Expo SDK 57's own template pins.
  versions: {
    'react': '19.2.3',
    'react-dom': '19.2.3',
    '@types/react': '~19.2.2',
  },
  stateRules: ['react-state.md', 'hooks-order.md'],
  routerMock: ROUTER_MOCK,
};
