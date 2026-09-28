'use client';

import { Provider } from 'react-redux';

import { store } from '../../store/counter/counterStore';

import type { FC, ReactNode } from 'react';

export interface StoreProviderProps {
  readonly children: ReactNode;
}

// Redux is the one store here that needs an ancestor.
export const StoreProvider: FC<StoreProviderProps> = ({ children }) => {
  return <Provider store={store}>{children}</Provider>;
};
