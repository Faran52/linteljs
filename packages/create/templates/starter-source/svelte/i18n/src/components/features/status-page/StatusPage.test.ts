import { tick } from 'svelte';

import {
  fireEvent,
  render,
  screen,
} from '@testing-library/svelte';

import { STATUSES } from '@config/statuses';

import { applyLanguage } from '@i18n';
import { languages, resources } from '@i18n/config';

import StatusPage from './StatusPage.svelte';

const last = languages.at(-1)?.id ?? 'en';

describe('StatusPage', () => {
  afterEach(() => {
    applyLanguage('en');
  });

  it('announces the status under its code, with a way home and nothing to retry', () => {
    render(StatusPage, STATUSES.notFound);

    const element = screen.getByRole('heading', { name: '404' });
    expect(element).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Page not found');
    const home = screen.getByRole('link', { name: 'Go home' });

    const attribute = home.getAttribute('href');
    expect(attribute).toBe('/');
    const dataSveltekitReloadHasAttribute = home.hasAttribute('data-sveltekit-reload');
    expect(dataSveltekitReloadHasAttribute).toBe(true);
    const statusActionOutlineContains = home.classList.contains('status-action-outline');
    expect(statusActionOutlineContains).toBe(false);
    const buttonElement = screen.queryByRole('button', { name: 'Try again' });
    expect(buttonElement).toBeNull();
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

    const expected = ['retry'];
    expect(retried).toEqual(expected);
    const statusActionOutlineContains = home.classList.contains('status-action-outline');
    expect(statusActionOutlineContains).toBe(true);
  });

  it('speaks the language chosen', async () => {
    render(StatusPage, STATUSES.forbidden);
    applyLanguage(last);
    await tick();

    const message = screen.getByRole('alert').textContent;

    expect(message).toBe(resources[last].common.statusForbidden);
  });
});
