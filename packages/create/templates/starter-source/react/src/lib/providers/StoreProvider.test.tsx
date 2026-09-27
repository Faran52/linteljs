import { render, screen } from '@testing-library/react';

import { StoreProvider } from './StoreProvider';

describe('StoreProvider', () => {
  it('renders what sits under it', () => {
    render(
      <StoreProvider>
        <p>under the store</p>
      </StoreProvider>,
    );

    expect(screen.getByText('under the store')).toBeTruthy();
  });
});
