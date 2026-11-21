import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { DataProvider } from '@lib/providers/data/DataProvider';
import { StoreProvider } from '@lib/providers/store/StoreProvider';

import { App } from './App';
import { routerCases } from './router';

import type { ReactNode } from 'react';

const wrapped = (ui: ReactNode): ReactNode => {
  return (
    <StoreProvider>
      <DataProvider>{ui}</DataProvider>
    </StoreProvider>
  );
};

describe('App', () => {
  routerCases(wrapped);
});
