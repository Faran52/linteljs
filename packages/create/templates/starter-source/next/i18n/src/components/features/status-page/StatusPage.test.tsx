import {
  act,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { STATUSES } from '@config/statuses';

import { I18nProvider } from '@lib/providers/i18n/I18nProvider';
import {
  languages,
  languageStorageKey,
  resources,
} from '@i18n/config';
import { chooseLanguage } from '@i18n/i18n';

import { StatusPage } from './StatusPage';

const last = languages.at(-1)?.id ?? 'en';

describe('StatusPage', () => {
  afterEach(() => {
    document.cookie = `${languageStorageKey}=; max-age=-1; path=/`;
  });

  it('announces the status under its code, with a way home and nothing to retry', () => {
    render(<StatusPage {...STATUSES.notFound} />, { wrapper: I18nProvider });

    const element = screen.getByRole('heading', { name: '404' });
    expect(element).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Page not found');
    const attribute = screen.getByRole('link', { name: 'Go home' }).getAttribute('href');
    expect(attribute).toBe('/');
    const buttonElement = screen.queryByRole('button', { name: 'Try again' });
    expect(buttonElement).toBeNull();
  });

  it('offers a retry when it is given one', () => {
    const retried: string[] = [];

    render(
      <StatusPage
        {...STATUSES.serverError}
        onRetry={() => {
          retried.push('retry');
        }}
      />,
      { wrapper: I18nProvider },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    const expected = ['retry'];
    expect(retried).toEqual(expected);
  });

  it('speaks the language chosen', () => {
    render(<StatusPage {...STATUSES.forbidden} />, { wrapper: I18nProvider });

    act(() => {
      chooseLanguage(last);
    });

    expect(screen.getByRole('alert').textContent).toBe(resources[last].common.statusForbidden);
  });
});
