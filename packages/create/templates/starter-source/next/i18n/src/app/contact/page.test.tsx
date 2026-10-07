import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import { DataProvider } from '@lib/providers/data/DataProvider';
import { I18nProvider } from '@lib/providers/i18n/I18nProvider';
import { StoreProvider } from '@lib/providers/store/StoreProvider';
import {
  languages,
  languageStorageKey,
  resources,
} from '@i18n/config';
import { chooseLanguage } from '@i18n/i18n';

import ContactPage from './page';

const last = languages.at(-1)?.id ?? 'en';

const open = (): void => {
  render(
    <StoreProvider>
      <DataProvider>
        <ContactPage />
      </DataProvider>
    </StoreProvider>,
    { wrapper: I18nProvider },
  );
};

const fill = (label: string, value: string): void => {
  const field = screen.getByLabelText(label);

  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
};

describe('the contact route', () => {
  afterEach(() => {
    document.cookie = `${languageStorageKey}=; max-age=-1; path=/`;
  });

  it('refuses what the rules refuse, and says why beside the field', async () => {
    open();
    fill('Email', 'not-an-address');

    const element = await screen.findByText('Enter a valid email address.');
    expect(element).toBeTruthy();
  });

  it('flags only the field that was left', async () => {
    open();
    fill('Email', 'not-an-address');
    await screen.findByText('Enter a valid email address.');

    const untouched = screen.queryByText('Write a message of at least ten characters.');

    expect(untouched).toBeNull();
  });

  it('clears an error as soon as the value is valid', async () => {
    open();
    fill('Email', 'not-an-address');
    await screen.findByText('Enter a valid email address.');
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'someone@example.com' } });

    await waitFor(() => {
      const stale = screen.queryByText('Enter a valid email address.');

      expect(stale).toBeNull();
    });
  });

  it('lets a send name the field still missing', async () => {
    open();
    fill('Email', 'someone@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    const element = await screen.findByText('Write a message of at least ten characters.');
    expect(element).toBeTruthy();
  });

  it('sends once both fields are valid', async () => {
    open();
    fill('Email', 'someone@example.com');
    fill('Message', 'Ten characters, at least.');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    const element = await screen.findByRole('status');
    expect(element).toBeTruthy();
  });

  it('speaks the language chosen', () => {
    open();

    act(() => {
      chooseLanguage(last);
    });

    const { common } = resources[last];
    const title = screen.getByRole('heading', { level: 1 }).textContent;

    expect(title).toBe(common.contact);
    const element = screen.getByRole('button', { name: common.contactSend });
    expect(element).toBeTruthy();
  });

  it('labels its fields and says why in the language chosen', async () => {
    open();

    act(() => {
      chooseLanguage(last);
    });

    const { common } = resources[last];
    fill(common.contactEmail, 'not-an-address');

    const element = await screen.findByText(common.contactEmailInvalid);
    expect(element).toBeTruthy();
  });
});
