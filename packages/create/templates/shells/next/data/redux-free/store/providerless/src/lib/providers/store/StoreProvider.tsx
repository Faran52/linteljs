import type { FC, ReactNode } from 'react';

export interface StoreProviderProps {
  readonly children: ReactNode;
}

export const StoreProvider: FC<StoreProviderProps> = ({ children }) => {
  return children;
};
