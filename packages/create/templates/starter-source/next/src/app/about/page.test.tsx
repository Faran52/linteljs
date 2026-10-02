import { render, screen } from '@testing-library/react';

import { GATE } from '@config/linteljs';

import AboutPage from './page';

describe('the about route', () => {
  it('lists every leg of the gate', () => {
    render(<AboutPage />);

    const element = screen.getByRole('heading', { name: 'About' });
    expect(element).toBeTruthy();

    for (const { command } of GATE) {
      const elements = screen.getAllByText(command);
      expect(elements).not.toHaveLength(0);
    }
  });
});
