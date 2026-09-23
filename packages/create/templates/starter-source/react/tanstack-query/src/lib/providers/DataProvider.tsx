import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { FC, ReactNode } from 'react';

export interface DataProviderProps {
  readonly children: ReactNode;
}

// One client for the application, made once rather than per render.
const client = new QueryClient();

export const DataProvider: FC<DataProviderProps> = ({ children }) => {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
