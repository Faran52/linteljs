import { createRawSnippet } from 'svelte';

import { render, screen } from '@testing-library/svelte';

import { NAME } from '@config/linteljs';

import Layout from './+layout.svelte';

const routed = createRawSnippet(() => {
  const snippet = {
    render: () => {
      return '<p>routed</p>';
    },
  };

  return snippet;
});

describe('layout', () => {
  it('titles the page and puts the header around what it routes', () => {
    render(Layout, { children: routed });

    const { title } = document;

    expect(title).toBe(NAME);
    const nameElement = screen.getByText(NAME);
    expect(nameElement).toBeTruthy();
    const routedElement = screen.getByText('routed');
    expect(routedElement).toBeTruthy();
  });
});
