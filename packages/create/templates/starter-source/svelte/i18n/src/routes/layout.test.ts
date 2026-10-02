import { createRawSnippet } from 'svelte';

import { render, screen } from '@testing-library/svelte';

import { NAME } from '@config/linteljs';

import { applyLanguage } from '@i18n';
import {
  languages,
  languageStorageKey,
  resources,
} from '@i18n/config';

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

    const { title } = document;

    expect(title).toBe(NAME);
    const element = screen.getByText('LintelJS Starter');
    expect(element).toBeTruthy();
    const nameElement = screen.getByText(NAME);
    expect(nameElement).toBeTruthy();
    const linkElement = screen.getByRole('link', { name: 'About' });
    expect(linkElement).toBeTruthy();
    const routedElement = screen.getByText('routed');
    expect(routedElement).toBeTruthy();
  });

  it('marks the page it is on for a screen reader', () => {
    render(Layout, { children: routed });

    const attribute = screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current');
    expect(attribute).toBe('page');
    const ariaCurrentAttribute = screen.getByRole('link', { name: 'About' }).getAttribute('aria-current');
    expect(ariaCurrentAttribute).toBeNull();
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
    const item = localStorage.getItem(languageStorageKey);
    expect(item).toBeNull();
  });
});
