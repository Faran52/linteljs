import {
  fireEvent,
  render,
  screen,
} from '@solidjs/testing-library';

import { DataProvider } from '../../lib/providers/DataProvider';

import { ContactPage } from './ContactPage';

const renderPage = (): void => {
  render(() => {
    return (
      <DataProvider>
        <ContactPage />
      </DataProvider>
    );
  });
};

const fill = (label: string, value: string): void => {
  const field = screen.getByLabelText(label);

  fireEvent.input(field, { target: { value } });
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
