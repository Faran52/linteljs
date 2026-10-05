import { Tabs } from 'expo-router';
import { HeaderTitle } from 'expo-router/react-navigation';

import { PAGES } from '@config/routes';
import { MAX_FONT_SCALE, useStarterStyles } from '@styles/starter';

import type { BottomTabNavigationOptions } from 'expo-router/tabs';
import type { ReactNode } from 'react';

// With no icon given, the tab bar draws a placeholder glyph into each tab's accessible name.
const noIcon = (): null => {
  return null;
};

const TabsLayout = (): ReactNode => {
  const { colors, layout } = useStarterStyles();

  const screenOptions: BottomTabNavigationOptions = {
    headerTitle: () => {
      return (
        <HeaderTitle tintColor={colors.foreground} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          LintelJS Starter
        </HeaderTitle>
      );
    },
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

  return (
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
    </Tabs>
  );
};

export default TabsLayout;
