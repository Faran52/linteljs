import { isJsonObject } from '@utils/objectUtils';

// A fix table names its transform, so the helper comes in here rather than the table going out to it.
import { esmAssetImports } from '../utils/targetUtils';

import type { StarterFix, StarterRename } from '../types';

interface ExpoExperiments {
  reactCompiler?: boolean;
}

interface ExpoSection {
  experiments?: ExpoExperiments;
}

interface AppConfig {
  expo?: ExpoSection;
}

const isAppConfig = (value: unknown): value is AppConfig => {
  return isJsonObject(value);
};

// Nineteen findings survived Expo's template against the `--fix` pass; each is repaired below.
export const STARTER_FIXES: StarterFix[] = [
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
        )
        // The one prop the link adds is an unnamed shape, which `no-inline-object-types` refuses.
        .replace(
          "type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };",
          `interface ExternalLinkOwnProps {
  href: Href & string;
}

type Props = Omit<ComponentProps<typeof Link>, 'href'> & ExternalLinkOwnProps;`,
        );
    },
  },
  {
    // The variant union and the colour are an unnamed shape, which `no-inline-object-types` refuses.
    path: 'src/components/themed-text.tsx',
    transform: (source) => {
      return source.replace(`export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};`, `interface ThemedTextOwnProps {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
}

export type ThemedTextProps = TextProps & ThemedTextOwnProps;`);
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
        )
        // What is left of the intersection is still a shape with no name, which `no-inline-object-types` refuses.
        .replace(`export type ThemedViewProps = ViewProps & {
  type?: ThemeColor;
};`, `interface ThemedViewOwnProps {
  type?: ThemeColor;
}

export type ThemedViewProps = ViewProps & ThemedViewOwnProps;`);
    },
  },
  {
    // The one prop is an unnamed shape intersected with `PropsWithChildren`, which that type takes as a parameter.
    path: 'src/components/ui/collapsible.tsx',
    transform: (source) => {
      return source.replace(
        'export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {',
        `interface CollapsibleProps {
  title: string;
}

export function Collapsible({ children, title }: PropsWithChildren<CollapsibleProps>) {`,
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
        // Hydration happens once and never reverts, so there is nothing to unsubscribe from.
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
    // Expo reads `experiments.reactCompiler` from app.json; the template is not guaranteed to write it, though
    // sdk-57's does, which is usually what makes this a no-op.
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
    idempotent: true,
  },
];

// `src/app` is absent on purpose: renaming a route file renames the route.
export const STARTER_RENAMES: StarterRename[] = [
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
];
