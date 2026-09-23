import { STACK } from '@config/linteljs';
import { render, screen } from '@testing-library/svelte';

import Page from './+page.svelte';

describe('version page', () => {
  it('renders every row it was born with', () => {
    render(Page);

    expect(screen.getByRole('heading', { name: 'Version' })).toBeTruthy();
    expect(screen.getAllByRole('term').length).toBeGreaterThanOrEqual(STACK.length);
  });
});
