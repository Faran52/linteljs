import type { FC, ReactNode } from 'react';

export interface DataProviderProps {
  readonly children: ReactNode;
}

// Its own file, so the entry does not vary by router, store and data layer at once.
export const DataProvider: FC<DataProviderProps> = ({ children }) => {
  return children;
};
