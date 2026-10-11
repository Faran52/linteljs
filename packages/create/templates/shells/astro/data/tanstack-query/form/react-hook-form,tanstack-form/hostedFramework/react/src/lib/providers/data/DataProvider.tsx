import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { FC, ReactNode } from 'react';

export interface DataProviderProps {
  readonly children: ReactNode;
}

// One client for the application, made once rather than per render.
export const queryClient = new QueryClient();

export const DataProvider: FC<DataProviderProps> = ({ children }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
