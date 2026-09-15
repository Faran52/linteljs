import { FOLDER_NAMING, NAMING } from '../naming/naming';

import { COMMON_REACT_PLUGINS, esmAssetImports } from './utils/targetUtils';

import type { TargetRecord } from './record';

interface AppConfig {
  expo?: { experiments?: { reactCompiler?: boolean } };
}

const isAppConfig = (value: unknown): value is AppConfig => {
  return typeof value === 'object' && value !== null;
};

// `framework: 'react'` rather than its own layer: `eslint-plugin-react-native` caps at `eslint ^9` and
// `eslint-config-expo` bundles plugins that collide with `base()`.
export const reactNative: TargetRecord = {
  id: 'react-native',
  label: 'React Native (Expo)',
  // No package-manager flag: Expo reads whichever one invoked it.
  scaffold: (name) => {
    return {
      kind: 'create',
      args: ['expo-app@latest', name, '--yes', '--no-install'],
    };
  },
  framework: 'react',
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
  // `scripts/reset-project.js` is Expo's CommonJS throwaway helper, deleted by most projects on day one.
  ignores: ['.expo/**', 'android/**', 'ios/**', 'expo-env.d.ts', 'scripts/reset-project.js'],
  // `src/app` stays exempt: expo-router resolves a route by its filename.
  naming: NAMING['react-native'],
  folderNaming: FOLDER_NAMING['react-native'],
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
  testSetup: 'mocks/setupTests.reactNative.ts',
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
      source: 'starter/react-native/expo-env.d.ts',
      target: 'expo-env.d.ts',
    },
    {
      source: 'starter/react-native/assets.d.ts',
      target: 'src/typings/assets.d.ts',
    },
    {
      source: 'mocks/renderScreen.tsx',
      target: '__mocks__/renderScreen.tsx',
    },
    {
      source: 'starter/react-native/metro.config.js',
      target: 'metro.config.js',
      library: 'tailwind',
    },
    {
      source: 'starter/react-native/nativewind-env.d.ts',
      target: 'nativewind-env.d.ts',
      library: 'tailwind',
    },
  ],
  // Nineteen findings survived Expo's template against the `--fix` pass; each is repaired below.
  starterFixes: [
    {
      path: 'src/app/explore.tsx',
      transform: esmAssetImports,
    },
    {
      path: 'src/components/animated-icon.web.tsx',
      transform: esmAssetImports,
    },
    {
      path: 'src/components/app-tabs.tsx',
      transform: esmAssetImports,
    },
    {
      path: 'src/components/web-badge.tsx',
      transform: esmAssetImports,
    },
    {
      path: 'src/components/animated-icon.tsx',
      // Keeps `finally`'s guarantee that the app reveals whether or not the splash screen hid.
      transform: (source) => {
        return esmAssetImports(source).replace(
          `        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });`,
          `        const reveal = async (): Promise<void> => {
          try {
            await SplashScreen.hideAsync();
          }
          finally {
            setAnimate(true);
          }
        };

        void reveal();`,
        );
      },
    },
    {
      path: 'src/app/_layout.tsx',
      transform: (source) => {
        return source.replace(
          'SplashScreen.preventAutoHideAsync();',
          'void SplashScreen.preventAutoHideAsync();',
        );
      },
    },
    {
      // `onPress` wants void back; nothing after the browser call needs its result.
      path: 'src/components/external-link.tsx',
      transform: (source) => {
        return source
          .replace('onPress={async (event) => {', 'onPress={(event) => {')
          .replace(
            `          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });`,
            `          void openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });`,
          );
      },
    },
    {
      // Vestigial: the component reads colours from `useTheme()`.
      path: 'src/components/themed-view.tsx',
      transform: (source) => {
        return source
          .replace(`  lightColor?: string;
  darkColor?: string;
`, '')
          .replace(
            'export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {',
            'export function ThemedView({ style, type, ...otherProps }: ThemedViewProps) {',
          );
      },
    },
    {
      // Hydration is an external system, so `useSyncExternalStore` answers it without a throwaway render.
      path: 'src/hooks/use-color-scheme.web.ts',
      transform: (source) => {
        return source
          .replace(
            "import { useEffect, useState } from 'react';",
            "import { useSyncExternalStore } from 'react';",
          )
          .replace(
            `  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);`,
            `  const hasHydrated = useSyncExternalStore(
    () => {
      return () => {
      };
    },
    () => {
      return true;
    },
    () => {
      return false;
    },
  );`,
          );
      },
    },
    {
      // Expo reads `experiments.reactCompiler` from app.json; the template does not always write it.
      path: 'app.json',
      transform: (source: string): string => {
        const config: unknown = JSON.parse(source);

        if (!isAppConfig(config) || config.expo === undefined) {
          return source;
        }

        config.expo.experiments = {
          ...config.expo.experiments,
          reactCompiler: true,
        };

        return `${JSON.stringify(config, null, 2)}\n`;
      },
    },
  ],
  // The one starter suite that cannot meet the strict floor; `record.ts` carries why.
  exemptsStarterTests: true,
  // `src/app` is absent on purpose: renaming a route file renames the route.
  starterRenames: [
    {
      from: 'src/components/animated-icon.tsx',
      to: 'src/components/AnimatedIcon.tsx',
    },
    {
      from: 'src/components/animated-icon.web.tsx',
      to: 'src/components/AnimatedIcon.web.tsx',
    },
    {
      from: 'src/components/animated-icon.module.css',
      to: 'src/components/AnimatedIcon.module.css',
    },
    {
      from: 'src/components/app-tabs.tsx',
      to: 'src/components/AppTabs.tsx',
    },
    {
      from: 'src/components/app-tabs.web.tsx',
      to: 'src/components/AppTabs.web.tsx',
    },
    {
      from: 'src/components/external-link.tsx',
      to: 'src/components/ExternalLink.tsx',
    },
    {
      from: 'src/components/hint-row.tsx',
      to: 'src/components/HintRow.tsx',
    },
    {
      from: 'src/components/themed-text.tsx',
      to: 'src/components/ThemedText.tsx',
    },
    {
      from: 'src/components/themed-view.tsx',
      to: 'src/components/ThemedView.tsx',
    },
    {
      from: 'src/components/web-badge.tsx',
      to: 'src/components/WebBadge.tsx',
    },
    {
      from: 'src/components/ui/collapsible.tsx',
      to: 'src/components/ui/Collapsible.tsx',
    },
    {
      from: 'src/hooks/use-color-scheme.ts',
      to: 'src/hooks/useColorScheme.ts',
    },
    {
      from: 'src/hooks/use-color-scheme.web.ts',
      to: 'src/hooks/useColorScheme.web.ts',
    },
    {
      from: 'src/hooks/use-theme.ts',
      to: 'src/hooks/useTheme.ts',
    },
  ],
  /**
   * One suite per template module, since the gate is 100%; `.web` modules get their own suites because the web
   * variant resolves over the native one. Route suites sit beside `src/app/`, not inside it: expo-router treats every
   * file under the route root as a route, and measured, `expo export` died on `expect is not defined`.
   */
  starterTests: [
    {
      source: 'starter/react-native/app-index.test.tsx',
      target: 'src/app-index.test.tsx',
      covers: 'src/app/index.tsx',
    },
    {
      source: 'starter/react-native/app-layout.test.tsx',
      target: 'src/app-layout.test.tsx',
      covers: 'src/app/_layout.tsx',
    },
    {
      source: 'starter/react-native/app-explore.test.tsx',
      target: 'src/app-explore.test.tsx',
      covers: 'src/app/explore.tsx',
    },
    {
      source: 'starter/react-native/AnimatedIcon.test.tsx',
      target: 'src/components/AnimatedIcon.test.tsx',
      covers: 'src/components/AnimatedIcon.tsx',
    },
    {
      source: 'starter/react-native/AppTabs.test.tsx',
      target: 'src/components/AppTabs.test.tsx',
      covers: 'src/components/AppTabs.tsx',
    },
    {
      source: 'starter/react-native/ExternalLink.test.tsx',
      target: 'src/components/ExternalLink.test.tsx',
      covers: 'src/components/ExternalLink.tsx',
    },
    {
      source: 'starter/react-native/HintRow.test.tsx',
      target: 'src/components/HintRow.test.tsx',
      covers: 'src/components/HintRow.tsx',
    },
    {
      source: 'starter/react-native/ThemedText.test.tsx',
      target: 'src/components/ThemedText.test.tsx',
      covers: 'src/components/ThemedText.tsx',
    },
    {
      source: 'starter/react-native/ThemedView.test.tsx',
      target: 'src/components/ThemedView.test.tsx',
      covers: 'src/components/ThemedView.tsx',
    },
    {
      source: 'starter/react-native/WebBadge.test.tsx',
      target: 'src/components/WebBadge.test.tsx',
      covers: 'src/components/WebBadge.tsx',
    },
    {
      source: 'starter/react-native/Collapsible.test.tsx',
      target: 'src/components/ui/Collapsible.test.tsx',
      covers: 'src/components/ui/Collapsible.tsx',
    },
    {
      source: 'starter/react-native/theme.test.ts',
      target: 'src/constants/theme.test.ts',
      covers: 'src/constants/theme.ts',
    },
    {
      source: 'starter/react-native/useColorScheme.web.test.ts',
      target: 'src/hooks/useColorScheme.web.test.ts',
      covers: 'src/hooks/useColorScheme.web.ts',
    },
    {
      source: 'starter/react-native/app-index.web.test.tsx',
      target: 'src/app-index.web.test.tsx',
      covers: 'src/app/index.tsx',
    },
    {
      source: 'starter/react-native/app-index.android.test.tsx',
      target: 'src/app-index.android.test.tsx',
      covers: 'src/app/index.tsx',
    },
    {
      source: 'starter/react-native/app-explore.web.test.tsx',
      target: 'src/app-explore.web.test.tsx',
      covers: 'src/app/explore.tsx',
    },
    {
      source: 'starter/react-native/AnimatedIcon.web.test.tsx',
      target: 'src/components/AnimatedIcon.web.test.tsx',
      covers: 'src/components/AnimatedIcon.web.tsx',
    },
    {
      source: 'starter/react-native/AppTabs.web.test.tsx',
      target: 'src/components/AppTabs.web.test.tsx',
      covers: 'src/components/AppTabs.web.tsx',
    },
    {
      source: 'starter/react-native/useTheme.test.ts',
      target: 'src/hooks/useTheme.test.ts',
      covers: 'src/hooks/useTheme.ts',
    },
  ],
  typecheck: 'tsc --noEmit',
  // `eas build` needs a remote account, so `expo export --platform web` stands in.
  build: 'expo export --platform web',
  devDependencies: [...COMMON_REACT_PLUGINS],
  // `@srsholmes/vitest-react-native` strips the Flow types and stands in for native modules; its `esbuild` needs an
  // install script, hence `allowBuilds`.
  testDevDependencies: [
    '@srsholmes/vitest-react-native',
    '@testing-library/react-native',
    // The vitest transform only: this target owns no vite build.
    '@vitejs/plugin-react',
  ],
  allowBuilds: ['esbuild'],
  stateRules: ['react-state.md', 'hooks-order.md'],
  routerMocks: true,
};
