import { render, screen } from '@testing-library/react';

import { GATE } from '@config/linteljs';
import { STANDARD_PATHS } from '@config/standard';

import { AboutPage } from './AboutPage';

describe('AboutPage', () => {
  it('lists every leg of the gate', () => {
    render(<AboutPage />);

    for (const { command } of GATE) {
      const element = screen.getByText(command);
      expect(element).toBeTruthy();
    }
  });

  it('names where the standard lives, so nothing has to be hunted for', () => {
    render(<AboutPage />);

    for (const { path } of STANDARD_PATHS) {
      const element = screen.getByText(path);
      expect(element).toBeTruthy();
    }
  });
});
