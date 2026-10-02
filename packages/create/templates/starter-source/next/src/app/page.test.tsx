import { render, screen } from '@testing-library/react';

import { CHECK, NAME } from '@config/linteljs';

import HomePage from './page';

describe('the home route', () => {
  it('carries the project name as its heading', () => {
    render(<HomePage />);

    const element = screen.getByRole('heading', { name: NAME });
    expect(element).toBeTruthy();
  });

  it('names the one command that runs the whole gate', () => {
    render(<HomePage />);

    const element = screen.getByText(CHECK);
    expect(element).toBeTruthy();
  });
});
