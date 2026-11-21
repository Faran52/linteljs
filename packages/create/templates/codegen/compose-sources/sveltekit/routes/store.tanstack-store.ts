import { fireEvent, render, screen } from '@testing-library/svelte';

import Page from './+page.svelte';

export const storeCases = (): void => {
  it('counts up from the store behind it', async () => {
    render(Page);

    const element = screen.getByText('0');
    expect(element).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: 'Add one' }));

    const element2 = screen.getByText('1');
    expect(element2).toBeTruthy();
  });
};
