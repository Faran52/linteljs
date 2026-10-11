import { render, screen } from '@testing-library/react';

import Contact from './ContactRoute';

describe('Contact route', () => {
  it('renders the contact page', () => {
    render(<Contact />);

    const element = screen.getByRole('heading', { name: 'Contact' });
    expect(element).toBeTruthy();
  });
});
