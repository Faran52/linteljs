import { render, screen } from '@testing-library/svelte';

import { STACK } from '@config/linteljs';

import Page from './+page.svelte';

describe('version page', () => {
  it('renders every row it was born with', () => {
    render(Page);

    const element = screen.getByRole('heading', { name: 'Version' });
    expect(element).toBeTruthy();
    expect(screen.getAllByRole('term').length).toBeGreaterThanOrEqual(STACK.length);
  });
});
