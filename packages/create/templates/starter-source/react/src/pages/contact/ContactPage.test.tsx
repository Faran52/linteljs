import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { DataProvider } from '../../lib/providers/DataProvider';
import { StoreProvider } from '../../lib/providers/StoreProvider';

import { ContactPage } from './ContactPage';

const renderPage = (): void => {
  render(
    <StoreProvider>
      <DataProvider>
        <ContactPage />
      </DataProvider>
    </StoreProvider>,
  );
};

const fill = (label: string, value: string): void => {
  const field = screen.getByLabelText(label);

  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
};

describe('ContactPage', () => {
  it('refuses what the rules refuse, and says why beside the field', async () => {
    renderPage();
    fill('Email', 'not-an-address');

    expect(await screen.findByText('Enter a valid email address.')).toBeTruthy();
  });

  it('sends once both fields are valid', async () => {
    renderPage();
    fill('Email', 'someone@example.com');
    fill('Message', 'Ten characters, at least.');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('status')).toBeTruthy();
  });
});
