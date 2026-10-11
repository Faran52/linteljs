import { render, screen } from '@testing-library/react';

import { GATE } from '@config/linteljs';

import About from './AboutRoute';

describe('About route', () => {
  it('renders the about page, gate and all', () => {
    render(<About />);

    for (const { command } of GATE) {
      const element = screen.getByText(command);
      expect(element).toBeTruthy();
    }
  });
});
