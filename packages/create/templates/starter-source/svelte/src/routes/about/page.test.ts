import { render, screen } from '@testing-library/svelte';

import Page from './+page.svelte';

describe('about page', () => {
  it('lists every leg of the gate', () => {
    render(Page);

    expect(screen.getByRole('heading', { name: 'About' })).toBeTruthy();
    expect(screen.getByText('pnpm typecheck')).toBeTruthy();
  });

  it('says where the standard lives', () => {
    render(Page);

    expect(screen.getByText('eslint.config.js')).toBeTruthy();
  });
});
