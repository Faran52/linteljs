import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { I18nProvider } from '@lib/providers/i18n/I18nProvider';
import { StoreProvider } from '@lib/providers/store/StoreProvider';
import { type resources } from '@i18n/config';

import HomePage from './page';

type Common = (typeof resources)[keyof typeof resources]['common'];

export const storeHelpers = (): void => {
  const open = (): void => {
    render(
      <I18nProvider>
        <StoreProvider>
          <HomePage />
        </StoreProvider>
      </I18nProvider>,
    );
  };
};

export const storeOpen = (): void => {
  open();
};

export const storeCases = (): void => {
  it('counts up when the button it holds is pressed', () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Add one' }));

    const element = screen.getByText('1');
    expect(element).toBeTruthy();
  });
};

export const storeSpoken = (common: Common): void => {
  const lede = screen.getByText(common.homeLedeNext);
  const caption = screen.getByText(common.homeCaption);

  expect(lede).toBeTruthy();
  expect(caption).toBeTruthy();
};
