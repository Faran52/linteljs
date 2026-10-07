import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/svelte';

import { t } from '@i18n/i18n';

import WithPhrase from '@mocks/WithPhrase.svelte';

import type { ContactCopyKey } from './utils/contactCopyUtils';

const inEnglish = (key: ContactCopyKey): string => {
  return t(key);
};

const renderPage = (): void => {
  render(WithPhrase, { phrase: inEnglish });
};

const fill = async (label: string, value: string): Promise<void> => {
  const field = screen.getByLabelText(label);

  await fireEvent.input(field, { target: { value } });
  await fireEvent.blur(field);
};

describe('ContactPage', () => {
  it('names itself and says what it does in the words it is handed', () => {
    renderPage();

    const heading = screen.getByRole('heading', { name: 'Contact' });

    expect(heading).toBeTruthy();
  });

  it('says why a field is refused in the words it is handed', async () => {
    renderPage();
    await fill('Email', 'not-an-address');

    const element = await screen.findByText('Enter a valid email address.');

    expect(element).toBeTruthy();
  });

  it('clears an error as soon as the value is valid', async () => {
    renderPage();
    await fill('Email', 'not-an-address');
    await screen.findByText('Enter a valid email address.');
    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'someone@example.com' } });

    await waitFor(() => {
      const stale = screen.queryByText('Enter a valid email address.');

      expect(stale).toBeNull();
    });
  });

  it('lets a send name the field still missing', async () => {
    renderPage();
    await fill('Email', 'someone@example.com');
    await fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    const element = await screen.findByText('Write a message of at least ten characters.');

    expect(element).toBeTruthy();
  });

  it('confirms in the words it is handed once both fields are valid', async () => {
    renderPage();
    await fill('Email', 'someone@example.com');
    await fill('Message', 'Ten characters, at least.');
    await fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    const element = await screen.findByRole('status');

    expect(element.textContent).toBe(t('contactSent'));
  });
});
