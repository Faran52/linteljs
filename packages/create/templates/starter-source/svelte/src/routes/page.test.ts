import { render, screen } from '@testing-library/svelte';

import Page from './+page.svelte';

describe('page', () => {
  it('renders the welcome heading', () => {
    render(Page);

    expect(screen.getByRole('heading').textContent).toContain('SvelteKit');
  });
});
