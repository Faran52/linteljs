import { render, screen } from '@testing-library/react';

import { DataProvider } from '@lib/providers/data/DataProvider';
import { StoreProvider } from '@lib/providers/store/StoreProvider';

import Contact from './contact';

describe('Contact route', () => {
  it('renders the contact page', () => {
    render(
      <StoreProvider>
        <DataProvider>
          <Contact />
        </DataProvider>
      </StoreProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Contact' })).toBeTruthy();
  });
});
