import { createRawSnippet } from 'svelte';

import { NAME } from '@config/linteljs';
import { render, screen } from '@testing-library/svelte';

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

    expect(screen.getByText(NAME)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'About' })).toBeTruthy();
    expect(screen.getByText('routed')).toBeTruthy();
  });

  // The tabs are links because SvelteKit routes whatever was answered, so the page they are on is said out loud
  // rather than shown. The suite renders no router, so `$app/state` is stood in for at the root.
  it('marks the page it is on for a screen reader', () => {
    render(Layout, { children: routed });

    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'About' }).getAttribute('aria-current')).toBeNull();
  });
});
