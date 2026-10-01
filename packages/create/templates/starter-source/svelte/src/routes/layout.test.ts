import { createRawSnippet } from 'svelte';

import { render, screen } from '@testing-library/svelte';

import { NAME } from '@config/linteljs';

import Layout from './+layout.svelte';

const routed = createRawSnippet(() => {
  return {
    render: () => {
      return '<p>routed</p>';
    },
  };
});

describe('layout', () => {
  it('names the project and links every page, around what it routes', () => {
    render(Layout, { children: routed });

    const title = document.title;

    expect(title).toBe(NAME);
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
});
