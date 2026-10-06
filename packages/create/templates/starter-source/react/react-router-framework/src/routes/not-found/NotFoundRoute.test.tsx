import { render, screen } from '@testing-library/react';

import NotFound, { loader } from './NotFoundRoute';

describe('NotFound route', () => {
  it('answers every path no page claims with a 404', () => {
    const answer = loader();

    expect(answer.init?.status).toBe(404);
  });

  it('renders the not found page', () => {
    render(<NotFound />);

    const element = screen.getByRole('heading', { name: '404' });
    expect(element).toBeTruthy();
  });
});
