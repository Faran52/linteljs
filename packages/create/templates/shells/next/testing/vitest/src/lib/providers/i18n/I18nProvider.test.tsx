import { renderToString } from 'react-dom/server';

import {
  act,
  render,
  screen,
} from '@testing-library/react';
import { useTranslations } from 'next-intl';

import {
  languages,
  languageStorageKey,
  resources,
} from '@i18n/config';
import { chooseLanguage } from '@i18n/i18n';
import { languageCookie } from '@i18n/utils/cookieUtils';

import { I18nProvider } from './I18nProvider';

import type { ReactNode } from 'react';

const last = languages.at(-1)?.id ?? 'en';

const Home = (): ReactNode => {
  const t = useTranslations();

  return <p>{t('home')}</p>;
};

describe('I18nProvider', () => {
  afterEach(() => {
    document.cookie = `${languageStorageKey}=; max-age=-1; path=/`;
  });

  it('renders the stored choice in the browser, and follows a new one', () => {
    document.cookie = languageCookie(last);
    render(<I18nProvider><Home /></I18nProvider>);

    const element = screen.getByText(resources[last].common.home);
    expect(element).toBeTruthy();
    expect(document.documentElement.lang).toBe(last);

    act(() => {
      chooseLanguage('en');
    });

    const element2 = screen.getByText(resources.en.common.home);
    expect(element2).toBeTruthy();
    expect(document.documentElement.lang).toBe('en');
  });

  it('renders the language the server detected, whatever the browser stored', () => {
    document.cookie = languageCookie('en');

    const html = renderToString(<I18nProvider language={last}><Home /></I18nProvider>);

    expect(html).toBe(`<p>${resources[last].common.home}</p>`);
  });

  it('renders English on the server when it is given no language', () => {
    document.cookie = languageCookie(last);

    const html = renderToString(<I18nProvider><Home /></I18nProvider>);

    expect(html).toBe(`<p>${resources.en.common.home}</p>`);
  });
});
