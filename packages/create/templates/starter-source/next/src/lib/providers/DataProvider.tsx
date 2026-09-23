'use client';

import type { FC, ReactNode } from 'react';

export interface DataProviderProps {
  readonly children: ReactNode;
}

/*
 * The slot a data layer fills. With none, and with RTK Query (whose provider is the Redux one beside it), there is
 * nothing to provide, so this passes its children through.
 *
 * The directive is what makes this the client boundary: the layout above it is a server component, and everything
 * under it inherits the browser.
 */
export const DataProvider: FC<DataProviderProps> = ({ children }) => {
  return children;
};
