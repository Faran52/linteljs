import {
  act,
  render,
  screen,
} from '@testing-library/react';

import { CHECK, NAME } from '@config/linteljs';

import { I18nProvider } from '@lib/providers/i18n/I18nProvider';
import { chooseLanguage } from '@i18n';
import {
  languages,
  languageStorageKey,
  resources,
} from '@i18n/config';

import HomePage from './page';

const last = languages.at(-1)?.id ?? 'en';

describe('the home route', () => {
  afterEach(() => {
    document.cookie = `${languageStorageKey}=; max-age=-1; path=/`;
  });

  it('carries the project name as its heading', () => {
    render(<HomePage />, { wrapper: I18nProvider });

    const element = screen.getByRole('heading', { name: NAME });
    expect(element).toBeTruthy();
  });

  it('names the one command that runs the whole gate', () => {
    render(<HomePage />, { wrapper: I18nProvider });

    const element = screen.getByText(CHECK, { selector: 'p > code' });
    expect(element).toBeTruthy();
  });

  it('speaks the language chosen', () => {
    render(<HomePage />, { wrapper: I18nProvider });

    act(() => {
      chooseLanguage(last);
    });

    const { common } = resources[last];
    const element = screen.getByText(common.homeLedeNext);
    expect(element).toBeTruthy();
  });
});
