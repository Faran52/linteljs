import { COMMON_REACT_PLUGINS, FOLDER_ROUTED } from '../constants';
import { componentNaming } from '../utils/namingUtils';

import { STARTER_FIXES, STARTER_RENAMES } from './constants';

import type { TargetRecord } from '../types';

// `framework: 'react'` rather than its own layer: `eslint-plugin-react-native` caps at `eslint ^9` and
// `eslint-config-expo` bundles plugins that collide with `base()`.
export const reactNativeTarget: TargetRecord = {
  id: 'react-native',
  // No package-manager flag: Expo reads whichever one invoked it.
  scaffold: (name) => {
    return {
      kind: 'create',
      args: ['expo-app@latest', name, '--yes', '--no-install'],
      /**
       * `create-expo-app` shells out to `npm pack` whatever launched it, so npm is the only launcher it is tested
       * against. Under yarn it dies before writing a file, passing a web ReadableStream to `fs.write` and then an
       * error code where `process.exitCode` wants a number. Measured against the public registry, so not ours.
       */
      via: 'npm',
    };
  },
  framework: 'react-native',
  // No document for the html layer; the template does ship CSS, so `lint:css` has a real glob.
  html: false,
  vite: false,
  routeUnit: 'src/app/',
  hooksSlot: {
    label: 'Hooks',
    path: 'src/hooks/ (use*)',
  },
  store: {
    label: 'Zustand',
    dependency: 'zustand',
  },
  /**
   * `scripts/reset-project.js` is Expo's CommonJS throwaway helper, deleted by most projects on day one.
   * `metro.config.js` is here because Metro loads it with `require`, so it cannot be ESM and cannot pass
   * `no-require-imports`. This CLI writes that file, so linting it reports its own text.
   */
  ignores: [
    '.expo/**',
    'android/**',
    'ios/**',
    'expo-env.d.ts',
    'metro.config.js',
    'scripts/reset-project.js',
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
  },
  // The template imports these five as values, which `verbatimModuleSyntax` rejects.
  typeOnlyImports: {
    'react': ['PropsWithChildren'],
    'expo-router': ['Href'],
    'expo-router/ui': ['TabListProps', 'TabTriggerSlotProps'],
    '@/constants/theme': ['ThemeColor'],
  },
  testSetup: 'fragments/test-setup/setupTests.reactNative.ts',
  // Three modules exist only as `.web` variants; the extension lists mirror Metro's resolution order.
  testPlatforms: [
    {
      name: 'native',
      extensions: ['.ios.tsx', '.ios.ts', '.native.tsx', '.native.ts', '.tsx', '.ts', '.jsx', '.js', '.json'],
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: ['src/**/*.web.test.{ts,tsx}'],
    },
    {
      name: 'web',
      extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.jsx', '.js', '.json'],
      include: ['src/**/*.web.test.{ts,tsx}'],
    },
  ],
  starterFiles: [
    // Not written by a `--no-install` scaffold; without it `import '@/global.css'` has no declaration.
    {
      target: 'expo-env.d.ts',
    },
    {
      target: 'src/typings/assets.d.ts',
    },
    {
      target: '__mocks__/renderScreen.tsx',
      // It imports `@testing-library/react-native`, which `testing: none` never installs, and the `@mocks/*` alias
      // it sits behind is not written either.
      tests: true,
    },
    {
      target: 'metro.config.js',
      library: 'tailwind',
    },
    {
      target: 'nativewind-env.d.ts',
      library: 'tailwind',
    },
  ],
  starterFixes: STARTER_FIXES,
  // The one starter suite that cannot meet the strict floor; `record.ts` carries why.
  exemptsStarterTests: true,
  starterRenames: STARTER_RENAMES,
  /**
   * One suite per template module, since the gate is 100%; `.web` modules get their own suites because the web
   * variant resolves over the native one. Route suites sit beside `src/app/`, not inside it: expo-router treats every
   * file under the route root as a route, and measured, `expo export` died on `expect is not defined`.
   */
  starterTests: [
    {
      target: 'src/app-index.test.tsx',
      covers: 'src/app/index.tsx',
    },
    {
      target: 'src/app-layout.test.tsx',
      covers: 'src/app/_layout.tsx',
    },
    {
      target: 'src/app-explore.test.tsx',
      covers: 'src/app/explore.tsx',
    },
    {
      target: 'src/components/AnimatedIcon.test.tsx',
      covers: 'src/components/AnimatedIcon.tsx',
    },
    {
      target: 'src/components/AppTabs.test.tsx',
      covers: 'src/components/AppTabs.tsx',
    },
    {
      target: 'src/components/ExternalLink.test.tsx',
      covers: 'src/components/ExternalLink.tsx',
    },
    {
      target: 'src/components/HintRow.test.tsx',
      covers: 'src/components/HintRow.tsx',
    },
    {
      target: 'src/components/ThemedText.test.tsx',
      covers: 'src/components/ThemedText.tsx',
    },
    {
      target: 'src/components/ThemedView.test.tsx',
      covers: 'src/components/ThemedView.tsx',
    },
    {
      target: 'src/components/WebBadge.test.tsx',
      covers: 'src/components/WebBadge.tsx',
    },
    {
      target: 'src/components/ui/Collapsible.test.tsx',
      covers: 'src/components/ui/Collapsible.tsx',
    },
    {
      target: 'src/constants/theme.test.ts',
      covers: 'src/constants/theme.ts',
    },
    {
      target: 'src/hooks/useColorScheme.web.test.ts',
      covers: 'src/hooks/useColorScheme.web.ts',
    },
    {
      target: 'src/app-index.web.test.tsx',
      covers: 'src/app/index.tsx',
    },
    {
      target: 'src/app-index.android.test.tsx',
      covers: 'src/app/index.tsx',
    },
    {
      target: 'src/app-explore.web.test.tsx',
      covers: 'src/app/explore.tsx',
    },
    {
      target: 'src/components/AnimatedIcon.web.test.tsx',
      covers: 'src/components/AnimatedIcon.web.tsx',
    },
    {
      target: 'src/components/AppTabs.web.test.tsx',
      covers: 'src/components/AppTabs.web.tsx',
    },
    {
      target: 'src/hooks/useTheme.test.ts',
      covers: 'src/hooks/useTheme.ts',
    },
  ],
  typecheck: 'tsc --noEmit',
  // `eas build` needs a remote account, so `expo export --platform web` stands in.
  build: 'expo export --platform web',
  // Not `COMMON_REACT_PLUGINS`: the accessibility plugin in that list cannot fire on React Native.
  devDependencies: COMMON_REACT_PLUGINS.filter((name) => {
    return name !== 'eslint-plugin-jsx-a11y-x';
  }),
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
  // Inside react-native's own tree: `@react-native/community-cli-plugin@0.86.3` peers that exact metro-config and
  // pnpm resolves a newer one. Nothing here declares either.
  peerAllowances: { '@react-native/community-cli-plugin>@react-native/metro-config': '0.87.1' },
  // Hard peers of two packages `create-expo-app` writes, which no manifest here answers.
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
  routerMocks: true,
};
