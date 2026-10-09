import type { FC, ReactNode } from 'react';

export interface DataProviderProps {
  readonly children: ReactNode;
}

export const DataProvider: FC<DataProviderProps> = ({ children }) => {
  return children;
};
