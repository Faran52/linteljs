import { FOLDER_NAMING, NAMING } from '../naming/naming';

import { COMMON_REACT_PLUGINS, esmAssetImports } from './utils/targetUtils';

import type { TargetRecord } from './record';

// React Native through Expo; `framework: 'react'` rather than its own layer, since `eslint-plugin-react-native` caps at
// `eslint ^9` and `eslint-config-expo` bundles plugins that collide with what `base()` already registers.
export const reactNative: TargetRecord = {
  id: 'react-native',
  label: 'React Native (Expo)',
  // `--yes` takes the default expo-router template; there's no package-manager flag since Expo reads whichever one
  // invoked it, which the `create` spelling provides.
  scaffold: (name) => {
    return {
      kind: 'create',
      args: ['expo-app@latest', name, '--yes', '--no-install'],
    };
  },
  framework: 'react',
  // No document for the html layer to lint. There is CSS: the template ships `src/global.css` and a CSS module beside
  // a component, so `lint:css` has a real glob to run over.
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
  // `scripts/reset-project.js` is Expo's own throwaway helper: CommonJS with sixteen findings, deleted by most projects
  // on day one and not the gate's concern to lint.
  ignores: ['.expo/**', 'android/**', 'ios/**', 'expo-env.d.ts', 'scripts/reset-project.js'],
  /**
   * The Expo template doesn't follow this convention (`themed-text.tsx`, `use-color-scheme.ts`); `starterRenames` fixes
   * that rather than an exception here. `src/app` stays exempt since expo-router resolves a route by its filename, so
   * `index.tsx`/`_layout.tsx` are the router's spelling, not the author's.
   */
  naming: NAMING['react-native'],
  folderNaming: FOLDER_NAMING['react-native'],
  hooksAlias: { '@hooks/*': './src/hooks/*' },
  /**
   * Expo's starter imports through these two aliases in seventeen files, and lintel's alias map replaces `paths`
   * outright, so dropping them makes every one unresolved (measured: thirty `no-unresolved` findings dragging a hundred
   * fifty `no-unsafe-*` behind them). `@/assets/*` is separate: the assets sit outside `src/`, where `@/*` can't reach.
   */
  extraAliases: {
    '@/assets/*': './assets/*',
    '@/*': './src/*',
  },
  // `expo/tsconfig.base` carries the module resolution and asset declarations React Native needs; `.expo/types` (from
  // `expo customize tsconfig`) holds generated route types, and `expo-env.d.ts` declares the bundler's own modules.
  styleEntry: 'src/global.css',
  // No vite config of its own, so nothing to contribute; see the field on `TargetRecord`.
  vitePlugin: {
    imports: [],
    calls: [],
  },
  tsconfig: {
    jsx: 'react-jsx',
    extends: 'expo/tsconfig.base',
    include: ['.expo/types/**/*.ts', 'expo-env.d.ts'],
  },
  // The template imports these five as values, which `verbatimModuleSyntax` rejects; Expo's own tsconfig doesn't set
  // that flag, lintel's does, so lintel repairs the cost.
  typeOnlyImports: {
    'react': ['PropsWithChildren'],
    'expo-router': ['Href'],
    'expo-router/ui': ['TabListProps', 'TabTriggerSlotProps'],
    '@/constants/theme': ['ThemeColor'],
  },
  // Stand-ins for the native modules the template imports, none of which loads under a test.
  testSetup: 'mocks/setupTests.reactNative.ts',
  // Native and web: three modules exist only as `.web` variants a native run never loads; the extension lists mirror
  // Metro's resolution order, most specific variant first, bare `.tsx` as the shared fallback.
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
    // Not written by a `--no-install` scaffold, so without it `import '@/global.css'` has no declaration and `tsc`
    // stops.
    {
      source: 'starter/react-native/expo-env.d.ts',
      target: 'expo-env.d.ts',
    },
    // Declares the types `esmAssetImports`'s rewritten imports need to typecheck.
    {
      source: 'starter/react-native/assets.d.ts',
      target: 'src/typings/assets.d.ts',
    },
    // The one render helper every starter test shares.
    {
      source: 'mocks/renderScreen.tsx',
      target: '__mocks__/renderScreen.tsx',
    },
  ],
  // Nineteen findings survived Expo's template against lintel's `--fix` pass; every one is repaired below.
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
      // Rewrites the asset requires and replaces the floating promise chain, keeping `finally`'s guarantee that the app
      // reveals whether or not the splash screen hid.
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
      // `onPress` wants void back but the handler was `async`, returning an unawaited promise on every tap; nothing
      // after the browser call needs its result, so `async` goes.
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
      // `lightColor`/`darkColor` are vestigial: the component reads colours from `useTheme()` and only destructured
      // these two to keep them out of the spread.
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
      // "Have we hydrated" is a question about an external system, so `useSyncExternalStore` answers it directly rather
      // than through a throwaway render.
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
        // Nothing to unsubscribe from: the value never changes after hydration.
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
  ],
  // The starter suite below is the one that cannot meet the strict floor: `record.ts` carries why.
  exemptsStarterTests: true,
  // `src/app` is absent on purpose: expo-router resolves a route by filename, so renaming `index.tsx` would rename the
  // route.
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
   * One suite per module of Expo's template, since the coverage gate is 100% and this is a demo app, not the single
   * starter component every other target scaffolds; the `.web` modules get their own `*.web.test.tsx` suites, since a
   * test written against the native implementation fails once the web variant resolves under it.
   * Route suites sit beside `src/app/`, not inside it, since expo-router's context treats every `.ts`/`.tsx` under the
   * route root as a route (only `+api`/`+middleware`/`+html`/`+native-intent` are ignored). Measured with a suite left
   * inside: `expo export --platform web` dies on `expect is not defined` and `--platform ios` dies bundling
   * `@testing-library/react-native` into the app; moved out, both export clean.
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
  // The one target with no scaffolder-written `build`: `eas build` needs a remote account, so `expo export --platform
  // web` stands in, since web is also the platform that statically renders every route.
  build: 'expo export --platform web',
  // The shared list, not a copy of it: this target composes `react()`, so it installs what that layer loads.
  devDependencies: [...COMMON_REACT_PLUGINS],
  // `@srsholmes/vitest-react-native` is what lets vitest load React Native at all, stripping the untranspiled Flow
  // types and standing in for native modules; its `esbuild` dependency needs an install script, hence `allowBuilds`.
  testDevDependencies: [
    '@srsholmes/vitest-react-native',
    '@testing-library/react-native',
    // The vitest transform only: this target owns no vite build, so it never becomes the SWC variant the React
    // target's build wiring moved to.
    '@vitejs/plugin-react',
  ],
  allowBuilds: ['esbuild'],
  stateRules: ['react-state.md', 'hooks-order.md'],
  routerMocks: true,
};
