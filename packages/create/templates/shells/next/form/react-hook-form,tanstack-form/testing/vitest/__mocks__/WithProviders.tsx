import { DataProvider } from '@lib/providers/data/DataProvider';
import { StoreProvider } from '@lib/providers/store/StoreProvider';

import type { FC, ReactNode } from 'react';

export interface WithProvidersProps {
  readonly children: ReactNode;
}

export const WithProviders: FC<WithProvidersProps> = ({ children }) => {
  return (
    <StoreProvider>
      <DataProvider>
        {children}
      </DataProvider>
    </StoreProvider>
  );
};
