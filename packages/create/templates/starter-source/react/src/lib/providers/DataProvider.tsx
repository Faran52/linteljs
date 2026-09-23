import type { FC, ReactNode } from 'react';

export interface DataProviderProps {
  readonly children: ReactNode;
}

/*
 * The slot a data layer fills. With none, and with RTK Query (whose provider is the Redux one beside it), there is
 * nothing to provide, so this passes its children through.
 *
 * It is here rather than inside the entry for the reason `StoreProvider` is: the entry would otherwise vary by the
 * router, the store and the data layer at once, which is a copy per combination instead of a file per answer.
 */
export const DataProvider: FC<DataProviderProps> = ({ children }) => {
  return children;
};
