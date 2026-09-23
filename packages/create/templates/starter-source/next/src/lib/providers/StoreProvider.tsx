'use client';

import type { FC, ReactNode } from 'react';

export interface StoreProviderProps {
  readonly children: ReactNode;
}

/*
 * The slot a store fills. Two of the three this target offers need no provider at all, so this passes its children
 * through; Redux replaces the whole file with its own `<Provider>`.
 *
 * The directive is what makes this the client boundary: the layout above it is a server component, and everything
 * under it inherits the browser.
 */
export const StoreProvider: FC<StoreProviderProps> = ({ children }) => {
  return children;
};
