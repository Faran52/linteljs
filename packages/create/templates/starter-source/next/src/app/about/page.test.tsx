import { render, screen } from '@testing-library/react';

import { GATE } from '../../config/standard';

import AboutPage from './page';

describe('the about route', () => {
  it('lists every leg of the gate', () => {
    render(<AboutPage />);

    expect(screen.getByRole('heading', { name: 'About' })).toBeTruthy();

    for (const { command } of GATE) {
      expect(screen.getAllByText(command)).not.toHaveLength(0);
    }
  });
});
