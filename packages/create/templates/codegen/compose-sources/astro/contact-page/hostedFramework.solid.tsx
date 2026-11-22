import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@solidjs/testing-library';

import { DataProvider } from '@lib/providers/data/DataProvider';
import { t } from '@i18n/i18n';

import { ContactPage } from './ContactPage';

import type { ContactCopyKey } from './utils/contactCopyUtils';

export const testing = {
  events: fireEvent,
  screen,
  waitFor: (check: () => void) => {
    return waitFor(check);
  },
};

export const mountPage = (inEnglish: (key: ContactCopyKey) => string): void => {
  render(() => {
    return (
      <DataProvider>
        <ContactPage translate={inEnglish} />
      </DataProvider>
    );
  });
};

export const fillField = (label: string, value: string): void => {
  const field = screen.getByLabelText(label);

  fireEvent.input(field, { target: { value } });
  fireEvent.blur(field);
};

export const retypeEmail = (): void => {
  fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'someone@example.com' } });
};

export const headingCase = (renderPage: () => void): void => {
  it('names itself and says what it does', () => {
    renderPage();

    const element = screen.getByRole('heading', { name: 'Contact' });
    expect(element).toBeTruthy();
    const element2 = screen.getByText(t('contactLede'));
    expect(element2).toBeTruthy();
  });
};

export const expectSent = async (): Promise<void> => {
  const sent = await screen.findByRole('status');

  expect(sent.textContent).toBe(t('contactSent'));
};
