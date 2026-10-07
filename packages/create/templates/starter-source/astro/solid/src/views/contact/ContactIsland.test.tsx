import { render, screen } from '@solidjs/testing-library';

import { ContactIsland } from './ContactIsland';

describe('ContactIsland', () => {
  it('mounts the contact page inside the provider it reads', () => {
    render(() => {
      return <ContactIsland />;
    });

    const button = screen.getByRole('button', { name: 'Send' });

    expect(button).toBeTruthy();
  });
});
