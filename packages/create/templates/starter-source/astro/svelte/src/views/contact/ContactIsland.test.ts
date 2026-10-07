import { render, screen } from '@testing-library/svelte';

import ContactIsland from './ContactIsland.svelte';

describe('ContactIsland', () => {
  it('mounts the contact page inside the provider it reads', () => {
    render(ContactIsland);

    const button = screen.getByRole('button', { name: 'Send' });

    expect(button).toBeTruthy();
  });
});
