import { page } from '$app/state';

import { render, screen } from '@testing-library/svelte';

import { PAGES } from '@config/routes';

import AppHeader from './AppHeader.svelte';

describe('AppHeader', () => {
  it('names the project and links every page', () => {
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
  });

  it('marks the page it is on for a screen reader', () => {
    Object.assign(page, { url: new URL('http://localhost/about') });
    render(AppHeader, { name: 'my-app' });

    const attribute = screen.getByRole('link', { name: 'About' }).getAttribute('aria-current');
    expect(attribute).toBe('page');
    const homeAttribute = screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current');
    expect(homeAttribute).toBeNull();
  });
});
