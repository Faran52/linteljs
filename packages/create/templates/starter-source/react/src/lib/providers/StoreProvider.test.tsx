import { render, screen } from '@testing-library/react';

import { StoreProvider } from './StoreProvider';

describe('StoreProvider', () => {
  // The slot, whichever store answered: with none it passes its children through, and Redux replaces it with its
  // own `<Provider>`. What every spelling owes the application is the same, so this is what is asserted.
  it('renders what sits under it', () => {
    render(
      <StoreProvider>
        <p>under the store</p>
      </StoreProvider>,
    );

    expect(screen.getByText('under the store')).toBeTruthy();
  });
});
