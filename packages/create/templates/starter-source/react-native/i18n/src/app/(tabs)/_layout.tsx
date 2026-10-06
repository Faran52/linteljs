import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Tabs } from 'expo-router';
import { HeaderTitle } from 'expo-router/react-navigation';

import { PAGES } from '@config/routes';
import { MAX_FONT_SCALE, useStarterStyles } from '@styles/starter';

import { LanguageSelect } from '@features/language-select/LanguageSelect';

import type { BottomTabNavigationOptions } from 'expo-router/tabs';

// With no icon given, the tab bar draws a placeholder glyph into each tab's accessible name.
const noIcon = (): null => {
  return null;
};

const TabsLayout = (): ReactNode => {
  const { t } = useTranslation();
  const { colors, layout } = useStarterStyles();

  const screenOptions: BottomTabNavigationOptions = {
    headerTitle: () => {
      return (
        <HeaderTitle tintColor={colors.foreground} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          {t('starterLabel')}
        </HeaderTitle>
      );
    },
    headerRight: () => {
      return <LanguageSelect />;
    },
    headerTitleAlign: 'left',
    headerTitleContainerStyle: layout.headerStart,
    headerRightContainerStyle: layout.headerEnd,
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
          const options = { title: t(page.id) };

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
