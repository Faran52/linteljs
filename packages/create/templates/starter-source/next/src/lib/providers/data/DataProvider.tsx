'use client';

import type { FC, ReactNode } from 'react';

export interface DataProviderProps {
  readonly children: ReactNode;
}

// The directive makes this the client boundary under the server-component layout.
export const DataProvider: FC<DataProviderProps> = ({ children }) => {
  return children;
};
