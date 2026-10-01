import { render, screen } from '@testing-library/react';

import { GATE } from '@config/linteljs';

import About from './about';

describe('About route', () => {
  it('renders the about page, gate and all', () => {
    render(<About />);

    for (const { command } of GATE) {
      expect(screen.getByText(command)).toBeTruthy();
    }
  });
});
