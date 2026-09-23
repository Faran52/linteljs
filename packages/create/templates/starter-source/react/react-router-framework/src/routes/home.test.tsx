import { render, screen } from '@testing-library/react';

import { NAME } from '../config/linteljs';
import { DataProvider } from '../lib/providers/DataProvider';
import { StoreProvider } from '../lib/providers/StoreProvider';

import Home from './home';

/*
 * Through both slots, the way `root.tsx` wraps the document. Redux is the one store that needs an ancestor and
 * TanStack Query needs its client, so the page reads nothing without them; under the other answers both are
 * pass-throughs and this costs a component each.
 */
describe('Home route', () => {
  it('renders the home page under the project name', () => {
    render(
      <StoreProvider>
        <DataProvider>
          <Home />
        </DataProvider>
      </StoreProvider>,
    );

    expect(screen.getByRole('heading', { name: NAME })).toBeTruthy();
  });
});
