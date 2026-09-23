import type { FC, ReactNode } from 'react';

export interface StoreProviderProps {
  readonly children: ReactNode;
}

/*
 * The slot a store fills. Two of the three this target offers need no provider at all, so this passes its children
 * through; Redux replaces the whole file with its own `<Provider>`.
 *
 * It is here rather than inside the entry because the entry would otherwise vary by the router and by the store at
 * once, which is a copy per combination. One file per answer keeps that a sum.
 */
export const StoreProvider: FC<StoreProviderProps> = ({ children }) => {
  return children;
};
