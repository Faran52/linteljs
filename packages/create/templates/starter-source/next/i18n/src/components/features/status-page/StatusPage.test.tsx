import {
  act,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { STATUSES } from '@config/statuses';

import { I18nProvider } from '@lib/providers/i18n/I18nProvider';
import { chooseLanguage } from '@i18n';
import { languages, resources } from '@i18n/config';

import { StatusPage } from './StatusPage';

const last = languages.at(-1)?.id ?? 'en';

describe('StatusPage', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('announces the status under its code, with a way home and nothing to retry', () => {
    render(<StatusPage {...STATUSES.notFound} />, { wrapper: I18nProvider });

    expect(screen.getByRole('heading', { name: '404' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Page not found');
    expect(screen.getByRole('link', { name: 'Go home' }).getAttribute('href')).toBe('/');
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
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

    expect(retried).toEqual(['retry']);
  });

  it('speaks the language chosen', () => {
    render(<StatusPage {...STATUSES.forbidden} />, { wrapper: I18nProvider });
    act(() => {
      chooseLanguage(last);
    });

    expect(screen.getByRole('alert').textContent).toBe(resources[last].common.statusForbidden);
  });
});
