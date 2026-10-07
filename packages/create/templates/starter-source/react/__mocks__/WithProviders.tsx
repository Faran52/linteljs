import { DataProvider } from '@lib/providers/data/DataProvider';
import { StoreProvider } from '@lib/providers/store/StoreProvider';

import type { FC, ReactNode } from 'react';

export interface WithProvidersProps {
  readonly children: ReactNode;
}

// What a page renders inside, nested as the app nests it.
export const WithProviders: FC<WithProvidersProps> = ({ children }) => {
  return (
    <StoreProvider>
      <DataProvider>
        {children}
      </DataProvider>
    </StoreProvider>
  );
};
