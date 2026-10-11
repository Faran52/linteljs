import { render, screen } from '@testing-library/react';

import { DataProvider } from '@lib/providers/data/DataProvider';
import { StoreProvider } from '@lib/providers/store/StoreProvider';

import Contact from './ContactRoute';

describe('Contact route', () => {
  it('renders the contact page', () => {
    render(
      <StoreProvider>
        <DataProvider>
          <Contact />
        </DataProvider>
      </StoreProvider>,
    );

    const element = screen.getByRole('heading', { name: 'Contact' });
    expect(element).toBeTruthy();
  });
});
