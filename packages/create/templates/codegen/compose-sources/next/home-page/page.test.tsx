import {
  act,
  render,
  screen,
} from '@testing-library/react';

import { CHECK, NAME } from '@config/linteljs';

import { I18nProvider } from '@lib/providers/i18n/I18nProvider';
import {
  languages,
  languageStorageKey,
  resources,
} from '@i18n/config';
import { chooseLanguage } from '@i18n/i18n';

import HomePage from './page';
import {
  storeCases,
  storeHelpers,
  storeOpen,
  storeSpoken,
} from './store';

const last = languages.at(-1)?.id ?? 'en';

storeHelpers();

describe('the home route', () => {
  afterEach(() => {
    document.cookie = `${languageStorageKey}=; max-age=-1; path=/`;
  });

  it('carries the project name as its heading', () => {
    storeOpen();

    const element = screen.getByRole('heading', { name: NAME });
    expect(element).toBeTruthy();
  });

  it('names the one command that runs the whole gate', () => {
    storeOpen();

    const element = screen.getByText(CHECK, { selector: 'p code' });
    expect(element).toBeTruthy();
  });

  storeCases();

  it('speaks the language chosen', () => {
    storeOpen();

    act(() => {
      chooseLanguage(last);
    });

    const { common } = resources[last];
    storeSpoken(common);
  });
});
