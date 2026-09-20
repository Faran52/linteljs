import { render, screen } from '@testing-library/react';

import Home from './page';

describe('Home', () => {
  it('renders the starting point', () => {
    render(<Home />);

    expect(screen.getByRole('heading').textContent).toContain('page.tsx');
  });
});
