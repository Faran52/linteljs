import { NAME } from '@config/linteljs';
import { render, screen } from '@testing-library/svelte';

import Page from './+page.svelte';

describe('page', () => {
  it('carries the project name as its heading', () => {
    render(Page);

    expect(screen.getByRole('heading', { name: NAME })).toBeTruthy();
  });

  it('names the one command that runs the whole gate', () => {
    render(Page);

    expect(screen.getByText('pnpm check')).toBeTruthy();
  });
});
