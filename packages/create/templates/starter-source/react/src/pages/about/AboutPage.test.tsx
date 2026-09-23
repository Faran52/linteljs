import { render, screen } from '@testing-library/react';

import { GATE, STANDARD_PATHS } from '../../config/standard';

import { AboutPage } from './AboutPage';

describe('AboutPage', () => {
  it('lists every leg of the gate', () => {
    render(<AboutPage />);

    for (const { command } of GATE) {
      expect(screen.getByText(command)).toBeTruthy();
    }
  });

  it('names where the standard lives, so nothing has to be hunted for', () => {
    render(<AboutPage />);

    for (const { path } of STANDARD_PATHS) {
      expect(screen.getByText(path)).toBeTruthy();
    }
  });
});
