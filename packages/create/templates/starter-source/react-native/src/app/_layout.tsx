import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Head from 'expo-router/head';

import { NAME } from '@config/linteljs';
import { PAGES } from '@config/routes';
import { useStarterStyles } from '@styles/starter';

import type { BottomTabNavigationOptions } from 'expo-router/tabs';
import type { ReactNode } from 'react';

const UNLISTED = { href: null };

// With no icon given, the tab bar draws a placeholder glyph into each tab's accessible name.
const noIcon = (): null => {
  return null;
};

const RootLayout = (): ReactNode => {
  const { colors, layout } = useStarterStyles();

  const screenOptions: BottomTabNavigationOptions = {
    headerTitle: 'LintelJS Starter',
    headerTitleAlign: 'left',
    headerStyle: layout.header,
    headerTintColor: colors.foreground,
    headerShadowVisible: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: layout.tabBar,
    tabBarIcon: noIcon,
    tabBarIconStyle: { display: 'none' },
    tabBarLabelStyle: { fontSize: 15 },
    tabBarItemStyle: { justifyContent: 'center' },
    sceneStyle: layout.scene,
  };

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
      {/* `auto` draws dark icons on a light scheme; Android otherwise keeps them light on the light header. */}
      <StatusBar style="auto" />
      <Tabs screenOptions={screenOptions}>
        {PAGES
          .map((page) => {
            const options = { title: page.label };

            return (
              <Tabs.Screen
                key={page.id}
                name={page.id === 'home' ? 'index' : page.id}
                options={options}
              />
            );
          })}
        {/* A route, so Tabs would list it: `href: null` keeps it off the bar. */}
        <Tabs.Screen name="+not-found" options={UNLISTED} />
      </Tabs>
    </>
  );
};

export default RootLayout;

// expo-router wraps the layout in a boundary rendering this, so a crash on any screen lands here.
export { CrashPage as ErrorBoundary } from '@features/crash-page/CrashPage';
