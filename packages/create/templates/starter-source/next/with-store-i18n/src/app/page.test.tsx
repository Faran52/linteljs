import {
  act,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { CHECK, NAME } from '@config/linteljs';

import { I18nProvider } from '@lib/providers/i18n/I18nProvider';
import { StoreProvider } from '@lib/providers/store/StoreProvider';
import {
  languages,
  languageStorageKey,
  resources,
} from '@i18n/config';
import { chooseLanguage } from '@i18n/i18n';

import HomePage from './page';

const last = languages.at(-1)?.id ?? 'en';

const open = (): void => {
  render(
    <I18nProvider>
      <StoreProvider>
        <HomePage />
      </StoreProvider>
    </I18nProvider>,
  );
};

describe('the home route', () => {
  afterEach(() => {
    document.cookie = `${languageStorageKey}=; max-age=-1; path=/`;
  });

  it('carries the project name as its heading', () => {
    open();

    const element = screen.getByRole('heading', { name: NAME });
    expect(element).toBeTruthy();
  });

  it('names the one command that runs the whole gate', () => {
    open();

    const element = screen.getByText(CHECK, { selector: 'p > code' });
    expect(element).toBeTruthy();
  });

  it('counts up when the button it holds is pressed', () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Add one' }));

    const element = screen.getByText('1');
    expect(element).toBeTruthy();
  });

  it('speaks the language chosen', () => {
    open();

    act(() => {
      chooseLanguage(last);
    });

    const { common } = resources[last];
    const lede = screen.getByText(common.homeLedeNext);
    const caption = screen.getByText(common.homeCaption);

    expect(lede).toBeTruthy();
    expect(caption).toBeTruthy();
  });
});
