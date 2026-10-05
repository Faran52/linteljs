import { type ReactNode, useEffect } from 'react';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DataProvider } from '@lib/providers/data/DataProvider';
import { StoreProvider } from '@lib/providers/store/StoreProvider';
import { initI18n, restoreLanguage } from '@i18n';

import { DocumentHead } from '@features/document-head/DocumentHead';

// Metro has no CSS pipeline; NativeWind is what makes this import mean anything.
import '../global.css';

initI18n();

// The tabs draw their own header; the 404 sits outside them, so the bar counts only its tabs.
const STACK_OPTIONS = { headerShown: false };

const RootLayout = (): ReactNode => {
  useEffect(() => {
    void restoreLanguage();
  }, []);

  return (
    <StoreProvider>
      <DataProvider>
        <DocumentHead />
        {/* `auto` draws dark icons on a light scheme; Android otherwise keeps them light on the light header. */}
        <StatusBar style="auto" />
        <Stack screenOptions={STACK_OPTIONS} />
      </DataProvider>
    </StoreProvider>
  );
};

export default RootLayout;

// expo-router wraps the layout in a boundary rendering this, so a crash on any screen lands here.
export { CrashPage as ErrorBoundary } from '@features/crash-page/CrashPage';
