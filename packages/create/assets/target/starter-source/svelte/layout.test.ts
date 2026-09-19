import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';

import Layout from './+layout.svelte';

describe('layout', () => {
  it('renders its children', () => {
    render(Layout, {
      children: createRawSnippet(() => {
        return {
          render: () => {
            return '<p>routed</p>';
          },
        };
      }),
    });

    expect(screen.getByText('routed')).toBeTruthy();
  });
});
