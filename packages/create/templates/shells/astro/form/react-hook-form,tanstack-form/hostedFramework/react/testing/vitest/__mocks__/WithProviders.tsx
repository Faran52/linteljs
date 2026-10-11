import { DataProvider } from '@lib/providers/data/DataProvider';

import type { FC, ReactNode } from 'react';

export interface WithProvidersProps {
  readonly children: ReactNode;
}

// An island keeps its state in atoms, so no store wraps it.
export const WithProviders: FC<WithProvidersProps> = ({ children }) => {
  return (
    <DataProvider>
      {children}
    </DataProvider>
  );
};
