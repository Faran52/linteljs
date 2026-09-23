import { render, screen } from '@solidjs/testing-library';

import { DataProvider } from './DataProvider';

describe('DataProvider', () => {
  // The slot, whichever data layer answered: with none it passes its children through, and TanStack Query
  // replaces it with its client.
  it('renders what sits under it', () => {
    render(() => {
      return (
        <DataProvider>
          <p>under the data layer</p>
        </DataProvider>
      );
    });

    expect(screen.getByText('under the data layer')).toBeTruthy();
  });
});
