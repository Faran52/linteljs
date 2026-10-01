import { createRawSnippet } from 'svelte';

import { NAME } from '@config/linteljs';
import { render, screen } from '@testing-library/svelte';

import { applyLanguage } from '../i18n';
import {
  languages,
  languageStorageKey,
  resources,
} from '../i18n/config';

import Layout from './+layout.svelte';

const last = languages.at(-1)?.id ?? 'en';

const routed = createRawSnippet(() => {
  return {
    render: () => {
      return '<p>routed</p>';
    },
  };
});

describe('layout', () => {
  afterEach(() => {
    localStorage.clear();
    applyLanguage('en');
    vi.restoreAllMocks();
  });

  it('names the project and links every page, around what it routes', () => {
    render(Layout, { children: routed });

    expect(screen.getByText('LintelJS Starter')).toBeTruthy();
    expect(screen.getByText(NAME)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'About' })).toBeTruthy();
    expect(screen.getByText('routed')).toBeTruthy();
  });

  it('marks the page it is on for a screen reader', () => {
    render(Layout, { children: routed });

    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'About' }).getAttribute('aria-current')).toBeNull();
  });

  it('switches to a stored choice once mounted', async () => {
    localStorage.setItem(languageStorageKey, last);
    render(Layout, { children: routed });

    const about = await screen.findByRole('link', { name: resources[last].common.about });

    expect(about).toBeTruthy();
    expect(document.documentElement.lang).toBe(last);
  });

  it('follows the browser once mounted, and stores nothing', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue([last]);
    render(Layout, { children: routed });

    const label = await screen.findByText(resources[last].common.starterLabel);

    expect(label).toBeTruthy();
    expect(localStorage.getItem(languageStorageKey)).toBeNull();
  });
});
