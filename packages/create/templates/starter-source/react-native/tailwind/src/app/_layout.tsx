import { Tabs } from 'expo-router';

import { PAGES } from '../config/routes';
import { colors, layout } from '../styles/starter';

import type { ReactNode } from 'react';

import '../global.css';

// Metro has no CSS pipeline; NativeWind is what makes this import mean anything.
const RootLayout = (): ReactNode => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: layout.tabBar,
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
