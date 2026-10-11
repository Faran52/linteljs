import { createRawSnippet } from 'svelte';

import { render, screen } from '@testing-library/svelte';

import DataProvider from './DataProvider.svelte';

const under = createRawSnippet(() => {
  const snippet = {
    render: () => {
      return '<p>under the data layer</p>';
    },
  };

  return snippet;
});

describe('DataProvider', () => {
  it('renders what sits under it', () => {
    render(DataProvider, { children: under });

    const element = screen.getByText('under the data layer');
    expect(element).toBeTruthy();
  });
});
