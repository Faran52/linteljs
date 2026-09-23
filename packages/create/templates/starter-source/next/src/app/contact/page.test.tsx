import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { DataProvider } from '../../lib/providers/DataProvider';
import { StoreProvider } from '../../lib/providers/StoreProvider';

import ContactPage from './page';

/*
 * Both slots, the way the layout wraps them: RTK Query's submit is a Redux hook and TanStack Query's wants a
 * client above it, so this one suite covers every combination of the form and data answers.
 */
const open = (): void => {
  render(
    <StoreProvider>
      <DataProvider>
        <ContactPage />
      </DataProvider>
    </StoreProvider>,
  );
};

// Blurred, since the rules run on blur in both form libraries.
const fill = (label: string, value: string): void => {
  const field = screen.getByLabelText(label);

  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
};

describe('the contact route', () => {
  it('refuses what the rules refuse, and says why beside the field', async () => {
    open();
    fill('Email', 'not-an-address');

    expect(await screen.findByText('Enter a valid email address.')).toBeTruthy();
  });

  it('sends once both fields are valid', async () => {
    open();
    fill('Email', 'someone@example.com');
    fill('Message', 'Ten characters, at least.');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('status')).toBeTruthy();
  });
});
