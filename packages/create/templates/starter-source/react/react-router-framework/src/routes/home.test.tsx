import { render, screen } from '@testing-library/react';

import { NAME } from '@config/linteljs';

import { DataProvider } from '@lib/providers/data/DataProvider';
import { StoreProvider } from '@lib/providers/store/StoreProvider';

import Home from './home';

describe('Home route', () => {
  it('renders the home page under the project name', () => {
    render(
      <StoreProvider>
        <DataProvider>
          <Home />
        </DataProvider>
      </StoreProvider>,
    );

    const element = screen.getByRole('heading', { name: NAME });
    expect(element).toBeTruthy();
  });
});
