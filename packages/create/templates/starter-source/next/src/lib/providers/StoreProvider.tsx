'use client';

import type { FC, ReactNode } from 'react';

export interface StoreProviderProps {
  readonly children: ReactNode;
}

// The directive makes this the client boundary under the server-component layout.
export const StoreProvider: FC<StoreProviderProps> = ({ children }) => {
  return children;
};
