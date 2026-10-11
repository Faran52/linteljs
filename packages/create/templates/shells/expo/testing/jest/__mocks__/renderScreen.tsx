import { type ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { render } from '@testing-library/react-native';

import { DataProvider } from '@lib/providers/data/DataProvider';
import { StoreProvider } from '@lib/providers/store/StoreProvider';

// `SafeAreaProvider` measures its insets natively, so it has to be real and handed metrics rather than mocked.
const METRICS = {
  frame: {
    x: 0,
    y: 0,
    width: 390,
    height: 844,
  },
  insets: {
    top: 47,
    left: 0,
    right: 0,
    bottom: 34,
  },
};

export const renderScreen = async (ui: ReactElement) => {
  return render(ui, {
    wrapper: ({ children }) => {
      return (
        <SafeAreaProvider initialMetrics={METRICS}>
          <StoreProvider>
            <DataProvider>{children}</DataProvider>
          </StoreProvider>
        </SafeAreaProvider>
      );
    },
  });
};
