import { renderToString } from 'react-dom/server';

import { chooseLanguage } from '@i18n';
import {
  languages,
  languageStorageKey,
  resources,
} from '@i18n/config';
import {
  act,
  render,
  screen,
} from '@testing-library/react';
import { useTranslations } from 'next-intl';

import { I18nProvider } from './I18nProvider';

import type { ReactNode } from 'react';

const last = languages.at(-1)?.id ?? 'en';

const Home = (): ReactNode => {
  const t = useTranslations();

  return <p>{t('home')}</p>;
};

describe('I18nProvider', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('renders the stored choice in the browser, and follows a new one', () => {
    localStorage.setItem(languageStorageKey, last);
    render(<I18nProvider><Home /></I18nProvider>);

    expect(screen.getByText(resources[last].common.home)).toBeTruthy();
    expect(document.documentElement.lang).toBe(last);

    act(() => {
      chooseLanguage('en');
    });

    expect(screen.getByText(resources.en.common.home)).toBeTruthy();
    expect(document.documentElement.lang).toBe('en');
  });

  it('renders English on the server, whatever the reader stored', () => {
    localStorage.setItem(languageStorageKey, last);

    const html = renderToString(<I18nProvider><Home /></I18nProvider>);

    expect(html).toBe(`<p>${resources.en.common.home}</p>`);
  });
});
