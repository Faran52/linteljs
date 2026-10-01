import { tick } from 'svelte';

import {
  fireEvent,
  render,
  screen,
} from '@testing-library/svelte';

import { STATUSES } from '@config/statuses';

import { applyLanguage } from '../../../i18n';
import { languages, resources } from '../../../i18n/config';

import StatusPage from './StatusPage.svelte';

const last = languages.at(-1)?.id ?? 'en';

describe('StatusPage', () => {
  afterEach(() => {
    applyLanguage('en');
  });

  it('announces the status under its code, with a way home and nothing to retry', () => {
    render(StatusPage, STATUSES.notFound);

    expect(screen.getByRole('heading', { name: '404' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Page not found');
    const home = screen.getByRole('link', { name: 'Go home' });

    expect(home.getAttribute('href')).toBe('/');
    expect(home.hasAttribute('data-sveltekit-reload')).toBe(true);
    expect(home.classList.contains('status-action-outline')).toBe(false);
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('offers a retry when it is given one', async () => {
    const retried: string[] = [];

    render(StatusPage, {
      ...STATUSES.serverError,
      onretry: () => {
        retried.push('retry');
      },
    });
    await fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    const home = screen.getByRole('link', { name: 'Go home' });

    expect(retried).toEqual(['retry']);
    expect(home.classList.contains('status-action-outline')).toBe(true);
  });

  it('speaks the language chosen', async () => {
    render(StatusPage, STATUSES.forbidden);
    applyLanguage(last);
    await tick();

    const message = screen.getByRole('alert').textContent;

    expect(message).toBe(resources[last].common.statusForbidden);
  });
});
