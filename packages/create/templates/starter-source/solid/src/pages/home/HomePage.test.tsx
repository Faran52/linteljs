import { render, screen } from '@solidjs/testing-library';

import { StoreProvider } from '../../lib/providers/store/StoreProvider';

import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('carries the project name as its heading', () => {
    render(() => {
      return (
        <StoreProvider>
          <HomePage name="my-app" />
        </StoreProvider>
      );
    });

    expect(screen.getByRole('heading', { name: 'my-app' })).toBeTruthy();
  });
});
