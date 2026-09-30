import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import { initI18n } from '../../i18n';
import { languages, resources } from '../../i18n/config';
import { DataProvider } from '../../lib/providers/data/DataProvider';
import { StoreProvider } from '../../lib/providers/store/StoreProvider';

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

const i18n = initI18n();
const last = languages.at(-1)?.id ?? 'en';

describe('ContactPage', () => {
  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

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
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'someone@example.com' } });

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

  it('sends once both fields are valid', async () => {
    renderPage();
    fill('Email', 'someone@example.com');
    fill('Message', 'Ten characters, at least.');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('status')).toBeTruthy();
  });

  it('speaks the language chosen', async () => {
    renderPage();
    await act(async () => {
      await i18n.changeLanguage(last);
    });

    const { common } = resources[last];
    const title = screen.getByRole('heading', { level: 1 }).textContent;

    expect(title).toBe(common.contact);
    expect(screen.getByRole('button', { name: common.contactSend })).toBeTruthy();
  });
});
