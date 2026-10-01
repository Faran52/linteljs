import { Tabs } from 'expo-router';
import Head from 'expo-router/head';

import { NAME } from '@config/linteljs';
import { PAGES } from '@config/routes';

import { useStarterStyles } from '../styles/starter';

import type { ReactNode } from 'react';

const RootLayout = (): ReactNode => {
  const { colors, layout } = useStarterStyles();

  // Web only: the document the static export writes, with the Mark as its icon.
  return (
    <>
      <Head>
        <title>{NAME}</title>
        <link
          href="/favicon.svg"
          rel="icon"
          type="image/svg+xml"
        />
      </Head>
      <Tabs
        screenOptions={{
          headerTitle: 'LintelJS Starter',
          headerTitleAlign: 'left',
          headerStyle: layout.header,
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: layout.tabBar,
          tabBarIconStyle: { display: 'none' },
          tabBarLabelStyle: { fontSize: 15 },
          tabBarItemStyle: { justifyContent: 'center' },
          sceneStyle: layout.scene,
        }}
      >
        {PAGES
          .map((page) => {
            return (
              <Tabs.Screen
                key={page.id}
                name={page.id === 'home' ? 'index' : page.id}
                options={{ title: page.label }}
              />
            );
          })}
        {/* A route, so Tabs would list it: `href: null` keeps it off the bar. */}
        <Tabs.Screen name="+not-found" options={{ href: null }} />
      </Tabs>
    </>
  );
};

export default RootLayout;

// expo-router wraps the layout in a boundary rendering this, so a crash on any screen lands here.
export { CrashPage as ErrorBoundary } from '@features/crash-page/CrashPage';
