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
});
