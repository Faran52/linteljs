import { render, screen } from '@testing-library/react';

import { I18nProvider } from '@lib/providers/i18n/I18nProvider';
import { type resources } from '@i18n/config';

import HomePage from './page';

type Common = (typeof resources)[keyof typeof resources]['common'];

export const storeHelpers = (): void => {};

export const storeOpen = (): void => {
  render(<HomePage />, { wrapper: I18nProvider });
};

export const storeCases = (): void => {};

export const storeSpoken = (common: Common): void => {
  const element = screen.getByText(common.homeLedeNext);
  expect(element).toBeTruthy();
};
