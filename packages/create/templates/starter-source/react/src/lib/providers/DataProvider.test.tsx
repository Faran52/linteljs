import { render, screen } from '@testing-library/react';

import { DataProvider } from './DataProvider';

describe('DataProvider', () => {
  // The slot, whichever data layer answered: with none and with RTK Query it passes its children through, and
  // TanStack Query replaces it with its client.
  it('renders what sits under it', () => {
    render(
      <DataProvider>
        <p>under the data layer</p>
      </DataProvider>,
    );

    expect(screen.getByText('under the data layer')).toBeTruthy();
  });
});
