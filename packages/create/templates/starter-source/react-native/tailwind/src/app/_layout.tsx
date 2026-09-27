import { Tabs } from 'expo-router';

import { PAGES } from '../config/routes';
import { useStarterStyles } from '../styles/starter';

import type { ReactNode } from 'react';

import '../global.css';

// Metro has no CSS pipeline; NativeWind is what makes this import mean anything.
const RootLayout = (): ReactNode => {
  const { colors, layout } = useStarterStyles();

  return (
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
    </Tabs>
  );
};

export default RootLayout;
