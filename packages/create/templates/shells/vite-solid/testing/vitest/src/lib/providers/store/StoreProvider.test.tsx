import { render, screen } from '@solidjs/testing-library';

import { StoreProvider } from './StoreProvider';

describe('StoreProvider', () => {
  it('renders what sits under it', () => {
    render(() => {
      return (
        <StoreProvider>
          <p>under the store</p>
        </StoreProvider>
      );
    });

    const element = screen.getByText('under the store');
    expect(element).toBeTruthy();
  });
});
