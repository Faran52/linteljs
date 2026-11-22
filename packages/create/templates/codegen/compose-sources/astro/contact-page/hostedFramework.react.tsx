import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import { DataProvider } from '@lib/providers/data/DataProvider';

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
  render(
    <DataProvider>
      <ContactPage translate={inEnglish} />
    </DataProvider>,
  );
};

export const fillField = (label: string, value: string): void => {
  const field = screen.getByLabelText(label);

  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
};

export const retypeEmail = (): void => {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'someone@example.com' } });
};

export const headingCase = (renderPage: () => void): void => {};

export const expectSent = async (): Promise<void> => {
  const element = await screen.findByRole('status');
  expect(element).toBeTruthy();
};
