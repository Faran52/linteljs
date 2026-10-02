import {
  act,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { STATUSES } from '@config/statuses';

import { initI18n } from '@i18n';
import { languages, resources } from '@i18n/config';

import { StatusPage } from './StatusPage';

const i18n = initI18n();
const last = languages.at(-1)?.id ?? 'en';

describe('StatusPage', () => {
  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  it('announces the status under its code, with a way home and nothing to retry', () => {
    render(<StatusPage {...STATUSES.notFound} />);

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
    );

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    const expected = ['retry'];
    expect(retried).toEqual(expected);
  });

  it('speaks the language chosen', async () => {
    render(<StatusPage {...STATUSES.forbidden} />);

    await act(async () => {
      await i18n.changeLanguage(last);
    });

    expect(screen.getByRole('alert').textContent).toBe(resources[last].common.statusForbidden);
  });
});
