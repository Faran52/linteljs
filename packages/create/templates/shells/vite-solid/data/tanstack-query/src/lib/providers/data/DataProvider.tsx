import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';

import type { JSX } from 'solid-js';

export interface DataProviderProps {
  readonly children: JSX.Element;
}

// One client for the application, made once rather than per render.
const client = new QueryClient();

export const DataProvider = (props: DataProviderProps): JSX.Element => {
  return <QueryClientProvider client={client}>{props.children}</QueryClientProvider>;
};
