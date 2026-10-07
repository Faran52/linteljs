import { page } from '$app/state';

import { render, screen } from '@testing-library/svelte';

import { PAGES } from '@config/routes';

import { languages, resources } from '@i18n/config';
import { applyLanguage } from '@i18n/i18n';

import AppHeader from './AppHeader.svelte';

const last = languages.at(-1)?.id ?? 'en';

describe('AppHeader', () => {
  afterEach(() => {
    applyLanguage('en');
  });

  it('names the project and links every page, with a language to choose', () => {
    render(AppHeader, { name: 'my-app' });

    const element = screen.getByText('LintelJS Starter');
    expect(element).toBeTruthy();
    const nameElement = screen.getByText('my-app');
    expect(nameElement).toBeTruthy();
    const hrefs = PAGES
      .map((entry) => {
        return screen.getByRole('link', { name: entry.label }).getAttribute('href');
      });
    const expected = PAGES
      .map((entry) => {
        return entry.href;
      });
    expect(hrefs).toEqual(expected);
    const select = screen.getByRole('combobox', { name: 'Language' });
    expect(select).toBeTruthy();
  });

  it('marks the page it is on for a screen reader', () => {
    Object.assign(page, { url: new URL('http://localhost/about') });
    render(AppHeader, { name: 'my-app' });

    const attribute = screen.getByRole('link', { name: 'About' }).getAttribute('aria-current');
    expect(attribute).toBe('page');
    const homeAttribute = screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current');
    expect(homeAttribute).toBeNull();
  });

  it('renders the language the server detected', () => {
    Object.assign(page, { data: { language: last } });
    render(AppHeader, { name: 'my-app' });

    const about = screen.getByRole('link', { name: resources[last].common.about });

    expect(about).toBeTruthy();
  });
});
