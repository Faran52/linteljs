import { render, screen } from '@testing-library/react';

import { NAME } from '@config/linteljs';

import Home from './HomeRoute';

describe('Home route', () => {
  it('renders the home page under the project name', () => {
    render(<Home />);

    const element = screen.getByRole('heading', { name: NAME });
    expect(element).toBeTruthy();
  });
});
