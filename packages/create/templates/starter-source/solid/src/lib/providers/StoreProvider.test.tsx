import { render, screen } from '@solidjs/testing-library';

import { StoreProvider } from './StoreProvider';

describe('StoreProvider', () => {
  // The slot, whichever store answered: what every spelling owes the application is the same, so that is what is
  // asserted rather than which library is behind it.
  it('renders what sits under it', () => {
    render(() => {
      return (
        <StoreProvider>
          <p>under the store</p>
        </StoreProvider>
      );
    });

    expect(screen.getByText('under the store')).toBeTruthy();
  });
});
