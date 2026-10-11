import { render, screen } from '@testing-library/svelte';

import { GATE } from '@config/linteljs';

import Page from './+page.svelte';

describe('about page', () => {
  it('lists every leg of the gate', () => {
    render(Page);

    const element = screen.getByRole('heading', { name: 'About' });
    expect(element).toBeTruthy();

    for (const { command } of GATE) {
      const element = screen.getByText(command);
      expect(element).toBeTruthy();
    }
  });

  it('says where the standard lives', () => {
    render(Page);

    const element = screen.getByText('eslint.config.ts');
    expect(element).toBeTruthy();
  });
});
