import { render, screen } from '@testing-library/react';

import { ContactIsland } from './ContactIsland';

describe('ContactIsland', () => {
  it('mounts the contact page inside the provider it reads', () => {
    render(<ContactIsland />);

    const button = screen.getByRole('button', { name: 'Send' });

    expect(button).toBeTruthy();
  });
});
