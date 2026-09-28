import type { FC, ReactNode } from 'react';

export interface StoreProviderProps {
  readonly children: ReactNode;
}

// Its own file, so the entry does not vary by router and store at once.
export const StoreProvider: FC<StoreProviderProps> = ({ children }) => {
  return children;
};
