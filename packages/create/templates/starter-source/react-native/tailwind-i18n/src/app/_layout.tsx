import { type ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Tabs } from 'expo-router';
import { HeaderTitle } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';

import { PAGES } from '@config/routes';
import { MAX_FONT_SCALE, useStarterStyles } from '@styles/starter';

import { DataProvider } from '@lib/providers/data/DataProvider';
import { StoreProvider } from '@lib/providers/store/StoreProvider';
import { initI18n, restoreLanguage } from '@i18n';

// Metro has no CSS pipeline; NativeWind is what makes this import mean anything.
import { DocumentHead } from '@features/document-head/DocumentHead';
import { LanguageSelect } from '@features/language-select/LanguageSelect';

import type { BottomTabNavigationOptions } from 'expo-router/tabs';

import '../global.css';

initI18n();

const UNLISTED = { href: null };

// With no icon given, the tab bar draws a placeholder glyph into each tab's accessible name.
const noIcon = (): null => {
  return null;
};

const RootLayout = (): ReactNode => {
  const { t } = useTranslation();
  const { colors, layout } = useStarterStyles();

  useEffect(() => {
    void restoreLanguage();
  }, []);

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
    // The title gives way to the language label, which keeps its own width.
    headerTitleContainerStyle: { flexShrink: 1 },
    headerRightContainerStyle: { flexBasis: 'auto' },
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
    <StoreProvider>
      <DataProvider>
        <DocumentHead />
        {/* `auto` draws dark icons on a light scheme; Android otherwise keeps them light on the light header. */}
        <StatusBar style="auto" />
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
          {/* A route, so Tabs would list it: `href: null` keeps it off the bar. */}
          <Tabs.Screen name="+not-found" options={UNLISTED} />
        </Tabs>
      </DataProvider>
    </StoreProvider>
  );
};

export default RootLayout;

// expo-router wraps the layout in a boundary rendering this, so a crash on any screen lands here.
export { CrashPage as ErrorBoundary } from '@features/crash-page/CrashPage';
