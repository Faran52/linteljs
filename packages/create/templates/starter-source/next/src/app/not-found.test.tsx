import { render, screen } from '@testing-library/react';

import NotFound from './not-found';

describe('the not-found route', () => {
  it('shows the 404 page', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { name: '404' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Page not found');
  });
});
