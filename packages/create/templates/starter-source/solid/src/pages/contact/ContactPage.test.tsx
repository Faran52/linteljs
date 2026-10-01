import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@solidjs/testing-library';

import { DataProvider } from '@lib/providers/data/DataProvider';

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

  it('flags only the field that was left', async () => {
    renderPage();
    fill('Email', 'not-an-address');
    await screen.findByText('Enter a valid email address.');

    const untouched = screen.queryByText('Write at least ten characters.');

    expect(untouched).toBeNull();
  });

  it('clears an error as soon as the value is valid', async () => {
    renderPage();
    fill('Email', 'not-an-address');
    await screen.findByText('Enter a valid email address.');
    fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'someone@example.com' } });

    await waitFor(() => {
      const stale = screen.queryByText('Enter a valid email address.');

      expect(stale).toBeNull();
    });
  });

  it('lets a send name the field still missing', async () => {
    renderPage();
    fill('Email', 'someone@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('Write at least ten characters.')).toBeTruthy();
  });

  it('names itself and says what it does', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Contact' })).toBeTruthy();
    expect(screen.getByText('Two fields, validated on blur. Nothing is sent anywhere.')).toBeTruthy();
  });

  it('sends once both fields are valid', async () => {
    renderPage();
    fill('Email', 'someone@example.com');
    fill('Message', 'Ten characters, at least.');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    const sent = await screen.findByRole('status');

    expect(sent.textContent).toBe('Thanks. Nothing was sent, this is a starter.');
  });
});
